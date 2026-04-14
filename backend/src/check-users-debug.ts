import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Checking Users Table ---');
  const { data: users, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users?.length || 0} users:`);
  (users as any[])?.forEach(u => {
    console.log(`- [${u.id}] ${u.email} (${u.role}) Active: ${u.is_active}`);
  });
  
  console.log('\n--- Checking Supabase Auth ---');
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  console.log(`Found ${authUsers?.length || 0} auth users:`);
  (authUsers as any[])?.forEach(u => {
      const inDb = (users as any[])?.some(dbU => dbU.id === u.id);
      console.log(`- [${u.id}] ${u.email} In DB: ${inDb ? '✅' : '❌'}`);
  });
}

check();
