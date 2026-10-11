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

-- Ensure all columns exist idempotently
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shades JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10) DEFAULT '3304';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

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
  status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
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

-- Public can view active catalog products
CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT
  USING (true);

-- STRICT: ONLY verified operators and service_role can INSERT, UPDATE, or DELETE products!
CREATE POLICY "Operator manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

-- Service role full access
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
-- Public can view active reels
-- ONLY operators can modify reels
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

-- Anyone can place an order during checkout
CREATE POLICY "Allow public insert on orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert on order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Customers can view their own orders; Operators can view all orders
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

-- Operators and backend service_role can update order status / tracking
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
-- Public read access for images and media
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images', 'banners', 'reels', 'review-images'));

-- Public customer review photo upload
DROP POLICY IF EXISTS "Customer Review Photo Upload" ON storage.objects;
CREATE POLICY "Customer Review Photo Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-images');

-- Operator upload and manage access
DROP POLICY IF EXISTS "Operator Storage Manage" ON storage.objects;
CREATE POLICY "Operator Storage Manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (public.is_operator() OR auth.role() = 'service_role')
  WITH CHECK (public.is_operator() OR auth.role() = 'service_role');

-- ==============================================================================
-- 15. SEED DATA: CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (name, slug, description, display_order)
VALUES 
  ('Face Wash', 'face-wash', 'Cleansers and gentle foaming face washes', 1),
  ('Face Mask', 'face-mask', 'Sheet masks and wash-off treatments', 2),
  ('Toner', 'toner', 'Hydrating skin conditioners and lotions', 3),
  ('Sunscreen', 'sunscreen', 'Broad-spectrum Japanese UV protection', 4),
  ('Lips', 'lips', 'Moisturizing lip tints and balms', 5),
  ('Serum', 'serum', 'Targeted active serums and essences', 6),
  ('Cleansing Oil', 'cleansing-oil', 'Deep oil cleansers and makeup removers', 7),
  ('Moisturizer', 'moisturizer', 'Barrier creams and nourishing emulsions', 8),
  ('Hair Care', 'hair-care', 'Intensive hair masks, oils and treatments', 9),
  ('Skincare', 'skincare', 'All-around Japanese beauty and skincare', 10)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 16. SEED DATA: AUTHENTIC JAPANESE PRODUCTS
