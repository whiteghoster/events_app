import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Supabase Client for Frontend
 * Used for real-time subscriptions and client-side queries
 * Note: API calls go through our NestJS backend for authentication and authorization
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);