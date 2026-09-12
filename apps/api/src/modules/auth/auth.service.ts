import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';

import type { JwtPayload } from '../../common/auth/authenticated-user.interface';
import type { Environment } from '../../config/environment';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuditAction, UserRoleStatus } from '../../generated/prisma/enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ConflictException('An account already exists for this email');
    }

    const passwordHash = await hash(input.password);

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const baseRole = await transaction.role.findUnique({ where: { code: 'USER' } });
        if (!baseRole) {
          throw new ServiceUnavailableException('Base roles are not seeded');
        }

        const created = await transaction.user.create({
          data: {
            email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            locationText: input.locationText,
            termsAcceptedAt: new Date(),
            preferences: { create: {} },
            roles: {
              create: { roleId: baseRole.id, status: UserRoleStatus.ACTIVE },
            },
          },
          include: UsersService.safeUserInclude,
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: created.id,
            action: AuditAction.REGISTER,
            entityType: 'User',
            entityId: created.id,
            metadata: { termsAcceptedAt: created.termsAcceptedAt?.toISOString() },
          },
        });

        return created;
      });

      return this.createAuthResponse(user);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('An account already exists for this email');
      }
      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: UsersService.safeUserInclude,
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.deletedAt ||
      !user.passwordHash ||
      !(await verify(user.passwordHash, input.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      this.prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: AuditAction.LOGIN,
          entityType: 'User',
          entityId: user.id,
        },
      }),
    ]);

    return this.createAuthResponse(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: userId,
      },
    });
  }

  private async createAuthResponse(user: Parameters<UsersService['toSafeUser']>[0]) {
    const expiresInSeconds = this.config.get('JWT_EXPIRES_IN', { infer: true });
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn: `${expiresInSeconds}s`,
      user: this.usersService.toSafeUser(user),
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
