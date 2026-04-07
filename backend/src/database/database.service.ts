import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/database.config';

@Injectable()
export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      supabaseConfig.url || '',
      supabaseConfig.serviceRoleKey || ''
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
