-- ==============================================================================
-- KONICHIWA MART — PRODUCT ALL-FIELDS SUPABASE MIGRATION SCRIPT
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- This ensures all product card fields, inventory attributes, and details are
-- fully supported with proper column types, default values, and RLS policies.
-- ==============================================================================

-- 1. Create or ensure public.products table exists
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  category_name text,
  description text,
  benefits text[] DEFAULT '{}',
  usage_how_to text,
  key_actives jsonb DEFAULT '[]'::jsonb,
  full_ingredients text,
  hsn_code text DEFAULT '3304',
  base_price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  primary_image_url text NOT NULL,
  secondary_image_url text,
  images text[] DEFAULT '{}',
  volume_or_weight text DEFAULT '100ml',
  accent_color text DEFAULT '#E11D48',
  skin_types text[] DEFAULT '{"All"}',
  skin_concerns text[] DEFAULT '{}',
  routine text DEFAULT 'AM/PM',
  is_bestseller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_active boolean DEFAULT true,
  rating numeric DEFAULT 4.90,
  reviews_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add all newer product attributes if they do not already exist in your live database
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coming_soon boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shades jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Create high-performance indexes for storefront queries and search
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_name ON public.products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_coming_soon ON public.products(is_coming_soon);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);

-- 4. Enable Row Level Security (RLS) on public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Drop any conflicting restrictive policies and ensure clean public/admin read & write access
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
DROP POLICY IF EXISTS "Allow write access on products" ON public.products;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.products;

CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Allow write access on products"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Verify table columns and types
COMMENT ON TABLE public.products IS 'Konichiwa Mart Tokyo-imported Japanese beauty & cosmetics product catalog';
COMMENT ON COLUMN public.products.base_price IS 'Customer-facing selling price in INR (₹)';
COMMENT ON COLUMN public.products.compare_at_price IS 'Original / MRP price in INR (₹) for discount calculation on product cards';
COMMENT ON COLUMN public.products.is_coming_soon IS 'Displays prominent Coming Soon tag badge and disables instant checkout';
COMMENT ON COLUMN public.products.display_order IS 'Sort order on the storefront catalog (1 = top of homepage)';
COMMENT ON COLUMN public.products.badges IS 'Array of custom promotional badges displayed on product cards';
COMMENT ON COLUMN public.products.shades IS 'JSON array of product shade/color variants [{ id, name, hex, price, sku }]';

-- Output confirmation
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;
