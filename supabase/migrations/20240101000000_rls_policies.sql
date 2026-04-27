-- ============================================================
-- RLS Policies Migration
-- U:DO Craft — Row Level Security for all application tables
--
-- Apply with:  supabase db push  (or  supabase migration up)
-- Idempotent:  safe to run multiple times
--
-- Note: PostgreSQL does not support CREATE POLICY IF NOT EXISTS.
-- Idempotency is achieved via DO $$ blocks that check pg_policies.
-- ============================================================

-- ─────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_select_own') THEN
    CREATE POLICY "leads_select_own"
      ON leads FOR SELECT TO authenticated
      USING (customer_data->>'email' = auth.email());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_insert_own') THEN
    CREATE POLICY "leads_insert_own"
      ON leads FOR INSERT TO authenticated
      WITH CHECK (customer_data->>'email' = auth.email());
  END IF;
END $$;

-- Anon users can submit a lead (contact form does not require login)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_insert_anon') THEN
    CREATE POLICY "leads_insert_anon"
      ON leads FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items_select_own') THEN
    CREATE POLICY "order_items_select_own"
      ON order_items FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM leads
          WHERE leads.id = order_items.lead_id
            AND leads.customer_data->>'email' = auth.email()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items_insert_own') THEN
    CREATE POLICY "order_items_insert_own"
      ON order_items FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM leads
          WHERE leads.id = order_items.lead_id
            AND leads.customer_data->>'email' = auth.email()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items_insert_anon') THEN
    CREATE POLICY "order_items_insert_anon"
      ON order_items FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- PRODUCTS
-- Public read; writes restricted to service role only.
-- ─────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_select_public') THEN
    CREATE POLICY "products_select_public"
      ON products FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_select_own') THEN
    CREATE POLICY "messages_select_own"
      ON messages FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM leads
          WHERE leads.id = messages.lead_id
            AND leads.customer_data->>'email' = auth.email()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_insert_own') THEN
    CREATE POLICY "messages_insert_own"
      ON messages FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM leads
          WHERE leads.id = messages.lead_id
            AND leads.customer_data->>'email' = auth.email()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_insert_anon') THEN
    CREATE POLICY "messages_insert_anon"
      ON messages FOR INSERT TO anon
      WITH CHECK (sender = 'client');
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_select_public') THEN
    CREATE POLICY "categories_select_public"
      ON categories FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- MATERIALS
-- ─────────────────────────────────────────────
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'materials_select_public') THEN
    CREATE POLICY "materials_select_public"
      ON materials FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- PRINT ZONES
-- ─────────────────────────────────────────────
ALTER TABLE print_zones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'print_zones' AND policyname = 'print_zones_select_public') THEN
    CREATE POLICY "print_zones_select_public"
      ON print_zones FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- PRINT TYPE PRICING
-- ─────────────────────────────────────────────
ALTER TABLE print_type_pricing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'print_type_pricing' AND policyname = 'print_type_pricing_select_public') THEN
    CREATE POLICY "print_type_pricing_select_public"
      ON print_type_pricing FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;
