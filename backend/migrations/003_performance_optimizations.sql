-- Migration 003: Performance optimizations
-- Atomic SQL functions, query optimizations, and missing indexes

-- =============================================
-- PART 0: DISABLE DUPLICATE AUDIT TRIGGERS
-- =============================================
-- These triggers fire on every mutation but can't capture user_id through
-- Supabase REST (each call is a separate session, so set_config is lost).
-- The app already writes audit logs manually with the correct user_id.
-- Keeping them means every mutation writes TWO audit rows — one with user_id, one without.

DROP TRIGGER IF EXISTS categories_audit_trigger ON categories;
DROP TRIGGER IF EXISTS products_audit_trigger ON products;
DROP TRIGGER IF EXISTS events_audit_trigger ON events;
DROP TRIGGER IF EXISTS event_products_audit_trigger ON event_products;

-- =============================================
-- PART 1: MISSING INDEXES
-- =============================================

-- event_products is queried by event_id on every product list/summary call
CREATE INDEX IF NOT EXISTS idx_event_products_event_id ON event_products(event_id);
CREATE INDEX IF NOT EXISTS idx_event_products_product_id ON event_products(product_id);

-- audit_log is queried by these columns for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);

-- products is filtered by category_id and is_active frequently
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;

-- events display_id lookups (already has UNIQUE constraint but adding for clarity)
CREATE INDEX IF NOT EXISTS idx_events_display_id ON events(display_id);

-- =============================================
-- PART 2: READ-ONLY QUERY OPTIMIZATIONS
-- =============================================

-- 1. Unique clients using DISTINCT ON (replaces JS deduplication of 1000 rows)
CREATE OR REPLACE FUNCTION get_unique_clients(row_limit INT DEFAULT 500)
RETURNS TABLE(client_name TEXT, company_name TEXT, contact_phone TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT DISTINCT ON (TRIM(e.client_name))
    e.client_name,
    e.company_name,
    e.contact_phone
  FROM events e
  WHERE e.client_name IS NOT NULL AND TRIM(e.client_name) != ''
  ORDER BY TRIM(e.client_name), e.created_at DESC
  LIMIT row_limit;
$$;

-- 2. Category summary for an event (replaces JS-side aggregation)
CREATE OR REPLACE FUNCTION get_event_category_summary(p_event_id UUID)
RETURNS JSON
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(json_agg(cat_summary), '[]'::json)
  FROM (
    SELECT
      COALESCE(c.name, 'Uncategorized') AS category,
      json_agg(
        json_build_object('unit', sub.unit, 'quantity', sub.total_qty)
      ) AS totals
    FROM (
      SELECT
        p.category_id,
        ep.unit,
        SUM(ep.quantity) AS total_qty
      FROM event_products ep
      JOIN products p ON p.id = ep.product_id
      WHERE ep.event_id = p_event_id
      GROUP BY p.category_id, ep.unit
    ) sub
    LEFT JOIN categories c ON c.id = sub.category_id
    GROUP BY c.name
  ) cat_summary;
$$;

-- 3. Dashboard stats in a single query (replaces 11 parallel HTTP calls)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'totalEvents',    (SELECT COUNT(*) FROM events),
    'activeEvents',   (SELECT COUNT(*) FROM events WHERE status = 'live'),
    'holdEvents',     (SELECT COUNT(*) FROM events WHERE status = 'hold'),
    'finishedEvents', (SELECT COUNT(*) FROM events WHERE status = 'finished'),
    'totalUsers',     (SELECT COUNT(*) FROM users),
    'activeUsers',    (SELECT COUNT(*) FROM users WHERE is_active = true),
    'inactiveUsers',  (SELECT COUNT(*) FROM users WHERE is_active = false),
    'totalProducts',  (SELECT COUNT(*) FROM products),
    'activeProducts', (SELECT COUNT(*) FROM products WHERE is_active = true),
    'inactiveProducts',(SELECT COUNT(*) FROM products WHERE is_active = false),
    'totalCategories',(SELECT COUNT(*) FROM categories)
  );
$$;

-- =============================================
-- PART 3: ATOMIC MUTATION FUNCTIONS
-- =============================================

-- 4. Atomic event creation with display_id generation
--    Prevents duplicate display_ids from concurrent requests
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
  p_delivery_from_date TEXT DEFAULT NULL,
  p_delivery_to_date TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_initials TEXT;
  v_first TEXT;
  v_last TEXT;
  v_parts TEXT[];
  v_next_num INT;
  v_display_id TEXT;
  v_result JSON;
