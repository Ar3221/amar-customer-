-- ==================================================
-- AMAR INDUSTRIES ERP DATABASE SCHEMA & ARCHITECTURE
-- Migration: 20260525000000_init_schema.sql
-- ==================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- 1. TYPES & ENUMS DEFINITIONS
-- ==================================================

CREATE TYPE user_role AS ENUM ('customer', 'supervisor', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'processing', 'dispatched', 'delivered', 'escalated');
CREATE TYPE remark_type AS ENUM ('approval', 'rejection', 'operational', 'escalation');

-- ==================================================
-- 2. TABLE DEFINITIONS
-- ==================================================

-- A. ROLES TABLE
CREATE TABLE roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name user_role NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. USERS / PROFILES TABLE
-- Links with Supabase Auth auth.users
CREATE TABLE users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    role_role user_role NOT NULL DEFAULT 'customer',
    full_name text,
    phone_number text,
    company_name text,
    gst_number text,
    shipping_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. CATEGORIES TABLE
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. PRODUCTS TABLE
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id uuid REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
    name text NOT NULL,
    sku text NOT NULL UNIQUE,
    description text,
    dimensions jsonb, -- e.g., {"height": "75mm", "top_dia": "80mm", "bottom_dia": "55mm"}
    material text,    -- e.g., "Premium Grade Bleached Board", "IML Food Grade Polypropylene"
    moq integer NOT NULL DEFAULT 10000,
    base_price decimal(12, 4) NOT NULL,
    volume_pricing jsonb, -- e.g., [{"qty": 10000, "price": 1.20}, {"qty": 50000, "price": 1.05}]
    image_urls text[] DEFAULT '{}'::text[],
    is_available boolean NOT NULL DEFAULT true,
    stock_level integer NOT NULL DEFAULT 0,
    min_stock_threshold integer NOT NULL DEFAULT 20000,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. ORDERS TABLE
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount decimal(15, 2) NOT NULL DEFAULT 0.00,
    shipping_details jsonb NOT NULL, -- {"full_name": "", "address": "", "city": "", "phone": ""}
    gst_number text,
    notes text,
    supervisor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    escalated_at timestamp with time zone,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. ORDER ITEMS TABLE
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    quantity integer NOT NULL,
    unit_price decimal(12, 4) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- G. REMARKS TABLE
