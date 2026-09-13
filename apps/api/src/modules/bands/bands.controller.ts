import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { CreateBandDto, InviteBandMemberDto, UpdateBandDto } from './dto/band.dto';
import { BandsService } from './bands.service';

type OptionalAuthRequest = Request & { user?: AuthenticatedRequestUser | null };

@Controller('bands')
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreateBandDto) {
    return this.bandsService.create(user.id, input);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.bandsService.getMine(user.id);
  }

  @Get('invitations/me')
  @UseGuards(JwtAuthGuard)
  getMyInvitations(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.bandsService.getMyInvitations(user.id, user.email);
  }

  @Post('invitations/:id/accept')
  @UseGuards(JwtAuthGuard)
  acceptInvitation(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bandsService.respondToInvitation(user.id, user.email, id, true);
  }

  @Post('invitations/:id/reject')
  @UseGuards(JwtAuthGuard)
  rejectInvitation(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bandsService.respondToInvitation(user.id, user.email, id, false);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: OptionalAuthRequest) {
    return this.bandsService.getVisible(id, request.user?.id ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateBandDto,
  ) {
    return this.bandsService.update(user.id, id, input);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  getMembers(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bandsService.getMembers(user.id, id);
  }

  @Post(':id/invitations')
  @UseGuards(JwtAuthGuard)
  invite(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: InviteBandMemberDto,
  ) {
    return this.bandsService.invite(user.id, id, input);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  removeMember(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.bandsService.removeMember(user.id, id, memberId);
  }
}
