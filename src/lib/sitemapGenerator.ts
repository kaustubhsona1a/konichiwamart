import { PRODUCTS } from '../data/products';
import { 
  CANONICAL_SITE_URL, 
  SEO_CATEGORIES, 
  SEO_BRANDS, 
  SEO_GUIDES 
} from '../data/seoContent';
import { getProductCanonicalUrl } from './seo';
import { Product } from '../types';

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

  // 1. Static Pages: Homepage and About
  addUrl(`${CANONICAL_SITE_URL}/`);
  addUrl(`${CANONICAL_SITE_URL}/about`);

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
  const productMap = new Map<string, Product>();
  PRODUCTS.forEach(p => productMap.set(p.id, p));
  liveProducts.forEach(p => {
    if (p.id) productMap.set(p.id, { ...productMap.get(p.id), ...p });
  });

  const activeProducts = Array.from(productMap.values()).filter(isProductIndexable);

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
 * Returns breakdown of URLs in sitemap for telemetry/reporting
 */
export function inspectSitemapDetails(liveProducts: Product[] = []): SitemapSummary {
  const xml = buildSitemapXml(liveProducts);
  const locMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
  const urls = locMatches.map(m => m.replace(/<\/?loc>/g, ''));

  return {
    totalUrls: urls.length,
    staticCount: urls.filter(u => u === `${CANONICAL_SITE_URL}/` || u === `${CANONICAL_SITE_URL}/about`).length,
    productCount: urls.filter(u => u.includes('/products/')).length,
    collectionCount: urls.filter(u => u.includes('/collections/')).length,
    brandCount: urls.filter(u => u.includes('/brands/')).length,
    guideCount: urls.filter(u => u.includes('/guides/')).length,
    urls
  };
}
