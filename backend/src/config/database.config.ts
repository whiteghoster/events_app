import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
export function validateSupabaseConfig() {
  const { url, serviceRoleKey, anonKey } = supabaseConfig;

  if (!url) {
    throw new Error(
      '❌ SUPABASE_URL environment variable is not set.\n' +
      'Please add it to your .env file.\n' +
      'Get it from: https://app.supabase.com/project/_/settings/api',
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      '❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set.\n' +
      'This is required for authenticated backend operations.\n' +
      'Get it from: https://app.supabase.com/project/_/settings/api',
    );
  }

  if (!anonKey) {
    throw new Error(
      '❌ SUPABASE_ANON_KEY environment variable is not set.\n' +
      'This is required for public API operations.\n' +
      'Get it from: https://app.supabase.com/project/_/settings/api',
    );
  }
}

/**
 * Create Supabase client with specified authentication level
 * @param useServiceRole - If true, use service role key (full access), otherwise use anon key
 */
export const createSupabaseClient = (useServiceRole = false) => {
  const key = useServiceRole ? supabaseConfig.serviceRoleKey : supabaseConfig.anonKey;

  if (!supabaseConfig.url || !key) {
    throw new Error(
      '❌ Supabase configuration incomplete. ' +
      'Make sure all required environment variables are set.',
    );
  }

  return createClient(supabaseConfig.url, key);
};

/**
 * Get admin Supabase client with full access (service role key)
 */
export const getSupabaseAdmin = () => createSupabaseClient(true);