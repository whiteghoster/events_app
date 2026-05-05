-- Migration: Add contractors table for Manpower
-- Date: 2025-05-04
-- Description: Simple table for contractor/worker management

-- =============================================
-- CONTRACTORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contractors
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- contractors RLS Policies - readable by all, manageable by admin and manager only
DROP POLICY IF EXISTS "contractors are readable by all authenticated users" ON contractors;
DROP POLICY IF EXISTS "Authenticated users can manage contractors" ON contractors;
DROP POLICY IF EXISTS "Only admin and manager can manage contractors" ON contractors;

-- Everyone can read
CREATE POLICY "contractors are readable by all authenticated users" ON contractors
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

-- Only admin and manager can create/update/delete
CREATE POLICY "Only admin and manager can manage contractors" ON contractors
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );
