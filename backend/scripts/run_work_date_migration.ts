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

async function runWorkDateMigration() {
  console.log("Running migration to add work_date column...");
  
  const sql = `
    -- Migration: Add work_date to event_contractors
    -- Date: 2026-05-06
    -- Description: Single work date per contractor assignment

    ALTER TABLE event_contractors
        DROP CONSTRAINT IF EXISTS event_contractors_dates_check;

    ALTER TABLE event_contractors
        DROP COLUMN IF EXISTS start_date,
        DROP COLUMN IF EXISTS end_date;

    ALTER TABLE event_contractors
        ADD COLUMN IF NOT EXISTS work_date DATE;

    -- Reload schema cache
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
    
    console.log("Migration successful!");
    console.log("Response:", data);
  } catch (err) {
    console.error("Error running migration:", err);
    process.exit(1);
  }
}

runWorkDateMigration();
