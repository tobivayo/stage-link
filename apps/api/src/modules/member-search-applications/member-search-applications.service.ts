import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  AuditAction,
  MemberSearchApplicationStatus,
  Visibility,
} from '../../generated/prisma/enums';
import { MemberSearchesService } from '../member-searches/member-searches.service';
import {
  CreateMemberSearchApplicationDto,
  UpdateMemberSearchApplicationStatusDto,
} from './dto/member-search-application.dto';

const applicationInclude = {
  search: {
    select: {
      id: true,
      title: true,
      status: true,
      bandProject: { select: { id: true, name: true } },
    },
  },
  musicianProfile: {
    select: {
      id: true,
      stageName: true,
      instruments: true,
      genres: true,
      experienceLevel: true,
      photoUrl: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
};

@Injectable()
export class MemberSearchApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberSearchesService: MemberSearchesService,
  ) {}

  async apply(userId: string, searchId: string, input: CreateMemberSearchApplicationDto) {
    const musician = await this.prisma.musicianProfile.findFirst({
      where: { userId, status: 'ACTIVE', deletedAt: null },
    });
    if (!musician) throw new ForbiddenException('An active musician profile is required');
    const search = await this.prisma.memberSearch.findFirst({
      where: {
        id: searchId,
        status: 'OPEN',
        deletedAt: null,
        visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
      },
    });
    if (!search) throw new NotFoundException('Open member search was not found');
    if (search.creatorUserId === userId)
      throw new BadRequestException('You cannot apply to your own search');
    if (
      search.bandProjectId &&
      (await this.prisma.bandMember.findFirst({
        where: { bandId: search.bandProjectId, userId, status: 'ACTIVE' },
      }))
    ) {
      throw new ConflictException('You are already an active member of this band');
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const application = await transaction.memberSearchApplication.create({
          data: {
            searchId,
            musicianProfileId: musician.id,
            message: input.message?.trim(),
          },
          include: applicationInclude,
        });
        await this.audit(transaction, userId, AuditAction.CREATE, application.id, {
          searchId,
          musicianProfileId: musician.id,
        });
        return application;
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('You already applied to this search');
      }
      throw error;
    }
  }

  async getReceived(userId: string, searchId: string) {
    await this.memberSearchesService.requireOwner(userId, searchId);
    return this.prisma.memberSearchApplication.findMany({
      where: { searchId, deletedAt: null },
      include: applicationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMine(userId: string) {
    const musician = await this.prisma.musicianProfile.findUnique({ where: { userId } });
    if (!musician) return [];
    return this.prisma.memberSearchApplication.findMany({
      where: { musicianProfileId: musician.id, deletedAt: null },
      include: applicationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    userId: string,
    applicationId: string,
    input: UpdateMemberSearchApplicationStatusDto,
  ) {
    const application = await this.prisma.memberSearchApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      include: { search: true, musicianProfile: { select: { userId: true } } },
    });
    if (!application) throw new NotFoundException('Application was not found');
    const applicant = application.musicianProfile.userId === userId;
    const owner = application.search.creatorUserId === userId;
    if (input.status === MemberSearchApplicationStatus.CANCELLED) {
      if (!applicant) throw new ForbiddenException('Only the applicant can cancel the application');
    } else {
      if (!owner) throw new ForbiddenException('Only the search owner can review applications');
      const reviewStatuses = new Set<MemberSearchApplicationStatus>([
        MemberSearchApplicationStatus.REVIEWED,
        MemberSearchApplicationStatus.ACCEPTED,
        MemberSearchApplicationStatus.REJECTED,
      ]);
      if (!reviewStatuses.has(input.status)) {
        throw new BadRequestException('Unsupported review status');
      }
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.memberSearchApplication.update({
        where: { id: applicationId },
        data: {
          status: input.status,
          reviewedAt: owner ? new Date() : undefined,
        },
        include: applicationInclude,
      });
      await this.audit(transaction, userId, AuditAction.STATUS_CHANGE, applicationId, {
        status: input.status,
      });
      return updated;
    });
  }

  private audit(
    transaction: Prisma.TransactionClient,
    actorUserId: string,
    action: AuditAction,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return transaction.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType: 'MemberSearchApplication',
        entityId,
        metadata,
      },
    });
  }
}
