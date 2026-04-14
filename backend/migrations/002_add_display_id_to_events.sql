-- Add display_id column to the events table
ALTER TABLE events ADD COLUMN display_id VARCHAR(15) UNIQUE;
