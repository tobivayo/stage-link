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
  ApplicationStatus,
  AuditAction,
  CallApplicantType,
  CallStatus,
  ProfileStatus,
  Visibility,
} from '../../generated/prisma/enums';
import { CallsService } from '../calls/calls.service';
import {
  ApplicationActionDto,
  CreateCallApplicationDto,
  ListCallApplicationsDto,
} from './dto/call-application.dto';

const applicationInclude = {
  call: {
    select: {
      id: true,
      title: true,
      proposedDateTime: true,
      status: true,
      creatorUserId: true,
      maxSelectedApplicants: true,
    },
  },
  musicianProfile: {
    include: {
      user: { select: { firstName: true, lastName: true } },
      portfolioItems: {
        where: {
          deletedAt: null,
          visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
        },
        select: { id: true, title: true, type: true, url: true, description: true },
        take: 10,
      },
    },
  },
  bandProject: {
    include: {
      portfolioItems: {
        where: {
          deletedAt: null,
          visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
        },
        select: { id: true, title: true, type: true, url: true, description: true },
        take: 10,
      },
    },
  },
  confirmation: true,
} satisfies Prisma.ApplicationInclude;

@Injectable()
export class CallApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly callsService: CallsService,
  ) {}

  async apply(userId: string, callId: string, input: CreateCallApplicationDto) {
    const call = await this.prisma.call.findFirst({
      where: {
        id: callId,
        status: CallStatus.OPEN,
        deletedAt: null,
        visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED_ONLY] },
      },
    });
    if (!call) throw new NotFoundException('Open visible call was not found');
    if (call.closesAt && call.closesAt <= new Date()) {
      throw new BadRequestException('The application period has ended');
    }
    if (call.creatorUserId === userId)
      throw new BadRequestException('You cannot apply to your own call');
    const applicant = await this.resolveApplicant(userId, input);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const application = await transaction.application.create({
          data: {
            callId,
            submittedByUserId: userId,
            applicantType: input.applicantType,
            ...applicant,
            message: input.message?.trim(),
            technicalNeeds: input.technicalNeeds?.trim(),
            requestedPayment: input.requestedPayment,
            currency: input.currency?.toUpperCase(),
          },
          include: applicationInclude,
        });
        await this.audit(transaction, userId, AuditAction.CREATE, application.id, {
          callId,
          applicantType: input.applicantType,
        });
        return this.mapApplication(application);
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('This applicant already applied to the call');
      }
      throw error;
    }
  }

  async getReceived(userId: string, callId: string, input: ListCallApplicationsDto) {
    await this.callsService.requireOwner(userId, callId);
    const where: Prisma.ApplicationWhereInput = {
      callId,
      deletedAt: null,
      ...(input.status ? { status: input.status } : {}),
      ...(input.applicantType ? { applicantType: input.applicantType } : {}),
      ...(input.genre
        ? {
            OR: [
              { musicianProfile: { genres: { has: input.genre.trim().toLowerCase() } } },
              { bandProject: { genres: { has: input.genre.trim().toLowerCase() } } },
            ],
          }
        : {}),
    };
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: applicationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: input.limit,
      }),
      this.prisma.application.count({ where }),
    ]);
    return {
      items: items.map((item) => this.mapApplication(item)),
      page: input.page,
      limit: input.limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async getMine(userId: string) {
    const items = await this.prisma.application.findMany({
      where: { submittedByUserId: userId, deletedAt: null },
      include: applicationInclude,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.mapApplication(item));
  }

  async getById(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: applicationInclude,
    });
    if (!application) throw new NotFoundException('Application was not found');
    if (application.submittedByUserId !== userId && application.call.creatorUserId !== userId) {
      throw new ForbiddenException('You cannot view this application');
    }
    return this.mapApplication(application);
  }

  async withdraw(userId: string, id: string, input: ApplicationActionDto) {
    const application = await this.findOwnedApplication(userId, id);
    if (
      !new Set<ApplicationStatus>([
        ApplicationStatus.PENDING,
        ApplicationStatus.REVIEWED,
        ApplicationStatus.PRESELECTED,
      ]).has(application.status)
    ) {
      throw new BadRequestException('This application can no longer be withdrawn');
    }
    return this.updateStatus(userId, application, ApplicationStatus.WITHDRAWN, input.reason);
  }

  async review(userId: string, id: string, input: ApplicationActionDto) {
    const application = await this.findManagedApplication(userId, id);
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be reviewed');
    }
    return this.updateStatus(userId, application, ApplicationStatus.REVIEWED, input.reason);
  }

  async preselect(userId: string, id: string, input: ApplicationActionDto) {
    const application = await this.findManagedApplication(userId, id);
    if (
      !new Set<ApplicationStatus>([ApplicationStatus.PENDING, ApplicationStatus.REVIEWED]).has(
        application.status,
      )
    ) {
      throw new BadRequestException('Only pending or reviewed applications can be preselected');
    }
    return this.updateStatus(userId, application, ApplicationStatus.PRESELECTED, input.reason);
  }

  async removePreselection(userId: string, id: string, input: ApplicationActionDto) {
    const application = await this.findManagedApplication(userId, id);
    if (application.status !== ApplicationStatus.PRESELECTED) {
      throw new BadRequestException('Application is not preselected');
    }
    return this.updateStatus(userId, application, ApplicationStatus.REVIEWED, input.reason);
  }

  private async resolveApplicant(userId: string, input: CreateCallApplicationDto) {
    if (input.applicantType === CallApplicantType.MUSICIAN) {
      const profile = await this.prisma.musicianProfile.findFirst({
        where: {
          ...(input.musicianProfileId ? { id: input.musicianProfileId } : {}),
          userId,
          status: ProfileStatus.ACTIVE,
          deletedAt: null,
        },
      });
      if (!profile) throw new ForbiddenException('An active owned musician profile is required');
      return { musicianProfileId: profile.id };
    }
    if (!input.bandProjectId) throw new BadRequestException('bandProjectId is required');
    const band = await this.prisma.bandProject.findFirst({
      where: { id: input.bandProjectId, ownerUserId: userId, status: 'ACTIVE', deletedAt: null },
    });
    if (!band) throw new ForbiddenException('Only the band administrator can apply for the band');
    return { bandProjectId: band.id };
  }

  private async findOwnedApplication(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({ where: { id, deletedAt: null } });
    if (!application) throw new NotFoundException('Application was not found');
    if (application.submittedByUserId !== userId)
      throw new ForbiddenException('Only the applicant can withdraw');
    return application;
  }

  private async findManagedApplication(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: { call: true },
    });
    if (!application) throw new NotFoundException('Application was not found');
    if (application.call.creatorUserId !== userId)
      throw new ForbiddenException('Only the organizer can review applications');
    if (
      !new Set<CallStatus>([CallStatus.OPEN, CallStatus.IN_REVIEW]).has(application.call.status)
    ) {
      throw new BadRequestException('This call is not accepting review changes');
    }
    return application;
  }

  private async updateStatus(
    userId: string,
    application: { id: string; status: ApplicationStatus },
    status: ApplicationStatus,
    reason?: string,
  ) {
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.application.update({
        where: { id: application.id },
        data: {
          status,
          reviewedAt: status === ApplicationStatus.REVIEWED ? now : undefined,
          preselectedAt:
            status === ApplicationStatus.PRESELECTED
              ? now
              : status === ApplicationStatus.REVIEWED
                ? null
                : undefined,
          withdrawnAt: status === ApplicationStatus.WITHDRAWN ? now : undefined,
        },
        include: applicationInclude,
      });
      await this.audit(transaction, userId, AuditAction.STATUS_CHANGE, application.id, {
        previousStatus: application.status,
        status,
        reason,
      });
      return this.mapApplication(updated);
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
      data: { actorUserId, action, entityType: 'CallApplication', entityId, metadata },
    });
  }

  private mapApplication(
    application: Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>,
  ) {
    const musician = application.musicianProfile;
    const band = application.bandProject;
    return {
      ...application,
      requestedPayment: application.requestedPayment?.toString() ?? null,
      applicant: musician
        ? {
            id: musician.id,
            name: musician.stageName || `${musician.user.firstName} ${musician.user.lastName}`,
            type: CallApplicantType.MUSICIAN,
            genres: musician.genres,
            instruments: musician.instruments,
            experience: musician.experience,
            experienceLevel: musician.experienceLevel,
            locationText:
              musician.locationVisibility === Visibility.PRIVATE ? null : musician.locationText,
            photoUrl: musician.photoUrl,
            portfolio: musician.portfolioItems,
            reputation: null,
          }
        : band
          ? {
              id: band.id,
              name: band.name,
              type: CallApplicantType.BAND_PROJECT,
              genres: band.genres,
              instruments: [],
              experience: null,
              experienceLevel: null,
              locationText:
                band.locationVisibility === Visibility.PRIVATE ? null : band.locationText,
              photoUrl: band.imageUrl,
              portfolio: band.portfolioItems,
              reputation: null,
            }
          : null,
      musicianProfile: undefined,
      bandProject: undefined,
    };
  }
}
