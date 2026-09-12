import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuditAction, UserRoleStatus } from '../../generated/prisma/enums';
import { SELF_MANAGEABLE_ROLE_CODES } from './dto/role-code-param.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAvailable() {
    const roles = await this.prisma.role.findMany({ orderBy: { code: 'asc' } });
    return roles.map((role) => ({
      code: role.code,
      name: role.name,
      description: role.description,
      canSelfManage: SELF_MANAGEABLE_ROLE_CODES.some((code) => code === role.code),
      requiresProfileCompletion: SELF_MANAGEABLE_ROLE_CODES.some((code) => code === role.code),
    }));
  }

  async listForUser(userId: string) {
    const assignments = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });
    return assignments.map((assignment) => this.toResponse(assignment));
  }

  async requestActivation(userId: string, code: (typeof SELF_MANAGEABLE_ROLE_CODES)[number]) {
    const role = await this.prisma.role.findUnique({ where: { code } });
    if (!role) {
      throw new NotFoundException('Role is not available');
    }

    return this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        create: { userId, roleId: role.id, status: UserRoleStatus.PENDING_PROFILE },
        update: { status: UserRoleStatus.PENDING_PROFILE, deactivatedAt: null },
        include: { role: true },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.ROLE_ACTIVATE,
          entityType: 'UserRole',
          entityId: assignment.id,
          metadata: { roleCode: code, status: assignment.status },
        },
      });

      return this.toResponse(assignment);
    });
  }

  async deactivate(userId: string, code: (typeof SELF_MANAGEABLE_ROLE_CODES)[number]) {
    const assignment = await this.prisma.userRole.findFirst({
      where: { userId, role: { code } },
      include: { role: true },
    });
    if (!assignment) {
      throw new NotFoundException('Role assignment was not found');
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.userRole.update({
        where: { id: assignment.id },
        data: { status: UserRoleStatus.INACTIVE, deactivatedAt: new Date() },
        include: { role: true },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.ROLE_DEACTIVATE,
          entityType: 'UserRole',
          entityId: assignment.id,
          metadata: { roleCode: code },
        },
      });

      return this.toResponse(updated);
    });
  }

  private toResponse(assignment: {
    status: UserRoleStatus;
    role: { code: string; name: string; description: string | null };
  }) {
    return {
      code: assignment.role.code,
      name: assignment.role.name,
      description: assignment.role.description,
      status: assignment.status,
      requiresProfileCompletion: assignment.status === UserRoleStatus.PENDING_PROFILE,
    };
  }
}
