import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testInsert() {
  console.log('--- AUDIT LOG INSERT TEST ---');
  
  const testLog = {
    entity_type: 'Test',
    entity_id: 'test-123',
    action: 'TEST_INSERT',
    user_id: '00000000-0000-0000-0000-000000000000', // Mock UUID
    new_values: { message: 'Hello from diagnostic script' }
  };

  const { data, error } = await supabase
    .from('audit_log')
    .insert(testLog)
    .select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
    if (error.code === '42P01') console.error('Table audit_log does not exist!');
    return;
  }

  console.log('✅ Insert successful:', data);
  
  const { count } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Current log count: ${count}`);
}

testInsert();
