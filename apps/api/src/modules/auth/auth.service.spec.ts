import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';

vi.mock('argon2', () => ({ hash: vi.fn(), verify: vi.fn() }));

const safeUser = {
  id: 'a0c9a2d5-47b7-4f7e-b887-22b831fe7600',
  email: 'ana@example.com',
  passwordHash: 'hashed-password',
  firstName: 'Ana',
  lastName: 'Rojas',
  locationText: 'Rosario',
  status: 'ACTIVE',
  termsAcceptedAt: new Date(),
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  preferences: {
    id: 'preference-id',
    userId: 'a0c9a2d5-47b7-4f7e-b887-22b831fe7600',
    locale: 'es-AR',
    timezone: 'America/Argentina/Buenos_Aires',
    internalNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    defaultVisibility: 'REGISTERED_ONLY',
    contactAvailability: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  roles: [
    {
      id: 'assignment-id',
      userId: 'a0c9a2d5-47b7-4f7e-b887-22b831fe7600',
      roleId: 'role-id',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deactivatedAt: null,
      role: {
        id: 'role-id',
        code: 'USER',
        name: 'Usuario',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ],
};

describe('AuthService', () => {
  const transaction = {
    role: { findUnique: vi.fn() },
    user: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  const usersService = {
    toSafeUser: vi.fn(() => ({ id: safeUser.id, email: safeUser.email })),
  };
  const jwtService = { signAsync: vi.fn(() => Promise.resolve('signed-token')) };
  const config = { get: vi.fn(() => 900) };
  let service: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new AuthService(
      prisma as never,
      usersService as never,
      jwtService as never,
      config as never,
    );
  });

  it('registers a user, hashes the password and returns a token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    transaction.role.findUnique.mockResolvedValue({ id: 'role-id' });
    transaction.user.create.mockResolvedValue(safeUser);
    transaction.auditLog.create.mockResolvedValue({});
    prisma.$transaction.mockImplementation((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    );
    vi.mocked(hash).mockResolvedValue('hashed-password');

    const result = await service.register({
      firstName: 'Ana',
      lastName: 'Rojas',
      email: 'ana@example.com',
      password: 'Segura#1234',
      termsAccepted: true,
    });

    expect(hash).toHaveBeenCalledWith('Segura#1234');
    expect(transaction.user.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('signed-token');
  });

  it('rejects a duplicated email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: safeUser.id });

    await expect(
      service.register({
        firstName: 'Ana',
        lastName: 'Rojas',
        email: 'ana@example.com',
        password: 'Segura#1234',
        termsAccepted: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(safeUser);
    prisma.$transaction.mockResolvedValue([]);
    vi.mocked(verify).mockResolvedValue(true);

    const result = await service.login({ email: 'ana@example.com', password: 'Segura#1234' });

    expect(result.accessToken).toBe('signed-token');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('uses a generic error for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
