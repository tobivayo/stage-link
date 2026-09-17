import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { MemberSearchApplicationStatus } from '../../../generated/prisma/enums';

export class CreateMemberSearchApplicationDto {
  @IsOptional()
  @IsString()
  @Length(1, 1500)
  message?: string;
}

export class UpdateMemberSearchApplicationStatusDto {
  @IsEnum(MemberSearchApplicationStatus)
  status: MemberSearchApplicationStatus;
}
