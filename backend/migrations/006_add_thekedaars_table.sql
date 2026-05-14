-- Migration: Add Contractors table for Manpower
-- Date: 2025-05-04
-- Description: Simple table for contractor/worker management

-- =============================================
-- ContractorS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS Contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Contractors
ALTER TABLE Contractors ENABLE ROW LEVEL SECURITY;

-- Contractors RLS Policies - readable and manageable by authenticated users
DROP POLICY IF EXISTS "Contractors are readable by all authenticated users" ON Contractors;
DROP POLICY IF EXISTS "Authenticated users can manage Contractors" ON Contractors;

CREATE POLICY "Contractors are readable by all authenticated users" ON Contractors
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

CREATE POLICY "Authenticated users can manage Contractors" ON Contractors
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );
