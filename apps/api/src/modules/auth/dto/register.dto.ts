import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  firstName: string;

  @Transform(trim)
  @IsString()
  @Length(1, 80)
  lastName: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @Length(3, 254)
  email: string;

  @IsString()
  @Length(10, 128)
  @Matches(/[a-z]/, { message: 'password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/\d/, { message: 'password must contain a number' })
  @Matches(/[^A-Za-z0-9]/, { message: 'password must contain a symbol' })
  password: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 160)
  locationText?: string;

  @IsBoolean()
  @Equals(true, { message: 'termsAccepted must be true' })
  termsAccepted: true;
}
