import { PRODUCTS } from '../data/products';
import { 
  CANONICAL_SITE_URL, 
  SEO_CATEGORIES, 
  SEO_BRANDS, 
  SEO_GUIDES 
} from '../data/seoContent';
import { getProductCanonicalUrl } from './seo';
import { Product } from '../types';

export function buildSitemapXml(liveProducts: Product[] = []): string {
  const now = new Date().toISOString().slice(0, 10);

  // Combine products without duplicates or deleted products
  const productMap = new Map<string, Product>();
  PRODUCTS.forEach(p => productMap.set(p.id, p));
  liveProducts.forEach(p => {
    if (p.id) productMap.set(p.id, { ...productMap.get(p.id), ...p });
  });

  const products = Array.from(productMap.values()).filter(p => !p.isComingSoon && (p.stock ?? 0) >= 0);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${CANONICAL_SITE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  // Categories
  Object.values(SEO_CATEGORIES).forEach(cat => {
    xml += `  <url>
    <loc>${CANONICAL_SITE_URL}/collections/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
`;
  });

  // Brands
  Object.values(SEO_BRANDS).forEach(b => {
    xml += `  <url>
    <loc>${CANONICAL_SITE_URL}/brands/${b.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
`;
  });

  // Skincare Educational Guides
  Object.values(SEO_GUIDES).forEach(g => {
    xml += `  <url>
    <loc>${CANONICAL_SITE_URL}/guides/${g.slug}</loc>
    <lastmod>${g.updatedDate || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
`;
  });

  // Products with Image Extensions for Google Image Search
  products.forEach(p => {
    const url = getProductCanonicalUrl(p);
    const imgTag = p.image ? `
    <image:image>
      <image:loc>${p.image.replace(/&/g, '&amp;')}</image:loc>
      <image:title>${p.title.replace(/&/g, '&amp;')}</image:title>
      <image:caption>Authentic Japanese Skincare - ${p.title.replace(/&/g, '&amp;')}</image:caption>
    </image:image>` : '';

    xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>${imgTag}
  </url>
`;
  });

  xml += `</urlset>`;
  return xml;
}
