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
import { RecommendationDecisionDto, RecommendationQueryDto } from './dto/recommendations.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('musicians')
  getMusicians(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: RecommendationQueryDto,
  ) {
    return this.recommendationsService.getMusicians(user.id, query);
  }

  @Post('musicians/:id/decision')
  decide(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: RecommendationDecisionDto,
  ) {
    return this.recommendationsService.decide(user.id, id, input);
  }
}
