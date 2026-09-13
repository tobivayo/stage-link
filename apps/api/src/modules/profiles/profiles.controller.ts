import {
  Body,
  Controller,
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
import {
  CreateMusicianProfileDto,
  CreateProviderProfileDto,
  CreateVenueProfileDto,
  UpdateMusicianProfileDto,
  UpdateProviderProfileDto,
  UpdateVenueProfileDto,
} from './dto/profile-input.dto';
import { ProfilesService } from './profiles.service';

type OptionalAuthRequest = Request & { user?: AuthenticatedRequestUser | null };

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.profilesService.getMine(user.id);
  }

  @Get('public/:type/:id')
  @UseGuards(OptionalJwtAuthGuard)
  getPublic(
    @Param('type') type: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: OptionalAuthRequest,
  ) {
    return this.profilesService.getVisibleProfile(type, id, request.user?.id ?? null);
  }

  @Post('musician')
  @UseGuards(JwtAuthGuard)
  createMusician(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateMusicianProfileDto,
  ) {
    return this.profilesService.createMusician(user.id, input);
  }

  @Get('musician/me')
  @UseGuards(JwtAuthGuard)
  getMyMusician(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.profilesService.getMyMusician(user.id);
  }

  @Patch('musician/me')
  @UseGuards(JwtAuthGuard)
  updateMyMusician(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateMusicianProfileDto,
  ) {
    return this.profilesService.updateMusician(user.id, input);
  }

  @Post('venue')
  @UseGuards(JwtAuthGuard)
  createVenue(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreateVenueProfileDto) {
    return this.profilesService.createVenue(user.id, input);
  }

  @Get('venue/me')
  @UseGuards(JwtAuthGuard)
  getMyVenues(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.profilesService.getMyVenues(user.id);
  }

  @Patch('venue/:id')
  @UseGuards(JwtAuthGuard)
  updateVenue(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateVenueProfileDto,
  ) {
    return this.profilesService.updateVenue(user.id, id, input);
  }

  @Post('provider')
  @UseGuards(JwtAuthGuard)
  createProvider(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateProviderProfileDto,
  ) {
    return this.profilesService.createProvider(user.id, input);
  }

  @Get('provider/me')
  @UseGuards(JwtAuthGuard)
  getMyProviders(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.profilesService.getMyProviders(user.id);
  }

  @Patch('provider/:id')
  @UseGuards(JwtAuthGuard)
  updateProvider(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateProviderProfileDto,
  ) {
    return this.profilesService.updateProvider(user.id, id, input);
  }
}
