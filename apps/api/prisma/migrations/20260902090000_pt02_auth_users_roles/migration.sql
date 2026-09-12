-- PT-02: users, authentication, roles and preferences.
CREATE TYPE "UserRoleStatus" AS ENUM ('ACTIVE', 'PENDING_PROFILE', 'INACTIVE');

ALTER TYPE "AuditAction" ADD VALUE 'REGISTER';
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_ACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_DEACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'PREFERENCES_UPDATE';

ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "locationText" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- Preserve any PT-01 development rows while replacing displayName.
UPDATE "User"
SET
  "firstName" = COALESCE(NULLIF(split_part(trim("displayName"), ' ', 1), ''), 'Usuario'),
  "lastName" = CASE
    WHEN position(' ' IN trim("displayName")) > 0
      THEN trim(substring(trim("displayName") FROM position(' ' IN trim("displayName")) + 1))
    ELSE '-'
  END;

ALTER TABLE "User"
  ALTER COLUMN "firstName" SET NOT NULL,
  ALTER COLUMN "lastName" SET NOT NULL,
  DROP COLUMN "displayName";

ALTER TABLE "UserRole"
  DROP CONSTRAINT "UserRole_pkey",
  ADD COLUMN "id" UUID,
  ADD COLUMN "status" "UserRoleStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deactivatedAt" TIMESTAMP(3);

UPDATE "UserRole" SET "id" = gen_random_uuid();

ALTER TABLE "UserRole"
  ALTER COLUMN "id" SET NOT NULL,
  ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE INDEX "UserRole_userId_status_idx" ON "UserRole"("userId", "status");

ALTER TABLE "UserPreferences" RENAME COLUMN "emailNotifications" TO "emailNotificationsEnabled";
ALTER TABLE "UserPreferences" RENAME COLUMN "pushNotifications" TO "pushNotificationsEnabled";

ALTER TABLE "UserPreferences"
  ADD COLUMN "internalNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "defaultVisibility" "Visibility" NOT NULL DEFAULT 'REGISTERED_ONLY',
  ADD COLUMN "contactAvailability" BOOLEAN NOT NULL DEFAULT true,
  DROP COLUMN "marketingEmails";
