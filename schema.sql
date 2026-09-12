-- ==============================================================================
-- KONICHIWA MART / BOUTIQUE JAPANESE BEAUTY & COSMETICS D2C DATABASE SCHEMA
-- Target Database: Supabase (PostgreSQL 15+)
-- Features:
--   1. Customer Authentication & Profile Management (linked to auth.users)
--   2. Customer Multi-Address Book (Home, Office, Default address)
--   3. GST-Compliant Orders & Itemized Lines (HSN Code 3304, CGST/SGST/IGST)
--   4. Razorpay Payment Records & Signature Verification State
--   5. Shiprocket Logistics Tracking (AWB Number, Courier Partner, Delivery Timeline)
--   6. Row Level Security (RLS) & Secure Server-Side Webhook Access
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CUSTOMER PROFILES (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(150),
  phone VARCHAR(20),
  skin_type VARCHAR(50) DEFAULT 'All',
  skin_concerns TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. CUSTOMER SAVED ADDRESSES (Address Book)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  tag VARCHAR(50) DEFAULT 'Home',                -- 'Home', 'Office', 'Other'
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  state_code VARCHAR(10) DEFAULT '27',           -- GST state code (e.g. 27 for Maharashtra)
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses(customer_id);

-- ==============================================================================
-- 4. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. PRODUCTS TABLE (Cosmetics & Skincare with HSN 3304)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(150) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  benefits TEXT[] DEFAULT '{}',
  usage_how_to TEXT,
  key_actives JSONB DEFAULT '[]'::jsonb,
  full_ingredients TEXT,
  hsn_code VARCHAR(10) DEFAULT '3304',          -- GST Cosmetics HSN
  base_price NUMERIC(10, 2) NOT NULL,
  compare_at_price NUMERIC(10, 2),
  primary_image_url TEXT NOT NULL,
  secondary_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  volume_or_weight VARCHAR(50) NOT NULL,
  accent_color VARCHAR(20) DEFAULT '#E11D48',
  skin_types TEXT[] DEFAULT '{"All"}',
  skin_concerns TEXT[] DEFAULT '{}',
  routine VARCHAR(20) DEFAULT 'AM/PM',
  is_bestseller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3, 2) DEFAULT 4.90,
  reviews_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- ==============================================================================
-- 6. PRODUCT VARIANTS / SHADES / INVENTORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  shade_name VARCHAR(100),
  hex_color VARCHAR(20),
  variant_image_url TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 50 CHECK (stock_quantity >= 0),
  weight_grams INT NOT NULL DEFAULT 150,        -- Used for Shiprocket weight tier
  is_default BOOLEAN DEFAULT false,
  barcode VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- ==============================================================================
-- 7. ORDERS TABLE (Full Razorpay, Shiprocket, & GST Invoicing)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,      -- e.g. KM-ORD-2026-8492
  invoice_number VARCHAR(50) NOT NULL UNIQUE,    -- e.g. KM-INV-2026-8492
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  
  -- Customer Details (Required on GST tax invoices)
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  
  -- Shipping Address Details
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  state_code VARCHAR(10) DEFAULT '27',           -- GST State Code (e.g. 27 for Maharashtra)
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'India',
  
  -- Financials & Taxes (INR)
  currency VARCHAR(10) DEFAULT 'INR',
  subtotal NUMERIC(10, 2) NOT NULL,
  cgst NUMERIC(10, 2) DEFAULT 0.00,              -- 9% CGST for Intrastate
  sgst NUMERIC(10, 2) DEFAULT 0.00,              -- 9% SGST for Intrastate
  igst NUMERIC(10, 2) DEFAULT 0.00,              -- 18% IGST for Interstate
  shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) DEFAULT 0.00,
  discount_code VARCHAR(50),
  total_amount NUMERIC(10, 2) NOT NULL,
  
  -- Order Status & Payment
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, processing, dispatched, delivered, cancelled
  payment_method VARCHAR(50) DEFAULT 'RAZORPAY',
  
  -- Razorpay Integration
  razorpay_order_id VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature TEXT,
  
  -- Shiprocket Integration
  shiprocket_order_id VARCHAR(100),
  shiprocket_shipment_id VARCHAR(100),
  awb_number VARCHAR(100),
  courier_partner VARCHAR(100),
  tracking_url TEXT,
  estimated_delivery_date DATE,
  
  -- Invoice
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ==============================================================================
-- 8. ORDER ITEMS TABLE (Itemized SKUs & HSN 3304)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  shade_name VARCHAR(100),
  sku VARCHAR(100) NOT NULL,
  hsn_code VARCHAR(10) DEFAULT '3304',
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10, 2) NOT NULL,
  weight_grams INT DEFAULT 150,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ==============================================================================
-- 9. AUTOMATIC TRIGGER: Sync auth.users -> public.customer_profiles
-- Whenever a customer registers or signs up, their customer_profiles row is created
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.customer_profiles.full_name END,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.customer_profiles.phone END,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow clean re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_customer();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 10.1 Customer Profiles RLS
CREATE POLICY "Customers can view their own profile"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers can update their own profile"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 10.2 Customer Addresses RLS
CREATE POLICY "Customers can manage their own addresses"
  ON public.customer_addresses FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- 10.3 Catalog Public Read & Store Management
DROP POLICY IF EXISTS "Active products are readable by everyone" ON public.products;
DROP POLICY IF EXISTS "Allow reading products" ON public.products;
DROP POLICY IF EXISTS "Allow managing products" ON public.products;
CREATE POLICY "Allow reading products"
  ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow managing products"
  ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Product variants are readable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Allow reading variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow managing variants" ON public.product_variants;
CREATE POLICY "Allow reading variants"
  ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Allow managing variants"
  ON public.product_variants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Allow reading categories" ON public.categories;
DROP POLICY IF EXISTS "Allow managing categories" ON public.categories;
CREATE POLICY "Allow reading categories"
  ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow managing categories"
  ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- 10.4 Orders & Order Items RLS
-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow viewing orders" ON public.orders;
DROP POLICY IF EXISTS "Allow viewing order items" ON public.order_items;

-- A) Allow Public & Authenticated users to INSERT orders (Checkout)
CREATE POLICY "Allow public insert on orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert on order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- B) Allow Viewing Orders (Customers, Guests, and Server)
-- Note: Uses auth.jwt() ->> 'email' instead of (SELECT email FROM auth.users) to avoid permission errors
CREATE POLICY "Allow viewing orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id OR 
    customer_email = (auth.jwt() ->> 'email') OR
    auth.role() = 'service_role' OR
    auth.role() = 'anon'
  );

-- Order Items Select RLS
CREATE POLICY "Allow viewing order items"
  ON public.order_items FOR SELECT
  USING (true);

-- C) Allow updating orders (for order status, AWB, delivery tracking updates)
CREATE POLICY "Allow update on orders"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Service Role (Backend Server) full access for Webhooks, Shiprocket updates, and Resend
DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
CREATE POLICY "Service role full access on orders"
  ON public.orders FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on order items" ON public.order_items;
CREATE POLICY "Service role full access on order items"
  ON public.order_items FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on products" ON public.products;
CREATE POLICY "Service role full access on products"
  ON public.products FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. AUTO-UPDATE TIMESTAMP FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER trg_customer_profiles_updated_at
BEFORE UPDATE ON public.customer_profiles
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
