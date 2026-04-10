import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/**
 * Auth Controller
 * Handles user authentication, registration, and session management
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login endpoint
   * Returns JWT access token and refresh token
   */
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
          refresh_token: result.refresh_token,
          expires_at: result.expires_at,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Login failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Token refresh endpoint
   * Issues new access token using a valid refresh token
   */
  @Public()
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const result = await this.authService.refreshToken(refreshTokenDto.refresh_token);

      return {
        success: true,
        data: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          expires_at: result.expires_at,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * User registration endpoint
   * Only Admin registration is currently allowed through this public endpoint
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authService.register(registerDto);

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Registration failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * User logout endpoint
   */
  @Public()
  @Post('logout')
  async logout() {
    try {
      await this.authService.signOut();
      return { success: true };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Logout failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}