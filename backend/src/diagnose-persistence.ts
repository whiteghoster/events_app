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

async function testCreate() {
  console.log('--- Testing Create Event ---');
  const payload = {
    name: 'Test persist Event ' + new Date().toISOString(),
    occasion_type: 'others',
    date: new Date().toISOString(),
    venue_name: 'Test Venue',
    status: 'live',
    display_id: 'EVT-' + Math.floor(Math.random() * 90000 + 10000)
  };

  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('❌ Insert failed:', error);
    return;
  }

  console.log('✅ Inserted Successfully:', data);
  
  console.log('--- Verifying immediately ---');
  const { data: verif, error: verifError } = await supabase
    .from('events')
    .select('*')
    .eq('id', data.id)
    .single();

  if (verifError) {
    console.error('❌ Verification failed:', verifError);
  } else {
    console.log('✅ Found in DB:', verif);
  }
}

testCreate();
