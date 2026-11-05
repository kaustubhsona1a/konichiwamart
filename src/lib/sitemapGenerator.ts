import { PRODUCTS } from '../data/products';
import { 
  CANONICAL_SITE_URL, 
  SEO_CATEGORIES, 
  SEO_BRANDS, 
  SEO_GUIDES 
} from '../data/seoContent';
import { getProductCanonicalUrl, getProductCanonicalSlug, inferBrandFromProduct, mergeCatalogProducts } from './seo';
import { Product } from '../types';

export const INDEXNOW_API_KEY = 'konichiwamart2026indexnowkey8879';

/**
 * Escapes characters for strict XML compliance
 */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalizes image URL to absolute HTTPS URL or null if invalid
 */
export function toAbsoluteImageUrl(img?: string): string | null {
  if (!img || typeof img !== 'string') return null;
  const trimmed = img.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    return `${CANONICAL_SITE_URL}${trimmed}`;
  }
  if (trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//, 'https://');
  }
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

/**
 * Returns formatted YYYY-MM-DD string if a trustworthy timestamp exists; otherwise null
 */
export function getTrustworthyDate(dateVal?: any): string | null {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString().slice(0, 10);
  }
  return null;
}

export interface SitemapSummary {
  totalUrls: number;
  staticCount: number;
  productCount: number;
  collectionCount: number;
  brandCount: number;
  guideCount: number;
  urls: string[];
}

/**
 * Determines whether a product is valid, active, public, and indexable.
 * - Included: Active public catalog items (including temporarily out-of-stock items with stock === 0).
 * - Excluded: Deleted, inactive, draft, private, internal, or corrupt records.
 */
export function isProductIndexable(p: Product): boolean {
  if (!p) return false;
  if (!p.id || !p.title) return false;

  const anyP = p as any;
  // Exclude deleted products
  if (anyP.isDeleted === true || anyP.deleted === true) return false;

  // Exclude explicitly inactive products
  if (anyP.isActive === false || anyP.is_active === false) return false;

  // Exclude internal, draft, or private records
  if (anyP.isInternal === true || anyP.is_internal === true) return false;
  if (anyP.isDraft === true || anyP.is_draft === true) return false;
  if (anyP.visibility === 'private' || anyP.visibility === 'hidden') return false;

  // Exclude corrupt negative stock values
  if (typeof p.stock === 'number' && p.stock < 0) return false;

  return true;
}

/**
 * Generates SEO-hardened, dynamically populated XML sitemap string
 */
