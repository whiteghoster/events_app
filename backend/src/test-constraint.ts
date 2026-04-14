import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('query_check', {}).select('*');
  
  // Actually, we can use postgres meta queries via standard SQL, but Supabase JS doesn't allow raw SQL easily.
  // Instead, let's insert one by one to see which one succeeds!
  
  const occasions = ['haldi', 'bhaat', 'mehendi', 'mehandi', 'wedding', 'reception', 'cocktail', 'after_party', 'others', 'other'];
  
  for (const occ of occasions) {
    const { error: err } = await supabase.from('events').insert({
      id: '00000000-0000-0000-0000-000000000000', // invalid uuid will fail, but with uuid error, not check constraint
      name: 'Test',
      occasion_type: occ,
      date: '2025-01-01',
      venue_name: 'Test'
    });
    console.log(`Trying ${occ}: ${err ? err.message : 'SUCCESS'}`);
  }
}

checkConstraint();
