import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserPreferencesService } from './user-preferences.service';

@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.preferencesService.getForUser(user.id);
  }

  @Patch('me')
  updateMine(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateUserPreferencesDto,
  ) {
    return this.preferencesService.updateForUser(user.id, input);
  }
}
