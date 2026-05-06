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
  
  try {
    // Try to run the SQL directly
    const { data, error } = await supabase
      .from('event_contractors')
      .select('work_date')
      .limit(1);
    
    if (error && error.message.includes('column "work_date" does not exist')) {
      console.log("Column doesn't exist, adding it...");
      
      // Add the column using raw SQL
      const { error: alterError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            ALTER TABLE event_contractors
                DROP COLUMN IF EXISTS start_date,
                DROP COLUMN IF EXISTS end_date;
            
            ALTER TABLE event_contractors
                ADD COLUMN IF NOT EXISTS work_date DATE;
            
            NOTIFY pgrst, 'reload schema';
          `
        });
      
      if (alterError) {
        console.log("RPC failed, trying direct SQL...");
        
        // Alternative: Use the SQL editor approach
        console.log("Please run this SQL manually in your Supabase SQL editor:");
        console.log(`
ALTER TABLE event_contractors
    DROP COLUMN IF EXISTS start_date,
    DROP COLUMN IF EXISTS end_date;

ALTER TABLE event_contractors
    ADD COLUMN IF NOT EXISTS work_date DATE;

NOTIFY pgrst, 'reload schema';
        `);
      } else {
        console.log("Migration successful!");
      }
    } else if (error) {
      console.error("Error checking column:", error);
    } else {
      console.log("Column already exists!");
    }
  } catch (err) {
    console.error("Error running migration:", err);
  }
}

runWorkDateMigration();