export function buildSitemapXml(liveProducts: Product[] = []): string {
  const seenUrls = new Set<string>();
  const urlEntries: string[] = [];

  // Helper to append a URL safely ensuring deduplication and absolute HTTPS
  const addUrl = (loc: string, lastmod?: string | null, imageXml?: string) => {
    // Ensure clean absolute HTTPS URL
    if (!loc || !loc.startsWith('https://www.konichiwamart.com')) return;
    if (seenUrls.has(loc)) return;
    seenUrls.add(loc);

    let entry = '  <url>\n';
    entry += `    <loc>${escapeXml(loc)}</loc>\n`;
    if (lastmod) {
      entry += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
    }
    if (imageXml) {
      entry += imageXml;
    }
    entry += '  </url>';
    urlEntries.push(entry);
  };

  // 1. Static Pages: Homepage, About, Return Policy
  addUrl(`${CANONICAL_SITE_URL}/`);
  addUrl(`${CANONICAL_SITE_URL}/about`);
  addUrl(`${CANONICAL_SITE_URL}/return-policy`);

  // 2. Collections (Categories)
  Object.values(SEO_CATEGORIES).forEach(cat => {
    if (cat?.slug) {
      addUrl(`${CANONICAL_SITE_URL}/collections/${cat.slug}`);
    }
  });

  // 3. Brands
  Object.values(SEO_BRANDS).forEach(b => {
    if (b?.slug) {
      addUrl(`${CANONICAL_SITE_URL}/brands/${b.slug}`);
    }
  });

  // 4. Skincare Educational Guides (Include trustworthy updatedDate / publishedDate if available)
  Object.values(SEO_GUIDES).forEach(g => {
    if (g?.slug) {
      const guideDate = getTrustworthyDate(g.updatedDate || g.publishedDate);
      addUrl(`${CANONICAL_SITE_URL}/guides/${g.slug}`, guideDate);
    }
  });

  // 5. Active Products
  const activeProducts = mergeCatalogProducts(PRODUCTS, liveProducts).filter(isProductIndexable);

  activeProducts.forEach(p => {
    const productUrl = getProductCanonicalUrl(p);
    
    // Only include lastmod if trustworthy updated_at / created_at exists on product record
    const productDate = getTrustworthyDate((p as any).updated_at || (p as any).updatedAt);

    // Google Image Sitemap extension
    let imageXml = '';
    const absImage = toAbsoluteImageUrl(p.image);
    if (absImage) {
      const cleanTitle = escapeXml(p.title || 'Authentic Japanese Skincare');
      imageXml = `    <image:image>\n      <image:loc>${escapeXml(absImage)}</image:loc>\n      <image:title>${cleanTitle}</image:title>\n      <image:caption>Authentic Japanese Skincare - ${cleanTitle}</image:caption>\n    </image:image>\n`;
    }

    addUrl(productUrl, productDate, imageXml);
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  xml += urlEntries.join('\n');
  xml += '\n</urlset>';

  return xml;
}

/**
 * Generates a standards-compliant Google Merchant Center RSS 2.0 XML Product Feed (/google-merchant-feed.xml)
 * Enables Free Product Listings on the Google Shopping tab and top Google Search Product Carousel across India.
 */
export function buildGoogleMerchantFeedXml(liveProducts: Product[] = []): string {
  const activeProducts = mergeCatalogProducts(PRODUCTS, liveProducts).filter(isProductIndexable);

  const itemsXml = activeProducts.map(p => {
    const slug = getProductCanonicalSlug(p) || p.id;
    const productUrl = getProductCanonicalUrl(p);
    const brand = inferBrandFromProduct(p);
    const brandName = brand?.name || 'Konichiwa Mart Japan';
    const isInStock = (p.stock ?? 0) > 0 && !p.isComingSoon;
    const availability = isInStock ? 'in_stock' : 'out_of_stock';
    const priceNum = typeof p.price === 'number' && !isNaN(p.price) ? p.price : 999;
    const origPriceNum = typeof p.originalPrice === 'number' && !isNaN(p.originalPrice) && p.originalPrice > priceNum
      ? p.originalPrice
      : priceNum;

    const primaryImage = toAbsoluteImageUrl(p.image) || `${CANONICAL_SITE_URL}/products/keana-rice-mask.png`;
    const additionalImages = (Array.isArray(p.images) ? p.images : [])
      .map(toAbsoluteImageUrl)
      .filter((u): u is string => Boolean(u && u !== primaryImage))
      .slice(0, 4);

    const cleanDesc = (p.description || p.subtitle || `Buy 100% authentic ${p.title} imported directly from Japan at Konichiwa Mart India.`)
      .replace(/\s+/g, ' ')
      .trim();

    const shippingFee = priceNum >= 1500 ? '0.00 INR' : '79.00 INR';

    let item = '    <item>\n';
    item += `      <g:id>${escapeXml(slug)}</g:id>\n`;
    item += `      <g:title>${escapeXml(`${p.title}${p.volume ? ` (${p.volume})` : ''} - Authentic Japanese Import`)}</g:title>\n`;
    item += `      <g:description>${escapeXml(cleanDesc)}</g:description>\n`;
    item += `      <g:link>${escapeXml(productUrl)}</g:link>\n`;
    item += `      <g:image_link>${escapeXml(primaryImage)}</g:image_link>\n`;
    additionalImages.forEach(addImg => {
      item += `      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>\n`;
    });
    item += `      <g:condition>new</g:condition>\n`;
    item += `      <g:availability>${availability}</g:availability>\n`;
    if (origPriceNum > priceNum) {
      item += `      <g:price>${origPriceNum.toFixed(2)} INR</g:price>\n`;
      item += `      <g:sale_price>${priceNum.toFixed(2)} INR</g:sale_price>\n`;
    } else {
      item += `      <g:price>${priceNum.toFixed(2)} INR</g:price>\n`;
    }
    item += `      <g:brand>${escapeXml(brandName)}</g:brand>\n`;
    item += `      <g:product_type>${escapeXml(`Health & Beauty > Japanese Skincare > ${p.category || 'Skincare'}`)}</g:product_type>\n`;
    item += `      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Skin Care</g:google_product_category>\n`;
    item += `      <g:identifier_exists>no</g:identifier_exists>\n`;
    item += `      <g:shipping>\n`;
    item += `        <g:country>IN</g:country>\n`;
    item += `        <g:service>Standard Express India</g:service>\n`;
    item += `        <g:price>${shippingFee}</g:price>\n`;
    item += `      </g:shipping>\n`;
    item += '    </item>';
    return item;
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
  xml += '  <channel>\n';
  xml += '    <title>Konichiwa Mart – Authentic Japanese Skincare &amp; Cosmetics India</title>\n';
  xml += `    <link>${CANONICAL_SITE_URL}</link>\n`;
  xml += '    <description>Official Google Merchant Center Product Feed for Konichiwa Mart India. 100% Authentic Direct Japanese Imports.</description>\n';
  xml += itemsXml.join('\n');
  xml += '\n  </channel>\n';
  xml += '</rss>';

  return xml;
}

/**
 * Returns breakdown of URLs in sitemap for telemetry/reporting
 */
export function inspectSitemapDetails(liveProducts: Product[] = []): SitemapSummary {
  const xml = buildSitemapXml(liveProducts);
  const locMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
  const urls = locMatches.map(m => m.replace(/<\/?loc>/g, ''));

  return {
    totalUrls: urls.length,
    staticCount: urls.filter(u => u === `${CANONICAL_SITE_URL}/` || u === `${CANONICAL_SITE_URL}/about` || u === `${CANONICAL_SITE_URL}/return-policy`).length,
    productCount: urls.filter(u => u.includes('/products/')).length,
    collectionCount: urls.filter(u => u.includes('/collections/')).length,
    brandCount: urls.filter(u => u.includes('/brands/')).length,
    guideCount: urls.filter(u => u.includes('/guides/')).length,
    urls
  };
}
