import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('--- Checking Events Table Columns ---');
  // We can't easily list columns via JS without RPC, 
  // but we can try to fetch a row and see the keys.
  const { data, error } = await supabase.from('events').select('*').limit(1);

  if (error) {
    console.error('❌ Fetch failed:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('No events found, testing a dummy insert with assigned_to to see if it fails...');
    const { error: insertError } = await supabase.from('events').insert({ 
      name: 'Temp', 
      occasion_type: 'wedding', 
      date: new Date().toISOString(), 
      venue_name: 'Temp',
      assigned_to: '00000000-0000-0000-0000-000000000000' 
    });
    
    if (insertError) {
      console.log('❌ Column "assigned_to" probably does NOT exist:', insertError.message);
    } else {
      console.log('✅ Column "assigned_to" exists!');
      // Clean up
      await supabase.from('events').delete().eq('name', 'Temp');
    }
  }
}

checkColumns();
