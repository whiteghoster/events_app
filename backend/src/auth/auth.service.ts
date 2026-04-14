import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.supabase = this.databaseService.getClient();
  }

  async register(registerDto: RegisterDto) {
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', registerDto.email)
      .maybeSingle();

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const displayName = registerDto.name || registerDto.email.split('@')[0];

    try {
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: registerDto.email,
        password: registerDto.password,
        email_confirm: true,
        user_metadata: { role: registerDto.role, name: displayName },
      });

      if (authError) {
        throw new BadRequestException(`Registration failed: ${authError.message}`);
      }

      const { data: user, error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: registerDto.email,
          name: displayName,
          role: registerDto.role,
          is_active: true,
        })
        .select('id, email, name, role, is_active')
        .single();

      if (userError) {
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        throw new InternalServerErrorException(`Failed to create user record: ${userError.message}`);
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(loginDto: LoginDto) {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (authError || !authData?.user || !authData?.session) {
      this.logger.warn(`Auth failed for ${loginDto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const { data: dbUser, error: userError } = await this.supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (userError || !dbUser) {
      this.logger.error(`User record missing in DB for auth user ${authData.user.id}`);
      throw new UnauthorizedException('User record not found. Please contact admin.');
    }

    if (!dbUser.is_active) {
      throw new UnauthorizedException('User account is inactive');
    }

    const { error: metaError } = await this.supabase.auth.admin.updateUserById(authData.user.id, {
      user_metadata: { role: dbUser.role },
    });
    if (metaError) {
      this.logger.warn(`Metadata sync failed for user ${authData.user.id}: ${metaError.message}`);
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

  async validateToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
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

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new InternalServerErrorException('Failed to sign out');
    }
  }
}
