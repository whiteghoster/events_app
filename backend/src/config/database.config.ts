import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: 'https://mgziyqjhkoqhyzjgwcbp.supabase.co',
  anonKey: 'sb_publishable_MtrDFhVwQzUrb4oPDE5Cbw_n_h81kaz',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkYXRpbmFubWUiLCJyb2xlIjoic3VwcmF0IiwiZXhwIjoic3VwcmF0LXNlc3Npb24iLCJpYXQiOiJkZjYwMjQ2MTQ4NzY3NzYzMjQyLCJleHAiOiI2NzQ2ODA5MzY3NzMzMjQyLCJhbGciOiJIUzI1NiIsInR5cCI6IkpvaWNhbW4ifQ==', // Temporary for testing
};

export const createSupabaseClient = (useServiceRole = false) => {
  return createClient(
    supabaseConfig.url || '',
    useServiceRole ? supabaseConfig.serviceRoleKey || '' : supabaseConfig.anonKey || ''
  );
};

export const getSupabaseAdmin = () => createSupabaseClient(true);