CREATE TABLE remarks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    author_id uuid REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    content text NOT NULL,
    type remark_type NOT NULL DEFAULT 'operational',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- H. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL, -- 'order_status', 'escalation', 'inventory'
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- I. INVENTORY TABLE
CREATE TABLE inventory (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_stock integer NOT NULL DEFAULT 0,
    reorder_point integer NOT NULL DEFAULT 10000,
    last_restocked_at timestamp with time zone,
    status text NOT NULL DEFAULT 'in_stock',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- J. ANALYTICS TABLE
CREATE TABLE analytics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name text NOT NULL,
    metric_value decimal(15, 4) NOT NULL,
    dimension text, -- e.g., 'category', 'region'
    record_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- K. QUOTATIONS TABLE (Custom price negotiation)
CREATE TABLE quotations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    target_quantity integer NOT NULL,
    target_price decimal(12, 4) NOT NULL,
    final_offered_price decimal(12, 4),
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'counter_offered'
    supervisor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- L. REPORTS TABLE
CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL, -- 'order_summary', 'inventory_status', 'performance'
    file_url text,
    generated_by uuid REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    filter_params jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- M. EXPORTS TABLE
CREATE TABLE exports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type text NOT NULL, -- 'orders', 'customers', 'inventory', 'analytics'
    format text NOT NULL,      -- 'excel', 'csv', 'pdf'
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    file_url text,
    generated_by uuid REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    filter_params jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- N. ACTIVITY LOGS TABLE
CREATE TABLE activity_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==================================================
-- 3. INDEXES FOR EXTREME QUERY PERFORMANCE
-- ==================================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_remarks_order ON remarks(order_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_analytics_date ON analytics(record_date);

-- ==================================================
-- 4. UTILITIES AND AUTOMATED TRIGGER TRIGGERS
-- ==================================================

-- Auto update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotations_modtime BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Sync products table stock level to inventory table
CREATE OR REPLACE FUNCTION sync_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory (product_id, current_stock, reorder_point, status, updated_at)
    VALUES (NEW.id, NEW.stock_level, NEW.min_stock_threshold, CASE WHEN NEW.stock_level <= NEW.min_stock_threshold THEN 'low_stock' ELSE 'in_stock' END, now())
    ON CONFLICT (product_id) DO UPDATE 
    SET current_stock = EXCLUDED.current_stock,
        reorder_point = EXCLUDED.reorder_point,
        status = CASE WHEN EXCLUDED.current_stock <= EXCLUDED.reorder_point THEN 'low_stock' ELSE 'in_stock' END,
        updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_sync_inventory AFTER INSERT OR UPDATE OF stock_level, min_stock_threshold ON products FOR EACH ROW EXECUTE PROCEDURE sync_product_inventory();

-- ==================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check user roles from JWT metadata or profile sync
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    role_val user_role;
BEGIN
    SELECT role_role INTO role_val FROM users WHERE id = auth.uid();
    RETURN COALESCE(role_val, 'customer'::user_role);
END;
$$ language 'plpgsql' security definer;

-- POLICIES FOR 'users'
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON users FOR SELECT USING (get_current_user_role() IN ('supervisor', 'admin'));
CREATE POLICY "Admins can update any profile" ON users FOR ALL USING (get_current_user_role() = 'admin');

-- POLICIES FOR 'products'
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Only admins can modify products" ON products FOR ALL USING (get_current_user_role() = 'admin');

-- POLICIES FOR 'categories'
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON categories FOR ALL USING (get_current_user_role() = 'admin');

-- POLICIES FOR 'orders'
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Supervisors can view all orders" ON orders FOR SELECT USING (get_current_user_role() IN ('supervisor', 'admin'));
CREATE POLICY "Supervisors can update assigned or pending orders" ON orders FOR UPDATE USING (
    get_current_user_role() = 'admin' OR 
    (get_current_user_role() = 'supervisor' AND (supervisor_id = auth.uid() OR supervisor_id IS NULL OR status = 'pending'))
);

-- POLICIES FOR 'order_items'
CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Customers can create own order items" ON order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Staff can view all order items" ON order_items FOR SELECT USING (get_current_user_role() IN ('supervisor', 'admin'));

-- POLICIES FOR 'remarks'
CREATE POLICY "Users can view remarks for their orders" ON remarks FOR SELECT USING (
    get_current_user_role() IN ('supervisor', 'admin') OR
    EXISTS (SELECT 1 FROM orders WHERE orders.id = remarks.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Staff can insert remarks" ON remarks FOR INSERT WITH CHECK (
    get_current_user_role() IN ('supervisor', 'admin') AND author_id = auth.uid()
);

-- POLICIES FOR 'notifications'
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can create notifications" ON notifications FOR INSERT WITH CHECK (get_current_user_role() IN ('supervisor', 'admin'));

-- POLICIES FOR 'inventory'
CREATE POLICY "Staff can view inventory" ON inventory FOR SELECT USING (get_current_user_role() IN ('supervisor', 'admin'));
CREATE POLICY "Admins can manage inventory" ON inventory FOR ALL USING (get_current_user_role() = 'admin');

-- POLICIES FOR 'quotations'
CREATE POLICY "Customers can view own quotations" ON quotations FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can request quotations" ON quotations FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff can manage quotations" ON quotations FOR ALL USING (get_current_user_role() IN ('supervisor', 'admin'));

-- POLICIES FOR 'reports' & 'exports' & 'activity_logs'
CREATE POLICY "Only staff can manage reports" ON reports FOR ALL USING (get_current_user_role() IN ('supervisor', 'admin'));
CREATE POLICY "Only staff can manage exports" ON exports FOR ALL USING (get_current_user_role() IN ('supervisor', 'admin'));
CREATE POLICY "Only admins can view activity logs" ON activity_logs FOR SELECT USING (get_current_user_role() = 'admin');

-- ==================================================
-- 6. INDUSTRIAL SEED DATA (AMAR SPLINTS / INDUSTRIES)
-- ==================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('customer', 'Global business buyer, distributor, or FMCG company representative'),
('supervisor', 'Internal sales executive, workflow manager, and logistics coordinator'),
('admin', 'Executive Director, manufacturing head, and business analyst');

-- Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Ice Cream Cups', 'ice-cream-cups', 'Premium plastic & paper thermoformed cups with custom brand print compatibility', 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=600'),
('Dairy Products Tubs', 'dairy-products', 'Industrial grade packaging for premium butter, cheese spread, yogurts, and curd', 'https://images.unsplash.com/photo-1528750951167-a2f47e0c10a4?q=80&w=600'),
('IML Containers', 'iml-containers', 'High-definition In-Mold Labelling containers offering photographic graphics and structural integrity', 'https://images.unsplash.com/photo-1549476464-37392f719c28?q=80&w=600'),
('Paper Cups & Containers', 'paper-products', 'Eco-friendly biodegradable single and double wall paper cups for hot & cold FMCG beverages', 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?q=80&w=600'),
('Wooden Spoons & Splints', 'wooden-products', 'Food-safe polished wooden ice cream spoons, flat sticks, and premium match splints', 'https://images.unsplash.com/photo-1582281227099-7f4574488fb6?q=80&w=600'),
('Safety Matchboxes', 'match-products', 'Wax and wooden safety matches manufactured for premium retail and massive global export runs', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600');

-- Products
-- Ice Cream Cups (Category 1)
INSERT INTO products (category_id, name, sku, description, dimensions, material, moq, base_price, volume_pricing, stock_level, min_stock_threshold)
VALUES (
    (SELECT id FROM categories WHERE slug = 'ice-cream-cups'),
    'Classic 100ml Ice Cream Cup',
    'AMAR-IC-100',
    'Perfect sizing for single-serve retail ice cream. Excellent thermal resistance and high clarity clarity.',
    '{"height": "50mm", "top_diameter": "70mm", "bottom_diameter": "50mm", "weight": "2.8g"}',
    'Food Grade Polypropylene (PP)',
    50000,
    0.8500,
    '[{"qty": 50000, "price": 0.8500}, {"qty": 100000, "price": 0.8000}, {"qty": 500000, "price": 0.7500}]'::jsonb,
    120000,
    40000
),
(
    (SELECT id FROM categories WHERE slug = 'ice-cream-cups'),
    'Premium 250ml Dessert Tub',
    'AMAR-IC-250',
    'Perfect sizing for high-end sundaes, family packs, and premium gelato.',
    '{"height": "75mm", "top_diameter": "90mm", "bottom_diameter": "65mm", "weight": "4.2g"}',
    'High Clarified PP (Anti-fogging)',
    25000,
    1.4500,
    '[{"qty": 25000, "price": 1.4500}, {"qty": 50000, "price": 1.3800}, {"qty": 250000, "price": 1.3000}]'::jsonb,
    15000, -- Low stock trigger active!
    30000
);

-- Dairy Products Tubs (Category 2)
INSERT INTO products (category_id, name, sku, description, dimensions, material, moq, base_price, volume_pricing, stock_level, min_stock_threshold)
VALUES (
    (SELECT id FROM categories WHERE slug = 'dairy-products'),
    'Ghee/Butter Tub 500g',
    'AMAR-DY-500',
    'Robust sealable packaging designed for semi-solid dairy fats. Preventative leakage snap-fit lid included.',
    '{"height": "95mm", "top_diameter": "115mm", "bottom_diameter": "88mm", "weight": "11.5g"}',
    'High-Density Polyethylene (HDPE)',
    10000,
    3.8000,
    '[{"qty": 10000, "price": 3.8000}, {"qty": 30000, "price": 3.6500}, {"qty": 100000, "price": 3.5000}]'::jsonb,
    45000,
    10000
),
(
    (SELECT id FROM categories WHERE slug = 'dairy-products'),
    'Yogurt Container 200ml',
    'AMAR-DY-200',
    'Industrial packaging optimized for automatic high-speed sealing lines.',
    '{"height": "70mm", "top_diameter": "80mm", "bottom_diameter": "58mm", "weight": "3.5g"}',
    'High-Impact Polystyrene (HIPS)',
    50000,
    0.9500,
    '[{"qty": 50000, "price": 0.9500}, {"qty": 150000, "price": 0.9000}, {"qty": 500000, "price": 0.8500}]'::jsonb,
    230000,
    50000
);

-- IML Containers (Category 3)
INSERT INTO products (category_id, name, sku, description, dimensions, material, moq, base_price, volume_pricing, stock_level, min_stock_threshold)
VALUES (
    (SELECT id FROM categories WHERE slug = 'iml-containers'),
    'IML Round Tub 1 Litre',
    'AMAR-IML-1000',
    'Photographic quality IML packaging for premium family-pack ice creams or bulk confectionery.',
    '{"height": "120mm", "top_diameter": "140mm", "bottom_diameter": "115mm", "weight": "24.0g"}',
    'Premium Co-Polymer PP (Deep Freeze Grade)',
    20000,
    7.5000,
    '[{"qty": 20000, "price": 7.5000}, {"qty": 50000, "price": 7.2000}, {"qty": 150000, "price": 6.9000}]'::jsonb,
    80000,
    25000
);

-- Paper Cups & Containers (Category 4)
INSERT INTO products (category_id, name, sku, description, dimensions, material, moq, base_price, volume_pricing, stock_level, min_stock_threshold)
VALUES (
    (SELECT id FROM categories WHERE slug = 'paper-products'),
    'Single Wall Hot Cup 8oz',
    'AMAR-PA-08H',
    'Eco-friendly compostable hot paper cup, ideal for coffee, tea, and quick service milk beverages.',
    '{"height": "90mm", "top_diameter": "80mm", "bottom_diameter": "56mm", "weight": "6.8g"}',
    'PLA-Coated Premium Bleached Kraft Paper',
    100000,
    1.1000,
    '[{"qty": 100000, "price": 1.1000}, {"qty": 250000, "price": 1.0500}, {"qty": 1000000, "price": 0.9800}]'::jsonb,
    80000, -- Low stock trigger active!
    150000
);

-- Wooden Spoons & Splints (Category 5)
INSERT INTO products (category_id, name, sku, description, dimensions, material, moq, base_price, volume_pricing, stock_level, min_stock_threshold)
VALUES (
    (SELECT id FROM categories WHERE slug = 'wooden-products'),
    'Wooden Ice Cream Stick 93mm',
    'AMAR-WD-93',
    'Perfectly rounded bevel edges, double polished, sterile ice cream stick suitable for automatic freezer inserters.',
    '{"length": "93mm", "width": "10mm", "thickness": "2.0mm"}',
    '100% Organic White Birchwood',
    500000,
    0.1800,
    '[{"qty": 500000, "price": 0.1800}, {"qty": 1000000, "price": 0.1600}, {"qty": 5000000, "price": 0.1450}]'::jsonb,
    3400000,
    1000000
);

-- Safety Matchboxes (Category 6)
INSERT INTO products (category_id, name, sku, description, dimensions, material, moq, base_price, volume_pricing, stock_level, min_stock_threshold)
VALUES (
    (SELECT id FROM categories WHERE slug = 'match-products'),
    'Premium Wax Matchbox Export-40',
    'AMAR-MA-WX40',
    'High reliability wax matchboxes with high carbon-residue resistance and damp-resistant striking surface.',
    '{"length": "50mm", "width": "35mm", "height": "14mm", "sticks": 40}',
    'Phosphorized Wax Splint / Premium Cardboard',
    200000,
    0.4500,
    '[{"qty": 200000, "price": 0.4500}, {"qty": 500000, "price": 0.4200}, {"qty": 2000000, "price": 0.3800}]'::jsonb,
    1500000,
    500000
);
