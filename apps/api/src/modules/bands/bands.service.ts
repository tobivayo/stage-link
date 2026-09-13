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
  BandInvitationStatus,
  BandMemberStatus,
  UserRoleStatus,
  Visibility,
} from '../../generated/prisma/enums';
import { CreateBandDto, InviteBandMemberDto, UpdateBandDto } from './dto/band.dto';

const bandInclude = {
  links: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { members: { where: { status: 'ACTIVE' as const } } } },
};

@Injectable()
export class BandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateBandDto) {
    await this.requireCreationRole(userId);
    const { links, genres, influences, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const band = await transaction.bandProject.create({
        data: {
          ...data,
          ownerUserId: userId,
          name: input.name.trim(),
          genres: this.normalizeTags(genres),
          influences: this.normalizeTags(influences ?? []),
          members: { create: { userId, role: 'ADMIN', status: BandMemberStatus.ACTIVE } },
          links: {
            create: (links ?? []).map((link) => ({
              ...link,
              label: link.label.trim(),
              url: link.url.trim(),
            })),
          },
        },
        include: bandInclude,
      });
      await transaction.userRole.updateMany({
        where: { userId, role: { code: 'BAND_ADMIN' }, status: UserRoleStatus.PENDING_PROFILE },
        data: { status: UserRoleStatus.ACTIVE, deactivatedAt: null },
      });
      await this.audit(transaction, userId, AuditAction.CREATE, 'BandProject', band.id);
      return band;
    });
  }

  getMine(userId: string) {
    return this.prisma.bandProject.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerUserId: userId },
          { members: { some: { userId, status: BandMemberStatus.ACTIVE } } },
        ],
      },
      include: bandInclude,
      orderBy: { name: 'asc' },
    });
  }

  async getVisible(id: string, viewerUserId: string | null) {
    const band = await this.prisma.bandProject.findFirst({
      where: { id, deletedAt: null },
      include: bandInclude,
    });
    if (!band) throw new NotFoundException('Band or project was not found');
    const owner = viewerUserId === band.ownerUserId;
    if (
      !owner &&
      (band.status !== 'ACTIVE' ||
        band.visibility === Visibility.PRIVATE ||
        (band.visibility === Visibility.REGISTERED_ONLY && !viewerUserId))
    ) {
      throw new NotFoundException('Band or project was not found');
    }
    const registered = !!viewerUserId;
    return {
      ...band,
      view: owner ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC',
      locationText:
        owner ||
        band.locationVisibility === Visibility.PUBLIC ||
        (viewerUserId && band.locationVisibility === Visibility.REGISTERED_ONLY)
          ? band.locationText
          : undefined,
      influences: viewerUserId ? band.influences : [],
      links: band.links.filter(
        (link) =>
          owner ||
          link.visibility === Visibility.PUBLIC ||
          (registered && link.visibility === Visibility.REGISTERED_ONLY),
      ),
    };
  }

  async update(userId: string, id: string, input: UpdateBandDto) {
    await this.requireOwner(userId, id);
    const { genres, influences, links, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const band = await transaction.bandProject.update({
        where: { id },
        data: {
          ...data,
          genres: genres ? this.normalizeTags(genres) : undefined,
          influences: influences ? this.normalizeTags(influences) : undefined,
          links: links
            ? {
                deleteMany: {},
                create: links.map((link) => ({
                  ...link,
                  label: link.label.trim(),
                  url: link.url.trim(),
                })),
              }
            : undefined,
        },
        include: bandInclude,
      });
      await this.audit(transaction, userId, AuditAction.UPDATE, 'BandProject', id, {
        changedFields: Object.keys(input),
      });
      return band;
    });
  }

  async getMembers(userId: string, bandId: string) {
    await this.requireActiveMember(userId, bandId);
    return this.prisma.bandMember.findMany({
      where: { bandId, status: BandMemberStatus.ACTIVE },
      select: {
        id: true,
        role: true,
        instrument: true,
        joinedAt: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async invite(userId: string, bandId: string, input: InviteBandMemberDto) {
    await this.requireOwner(userId, bandId);
    if ((input.userId && input.email) || (!input.userId && !input.email)) {
      throw new BadRequestException('Provide exactly one recipient: userId or email');
    }

    let invitedUserId = input.userId;
    let invitedEmail: string | undefined;
    if (input.email) {
      const email = input.email.trim().toLowerCase();
      const registered = await this.prisma.user.findUnique({ where: { email } });
      invitedUserId = registered?.id;
      invitedEmail = registered ? undefined : email;
    }
    if (invitedUserId === userId)
      throw new BadRequestException('The administrator is already a member');
    if (
      invitedUserId &&
      (await this.prisma.bandMember.findFirst({
        where: { bandId, userId: invitedUserId, status: BandMemberStatus.ACTIVE },
      }))
    ) {
      throw new ConflictException('The user is already an active member');
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const invitation = await transaction.bandInvitation.create({
          data: {
            bandId,
            invitedById: userId,
            invitedUserId,
            invitedEmail,
            role: input.role ?? 'MEMBER',
            instrument: input.instrument,
            message: input.message,
          },
        });
        await this.audit(transaction, userId, AuditAction.CREATE, 'BandInvitation', invitation.id, {
          bandId,
          recipient: invitedUserId ?? invitedEmail,
        });
        return invitation;
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('A pending invitation already exists');
      }
      throw error;
    }
  }

  getMyInvitations(userId: string, email: string) {
    return this.prisma.bandInvitation.findMany({
      where: {
        status: BandInvitationStatus.PENDING,
        OR: [{ invitedUserId: userId }, { invitedEmail: email.toLowerCase() }],
      },
      include: { band: { select: { id: true, name: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToInvitation(userId: string, email: string, id: string, accept: boolean) {
    const invitation = await this.prisma.bandInvitation.findFirst({
      where: {
        id,
        status: BandInvitationStatus.PENDING,
        OR: [{ invitedUserId: userId }, { invitedEmail: email.toLowerCase() }],
      },
    });
    if (!invitation) throw new NotFoundException('Pending invitation was not found');

    return this.prisma.$transaction(async (transaction) => {
      if (accept) {
        await transaction.bandMember.upsert({
          where: { bandId_userId: { bandId: invitation.bandId, userId } },
          create: {
            bandId: invitation.bandId,
            userId,
            role: invitation.role,
            instrument: invitation.instrument,
          },
          update: {
            role: invitation.role,
            instrument: invitation.instrument,
            status: BandMemberStatus.ACTIVE,
            leftAt: null,
            joinedAt: new Date(),
          },
        });
      }
      const updated = await transaction.bandInvitation.update({
        where: { id },
        data: {
          invitedUserId: userId,
          invitedEmail: null,
          status: accept ? BandInvitationStatus.ACCEPTED : BandInvitationStatus.REJECTED,
          respondedAt: new Date(),
        },
      });
      await this.audit(transaction, userId, AuditAction.STATUS_CHANGE, 'BandInvitation', id, {
        response: updated.status,
      });
      return updated;
    });
  }

  async removeMember(userId: string, bandId: string, memberId: string) {
    const band = await this.requireOwner(userId, bandId);
    const member = await this.prisma.bandMember.findFirst({
      where: { id: memberId, bandId, status: BandMemberStatus.ACTIVE },
    });
    if (!member) throw new NotFoundException('Active member was not found');
    if (member.userId === band.ownerUserId) {
      throw new BadRequestException('The sole administrator cannot be removed');
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.bandMember.update({
        where: { id: memberId },
        data: { status: BandMemberStatus.INACTIVE, leftAt: new Date() },
      });
      await this.audit(transaction, userId, AuditAction.STATUS_CHANGE, 'BandMember', memberId, {
        bandId,
        status: updated.status,
      });
      return updated;
    });
  }

  private async requireCreationRole(userId: string): Promise<void> {
    const role = await this.prisma.userRole.findFirst({
      where: {
        userId,
        OR: [
          {
            role: { code: 'BAND_ADMIN' },
            status: { in: [UserRoleStatus.ACTIVE, UserRoleStatus.PENDING_PROFILE] },
          },
          { role: { code: 'MUSICIAN' }, status: UserRoleStatus.ACTIVE },
        ],
      },
    });
    if (!role) throw new ForbiddenException('BAND_ADMIN or MUSICIAN role is required');
  }

  async requireOwner(userId: string, bandId: string) {
    const band = await this.prisma.bandProject.findFirst({
      where: { id: bandId, ownerUserId: userId, deletedAt: null },
    });
    if (!band) throw new NotFoundException('Band was not found or is not administered by you');
    return band;
  }

  private async requireActiveMember(userId: string, bandId: string): Promise<void> {
    const member = await this.prisma.bandMember.findFirst({
      where: { bandId, userId, status: BandMemberStatus.ACTIVE },
    });
    if (!member) throw new ForbiddenException('Active band membership is required');
  }

  private normalizeTags(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  }

  private audit(
    transaction: Prisma.TransactionClient,
    actorUserId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return transaction.auditLog.create({
      data: { actorUserId, action, entityType, entityId, metadata },
    });
  }
}
