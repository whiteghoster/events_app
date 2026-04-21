import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, IsIn } from 'class-validator';
import { UserRole, SELF_REGISTERABLE_ROLES } from '../../common/types';

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(SELF_REGISTERABLE_ROLES, { message: 'Role must be admin, karigar or manager' })
  role: UserRole;
}