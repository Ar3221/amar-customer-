-- ==================================================
-- AMAR INDUSTRIES ERP - DEMO PORTAL SUPABASE SYNC
-- Migration: 20260525153000_demo_portal_sync.sql
-- Aligns the public demo portals with the Supabase schema.
-- ==================================================

-- Product fields used by the React apps but missing in the initial schema.
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type text NOT NULL DEFAULT 'units';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS trending boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_printing boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_details text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS export_specifications text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS orders_count integer NOT NULL DEFAULT 0;

-- App-facing order metadata. The portals use text IDs and demo users/products.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_order_id text UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_public_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_company text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supervisor_public_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supervisor_name text;
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS app_item_id text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_public_id text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku text;
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE remarks ADD COLUMN IF NOT EXISTS app_remark_id text;
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS author_public_id text;
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS author_role text;
ALTER TABLE remarks ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS public_user_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_text text;

ALTER TABLE email_preferences ADD COLUMN IF NOT EXISTS public_user_id text UNIQUE;
ALTER TABLE email_preferences ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_app_order_id ON orders(app_order_id) WHERE app_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_app_item_id ON order_items(app_item_id);
CREATE INDEX IF NOT EXISTS idx_remarks_app_remark_id ON remarks(app_remark_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_user_id ON users(public_user_id) WHERE public_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_preferences_public_user_id ON email_preferences(public_user_id) WHERE public_user_id IS NOT NULL;

INSERT INTO users (id, public_user_id, email, role_role, full_name, phone_number, company_name, gst_number, shipping_address, password_text)
VALUES
  (uuid_generate_v4(), 'usr-customer-1', 'buyer@nestle.com', 'customer', 'David Thorne (Nestle Global Procurement)', '+91 98765 43210', 'Nestle India Private Limited', '07AAACN0279L1Z5', 'Plot No. 2, Industrial Focal Point, Moga, Punjab, 142001', 'customer123'),
  (uuid_generate_v4(), 'usr-supervisor-1', 'supervisor@amarsplints.com', 'supervisor', 'Rahul Sharma (Operations Lead)', NULL, NULL, NULL, NULL, 'super123'),
  (uuid_generate_v4(), 'usr-admin-1', 'admin@amarsplints.com', 'admin', 'Amarjit Singh (Managing Director)', NULL, NULL, NULL, NULL, 'admin123')
ON CONFLICT (email) DO UPDATE
SET
  public_user_id = EXCLUDED.public_user_id,
  role_role = EXCLUDED.role_role,
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  company_name = EXCLUDED.company_name,
  gst_number = EXCLUDED.gst_number,
  shipping_address = EXCLUDED.shipping_address,
  password_text = EXCLUDED.password_text;

-- Demo portals use anon keys and local demo identities instead of Supabase Auth.
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;
CREATE POLICY "Demo portals can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Demo portals can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo portals can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Demo portals can delete users" ON users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Customers can create own orders" ON orders;
DROP POLICY IF EXISTS "Supervisors can view all orders" ON orders;
DROP POLICY IF EXISTS "Supervisors can update assigned or pending orders" ON orders;
CREATE POLICY "Demo portals can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Demo portals can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo portals can update orders" ON orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
DROP POLICY IF EXISTS "Customers can create own order items" ON order_items;
DROP POLICY IF EXISTS "Staff can view all order items" ON order_items;
CREATE POLICY "Demo portals can read order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Demo portals can create order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view remarks for their orders" ON remarks;
DROP POLICY IF EXISTS "Staff can insert remarks" ON remarks;
CREATE POLICY "Demo portals can read remarks" ON remarks FOR SELECT USING (true);
CREATE POLICY "Demo portals can create remarks" ON remarks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own email preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can update own email preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can insert own email preferences" ON email_preferences;
DROP POLICY IF EXISTS "Staff can view all email preferences" ON email_preferences;
CREATE POLICY "Demo portals can read email preferences" ON email_preferences FOR SELECT USING (true);
CREATE POLICY "Demo portals can insert email preferences" ON email_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo portals can update email preferences" ON email_preferences FOR UPDATE USING (true);
