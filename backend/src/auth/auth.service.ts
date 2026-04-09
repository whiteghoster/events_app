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

  async register(registerDto: RegisterDto) {
    // Only allow Admin registration via this public endpoint.
    // Staff and Staff Members must be created via the protected /users API.
    if (registerDto.role && registerDto.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        'Only Admin registration is allowed through this endpoint. ' +
        'Staff and Staff Members must be created by an Admin using a token.',
      );
    }

    const role = UserRole.ADMIN;

    // 1. Create user in Supabase Auth via Admin client
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: registerDto.email,
      password: registerDto.password,
      email_confirm: true,
      user_metadata: {
        role: role,
        name: registerDto.name,
      },
    });

    if (authError) {
      throw new BadRequestException(`Auth registration failed: ${authError.message}`);
    }

    // 2. Create user record in our users table
    const { data: user, error: userError } = await this.supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: registerDto.email,
        name: registerDto.name,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select('id, email, name, role, is_active')
      .single();

    if (userError) {
      // Rollback: try to delete the auth user if DB insert fails
      await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException(`Database user creation failed: ${userError.message}`);
    }

    return user;
  }
}