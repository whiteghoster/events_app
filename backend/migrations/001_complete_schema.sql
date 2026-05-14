-- Zevan - Complete Database Schema
-- Date: 2025-01-09
-- Description: Consolidated migration with all schema changes

-- =============================================
-- 1. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 2. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'karigar', 'manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admin can manage users" ON users;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid()::text = id::text OR
        auth.jwt() ->> 'role' IN ('admin', 'manager', 'karigar')
    );

CREATE POLICY "Only admin can manage users" ON users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

-- =============================================
-- 3. CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
DROP POLICY IF EXISTS "Categories are readable by all authenticated users" ON categories;
DROP POLICY IF EXISTS "Only admin and karigar can manage categories" ON categories;

CREATE POLICY "Categories are readable by all authenticated users" ON categories
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

CREATE POLICY "Only admin and karigar can manage categories" ON categories
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'karigar')
    );

-- =============================================
-- 4. PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    default_unit TEXT NOT NULL,
    price DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products RLS Policies
DROP POLICY IF EXISTS "Products are readable by all authenticated users" ON products;
DROP POLICY IF EXISTS "Only admin and karigar can manage products" ON products;

CREATE POLICY "Products are readable by all authenticated users" ON products
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager') AND
        is_active = true
    );

CREATE POLICY "Only admin and karigar can manage products" ON products
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'karigar')
    );

-- =============================================
-- 5. EVENTS TABLE (Complete Schema)
-- =============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id VARCHAR(15) UNIQUE,
    
    -- Event Details
    name TEXT NOT NULL,
    occasion_type TEXT NOT NULL CHECK (occasion_type IN ('haldi', 'bhaat', 'mehendi', 'wedding', 'reception', 'cocktail', 'after_party', 'others')),
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'hold', 'finished')),
    
    -- Dates
    date DATE NOT NULL,
    delivery_from_date DATE,
    delivery_to_date DATE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Venue Information
    venue_name TEXT,
    venue TEXT,
    venue_address TEXT,
    city TEXT,
    
    -- Client Information
    client_name TEXT,
    company_name TEXT,
    contact_phone TEXT,
    
    -- Staff Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    head_karigar TEXT,
    manager TEXT,
    
    -- Additional Info
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events RLS Policies
DROP POLICY IF EXISTS "Events are readable by all authenticated users" ON events;
DROP POLICY IF EXISTS "Only admin and karigar can manage events" ON events;

CREATE POLICY "Events are readable by all authenticated users" ON events
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

CREATE POLICY "Only admin and karigar can manage events" ON events
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar')
    );

-- Events Indexes
CREATE INDEX IF NOT EXISTS idx_events_assigned_to ON events(assigned_to);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_client_name ON events(client_name);

-- Column Comments
COMMENT ON COLUMN events.display_id IS 'Human-readable event ID (e.g., EVT001)';
COMMENT ON COLUMN events.client_name IS 'Name of the client';
COMMENT ON COLUMN events.company_name IS 'Company name of the client';
COMMENT ON COLUMN events.contact_phone IS 'Contact phone number of the client';
COMMENT ON COLUMN events.venue IS 'Event venue name';
COMMENT ON COLUMN events.city IS 'City where the event is held';
COMMENT ON COLUMN events.head_karigar IS 'Head karigar assigned to the event';
COMMENT ON COLUMN events.manager IS 'Manager assigned to the event';
COMMENT ON COLUMN events.delivery_from_date IS 'Delivery start date';
COMMENT ON COLUMN events.delivery_to_date IS 'Delivery end date';

-- =============================================
-- 6. EVENT PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on event_products
ALTER TABLE event_products ENABLE ROW LEVEL SECURITY;

-- Event Products RLS Policies
DROP POLICY IF EXISTS "Event products are readable by all authenticated users" ON event_products;
DROP POLICY IF EXISTS "Only admin and karigar can manage event products" ON event_products;

CREATE POLICY "Event products are readable by all authenticated users" ON event_products
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar', 'manager')
    );

CREATE POLICY "Only admin and karigar can manage event products" ON event_products
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'karigar')
    );

-- =============================================
-- 7. AUDIT LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit Log RLS Policies
DROP POLICY IF EXISTS "Only admin can view audit logs" ON audit_log;

