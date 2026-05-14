import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseUser(userId: string) {
  console.log(`Diagnosing user: ${userId}`);

  // 1. Check Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError) {
    console.error('Auth User Error:', authError.message);
  } else {
    console.log('Auth User found:', {
      id: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
  }

  // 2. Check public.users table
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (dbError) {
    console.error('DB User Error:', dbError.message);
  } else if (!dbUser) {
    console.log('DB User record: MISSING');
  } else {
    console.log('DB User record found:', dbUser);
  }
}

const userId = process.argv[2] || '036ac543-c607-462f-9e40-2560d635e9b2';
diagnoseUser(userId);
