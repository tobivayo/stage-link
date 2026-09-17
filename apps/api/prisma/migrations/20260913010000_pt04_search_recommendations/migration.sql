-- PT-04: musician search, recommendations and project member recruitment.
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL');
CREATE TYPE "MemberSearchStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED', 'CANCELLED');
CREATE TYPE "MemberSearchApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "RecommendationDecision" AS ENUM ('INTERESTED', 'DISMISSED');
CREATE TYPE "SearchModality" AS ENUM ('IN_PERSON', 'REMOTE', 'HYBRID');
CREATE TYPE "ContactTargetType" AS ENUM ('MUSICIAN', 'BAND_PROJECT');
CREATE TYPE "ContactIntentSource" AS ENUM ('SEARCH_RESULT', 'RECOMMENDATION', 'APPLICATION');
CREATE TYPE "ContactIntentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

ALTER TABLE "MusicianProfile" ADD COLUMN "experienceLevel" "ExperienceLevel";

CREATE TABLE "MemberSearch" (
  "id" UUID NOT NULL,
  "creatorUserId" UUID NOT NULL,
  "musicianProfileId" UUID,
  "bandProjectId" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requiredInstrument" TEXT NOT NULL,
  "genres" TEXT[] NOT NULL,
  "desiredExperience" "ExperienceLevel",
  "expectedAvailability" TEXT,
  "locationText" TEXT,
  "modality" "SearchModality" NOT NULL,
  "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
  "status" "MemberSearchStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MemberSearch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberSearch_single_context_check" CHECK (
    ("musicianProfileId" IS NOT NULL AND "bandProjectId" IS NULL) OR
    ("musicianProfileId" IS NULL AND "bandProjectId" IS NOT NULL)
  )
);

CREATE TABLE "MemberSearchApplication" (
  "id" UUID NOT NULL,
  "searchId" UUID NOT NULL,
  "musicianProfileId" UUID NOT NULL,
  "message" TEXT,
  "status" "MemberSearchApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MemberSearchApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MusicianRecommendationDecision" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "musicianProfileId" UUID NOT NULL,
  "bandProjectId" UUID,
  "contextKey" TEXT NOT NULL,
  "decision" "RecommendationDecision" NOT NULL,
  "compatibilityScore" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MusicianRecommendationDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MusicianRecommendationDecision_score_check" CHECK (
    "compatibilityScore" IS NULL OR "compatibilityScore" BETWEEN 0 AND 100
  )
);

CREATE TABLE "ContactIntent" (
  "id" UUID NOT NULL,
  "requesterUserId" UUID NOT NULL,
  "targetUserId" UUID NOT NULL,
  "targetProfileType" "ContactTargetType" NOT NULL,
  "targetProfileId" UUID NOT NULL,
  "sourceType" "ContactIntentSource" NOT NULL,
  "sourceEntityId" UUID,
  "message" TEXT,
  "status" "ContactIntentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactIntent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContactIntent_not_self_check" CHECK ("requesterUserId" <> "targetUserId")
);

CREATE INDEX "MusicianProfile_experienceLevel_idx" ON "MusicianProfile"("experienceLevel");
CREATE INDEX "MemberSearch_status_visibility_updatedAt_idx" ON "MemberSearch"("status", "visibility", "updatedAt");
CREATE INDEX "MemberSearch_creatorUserId_idx" ON "MemberSearch"("creatorUserId");
CREATE INDEX "MemberSearch_musicianProfileId_idx" ON "MemberSearch"("musicianProfileId");
CREATE INDEX "MemberSearch_bandProjectId_idx" ON "MemberSearch"("bandProjectId");
CREATE INDEX "MemberSearch_requiredInstrument_idx" ON "MemberSearch"("requiredInstrument");
CREATE INDEX "MemberSearch_genres_idx" ON "MemberSearch" USING GIN ("genres");
CREATE INDEX "MemberSearch_deletedAt_idx" ON "MemberSearch"("deletedAt");
CREATE UNIQUE INDEX "MemberSearchApplication_searchId_musicianProfileId_key" ON "MemberSearchApplication"("searchId", "musicianProfileId");
CREATE INDEX "MemberSearchApplication_musicianProfileId_status_idx" ON "MemberSearchApplication"("musicianProfileId", "status");
CREATE INDEX "MemberSearchApplication_searchId_status_idx" ON "MemberSearchApplication"("searchId", "status");
CREATE INDEX "MemberSearchApplication_deletedAt_idx" ON "MemberSearchApplication"("deletedAt");
CREATE UNIQUE INDEX "MusicianRecommendationDecision_userId_musicianProfileId_contextKey_key" ON "MusicianRecommendationDecision"("userId", "musicianProfileId", "contextKey");
CREATE INDEX "MusicianRecommendationDecision_userId_contextKey_decision_idx" ON "MusicianRecommendationDecision"("userId", "contextKey", "decision");
CREATE INDEX "MusicianRecommendationDecision_bandProjectId_idx" ON "MusicianRecommendationDecision"("bandProjectId");
CREATE INDEX "ContactIntent_requesterUserId_status_idx" ON "ContactIntent"("requesterUserId", "status");
CREATE INDEX "ContactIntent_targetUserId_status_idx" ON "ContactIntent"("targetUserId", "status");
CREATE INDEX "ContactIntent_targetProfileType_targetProfileId_idx" ON "ContactIntent"("targetProfileType", "targetProfileId");
CREATE INDEX "ContactIntent_sourceType_sourceEntityId_idx" ON "ContactIntent"("sourceType", "sourceEntityId");
CREATE UNIQUE INDEX "ContactIntent_one_pending_per_target_key" ON "ContactIntent"("requesterUserId", "targetProfileType", "targetProfileId") WHERE "status" = 'PENDING';

ALTER TABLE "MemberSearch" ADD CONSTRAINT "MemberSearch_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MemberSearch" ADD CONSTRAINT "MemberSearch_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberSearch" ADD CONSTRAINT "MemberSearch_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberSearchApplication" ADD CONSTRAINT "MemberSearchApplication_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "MemberSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberSearchApplication" ADD CONSTRAINT "MemberSearchApplication_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MusicianRecommendationDecision" ADD CONSTRAINT "MusicianRecommendationDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MusicianRecommendationDecision" ADD CONSTRAINT "MusicianRecommendationDecision_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MusicianRecommendationDecision" ADD CONSTRAINT "MusicianRecommendationDecision_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactIntent" ADD CONSTRAINT "ContactIntent_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactIntent" ADD CONSTRAINT "ContactIntent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
