-- PT-03: profiles, bands/projects, members and portfolio.
ALTER TYPE "ProfileStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "ProfileStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "BandStatus" RENAME VALUE 'ON_HOLD' TO 'INACTIVE';
ALTER TYPE "InvitationStatus" RENAME TO "BandInvitationStatus";
ALTER TYPE "BandInvitationStatus" RENAME VALUE 'DECLINED' TO 'REJECTED';

CREATE TYPE "VenueValidationStatus" AS ENUM ('PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "PortfolioItemType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'LINK', 'DOCUMENT');

ALTER TYPE "BandMemberRole" RENAME TO "BandMemberRole_old";
CREATE TYPE "BandMemberRole" AS ENUM ('ADMIN', 'MEMBER', 'REPRESENTATIVE');

ALTER TABLE "BandMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "BandInvitation" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "BandMember"
  ALTER COLUMN "role" TYPE "BandMemberRole"
  USING (CASE WHEN "role"::text = 'OWNER' THEN 'ADMIN' ELSE "role"::text END)::"BandMemberRole";
ALTER TABLE "BandInvitation"
  ALTER COLUMN "role" TYPE "BandMemberRole"
  USING (CASE WHEN "role"::text = 'OWNER' THEN 'ADMIN' ELSE "role"::text END)::"BandMemberRole";
DROP TYPE "BandMemberRole_old";
ALTER TABLE "BandMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
ALTER TABLE "BandInvitation" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

ALTER TABLE "MusicianProfile"
  ADD COLUMN "influences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "experience" TEXT,
  ADD COLUMN "previousProjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "availableForProjects" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isSoloProject" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "locationText" TEXT,
  ADD COLUMN "photoUrl" TEXT,
  ADD COLUMN "locationVisibility" "Visibility" NOT NULL DEFAULT 'REGISTERED_ONLY';

ALTER TABLE "VenueProfile"
  ADD COLUMN "ownerUserId" UUID,
  ADD COLUMN "genres" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "availability" JSONB,
  ADD COLUMN "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "contactName" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "contactVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "validationStatus" "VenueValidationStatus" NOT NULL DEFAULT 'PENDING_VALIDATION';

UPDATE "VenueProfile" venue
SET "ownerUserId" = (
  SELECT member."userId"
  FROM "VenueMember" member
  WHERE member."venueId" = venue."id"
  ORDER BY CASE WHEN member."role" = 'OWNER' THEN 0 ELSE 1 END, member."createdAt"
  LIMIT 1
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "VenueProfile" WHERE "ownerUserId" IS NULL) THEN
    RAISE EXCEPTION 'PT-03 migration requires every existing venue to have a VenueMember owner';
  END IF;
END $$;

ALTER TABLE "VenueProfile" ALTER COLUMN "ownerUserId" SET NOT NULL;

ALTER TABLE "ProviderProfile"
  ADD COLUMN "ownerUserId" UUID,
  ADD COLUMN "coverageArea" TEXT,
  ADD COLUMN "contactName" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "contactVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

UPDATE "ProviderProfile" provider
SET "ownerUserId" = (
  SELECT member."userId"
  FROM "ProviderMember" member
  WHERE member."providerId" = provider."id"
  ORDER BY CASE WHEN member."role" = 'OWNER' THEN 0 ELSE 1 END, member."createdAt"
  LIMIT 1
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ProviderProfile" WHERE "ownerUserId" IS NULL) THEN
    RAISE EXCEPTION 'PT-03 migration requires every existing provider to have a ProviderMember owner';
  END IF;
END $$;

ALTER TABLE "ProviderProfile" ALTER COLUMN "ownerUserId" SET NOT NULL;

ALTER TABLE "BandProject"
  ADD COLUMN "influences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "locationText" TEXT,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "locationVisibility" "Visibility" NOT NULL DEFAULT 'REGISTERED_ONLY';

ALTER TABLE "BandInvitation"
  ALTER COLUMN "invitedUserId" DROP NOT NULL,
  ADD COLUMN "invitedEmail" TEXT;

CREATE TABLE "ProfileLink" (
  "id" UUID NOT NULL,
  "musicianProfileId" UUID,
  "venueProfileId" UUID,
  "providerProfileId" UUID,
  "bandProjectId" UUID,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfileLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioItem" (
  "id" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "musicianProfileId" UUID,
  "bandProjectId" UUID,
  "type" "PortfolioItemType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL,
  "storageKey" TEXT,
  "mimeType" TEXT,
  "experienceRef" TEXT,
  "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioItemShare" (
  "id" UUID NOT NULL,
  "portfolioItemId" UUID NOT NULL,
  "musicianProfileId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioItemShare_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VenueProfile_ownerUserId_idx" ON "VenueProfile"("ownerUserId");
CREATE INDEX "ProviderProfile_ownerUserId_idx" ON "ProviderProfile"("ownerUserId");
CREATE INDEX "BandInvitation_invitedEmail_status_idx" ON "BandInvitation"("invitedEmail", "status");
CREATE INDEX "ProfileLink_musicianProfileId_idx" ON "ProfileLink"("musicianProfileId");
CREATE INDEX "ProfileLink_venueProfileId_idx" ON "ProfileLink"("venueProfileId");
CREATE INDEX "ProfileLink_providerProfileId_idx" ON "ProfileLink"("providerProfileId");
CREATE INDEX "ProfileLink_bandProjectId_idx" ON "ProfileLink"("bandProjectId");
CREATE INDEX "PortfolioItem_musicianProfileId_sortOrder_idx" ON "PortfolioItem"("musicianProfileId", "sortOrder");
CREATE INDEX "PortfolioItem_bandProjectId_sortOrder_idx" ON "PortfolioItem"("bandProjectId", "sortOrder");
CREATE INDEX "PortfolioItem_visibility_deletedAt_idx" ON "PortfolioItem"("visibility", "deletedAt");
CREATE UNIQUE INDEX "PortfolioItemShare_portfolioItemId_musicianProfileId_key" ON "PortfolioItemShare"("portfolioItemId", "musicianProfileId");
CREATE INDEX "PortfolioItemShare_musicianProfileId_idx" ON "PortfolioItemShare"("musicianProfileId");
CREATE UNIQUE INDEX "BandInvitation_pending_email_key" ON "BandInvitation"("bandId", lower("invitedEmail")) WHERE "invitedEmail" IS NOT NULL AND "status" = 'PENDING';

ALTER TABLE "VenueProfile" ADD CONSTRAINT "VenueProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_venueProfileId_fkey" FOREIGN KEY ("venueProfileId") REFERENCES "VenueProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioItemShare" ADD CONSTRAINT "PortfolioItemShare_portfolioItemId_fkey" FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioItemShare" ADD CONSTRAINT "PortfolioItemShare_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioItemShare" ADD CONSTRAINT "PortfolioItemShare_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_single_owner_check" CHECK (num_nonnulls("musicianProfileId", "venueProfileId", "providerProfileId", "bandProjectId") = 1);
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_single_owner_check" CHECK (num_nonnulls("musicianProfileId", "bandProjectId") = 1);
ALTER TABLE "BandInvitation" ADD CONSTRAINT "BandInvitation_single_recipient_check" CHECK (num_nonnulls("invitedUserId", "invitedEmail") = 1);
