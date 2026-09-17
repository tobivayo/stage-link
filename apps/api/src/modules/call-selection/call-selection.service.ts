import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { ApplicationStatus, AuditAction, CallStatus } from '../../generated/prisma/enums';
import { CallsService } from '../calls/calls.service';
import { SelectCallApplicantsDto } from './dto/call-selection.dto';

@Injectable()
export class CallSelectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly callsService: CallsService,
  ) {}

  async select(userId: string, callId: string, input: SelectCallApplicantsDto) {
    const ids = [...new Set(input.applicationIds)];
    if (ids.length !== input.applicationIds.length) {
      throw new BadRequestException('applicationIds must not contain duplicates');
    }
    const call = await this.callsService.requireOwner(userId, callId);
    if (!new Set<CallStatus>([CallStatus.OPEN, CallStatus.IN_REVIEW]).has(call.status)) {
      throw new BadRequestException(
        'Applicants can only be selected while the call is open or in review',
      );
    }
    return this.prisma.$transaction(
      async (transaction) => {
        const applications = await transaction.application.findMany({
          where: { id: { in: ids }, callId, deletedAt: null },
        });
        if (applications.length !== ids.length) {
          throw new BadRequestException('Every selected application must belong to this call');
        }
        const eligible = new Set<ApplicationStatus>([
          ApplicationStatus.PENDING,
          ApplicationStatus.REVIEWED,
          ApplicationStatus.PRESELECTED,
          ApplicationStatus.SELECTED,
        ]);
        if (applications.some((application) => !eligible.has(application.status))) {
          throw new BadRequestException('One or more applications cannot be selected');
        }
        const alreadySelected = await transaction.application.count({
          where: {
            callId,
            status: ApplicationStatus.SELECTED,
            id: { notIn: ids },
            deletedAt: null,
          },
        });
        const totalSelected = alreadySelected + ids.length;
        if (totalSelected > call.maxSelectedApplicants) {
          throw new BadRequestException(
            'The maximum number of selected applicants would be exceeded',
          );
        }
        const now = new Date();
        for (const application of applications) {
          await transaction.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.SELECTED, selectedAt: now },
          });
          await transaction.callConfirmation.upsert({
            where: { applicationId: application.id },
            create: {
              callId,
              applicationId: application.id,
              confirmerUserId: application.submittedByUserId,
            },
            update: {
              confirmerUserId: application.submittedByUserId,
              status: 'PENDING_CONFIRMATION',
              confirmedAt: null,
              declinedAt: null,
              declineReason: null,
            },
          });
        }
        if (input.rejectOthers && totalSelected === call.maxSelectedApplicants) {
          await transaction.application.updateMany({
            where: {
              callId,
              id: { notIn: ids },
              status: {
                in: [
                  ApplicationStatus.PENDING,
                  ApplicationStatus.REVIEWED,
                  ApplicationStatus.PRESELECTED,
                ],
              },
            },
            data: { status: ApplicationStatus.REJECTED, rejectedAt: now },
          });
        }
        const nextStatus =
          totalSelected === call.maxSelectedApplicants ? CallStatus.CLOSED : CallStatus.IN_REVIEW;
        await transaction.call.update({
          where: { id: callId },
          data: { status: nextStatus, closedAt: nextStatus === CallStatus.CLOSED ? now : null },
        });
        if (call.status !== nextStatus) {
          await transaction.callStatusHistory.create({
            data: {
              callId,
              previousStatus: call.status,
              newStatus: nextStatus,
              changedByUserId: userId,
              reason: 'Final applicant selection',
            },
          });
        }
        await transaction.auditLog.create({
          data: {
            actorUserId: userId,
            action: AuditAction.STATUS_CHANGE,
            entityType: 'CallSelection',
            entityId: callId,
            metadata: {
              applicationIds: ids,
              totalSelected,
              nextStatus,
              rejectOthers: input.rejectOthers ?? false,
            },
          },
        });
        return transaction.application.findMany({
          where: { callId, status: ApplicationStatus.SELECTED, deletedAt: null },
          include: { confirmation: true },
          orderBy: { selectedAt: 'asc' },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
