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
