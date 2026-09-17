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
import {
  CreateMemberSearchDto,
  ListMemberSearchesDto,
  UpdateMemberSearchDto,
} from './dto/member-search.dto';
import { MemberSearchesService } from './member-searches.service';

type OptionalAuthRequest = Request & { user?: AuthenticatedRequestUser | null };

@Controller('member-searches')
export class MemberSearchesController {
  constructor(private readonly memberSearchesService: MemberSearchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreateMemberSearchDto) {
    return this.memberSearchesService.create(user.id, input);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: ListMemberSearchesDto, @Req() request: OptionalAuthRequest) {
    return this.memberSearchesService.list(query, request.user?.id ?? null);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.memberSearchesService.getMine(user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: OptionalAuthRequest) {
    return this.memberSearchesService.getById(id, request.user?.id ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateMemberSearchDto,
  ) {
    return this.memberSearchesService.update(user.id, id, input);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard)
  close(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.memberSearchesService.close(user.id, id);
  }
}
