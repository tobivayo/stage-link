import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuditAction } from '../../generated/prisma/enums';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({ where: { userId } });
    if (!preferences) {
      throw new NotFoundException('User preferences were not found');
    }
    return this.toResponse(preferences);
  }

  async updateForUser(userId: string, input: UpdateUserPreferencesDto) {
    return this.prisma.$transaction(async (transaction) => {
      const preferences = await transaction.userPreferences.update({
        where: { userId },
        data: input,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          action: AuditAction.PREFERENCES_UPDATE,
          entityType: 'UserPreferences',
          entityId: preferences.id,
          metadata: { changedFields: Object.keys(input) },
        },
      });

      return this.toResponse(preferences);
    });
  }

  private toResponse(preferences: {
    internalNotificationsEnabled: boolean;
    pushNotificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    defaultVisibility: string;
    contactAvailability: boolean;
  }) {
    return {
      internalNotificationsEnabled: preferences.internalNotificationsEnabled,
      pushNotificationsEnabled: preferences.pushNotificationsEnabled,
      emailNotificationsEnabled: preferences.emailNotificationsEnabled,
      defaultVisibility: preferences.defaultVisibility,
      contactAvailability: preferences.contactAvailability,
    };
  }
}
