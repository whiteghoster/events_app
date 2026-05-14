-- Migration: Add event_contractors junction table for many-to-many relationship
-- Date: 2025-05-05
-- Description: Junction table linking events to contractors with shift and member quantity

-- =============================================
-- EVENT_CONTRACTORS JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    shift TEXT CHECK (shift IN ('day', 'night')),
    member_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, contractor_id)
);

-- Enable RLS on event_contractors
ALTER TABLE event_contractors ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Everyone can read
DROP POLICY IF EXISTS "event_contractors are readable by all authenticated users" ON event_contractors;
CREATE POLICY "event_contractors are readable by all authenticated users" ON event_contractors
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

-- Only admin and manager can manage
DROP POLICY IF EXISTS "Only admin and manager can manage event_contractors" ON event_contractors;
CREATE POLICY "Only admin and manager can manage event_contractors" ON event_contractors
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

-- =============================================
-- AUTO-UPDATE TRIGGER FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_event_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_contractors_updated_at ON event_contractors;
CREATE TRIGGER event_contractors_updated_at
    BEFORE UPDATE ON event_contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_event_contractors_updated_at();