CREATE POLICY "Only admin can view audit logs" ON audit_log
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- =============================================
-- 8. AUDIT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (entity_type, entity_id, action, user_id, old_values, new_values)
        VALUES (
            TG_TABLE_NAME,
            OLD.id,
            TG_OP,
            current_setting('app.user_id'),
            row_to_json(OLD),
            NULL
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (entity_type, entity_id, action, user_id, old_values, new_values)
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            current_setting('app.user_id'),
            row_to_json(OLD),
            row_to_json(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (entity_type, entity_id, action, user_id, old_values, new_values)
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            current_setting('app.user_id'),
            NULL,
            row_to_json(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 9. AUDIT TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS categories_audit_trigger ON categories;
CREATE TRIGGER categories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS products_audit_trigger ON products;
CREATE TRIGGER products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS events_audit_trigger ON events;
CREATE TRIGGER events_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS event_products_audit_trigger ON event_products;
CREATE TRIGGER event_products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION set_app_user_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 11. SEED CATALOG DATA
-- =============================================
-- Insert Categories
INSERT INTO categories (id, name, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Flowers', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Decorations', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Lighting', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Fabric', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Furniture', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Products for Flowers
INSERT INTO products (id, name, category_id, default_unit, price, description, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'Red Roses', '550e8400-e29b-41d4-a716-446655440001', 'bunch', 500, 'Fresh red roses for decoration', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 'White Lilies', '550e8400-e29b-41d4-a716-446655440001', 'bunch', 450, 'Elegant white lilies', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440013', 'Gerbera', '550e8400-e29b-41d4-a716-446655440001', 'bunch', 300, 'Colorful gerbera flowers', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440014', 'Orchids', '550e8400-e29b-41d4-a716-446655440001', 'bunch', 800, 'Premium orchids', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440015', 'Marigold', '550e8400-e29b-41d4-a716-446655440001', 'kg', 200, 'Traditional marigold flowers', true, NOW(), NOW())
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert Products for Decorations
INSERT INTO products (id, name, category_id, default_unit, price, description, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'Balloons', '550e8400-e29b-41d4-a716-446655440002', 'pcs', 10, 'Decorative balloons', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440022', 'Ribbons', '550e8400-e29b-41d4-a716-446655440002', 'roll', 50, 'Decorative ribbons', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', 'Confetti', '550e8400-e29b-41d4-a716-446655440002', 'box', 150, 'Colorful confetti', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440024', 'Centerpieces', '550e8400-e29b-41d4-a716-446655440002', 'pcs', 200, 'Table centerpieces', true, NOW(), NOW())
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert Products for Lighting
INSERT INTO products (id, name, category_id, default_unit, price, description, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', 'Fairy Lights', '550e8400-e29b-41d4-a716-446655440003', 'metre', 30, 'LED fairy lights', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440032', 'Candles', '550e8400-e29b-41d4-a716-446655440003', 'pcs', 25, 'Decorative candles', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440033', 'Lanterns', '550e8400-e29b-41d4-a716-446655440003', 'pcs', 150, 'Decorative lanterns', true, NOW(), NOW())
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert Products for Fabric
INSERT INTO products (id, name, category_id, default_unit, price, description, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440041', 'Silk Cloth', '550e8400-e29b-41d4-a716-446655440004', 'metre', 100, 'Premium silk fabric', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440042', 'Velvet', '550e8400-e29b-41d4-a716-446655440004', 'metre', 150, 'Luxury velvet fabric', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440043', 'Net Fabric', '550e8400-e29b-41d4-a716-446655440004', 'metre', 80, 'Decorative net fabric', true, NOW(), NOW())
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert Products for Furniture
INSERT INTO products (id, name, category_id, default_unit, price, description, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440051', 'Chairs', '550e8400-e29b-41d4-a716-446655440005', 'pcs', 100, 'Event chairs', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440052', 'Tables', '550e8400-e29b-41d4-a716-446655440005', 'pcs', 200, 'Event tables', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440053', 'Sofa', '550e8400-e29b-41d4-a716-446655440005', 'pcs', 500, 'Decorative sofa', true, NOW(), NOW())
ON CONFLICT (name, category_id) DO NOTHING;

-- =============================================
-- 12. CLEANUP OLD/DEPRECATED COLUMNS
-- =============================================
-- Remove deprecated columns (commented out - run manually if needed)
-- ALTER TABLE events DROP COLUMN IF EXISTS contact_person;
-- ALTER TABLE events DROP COLUMN IF EXISTS contact_name;

-- =============================================
-- 13. DATABASE SETTINGS
-- =============================================
ALTER DATABASE postgres SET "app.jwt_claims" = '{"role": "admin"}';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Uncomment to verify after running:
-- SELECT 'Tables created:' as info;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT 'RLS enabled on:' as info;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
