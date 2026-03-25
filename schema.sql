-- U:DO CRAFT (B2B Merch Automation)
-- Supabase PostgreSQL Schema - Idempotent Version
-- Safe to run on existing database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PRODUCTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  base_price_cents INTEGER NOT NULL,
  images JSONB NOT NULL DEFAULT '{}',
  px_to_mm_ratio NUMERIC NOT NULL DEFAULT 0.5,
  collar_y_px INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_customizable BOOLEAN DEFAULT false,
  available_sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRINT ZONES TABLE
-- ─────────────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'print_zone_side') THEN
    CREATE TYPE print_zone_side AS ENUM ('front', 'back');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS print_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  side print_zone_side NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- LEADS TABLE (CRM)
-- ─────────────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('new', 'in_progress', 'production', 'completed', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status lead_status DEFAULT 'new',
  customer_data JSONB NOT NULL DEFAULT '{}',
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  custom_print_url TEXT,
  mockup_url TEXT,
  technical_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ANALYTICS: SITE EVENTS
-- ─────────────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'site_event_type') THEN
    CREATE TYPE site_event_type AS ENUM (
      'pageview',
      'session_start',
      'form_submit',
      'customize_start',
      'customize_complete'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS site_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type site_event_type NOT NULL,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page TEXT,
  referrer TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES FOR PERFORMANCE (idempotent)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_print_zones_product_id') THEN
    CREATE INDEX idx_print_zones_product_id ON print_zones(product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_lead_id') THEN
    CREATE INDEX idx_order_items_lead_id ON order_items(lead_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_product_id') THEN
    CREATE INDEX idx_order_items_product_id ON order_items(product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_is_active') THEN
    CREATE INDEX idx_products_is_active ON products(is_active);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_slug') THEN
    CREATE INDEX idx_products_slug ON products(slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_status') THEN
    CREATE INDEX idx_leads_status ON leads(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_created_at') THEN
    CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_site_events_type') THEN
    CREATE INDEX idx_site_events_type ON site_events(event_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_site_events_created_at') THEN
    CREATE INDEX idx_site_events_created_at ON site_events(created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_site_events_session_id') THEN
    CREATE INDEX idx_site_events_session_id ON site_events(session_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_site_events_visitor_id') THEN
    CREATE INDEX idx_site_events_visitor_id ON site_events(visitor_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) - Idempotent
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS print_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DO $$
BEGIN
  -- Products policies
  DROP POLICY IF EXISTS "Products public read" ON products;
  DROP POLICY IF EXISTS "Products admin write" ON products;
  CREATE POLICY "Products public read" ON products FOR SELECT USING (true);
  CREATE POLICY "Products admin write" ON products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

  -- Print zones policies
  DROP POLICY IF EXISTS "Print zones public read" ON print_zones;
  DROP POLICY IF EXISTS "Print zones admin write" ON print_zones;
  CREATE POLICY "Print zones public read" ON print_zones FOR SELECT USING (true);
  CREATE POLICY "Print zones admin write" ON print_zones FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

  -- Leads policies
  DROP POLICY IF EXISTS "Leads public create" ON leads;
  DROP POLICY IF EXISTS "Leads admin read" ON leads;
  DROP POLICY IF EXISTS "Leads admin update" ON leads;
  CREATE POLICY "Leads public create" ON leads FOR INSERT WITH CHECK (true);
  CREATE POLICY "Leads admin read" ON leads FOR SELECT USING (true);
  CREATE POLICY "Leads admin update" ON leads FOR UPDATE USING (auth.role() = 'authenticated');

  -- Order items policies
  DROP POLICY IF EXISTS "Order items admin all" ON order_items;
  CREATE POLICY "Order items public create" ON order_items FOR INSERT WITH CHECK (true);
  CREATE POLICY "Order items admin read" ON order_items FOR SELECT USING (true);
  CREATE POLICY "Order items admin update" ON order_items FOR UPDATE USING (auth.role() = 'authenticated');

  -- Site events policies
  DROP POLICY IF EXISTS "Site events public insert" ON site_events;
  DROP POLICY IF EXISTS "Site events admin read" ON site_events;
  CREATE POLICY "Site events public insert" ON site_events FOR INSERT WITH CHECK (true);
  CREATE POLICY "Site events admin read" ON site_events FOR SELECT USING (auth.role() = 'authenticated');
END $$;

-- ─────────────────────────────────────────────
-- TRIGGERS FOR UPDATED_AT - Idempotent
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers and recreate
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_products_updated_at ON products;
  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
  CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
  CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;
