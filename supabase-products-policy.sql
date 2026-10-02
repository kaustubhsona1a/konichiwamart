-- ==========================================
-- SUPABASE SCHEMA FOR PRODUCTS & REELS
-- Konichiwa Mart E-Commerce Database
-- ==========================================

-- 1. PRODUCTS TABLE
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
  is_coming_soon boolean DEFAULT false,
  badges text[] DEFAULT '{}',
  stock_quantity integer DEFAULT 50,
  display_order integer DEFAULT 1,
  shades jsonb DEFAULT '[]'::jsonb,
  rating numeric DEFAULT 4.90,
  reviews_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist even if table was previously created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coming_soon boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shades jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access on products
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT
  USING (true);

-- Allow public / authenticated insert, update, delete on products
DROP POLICY IF EXISTS "Allow write access on products" ON public.products;
CREATE POLICY "Allow write access on products"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. REELS TABLE
CREATE TABLE IF NOT EXISTS public.reels (
  id text PRIMARY KEY,
  title text NOT NULL,
  video_url text NOT NULL,
  thumbnail text,
  product_id text,
  likes integer DEFAULT 0,
  views text DEFAULT '1.2k',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on reels
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Allow public read access on reels
DROP POLICY IF EXISTS "Allow public read access on reels" ON public.reels;
CREATE POLICY "Allow public read access on reels"
  ON public.reels FOR SELECT
  USING (true);

-- Allow public / authenticated write access on reels
DROP POLICY IF EXISTS "Allow write access on reels" ON public.reels;
CREATE POLICY "Allow write access on reels"
  ON public.reels FOR ALL
  USING (true)
  WITH CHECK (true);
