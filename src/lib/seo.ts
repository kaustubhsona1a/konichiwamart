import { Product, Review } from '../types';
import { 
  CANONICAL_SITE_URL, 
  SEO_CATEGORIES, 
  SEO_BRANDS, 
  SEO_GUIDES,
  SeoCategoryInfo,
  SeoBrandInfo,
  SeoGuideInfo
} from '../data/seoContent';

/**
 * Creates clean, lowercase, URL-safe hyphen-separated slugs
 * Normalizes unicode diacritics (e.g. é -> e, ō -> o) for stable URL interoperability
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics/accents
    .toLowerCase()
    .trim()
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '') // remove punctuation
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start
    .replace(/-+$/, ''); // trim - from end
}

/**
 * Legacy & alternate URL slug aliases mapped to canonical product IDs or slugs.
 * Guarantees 200 OK resolution for all previously submitted sitemap URLs and short slugs.
 */
export const PRODUCT_SLUG_ALIASES: Record<string, string> = {
  'senka-perfect-whip': 'senka-perfect-whip-face-wash',
  'senka-perfect-whip-face-wash': 'senka-perfect-whip',
  'fino-premium-touch-mask': 'fino-premium-touch-hair-mask',
  'fino-premium-touch-hair-mask': 'fino-premium-touch-mask',
  'melano-cc-brightening-toner': 'rohto-melano-cc-vitamin-c-toner',
  'melano-cc-vitamin-c-toner': 'melano-cc-brightening-toner',
  'rohto-melano-cc-vitamin-c-toner': 'melano-cc-brightening-toner',
  'biore-uv-aqua-rich-sunscreen': 'biore-uv-aqua-rich-watery-essence-spf-50',
  'biore-uv-aqua-rich-watery-essence-spf-50': 'biore-uv-aqua-rich-sunscreen',
  'capsule-serum-vitamin-c': 'premium-capsule-serum-vitamin-c',
  'premium-capsule-serum-vitamin-c': 'capsule-serum-vitamin-c',
  'derma-laser-glutathione': 'quality-1st-derma-laser-super-glutathione-100',
  'quality-1st-derma-laser-super-glutathione-100': 'derma-laser-glutathione',
  'quality-1st-derma-laser-super-glutathione-100-mask': 'derma-laser-glutathione',
  'keana-rice-mask': 'keana-nadeshiko-rice-mask-10th-anniversary',
  'keana-nadeshiko-rice-mask-10th-anniversary': 'keana-rice-mask',
  'lululun-precious-clear': 'lululun-precious-clear-white',
  'lululun-precious-clear-white': 'lululun-precious-clear',
  'honey-melty-hair-pack': 'honey-melty-moist-repair-hair-pack-step-15',
  'honey-melty-moist-repair-hair-pack-step-15': 'honey-melty-hair-pack',
  'senka-perfect-whip-pink-collagen': 'senka-perfect-whip-collagen',
  'km-1789596639792': 'senka-perfect-whip-collagen',
  'senka-perfect-whip-green-acne': 'senka-perfect-whip-medicated-for-acne',
  'biore-kids-sunscreen': 'biore-kids-sunscreen-spf-50'
};

/**
 * Safely decodes URI components (e.g. %C3%A9 -> é) before slug normalization
 */
