-- Migration: Add event fields for contractor, dates, shift, and member quantity
-- Date: 2025-05-04
-- Description: Add contractor assignment, event dates, shift, and member quantity to events

-- =============================================
-- ADD NEW COLUMNS TO EVENTS TABLE
-- =============================================

-- Add contractor_id foreign key
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL;

-- Add event from date
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_from_date DATE;

-- Add event end date
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_end_date DATE;

-- Add shift (day/night)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS shift TEXT CHECK (shift IN ('day', 'night'));

-- Add member quantity
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS member_quantity INTEGER DEFAULT 0;

-- =============================================
-- UPDATE EXISTING FUNCTIONS TO INCLUDE NEW FIELDS
-- =============================================

-- Update the create_event_with_display_id function
CREATE OR REPLACE FUNCTION create_event_with_display_id(
  p_client_name TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_event_date TEXT DEFAULT NULL,
  p_venue TEXT DEFAULT NULL,
  p_venue_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_head_karigar_name TEXT DEFAULT NULL,
  p_manager_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_delivery_from_date TEXT DEFAULT NULL,
  p_delivery_to_date TEXT DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_contractor_id UUID DEFAULT NULL,
  p_event_from_date TEXT DEFAULT NULL,
  p_event_end_date TEXT DEFAULT NULL,
  p_shift TEXT DEFAULT NULL,
  p_member_quantity INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  display_id VARCHAR,
  client_name TEXT,
  company_name TEXT,
  contact_phone TEXT,
  event_date DATE,
  venue TEXT,
  venue_address TEXT,
  city TEXT,
  head_karigar_name TEXT,
  manager_name TEXT,
  notes TEXT,
  delivery_from_date DATE,
  delivery_to_date DATE,
  assigned_to UUID,
  created_by UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  contractor_id UUID,
  event_from_date DATE,
  event_end_date DATE,
  shift TEXT,
  member_quantity INTEGER
) AS $$
DECLARE
  v_display_id VARCHAR(15);
  v_initials TEXT;
  v_next_num INTEGER;
  v_event_id UUID;
BEGIN
  -- Generate display_id
  v_initials := UPPER(LEFT(REGEXP_REPLACE(p_client_name, '[^a-zA-Z]', '', 'g'), 3));
  IF LENGTH(v_initials) < 2 THEN
    v_initials := UPPER(LEFT(p_client_name, 3));
  END IF;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 5) AS INTEGER)), 0) + 1
  INTO v_next_num
  FROM events
  WHERE display_id LIKE v_initials || '-%';
  
  v_display_id := v_initials || '-' || LPAD(v_next_num::TEXT, 2, '0');

  INSERT INTO events (
    client_name, company_name, contact_phone, event_date,
    venue, venue_address, city,
    head_karigar_name, manager_name,
    delivery_from_date, delivery_to_date,
    display_id, created_by, assigned_to, notes,
    contractor_id, event_from_date, event_end_date, shift, member_quantity
  ) VALUES (
    p_client_name, p_company_name, p_contact_phone, p_event_date::DATE,
    p_venue, p_venue_address, p_city,
    p_head_karigar_name, p_manager_name,
    p_delivery_from_date::DATE, p_delivery_to_date::DATE,
    v_display_id, auth.uid(), p_assigned_to, p_notes,
    p_contractor_id, p_event_from_date::DATE, p_event_end_date::DATE, p_shift, COALESCE(p_member_quantity, 0)
  )
  RETURNING events.id INTO v_event_id;

  RETURN QUERY
  SELECT * FROM events WHERE id = v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- UPDATE RLS POLICY (if needed)
-- =============================================
-- No changes needed - existing policies will cover new columns
