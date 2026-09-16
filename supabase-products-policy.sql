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
  benefits text[],
  usage_how_to text,
  key_actives jsonb,
  full_ingredients text,
  hsn_code text DEFAULT '3304',
  base_price numeric NOT NULL,
  compare_at_price numeric,
  primary_image_url text NOT NULL,
  secondary_image_url text,
  images text[],
  volume_or_weight text,
  accent_color text DEFAULT '#E11D48',
  skin_types text[],
  skin_concerns text[],
  routine text DEFAULT 'AM/PM',
  is_bestseller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_active boolean DEFAULT true,
  rating numeric DEFAULT 4.9,
  reviews_count integer DEFAULT 50,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access on products
CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT
  USING (true);

-- Allow public / authenticated insert, update, delete on products
CREATE POLICY "Allow write access on products"
  ON public.products FOR ALL
  USING (true);


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
CREATE POLICY "Allow public read access on reels"
  ON public.reels FOR SELECT
  USING (true);

-- Allow write access on reels
CREATE POLICY "Allow write access on reels"
  ON public.reels FOR ALL
  USING (true);
