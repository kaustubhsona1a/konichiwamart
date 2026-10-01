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
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
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
 * Infers brand metadata from product title or category
 */
export function inferBrandFromProduct(product: { title: string; category?: string }): { name: string; slug?: string } {
  const t = product.title.toLowerCase();
  if (t.includes('senka')) return { name: 'Senka', slug: 'senka' };
  if (t.includes('bioré') || t.includes('biore')) return { name: 'Bioré', slug: 'biore' };
  if (t.includes('hada labo') || t.includes('hadalabo')) return { name: 'Hada Labo', slug: 'hada-labo' };
  if (t.includes('melano cc')) return { name: 'Melano CC', slug: 'melano-cc' };
  if (t.includes('lululun')) return { name: 'LuLuLun', slug: 'lululun' };
  if (t.includes('fino')) return { name: 'Fino', slug: 'fino' };
  if (t.includes('&honey') || t.includes('andhoney')) return { name: '&honey', slug: 'honey' };
  if (t.includes('keana') || t.includes('nadeshiko')) return { name: 'Keana Nadeshiko', slug: 'keana-nadeshiko' };
  if (t.includes('derma laser') || t.includes('quality 1st')) return { name: 'Quality 1st', slug: 'quality-1st' };
  if (t.includes('kosé') || t.includes('kose')) return { name: 'Kosé', slug: 'kose' };
  if (t.includes('tsubaki')) return { name: 'Tsubaki', slug: 'tsubaki' };
  if (t.includes('capsule serum')) return { name: 'Capsule Serum', slug: 'capsule-serum' };
  
  // Default to Konichiwa Mart Tokyo Curation
  const firstWord = product.title.split(' ')[0] || 'Japanese';
  return { name: firstWord };
}

/**
 * Generates dynamic SEO Title for a product
 */
export function getProductSeoTitle(product: Product): string {
  const brand = inferBrandFromProduct(product);
  const brandSuffix = product.title.toLowerCase().includes(brand.name.toLowerCase()) ? '' : ` by ${brand.name}`;
  return `${product.title}${brandSuffix} | Buy Online India | Konichiwa Mart`;
}

/**
 * Generates natural, search-intent focused meta description for a product
 */
export function getProductSeoDescription(product: Product): string {
  const brand = inferBrandFromProduct(product);
  const price = product.price > 0 ? ` ₹${product.price}.` : '';
  const actives = product.keyActives && product.keyActives.length > 0 
    ? ` Formulated with ${product.keyActives.map(a => a.name).slice(0, 2).join(' & ')}.` 
    : '';

  let summary = (product.description || '').replace(/\s+/g, ' ').trim();
  if (summary.length > 110) {
    summary = summary.slice(0, 107) + '...';
  }

  return `Buy authentic ${product.title} in India at Konichiwa Mart.${price}${actives} 100% genuine Tokyo import with fast doorstep delivery across India.`;
}

/**
 * Generates Schema.org Product JSON-LD structured data with authentic database fields
 */
export function generateProductJsonLd(product: Product, reviews?: Review[]): Record<string, any> {
  const brand = inferBrandFromProduct(product);
  const canonicalUrl = getProductCanonicalUrl(product);
  const isInStock = (product.stock ?? 0) > 0 && !product.isComingSoon;

  const productReviews = (reviews || []).filter(r => 
    r.productId === product.id || 
    (product.slug && r.productId === product.slug) ||
    (product.dbId && r.productId === product.dbId)
  );

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image];

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.title,
    'description': product.description || product.subtitle || `Authentic ${product.title} imported directly from Tokyo, Japan.`,
    'image': images,
    'url': canonicalUrl,
    'sku': product.slug || product.id,
    'brand': {
      '@type': 'Brand',
      'name': brand.name
    },
    'category': product.category || 'Japanese Skincare',
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'INR',
      'price': product.price,
      'priceValidUntil': '2027-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Konichiwa Mart',
        'url': CANONICAL_SITE_URL
      }
    }
  };

  // Add authentic aggregate rating if genuine rating data exists
  if (product.rating && product.reviewsCount && product.reviewsCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': product.rating.toFixed(2),
      'reviewCount': product.reviewsCount,
      'bestRating': '5',
      'worstRating': '1'
    };
  }

  // Include genuine visible customer reviews if present
  if (productReviews.length > 0) {
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
        'name': r.author || 'Verified Buyer'
      },
      'headline': r.headline || 'Excellent Product',
      'reviewBody': r.comment || '',
      'datePublished': r.createdAt ? r.createdAt.slice(0, 10) : '2026-09-01'
    }));
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
