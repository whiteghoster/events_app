-- Add created_by column to events table
-- Date: 2025-01-09
-- Description: Track event creator for permission control

-- Add created_by column
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Add comment
COMMENT ON COLUMN events.created_by IS 'User ID who created the event';
