import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { JwtAuthGuard } from '../src/common/auth/jwt-auth.guard';
import { RequireRoles } from '../src/common/auth/roles.decorator';
import { RolesGuard } from '../src/common/auth/roles.guard';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';
import { UsersService } from '../src/modules/users/users.service';

const secret = 'stagelink_test_secret_with_at_least_32_characters';

@Controller('private-test')
class PrivateTestController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getPrivate() {
    return { ok: true };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles('ADMIN')
  getAdmin() {
    return { admin: true };
  }
}

describe('JWT protected endpoints', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret }),
      ],
      controllers: [PrivateTestController],
      providers: [
        JwtStrategy,
        RolesGuard,
        { provide: ConfigService, useValue: { get: () => secret } },
        {
          provide: UsersService,
          useValue: {
            findActiveAuthUser: () =>
              Promise.resolve({
                id: 'a0c9a2d5-47b7-4f7e-b887-22b831fe7600',
                email: 'ana@example.com',
                roles: [{ status: 'ACTIVE', role: { code: 'USER' } }],
              }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterEach(async () => app?.close());

  it('rejects a request without a token', async () => {
    await request(app.getHttpServer() as Server)
      .get('/private-test')
      .expect(401);
  });

  it('accepts a request with a valid token', async () => {
    const token = await jwtService.signAsync({
      sub: 'a0c9a2d5-47b7-4f7e-b887-22b831fe7600',
      email: 'ana@example.com',
    });

    await request(app.getHttpServer() as Server)
      .get('/private-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, { ok: true });
  });

  it('rejects an authenticated user without the required role', async () => {
    const token = await jwtService.signAsync({
      sub: 'a0c9a2d5-47b7-4f7e-b887-22b831fe7600',
      email: 'ana@example.com',
    });

    await request(app.getHttpServer() as Server)
      .get('/private-test/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
