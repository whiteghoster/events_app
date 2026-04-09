import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
  throw new Error(
    'Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
  );
}

export const createSupabaseClient = (useServiceRole = false) => {
  return createClient(
    supabaseConfig.url as string,
    useServiceRole
      ? (supabaseConfig.serviceRoleKey as string)
      : (supabaseConfig.anonKey || supabaseConfig.serviceRoleKey) as string,
  );
};

export const getSupabaseAdmin = () => createSupabaseClient(true);
