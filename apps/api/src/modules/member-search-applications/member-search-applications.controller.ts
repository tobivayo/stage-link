import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import {
  CreateMemberSearchApplicationDto,
  UpdateMemberSearchApplicationStatusDto,
} from './dto/member-search-application.dto';
import { MemberSearchApplicationsService } from './member-search-applications.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MemberSearchApplicationsController {
  constructor(private readonly applicationsService: MemberSearchApplicationsService) {}

  @Post('member-searches/:id/applications')
  apply(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: CreateMemberSearchApplicationDto,
  ) {
    return this.applicationsService.apply(user.id, id, input);
  }

  @Get('member-searches/:id/applications')
  getReceived(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.applicationsService.getReceived(user.id, id);
  }

  @Get('member-search-applications/my')
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.applicationsService.getMine(user.id);
  }

  @Patch('member-search-applications/:id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateMemberSearchApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.id, id, input);
  }
}
