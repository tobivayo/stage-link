import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { RecommendationDecision } from '../../../generated/prisma/enums';

export class RecommendationQueryDto {
  @IsOptional()
  @IsUUID()
  bandProjectId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class RecommendationDecisionDto {
  @IsEnum(RecommendationDecision)
  decision: RecommendationDecision;

  @IsOptional()
  @IsUUID()
  bandProjectId?: string;
}
