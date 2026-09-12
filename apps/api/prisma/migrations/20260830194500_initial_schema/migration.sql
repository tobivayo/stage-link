-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'REGISTERED_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BandStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'DISBANDED');

-- CreateEnum
CREATE TYPE "BandMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "BandMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventParticipantRole" AS ENUM ('ORGANIZER', 'PERFORMER', 'VENUE', 'PROVIDER', 'CREW', 'GUEST');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('INVITED', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'CLOSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RehearsalStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RehearsalParticipantStatus" AS ENUM ('INVITED', 'CONFIRMED', 'DECLINED', 'ATTENDED', 'ABSENT');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'BAND', 'EVENT', 'CALL', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MarketplacePostType" AS ENUM ('SALE', 'RENTAL', 'SERVICE');

-- CreateEnum
CREATE TYPE "MarketplaceStatus" AS ENUM ('PUBLISHED', 'RESERVED', 'SOLD', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MarketplaceOperationType" AS ENUM ('PURCHASE', 'RENTAL', 'SERVICE_BOOKING');

-- CreateEnum
CREATE TYPE "MarketplaceOperationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SPAM', 'ABUSE', 'FRAUD', 'INAPPROPRIATE_CONTENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es-AR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicianProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stageName" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "countryCode" CHAR(2),
    "instruments" TEXT[],
    "genres" TEXT[],
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MusicianProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueProfile" (
    "id" UUID NOT NULL,
    "locationId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "addressVisibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VenueProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueMember" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" UUID NOT NULL,
    "locationId" UUID,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "serviceTags" TEXT[],
    "addressVisibility" "Visibility" NOT NULL DEFAULT 'REGISTERED_ONLY',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderMember" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "countryCode" CHAR(2) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandProject" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "genres" TEXT[],
    "city" TEXT,
    "countryCode" CHAR(2),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "BandStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BandProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandMember" (
    "id" UUID NOT NULL,
    "bandId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "BandMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "BandMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "instrument" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BandMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandInvitation" (
    "id" UUID NOT NULL,
    "bandId" UUID NOT NULL,
    "invitedUserId" UUID NOT NULL,
    "invitedById" UUID NOT NULL,
    "role" "BandMemberRole" NOT NULL DEFAULT 'MEMBER',
    "instrument" TEXT,
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BandInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "organizerUserId" UUID NOT NULL,
    "venueId" UUID,
    "locationId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "addressVisibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID,
    "bandProjectId" UUID,
    "venueProfileId" UUID,
    "providerProfileId" UUID,
    "sourceApplicationId" UUID,
    "role" "EventParticipantRole" NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'INVITED',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" UUID NOT NULL,
    "creatorUserId" UUID NOT NULL,
    "bandProjectId" UUID,
    "venueProfileId" UUID,
    "eventId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "closesAt" TIMESTAMP(3),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "CallStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "submittedByUserId" UUID NOT NULL,
    "musicianProfileId" UUID,
    "bandProjectId" UUID,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rehearsal" (
    "id" UUID NOT NULL,
    "organizerUserId" UUID NOT NULL,
    "bandProjectId" UUID,
    "venueProfileId" UUID,
    "locationId" UUID,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "addressVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "RehearsalStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Rehearsal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RehearsalParticipant" (
    "id" UUID NOT NULL,
    "rehearsalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "RehearsalParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RehearsalParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "bandProjectId" UUID,
    "eventId" UUID,
    "callId" UUID,
    "marketplacePostId" UUID,
    "type" "ConversationType" NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lastReadMessageId" UUID,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "replyToMessageId" UUID,
    "body" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessageAttachment" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePost" (
    "id" UUID NOT NULL,
    "sellerUserId" UUID NOT NULL,
    "locationId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MarketplacePostType" NOT NULL,
    "status" "MarketplaceStatus" NOT NULL DEFAULT 'PUBLISHED',
    "price" DECIMAL(12,2),
    "currency" CHAR(3),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MarketplacePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOperation" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "buyerUserId" UUID NOT NULL,
    "sellerUserId" UUID NOT NULL,
    "type" "MarketplaceOperationType" NOT NULL,
    "status" "MarketplaceOperationStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2),
    "currency" CHAR(3),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "musicianProfileId" UUID,
    "bandProjectId" UUID,
    "venueProfileId" UUID,
    "providerProfileId" UUID,
    "applicationId" UUID,
    "eventParticipantId" UUID,
    "rehearsalParticipantId" UUID,
    "marketplaceOperationId" UUID,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterUserId" UUID NOT NULL,
    "assignedToUserId" UUID,
    "reportedUserId" UUID,
    "chatMessageId" UUID,
    "marketplacePostId" UUID,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicianProfile_userId_key" ON "MusicianProfile"("userId");

-- CreateIndex
CREATE INDEX "MusicianProfile_visibility_status_idx" ON "MusicianProfile"("visibility", "status");

-- CreateIndex
CREATE INDEX "MusicianProfile_deletedAt_idx" ON "MusicianProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "VenueProfile_locationId_idx" ON "VenueProfile"("locationId");

-- CreateIndex
CREATE INDEX "VenueProfile_visibility_status_idx" ON "VenueProfile"("visibility", "status");

-- CreateIndex
CREATE INDEX "VenueProfile_deletedAt_idx" ON "VenueProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "VenueMember_userId_idx" ON "VenueMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueMember_venueId_userId_key" ON "VenueMember"("venueId", "userId");

-- CreateIndex
CREATE INDEX "ProviderProfile_locationId_idx" ON "ProviderProfile"("locationId");

-- CreateIndex
CREATE INDEX "ProviderProfile_visibility_status_idx" ON "ProviderProfile"("visibility", "status");

-- CreateIndex
CREATE INDEX "ProviderProfile_deletedAt_idx" ON "ProviderProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "ProviderMember_userId_idx" ON "ProviderMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderMember_providerId_userId_key" ON "ProviderMember"("providerId", "userId");

-- CreateIndex
CREATE INDEX "Location_city_countryCode_idx" ON "Location"("city", "countryCode");

-- CreateIndex
CREATE INDEX "Location_deletedAt_idx" ON "Location"("deletedAt");

-- CreateIndex
CREATE INDEX "BandProject_ownerUserId_idx" ON "BandProject"("ownerUserId");

-- CreateIndex
CREATE INDEX "BandProject_visibility_status_idx" ON "BandProject"("visibility", "status");

-- CreateIndex
CREATE INDEX "BandProject_deletedAt_idx" ON "BandProject"("deletedAt");

-- CreateIndex
CREATE INDEX "BandMember_userId_status_idx" ON "BandMember"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BandMember_bandId_userId_key" ON "BandMember"("bandId", "userId");

-- CreateIndex
CREATE INDEX "BandInvitation_bandId_status_idx" ON "BandInvitation"("bandId", "status");

-- CreateIndex
CREATE INDEX "BandInvitation_invitedUserId_status_idx" ON "BandInvitation"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "Event_startsAt_status_idx" ON "Event"("startsAt", "status");

-- CreateIndex
CREATE INDEX "Event_organizerUserId_idx" ON "Event"("organizerUserId");

-- CreateIndex
CREATE INDEX "Event_venueId_idx" ON "Event"("venueId");

-- CreateIndex
CREATE INDEX "Event_locationId_idx" ON "Event"("locationId");

-- CreateIndex
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_sourceApplicationId_key" ON "EventParticipant"("sourceApplicationId");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_status_idx" ON "EventParticipant"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventParticipant_userId_idx" ON "EventParticipant"("userId");

-- CreateIndex
CREATE INDEX "EventParticipant_bandProjectId_idx" ON "EventParticipant"("bandProjectId");

-- CreateIndex
CREATE INDEX "EventParticipant_venueProfileId_idx" ON "EventParticipant"("venueProfileId");

-- CreateIndex
CREATE INDEX "EventParticipant_providerProfileId_idx" ON "EventParticipant"("providerProfileId");

-- CreateIndex
CREATE INDEX "Call_status_closesAt_idx" ON "Call"("status", "closesAt");

-- CreateIndex
CREATE INDEX "Call_creatorUserId_idx" ON "Call"("creatorUserId");

-- CreateIndex
CREATE INDEX "Call_bandProjectId_idx" ON "Call"("bandProjectId");

-- CreateIndex
CREATE INDEX "Call_venueProfileId_idx" ON "Call"("venueProfileId");

-- CreateIndex
CREATE INDEX "Call_eventId_idx" ON "Call"("eventId");

-- CreateIndex
CREATE INDEX "Call_deletedAt_idx" ON "Call"("deletedAt");

-- CreateIndex
CREATE INDEX "Application_callId_status_idx" ON "Application"("callId", "status");

-- CreateIndex
CREATE INDEX "Application_submittedByUserId_idx" ON "Application"("submittedByUserId");

-- CreateIndex
CREATE INDEX "Application_musicianProfileId_idx" ON "Application"("musicianProfileId");

-- CreateIndex
CREATE INDEX "Application_bandProjectId_idx" ON "Application"("bandProjectId");

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateIndex
CREATE INDEX "Rehearsal_startsAt_status_idx" ON "Rehearsal"("startsAt", "status");

-- CreateIndex
CREATE INDEX "Rehearsal_organizerUserId_idx" ON "Rehearsal"("organizerUserId");

-- CreateIndex
CREATE INDEX "Rehearsal_bandProjectId_idx" ON "Rehearsal"("bandProjectId");

-- CreateIndex
CREATE INDEX "Rehearsal_venueProfileId_idx" ON "Rehearsal"("venueProfileId");

-- CreateIndex
CREATE INDEX "Rehearsal_locationId_idx" ON "Rehearsal"("locationId");

-- CreateIndex
CREATE INDEX "Rehearsal_deletedAt_idx" ON "Rehearsal"("deletedAt");

-- CreateIndex
CREATE INDEX "RehearsalParticipant_userId_status_idx" ON "RehearsalParticipant"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RehearsalParticipant_rehearsalId_userId_key" ON "RehearsalParticipant"("rehearsalId", "userId");

-- CreateIndex
CREATE INDEX "ChatConversation_createdByUserId_idx" ON "ChatConversation"("createdByUserId");

-- CreateIndex
CREATE INDEX "ChatConversation_bandProjectId_idx" ON "ChatConversation"("bandProjectId");

-- CreateIndex
CREATE INDEX "ChatConversation_eventId_idx" ON "ChatConversation"("eventId");

-- CreateIndex
CREATE INDEX "ChatConversation_callId_idx" ON "ChatConversation"("callId");

-- CreateIndex
CREATE INDEX "ChatConversation_marketplacePostId_idx" ON "ChatConversation"("marketplacePostId");

-- CreateIndex
CREATE INDEX "ChatConversation_type_status_idx" ON "ChatConversation"("type", "status");

-- CreateIndex
CREATE INDEX "ChatConversation_deletedAt_idx" ON "ChatConversation"("deletedAt");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE INDEX "ChatParticipant_lastReadMessageId_idx" ON "ChatParticipant"("lastReadMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_conversationId_userId_key" ON "ChatParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_sentAt_idx" ON "ChatMessage"("conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "ChatMessage_senderUserId_idx" ON "ChatMessage"("senderUserId");

-- CreateIndex
CREATE INDEX "ChatMessage_replyToMessageId_idx" ON "ChatMessage"("replyToMessageId");

-- CreateIndex
CREATE INDEX "ChatMessageAttachment_messageId_idx" ON "ChatMessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MarketplacePost_status_type_idx" ON "MarketplacePost"("status", "type");

-- CreateIndex
CREATE INDEX "MarketplacePost_sellerUserId_idx" ON "MarketplacePost"("sellerUserId");

-- CreateIndex
CREATE INDEX "MarketplacePost_locationId_idx" ON "MarketplacePost"("locationId");

-- CreateIndex
CREATE INDEX "MarketplacePost_deletedAt_idx" ON "MarketplacePost"("deletedAt");

-- CreateIndex
CREATE INDEX "MarketplaceOperation_postId_status_idx" ON "MarketplaceOperation"("postId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceOperation_buyerUserId_idx" ON "MarketplaceOperation"("buyerUserId");

-- CreateIndex
CREATE INDEX "MarketplaceOperation_sellerUserId_idx" ON "MarketplaceOperation"("sellerUserId");

-- CreateIndex
CREATE INDEX "Rating_authorUserId_idx" ON "Rating"("authorUserId");

-- CreateIndex
CREATE INDEX "Rating_musicianProfileId_idx" ON "Rating"("musicianProfileId");

-- CreateIndex
CREATE INDEX "Rating_bandProjectId_idx" ON "Rating"("bandProjectId");

-- CreateIndex
CREATE INDEX "Rating_venueProfileId_idx" ON "Rating"("venueProfileId");

-- CreateIndex
CREATE INDEX "Rating_providerProfileId_idx" ON "Rating"("providerProfileId");

-- CreateIndex
CREATE INDEX "Rating_applicationId_idx" ON "Rating"("applicationId");

-- CreateIndex
CREATE INDEX "Rating_eventParticipantId_idx" ON "Rating"("eventParticipantId");

-- CreateIndex
CREATE INDEX "Rating_rehearsalParticipantId_idx" ON "Rating"("rehearsalParticipantId");

-- CreateIndex
CREATE INDEX "Rating_marketplaceOperationId_idx" ON "Rating"("marketplaceOperationId");

-- CreateIndex
CREATE INDEX "Rating_deletedAt_idx" ON "Rating"("deletedAt");

-- CreateIndex
CREATE INDEX "Report_status_type_idx" ON "Report"("status", "type");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_idx" ON "Report"("reporterUserId");

-- CreateIndex
CREATE INDEX "Report_assignedToUserId_idx" ON "Report"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "Report_chatMessageId_idx" ON "Report"("chatMessageId");

-- CreateIndex
CREATE INDEX "Report_marketplacePostId_idx" ON "Report"("marketplacePostId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicianProfile" ADD CONSTRAINT "MusicianProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueProfile" ADD CONSTRAINT "VenueProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueMember" ADD CONSTRAINT "VenueMember_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueMember" ADD CONSTRAINT "VenueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderMember" ADD CONSTRAINT "ProviderMember_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderMember" ADD CONSTRAINT "ProviderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandProject" ADD CONSTRAINT "BandProject_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandMember" ADD CONSTRAINT "BandMember_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandMember" ADD CONSTRAINT "BandMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandInvitation" ADD CONSTRAINT "BandInvitation_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandInvitation" ADD CONSTRAINT "BandInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandInvitation" ADD CONSTRAINT "BandInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerUserId_fkey" FOREIGN KEY ("organizerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_venueProfileId_fkey" FOREIGN KEY ("venueProfileId") REFERENCES "VenueProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_sourceApplicationId_fkey" FOREIGN KEY ("sourceApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_venueProfileId_fkey" FOREIGN KEY ("venueProfileId") REFERENCES "VenueProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_organizerUserId_fkey" FOREIGN KEY ("organizerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_venueProfileId_fkey" FOREIGN KEY ("venueProfileId") REFERENCES "VenueProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalParticipant" ADD CONSTRAINT "RehearsalParticipant_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalParticipant" ADD CONSTRAINT "RehearsalParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_marketplacePostId_fkey" FOREIGN KEY ("marketplacePostId") REFERENCES "MarketplacePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageAttachment" ADD CONSTRAINT "ChatMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "MarketplacePost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_bandProjectId_fkey" FOREIGN KEY ("bandProjectId") REFERENCES "BandProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_venueProfileId_fkey" FOREIGN KEY ("venueProfileId") REFERENCES "VenueProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_eventParticipantId_fkey" FOREIGN KEY ("eventParticipantId") REFERENCES "EventParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rehearsalParticipantId_fkey" FOREIGN KEY ("rehearsalParticipantId") REFERENCES "RehearsalParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_marketplaceOperationId_fkey" FOREIGN KEY ("marketplaceOperationId") REFERENCES "MarketplaceOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_marketplacePostId_fkey" FOREIGN KEY ("marketplacePostId") REFERENCES "MarketplacePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain integrity constraints not expressible in Prisma Schema Language
ALTER TABLE "Location" ADD CONSTRAINT "Location_coordinates_pair_check" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));
ALTER TABLE "Location" ADD CONSTRAINT "Location_latitude_check" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);
ALTER TABLE "Location" ADD CONSTRAINT "Location_longitude_check" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
ALTER TABLE "BandInvitation" ADD CONSTRAINT "BandInvitation_distinct_users_check" CHECK ("invitedUserId" <> "invitedById");
ALTER TABLE "Event" ADD CONSTRAINT "Event_date_range_check" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_single_subject_check" CHECK (num_nonnulls("userId", "bandProjectId", "venueProfileId", "providerProfileId") = 1);
ALTER TABLE "Call" ADD CONSTRAINT "Call_single_publisher_context_check" CHECK (num_nonnulls("bandProjectId", "venueProfileId") <= 1);
ALTER TABLE "Application" ADD CONSTRAINT "Application_single_applicant_check" CHECK (num_nonnulls("musicianProfileId", "bandProjectId") = 1);
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_date_range_check" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_context_check" CHECK (
  ("type" IN ('DIRECT', 'GROUP') AND num_nonnulls("bandProjectId", "eventId", "callId", "marketplacePostId") = 0) OR
  ("type" = 'BAND' AND "bandProjectId" IS NOT NULL AND num_nonnulls("eventId", "callId", "marketplacePostId") = 0) OR
  ("type" = 'EVENT' AND "eventId" IS NOT NULL AND num_nonnulls("bandProjectId", "callId", "marketplacePostId") = 0) OR
  ("type" = 'CALL' AND "callId" IS NOT NULL AND num_nonnulls("bandProjectId", "eventId", "marketplacePostId") = 0) OR
  ("type" = 'MARKETPLACE' AND "marketplacePostId" IS NOT NULL AND num_nonnulls("bandProjectId", "eventId", "callId") = 0)
);
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_price_check" CHECK ("price" IS NULL OR "price" >= 0);
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_price_currency_check" CHECK (("price" IS NULL) = ("currency" IS NULL));
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_amount_check" CHECK ("amount" IS NULL OR "amount" >= 0);
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_amount_currency_check" CHECK (("amount" IS NULL) = ("currency" IS NULL));
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_date_range_check" CHECK ("endsAt" IS NULL OR "startsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "MarketplaceOperation" ADD CONSTRAINT "MarketplaceOperation_distinct_users_check" CHECK ("buyerUserId" <> "sellerUserId");
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_score_check" CHECK ("score" BETWEEN 1 AND 10);
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_single_target_check" CHECK (num_nonnulls("musicianProfileId", "bandProjectId", "venueProfileId", "providerProfileId") = 1);
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_single_experience_check" CHECK (num_nonnulls("applicationId", "eventParticipantId", "rehearsalParticipantId", "marketplaceOperationId") = 1);
ALTER TABLE "Report" ADD CONSTRAINT "Report_single_target_check" CHECK (num_nonnulls("reportedUserId", "chatMessageId", "marketplacePostId") = 1);

-- Partial uniqueness for polymorphic relations and soft-deleted records
CREATE UNIQUE INDEX "Application_active_musician_per_call_key" ON "Application"("callId", "musicianProfileId") WHERE "musicianProfileId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "Application_active_band_per_call_key" ON "Application"("callId", "bandProjectId") WHERE "bandProjectId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "EventParticipant_user_per_event_key" ON "EventParticipant"("eventId", "userId") WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX "EventParticipant_band_per_event_key" ON "EventParticipant"("eventId", "bandProjectId") WHERE "bandProjectId" IS NOT NULL;
CREATE UNIQUE INDEX "EventParticipant_venue_per_event_key" ON "EventParticipant"("eventId", "venueProfileId") WHERE "venueProfileId" IS NOT NULL;
CREATE UNIQUE INDEX "EventParticipant_provider_per_event_key" ON "EventParticipant"("eventId", "providerProfileId") WHERE "providerProfileId" IS NOT NULL;
CREATE UNIQUE INDEX "BandInvitation_pending_recipient_key" ON "BandInvitation"("bandId", "invitedUserId") WHERE "status" = 'PENDING';
