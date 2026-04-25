-- Create RPC function to sort events by proximity to today's date
CREATE OR REPLACE FUNCTION get_events_sorted_by_proximity(
    p_occasion_type TEXT DEFAULT NULL,
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
    WHERE (p_occasion_type IS NULL OR occasion_type = p_occasion_type)
      AND (p_status IS NULL OR status = p_status);

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
            )
        ) as data,
        result_count as total_count
    FROM events
    WHERE (p_occasion_type IS NULL OR occasion_type = p_occasion_type)
      AND (p_status IS NULL OR status = p_status)
    LIMIT p_page_size
    OFFSET p_offset;
END;
$$;

-- Create a simpler version that returns the events directly for easier integration
CREATE OR REPLACE FUNCTION get_events_sorted_by_proximity_simple(
    p_occasion_type TEXT DEFAULT NULL,
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
    WHERE (p_occasion_type IS NULL OR occasion_type = p_occasion_type)
      AND (p_status IS NULL OR status = p_status);

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
    WHERE (p_occasion_type IS NULL OR occasion_type = p_occasion_type)
      AND (p_status IS NULL OR status = p_status)
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
