import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraint() {
  const occasions = ['haldi', 'Haldi', 'HALDI', 'bhaat', 'mehendi', 'mehandi', 'Mehandi', 'wedding', 'reception', 'cocktail', 'after_party', 'others', 'other', 'Other'];
  
  for (const occ of occasions) {
    const uuid = '123e4567-e89b-12d3-a456-4266141740' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const { error: err } = await supabase.from('events').insert({
      id: uuid,
      name: 'Test',
      occasion_type: occ,
      date: '2025-01-01',
      venue_name: 'Test'
    });
    // Cleanup
    await supabase.from('events').delete().eq('id', uuid);
    
    console.log(`Trying ${occ}: ${err ? err.message : 'SUCCESS'}`);
  }
}

checkConstraint();
