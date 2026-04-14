import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const displayId = 'EVT-59022';
  console.log(`Searching for event by Display ID: ${displayId}...`);

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('display_id', displayId)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    
    console.log('Trying standard query (id column)...');
    const { data: d2, error: e2 } = await supabase.from('events').select('display_id').limit(1).single();
    if (d2) {
        console.log(`Found another event with Display ID: ${d2.display_id}. The logic should work for this ID.`);
    }
  } else {
    console.log('✅ Found event:', data.name);
  }
}

testFetch();
