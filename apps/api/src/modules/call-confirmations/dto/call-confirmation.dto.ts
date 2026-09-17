import { IsOptional, IsString, Length } from 'class-validator';

export class DeclineCallConfirmationDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
