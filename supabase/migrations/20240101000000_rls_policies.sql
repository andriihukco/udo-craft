-- ============================================================
-- RLS Policies Migration
-- U:DO Craft — Row Level Security for all application tables
--
-- Apply with:  supabase db push  (or  supabase migration up)
-- Idempotent:  safe to run multiple times
-- ============================================================

-- ─────────────────────────────────────────────
-- LEADS
-- Customers can read/create their own leads.
-- Ownership is determined by customer_data->>'email' matching
-- the authenticated user's email (auth.email()).
-- Service role bypasses RLS entirely (Supabase default).
-- ─────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Customers can read their own leads
CREATE POLICY IF NOT EXISTS "leads_select_own"
  ON leads
  FOR SELECT
  TO authenticated
  USING (customer_data->>'email' = auth.email());

-- Customers can create a new lead (INSERT)
-- The email in customer_data must match the authenticated user
CREATE POLICY IF NOT EXISTS "leads_insert_own"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_data->>'email' = auth.email());

-- Unauthenticated (anon) users can also submit a lead
-- (the contact form does not require login)
CREATE POLICY IF NOT EXISTS "leads_insert_anon"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- Customers can read order_items that belong to their own leads.
-- INSERT is allowed when creating a lead (anon or authenticated).
-- ─────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Authenticated customers can read items for their own leads
CREATE POLICY IF NOT EXISTS "order_items_select_own"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = order_items.lead_id
        AND leads.customer_data->>'email' = auth.email()
    )
  );

-- Authenticated customers can insert items for their own leads
CREATE POLICY IF NOT EXISTS "order_items_insert_own"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = order_items.lead_id
        AND leads.customer_data->>'email' = auth.email()
    )
  );

-- Anon users can insert order items when submitting a lead
CREATE POLICY IF NOT EXISTS "order_items_insert_anon"
  ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- Public read for everyone (anon + authenticated).
-- Write operations are restricted to service role only
-- (no policy grants INSERT/UPDATE/DELETE to anon or authenticated).
-- ─────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "products_select_public"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- MESSAGES
-- Customers can read and send messages for their own leads.
-- ─────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Authenticated customers can read messages for their own leads
CREATE POLICY IF NOT EXISTS "messages_select_own"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = messages.lead_id
        AND leads.customer_data->>'email' = auth.email()
    )
  );

-- Authenticated customers can send messages on their own leads
CREATE POLICY IF NOT EXISTS "messages_insert_own"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = messages.lead_id
        AND leads.customer_data->>'email' = auth.email()
    )
  );

-- Anon users can insert client-side messages (pre-login contact)
CREATE POLICY IF NOT EXISTS "messages_insert_anon"
  ON messages
  FOR INSERT
  TO anon
  WITH CHECK (sender = 'client');

-- ─────────────────────────────────────────────
-- CATEGORIES
-- Public read for everyone.
-- Write restricted to service role only.
-- ─────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "categories_select_public"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- MATERIALS
-- Public read for everyone.
-- Write restricted to service role only.
-- ─────────────────────────────────────────────
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "materials_select_public"
  ON materials
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- PRINT ZONES
-- Public read for everyone.
-- Write restricted to service role only.
-- ─────────────────────────────────────────────
ALTER TABLE print_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "print_zones_select_public"
  ON print_zones
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- PRINT TYPE PRICING
-- Public read for everyone.
-- Write restricted to service role only.
-- ─────────────────────────────────────────────
ALTER TABLE print_type_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "print_type_pricing_select_public"
  ON print_type_pricing
  FOR SELECT
  TO anon, authenticated
  USING (true);