BEGIN
  -- Parse initials from client name
  v_parts := string_to_array(TRIM(p_client_name), ' ');
  v_first := COALESCE(v_parts[1], '');
  v_last := CASE WHEN array_length(v_parts, 1) > 1 THEN v_parts[array_length(v_parts, 1)] ELSE '' END;

  IF v_last != '' THEN
    v_initials := UPPER(LEFT(v_first, 1) || LEFT(v_last, 1));
  ELSE
    v_initials := UPPER(LEFT(v_first, 2));
  END IF;

  -- Get next number atomically with FOR UPDATE SKIP LOCKED pattern
  SELECT COALESCE(
    MAX(NULLIF(split_part(display_id, '-', 2), '')::INT),
    0
  ) + 1
  INTO v_next_num
  FROM events
  WHERE display_id LIKE v_initials || '-%';

  v_display_id := v_initials || '-' || LPAD(v_next_num::TEXT, 2, '0');

  INSERT INTO events (
    client_name, company_name, contact_phone, event_date,
    venue, venue_address, city,
    head_karigar_name, manager_name,
    delivery_from_date, delivery_to_date,
    display_id, created_by
  ) VALUES (
    p_client_name, p_company_name, p_contact_phone, p_event_date::DATE,
    p_venue, p_venue_address, p_city,
    p_head_karigar_name, p_manager_name,
    p_delivery_from_date::DATE, p_delivery_to_date::DATE,
    v_display_id, p_created_by
  )
  RETURNING row_to_json(events.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. Atomic event status transition
--    Validates transition rules and updates in single transaction
CREATE OR REPLACE FUNCTION update_event_status(
  p_event_id UUID,
  p_new_status TEXT,
  p_actor_id UUID,
  p_actor_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_result JSON;
BEGIN
  -- Lock the row to prevent concurrent status changes
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found' USING ERRCODE = 'P0002';
  END IF;

  -- Validate transition
  IF NOT (
    (v_event.status = 'live' AND p_new_status IN ('hold', 'finished')) OR
    (v_event.status = 'hold' AND p_new_status IN ('finished', 'live')) OR
    (v_event.status = 'finished' AND p_new_status = 'hold')
  ) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_event.status, p_new_status
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE events SET status = p_new_status, updated_at = NOW()
  WHERE id = p_event_id
  RETURNING row_to_json(events.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 6. Atomic category deletion with product count check
--    Prevents deleting a category while products are being added to it
CREATE OR REPLACE FUNCTION delete_category_safe(p_category_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_active_count INT;
BEGIN
  -- Lock the category row
  PERFORM 1 FROM categories WHERE id = p_category_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found' USING ERRCODE = 'P0002';
  END IF;

  -- Count active products in same transaction
  SELECT COUNT(*) INTO v_active_count
  FROM products
  WHERE category_id = p_category_id AND is_active = true;

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete category. % active product(s) still exist.', v_active_count
      USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM categories WHERE id = p_category_id;
  RETURN true;
END;
$$;

-- 7. Atomic event product creation with validation
--    Validates event status + product active in single transaction
CREATE OR REPLACE FUNCTION create_event_product_validated(
  p_event_id UUID,
  p_product_id UUID,
  p_quantity INT,
  p_unit TEXT,
  p_price DECIMAL DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_product RECORD;
  v_result JSON;
BEGIN
  -- Lock and read event
  SELECT id, status, created_by INTO v_event
  FROM events WHERE id = p_event_id FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check event edit permissions
  IF v_event.status = 'finished' THEN
    IF p_actor_role != 'admin' AND v_event.created_by != p_actor_id THEN
      RAISE EXCEPTION 'Finished events are read-only' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF v_event.status = 'hold' AND p_actor_role != 'admin' THEN
    RAISE EXCEPTION 'Only admin can edit hold events' USING ERRCODE = '42501';
  END IF;

  -- Check product is active
  SELECT id, is_active INTO v_product
  FROM products WHERE id = p_product_id FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_product.is_active THEN
    RAISE EXCEPTION 'Inactive products cannot be added to events' USING ERRCODE = 'P0001';
  END IF;

  -- Insert
  INSERT INTO event_products (event_id, product_id, quantity, unit, price)
  VALUES (p_event_id, p_product_id, p_quantity, p_unit, p_price)
  RETURNING row_to_json(event_products.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 8. Atomic product deactivation with live event check
CREATE OR REPLACE FUNCTION deactivate_product_safe(p_product_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_in_live BOOLEAN;
  v_result JSON;
BEGIN
  -- Lock the product
  PERFORM 1 FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if used in any live event (in same transaction)
  SELECT EXISTS(
    SELECT 1 FROM event_products ep
    JOIN events e ON e.id = ep.event_id
    WHERE ep.product_id = p_product_id AND e.status = 'live'
  ) INTO v_in_live;

  IF v_in_live THEN
    RAISE EXCEPTION 'Cannot deactivate product currently used in a live event'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE products
  SET is_active = false, updated_at = NOW()
  WHERE id = p_product_id
  RETURNING row_to_json(products.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 9. Atomic event product read with event status (reduces 2 queries to 1)
CREATE OR REPLACE FUNCTION get_event_product_with_event(p_event_product_id UUID)
RETURNS JSON
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'event_product', row_to_json(ep.*),
    'event_id', e.id,
    'event_status', e.status,
    'event_created_by', e.created_by
  )
  FROM event_products ep
  JOIN events e ON e.id = ep.event_id
  WHERE ep.id = p_event_product_id;
$$;
