import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction, Visibility } from '../../generated/prisma/enums';
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreatePortfolioItemDto) {
    await this.assertProfileOwner(userId, input.profileType, input.profileId);
    const item = await this.prisma.portfolioItem.create({
      data: {
        createdByUserId: userId,
        musicianProfileId: input.profileType === 'musician' ? input.profileId : undefined,
        bandProjectId: input.profileType === 'band' ? input.profileId : undefined,
        type: input.type,
        title: input.title.trim(),
        description: input.description,
        url: input.url.trim(),
        experienceRef: input.experienceRef,
        visibility: input.visibility,
        sortOrder: input.sortOrder,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: AuditAction.CREATE,
        entityType: 'PortfolioItem',
        entityId: item.id,
        metadata: { profileType: input.profileType, profileId: input.profileId },
      },
    });
    return item;
  }

  async getMine(userId: string) {
    const musician = await this.prisma.musicianProfile.findUnique({ where: { userId } });
    const ownership: Prisma.PortfolioItemWhereInput[] = [{ bandProject: { ownerUserId: userId } }];
    if (musician) {
      ownership.push(
        { musicianProfileId: musician.id },
        { shares: { some: { musicianProfileId: musician.id } } },
      );
    }
    return this.prisma.portfolioItem.findMany({
      where: {
        deletedAt: null,
        OR: ownership,
      },
      include: { bandProject: { select: { id: true, name: true } }, shares: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getForProfile(type: string, id: string, viewerUserId: string | null) {
    if (!['musician', 'band'].includes(type)) {
      throw new NotFoundException('Portfolio profile type is not supported');
    }
    const owner = await this.isProfileOwner(viewerUserId, type, id);
    const registered = !!viewerUserId;
    const profileAccess = await this.getProfileAccess(type, id);
    if (
      !owner &&
      (profileAccess.status !== 'ACTIVE' ||
        profileAccess.visibility === Visibility.PRIVATE ||
        (profileAccess.visibility === Visibility.REGISTERED_ONLY && !registered))
    ) {
      throw new NotFoundException('Portfolio profile was not found');
    }
    const allowedVisibility = owner
      ? undefined
      : registered
        ? { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] }
        : Visibility.PUBLIC;
    return this.prisma.portfolioItem.findMany({
      where: {
        deletedAt: null,
        OR:
          type === 'musician'
            ? [{ musicianProfileId: id }, { shares: { some: { musicianProfileId: id } } }]
            : [{ bandProjectId: id }],
        visibility: allowedVisibility,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async update(userId: string, id: string, input: UpdatePortfolioItemDto) {
    const item = await this.requireEditableItem(userId, id);
    const updated = await this.prisma.portfolioItem.update({ where: { id }, data: input });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: AuditAction.UPDATE,
        entityType: 'PortfolioItem',
        entityId: id,
        metadata: { changedFields: Object.keys(input), previousVisibility: item.visibility },
      },
    });
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.requireEditableItem(userId, id);
    const item = await this.prisma.portfolioItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: AuditAction.DELETE,
        entityType: 'PortfolioItem',
        entityId: id,
      },
    });
    return item;
  }

  async shareOnMyProfile(userId: string, itemId: string) {
    const musician = await this.prisma.musicianProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!musician) throw new ForbiddenException('A musician profile is required');
    const item = await this.prisma.portfolioItem.findFirst({
      where: {
        id: itemId,
        deletedAt: null,
        bandProject: { members: { some: { userId, status: 'ACTIVE' } } },
      },
    });
    if (!item) throw new ForbiddenException('The item does not belong to one of your bands');
    return this.prisma.portfolioItemShare.upsert({
      where: {
        portfolioItemId_musicianProfileId: {
          portfolioItemId: itemId,
          musicianProfileId: musician.id,
        },
      },
      create: {
        portfolioItemId: itemId,
        musicianProfileId: musician.id,
        createdByUserId: userId,
      },
      update: {},
    });
  }

  async unshareFromMyProfile(userId: string, itemId: string) {
    const musician = await this.prisma.musicianProfile.findUnique({ where: { userId } });
    if (!musician) throw new NotFoundException('Musician profile was not found');
    return this.prisma.portfolioItemShare.delete({
      where: {
        portfolioItemId_musicianProfileId: {
          portfolioItemId: itemId,
          musicianProfileId: musician.id,
        },
      },
    });
  }

  private async requireEditableItem(userId: string, id: string) {
    const item = await this.prisma.portfolioItem.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ musicianProfile: { userId } }, { bandProject: { ownerUserId: userId } }],
      },
    });
    if (!item) throw new NotFoundException('Portfolio item was not found or is not editable');
    return item;
  }

  private async assertProfileOwner(userId: string, type: string, id: string): Promise<void> {
    if (!(await this.isProfileOwner(userId, type, id))) {
      throw new ForbiddenException('You do not administer this profile');
    }
  }

  private async isProfileOwner(userId: string | null, type: string, id: string): Promise<boolean> {
    if (!userId) return false;
    if (type === 'musician') {
      return !!(await this.prisma.musicianProfile.findFirst({
        where: { id, userId, deletedAt: null },
      }));
    }
    if (type === 'band') {
      return !!(await this.prisma.bandProject.findFirst({
        where: { id, ownerUserId: userId, deletedAt: null },
      }));
    }
    return false;
  }

  private async getProfileAccess(
    type: string,
    id: string,
  ): Promise<{ visibility: Visibility; status: string }> {
    const profile =
      type === 'musician'
        ? await this.prisma.musicianProfile.findFirst({
            where: { id, deletedAt: null },
            select: { visibility: true, status: true },
          })
        : await this.prisma.bandProject.findFirst({
            where: { id, deletedAt: null },
            select: { visibility: true, status: true },
          });
    if (!profile) throw new NotFoundException('Portfolio profile was not found');
    return profile;
  }
}
