-- Migration 004: Add assigned_to column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_events_assigned_to ON events(assigned_to);
