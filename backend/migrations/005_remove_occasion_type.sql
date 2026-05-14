-- Migration: Remove occasion_type field from events
-- Date: 2025-05-04
-- Description: Removes occasion_type column and updates related functions

-- 1. Drop existing RPC functions that use occasion_type
DROP FUNCTION IF EXISTS get_events_sorted_by_proximity(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_events_sorted_by_proximity_simple(TEXT, TEXT, INTEGER, INTEGER);

-- 2. Create updated RPC function without occasion_type parameter
CREATE OR REPLACE FUNCTION get_events_sorted_by_proximity(
    p_status TEXT DEFAULT NULL,
    p_page_size INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    data JSON,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    result_count BIGINT;
BEGIN
    -- Get total count first
    SELECT COUNT(*) INTO result_count
    FROM events
    WHERE (p_status IS NULL OR status = p_status);

    -- Return sorted events with total count
    RETURN QUERY
    SELECT 
        json_agg(
            json_build_object(
                'id', events.id,
                'client_name', events.client_name,
                'venue', events.venue,
                'status', events.status,
                'display_id', events.display_id,
                'delivery_from_date', events.delivery_from_date,
                'delivery_to_date', events.delivery_to_date,
                'manager_name', events.manager_name,
                'head_karigar_name', events.head_karigar_name
            ) ORDER BY
                -- Sort by proximity to today's date
                -- First calculate absolute days difference from today
                ABS(
                    CASE 
                        WHEN events.delivery_from_date IS NOT NULL 
                        THEN events.delivery_from_date::DATE - CURRENT_DATE
                        ELSE 999999  -- Put events without dates at the end
                    END
                ),
                -- Then by date (earlier dates first for same distance)
                CASE 
                    WHEN events.delivery_from_date IS NOT NULL 
                    THEN events.delivery_from_date::DATE
                    ELSE '9999-12-31'::DATE
                END,
                -- Finally by client name for consistent ordering
                events.client_name
        ) as data,
        result_count as total_count
    FROM events
    WHERE (p_status IS NULL OR status = p_status)
    LIMIT p_page_size
    OFFSET p_offset;
END;
$$;

-- 3. Create simpler version without occasion_type parameter
CREATE OR REPLACE FUNCTION get_events_sorted_by_proximity_simple(
    p_status TEXT DEFAULT NULL,
    p_page_size INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    client_name TEXT,
    venue TEXT,
    status TEXT,
    display_id TEXT,
    delivery_from_date DATE,
    delivery_to_date DATE,
    manager_name TEXT,
    head_karigar_name TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    result_count BIGINT;
BEGIN
    -- Get total count first
    SELECT COUNT(*) INTO result_count
    FROM events
    WHERE (p_status IS NULL OR status = p_status);

    -- Return sorted events with total count
    RETURN QUERY
    SELECT 
        events.id,
        events.client_name,
        events.venue,
        events.status,
        events.display_id,
        events.delivery_from_date::DATE,
        events.delivery_to_date::DATE,
        events.manager_name,
        events.head_karigar_name,
        result_count
    FROM events
    WHERE (p_status IS NULL OR status = p_status)
    ORDER BY
        -- Sort by proximity to today's date
        -- First calculate absolute days difference from today
        ABS(
            CASE 
                WHEN events.delivery_from_date IS NOT NULL 
                THEN events.delivery_from_date::DATE - CURRENT_DATE
                ELSE 999999  -- Put events without dates at the end
            END
        ),
        -- Then by date (earlier dates first for same distance)
        CASE 
            WHEN events.delivery_from_date IS NOT NULL 
            THEN events.delivery_from_date::DATE
            ELSE '9999-12-31'::DATE
        END,
        -- Finally by client name for consistent ordering
        events.client_name
    LIMIT p_page_size
    OFFSET p_offset;
END;
$$;

-- 4. Remove occasion_type column from events table
-- Note: Only run this if you want to permanently delete the data
-- ALTER TABLE events DROP COLUMN IF EXISTS occasion_type;

-- 5. Remove occasion_type constraint from events table (alternative: keep column but remove constraint)
-- ALTER TABLE events DROP CONSTRAINT IF EXISTS events_occasion_type_check;
