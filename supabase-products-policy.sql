-- ==============================================================================
-- KONICHIWA MART: GRANT PUBLIC & ANON FULL ACCESS TO PRODUCTS
-- Run this block in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nhcgwxvfuupkflhixxmj/sql
-- ==============================================================================

-- 1. Ensure table permissions are granted to anon and authenticated roles
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_variants TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;

-- 2. Drop all old restrictive policies on products
DROP POLICY IF EXISTS "Active products are readable by everyone" ON public.products;
DROP POLICY IF EXISTS "Allow reading products" ON public.products;
DROP POLICY IF EXISTS "Allow managing products" ON public.products;
DROP POLICY IF EXISTS "Allow all for anon on products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;
DROP POLICY IF EXISTS "Allow public update on products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete on products" ON public.products;

-- 3. Create explicit policies for anon & authenticated
CREATE POLICY "Allow public select on products"
  ON public.products FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Allow public insert on products"
  ON public.products FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow public update on products"
  ON public.products FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on products"
  ON public.products FOR DELETE
  TO anon, authenticated, service_role
  USING (true);

-- 4. Product Variants
DROP POLICY IF EXISTS "Product variants are readable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Allow reading variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow managing variants" ON public.product_variants;

CREATE POLICY "Allow public select on variants"
  ON public.product_variants FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Allow public insert on variants"
  ON public.product_variants FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow public update on variants"
  ON public.product_variants FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on variants"
  ON public.product_variants FOR DELETE
  TO anon, authenticated, service_role
  USING (true);

-- 5. Categories
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Allow reading categories" ON public.categories;
DROP POLICY IF EXISTS "Allow managing categories" ON public.categories;

CREATE POLICY "Allow public select on categories"
  ON public.categories FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Allow public insert on categories"
  ON public.categories FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow public update on categories"
  ON public.categories FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on categories"
  ON public.categories FOR DELETE
  TO anon, authenticated, service_role
  USING (true);
