-- PT-05: functional calls, applications, selection, confirmations and status history.

CREATE TYPE "CallConfirmationStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED');
CREATE TYPE "CallApplicantType" AS ENUM ('MUSICIAN', 'BAND_PROJECT');
CREATE TYPE "CallOrganizerType" AS ENUM ('USER', 'MUSICIAN', 'BAND_PROJECT', 'VENUE', 'PRODUCER');
CREATE TYPE "CallType" AS ENUM ('VENUE_DATE', 'FESTIVAL', 'SUPPORT_BAND', 'PRIVATE_EVENT', 'COLLABORATION', 'OTHER');

-- Replace the placeholder application states while retaining compatible existing rows.
CREATE TYPE "ApplicationStatus_new" AS ENUM (
  'PENDING',
  'REVIEWED',
  'PRESELECTED',
  'SELECTED',
  'REJECTED',
  'CANCELLED',
  'WITHDRAWN'
);
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application"
  ALTER COLUMN "status" TYPE "ApplicationStatus_new"
  USING (
    CASE "status"::text
      WHEN 'IN_REVIEW' THEN 'REVIEWED'
      WHEN 'ACCEPTED' THEN 'SELECTED'
      ELSE "status"::text
    END
  )::"ApplicationStatus_new";
DROP TYPE "ApplicationStatus";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "Call" RENAME COLUMN "requirements" TO "technicalRequirements";
ALTER TABLE "Call"
  ADD COLUMN "musicianProfileId" UUID,
  ADD COLUMN "organizerType" "CallOrganizerType",
  ADD COLUMN "type" "CallType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "eventName" TEXT,
  ADD COLUMN "proposedDateTime" TIMESTAMP(3),
  ADD COLUMN "locationText" TEXT,
  ADD COLUMN "genres" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "preferredStyles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "maxSelectedApplicants" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "offeredConditions" TEXT,
  ADD COLUMN "estimatedPayment" DECIMAL(12,2),
  ADD COLUMN "currency" CHAR(3),
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT;

UPDATE "Call"
SET
  "organizerType" = CASE
    WHEN "venueProfileId" IS NOT NULL THEN 'VENUE'::"CallOrganizerType"
    WHEN "bandProjectId" IS NOT NULL THEN 'BAND_PROJECT'::"CallOrganizerType"
    ELSE 'USER'::"CallOrganizerType"
  END,
  "proposedDateTime" = COALESCE("closesAt", "createdAt");

ALTER TABLE "Call"
  ALTER COLUMN "organizerType" SET NOT NULL,
  ALTER COLUMN "proposedDateTime" SET NOT NULL;

ALTER TABLE "Application"
  ADD COLUMN "applicantType" "CallApplicantType",
  ADD COLUMN "technicalNeeds" TEXT,
  ADD COLUMN "requestedPayment" DECIMAL(12,2),
  ADD COLUMN "currency" CHAR(3),
  ADD COLUMN "preselectedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "withdrawnAt" TIMESTAMP(3);

UPDATE "Application"
SET "applicantType" = CASE
  WHEN "bandProjectId" IS NOT NULL THEN 'BAND_PROJECT'::"CallApplicantType"
  ELSE 'MUSICIAN'::"CallApplicantType"
END;
ALTER TABLE "Application" ALTER COLUMN "applicantType" SET NOT NULL;

CREATE TABLE "CallConfirmation" (
  "id" UUID NOT NULL,
  "callId" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "confirmerUserId" UUID NOT NULL,
  "status" "CallConfirmationStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "confirmedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "declineReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CallConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallStatusHistory" (
  "id" UUID NOT NULL,
  "callId" UUID NOT NULL,
  "previousStatus" "CallStatus",
  "newStatus" "CallStatus" NOT NULL,
  "changedByUserId" UUID NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CallStatusHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Call"
  ADD CONSTRAINT "Call_musicianProfileId_fkey"
  FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallConfirmation"
  ADD CONSTRAINT "CallConfirmation_callId_fkey"
  FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallConfirmation"
  ADD CONSTRAINT "CallConfirmation_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallConfirmation"
  ADD CONSTRAINT "CallConfirmation_confirmerUserId_fkey"
  FOREIGN KEY ("confirmerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CallStatusHistory"
  ADD CONSTRAINT "CallStatusHistory_callId_fkey"
  FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallStatusHistory"
  ADD CONSTRAINT "CallStatusHistory_changedByUserId_fkey"
  FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Call"
  ADD CONSTRAINT "Call_maxSelectedApplicants_check" CHECK ("maxSelectedApplicants" BETWEEN 1 AND 100),
  ADD CONSTRAINT "Call_estimatedPayment_check" CHECK ("estimatedPayment" IS NULL OR "estimatedPayment" >= 0),
  ADD CONSTRAINT "Call_organizer_context_check" CHECK (
    ("organizerType" IN ('USER', 'PRODUCER') AND "musicianProfileId" IS NULL AND "bandProjectId" IS NULL AND "venueProfileId" IS NULL)
    OR ("organizerType" = 'MUSICIAN' AND "musicianProfileId" IS NOT NULL AND "bandProjectId" IS NULL AND "venueProfileId" IS NULL)
    OR ("organizerType" = 'BAND_PROJECT' AND "musicianProfileId" IS NULL AND "bandProjectId" IS NOT NULL AND "venueProfileId" IS NULL)
    OR ("organizerType" = 'VENUE' AND "musicianProfileId" IS NULL AND "bandProjectId" IS NULL AND "venueProfileId" IS NOT NULL)
  );

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_applicant_context_check" CHECK (
    ("applicantType" = 'MUSICIAN' AND "musicianProfileId" IS NOT NULL AND "bandProjectId" IS NULL)
    OR ("applicantType" = 'BAND_PROJECT' AND "musicianProfileId" IS NULL AND "bandProjectId" IS NOT NULL)
  ),
  ADD CONSTRAINT "Application_requestedPayment_check" CHECK ("requestedPayment" IS NULL OR "requestedPayment" >= 0);

CREATE UNIQUE INDEX "Application_callId_musicianProfileId_key" ON "Application"("callId", "musicianProfileId");
CREATE UNIQUE INDEX "Application_callId_bandProjectId_key" ON "Application"("callId", "bandProjectId");
CREATE UNIQUE INDEX "CallConfirmation_applicationId_key" ON "CallConfirmation"("applicationId");
CREATE INDEX "Call_status_visibility_proposedDateTime_idx" ON "Call"("status", "visibility", "proposedDateTime");
CREATE INDEX "Call_type_status_idx" ON "Call"("type", "status");
CREATE INDEX "Call_musicianProfileId_idx" ON "Call"("musicianProfileId");
CREATE INDEX "CallConfirmation_callId_status_idx" ON "CallConfirmation"("callId", "status");
CREATE INDEX "CallConfirmation_confirmerUserId_status_idx" ON "CallConfirmation"("confirmerUserId", "status");
CREATE INDEX "CallStatusHistory_callId_createdAt_idx" ON "CallStatusHistory"("callId", "createdAt");
CREATE INDEX "CallStatusHistory_changedByUserId_idx" ON "CallStatusHistory"("changedByUserId");

DROP INDEX IF EXISTS "Call_status_closesAt_idx";

