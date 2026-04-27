-- Add event_code column to audit_log table
-- This stores the event display code (e.g., "AB-01") at the time of the audit log creation
-- This ensures the code is preserved even if the event is later deleted

-- Add the column
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS event_code text;

-- Add index for faster queries by event_code
CREATE INDEX IF NOT EXISTS idx_audit_log_event_code 
ON public.audit_log USING btree (event_code) 
TABLESPACE pg_default;

-- Backfill existing audit logs with event codes for Event and Event Product entities
-- This is a one-time operation to populate historical data
-- Handle combined entity_type values like 'Event/create', 'Event/delete', etc.
UPDATE public.audit_log al
SET event_code = (
  CASE 
    -- For Event entities, get display_id from events table, fallback to old_values/new_values
    WHEN LOWER(al.entity_type) LIKE 'event%' THEN COALESCE(
      (SELECT e.display_id FROM public.events e WHERE e.id = al.entity_id),
      al.old_values->>'display_id',
      al.new_values->>'display_id'
    )
    -- For Event Product entities, get display_id from parent event, fallback to old_values/new_values
    WHEN LOWER(al.entity_type) LIKE 'event product%' THEN COALESCE(
      (SELECT e.display_id FROM public.events e WHERE e.id = COALESCE(
        (al.new_values->>'event_id')::uuid,
        (al.old_values->>'event_id')::uuid
      )),
      al.old_values->>'display_id',
      al.new_values->>'display_id'
    )
    -- Try to extract from old_values or new_values as fallback for other entity types
    ELSE COALESCE(
      al.old_values->>'display_id',
      al.new_values->>'display_id'
    )
  END
)
WHERE al.event_code IS NULL
AND (
  LOWER(al.entity_type) LIKE 'event%' 
  OR LOWER(al.entity_type) LIKE 'event product%'
);

-- Add comment
COMMENT ON COLUMN public.audit_log.event_code IS 'Event display code (e.g., AB-01) stored at time of audit log creation';
