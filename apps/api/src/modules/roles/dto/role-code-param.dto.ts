import { IsIn } from 'class-validator';

export const SELF_MANAGEABLE_ROLE_CODES = [
  'MUSICIAN',
  'BAND_ADMIN',
  'VENUE_ADMIN',
  'PROVIDER',
] as const;

export class RoleCodeParamDto {
  @IsIn(SELF_MANAGEABLE_ROLE_CODES)
  code: (typeof SELF_MANAGEABLE_ROLE_CODES)[number];
}
