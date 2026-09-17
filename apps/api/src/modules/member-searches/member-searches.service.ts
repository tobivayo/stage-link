import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction, MemberSearchStatus, Visibility } from '../../generated/prisma/enums';
import {
  CreateMemberSearchDto,
  ListMemberSearchesDto,
  UpdateMemberSearchDto,
} from './dto/member-search.dto';

const memberSearchInclude = {
  bandProject: { select: { id: true, name: true, imageUrl: true } },
  musicianProfile: {
    select: {
      id: true,
      stageName: true,
      photoUrl: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  _count: { select: { applications: { where: { deletedAt: null } } } },
};

@Injectable()
export class MemberSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateMemberSearchDto) {
    let musicianProfileId: string | undefined;
    if (input.bandProjectId) {
      const band = await this.prisma.bandProject.findFirst({
        where: { id: input.bandProjectId, ownerUserId: userId, status: 'ACTIVE', deletedAt: null },
      });
      if (!band)
        throw new ForbiddenException('Only the active band administrator can publish this search');
    } else {
      const musician = await this.prisma.musicianProfile.findFirst({
        where: { userId, isSoloProject: true, status: 'ACTIVE', deletedAt: null },
      });
      if (!musician) throw new ForbiddenException('An active solo musician profile is required');
      musicianProfileId = musician.id;
    }
    const { bandProjectId, genres, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const search = await transaction.memberSearch.create({
        data: {
          ...data,
          title: data.title.trim(),
          description: data.description.trim(),
          requiredInstrument: data.requiredInstrument.trim().toLowerCase(),
          genres: this.normalizeTags(genres),
          creatorUserId: userId,
          bandProjectId,
          musicianProfileId,
        },
        include: memberSearchInclude,
      });
      await this.audit(transaction, userId, AuditAction.CREATE, search.id, {
        context: bandProjectId ? 'BAND_PROJECT' : 'SOLO_MUSICIAN',
      });
      return search;
    });
  }

  async list(input: ListMemberSearchesDto, viewerUserId: string | null) {
    const where: Prisma.MemberSearchWhereInput = {
      deletedAt: null,
      status: input.status,
      visibility: viewerUserId
        ? { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] }
        : Visibility.PUBLIC,
      requiredInstrument: input.instrument
        ? { contains: input.instrument.trim(), mode: 'insensitive' }
        : undefined,
      genres: input.genre ? { has: input.genre.trim().toLowerCase() } : undefined,
      locationText: input.location
        ? { contains: input.location.trim(), mode: 'insensitive' }
        : undefined,
      modality: input.modality,
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.memberSearch.count({ where }),
      this.prisma.memberSearch.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: memberSearchInclude,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);
    return {
      items,
      page: input.page,
      limit: input.limit,
      total,
      hasMore: input.page * input.limit < total,
    };
  }

  getMine(userId: string) {
    return this.prisma.memberSearch.findMany({
      where: { creatorUserId: userId, deletedAt: null },
      include: memberSearchInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getById(id: string, viewerUserId: string | null) {
    const search = await this.prisma.memberSearch.findFirst({
      where: { id, deletedAt: null },
      include: memberSearchInclude,
    });
    if (!search) throw new NotFoundException('Member search was not found');
    const owner = viewerUserId === search.creatorUserId;
    if (
      !owner &&
      (search.visibility === Visibility.PRIVATE ||
        (search.visibility === Visibility.REGISTERED_ONLY && !viewerUserId))
    ) {
      throw new NotFoundException('Member search was not found');
    }
    return { ...search, view: owner ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC' };
  }

  async update(userId: string, id: string, input: UpdateMemberSearchDto) {
    const current = await this.requireOwner(userId, id);
    if (input.bandProjectId && input.bandProjectId !== current.bandProjectId) {
      throw new ForbiddenException('The search context cannot be transferred');
    }
    const { genres, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const search = await transaction.memberSearch.update({
        where: { id },
        data: {
          ...data,
          title: data.title?.trim(),
          description: data.description?.trim(),
          requiredInstrument: data.requiredInstrument?.trim().toLowerCase(),
          genres: genres ? this.normalizeTags(genres) : undefined,
          closedAt:
            data.status === MemberSearchStatus.CLOSED ||
            data.status === MemberSearchStatus.CANCELLED
              ? new Date()
              : data.status === MemberSearchStatus.OPEN
                ? null
                : undefined,
        },
        include: memberSearchInclude,
      });
      await this.audit(transaction, userId, AuditAction.UPDATE, id, {
        changedFields: Object.keys(input),
      });
      return search;
    });
  }

  close(userId: string, id: string) {
    return this.update(userId, id, { status: MemberSearchStatus.CLOSED });
  }

  async requireOwner(userId: string, id: string) {
    const search = await this.prisma.memberSearch.findFirst({
      where: { id, creatorUserId: userId, deletedAt: null },
    });
    if (!search)
      throw new NotFoundException('Member search was not found or is not administered by you');
    if (search.bandProjectId) {
      const band = await this.prisma.bandProject.findFirst({
        where: { id: search.bandProjectId, ownerUserId: userId, deletedAt: null },
      });
      if (!band) throw new ForbiddenException('Band administration is required');
    }
    return search;
  }

  private normalizeTags(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  }

  private audit(
    transaction: Prisma.TransactionClient,
    actorUserId: string,
    action: AuditAction,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return transaction.auditLog.create({
      data: { actorUserId, action, entityType: 'MemberSearch', entityId, metadata },
    });
  }
}
