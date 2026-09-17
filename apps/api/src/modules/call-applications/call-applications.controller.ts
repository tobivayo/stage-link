import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CallApplicationsService } from './call-applications.service';
import {
  ApplicationActionDto,
  CreateCallApplicationDto,
  ListCallApplicationsDto,
} from './dto/call-application.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CallApplicationsController {
  constructor(private readonly applicationsService: CallApplicationsService) {}

  @Post('calls/:id/applications')
  apply(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: CreateCallApplicationDto,
  ) {
    return this.applicationsService.apply(user.id, id, input);
  }

  @Get('calls/:id/applications')
  getReceived(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListCallApplicationsDto,
  ) {
    return this.applicationsService.getReceived(user.id, id, query);
  }

  @Get('call-applications/my')
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.applicationsService.getMine(user.id);
  }

  @Get('call-applications/:id')
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.applicationsService.getById(user.id, id);
  }

  @Post('call-applications/:id/withdraw')
  withdraw(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ApplicationActionDto,
  ) {
    return this.applicationsService.withdraw(user.id, id, input);
  }

  @Post('call-applications/:id/review')
  review(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ApplicationActionDto,
  ) {
    return this.applicationsService.review(user.id, id, input);
  }

  @Post('call-applications/:id/preselect')
  preselect(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ApplicationActionDto,
  ) {
    return this.applicationsService.preselect(user.id, id, input);
  }

  @Post('call-applications/:id/remove-preselection')
  removePreselection(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ApplicationActionDto,
  ) {
    return this.applicationsService.removePreselection(user.id, id, input);
  }
}
