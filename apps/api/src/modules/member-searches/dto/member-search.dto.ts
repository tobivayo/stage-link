import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

import {
  ExperienceLevel,
  MemberSearchStatus,
  SearchModality,
  Visibility,
} from '../../../generated/prisma/enums';

export class CreateMemberSearchDto {
  @IsOptional()
  @IsUUID()
  bandProjectId?: string;

  @IsString()
  @Length(3, 140)
  title: string;

  @IsString()
  @Length(10, 3000)
  description: string;

  @IsString()
  @Length(1, 80)
  requiredInstrument: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  genres: string[];

  @IsOptional()
  @IsEnum(ExperienceLevel)
  desiredExperience?: ExperienceLevel;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  expectedAvailability?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  locationText?: string;

  @IsEnum(SearchModality)
  modality: SearchModality;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

export class UpdateMemberSearchDto extends PartialType(CreateMemberSearchDto) {
  @IsOptional()
  @IsEnum(MemberSearchStatus)
  status?: MemberSearchStatus;
}

export class ListMemberSearchesDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  instrument?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  genre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  location?: string;

  @IsOptional()
  @IsEnum(SearchModality)
  modality?: SearchModality;

  @IsOptional()
  @IsEnum(MemberSearchStatus)
  status: MemberSearchStatus = MemberSearchStatus.OPEN;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
