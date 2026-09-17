import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

import { ExperienceLevel } from '../../../generated/prisma/enums';

export enum MusicianSearchSort {
  COMPATIBILITY = 'COMPATIBILITY',
  LOCATION = 'LOCATION',
  EXPERIENCE = 'EXPERIENCE',
  RECENT = 'RECENT',
}

export class SearchMusiciansDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  query?: string;

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
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  influence?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inBand?: boolean;

  @IsOptional()
  @IsEnum(MusicianSearchSort)
  sort: MusicianSearchSort = MusicianSearchSort.COMPATIBILITY;

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
