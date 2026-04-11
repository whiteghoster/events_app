import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AuthService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
  }

  private get supabase() {
    return this.databaseService.getClient();
  }

  /**
   * PUBLIC REGISTRATION
   * Anyone can register as a regular user (not Admin, Staff, or Staff Member)
   */
  async register(registerDto: RegisterDto) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    if (registerDto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Check if user already exists
    const { data: existingUser } = await this.supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', registerDto.email)
      .single();

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Role from request body
    const role = registerDto.role;

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email: registerDto.email,
        password: registerDto.password,
        email_confirm: true,
        user_metadata: {
          role: role,
          name: registerDto.name || registerDto.email.split('@')[0],
        },
      });

      if (authError) {
        throw new BadRequestException(`Registration failed: ${authError.message}`);
      }

      // 2. Create user record in database
      const { data: user, error: userError } = await this.supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: registerDto.email,
          name: registerDto.name || registerDto.email.split('@')[0],
          role: role,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select('id, email, name, role, is_active')
        .single();

      if (userError) {
        // Rollback: Delete auth user if DB insert fails
        await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new InternalServerErrorException(
          `Failed to create user record: ${userError.message}`,
        );
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * LOGIN
   * Authenticate user with email and password
   */
  async login(loginDto: LoginDto) {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (authError || !authData?.user || !authData?.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Fetch user details from database
    const { data: dbUser, error: userError } = await this.supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (userError || !dbUser) {
      throw new UnauthorizedException('User record not found');
    }

    if (dbUser.is_active === false) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Sync role to JWT metadata
    try {
      await this.supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        user_metadata: {
          role: dbUser.role,
        },
      });
    } catch (err) {
      console.warn('User metadata sync failed:', err);
    }

    return {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    };
  }

  /**
   * VALIDATE TOKEN
   * Validate JWT token and extract user info
   */
  async validateToken(token: string) {
    const { data, error } = await this.supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  }

  /**
   * REFRESH TOKEN
   * Generate new access token from refresh token
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      throw new UnauthorizedException('Failed to refresh token');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }

  /**
   * SIGN OUT
   * Logout user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new InternalServerErrorException('Failed to sign out');
    }
  }
}