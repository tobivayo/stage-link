import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import {
  AuditAction,
  ContactIntentSource,
  ContactTargetType,
  Visibility,
} from '../../generated/prisma/enums';
import { CreateContactIntentDto } from './dto/contact-intent.dto';

@Injectable()
export class ContactIntentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateContactIntentDto) {
    const targetUserId = await this.resolveVisibleTarget(
      input.targetProfileType,
      input.targetProfileId,
    );
    if (targetUserId === userId) throw new BadRequestException('You cannot contact yourself');
    if (input.sourceType === ContactIntentSource.APPLICATION) {
      if (!input.sourceEntityId) throw new BadRequestException('Application source id is required');
      await this.validateApplicationSource(userId, targetUserId, input.sourceEntityId);
    }
    const duplicate = await this.prisma.contactIntent.findFirst({
      where: {
        requesterUserId: userId,
        targetProfileType: input.targetProfileType,
        targetProfileId: input.targetProfileId,
        status: 'PENDING',
      },
    });
    if (duplicate) throw new ConflictException('A pending contact intent already exists');
    return this.prisma.$transaction(async (transaction) => {
      const intent = await transaction.contactIntent.create({
        data: {
          ...input,
          requesterUserId: userId,
          targetUserId,
          message: input.message?.trim(),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.CREATE,
          entityType: 'ContactIntent',
          entityId: intent.id,
          metadata: { sourceType: intent.sourceType, targetProfileType: intent.targetProfileType },
        },
      });
      return intent;
    });
  }

  getMine(userId: string) {
    return this.prisma.contactIntent.findMany({
      where: { OR: [{ requesterUserId: userId }, { targetUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async resolveVisibleTarget(type: ContactTargetType, id: string): Promise<string> {
    if (type === ContactTargetType.MUSICIAN) {
      const profile = await this.prisma.musicianProfile.findFirst({
        where: {
          id,
          deletedAt: null,
          status: 'ACTIVE',
          visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
          user: { status: 'ACTIVE', deletedAt: null },
        },
        select: { userId: true },
      });
      if (!profile) throw new NotFoundException('Visible musician profile was not found');
      return profile.userId;
    }
    const band = await this.prisma.bandProject.findFirst({
      where: {
        id,
        deletedAt: null,
        status: 'ACTIVE',
        visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
        owner: { status: 'ACTIVE', deletedAt: null },
      },
      select: { ownerUserId: true },
    });
    if (!band) throw new NotFoundException('Visible band profile was not found');
    return band.ownerUserId;
  }

  private async validateApplicationSource(
    userId: string,
    targetUserId: string,
    applicationId: string,
  ) {
    const application = await this.prisma.memberSearchApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: {
        musicianProfile: { select: { userId: true } },
        search: { select: { creatorUserId: true } },
      },
    });
    if (!application) throw new NotFoundException('Application source was not found');
    const applicantId = application.musicianProfile.userId;
    const ownerId = application.search.creatorUserId;
    const validPair =
      (userId === applicantId && targetUserId === ownerId) ||
      (userId === ownerId && targetUserId === applicantId);
    if (!validPair) throw new BadRequestException('Contact target does not match the application');
  }
}
