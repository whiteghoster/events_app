import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

export class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.signIn(
        loginDto.email,
        loginDto.password
      );

      return {
        success: true,
        data: {
          user: result.user,
          access_token: result.access_token,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Public()
  @Post('logout')
  async logout() {
    try {
      await this.authService.signOut();
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Logout failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
