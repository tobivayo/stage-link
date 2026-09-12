import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequestUser } from './authenticated-user.interface';

type AuthenticatedRequest = Request & { user: AuthenticatedRequestUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
