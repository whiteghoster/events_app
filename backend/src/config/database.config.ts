export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export function validateSupabaseConfig() {
  const { url, serviceRoleKey, anonKey } = supabaseConfig;

  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is not set');
  }
}
