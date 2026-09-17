import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { SearchMusiciansDto } from './dto/search-musicians.dto';
import { MusicianSearchService } from './musician-search.service';

type OptionalAuthRequest = Request & { user?: AuthenticatedRequestUser | null };

@Controller('musicians')
@UseGuards(OptionalJwtAuthGuard)
export class MusicianSearchController {
  constructor(private readonly musicianSearchService: MusicianSearchService) {}

  @Get('search')
  search(@Query() query: SearchMusiciansDto, @Req() request: OptionalAuthRequest) {
    return this.musicianSearchService.search(query, request.user?.id ?? null);
  }

  @Get(':id/public')
  getPublic(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: OptionalAuthRequest) {
    return this.musicianSearchService.getPublicProfile(id, request.user?.id ?? null);
  }
}
