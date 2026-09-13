import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

import { BandStatus, Visibility } from '../../../generated/prisma/enums';
import { ProfileLinkInputDto } from '../../profiles/dto/profile-input.dto';

export class CreateBandDto {
  @IsString()
  @Length(1, 140)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  description?: string;

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
  @Length(1, 160)
  locationText?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsEnum(Visibility)
  locationVisibility?: Visibility;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkInputDto)
  links?: ProfileLinkInputDto[];
}

export class UpdateBandDto extends PartialType(CreateBandDto) {
  @IsOptional()
  @IsEnum(BandStatus)
  status?: BandStatus;
}

export class InviteBandMemberDto {
  @ValidateIf((input: InviteBandMemberDto) => !input.email)
  @IsUUID()
  userId?: string;

  @ValidateIf((input: InviteBandMemberDto) => !input.userId)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['MEMBER', 'REPRESENTATIVE'])
  role?: 'MEMBER' | 'REPRESENTATIVE';

  @IsOptional()
  @IsString()
  @Length(1, 100)
  instrument?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  message?: string;
}
