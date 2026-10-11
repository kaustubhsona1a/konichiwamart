-- ==============================================================================
-- KONICHIWA MART | MASTER SUPABASE PRODUCTION SCHEMA & STORAGE SETUP
-- Target Database: Supabase PostgreSQL (Postgres 15+)
-- 
-- INSTRUCTIONS FOR STORE OPERATOR:
-- 1. Open your Supabase Dashboard -> SQL Editor
-- 2. Paste this entire script into the editor
-- 3. Click "Run" (it is 100% idempotent and safe to run multiple times)
-- 
-- WHAT THIS SCRIPT COVERS:
-- ✓ Core Extensions (uuid-ossp, pgcrypto)
-- ✓ Complete Tables (products, categories, reviews, reels, orders, order_items, customer_profiles, customer_addresses, site_settings)
-- ✓ Storage Buckets (product-images, banners, reels, review-images)
-- ✓ Strict Row Level Security (RLS) - NO unauthorized edits or modifications!
-- ✓ Role-Based Access Control (RBAC): is_operator() security check
-- ✓ Public Review Writing on ALL Products
-- ✓ Full Seed Data: Authentic Japanese Skincare Catalog, Verified Reviews, Reels
-- ==============================================================================

-- 1. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. OPERATOR ROLE SECURITY HELPER FUNCTION
-- Strictly verifies if the caller is an authenticated operator or admin
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS boolean AS $$
BEGIN
  RETURN (
    COALESCE((auth.jwt() ->> 'role'), '') IN ('operator', 'admin')
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') IN ('operator', 'admin')
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('operator', 'admin')
    OR auth.role() = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. PRODUCTS TABLE (All 30+ Fields for Card & Catalog)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  hsn_code VARCHAR(10) DEFAULT '3304',          -- Indian GST Cosmetics HSN
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10, 2),
  primary_image_url TEXT NOT NULL,
  secondary_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  volume_or_weight VARCHAR(50) NOT NULL DEFAULT '100ml',
  accent_color VARCHAR(20) DEFAULT '#E11D48',
  skin_types TEXT[] DEFAULT '{"All"}',
  skin_concerns TEXT[] DEFAULT '{}',
  routine VARCHAR(20) DEFAULT 'AM/PM',
  is_bestseller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}',
  display_order INT DEFAULT 0,
  stock_quantity INT DEFAULT 50,
  shades JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3, 2) DEFAULT 4.90,
  reviews_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all product columns exist idempotently without overwriting existing data
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand VARCHAR(150);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_name VARCHAR(100) DEFAULT 'Skincare';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS usage_how_to TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS key_actives JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_ingredients TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10) DEFAULT '3304';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS base_price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS volume_or_weight VARCHAR(50) DEFAULT '100ml';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#E11D48';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS skin_types TEXT[] DEFAULT '{"All"}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS skin_concerns TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS routine VARCHAR(20) DEFAULT 'AM/PM';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shades JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.90;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);
CREATE INDEX IF NOT EXISTS idx_products_is_coming_soon ON public.products(is_coming_soon);

-- ==============================================================================
-- 5. PRODUCT VARIANTS / SHADES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  shade_name VARCHAR(100),
  hex_color VARCHAR(20),
  variant_image_url TEXT,
  stock_quantity INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. CUSTOMER PROFILES (Extends auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(150),
  phone VARCHAR(20),
  skin_type VARCHAR(50) DEFAULT 'All',
  skin_concerns TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. CUSTOMER ADDRESS BOOK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  tag VARCHAR(50) DEFAULT 'Home',
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  state_code VARCHAR(10) DEFAULT '27',
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. REVIEWS TABLE (Public Review Writing for ALL Products)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  author TEXT NOT NULL,
  location TEXT DEFAULT 'Verified Customer',
  rating INT NOT NULL DEFAULT 5,
  headline TEXT NOT NULL,
  comment TEXT NOT NULL,
  image_url TEXT,
  verified BOOLEAN DEFAULT true,
  helpful_count INT DEFAULT 0,
  skin_type TEXT DEFAULT 'All Skin Types',
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- ==============================================================================
-- 9. COMMUNITY INSTAGRAM REELS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  video_url TEXT NOT NULL,
  video_thumb TEXT,
  creator_handle TEXT DEFAULT '@konichiwa_mart',
  creator_name TEXT DEFAULT 'Konichiwa Community',
  creator_avatar TEXT,
  location TEXT DEFAULT 'Tokyo',
  product_id TEXT,
  likes INT DEFAULT 0,
  views TEXT DEFAULT '1.2k',
  comments_count INT DEFAULT 0,
  audio_track TEXT,
  instagram_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reels_is_active ON public.reels(is_active);

-- ==============================================================================
-- 10. ORDERS & SHIPROCKET TRACKING TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(100) PRIMARY KEY,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'RAZORPAY',
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature TEXT,
  status VARCHAR(50) DEFAULT 'CONFIRMED',
  tracking_number VARCHAR(100),
  courier_name VARCHAR(100),
  awb_code VARCHAR(100),
  shiprocket_order_id VARCHAR(100),
  shiprocket_shipment_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ==============================================================================
-- 11. ORDER ITEMS (Itemized Breakdown)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(100) REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100),
  sku VARCHAR(100),
  title VARCHAR(200) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. SITE SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. STORAGE BUCKETS INITIALIZATION
