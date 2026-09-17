import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CallSelectionService } from './call-selection.service';
import { SelectCallApplicantsDto } from './dto/call-selection.dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallSelectionController {
  constructor(private readonly selectionService: CallSelectionService) {}

  @Post(':id/select-applicants')
  select(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: SelectCallApplicantsDto,
  ) {
    return this.selectionService.select(user.id, id, input);
  }
}
