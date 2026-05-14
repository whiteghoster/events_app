import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the root of the backend folder
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

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Initial Admin';

  if (!email || !password) {
    console.log('Usage: npx ts-node scripts/create-admin.ts <email> <password> [name]');
    process.exit(1);
  }

  console.log(`Creating Admin: ${email}...`);

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      name
    }
  });

  if (authError) {
    console.error('Failed to create auth user:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Auth user created with ID: ${userId}`);

  // 2. Insert into the public.users table
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      name,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    });

  if (dbError) {
    console.error('Failed to create user record in DB:', dbError.message);
    // Cleanup: try to delete the auth user if DB insert fails
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!');
  console.log('You can now log in via the /auth/login API.');
}

createAdmin();
