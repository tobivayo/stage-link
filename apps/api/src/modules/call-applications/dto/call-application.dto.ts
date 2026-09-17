import { Type } from 'class-transformer';
import {
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

import { ApplicationStatus, CallApplicantType } from '../../../generated/prisma/enums';

export class CreateCallApplicationDto {
  @IsEnum(CallApplicantType)
  applicantType: CallApplicantType;

  @IsOptional()
  @IsUUID()
  musicianProfileId?: string;

  @IsOptional()
  @IsUUID()
  bandProjectId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  message?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  technicalNeeds?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  requestedPayment?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

export class ListCallApplicationsDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsEnum(CallApplicantType)
  applicantType?: CallApplicantType;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  genre?: string;

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

export class ApplicationActionDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
