import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';

import { PortfolioItemType, Visibility } from '../../../generated/prisma/enums';

export class CreatePortfolioItemDto {
  @IsIn(['musician', 'band'])
  profileType: 'musician' | 'band';

  @IsUUID()
  profileId: string;

  @IsEnum(PortfolioItemType)
  type: PortfolioItemType;

  @IsString()
  @Length(1, 160)
  title: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsUrl({ require_protocol: true })
  @Length(1, 1000)
  url: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  experienceRef?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdatePortfolioItemDto {
  @IsOptional()
  @IsEnum(PortfolioItemType)
  type?: PortfolioItemType;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @Length(1, 1000)
  url?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  experienceRef?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}
