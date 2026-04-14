import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkLogs() {
  console.log('--- AUDIT LOG CHECK ---');
  
  const { data, count, error } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching logs:', error.message);
    return;
  }

  console.log(`Total logs in table: ${count}`);
  console.log('Latest 5 logs:');
  console.table(data);
}

checkLogs();