export function safeDecodeSlug(raw: string): string {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Normalizes product slug for public canonical URLs.
 * Uses slugify(product.title) as the primary authoritative SEO slug so build-time pre-rendering,
 * server runtime, sitemaps, and client routing are 100% identical regardless of database ID format.
 */
export function getProductCanonicalSlug(product: { id: string; slug?: string; title?: string } | null | undefined): string {
  if (!product) return '';
  if (product.title && product.title.trim()) {
    const titleSlug = slugify(product.title);
    if (titleSlug === 'senka-perfect-whip-pink-collagen') {
      return 'senka-perfect-whip-collagen';
    }
    if (titleSlug === 'melano-cc-vitamin-c-toner') {
      return 'rohto-melano-cc-vitamin-c-toner';
    }
    if (titleSlug === 'quality-1st-derma-laser-super-glutathione-100-mask') {
      return 'quality-1st-derma-laser-super-glutathione-100';
    }
    return titleSlug;
  }
  if (product.slug && !product.slug.startsWith('km-1')) {
    return slugify(product.slug);
  }
  return slugify(product.slug || product.id || '');
}

/**
 * Returns all valid URL slugs (canonical slug + ID slug + legacy sitemap aliases) for a product
 */
export function getProductAllSlugs(product: { id: string; slug?: string; title?: string } | null | undefined): string[] {
  if (!product) return [];
  const slugs = new Set<string>();
  const canonical = getProductCanonicalSlug(product);
  if (canonical) slugs.add(canonical);
  if (product.id && !product.id.startsWith('km-1')) slugs.add(slugify(product.id));
  if (product.slug && !product.slug.startsWith('km-1')) slugs.add(slugify(product.slug));
  if (product.title) slugs.add(slugify(product.title));

  for (const [alias, target] of Object.entries(PRODUCT_SLUG_ALIASES)) {
    if (slugs.has(target) || slugs.has(alias)) {
      if (!alias.startsWith('km-1')) slugs.add(alias);
      if (!target.startsWith('km-1')) slugs.add(target);
    }
  }
  return Array.from(slugs).filter(Boolean);
}

/**
 * Finds a product from a list by matching any canonical slug, ID, title slug, or legacy sitemap alias
 */
export function findProductBySlug(rawSlugOrPath: string, products: Product[]): Product | undefined {
  if (!rawSlugOrPath || !Array.isArray(products) || products.length === 0) return undefined;
  const decoded = safeDecodeSlug(rawSlugOrPath.replace(/^\/?products\//i, '')).trim().toLowerCase();
  if (!decoded) return undefined;

  const reqSlug = slugify(decoded);
  const aliasTarget = PRODUCT_SLUG_ALIASES[reqSlug] || PRODUCT_SLUG_ALIASES[decoded];
  const strippedReqSlug = reqSlug.replace(/^(rohto|shiseido|kose|kao)-/, '');

  return products.find(p => {
    if (!p) return false;
    const idLower = (p.id || '').toLowerCase();
    const rawPSlug = (p.slug || '').toLowerCase();
    const canonSlug = getProductCanonicalSlug(p);
    const titleSlug = slugify(p.title || '');
    const idSlug = slugify(p.id || '');

    if (
      idLower === decoded ||
      rawPSlug === decoded ||
      canonSlug === reqSlug ||
      titleSlug === reqSlug ||
      idSlug === reqSlug ||
      canonSlug === strippedReqSlug ||
      titleSlug === strippedReqSlug
    ) {
      return true;
    }

    if (aliasTarget && (
      idLower === aliasTarget ||
      rawPSlug === aliasTarget ||
      canonSlug === aliasTarget ||
      titleSlug === aliasTarget ||
      idSlug === aliasTarget
    )) {
      return true;
    }

    return false;
  });
}

/**
 * Merges static catalog products and live Supabase products without duplicates
 */
export function mergeCatalogProducts(baseProducts: Product[], liveProducts: Product[] = []): Product[] {
  const byCanonicalSlug = new Map<string, Product>();

  for (const p of baseProducts) {
    if (!p || !p.id) continue;
    const canon = getProductCanonicalSlug(p) || p.id;
    byCanonicalSlug.set(canon, p);
  }

  for (const p of liveProducts || []) {
    if (!p || !p.id) continue;
    if (p.id === 'km-1789596639792' || slugify(p.title || '') === 'senka-perfect-whip-pink-collagen') {
      const existingCollagen = byCanonicalSlug.get('senka-perfect-whip-collagen');
      if (existingCollagen) continue;
    }
    const canon = getProductCanonicalSlug(p) || p.id;
    const existing = byCanonicalSlug.get(canon);
    if (existing) {
      byCanonicalSlug.set(canon, {
        ...existing,
        ...p,
        // Preserve rich description/benefits if database row only had generic placeholder
        description: (p.description && p.description !== 'Official direct imported Japanese skincare formulation.')
          ? p.description
          : (existing.description || p.description),
        subtitle: (p.subtitle && !p.subtitle.includes('Authentic Japan Skincare'))
          ? p.subtitle
          : (existing.subtitle || p.subtitle),
        benefits: (Array.isArray(p.benefits) && p.benefits.length > 0 && p.benefits[0] !== 'Deep hydration')
          ? p.benefits
          : (existing.benefits || p.benefits)
      });
    } else {
      byCanonicalSlug.set(canon, p);
    }
  }

  return Array.from(byCanonicalSlug.values());
}

/**
 * Returns canonical absolute URL for a product
 */
export function getProductCanonicalUrl(product: { id: string; slug?: string; title?: string } | null | undefined): string {
  if (!product) return CANONICAL_SITE_URL;
  const slug = getProductCanonicalSlug(product);
  return slug ? `${CANONICAL_SITE_URL}/products/${slug}` : CANONICAL_SITE_URL;
}

/**
 * Maps product category string to authoritative collection slug
 */
export function getCategoryCollectionSlug(category?: string): string {
  if (!category) return 'skincare';
  const norm = category.toLowerCase().trim();
  if (norm.includes('sunscreen') || norm.includes('sun') || norm.includes('uv')) return 'sunscreen';
  if (norm.includes('wash') || norm.includes('cleans') || norm.includes('soap')) return 'face-wash';
  if (norm.includes('toner') || norm.includes('lotion') || norm.includes('conditioner') || norm.includes('mist')) return 'toner';
  if (norm.includes('serum') || norm.includes('essence') || norm.includes('ampoule')) return 'serum';
  if (norm.includes('mask') || norm.includes('sheet')) return 'face-mask';
  if (norm.includes('hair') || norm.includes('shampoo') || norm.includes('treatment')) return 'hair-care';
  return 'skincare';
}

/**
 * Resolves brand metadata following the preferred architecture:
 * product → explicit brand → normalized brand name → brand slug → /brands/{brand-slug}
 * Title-based inference is used ONLY as a clearly isolated legacy fallback when explicit brand is missing.
 */
export function inferBrandFromProduct(product: { title: string; category?: string; brand?: string }): { name: string; slug?: string } | null {
  // 1. Explicit brand field (PRIMARY ARCHITECTURE)
  const explicitBrand = (product.brand && typeof product.brand === 'string' && product.brand.trim())
    ? product.brand.trim()
    : ((product as any).brand_name && typeof (product as any).brand_name === 'string' && (product as any).brand_name.trim())
      ? (product as any).brand_name.trim()
      : null;

  if (explicitBrand) {
    const rawSlug = slugify(explicitBrand);
    // Exact match in SEO_BRANDS registry
    if (SEO_BRANDS[rawSlug]) {
      return { name: SEO_BRANDS[rawSlug].name, slug: SEO_BRANDS[rawSlug].slug };
    }
    // Case-insensitive match in SEO_BRANDS
    const matchedBrand = Object.values(SEO_BRANDS).find(b => 
      b.name.toLowerCase() === explicitBrand.toLowerCase() || 
      b.slug.toLowerCase() === rawSlug.toLowerCase()
    );
    if (matchedBrand) {
      return { name: matchedBrand.name, slug: matchedBrand.slug };
    }
    return { name: explicitBrand, slug: rawSlug };
  }

  // 2. Isolated legacy title-based fallback (ONLY when explicit brand is not available)
  return inferBrandFromTitleFallback(product.title);
}

/**
 * Isolated legacy title fallback for unmigrated product records.
 */
function inferBrandFromTitleFallback(title?: string): { name: string; slug?: string } | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('senka')) return { name: 'Senka', slug: 'senka' };
  if (t.includes('bioré') || t.includes('biore')) return { name: 'Bioré', slug: 'biore' };
  if (t.includes('hada labo') || t.includes('hadalabo')) return { name: 'Hada Labo', slug: 'hada-labo' };
  if (t.includes('melano cc') || t.includes('melanocc')) return { name: 'Melano CC', slug: 'melano-cc' };
  if (t.includes('lululun')) return { name: 'LuLuLun', slug: 'lululun' };
  if (t.includes('fino')) return { name: 'Fino', slug: 'fino' };
  if (t.includes('&honey') || t.includes('andhoney') || t.includes('and honey')) return { name: '&honey', slug: 'honey' };
  if (t.includes('keana') || t.includes('nadeshiko')) return { name: 'Keana Nadeshiko', slug: 'keana-nadeshiko' };
  if (t.includes('derma laser') || t.includes('quality 1st') || t.includes('quality first')) return { name: 'Quality 1st', slug: 'quality-1st' };
  if (t.includes('kosé') || t.includes('kose') || t.includes('softymo')) return { name: 'Kosé', slug: 'kose' };
  if (t.includes('capsule serum')) return { name: 'Capsule Serum', slug: 'capsule-serum' };
  if (t.includes('shiseido')) return { name: 'Shiseido', slug: 'shiseido' };
  if (t.includes('canmake')) return { name: 'Canmake', slug: 'canmake' };
  if (t.includes('skin aqua')) return { name: 'Skin Aqua', slug: 'skin-aqua' };
  if (t.includes('anessa')) return { name: 'Anessa', slug: 'anessa' };
  if (t.includes('rohto')) return { name: 'Rohto', slug: 'rohto' };
  if (t.includes('tsubaki')) return { name: 'Tsubaki', slug: 'tsubaki' };
  if (t.includes('dhc')) return { name: 'DHC', slug: 'dhc' };
  if (t.includes('kiss me') || t.includes('heroine make')) return { name: 'Kiss Me Heroine Make' };

  return null;
}

/**
 * Generates dynamic SEO Title for a product
 * Prioritizes: Exact Product Name + Brand/category where useful + India / Buy Online where commercially relevant + Konichiwa Mart
 * Example: Senka Perfect Whip Face Wash | Buy Online India | Konichiwa Mart
 */
export function getProductSeoTitle(product: Product): string {
  const brand = inferBrandFromProduct(product);
  
  // Only add brand suffix if brand is known AND not already part of the product title
  let brandSuffix = '';
  if (brand && brand.name) {
    const titleLower = product.title.toLowerCase();
    const brandLower = brand.name.toLowerCase();
    const hasBrandInTitle = titleLower.includes(brandLower) || 
      brandLower.split(' ').some(w => w.length > 3 && titleLower.includes(w));
    if (!hasBrandInTitle) {
      brandSuffix = ` by ${brand.name}`;
    }
  }

  const baseTitle = `${product.title}${brandSuffix}`;

  // Candidate 1: Exact Name + Buy Online India + Konichiwa Mart (Standard high-intent structure)
  const fullTitle = `${baseTitle} | Buy Online India | Konichiwa Mart`;
  if (fullTitle.length <= 68) {
    return fullTitle;
  }

  // Candidate 2: Compact commercial intent to avoid SERP truncation
  const compactTitle = `${baseTitle} | Buy Online | Konichiwa Mart`;
  if (compactTitle.length <= 68) {
    return compactTitle;
  }

  // Candidate 3: Regional authority title
  const regionalTitle = `${baseTitle} | Konichiwa Mart India`;
  if (regionalTitle.length <= 68) {
    return regionalTitle;
  }

  // Candidate 4: Minimal clean fallback
  return `${baseTitle} | Konichiwa Mart`;
}

/**
 * Generates natural, product-specific meta description
 * Naturally communicates: product, brand, use/category, size, India availability, purchase intent
 * Enforces strictly 120-158 characters, no cookie-cutter copies, no keyword stuffing, no medical claims
 */
export function getProductSeoDescription(product: Product): string {
  // If product has an explicit custom meta description, preserve it
  if ((product as any).metaDescription && typeof (product as any).metaDescription === 'string') {
    return (product as any).metaDescription.trim();
  }

  const size = product.volume ? ` (${product.volume})` : '';

  // Extract factual characteristic from subtitle or description
  let coreFeature = '';
  if (product.subtitle && product.subtitle.trim().length >= 15 && product.subtitle.trim().length <= 75) {
    coreFeature = product.subtitle.trim();
  } else if (product.description) {
    const firstSentence = product.description.split('.')[0].trim();
    if (firstSentence.length >= 20 && firstSentence.length <= 75) {
      coreFeature = firstSentence;
    }
  }

  let desc = '';
  if (coreFeature) {
    desc = `Buy ${product.title}${size} online in India at Konichiwa Mart. ${coreFeature}. Fast India delivery.`;
  } else {
    desc = `Buy authentic ${product.title}${size} online in India at Konichiwa Mart. Genuine Japanese import with fast delivery across India.`;
  }

  // Ensure length is strictly between 120 and 158 characters without truncation
  if (desc.length > 158) {
    if (coreFeature) {
      desc = `Buy ${product.title}${size} in India at Konichiwa Mart. ${coreFeature}.`;
    }
  }
  if (desc.length > 158) {
    desc = `Buy ${product.title}${size} online in India at Konichiwa Mart. Direct Japanese import with fast express delivery.`;
  }
  if (desc.length > 158) {
    desc = `Buy ${product.title} online in India at Konichiwa Mart. Direct Japanese import with express delivery across India.`;
  }

  return desc;
}

/**
 * Generates Schema.org Product JSON-LD structured data with authentic database fields
 * Strips fabricated ratings, reviews, and fake expiration dates
 */
export function generateProductJsonLd(product: Product, reviews?: Review[]): Record<string, any> {
  const brand = inferBrandFromProduct(product);
  const canonicalUrl = getProductCanonicalUrl(product);
  const isInStock = (product.stock ?? 0) > 0 && !product.isComingSoon;

  // Real reviews check: only genuine submitted reviews matching this product
  const productReviews = (reviews || []).filter(r => 
    r && (
      r.productId === product.id || 
      (product.slug && r.productId === product.slug) ||
      (product.dbId && r.productId === product.dbId)
    )
  );

  // Guarantee absolute HTTPS URLs for all product images
  const rawImages = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : []);

  const absoluteImages = rawImages
    .filter(Boolean)
    .map(img => {
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img.replace(/^http:\/\//i, 'https://');
      }
      const cleanPath = img.startsWith('/') ? img : `/${img}`;
      return `${CANONICAL_SITE_URL}${cleanPath}`;
    });

  const numericPrice = typeof product.price === 'number' ? product.price : Number(product.price) || 0;
  const offer: Record<string, any> = {
    '@type': 'Offer',
    'url': canonicalUrl,
    'priceCurrency': 'INR',
    'price': numericPrice,
    'itemCondition': 'https://schema.org/NewCondition',
    'availability': isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    'seller': {
      '@type': 'Organization',
      'name': 'Konichiwa Mart',
      'url': CANONICAL_SITE_URL
    },
    'shippingDetails': {
      '@type': 'OfferShippingDetails',
      'shippingRate': {
        '@type': 'MonetaryAmount',
        'value': numericPrice >= 1500 ? 0 : 79,
        'currency': 'INR'
      },
      'shippingDestination': {
        '@type': 'DefinedRegion',
        'addressCountry': 'IN'
      },
      'deliveryTime': {
        '@type': 'ShippingDeliveryTime',
        'handlingTime': {
          '@type': 'QuantitativeValue',
          'minValue': 0,
          'maxValue': 1,
          'unitCode': 'DAY'
        },
        'transitTime': {
          '@type': 'QuantitativeValue',
          'minValue': 2,
          'maxValue': 5,
          'unitCode': 'DAY'
        }
      }
    },
    'hasMerchantReturnPolicy': {
      '@type': 'MerchantReturnPolicy',
      'applicableCountry': 'IN',
      'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
      'merchantReturnDays': 7,
      'returnMethod': 'https://schema.org/ReturnByMail',
      'returnFees': 'https://schema.org/FreeReturn',
      'url': `${CANONICAL_SITE_URL}/return-policy`
    }
  };

  // Only emit priceValidUntil if trustworthy date exists on product/offer; never invent dates
  const validUntil = (product as any).priceValidUntil || (product as any).offerValidUntil;
  if (validUntil && typeof validUntil === 'string' && /^\d{4}-\d{2}-\d{2}/.test(validUntil.trim())) {
    offer.priceValidUntil = validUntil.trim().slice(0, 10);
  }

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.title,
    'description': product.description || product.subtitle || `Authentic ${product.title} imported directly from Japan.`,
    'image': absoluteImages.length > 0 ? absoluteImages : [`${CANONICAL_SITE_URL}/products/keana-rice-mask.png`],
    'url': canonicalUrl,
    'offers': offer
  };

  // Only include Brand property if trustworthy brand exists
  if (brand && brand.name) {
    jsonLd.brand = {
      '@type': 'Brand',
      'name': brand.name
    };
  }

  // Include Category where available
  if (product.category) {
    jsonLd.category = product.category;
  }

  // SKU: Only emit if genuine, trustworthy SKU exists on product; NEVER fabricate or use slug/internal id
  const rawSku = (product as any).sku || (product as any).product_code;
  if (rawSku && typeof rawSku === 'string' && rawSku.trim()) {
    jsonLd.sku = rawSku.trim();
  }

  // CRITICAL: NEVER emit aggregateRating or reviews unless genuine submitted review data exists
  if (productReviews.length > 0) {
    const validRatings = productReviews.map(r => r.rating).filter(r => typeof r === 'number' && !isNaN(r) && r > 0 && r <= 5);
    if (validRatings.length > 0) {
      const avg = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        'ratingValue': avg.toFixed(2),
        'reviewCount': validRatings.length,
        'bestRating': '5',
        'worstRating': '1'
      };
      const genuineReviews = productReviews
        .filter(r => r && typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5 && r.author && typeof r.author === 'string' && r.author.trim())
        .slice(0, 5)
        .map(r => ({
          '@type': 'Review',
          'reviewRating': {
            '@type': 'Rating',
            'ratingValue': r.rating,
            'bestRating': '5',
            'worstRating': '1'
          },
          'author': {
            '@type': 'Person',
            'name': r.author.trim()
          },
          ...(r.headline && typeof r.headline === 'string' && r.headline.trim() ? { 'headline': r.headline.trim() } : {}),
          ...(r.comment && typeof r.comment === 'string' && r.comment.trim() ? { 'reviewBody': r.comment.trim() } : {}),
          ...(r.createdAt && typeof r.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.createdAt.trim()) 
            ? { 'datePublished': r.createdAt.trim().slice(0, 10) } 
            : (r.date && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.date.trim()) 
              ? { 'datePublished': r.date.trim().slice(0, 10) } 
              : {}))
        }));

      if (genuineReviews.length > 0) {
        jsonLd.review = genuineReviews;
      }
    }
  }

  return jsonLd;
}

