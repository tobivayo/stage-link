import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CallConfirmationsService } from './call-confirmations.service';
import { DeclineCallConfirmationDto } from './dto/call-confirmation.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CallConfirmationsController {
  constructor(private readonly confirmationsService: CallConfirmationsService) {}

  @Get('calls/:id/confirmations')
  getForCall(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.confirmationsService.getForCall(user.id, id);
  }

  @Post('call-confirmations/:id/confirm')
  confirm(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.confirmationsService.confirm(user.id, id);
  }

  @Post('call-confirmations/:id/decline')
  decline(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: DeclineCallConfirmationDto,
  ) {
    return this.confirmationsService.decline(user.id, id, input);
  }
}
