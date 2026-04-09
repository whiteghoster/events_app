import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async setUserId(userId: string): Promise<void> {
    // Set PostgreSQL session variable for audit trigger
    const { error } = await this.supabase.rpc('set_app_user_id', {
      user_id: userId,
    });

    if (error) {
      console.error('Failed to set app.user_id:', error);
      throw error;
    }
  }

  async clearUserId(): Promise<void> {
    const { error } = await this.supabase.rpc('set_app_user_id', {
      user_id: null,
    });

    if (error) {
      console.error('Failed to clear app.user_id:', error);
    }
  }
}
