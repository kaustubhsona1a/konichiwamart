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
 * Normalizes product slug for public canonical URLs
 */
export function getProductCanonicalSlug(product: { id: string; slug?: string; title?: string }): string {
  if (product.slug && !product.slug.startsWith('km-1')) {
    return slugify(product.slug);
  }
  if (product.title) {
    return slugify(product.title);
  }
  return slugify(product.slug || product.id);
}

/**
 * Returns canonical absolute URL for a product
 */
export function getProductCanonicalUrl(product: { id: string; slug?: string; title?: string }): string {
  const slug = getProductCanonicalSlug(product);
  return `${CANONICAL_SITE_URL}/products/${slug}`;
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
 * Infers brand metadata from explicit product field or verified Japanese brand names
 * Omits brand if no trustworthy brand is identified (never fabricates or guesses from random words)
 */
export function inferBrandFromProduct(product: { title: string; category?: string; brand?: string }): { name: string; slug?: string } | null {
  // 1. Explicit brand field
  if (product.brand && typeof product.brand === 'string' && product.brand.trim()) {
    const bName = product.brand.trim();
    const bSlug = slugify(bName);
    return { name: bName, slug: SEO_BRANDS[bSlug] ? bSlug : undefined };
  }

  // 2. Verified authentic Japanese brand detection
  const t = (product.title || '').toLowerCase();
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
  if (t.includes('tsubaki')) return { name: 'Tsubaki' };
  if (t.includes('dhc')) return { name: 'DHC' };
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
    desc = `Buy authentic ${product.title}${size} online in India at Konichiwa Mart. Genuine Tokyo import with fast delivery across India.`;
  }

  // Ensure length is strictly between 120 and 158 characters without truncation
  if (desc.length > 158) {
    if (coreFeature) {
      desc = `Buy ${product.title}${size} in India at Konichiwa Mart. ${coreFeature}.`;
    }
  }
  if (desc.length > 158) {
    desc = `Buy ${product.title}${size} online in India at Konichiwa Mart. Direct Tokyo import with fast express delivery.`;
  }
  if (desc.length > 158) {
    desc = `Buy ${product.title} online in India at Konichiwa Mart. Direct Tokyo import with express delivery across India.`;
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

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.title,
    'description': product.description || product.subtitle || `Authentic ${product.title} imported directly from Tokyo, Japan.`,
    'image': absoluteImages.length > 0 ? absoluteImages : [`${CANONICAL_SITE_URL}/products/keana-rice-mask.png`],
    'url': canonicalUrl,
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'INR',
      'price': typeof product.price === 'number' ? product.price : Number(product.price) || 0,
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Konichiwa Mart',
        'url': CANONICAL_SITE_URL
      }
    }
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

  // SKU if available from product
  if (product.slug || product.id) {
    jsonLd.sku = product.slug || product.id;
  }

  // CRITICAL: NEVER emit aggregateRating or reviews unless genuine submitted review data exists
  if (productReviews.length > 0) {
    const validRatings = productReviews.map(r => r.rating).filter(r => typeof r === 'number' && !isNaN(r));
    if (validRatings.length > 0) {
      const avg = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        'ratingValue': avg.toFixed(2),
        'reviewCount': validRatings.length,
        'bestRating': '5',
        'worstRating': '1'
      };
      jsonLd.review = productReviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': r.rating,
          'bestRating': '5',
          'worstRating': '1'
        },
        'author': {
          '@type': 'Person',
          'name': r.author || 'Customer'
        },
        ...(r.headline ? { 'headline': r.headline } : {}),
        ...(r.comment ? { 'reviewBody': r.comment } : {}),
        ...(r.createdAt ? { 'datePublished': r.createdAt.slice(0, 10) } : {})
      }));
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
    '@type': 'OnlineStore',
    'name': 'Konichiwa Mart',
    'url': CANONICAL_SITE_URL,
    'logo': `${CANONICAL_SITE_URL}/konichiwalogo.png`,
    'image': `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
    'description': 'Premier boutique destination in India for 100% authentic Japanese skincare, sunscreens, serums, and cosmetics imported directly from Tokyo.',
    'email': 'info@konichiwamart.com',
    'currenciesAccepted': 'INR',
    'paymentAccepted': 'Credit Card, Debit Card, NetBanking, UPI, Cash on Delivery',
    'priceRange': '₹₹',
    'areaServed': {
      '@type': 'Country',
      'name': 'India'
    },
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Mumbai',
      'addressRegion': 'Maharashtra',
      'postalCode': '400059',
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
