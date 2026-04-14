-- Drop the old overly restrictive constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_occasion_type_check;

-- Add the correct constraint matching the frontend and backend 100%
ALTER TABLE events ADD CONSTRAINT events_occasion_type_check 
CHECK (occasion_type IN ('haldi', 'bhaat', 'mehendi', 'wedding', 'reception', 'cocktail', 'after_party', 'others'));
