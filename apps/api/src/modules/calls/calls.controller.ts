import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { CallsService } from './calls.service';
import {
  CancelCallDto,
  ChangeCallStatusDto,
  CreateCallDto,
  ListCallsDto,
  ReopenCallDto,
  UpdateCallDto,
} from './dto/call.dto';

type OptionalAuthRequest = Request & { user?: AuthenticatedRequestUser | null };

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreateCallDto) {
    return this.callsService.create(user.id, input);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: ListCallsDto, @Req() request: OptionalAuthRequest) {
    return this.callsService.list(query, request.user?.id ?? null);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.callsService.getMine(user.id);
  }

  @Get(':id/status-history')
  @UseGuards(JwtAuthGuard)
  getStatusHistory(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.callsService.getStatusHistory(user.id, id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: OptionalAuthRequest) {
    return this.callsService.getById(id, request.user?.id ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateCallDto,
  ) {
    return this.callsService.update(user.id, id, input);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  changeStatus(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ChangeCallStatusDto,
  ) {
    return this.callsService.changeStatus(user.id, id, input);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: CancelCallDto,
  ) {
    return this.callsService.cancel(user.id, id, input);
  }

  @Post(':id/reopen')
  @UseGuards(JwtAuthGuard)
  reopen(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ReopenCallDto,
  ) {
    return this.callsService.reopen(user.id, id, input);
  }
}
