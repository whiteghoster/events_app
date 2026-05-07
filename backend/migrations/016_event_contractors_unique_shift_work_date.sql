-- Migration: Ensure contractor uniqueness includes shift + work_date
-- Date: 2026-05-07
-- Description: Prevent duplicates only for same event + contractor + shift + work_date

ALTER TABLE event_contractors
    DROP CONSTRAINT IF EXISTS event_contractors_event_id_contractor_id_key;

ALTER TABLE event_contractors
    DROP CONSTRAINT IF EXISTS event_contractors_event_id_contractor_id_work_date_key;

ALTER TABLE event_contractors
    ADD CONSTRAINT event_contractors_event_id_contractor_id_shift_work_date_key
    UNIQUE (event_id, contractor_id, shift, work_date);
