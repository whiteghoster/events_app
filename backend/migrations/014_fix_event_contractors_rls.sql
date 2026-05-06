-- Migration: Fix event_contractors RLS policies to allow all authenticated users
-- Date: 2026-05-06
-- Description: Update RLS policies to allow all authenticated users to manage event_contractors

-- Drop existing policies
DROP POLICY IF EXISTS "event_contractors are readable by all authenticated users" ON event_contractors;
DROP POLICY IF EXISTS "Only admin and manager can manage event_contractors" ON event_contractors;

-- Create new policy that allows all authenticated users to read
CREATE POLICY "event_contractors are readable by all authenticated users" ON event_contractors
    FOR SELECT USING (auth.role() IS NOT NULL);

-- Create new policy that allows all authenticated users to manage
CREATE POLICY "All authenticated users can manage event_contractors" ON event_contractors
    FOR ALL USING (
        auth.role() IS NOT NULL
    )
    WITH CHECK (
        auth.role() IS NOT NULL
    );
