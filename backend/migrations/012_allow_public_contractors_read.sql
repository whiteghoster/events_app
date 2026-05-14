-- Migration: Allow public read access to contractors
-- Date: 2026-05-06
-- Description: Update RLS policies to allow public read access to contractors table

-- Drop existing read policy
DROP POLICY IF EXISTS "Contractors are readable by all authenticated users" ON contractors;

-- Create new policy that allows public read access
CREATE POLICY "Contractors are readable by everyone" ON contractors
    FOR SELECT USING (true);

-- Keep the management policy for admin/manager only
DROP POLICY IF EXISTS "Only admin and manager can manage Contractors" ON contractors;

CREATE POLICY "Only admin and manager can manage Contractors" ON contractors
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );
