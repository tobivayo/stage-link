import { Injectable, NotFoundException } from '@nestjs/common';

import { calculateCompatibility } from '../../common/search/compatibility-score';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { Visibility } from '../../generated/prisma/enums';
import { ProfilesService } from '../profiles/profiles.service';
import { MusicianSearchSort, SearchMusiciansDto } from './dto/search-musicians.dto';

const experienceRank = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, PROFESSIONAL: 4 } as const;
type SearchProfile = Prisma.MusicianProfileGetPayload<{
  include: {
    user: { select: { firstName: true; lastName: true } };
    links: true;
    _count: { select: { applications: true } };
  };
}>;

@Injectable()
export class MusicianSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async search(input: SearchMusiciansDto, viewerUserId: string | null) {
    const where = this.buildWhere(input, !!viewerUserId);
    const total = await this.prisma.musicianProfile.count({ where });
    const windowSize = 200;
    const candidates = await this.prisma.musicianProfile.findMany({
      where,
      take: windowSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        links: { orderBy: { createdAt: 'asc' } },
        _count: { select: { applications: true } },
      },
    });
    const target = {
      genres: input.genre ? [input.genre] : [],
      instruments: input.instrument ? [input.instrument] : [],
      influences: viewerUserId && input.influence ? [input.influence] : [],
      locationText: input.location,
      requiresAvailability: input.available,
      desiredExperience: input.experienceLevel,
    };
    const scored = candidates.map((profile) => ({
      profile,
      ...calculateCompatibility(target, {
        ...profile,
        locationText: this.canSeeLocation(profile.locationVisibility, !!viewerUserId)
          ? profile.locationText
          : undefined,
      }),
    }));
    scored.sort((left, right) => this.compare(left, right, input));
    const offset = (input.page - 1) * input.limit;
    return {
      items: scored
        .slice(offset, offset + input.limit)
        .map(({ profile, score, reasons }) =>
          this.toResult(profile, score, reasons, !!viewerUserId),
        ),
      page: input.page,
      limit: input.limit,
      total,
      hasMore: offset + input.limit < Math.min(total, windowSize),
      candidateLimitReached: total > 200,
    };
  }

  getPublicProfile(id: string, viewerUserId: string | null) {
    return this.profilesService.getVisibleProfile('musician', id, viewerUserId);
  }

  private buildWhere(
    input: SearchMusiciansDto,
    registered: boolean,
  ): Prisma.MusicianProfileWhereInput {
    const normalized = (value?: string) => value?.trim().toLowerCase();
    const text = input.query?.trim();
    return {
      deletedAt: null,
      status: 'ACTIVE',
      visibility: registered
        ? { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] }
        : Visibility.PUBLIC,
      instruments: input.instrument ? { has: normalized(input.instrument) } : undefined,
      genres: input.genre ? { has: normalized(input.genre) } : undefined,
      influences: registered && input.influence ? { has: normalized(input.influence) } : undefined,
      availableForProjects: input.available,
      experienceLevel: input.experienceLevel,
      user: {
        status: 'ACTIVE',
        deletedAt: null,
        bandMemberships:
          input.inBand === undefined
            ? undefined
            : input.inBand
              ? { some: { status: 'ACTIVE' } }
              : { none: { status: 'ACTIVE' } },
      },
      OR: text
        ? [
            { stageName: { contains: text, mode: 'insensitive' } },
            { bio: { contains: text, mode: 'insensitive' } },
            ...(registered
              ? [{ experience: { contains: text, mode: 'insensitive' as const } }]
              : []),
            { user: { firstName: { contains: text, mode: 'insensitive' } } },
            { user: { lastName: { contains: text, mode: 'insensitive' } } },
          ]
        : undefined,
      AND: input.location
        ? {
            locationText: { contains: input.location.trim(), mode: 'insensitive' },
            locationVisibility: registered
              ? { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] }
              : Visibility.PUBLIC,
          }
        : undefined,
    };
  }

  private compare(
    left: {
      profile: {
        updatedAt: Date;
        locationText: string | null;
        experienceLevel: keyof typeof experienceRank | null;
      };
      score: number;
    },
    right: {
      profile: {
        updatedAt: Date;
        locationText: string | null;
        experienceLevel: keyof typeof experienceRank | null;
      };
      score: number;
    },
    input: SearchMusiciansDto,
  ): number {
    if (input.sort === MusicianSearchSort.RECENT)
      return right.profile.updatedAt.getTime() - left.profile.updatedAt.getTime();
    if (input.sort === MusicianSearchSort.EXPERIENCE)
      return (
        (right.profile.experienceLevel ? experienceRank[right.profile.experienceLevel] : 0) -
        (left.profile.experienceLevel ? experienceRank[left.profile.experienceLevel] : 0)
      );
    if (input.sort === MusicianSearchSort.LOCATION) {
      const zone = input.location?.trim().toLowerCase();
      const leftSame = zone && left.profile.locationText?.toLowerCase() === zone ? 1 : 0;
      const rightSame = zone && right.profile.locationText?.toLowerCase() === zone ? 1 : 0;
      return rightSame - leftSame || right.score - left.score;
    }
    return (
      right.score - left.score ||
      right.profile.updatedAt.getTime() - left.profile.updatedAt.getTime()
    );
  }

  private toResult(
    profile: SearchProfile,
    compatibilityScore: number,
    compatibilityReasons: string[],
    registered: boolean,
  ) {
    if (!profile) throw new NotFoundException('Musician profile was not found');
    return {
      id: profile.id,
      displayName: profile.stageName || `${profile.user.firstName} ${profile.user.lastName}`,
      bio: profile.bio,
      instruments: profile.instruments,
      genres: profile.genres,
      experienceLevel: profile.experienceLevel,
      availableForProjects: profile.availableForProjects,
      photoUrl: profile.photoUrl,
      updatedAt: profile.updatedAt,
      compatibilityScore,
      compatibilityReasons,
      locationText: this.canSeeLocation(profile.locationVisibility, registered)
        ? profile.locationText
        : undefined,
      influences: registered ? profile.influences : [],
      links: profile.links.filter(
        (link) =>
          link.visibility === Visibility.PUBLIC ||
          (registered && link.visibility === Visibility.REGISTERED_ONLY),
      ),
    };
  }

  private canSeeLocation(visibility: Visibility, registered: boolean): boolean {
    return (
      visibility === Visibility.PUBLIC || (registered && visibility === Visibility.REGISTERED_ONLY)
    );
  }
}
