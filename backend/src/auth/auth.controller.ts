import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);

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
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authService.register(registerDto);

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        HttpStatus.BAD_REQUEST,
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
