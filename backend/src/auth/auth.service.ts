import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/database.config';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.supabaseAdmin = createClient(
      supabaseConfig.url || '',
      supabaseConfig.serviceRoleKey || '',
    );
  }

  private get supabase() {
    return this.databaseService.getClient();
  }

  async login(loginDto: LoginDto) {
    const { data: authData, error: authError } =
      await this.supabase.auth.signInWithPassword({
        email: loginDto.email,
        password: loginDto.password,
      });

    if (authError || !authData?.user || !authData?.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { data: dbUser, error: userError } = await this.supabaseAdmin
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (userError || !dbUser) {
      throw new UnauthorizedException('User record not found');
    }

    if (dbUser.is_active === false) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Best-effort metadata sync for JWT role consistency
    try {
      await this.supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        user_metadata: {
          role: dbUser.role,
        },
      });
    } catch (err) {
      // Non-blocking: login should still succeed even if metadata sync fails
      console.warn('User metadata sync failed:', err);
    }

    return {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      },
    };
  }

  async validateToken(token: string) {
    const { data, error } = await this.supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  }

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
      user: data.user
        ? {
          id: data.user.id,
          email: data.user.email,
        }
        : null,
    };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new InternalServerErrorException('Failed to sign out');
    }
  }
}