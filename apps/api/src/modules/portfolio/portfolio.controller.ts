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
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto/portfolio.dto';
import { PortfolioService } from './portfolio.service';

type OptionalAuthRequest = Request & { user?: AuthenticatedRequestUser | null };

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreatePortfolioItemDto) {
    return this.portfolioService.create(user.id, input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.portfolioService.getMine(user.id);
  }

  @Get('profile/:type/:id')
  @UseGuards(OptionalJwtAuthGuard)
  getForProfile(
    @Param('type') type: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: OptionalAuthRequest,
  ) {
    return this.portfolioService.getForProfile(type, id, request.user?.id ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdatePortfolioItemDto,
  ) {
    return this.portfolioService.update(user.id, id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.portfolioService.remove(user.id, id);
  }

  @Post(':id/share-on-my-profile')
  @UseGuards(JwtAuthGuard)
  shareOnMine(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.portfolioService.shareOnMyProfile(user.id, id);
  }

  @Delete(':id/share-on-my-profile')
  @UseGuards(JwtAuthGuard)
  unshareFromMine(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.portfolioService.unshareFromMyProfile(user.id, id);
  }
}
