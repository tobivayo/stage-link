import type { Visibility } from '../enums/visibility.enum.js';

export const ROLE_CODES = [
  'USER',
  'MUSICIAN',
  'BAND_ADMIN',
  'VENUE_ADMIN',
  'PROVIDER',
  'ADMIN',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];
export type UserRoleStatus = 'ACTIVE' | 'PENDING_PROFILE' | 'INACTIVE';

export interface UserPreferencesDto {
  internalNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  defaultVisibility: Visibility;
  contactAvailability: boolean;
}

export interface UserRoleDto {
  code: RoleCode;
  name: string;
  description: string | null;
  status: UserRoleStatus;
  requiresProfileCompletion: boolean;
}

export interface AuthenticatedUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  locationText: string | null;
  roles: UserRoleDto[];
  preferences: UserPreferencesDto;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthenticatedUserDto;
}

export interface RegisterRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  locationText?: string;
  termsAccepted: true;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export type UpdateUserPreferencesDto = Partial<UserPreferencesDto>;
