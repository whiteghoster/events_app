import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory token cache: token -> { user, expiresAt }
  private readonly tokenCache = new Map<string, { user: any; expiresAt: number }>();
  private readonly TOKEN_CACHE_TTL = 60_000; // 60 seconds

  constructor(private readonly databaseService: DatabaseService) { }

  private get supabase() {
    return this.databaseService.getClient();
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
      const { error: cleanupError } = await this.supabase.auth.admin.deleteUser(authData.user.id);
      if (cleanupError) {
        this.logger.error(`Orphaned auth user ${authData.user.id}: cleanup failed: ${cleanupError.message}`);
      }
      throw new InternalServerErrorException(`Failed to create user record: ${userError.message}`);
    }

    return user;
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

    // Fire-and-forget: don't block login response for metadata sync
    this.supabase.auth.admin.updateUserById(authData.user.id, {
      user_metadata: { role: dbUser.role },
    }).catch(err => {
      this.logger.warn(`Metadata sync failed for user ${authData.user.id}: ${err.message}`);
    });

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
    // Check cache first — avoids Supabase round-trip on every request
    const cached = this.tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) {
      this.tokenCache.delete(token);
      return null;
    }

    // Cache the validated user for subsequent requests
    this.tokenCache.set(token, {
      user: data.user,
      expiresAt: Date.now() + this.TOKEN_CACHE_TTL,
    });

    // Prune expired entries periodically (every 100 cache writes)
    if (this.tokenCache.size > 100) {
      this.pruneTokenCache();
    }

    return data.user;
  }

  /** Evict a specific token (call on logout) */
  evictTokenCache(token: string) {
    this.tokenCache.delete(token);
  }

  private pruneTokenCache() {
    const now = Date.now();
    for (const [key, value] of this.tokenCache) {
      if (value.expiresAt <= now) {
        this.tokenCache.delete(key);
      }
    }
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

  async signOut(userId: string) {
    try {
      // Attempt to sign out from Supabase (may fail with JWT issues)
      await this.supabase.auth.admin.signOut(userId, 'global');
    } catch (error: any) {
      // Log but don't fail - client will clear local storage anyway
      this.logger.warn(`Supabase sign out failed for user ${userId}: ${error?.message || 'Unknown error'}`);
      // Don't throw - allow client to complete logout by clearing local storage
    }
  }
}