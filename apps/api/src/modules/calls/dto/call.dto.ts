import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';

import {
  CallOrganizerType,
  CallStatus,
  CallType,
  Visibility,
} from '../../../generated/prisma/enums';

export class CreateCallDto {
  @IsEnum(CallOrganizerType)
  organizerType: CallOrganizerType;

  @IsOptional()
  @IsUUID()
  musicianProfileId?: string;

  @IsOptional()
  @IsUUID()
  bandProjectId?: string;

  @IsOptional()
  @IsUUID()
  venueProfileId?: string;

  @IsEnum(CallType)
  type: CallType;

  @IsString()
  @Length(3, 160)
  title: string;

  @IsString()
  @Length(10, 5000)
  description: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  eventName?: string;

  @IsDateString()
  proposedDateTime: string;

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  locationText?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  genres: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  preferredStyles?: string[];

  @IsInt()
  @Min(1)
  @Max(100)
  maxSelectedApplicants: number;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  offeredConditions?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedPayment?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  technicalRequirements?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

export class UpdateCallDto extends PartialType(
  OmitType(CreateCallDto, [
    'organizerType',
    'musicianProfileId',
    'bandProjectId',
    'venueProfileId',
  ] as const),
) {}

export class ListCallsDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  genre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  location?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(CallType)
  type?: CallType;

  @IsOptional()
  @IsEnum(CallStatus)
  status: CallStatus = CallStatus.OPEN;

  @IsOptional()
  @IsUUID()
  venueProfileId?: string;

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

export class ChangeCallStatusDto {
  @IsEnum(CallStatus)
  status: CallStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

export class CancelCallDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

export class ReopenCallDto {
  @IsOptional()
  @IsEnum(CallStatus)
  status: CallStatus = CallStatus.OPEN;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
