import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const safeUserInclude = {
  preferences: true,
  roles: { include: { role: true }, orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.UserInclude;

type SafeUserRecord = Prisma.UserGetPayload<{ include: typeof safeUserInclude }>;

@Injectable()
export class UsersService {
  static readonly safeUserInclude = safeUserInclude;

  constructor(private readonly prisma: PrismaService) {}

  findActiveAuthUser(id: string) {
    return this.prisma.user.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
  }

  async getSafeUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
      include: safeUserInclude,
    });

    if (!user) {
      throw new UnauthorizedException('User is not available');
    }

    return this.toSafeUser(user);
  }

  toSafeUser(user: SafeUserRecord) {
    if (!user.preferences) {
      throw new Error(`Preferences are missing for user ${user.id}`);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      locationText: user.locationText,
      roles: user.roles.map((assignment) => ({
        code: assignment.role.code,
        name: assignment.role.name,
        description: assignment.role.description,
        status: assignment.status,
        requiresProfileCompletion: assignment.status === 'PENDING_PROFILE',
      })),
      preferences: {
        internalNotificationsEnabled: user.preferences.internalNotificationsEnabled,
        pushNotificationsEnabled: user.preferences.pushNotificationsEnabled,
        emailNotificationsEnabled: user.preferences.emailNotificationsEnabled,
        defaultVisibility: user.preferences.defaultVisibility,
        contactAvailability: user.preferences.contactAvailability,
      },
    };
  }
}
