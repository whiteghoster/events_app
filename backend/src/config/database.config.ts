import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://mgziyqjhkoqhyzjgwcbp.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export const createSupabaseClient = (useServiceRole = false) => {
  return createClient(
    supabaseConfig.url || '',
    useServiceRole ? supabaseConfig.serviceRoleKey || '' : supabaseConfig.anonKey || ''
  );
};

export const getSupabaseAdmin = () => createSupabaseClient(true);
