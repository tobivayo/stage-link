import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { ContactIntentSource, ContactTargetType } from '../../../generated/prisma/enums';

export class CreateContactIntentDto {
  @IsEnum(ContactTargetType)
  targetProfileType: ContactTargetType;

  @IsUUID()
  targetProfileId: string;

  @IsEnum(ContactIntentSource)
  sourceType: ContactIntentSource;

  @IsOptional()
  @IsUUID()
  sourceEntityId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  message?: string;
}
