-- Migration: Add contractor work dates range to events table
-- Date: 2026-05-06
-- Description: Add fields to store the universal contractor work date range separately from delivery dates

-- Add contractor work date fields to events table
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS contractors_work_from DATE,
    ADD COLUMN IF NOT EXISTS contractors_work_to DATE;

-- Add comment to clarify the purpose
COMMENT ON COLUMN events.contractors_work_from IS 'Start date for contractor work period (universal range)';
COMMENT ON COLUMN events.contractors_work_to IS 'End date for contractor work period (universal range)';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