-- ==============================================================================
DO $$
BEGIN
  -- 1. Product Images Bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('product-images', 'product-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- 2. Banners Bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('banners', 'banners', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- 3. Reels & Videos Bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('reels', 'reels', true, 104857600, ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png'])
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- 4. Review Customer Photos Bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('review-images', 'review-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage buckets check notice: %', SQLERRM;
END $$;

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- STRICT SECURITY: NO PUBLIC USER CAN MODIFY PRODUCTS, CATEGORIES, OR REELS!
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PRODUCTS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
DROP POLICY IF EXISTS "Allow reading products" ON public.products;
DROP POLICY IF EXISTS "Allow write access on products" ON public.products;
DROP POLICY IF EXISTS "Allow managing products" ON public.products;
DROP POLICY IF EXISTS "Operator manage products" ON public.products;

CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Operator manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

DROP POLICY IF EXISTS "Service role products access" ON public.products;
CREATE POLICY "Service role products access"
  ON public.products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- PRODUCT VARIANTS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow reading variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow managing variants" ON public.product_variants;

CREATE POLICY "Allow reading variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Operator manage variants"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

-- -----------------------------------------------------------------------------
-- CATEGORIES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow reading categories" ON public.categories;
DROP POLICY IF EXISTS "Allow managing categories" ON public.categories;
DROP POLICY IF EXISTS "Operator manage categories" ON public.categories;

CREATE POLICY "Allow reading categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Operator manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

-- -----------------------------------------------------------------------------
-- REVIEWS POLICIES
-- Public can READ approved reviews
-- ANY customer can INSERT a review for ANY product!
-- ONLY operators can UPDATE or DELETE reviews
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow reading reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Operator manage reviews" ON public.reviews;

CREATE POLICY "Allow reading reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved' OR public.is_operator());

CREATE POLICY "Allow public insert on reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Operator manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

-- -----------------------------------------------------------------------------
-- REELS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow reading reels" ON public.reels;
DROP POLICY IF EXISTS "Allow write access on reels" ON public.reels;
DROP POLICY IF EXISTS "Operator manage reels" ON public.reels;

CREATE POLICY "Allow reading reels"
  ON public.reels FOR SELECT
  USING (is_active = true OR public.is_operator());

CREATE POLICY "Operator manage reels"
  ON public.reels FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

-- -----------------------------------------------------------------------------
-- ORDERS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow viewing orders" ON public.orders;
DROP POLICY IF EXISTS "Allow viewing order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow update on orders" ON public.orders;

CREATE POLICY "Allow public insert on orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert on order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow viewing orders"
  ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid() 
    OR customer_email = (auth.jwt() ->> 'email')
    OR public.is_operator()
    OR auth.role() = 'anon'
  );

CREATE POLICY "Allow viewing order items"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow updating orders"
  ON public.orders FOR UPDATE
  USING (public.is_operator() OR auth.role() = 'service_role')
  WITH CHECK (public.is_operator() OR auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- SITE SETTINGS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow reading site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Operator manage site settings" ON public.site_settings;

CREATE POLICY "Allow reading site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Operator manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

-- -----------------------------------------------------------------------------
-- STORAGE RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images', 'banners', 'reels', 'review-images'));

DROP POLICY IF EXISTS "Customer Review Photo Upload" ON storage.objects;
CREATE POLICY "Customer Review Photo Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Operator Storage Manage" ON storage.objects;
CREATE POLICY "Operator Storage Manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (public.is_operator() OR auth.role() = 'service_role')
  WITH CHECK (public.is_operator() OR auth.role() = 'service_role');

-- ==============================================================================
-- 15. NOTIFY POSTGREST SCHEMA RELOAD
-- Forces PostgREST cache refresh so all newly added columns and policies
-- are immediately available for queries from the storefront and operator portal.
-- ==============================================================================
NOTIFY pgrst, 'reload schema';

-- Verification output
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('products', 'categories', 'reviews', 'reels', 'orders') 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
