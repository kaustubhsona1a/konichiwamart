-- ==============================================================================
-- KONICHIWA MART - PRODUCT SCHEMA UPDATE / MIGRATION
-- Run this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Ensure all Card & Deep Catalog columns exist on public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shades JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS volume_or_weight VARCHAR(50) DEFAULT '100ml';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#E11D48';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS skin_types TEXT[] DEFAULT '{"All"}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS skin_concerns TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS routine VARCHAR(20) DEFAULT 'AM/PM';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.90;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;

-- 2. Performance indexes for storefront queries & catalog ordering
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);
CREATE INDEX IF NOT EXISTS idx_products_is_coming_soon ON public.products(is_coming_soon);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products(is_bestseller);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 3. Ensure Row-Level-Security (RLS) policies allow public reads & operator updates
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access on products" ON public.products;
CREATE POLICY "Service role full access on products"
  ON public.products FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated operators can insert products" ON public.products;
CREATE POLICY "Authenticated operators can insert products"
  ON public.products FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated operators can update products" ON public.products;
CREATE POLICY "Authenticated operators can update products"
  ON public.products FOR UPDATE
  USING (true) WITH CHECK (true);

-- 4. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