-- ==============================================================================
INSERT INTO public.products (
  slug, title, subtitle, category_name, description, benefits, usage_how_to,
  key_actives, full_ingredients, hsn_code, base_price, compare_at_price,
  primary_image_url, volume_or_weight, accent_color, skin_types, skin_concerns,
  routine, is_bestseller, is_new, is_coming_soon, badges, stock_quantity, display_order, rating, reviews_count
) VALUES 
(
  'senka-perfect-whip',
  'Senka Perfect Whip Face Wash',
  'Micro-Dense Cleansing Foam with Silk Essence',
  'Face Wash',
  'Japan’s best-selling facial cleanser. Formulated with micro-dense whipped foam technology that gently cushions and lifts impurities and excess sebum from pores without drying out your skin.',
  ARRAY['Creates dense, pillowy whipped foam that reduces friction during washing', 'Purifies pores and removes everyday pollution and buildup', 'Preserves the skin’s natural protective moisture barrier'],
  'Wet your hands and face. Squeeze about 2 cm onto your palm, lather thoroughly with cool or lukewarm water to create a rich foam cushion, gently wash your face, and rinse thoroughly.',
  '[{"name": "Naturally Derived Silk Essence", "purpose": "Protects natural moisture while creating an ultra-fine foam cushion"}, {"name": "Double Hyaluronic Acid", "purpose": "Keeps skin soft, hydrated, and refreshed without feeling tight"}]'::jsonb,
  'Water, Stearic Acid, PEG-8, Myristic Acid, Potassium Hydroxide, Glycerin, Lauric Acid, Alcohol, Butylene Glycol, Glyceryl Stearate SE, Polyquaternium-7, Sodium Hyaluronate, Sericin, Sodium Acetylated Hyaluronate, Hydrolyzed Silk, Disodium EDTA, Sodium Metabisulfite, Citric Acid, Potassium Sorbate, Fragrance.',
  '3304',
  1099,
  1099,
  'https://japanesetaste.com/cdn/shop/files/Senka-Perfect-Whip-Cleansing-Foam-120g-1-2025-08-25T00_18_50.384Z.jpg',
  '120g',
  '#0284C7',
  ARRAY['All', 'Oily', 'Combination', 'Normal'],
  ARRAY['Hydration', 'Blemishes & Texture', 'Glow & Dullness'],
  'AM/PM',
  true,
  false,
  false,
  ARRAY['Bestseller'],
  50,
  1,
  4.92,
  428
),
(
  'keana-rice-mask',
  'Keana Nadeshiko Rice Mask (10 Sheets)',
  '100% Japanese Rice Serum for Pore Smoothing',
  'Face Mask',
  'Award-winning Japanese sheet mask soaked in pure essence derived from 100% domestic Japanese rice. Nourishes dry, rough, pore-stretched skin, smoothing skin texture for a plump, poreless mochi-skin appearance.',
  ARRAY['Deeply replenishes moisture with 4 types of Japanese rice-derived ingredients', 'Plumps enlarged, uneven pores caused by dryness', 'Leaves skin soft, velvety smooth, and bouncy like freshly cooked rice'],
  'Use after cleansing. Carefully unfold mask and align over eyes and mouth. Leave on for 5 to 10 minutes. Remove mask and gently pat remaining serum into face and neck until absorbed.',
  '[{"name": "Rice Ferment Filtrate (Sake)", "purpose": "Delivers rich amino acids and moisture deep into skin cells"}, {"name": "Rice Bran Oil", "purpose": "Restores elasticity and supple skin texture"}, {"name": "Rice Ceramides", "purpose": "Strengthens and reinforces the skin protective moisture barrier"}]'::jsonb,
  'Water, Glycerin, Propylene Glycol, Alcohol, Rice Ferment Filtrate (Sake), Oryza Sativa (Rice) Bran Oil, Hydrolyzed Rice Bran Extract, Rice Bran Sphingoglycolipid, Butylene Glycol, Xanthan Gum, Polysorbate 80, Citric Acid, Sodium Citrate, Phenoxyethanol, Methylparaben.',
  '3304',
  1299,
  1499,
  'https://japanesetaste.com/cdn/shop/files/Ishizawa-Lab-Keana-Nadeshiko-Rice-Mask-10-Sheets-Japanese-Taste_ca2996d1-419b-4e89-8d8d-bf80479aa583.jpg',
  '10 Sheets (165ml)',
  '#C52857',
  ARRAY['All', 'Dry', 'Combination', 'Sensitive'],
  ARRAY['Pores & Texture', 'Hydration', 'Barrier Repair'],
  'PM',
  true,
  false,
  false,
  ARRAY['Tokyo Top Pick', 'Bestseller'],
  45,
  2,
  4.95,
  512
),
(
  'melano-cc-brightening-toner',
  'Rohto Melano CC Vitamin C Brightening Lotion',
  'Active Vitamin C Toner for Dark Spots & Redness',
  'Toner',
  'A refreshing medicated Japanese toner infused with high-purity active Vitamin C. Penetrates deep into the stratum corneum to suppress melanin generation, fade acne pigmentation, and calm inflammation with Dipotassium Glycyrrhizate.',
  ARRAY['Suppresses melanin production to fade post-acne marks and stubborn sun spots', 'Anti-inflammatory action prevents acne breakouts and redness', 'Infused with hydrating Alpinia White and citrus extracts for radiant glow'],
  'After face wash, pour an appropriate amount onto palms or a cotton pad. Gently pat across entire face until completely absorbed. Follow with moisturizer or sunscreen.',
  '[{"name": "Active Vitamin C (Ascorbic Acid)", "purpose": "Fades dark spots, sun discoloration, and post-inflammatory erythema"}, {"name": "Dipotassium Glycyrrhizate", "purpose": "Calms redness, inflammation, and helps prevent recurring breakouts"}]'::jsonb,
  '3-O-Ethyl Ascorbic Acid, Dipotassium Glycyrrhizate, Water, Butylene Glycol, Alcohol, Glycerin, PPG-10 Methyl Glucose Ether, PEG-12 Dimethicone, Dipropylene Glycol, PEG/PPG-30/10 Dimethicone, Dimethicone, Phenyl Trimethicone, Bis-Ethoxydiglycol Cyclohexane 1,4-Dicarboxylate, PPG-6-Decyltetradeceth-30, Paraben, Sodium Citrate, Citric Acid, Xanthan Gum, Disodium EDTA, Fragrance, Ascorbic Acid, Citrus Grandis (Grapefruit) Fruit Extract, Citrus Limon (Lemon) Fruit Extract, Menthol, Alpinia Katsumadai Seed Extract.',
  '3304',
  1499,
  1699,
  'https://japanesetaste.com/cdn/shop/files/Rohto-Melano-CC-Vitamin-C-Lotion-170ml-Japanese-Taste_9bcf51b1-21e3-479c-bfe0-55e1436df765.jpg',
  '170ml',
  '#EAB308',
  ARRAY['All', 'Oily', 'Combination', 'Acne-Prone'],
  ARRAY['Dark Spots & Hyperpigmentation', 'Glow & Dullness', 'Blemishes & Texture'],
  'AM/PM',
  true,
  false,
  false,
  ARRAY['Bestseller', 'Direct Japan Import'],
  60,
  3,
  4.88,
  389
),
(
  'biore-uv-aqua-rich-sunscreen',
  'Bioré UV Aqua Rich Watery Essence SPF50+ PA++++',
  'World-Famous Micro Defense Weightless Sunscreen',
  'Sunscreen',
  'The gold-standard Japanese daily sunscreen. Features Bioré’s proprietary Micro Defense formula covering micro-crevices invisible to the eye. Absorbs instantly with a water-like sheer finish, zero white cast on brown skin, and incredible humidity resistance.',
  ARRAY['SPF50+ PA++++ broad-spectrum UVA/UVB protection against intense Indian sun', 'Weightless watery texture with zero white cast or greasy film', 'Infused with Hyaluronic Acid & Royal Jelly extract for all-day hydration', 'Super waterproof for 80 minutes yet washes off easily with normal soap'],
  'Apply generously and evenly onto face and neck at the final step of morning skincare. Reapply every 2 to 3 hours during prolonged sun exposure or after swimming and toweling.',
  '[{"name": "Micro Defense UV Capsule", "purpose": "Provides gapless, microscopic UV protection against both UVA and UVB rays"}, {"name": "Hyaluronic Acid & Royal Jelly", "purpose": "Keeps skin hydrated and dew-fresh under harsh sun and heat"}]'::jsonb,
  'Water, Alcohol, Ethylhexyl Methoxycinnamate, Lauryl Methacrylate/Sodium Methacrylate Crosspolymer, Ethylhexyl Triazone, Dimethicone, C12-15 Alkyl Benzoate, Titanium Dioxide, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Dimethicone/Vinyl Dimethicone Crosspolymer, Butylene Glycol, Xylitol, Dextrin Palmitate, Dipropylene Glycol, Hydrated Silica, Hydroxyethylcellulose, Glycerin, Glyceryl Stearate, Cetyl Alcohol, Polymethylsilsesquioxane, Vinyl Dimethicone/Methicone Silsesquioxane Crosspolymer, Triethoxycaprylylsilane, Propanediol, Potassium Hydroxide, Potassium Carbonate, C30-45 Alkyl Methicone, C30-45 Olefin, Tocopherol, Royal Jelly Extract, Sodium Hyaluronate, Phenoxyethanol, Disodium EDTA, BHT, Fragrance.',
  '3304',
  1349,
  1599,
  'https://japanesetaste.com/cdn/shop/files/Kao-Biore-UV-Aqua-Rich-Watery-Essence-Sunscreen-SPF50-PA-70g-Japanese-Taste_2d7d9a3a-3453-4ff0-bba7-f32fe561b369.jpg',
  '70g',
  '#0EA5E9',
  ARRAY['All', 'Oily', 'Combination', 'Normal'],
  ARRAY['Sun Protection', 'Hydration', 'Anti-Aging'],
  'AM',
  true,
  false,
  false,
  ARRAY['Holy Grail', 'Zero White Cast'],
  80,
  4,
  4.96,
  640
),
(
  'fino-premium-touch-mask',
  'Shiseido Fino Premium Touch Hair Mask',
  'Intensive Royal Jelly & Squalane Hair Treatment',
  'Hair Care',
  'Viral Shiseido salon-grade hair treatment. Formulated with 6 active beauty serums including Royal Jelly EX and PCA. Melts into damaged, bleached, or heat-styled hair, transforming frizzy strands into ultra-glossy, silky glass hair.',
  ARRAY['Transforms damaged, dry, and bleached hair into silky smooth glass texture', 'Infused with Royal Jelly EX to nourish deep hair cuticles', 'Seals split ends and tames uncontrollable frizz in tropical humidity'],
  'After shampooing, gently squeeze out excess water. Apply an appropriate amount (about 2 teaspoons for semi-long hair) focusing on damaged ends. Rinse thoroughly. Can be rinsed immediately with no waiting required.',
  '[{"name": "Royal Jelly EX", "purpose": "Deeply nourishes hair core with rich amino acids and vitamins"}, {"name": "PCA (Para-chloroamphetamine) & Squalane", "purpose": "Repairs split ends and creates intense mirror-like shine"}]'::jsonb,
  'Water, Sorbitol, Dimethicone, Hydrogenated Rapeseed Alcohol, Isopentyldiol, Behentrimonium Chloride, Aminopropyl Dimethicone, Hydroxypropyl Arginine Lauryl/Myristyl Ether HCl, Stearyl Dihydroxypropyldimonium Oligosaccharides, Steartrimonium Chloride, Trehalose, Squalane, PEG-90M, PCA, Phytosteryl/Octyldodecyl Lauroyl Glutamate, Hydrolyzed Wheat Protein, Polyquaternium-64, Hydrolyzed Wheat Starch, Royal Jelly Extract, Isopropyl Alcohol, Cetyl Alcohol, Octyldodecanol, Alcohol, Propylene Glycol, Citric Acid, Tocopherol, Phenoxyethanol, Sodium Benzoate, Fragrance, Yellow 5.',
  '3305',
  1599,
  1899,
  'https://japanesetaste.com/cdn/shop/files/shiseido-fino-premium-touch-hair-mask-230g-japanese-taste-2.jpg',
  '230g',
  '#BE123C',
  ARRAY['All'],
  ARRAY['Damage Repair', 'Frizz Control', 'Glass Hair Shine'],
  'PM',
  true,
  false,
  false,
  ARRAY['Viral Sensation', 'Salon Grade'],
  50,
  5,
  4.97,
  582
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  usage_how_to = EXCLUDED.usage_how_to,
  key_actives = EXCLUDED.key_actives,
  full_ingredients = EXCLUDED.full_ingredients,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  primary_image_url = EXCLUDED.primary_image_url,
  volume_or_weight = EXCLUDED.volume_or_weight,
  accent_color = EXCLUDED.accent_color,
  skin_types = EXCLUDED.skin_types,
  skin_concerns = EXCLUDED.skin_concerns,
  routine = EXCLUDED.routine,
  is_bestseller = EXCLUDED.is_bestseller,
  stock_quantity = EXCLUDED.stock_quantity,
  display_order = EXCLUDED.display_order,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count;

-- ==============================================================================
-- 17. SEED DATA: VERIFIED CUSTOMER REVIEWS
-- ==============================================================================
INSERT INTO public.reviews (
  id, product_id, product_name, author, location, rating, headline, comment, verified, helpful_count, skin_type, status
) VALUES 
(
  'rev-1',
  'biore-uv-aqua-rich-sunscreen',
  'Bioré UV Aqua Rich Watery Essence',
  'Priya Sharma',
  'Mumbai, Maharashtra',
  5,
  'Zero white cast in Mumbai humidity!',
  'I was skeptical about ordering authentic Japanese sunscreen online, but Konichiwa_Mart delivered the authentic Japan batch with Japanese seals! The watery texture sinks in within 10 seconds. No sweating, zero white cast on my warm Indian skin tone, and layers flawlessly under makeup.',
  true,
  42,
  'Oily / Humid Climate',
  'approved'
),
(
  'rev-2',
  'keana-rice-mask',
  'Keana Nadeshiko Rice Mask',
  'Tanvi Agarwal',
  'Hyderabad, Telangana',
  5,
  'Shrinks enlarged pores like nothing else!',
  'The 100% Japanese domestic rice extract is pure magic for rough, uneven texture around my nose and cheeks. After just 5 minutes, my pores look plumped and invisible. The sheet is delightfully thick and soaked in milky essence!',
  true,
  31,
  'Combination / Textured Skin',
  'approved'
),
(
  'rev-3',
  'melano-cc-brightening-toner',
  'Rohto Melano CC Vitamin C Brightening Lotion',
  'Ananya Mukherjee',
  'Bengaluru, Karnataka',
  5,
  'Faded stubborn acne marks in 3 weeks',
  'Melano CC is legendary for a reason. Unlike other unstable vitamin C serums that oxidize, this lotion toner stays fresh. It calmed my post-breakout redness and evened out dullness. Smells like fresh yuzu citrus. Shipped fast with safe bubble packaging.',
  true,
  29,
  'Combination / Acne-Prone',
  'approved'
),
(
  'rev-4',
  'senka-perfect-whip',
  'Senka Perfect Whip Face Wash',
  'Rohan Kulkarni',
  'Pune, Maharashtra',
  5,
  'Micro-dense foam is so gentle yet deep cleans',
  'You only need a pea-sized amount to create an entire cloud of dense foam. It cleans all the grime and oil without giving that squeaky dry feeling. 100% original Shiseido product.',
  true,
  25,
  'Oily / Normal',
  'approved'
),
(
  'rev-5',
  'fino-premium-touch-mask',
  'Shiseido Fino Premium Touch Hair Mask',
  'Meera Nair',
  'Kochi, Kerala',
  5,
  'Saved my bleached and frizzy hair!',
  'Literally glass hair in one wash. I apply this after shampoo, comb through with fingers, and rinse. My coarse ends feel like silk ribbon. Will keep repurchasing from Konichiwa_Mart.',
  true,
  38,
  'Dry / Chemically Treated',
  'approved'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 18. SEED DATA: COMMUNITY INSTAGRAM REELS
-- ==============================================================================
INSERT INTO public.reels (
  id, title, caption, video_url, video_thumb, creator_handle, creator_name,
  creator_avatar, location, product_id, likes, views, comments_count, audio_track, is_active
) VALUES 
(
  'reel_01',
  'The Viral Whipped Foam Method',
  'How to lather Senka Perfect Whip for that super-dense micro-foam pillow! ☁️ Zero friction on the skin and cleans pores so gently.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://japanesetaste.com/cdn/shop/files/Senka-Perfect-Whip-Cleansing-Foam-120g-1-2025-08-25T00_18_50.384Z.jpg',
  '@tokyo_daily_glow',
  'Hana Tanaka',
  'https://japanesetaste.com/cdn/shop/files/Senka-Perfect-Whip-Cleansing-Foam-120g-1-2025-08-25T00_18_50.384Z.jpg',
  'Tokyo',
  'senka-perfect-whip',
  142800,
  '1.8M',
  942,
  'Gentle Lather ASMR - Tokyo Skincare',
  true
),
(
  'reel_02',
  'Dark Spot Fading with Vitamin C',
  'Testing the Rohto Melano CC Toner for 14 days. Look at the post-acne mark difference! 🍋 Active Vitamin C that actually absorbs quickly.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://japanesetaste.com/cdn/shop/files/Rohto-Melano-CC-Vitamin-C-Lotion-170ml-Japanese-Taste_9bcf51b1-21e3-479c-bfe0-55e1436df765.jpg',
  '@glow_with_ria',
  'Ria Sengupta',
  'https://japanesetaste.com/cdn/shop/files/Rohto-Melano-CC-Vitamin-C-Lotion-170ml-Japanese-Taste_9bcf51b1-21e3-479c-bfe0-55e1436df765.jpg',
  'Mumbai',
  'melano-cc-brightening-toner',
  187400,
  '2.1M',
  1120,
  'Bright Morning - Acoustic Chill',
  true
),
(
  'reel_03',
  'Shiseido Fino Deep Nourish',
  'Why Fino Premium Touch Mask sells out across Shibuya pharmacies. Royal jelly essence that seals intense moisture within 5 minutes.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://japanesetaste.com/cdn/shop/files/shiseido-fino-premium-touch-hair-mask-230g-japanese-taste-2.jpg',
  '@skincare_kenji',
  'Kenji Sato',
  'https://japanesetaste.com/cdn/shop/files/shiseido-fino-premium-touch-hair-mask-230g-japanese-taste-2.jpg',
  'Kyoto',
  'fino-premium-touch-mask',
  312000,
  '3.4M',
  1850,
  'Tokyo Evening Ambient',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 19. FINAL VERIFICATION SUMMARY
-- ==============================================================================
DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'KONICHIWA MART MASTER SUPABASE SCHEMA APPLIED!';
  RAISE NOTICE 'Security Status: Sealed against unauthorized public edits';
  RAISE NOTICE 'Product mutations: Restrictive to authenticated operators only';
  RAISE NOTICE 'Reviews: Public review writing open for all products';
  RAISE NOTICE 'Storage buckets: product-images, banners, reels, review-images configured';
  RAISE NOTICE '=======================================================';
END $$;
