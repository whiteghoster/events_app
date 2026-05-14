import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Running migration 004...");
  
  const sql = `
    -- Add assigned_to column with foreign key
    ALTER TABLE IF EXISTS events 
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_events_assigned_to ON events(assigned_to);

    -- Reload schema cache
    NOTIFY pgrst, 'reload schema';
  `;

  const { data, error } = await supabase.rpc('execute_sql', { query: sql });
  
  if (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  console.log("Migration successful!");
  console.log("Response:", data);
}

runMigration();
