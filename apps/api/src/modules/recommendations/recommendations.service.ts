import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import {
  calculateCompatibility,
  type CompatibilityTarget,
} from '../../common/search/compatibility-score';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuditAction, RecommendationDecision, Visibility } from '../../generated/prisma/enums';
import { RecommendationDecisionDto, RecommendationQueryDto } from './dto/recommendations.dto';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMusicians(userId: string, input: RecommendationQueryDto) {
    const context = await this.getContext(userId, input.bandProjectId);
    const dismissed = await this.prisma.musicianRecommendationDecision.findMany({
      where: { userId, contextKey: context.contextKey, decision: RecommendationDecision.DISMISSED },
      select: { musicianProfileId: true },
    });
    const excludedProfileIds = dismissed.map((item) => item.musicianProfileId);
    const candidates = await this.prisma.musicianProfile.findMany({
      where: {
        id: { notIn: excludedProfileIds },
        userId: { notIn: context.excludedUserIds },
        status: 'ACTIVE',
        deletedAt: null,
        visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
        user: { status: 'ACTIVE', deletedAt: null },
      },
      take: 200,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const ranked = candidates
      .map((profile) => ({
        profile,
        ...calculateCompatibility(context.target, {
          ...profile,
          locationText:
            profile.locationVisibility === Visibility.PRIVATE ? undefined : profile.locationText,
        }),
      }))
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.profile.updatedAt.getTime() - left.profile.updatedAt.getTime(),
      )
      .slice(0, input.limit)
      .map(({ profile, score, reasons }) => ({
        id: profile.id,
        displayName: profile.stageName || `${profile.user.firstName} ${profile.user.lastName}`,
        bio: profile.bio,
        instruments: profile.instruments,
        genres: profile.genres,
        experienceLevel: profile.experienceLevel,
        availableForProjects: profile.availableForProjects,
        photoUrl: profile.photoUrl,
        locationText:
          profile.locationVisibility === Visibility.PRIVATE ? undefined : profile.locationText,
        compatibilityScore: score,
        compatibilityReasons: reasons,
      }));
    return {
      items: ranked,
      context: context.contextKey,
      candidateLimitReached: candidates.length === 200,
    };
  }

  async decide(userId: string, musicianProfileId: string, input: RecommendationDecisionDto) {
    const context = await this.getContext(userId, input.bandProjectId);
    const targetProfile = await this.prisma.musicianProfile.findFirst({
      where: {
        id: musicianProfileId,
        userId: { notIn: context.excludedUserIds },
        status: 'ACTIVE',
        deletedAt: null,
        visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
        user: { status: 'ACTIVE', deletedAt: null },
      },
    });
    if (!targetProfile) throw new NotFoundException('Recommended musician was not found');
    const compatibility = calculateCompatibility(context.target, {
      ...targetProfile,
      locationText:
        targetProfile.locationVisibility === Visibility.PRIVATE
          ? undefined
          : targetProfile.locationText,
    });
    return this.prisma.$transaction(async (transaction) => {
      const decision = await transaction.musicianRecommendationDecision.upsert({
        where: {
          userId_musicianProfileId_contextKey: {
            userId,
            musicianProfileId,
            contextKey: context.contextKey,
          },
        },
        create: {
          userId,
          musicianProfileId,
          bandProjectId: input.bandProjectId,
          contextKey: context.contextKey,
          decision: input.decision,
          compatibilityScore: compatibility.score,
        },
        update: { decision: input.decision, compatibilityScore: compatibility.score },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.STATUS_CHANGE,
          entityType: 'MusicianRecommendationDecision',
          entityId: decision.id,
          metadata: {
            decision: input.decision,
            contextKey: context.contextKey,
            compatibilityScore: compatibility.score,
          },
        },
      });
      return decision;
    });
  }

  private async getContext(
    userId: string,
    bandProjectId?: string,
  ): Promise<{ contextKey: string; target: CompatibilityTarget; excludedUserIds: string[] }> {
    if (bandProjectId) {
      const band = await this.prisma.bandProject.findFirst({
        where: { id: bandProjectId, ownerUserId: userId, status: 'ACTIVE', deletedAt: null },
        include: {
          members: { where: { status: 'ACTIVE' }, select: { userId: true } },
          memberSearches: {
            where: { status: 'OPEN', deletedAt: null },
            select: { requiredInstrument: true, desiredExperience: true },
          },
        },
      });
      if (!band)
        throw new ForbiddenException('Only the band administrator can request recommendations');
      return {
        contextKey: `band:${band.id}`,
        target: {
          genres: band.genres,
          instruments: band.memberSearches.map((search) => search.requiredInstrument),
          influences: band.influences,
          locationText: band.locationText,
          requiresAvailability: true,
          desiredExperience: band.memberSearches[0]?.desiredExperience,
        },
        excludedUserIds: band.members.map((member) => member.userId),
      };
    }
    const musician = await this.prisma.musicianProfile.findFirst({
      where: { userId, status: 'ACTIVE', deletedAt: null },
    });
    if (!musician) throw new ForbiddenException('An active musician profile is required');
    return {
      contextKey: 'self',
      target: {
        genres: musician.genres,
        instruments: musician.instruments,
        influences: musician.influences,
        locationText: musician.locationText,
        requiresAvailability: true,
        desiredExperience: musician.experienceLevel,
      },
      excludedUserIds: [userId],
    };
  }
}
