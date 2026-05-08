-- Migration: Allow duplicate contractors with different work dates
-- Date: 2026-05-07
-- Description: Update event_contractors unique constraint to include work_date

ALTER TABLE event_contractors
    DROP CONSTRAINT IF EXISTS event_contractors_event_id_contractor_id_key;

ALTER TABLE event_contractors
    ADD CONSTRAINT event_contractors_event_id_contractor_id_work_date_key
    UNIQUE (event_id, contractor_id, work_date);
