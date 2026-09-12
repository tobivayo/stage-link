import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type {
  AuthenticatedRequestUser,
  JwtPayload,
} from '../../common/auth/authenticated-user.interface';
import type { Environment } from '../../config/environment';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) config: ConfigService<Environment, true>,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedRequestUser> {
    const user = await this.usersService.findActiveAuthUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired credentials');
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles
        .filter((assignment) => assignment.status === 'ACTIVE')
        .map((assignment) => assignment.role.code),
    };
  }
}
