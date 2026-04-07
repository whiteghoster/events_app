-- Event Management System - Initial Schema
-- Phase 1 Foundation - All tables created at once

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_claims" = '{"role": "admin"}';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'staff_member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
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

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    occasion_type TEXT NOT NULL CHECK (occasion_type IN ('wedding', 'birthday', 'corporate', 'religious', 'social', 'other')),
    date DATE NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'hold', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Event Products table
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

-- Audit Log table
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

-- Row Level Security Policies

-- Users table - Only admin can read/write
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Only admin can manage users" ON users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Categories table - All can read, admin/staff can write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are readable by all authenticated users" ON categories
    FOR SELECT USING (auth.role() IN ('admin', 'staff', 'staff_member'));

CREATE POLICY "Only admin and staff can manage categories" ON categories
    FOR ALL USING (
        auth.role() IN ('admin', 'staff')
    );

-- Products table - All can read, admin/staff can write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are readable by all authenticated users" ON products
    FOR SELECT USING (
        auth.role() IN ('admin', 'staff', 'staff_member') AND
        is_active = true
    );

CREATE POLICY "Only admin and staff can manage products" ON products
    FOR ALL USING (
        auth.role() IN ('admin', 'staff')
    );

-- Events table - All can read, admin/staff can write
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are readable by all authenticated users" ON events
    FOR SELECT USING (
        auth.role() IN ('admin', 'staff', 'staff_member')
    );

CREATE POLICY "Only admin and staff can manage events" ON events
    FOR ALL USING (
        auth.role() IN ('admin', 'staff')
    );

-- Event Products table - All can read, admin/staff can write
ALTER TABLE event_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event products are readable by all authenticated users" ON event_products
    FOR SELECT USING (
        auth.role() IN ('admin', 'staff', 'staff_member')
    );

CREATE POLICY "Only admin and staff can manage event products" ON event_products
    FOR ALL USING (
        auth.role() IN ('admin', 'staff')
    );

-- Audit Log table - Only admin can read, no write policy (trigger only)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admin can view audit logs" ON audit_log
    FOR SELECT USING (
        auth.role() = 'admin'
    );

-- Audit Trigger Function
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

-- Create audit triggers for all audited tables
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

-- Session variable function for audit user ID
CREATE OR REPLACE FUNCTION set_app_user_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
