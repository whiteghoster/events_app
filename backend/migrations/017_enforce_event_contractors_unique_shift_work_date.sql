-- Migration: Enforce deterministic contractor uniqueness constraint
-- Date: 2026-05-08
-- Description: Remove legacy unique constraints and enforce event+contractor+shift+work_date uniqueness

ALTER TABLE IF EXISTS event_contractors
    DROP CONSTRAINT IF EXISTS event_contractors_event_id_contractor_id_key;

ALTER TABLE IF EXISTS event_contractors
    DROP CONSTRAINT IF EXISTS event_contractors_event_id_contractor_id_work_date_key;

ALTER TABLE IF EXISTS event_contractors
    DROP CONSTRAINT IF EXISTS event_contractors_event_id_contractor_id_shift_work_date_key;

DROP INDEX IF EXISTS event_contractors_event_id_contractor_id_key;
DROP INDEX IF EXISTS event_contractors_event_id_contractor_id_work_date_key;
DROP INDEX IF EXISTS event_contractors_event_id_contractor_id_shift_work_date_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'event_contractors_event_id_contractor_id_shift_work_date_key'
    ) THEN
        ALTER TABLE event_contractors
            ADD CONSTRAINT event_contractors_event_id_contractor_id_shift_work_date_key
            UNIQUE (event_id, contractor_id, shift, work_date);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
