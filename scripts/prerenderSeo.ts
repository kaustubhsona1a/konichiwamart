import fs from 'fs';
import path from 'path';
import { PRODUCTS } from '../src/data/products';
import { SEO_CATEGORIES, SEO_BRANDS, SEO_GUIDES } from '../src/data/seoContent';
import { getProductCanonicalSlug } from '../src/lib/seo';
import { injectSeoIntoHtml } from '../src/lib/serverSeo';
import { INDEXNOW_API_KEY, isProductIndexable } from '../src/lib/sitemapGenerator';
import { getValidSupabaseServerClient } from '../src/lib/shiprocketServer';
import { Product } from '../src/types';
import dotenv from 'dotenv';
dotenv.config();

async function fetchLiveProductsWithTimeout(timeoutMs = 3500): Promise<Product[]> {
  try {
    const supabase = getValidSupabaseServerClient();
    if (!supabase) return [];
    const queryPromise = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), timeoutMs)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
        id: row.slug || row.id,
        dbId: row.id,
        slug: row.slug || row.id,
        brand: row.brand || row.brand_name || undefined,
        sku: row.sku || undefined,
        title: row.title,
        subtitle: row.subtitle || '',
        price: row.base_price !== null && row.base_price !== undefined ? Number(row.base_price) : 0,
        originalPrice: row.compare_at_price !== null && row.compare_at_price !== undefined
          ? Number(row.compare_at_price)
          : Number(row.base_price || 0),
        rating: Number(row.rating || 4.9),
        reviewsCount: Number(row.reviews_count || 120),
        category: (row.category_name || 'Skincare') as any,
        skinTypes: row.skin_types || ['All'],
        skinConcerns: row.skin_concerns || [],
        routine: (row.routine as any) || 'AM/PM',
        volume: row.volume_or_weight || '100ml',
        image: row.primary_image_url || '/products/keana-rice-mask.png',
        images: Array.isArray(row.images) && row.images.length > 0 ? row.images : [row.primary_image_url || '/products/keana-rice-mask.png'],
        accentColor: row.accent_color || '#E11D48',
        bgGradient: 'from-rose-50 to-pink-100',
        keyActives: Array.isArray(row.key_actives) ? row.key_actives : [],
        fullIngredients: row.full_ingredients || '',
        description: (row.description || '').replace('__coming_soon__', '').trim(),
        benefits: Array.isArray(row.benefits) ? row.benefits.filter((b: string) => b !== '__coming_soon__') : [],
        usageHowTo: row.usage_how_to || '',
        badges: Array.isArray(row.badges) ? row.badges : [],
        stock: row.stock_quantity !== undefined && row.stock_quantity !== null ? Number(row.stock_quantity) : 15
      }));
    }
  } catch {
    // Fallback to static catalog if offline
  }
  return [];
}

function writeRouteHtml(distDir: string, routePath: string, htmlContent: string) {
  const cleanRoute = routePath.replace(/^\/+|\/+$/g, '');
  if (!cleanRoute) {
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
    return;
  }
  const routeDir = path.join(distDir, cleanRoute);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent, 'utf-8');
}

async function runPrerender() {
  const distDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(process.cwd(), 'public');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('[SEO Prerender] dist/index.html not found, skipping prerender.');
    return;
  }

  // Save clean template for server runtime
  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  fs.writeFileSync(path.join(distDir, '_template.html'), templateHtml, 'utf-8');

  const liveProducts = await fetchLiveProductsWithTimeout();
  const productMap = new Map<string, Product>();
  PRODUCTS.forEach(p => productMap.set(p.id, p));
  liveProducts.forEach(p => {
    if (p.id) productMap.set(p.id, { ...productMap.get(p.id), ...p });
  });
  const allProducts = Array.from(productMap.values()).filter(isProductIndexable);

  let count = 0;

  // 1. Pre-render Homepage (/)
  const homeResult = injectSeoIntoHtml(templateHtml, '/', allProducts);
  writeRouteHtml(distDir, '/', homeResult.html);
  count++;

  // 2. Pre-render Static Informational Pages
  for (const staticPath of ['/about', '/return-policy']) {
    const res = injectSeoIntoHtml(templateHtml, staticPath, allProducts);
    writeRouteHtml(distDir, staticPath, res.html);
    count++;
  }

  // 3. Pre-render Category Collections (/collections/:slug)
  for (const cat of Object.values(SEO_CATEGORIES)) {
    if (cat?.slug) {
      const route = `/collections/${cat.slug}`;
      const res = injectSeoIntoHtml(templateHtml, route, allProducts);
      writeRouteHtml(distDir, route, res.html);
      count++;
    }
  }

  // 4. Pre-render Brands (/brands/:slug)
  for (const brand of Object.values(SEO_BRANDS)) {
    if (brand?.slug) {
      const route = `/brands/${brand.slug}`;
      const res = injectSeoIntoHtml(templateHtml, route, allProducts);
      writeRouteHtml(distDir, route, res.html);
      count++;
    }
  }

  // 5. Pre-render Skincare Guides (/guides/:slug)
  for (const guide of Object.values(SEO_GUIDES)) {
    if (guide?.slug) {
      const route = `/guides/${guide.slug}`;
      const res = injectSeoIntoHtml(templateHtml, route, allProducts);
      writeRouteHtml(distDir, route, res.html);
      count++;
    }
  }

  // 6. Pre-render Every Product Detail Page (/products/:slug)
  for (const product of allProducts) {
    const slug = getProductCanonicalSlug(product);
    if (slug) {
      const route = `/products/${slug}`;
      const res = injectSeoIntoHtml(templateHtml, route, allProducts);
      writeRouteHtml(distDir, route, res.html);
      count++;
    }
  }

  // 7. Write IndexNow verification key file to both public/ and dist/
  const keyFileName = `${INDEXNOW_API_KEY}.txt`;
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, keyFileName), INDEXNOW_API_KEY, 'utf-8');
  }
  fs.writeFileSync(path.join(distDir, keyFileName), INDEXNOW_API_KEY, 'utf-8');

  console.log(`[SEO Prerender] Pre-rendered ${count} static HTML pages (${allProducts.length} products) into dist/`);
}

runPrerender().catch((err) => {
  console.error('[SEO Prerender Warning]:', err);
});