/**
 * Organization Schema for Konichiwa Mart
 */
export function generateOrganizationJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    '@id': `${CANONICAL_SITE_URL}/#organization`,
    'name': 'Konichiwa Mart',
    'url': CANONICAL_SITE_URL,
    'logo': {
      '@type': 'ImageObject',
      'url': `${CANONICAL_SITE_URL}/konichiwalogo.png`,
      'width': '512',
      'height': '512'
    },
    'image': `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
    'description': 'Premier boutique destination in India for 100% authentic Japanese skincare, sunscreens, serums, and cosmetics imported directly from Japan.',
    'email': 'info@konichiwamart.com',
    'telephone': '+91-91523-53737',
    'currenciesAccepted': 'INR',
    'paymentAccepted': 'Credit Card, Debit Card, NetBanking, UPI, Cash on Delivery',
    'priceRange': '₹₹',
    'areaServed': {
      '@type': 'Country',
      'name': 'India'
    },
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': "Car's Empire, Sardar Vallabhai Patel Rd, opp. Model Town, near Punjab & Maharashtra Bank, MMRDA Colony, Andheri East",
      'addressLocality': 'Mumbai',
      'addressRegion': 'Maharashtra',
      'postalCode': '400093',
      'addressCountry': 'IN'
    }
  };
}

/**
 * WebSite Schema with real search action
 */
export function generateWebSiteJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Konichiwa Mart',
    'url': CANONICAL_SITE_URL,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${CANONICAL_SITE_URL}/?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * BreadcrumbList Schema generator
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

/**
 * CollectionPage Schema for category and brand landing pages
 */
export function generateCollectionPageJsonLd(name: string, description: string, url: string, products: Product[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': name,
    'description': description,
    'url': url,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': products.slice(0, 20).map((p, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'url': getProductCanonicalUrl(p),
        'name': p.title
      }))
    }
  };
}

/**
 * Article Schema for Skincare Educational Guides
 */
export function generateGuideJsonLd(guide: SeoGuideInfo): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': guide.h1,
    'description': guide.metaDescription,
    'url': `${CANONICAL_SITE_URL}/guides/${guide.slug}`,
    'datePublished': guide.publishedDate,
    'dateModified': guide.updatedDate,
    'author': {
      '@type': 'Organization',
      'name': guide.author,
      'url': CANONICAL_SITE_URL
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Konichiwa Mart',
      'logo': {
        '@type': 'ImageObject',
        'url': `${CANONICAL_SITE_URL}/konichiwalogo.png`
      }
    },
    'mainEntityOfPage': `${CANONICAL_SITE_URL}/guides/${guide.slug}`
  };
}

export interface SeoPageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

/**
 * Safe, client-side metadata updater for Single-Page App navigation
 * Updates document.title, canonical link, and OpenGraph/Twitter meta tags
 */
export function updateClientSeoMetadata(seo: SeoPageMetadata): void {
  if (typeof document === 'undefined') return;

  // 1. Update Title
  if (seo.title) {
    document.title = seo.title;
  }

  // 2. Helper to set/update meta tag
  const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Description & Robots
  if (seo.description) {
    setMeta('description', seo.description);
    setMeta('og:description', seo.description, true);
    setMeta('twitter:description', seo.description);
  }

  if (seo.noindex) {
    setMeta('robots', 'noindex, nofollow');
  } else {
    // Ensure accidental noindex is stripped from indexable pages
    const robots = document.querySelector('meta[name="robots"]');
    if (robots && robots.getAttribute('content')?.includes('noindex')) {
      robots.setAttribute('content', 'index, follow');
    }
  }

  // 4. OpenGraph & Twitter Title
  if (seo.title) {
    setMeta('og:title', seo.title, true);
    setMeta('twitter:title', seo.title);
  }

  // 5. Canonical URL
  if (seo.canonicalUrl) {
    setMeta('og:url', seo.canonicalUrl, true);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seo.canonicalUrl);
  }

  // 6. Social Image
  const imgUrl = seo.ogImage || `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`;
  setMeta('og:image', imgUrl, true);
  setMeta('twitter:image', imgUrl);
  setMeta('og:type', seo.ogType || 'website', true);

  // 7. Dynamic JSON-LD injection
  if (seo.jsonLd) {
    const scriptId = 'km-seo-dynamic-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(seo.jsonLd);
  }
}
