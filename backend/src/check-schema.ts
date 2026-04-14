import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkSchema() {
  console.log('--- SCHEMA CHECK: audit_log ---');
  
  // We can't easily see schema with supabase-js, but we can try to guess or use RPC
  // Alternatively, let's just check the events table ID type
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .limit(1)
    .single();

  if (eventError) {
    console.error('Error fetching event:', eventError.message);
  } else {
    console.log('Sample Event ID:', event.id, typeof event.id);
  }

  const { data: log, error: logError } = await supabase
    .from('audit_log')
    .select('*')
    .limit(1);

  if (logError) {
    console.error('Error fetching log:', logError.message);
  } else {
    console.log('Table exists and is accessible.');
  }
}

checkSchema();
