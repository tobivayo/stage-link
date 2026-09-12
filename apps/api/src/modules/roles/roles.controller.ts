import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RequireRoles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { RoleCodeParamDto } from './dto/role-code-param.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  listAvailable() {
    return this.rolesService.listAvailable();
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.rolesService.listForUser(user.id);
  }

  @Post(':code/activate')
  activate(@CurrentUser() user: AuthenticatedRequestUser, @Param() params: RoleCodeParamDto) {
    return this.rolesService.requestActivation(user.id, params.code);
  }

  @Delete(':code')
  deactivate(@CurrentUser() user: AuthenticatedRequestUser, @Param() params: RoleCodeParamDto) {
    return this.rolesService.deactivate(user.id, params.code);
  }

  @Get('admin-check')
  @RequireRoles('ADMIN')
  adminCheck() {
    return { authorized: true };
  }
}
