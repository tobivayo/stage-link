import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import {
  ApplicationStatus,
  AuditAction,
  CallConfirmationStatus,
  CallStatus,
} from '../../generated/prisma/enums';
import { DeclineCallConfirmationDto } from './dto/call-confirmation.dto';

@Injectable()
export class CallConfirmationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForCall(userId: string, callId: string) {
    const call = await this.prisma.call.findFirst({ where: { id: callId, deletedAt: null } });
    if (!call) throw new NotFoundException('Call was not found');
    const allowed =
      call.creatorUserId === userId ||
      (await this.prisma.callConfirmation.count({ where: { callId, confirmerUserId: userId } })) >
        0;
    if (!allowed) throw new ForbiddenException('You cannot view these confirmations');
    return this.prisma.callConfirmation.findMany({
      where: { callId },
      include: {
        application: {
          select: {
            id: true,
            applicantType: true,
            musicianProfile: { select: { id: true, stageName: true } },
            bandProject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async confirm(userId: string, id: string) {
    const confirmation = await this.getOwnedPending(userId, id);
    if (confirmation.call.status !== CallStatus.CLOSED) {
      throw new BadRequestException('The call selection must be closed before confirming');
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.callConfirmation.update({
        where: { id },
        data: {
          status: CallConfirmationStatus.CONFIRMED,
          confirmedAt: new Date(),
          declinedAt: null,
          declineReason: null,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.STATUS_CHANGE,
          entityType: 'CallConfirmation',
          entityId: id,
          metadata: { status: CallConfirmationStatus.CONFIRMED },
        },
      });
      const selectedCount = await transaction.application.count({
        where: { callId: confirmation.callId, status: ApplicationStatus.SELECTED, deletedAt: null },
      });
      const pendingCount = await transaction.callConfirmation.count({
        where: {
          callId: confirmation.callId,
          application: { status: ApplicationStatus.SELECTED },
          status: { not: CallConfirmationStatus.CONFIRMED },
        },
      });
      if (selectedCount === confirmation.call.maxSelectedApplicants && pendingCount === 0) {
        const now = new Date();
        await transaction.call.update({
          where: { id: confirmation.callId },
          data: { status: CallStatus.COMPLETED, completedAt: now },
        });
        await transaction.callStatusHistory.create({
          data: {
            callId: confirmation.callId,
            previousStatus: confirmation.call.status,
            newStatus: CallStatus.COMPLETED,
            changedByUserId: userId,
            reason: 'All selected applicants confirmed the proposed date',
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: userId,
            action: AuditAction.STATUS_CHANGE,
            entityType: 'Call',
            entityId: confirmation.callId,
            metadata: {
              previousStatus: confirmation.call.status,
              newStatus: CallStatus.COMPLETED,
            },
          },
        });
      }
      return updated;
    });
  }

  async decline(userId: string, id: string, input: DeclineCallConfirmationDto) {
    await this.getOwnedPending(userId, id);
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.callConfirmation.update({
        where: { id },
        data: {
          status: CallConfirmationStatus.DECLINED,
          declinedAt: new Date(),
          declineReason: input.reason?.trim(),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.STATUS_CHANGE,
          entityType: 'CallConfirmation',
          entityId: id,
          metadata: { status: CallConfirmationStatus.DECLINED, reason: input.reason },
        },
      });
      return updated;
    });
  }

  private async getOwnedPending(userId: string, id: string) {
    const confirmation = await this.prisma.callConfirmation.findFirst({
      where: { id },
      include: { call: true },
    });
    if (!confirmation) throw new NotFoundException('Confirmation was not found');
    if (confirmation.confirmerUserId !== userId) {
      throw new ForbiddenException('Only the selected applicant can respond');
    }
    if (confirmation.status !== CallConfirmationStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('This confirmation already has a response');
    }
    return confirmation;
  }
}
