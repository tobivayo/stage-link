import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

import { ExperienceLevel, ProfileStatus, Visibility } from '../../../generated/prisma/enums';

export class ProfileLinkInputDto {
  @IsString()
  @Length(1, 60)
  label: string;

  @IsUrl({ require_protocol: true })
  @Length(1, 500)
  url: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

export class LocationInputDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsString()
  @Length(1, 160)
  addressLine1: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  addressLine2?: string;

  @IsString()
  @Length(1, 100)
  city: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  region?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  postalCode?: string;

  @IsString()
  @Length(2, 2)
  countryCode: string;
}

export class CreateMusicianProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  stageName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  bio?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  instruments: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  genres: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  influences?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  experience?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  previousProjects?: string[];

  @IsBoolean()
  availableForProjects: boolean;

  @IsOptional()
  @IsBoolean()
  isSoloProject?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  locationText?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @Length(1, 500)
  photoUrl?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsEnum(Visibility)
  locationVisibility?: Visibility;

  @IsOptional()
  @IsEnum(ProfileStatus)
  status?: ProfileStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkInputDto)
  links?: ProfileLinkInputDto[];
}

export class UpdateMusicianProfileDto extends PartialType(CreateMusicianProfileDto) {}

export class CreateVenueProfileDto {
  @IsString()
  @Length(1, 140)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsObject()
  availability?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 100)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Length(3, 40)
  contactPhone?: string;

  @IsOptional()
  @IsEnum(Visibility)
  contactVisibility?: Visibility;

  @IsOptional()
  @IsEnum(Visibility)
  addressVisibility?: Visibility;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ValidateNested()
  @Type(() => LocationInputDto)
  location: LocationInputDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkInputDto)
  links?: ProfileLinkInputDto[];
}

export class UpdateVenueProfileDto extends PartialType(CreateVenueProfileDto) {}

export class CreateProviderProfileDto {
  @IsString()
  @Length(1, 140)
  businessName: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  serviceTags: string[];

  @IsOptional()
  @IsString()
  @Length(1, 200)
  coverageArea?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Length(3, 40)
  contactPhone?: string;

  @IsOptional()
  @IsEnum(Visibility)
  contactVisibility?: Visibility;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationInputDto)
  location?: LocationInputDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkInputDto)
  links?: ProfileLinkInputDto[];
}

export class UpdateProviderProfileDto extends PartialType(CreateProviderProfileDto) {}
