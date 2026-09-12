import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { Visibility } from '../../../generated/prisma/enums';

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsBoolean()
  internalNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsEnum(Visibility)
  defaultVisibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  contactAvailability?: boolean;
}
