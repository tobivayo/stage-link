import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  ApplicationStatus,
  AuditAction,
  CallOrganizerType,
  CallStatus,
  ProfileStatus,
  UserRoleStatus,
  Visibility,
} from '../../generated/prisma/enums';
import {
  CancelCallDto,
  ChangeCallStatusDto,
  CreateCallDto,
  ListCallsDto,
  ReopenCallDto,
  UpdateCallDto,
} from './dto/call.dto';

const callInclude = {
  musicianProfile: { select: { id: true, stageName: true, photoUrl: true } },
  bandProject: { select: { id: true, name: true, imageUrl: true } },
  venueProfile: { select: { id: true, name: true } },
  creator: { select: { firstName: true, lastName: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.CallInclude;

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateCallDto) {
    const organizer = await this.resolveOrganizer(userId, input);
    const proposedDateTime = new Date(input.proposedDateTime);
    const closesAt = input.closesAt ? new Date(input.closesAt) : undefined;
    if (closesAt && closesAt >= proposedDateTime) {
      throw new BadRequestException('Applications must close before the proposed date');
    }
    return this.prisma.$transaction(async (transaction) => {
      const call = await transaction.call.create({
        data: {
          creatorUserId: userId,
          organizerType: input.organizerType,
          ...organizer,
          type: input.type,
          title: input.title.trim(),
          description: input.description.trim(),
          eventName: input.eventName?.trim(),
          proposedDateTime,
          closesAt,
          locationText: input.locationText?.trim(),
          genres: this.normalizeTags(input.genres),
          preferredStyles: this.normalizeTags(input.preferredStyles ?? []),
          maxSelectedApplicants: input.maxSelectedApplicants,
          offeredConditions: input.offeredConditions?.trim(),
          estimatedPayment: input.estimatedPayment,
          currency: input.currency?.toUpperCase(),
          technicalRequirements: input.technicalRequirements?.trim(),
          visibility: input.visibility ?? Visibility.PUBLIC,
        },
        include: callInclude,
      });
      await transaction.callStatusHistory.create({
        data: { callId: call.id, newStatus: CallStatus.OPEN, changedByUserId: userId },
      });
      await this.audit(transaction, userId, AuditAction.CREATE, call.id, {
        organizerType: call.organizerType,
        type: call.type,
      });
      return this.toVisibleCall(call, 'OWNER');
    });
  }

  async list(input: ListCallsDto, viewerUserId: string | null) {
    const visibility = viewerUserId
      ? { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] }
      : Visibility.PUBLIC;
    const where: Prisma.CallWhereInput = {
      deletedAt: null,
      status: input.status,
      visibility,
      ...(input.genre ? { genres: { has: input.genre.trim().toLowerCase() } } : {}),
      ...(input.location
        ? { locationText: { contains: input.location.trim(), mode: 'insensitive' } }
        : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.venueProfileId ? { venueProfileId: input.venueProfileId } : {}),
      ...(input.dateFrom || input.dateTo
        ? {
            proposedDateTime: {
              ...(input.dateFrom ? { gte: new Date(input.dateFrom) } : {}),
              ...(input.dateTo ? { lte: new Date(input.dateTo) } : {}),
            },
          }
        : {}),
    };
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.call.findMany({
        where,
        include: callInclude,
        orderBy: [{ proposedDateTime: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: input.limit,
      }),
      this.prisma.call.count({ where }),
    ]);
    return {
      items: items.map((call) => this.toVisibleCall(call, viewerUserId ? 'REGISTERED' : 'PUBLIC')),
      page: input.page,
      limit: input.limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async getMine(userId: string) {
    const calls = await this.prisma.call.findMany({
      where: { creatorUserId: userId, deletedAt: null },
      include: callInclude,
      orderBy: { createdAt: 'desc' },
    });
    return calls.map((call) => this.toVisibleCall(call, 'OWNER'));
  }

  async getById(id: string, viewerUserId: string | null) {
    const call = await this.prisma.call.findFirst({
      where: { id, deletedAt: null },
      include: callInclude,
    });
    if (!call) throw new NotFoundException('Call was not found');
    const view =
      call.creatorUserId === viewerUserId ? 'OWNER' : viewerUserId ? 'REGISTERED' : 'PUBLIC';
    if (call.visibility === Visibility.PRIVATE && view !== 'OWNER') {
      throw new NotFoundException('Call was not found');
    }
    if (call.visibility === Visibility.REGISTERED_ONLY && !viewerUserId) {
      throw new NotFoundException('Call was not found');
    }
    return this.toVisibleCall(call, view);
  }

  async update(userId: string, id: string, input: UpdateCallDto) {
    const call = await this.requireOwner(userId, id);
    if (!new Set<CallStatus>([CallStatus.OPEN, CallStatus.IN_REVIEW]).has(call.status)) {
      throw new BadRequestException('Only open or in-review calls can be edited');
    }
    const proposedDateTime = input.proposedDateTime
      ? new Date(input.proposedDateTime)
      : call.proposedDateTime;
    const closesAt = input.closesAt ? new Date(input.closesAt) : call.closesAt;
    if (closesAt && closesAt >= proposedDateTime) {
      throw new BadRequestException('Applications must close before the proposed date');
    }
    if (input.maxSelectedApplicants !== undefined) {
      const selectedCount = await this.prisma.application.count({
        where: { callId: id, status: ApplicationStatus.SELECTED, deletedAt: null },
      });
      if (input.maxSelectedApplicants < selectedCount) {
        throw new BadRequestException('Maximum slots cannot be lower than the selected applicants');
      }
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.call.update({
        where: { id },
        data: {
          ...input,
          proposedDateTime: input.proposedDateTime ? proposedDateTime : undefined,
          closesAt: input.closesAt ? closesAt : undefined,
          genres: input.genres ? this.normalizeTags(input.genres) : undefined,
          preferredStyles: input.preferredStyles
            ? this.normalizeTags(input.preferredStyles)
            : undefined,
          title: input.title?.trim(),
          description: input.description?.trim(),
          eventName: input.eventName?.trim(),
          locationText: input.locationText?.trim(),
          offeredConditions: input.offeredConditions?.trim(),
          technicalRequirements: input.technicalRequirements?.trim(),
          currency: input.currency?.toUpperCase(),
        },
        include: callInclude,
      });
      await this.audit(transaction, userId, AuditAction.UPDATE, id);
      return this.toVisibleCall(updated, 'OWNER');
    });
  }

  async changeStatus(userId: string, id: string, input: ChangeCallStatusDto) {
    const call = await this.requireOwner(userId, id);
    if (
      !new Set<CallStatus>([CallStatus.OPEN, CallStatus.IN_REVIEW, CallStatus.CLOSED]).has(
        input.status,
      )
    ) {
      throw new BadRequestException('Use the dedicated cancel, reopen or confirmation flows');
    }
    const allowed: Record<CallStatus, CallStatus[]> = {
      OPEN: [CallStatus.IN_REVIEW, CallStatus.CLOSED],
      IN_REVIEW: [CallStatus.OPEN, CallStatus.CLOSED],
      CLOSED: [CallStatus.IN_REVIEW, CallStatus.OPEN],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!allowed[call.status].includes(input.status)) {
      throw new BadRequestException(`Cannot change call from ${call.status} to ${input.status}`);
    }
    return this.transition(userId, call, input.status, input.reason);
  }

  async cancel(userId: string, id: string, input: CancelCallDto) {
    const call = await this.requireOwner(userId, id);
    if (new Set<CallStatus>([CallStatus.COMPLETED, CallStatus.CANCELLED]).has(call.status)) {
      throw new BadRequestException('This call cannot be cancelled');
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.call.update({
        where: { id },
        data: {
          status: CallStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: input.reason?.trim(),
        },
        include: callInclude,
      });
      await transaction.application.updateMany({
        where: {
          callId: id,
          status: { notIn: [ApplicationStatus.WITHDRAWN, ApplicationStatus.CANCELLED] },
        },
        data: { status: ApplicationStatus.CANCELLED, cancelledAt: new Date() },
      });
      await this.recordTransition(
        transaction,
        userId,
        id,
        call.status,
        CallStatus.CANCELLED,
        input.reason,
      );
      return this.toVisibleCall(updated, 'OWNER');
    });
  }

  async reopen(userId: string, id: string, input: ReopenCallDto) {
    const call = await this.requireOwner(userId, id);
    if (!new Set<CallStatus>([CallStatus.CLOSED, CallStatus.CANCELLED]).has(call.status)) {
      throw new BadRequestException('Only closed or cancelled calls can be reopened');
    }
    if (!new Set<CallStatus>([CallStatus.OPEN, CallStatus.IN_REVIEW]).has(input.status)) {
      throw new BadRequestException('A reopened call must be open or in review');
    }
    return this.prisma.$transaction(async (transaction) => {
      if (call.status === CallStatus.CANCELLED) {
        await transaction.application.updateMany({
          where: { callId: id, status: ApplicationStatus.CANCELLED },
          data: { status: ApplicationStatus.PENDING, cancelledAt: null },
        });
      }
      await transaction.application.updateMany({
        where: {
          callId: id,
          confirmation: { status: 'DECLINED' },
        },
        data: { status: ApplicationStatus.REJECTED, rejectedAt: new Date() },
      });
      const updated = await transaction.call.update({
        where: { id },
        data: {
          status: input.status,
          closedAt: null,
          completedAt: null,
          cancelledAt: null,
          cancellationReason: null,
        },
        include: callInclude,
      });
      await this.recordTransition(transaction, userId, id, call.status, input.status, input.reason);
      return this.toVisibleCall(updated, 'OWNER');
    });
  }

  async getStatusHistory(userId: string, id: string) {
    await this.requireOwner(userId, id);
    return this.prisma.callStatusHistory.findMany({
      where: { callId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async requireOwner(userId: string, id: string) {
    const call = await this.prisma.call.findFirst({ where: { id, deletedAt: null } });
    if (!call) throw new NotFoundException('Call was not found');
    if (call.creatorUserId !== userId)
      throw new ForbiddenException('Only the call organizer can manage it');
    return call;
  }

  private async resolveOrganizer(userId: string, input: CreateCallDto) {
    if (input.organizerType === CallOrganizerType.MUSICIAN) {
      const musician = await this.prisma.musicianProfile.findFirst({
        where: {
          ...(input.musicianProfileId ? { id: input.musicianProfileId } : {}),
          userId,
          status: ProfileStatus.ACTIVE,
          deletedAt: null,
        },
      });
      if (!musician) throw new ForbiddenException('An active owned musician profile is required');
      return { musicianProfileId: musician.id };
    }
    if (input.organizerType === CallOrganizerType.BAND_PROJECT) {
      if (!input.bandProjectId) throw new BadRequestException('bandProjectId is required');
      const band = await this.prisma.bandProject.findFirst({
        where: { id: input.bandProjectId, ownerUserId: userId, status: 'ACTIVE', deletedAt: null },
      });
      if (!band) throw new ForbiddenException('Only the band administrator can organize this call');
      return { bandProjectId: band.id };
    }
    if (input.organizerType === CallOrganizerType.VENUE) {
      if (!input.venueProfileId) throw new BadRequestException('venueProfileId is required');
      const venue = await this.prisma.venueProfile.findFirst({
        where: { id: input.venueProfileId, ownerUserId: userId, deletedAt: null },
      });
      if (!venue)
        throw new ForbiddenException('Only the venue administrator can organize this call');
      return { venueProfileId: venue.id };
    }
    if (input.organizerType === CallOrganizerType.PRODUCER) {
      throw new BadRequestException('The PRODUCER role is not available yet');
    }
    const authorizedRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        status: UserRoleStatus.ACTIVE,
        role: { code: { in: ['MUSICIAN', 'BAND_ADMIN', 'VENUE_ADMIN'] } },
      },
    });
    if (!authorizedRole) throw new ForbiddenException('An organizer role is required');
    return {};
  }

  private async transition(
    userId: string,
    call: Awaited<ReturnType<CallsService['requireOwner']>>,
    status: CallStatus,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.call.update({
        where: { id: call.id },
        data: { status, closedAt: status === CallStatus.CLOSED ? new Date() : null },
        include: callInclude,
      });
      await this.recordTransition(transaction, userId, call.id, call.status, status, reason);
      return this.toVisibleCall(updated, 'OWNER');
    });
  }

  private async recordTransition(
    transaction: Prisma.TransactionClient,
    actorUserId: string,
    callId: string,
    previousStatus: CallStatus,
    newStatus: CallStatus,
    reason?: string,
  ) {
    await transaction.callStatusHistory.create({
      data: {
        callId,
        previousStatus,
        newStatus,
        changedByUserId: actorUserId,
        reason: reason?.trim(),
      },
    });
    await this.audit(transaction, actorUserId, AuditAction.STATUS_CHANGE, callId, {
      previousStatus,
      newStatus,
      reason,
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
      data: { actorUserId, action, entityType: 'Call', entityId, metadata },
    });
  }

  private toVisibleCall(
    call: Prisma.CallGetPayload<{ include: typeof callInclude }>,
    view: 'PUBLIC' | 'REGISTERED' | 'OWNER',
  ) {
    const base = {
      ...call,
      estimatedPayment: call.estimatedPayment?.toString() ?? null,
      view,
      isOwner: view === 'OWNER',
    };
    if (view === 'PUBLIC') {
      return {
        ...base,
        offeredConditions: null,
        technicalRequirements: null,
        creator: null,
      };
    }
    return base;
  }

  private normalizeTags(values: string[]) {
    return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  }
}
