import fs from 'fs';
import path from 'path';
import { PRODUCTS } from '../src/data/products';
import { SEO_CATEGORIES, SEO_BRANDS, SEO_GUIDES } from '../src/data/seoContent';
import { getProductCanonicalSlug, getProductAllSlugs, mergeCatalogProducts } from '../src/lib/seo';
import { injectSeoIntoHtml } from '../src/lib/serverSeo';
import { INDEXNOW_API_KEY, isProductIndexable, buildSitemapXml, buildGoogleMerchantFeedXml } from '../src/lib/sitemapGenerator';
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
  const templatePath = path.join(distDir, '_template.html');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath) && !fs.existsSync(templatePath)) {
    console.warn('[SEO Prerender] dist/index.html not found, skipping prerender.');
    return;
  }

  // Always read from clean _template.html if already saved, or save clean index.html first
  const templateHtml = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, 'utf-8')
    : fs.readFileSync(indexHtmlPath, 'utf-8');
  fs.writeFileSync(templatePath, templateHtml, 'utf-8');

  const liveProducts = await fetchLiveProductsWithTimeout();
  const allProducts = mergeCatalogProducts(PRODUCTS, liveProducts).filter(isProductIndexable);

  let count = 0;

  // 1. Pre-render Homepage (/)
  const homeResult = injectSeoIntoHtml(templateHtml, '/', allProducts);
  writeRouteHtml(distDir, '/', homeResult.html);
  count++;

  // 2. Pre-render Static Informational Pages
  for (const staticPath of ['/about', '/return-policy', '/refund-policy', '/shipping-policy', '/cancellation-policy']) {
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

  // 6. Pre-render Every Product Detail Page (/products/:slug) including all alias slugs
  const renderedProductSlugs = new Set<string>();
  for (const product of allProducts) {
    const canonicalSlug = getProductCanonicalSlug(product);
    const allSlugs = getProductAllSlugs(product);
    for (const s of allSlugs) {
      if (!s || renderedProductSlugs.has(s)) continue;
      renderedProductSlugs.add(s);
      const route = `/products/${canonicalSlug}`;
      const res = injectSeoIntoHtml(templateHtml, route, allProducts);
      writeRouteHtml(distDir, `/products/${s}`, res.html);
      count++;
    }
  }

  // 7. Write fresh canonical sitemap.xml and google-merchant-feed.xml to both public/ and dist/
  const sitemapXml = buildSitemapXml(allProducts);
  const merchantFeedXml = buildGoogleMerchantFeedXml(allProducts);

  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(publicDir, 'google-merchant-feed.xml'), merchantFeedXml, 'utf-8');
  }
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'google-merchant-feed.xml'), merchantFeedXml, 'utf-8');

  // 8. Write IndexNow verification key file to both public/ and dist/
  const keyFileName = `${INDEXNOW_API_KEY}.txt`;
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, keyFileName), INDEXNOW_API_KEY, 'utf-8');
  }
  fs.writeFileSync(path.join(distDir, keyFileName), INDEXNOW_API_KEY, 'utf-8');

  console.log(`[SEO Prerender] Pre-rendered ${count} static HTML pages (${allProducts.length} canonical products) + sitemap.xml + google-merchant-feed.xml into dist/`);
}

runPrerender().catch((err) => {
  console.error('[SEO Prerender Warning]:', err);
});
