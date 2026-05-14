-- Migration: Fix Contractors RLS policies
-- Date: 2025-05-04
-- Description: Drop all existing policies and recreate them

-- Drop all existing policies on contractors table
DROP POLICY IF EXISTS "Contractors are readable by all authenticated users" ON contractors;
DROP POLICY IF EXISTS "Authenticated users can manage Contractors" ON contractors;
DROP POLICY IF EXISTS "Only admin and manager can manage Contractors" ON contractors;
DROP POLICY IF EXISTS "Only admin and manager can manage contractors" ON contractors;
DROP POLICY IF EXISTS "Contractors are readable by all authenticated users" ON "Contractors";
DROP POLICY IF EXISTS "Authenticated users can manage Contractors" ON "Contractors";
DROP POLICY IF EXISTS "Only admin and manager can manage Contractors" ON "Contractors";

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Contractors" ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Contractors are readable by all authenticated users" ON contractors
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

-- Only admin and manager can create/update/delete
CREATE POLICY "Only admin and manager can manage Contractors" ON contractors
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );
