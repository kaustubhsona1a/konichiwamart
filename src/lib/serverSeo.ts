import { PRODUCTS } from '../data/products';
import { 
  CANONICAL_SITE_URL, 
  SEO_CATEGORIES, 
  SEO_BRANDS, 
  SEO_GUIDES,
  SeoCategoryInfo,
  SeoBrandInfo,
  SeoGuideInfo
} from '../data/seoContent';
import { 
  getProductCanonicalSlug, 
  getProductCanonicalUrl, 
  getProductSeoTitle, 
  getProductSeoDescription,
  generateProductJsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  generateBreadcrumbJsonLd,
  generateCollectionPageJsonLd,
  generateGuideJsonLd,
  inferBrandFromProduct
} from './seo';
import { Product } from '../types';

export interface SeoMetadataPayload {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  ogType: 'website' | 'product' | 'article';
  jsonLd: Record<string, any>[];
  h1: string;
  crawlerHtml: string;
  status: number;
}

/**
 * Generates an SEO 404 payload when a requested entity does not exist.
 * Ensures:
 * - Real HTTP 404 status
 * - No canonical link to homepage or fake URL
 * - No Product/Collection/Brand/Article structured data (empty jsonLd array)
 * - Semantic crawler HTML with 404 heading and recovery links
 */
function build404Payload(urlPath: string, entityType: string, slug: string): SeoMetadataPayload {
  const displaySlug = slug ? ` "${slug}"` : '';
  const title = 'Page Not Found (404) | Konichiwa Mart';
  const description = `The requested Japanese skincare ${entityType.toLowerCase()}${displaySlug} could not be found. Explore our authentic Tokyo-imported collections at Konichiwa Mart.`;
  const h1 = '404 - Page Not Found';
  const crawlerHtml = `
    <main class="seo-crawler-page seo-404-page">
      <nav aria-label="Breadcrumb">
        <a href="/">Home</a> &gt; <span>404 Not Found</span>
      </nav>
      <h1>${h1}</h1>
      <p>The requested ${escapeHtml(entityType.toLowerCase())}${escapeHtml(displaySlug)} does not exist or has been removed from our catalog.</p>
      <div class="product-listing">
        <h2>Explore Authentic Japanese Skincare Essentials</h2>
        <ul>
          <li><a href="/collections/sunscreen">Authentic Japanese Sunscreens (SPF50+ PA++++)</a></li>
          <li><a href="/collections/face-wash">Japanese Cleansers & Face Washes</a></li>
          <li><a href="/collections/toner">Hydrating Toners & Lotions</a></li>
          <li><a href="/collections/serum">Japanese Serums & Vitamin C</a></li>
          <li><a href="/collections/hair-care">Japanese Hair Care & Masks</a></li>
        </ul>
      </div>
      <p><a href="/">Return to Konichiwa Mart Storefront</a></p>
    </main>
  `;

  return {
    title,
    description,
    canonicalUrl: '', // Explicitly empty: No homepage canonicalization for 404s
    ogImage: `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
    ogType: 'website',
    jsonLd: [], // Explicitly empty: Do NOT generate Product/Collection/Brand/Article structured data for nonexistent entities
    h1,
    crawlerHtml,
    status: 404
  };
}

/**
 * Resolves SEO metadata payload for any given URL path
 */
export function resolveSeoPayload(urlPath: string, liveProducts: Product[] = []): SeoMetadataPayload {
  // Clean path
  const path = urlPath.split('?')[0].replace(/\/+$/, '') || '/';

  // Combine products without duplicates
  const allProductsMap = new Map<string, Product>();
  PRODUCTS.forEach(p => allProductsMap.set(p.id, p));
  liveProducts.forEach(p => {
    if (p.id) allProductsMap.set(p.id, { ...allProductsMap.get(p.id), ...p });
  });
  const allProducts = Array.from(allProductsMap.values());

  const orgSchema = generateOrganizationJsonLd();
  const webSiteSchema = generateWebSiteJsonLd();

  // 1. PRODUCT DETAIL PAGE: /products/:slug
  if (path.startsWith('/products/')) {
    const slug = path.replace('/products/', '').toLowerCase().trim();
    const product = slug ? allProducts.find(p => {
      const pSlug = getProductCanonicalSlug(p).toLowerCase();
      const rawSlug = (p.slug || '').toLowerCase();
      const id = p.id.toLowerCase();
      return pSlug === slug || rawSlug === slug || id === slug;
    }) : undefined;

    if (product) {
      const title = getProductSeoTitle(product);
      const description = getProductSeoDescription(product);
      const canonicalUrl = getProductCanonicalUrl(product);
      const brand = inferBrandFromProduct(product);
      const productJsonLd = generateProductJsonLd(product);
      const breadcrumbs = [
        { name: 'Home', url: `${CANONICAL_SITE_URL}/` },
        { name: product.category || 'Japanese Skincare', url: `${CANONICAL_SITE_URL}/collections/${(product.category || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
        { name: product.title, url: canonicalUrl }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

      const isInStock = (product.stock ?? 0) > 0 && !product.isComingSoon;
      const crawlerHtml = `
        <article class="seo-crawler-page">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; 
            <a href="/#collection">${product.category || 'Japanese Skincare'}</a> &gt; 
            <span>${product.title}</span>
          </nav>
          <h1>${product.title}</h1>
          <p class="subtitle">${product.subtitle || ''}</p>
          <div class="product-price">Price: ₹${product.price} (Inclusive of all taxes)</div>
          <div class="product-status">Availability: ${isInStock ? 'In Stock (Direct Tokyo Import)' : 'Pre-Order / Coming Soon'}</div>
          <div class="product-description">${product.description || ''}</div>
          <p>Brand: ${brand.name} | Category: ${product.category} | 100% Authentic Japanese Skincare India</p>
          <a href="/">Return to Konichiwa Mart Storefront</a>
        </article>
      `;

      return {
        title,
        description,
        canonicalUrl,
        ogImage: product.image?.startsWith('http') ? product.image : `${CANONICAL_SITE_URL}${product.image}`,
        ogType: 'product',
        jsonLd: [orgSchema, webSiteSchema, breadcrumbJsonLd, productJsonLd],
        h1: product.title,
        crawlerHtml,
        status: 200
      };
    }

    // Invalid / Nonexistent product slug -> return genuine 404
    return build404Payload(path, 'Product', slug);
  }

  // 2. CATEGORY / COLLECTION PAGE: /collections/:slug
  if (path.startsWith('/collections/')) {
    const slug = path.replace('/collections/', '').toLowerCase().trim();
    const categoryInfo: SeoCategoryInfo | undefined = slug ? SEO_CATEGORIES[slug] : undefined;

    if (categoryInfo) {
      const canonicalUrl = `${CANONICAL_SITE_URL}/collections/${categoryInfo.slug}`;
      const matchingProducts = allProducts.filter(p => {
        const cat = (p.category || '').toLowerCase();
        if (slug === 'sunscreen') return cat.includes('sun') || p.title.toLowerCase().includes('spf');
        if (slug === 'face-wash') return cat.includes('clean') || cat.includes('wash') || p.title.toLowerCase().includes('whip');
        if (slug === 'toner') return cat.includes('tone') || cat.includes('lotion');
        if (slug === 'serum') return cat.includes('serum');
        if (slug === 'face-mask') return cat.includes('mask');
        if (slug === 'hair-care') return cat.includes('hair');
        if (slug === 'skincare') return true;
        return cat.includes(slug);
      });

      const breadcrumbs = [
        { name: 'Home', url: `${CANONICAL_SITE_URL}/` },
        { name: 'Collections', url: `${CANONICAL_SITE_URL}/#collection` },
        { name: categoryInfo.name, url: canonicalUrl }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
      const collectionJsonLd = generateCollectionPageJsonLd(categoryInfo.name, categoryInfo.metaDescription, canonicalUrl, matchingProducts);

      const crawlerHtml = `
        <main class="seo-crawler-page">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; <span>${categoryInfo.name}</span>
          </nav>
          <h1>${categoryInfo.h1}</h1>
          <p>${categoryInfo.introText}</p>
          <div class="product-listing">
            <h2>Available Japanese Skincare Products in this Collection</h2>
            <ul>
              ${matchingProducts.map(p => `
                <li>
                  <a href="${getProductCanonicalUrl(p)}">${p.title}</a> - ₹${p.price}
                </li>
              `).join('')}
            </ul>
          </div>
        </main>
      `;

      return {
        title: categoryInfo.title,
        description: categoryInfo.metaDescription,
        canonicalUrl,
        ogImage: `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
        ogType: 'website',
        jsonLd: [orgSchema, webSiteSchema, breadcrumbJsonLd, collectionJsonLd],
        h1: categoryInfo.h1,
        crawlerHtml,
        status: 200
      };
    }

    // Invalid / Nonexistent collection slug -> return genuine 404
    return build404Payload(path, 'Collection', slug);
  }

  // 3. BRAND LANDING PAGE: /brands/:slug
  if (path.startsWith('/brands/')) {
    const slug = path.replace('/brands/', '').toLowerCase().trim();
    const brandInfo: SeoBrandInfo | undefined = slug ? SEO_BRANDS[slug] : undefined;

    if (brandInfo) {
      const canonicalUrl = `${CANONICAL_SITE_URL}/brands/${brandInfo.slug}`;
      const matchingProducts = allProducts.filter(p => {
        const brand = inferBrandFromProduct(p);
        return brand.slug === slug || p.title.toLowerCase().includes(brandInfo.name.toLowerCase());
      });

      const breadcrumbs = [
        { name: 'Home', url: `${CANONICAL_SITE_URL}/` },
        { name: 'Brands', url: `${CANONICAL_SITE_URL}/#collection` },
        { name: brandInfo.name, url: canonicalUrl }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
      const collectionJsonLd = generateCollectionPageJsonLd(brandInfo.name, brandInfo.metaDescription, canonicalUrl, matchingProducts);

      const crawlerHtml = `
        <main class="seo-crawler-page">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; <span>${brandInfo.name}</span>
          </nav>
          <h1>${brandInfo.h1}</h1>
          <p class="brand-origin">Origin: ${brandInfo.countryOfOrigin} (${brandInfo.japaneseName}) ${brandInfo.foundingYear ? `• Est. ${brandInfo.foundingYear}` : ''}</p>
          <p>${brandInfo.brandStory}</p>
          <div class="product-listing">
            <h2>Authentic ${brandInfo.name} Products Available in India</h2>
            <ul>
              ${matchingProducts.map(p => `
                <li>
                  <a href="${getProductCanonicalUrl(p)}">${p.title}</a> - ₹${p.price}
                </li>
              `).join('')}
            </ul>
          </div>
        </main>
      `;

      return {
        title: brandInfo.title,
        description: brandInfo.metaDescription,
        canonicalUrl,
        ogImage: `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
        ogType: 'website',
        jsonLd: [orgSchema, webSiteSchema, breadcrumbJsonLd, collectionJsonLd],
        h1: brandInfo.h1,
        crawlerHtml,
        status: 200
      };
    }

    // Invalid / Nonexistent brand slug -> return genuine 404
    return build404Payload(path, 'Brand', slug);
  }

  // 4. SKINCARE EDUCATIONAL GUIDES: /guides/:slug
  if (path.startsWith('/guides/')) {
    const slug = path.replace('/guides/', '').toLowerCase().trim();
    const guideInfo: SeoGuideInfo | undefined = slug ? SEO_GUIDES[slug] : undefined;

    if (guideInfo) {
      const canonicalUrl = `${CANONICAL_SITE_URL}/guides/${guideInfo.slug}`;
      const breadcrumbs = [
        { name: 'Home', url: `${CANONICAL_SITE_URL}/` },
        { name: 'Skincare Guides', url: `${CANONICAL_SITE_URL}/#collection` },
        { name: guideInfo.title, url: canonicalUrl }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
      const guideJsonLd = generateGuideJsonLd(guideInfo);

      const crawlerHtml = `
        <article class="seo-crawler-page">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; <span>${guideInfo.title}</span>
          </nav>
          <h1>${guideInfo.h1}</h1>
          <p>By ${guideInfo.author} | Updated: ${guideInfo.updatedDate} | ${guideInfo.readTime}</p>
          <p>${guideInfo.excerpt}</p>
          ${guideInfo.sections.map(s => `
            <section>
              <h2>${s.heading}</h2>
              <p>${s.content}</p>
            </section>
          `).join('')}
        </article>
      `;

      return {
        title: guideInfo.title,
        description: guideInfo.metaDescription,
        canonicalUrl,
        ogImage: `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
        ogType: 'article',
        jsonLd: [orgSchema, webSiteSchema, breadcrumbJsonLd, guideJsonLd],
        h1: guideInfo.h1,
        crawlerHtml,
        status: 200
      };
    }

    // Invalid / Nonexistent guide slug -> return genuine 404
    return build404Payload(path, 'Guide', slug);
  }

  // 5. ABOUT US PAGE: /about
  if (path === '/about') {
    return {
      title: 'About Konichiwa Mart | Authentic Japanese Skincare Dispensary India',
      description: 'Learn about Konichiwa Mart: Direct Tokyo imports of authentic Japanese skincare, sunscreens, and cosmetics. Zero middlemen, genuine expiration batches & express India delivery.',
      canonicalUrl: `${CANONICAL_SITE_URL}/about`,
      ogImage: `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
      ogType: 'website',
      jsonLd: [orgSchema, webSiteSchema],
      h1: 'About Konichiwa Mart – Direct Tokyo Skincare Dispensary',
      crawlerHtml: `
        <main class="seo-crawler-page">
          <h1>About Konichiwa Mart</h1>
          <p>Konichiwa Mart is India's premier boutique dispensary for 100% authentic Japanese beauty (J-Beauty) and skincare essentials imported directly from Tokyo.</p>
        </main>
      `,
      status: 200
    };
  }

  // 6. DEFAULT HOMEPAGE: /
  const homeTitle = 'Konichiwa Mart | Authentic Japanese Skincare & Cosmetics India';
  const homeDesc = 'Shop 100% authentic Japanese skincare, sunscreens, serums & cosmetics in India. Direct Tokyo imports: Hada Labo, Bioré, LuLuLun, Melano CC, Senka & Fino with fast shipping.';
  const homeCanonical = `${CANONICAL_SITE_URL}/`;

  const homeCrawlerHtml = `
    <main class="seo-crawler-page">
      <h1>Konichiwa Mart – Authentic Japanese Skincare & Cosmetics India</h1>
      <p>Direct Tokyo imports of verified Japanese beauty essentials: sunscreens, face washes, multi-weight hyaluronic lotions, and hair masks.</p>
      <section>
        <h2>Featured Japanese Skincare Products</h2>
        <ul>
          ${allProducts.slice(0, 16).map(p => `
            <li>
              <a href="${getProductCanonicalUrl(p)}">${p.title}</a> - ₹${p.price}
            </li>
          `).join('')}
        </ul>
      </section>
    </main>
  `;

  return {
    title: homeTitle,
    description: homeDesc,
    canonicalUrl: homeCanonical,
    ogImage: `${CANONICAL_SITE_URL}/konichiwalaptopbackground.png`,
    ogType: 'website',
    jsonLd: [orgSchema, webSiteSchema],
    h1: 'Konichiwa Mart – Authentic Japanese Skincare & Cosmetics India',
    crawlerHtml: homeCrawlerHtml,
    status: 200
  };
}

/**
 * Injects SEO metadata, OpenGraph tags, JSON-LD schema, and semantic crawler HTML into raw HTML string
 */
export function injectSeoIntoHtml(html: string, urlPath: string, liveProducts: Product[] = []): { html: string; status: number } {
  const seo = resolveSeoPayload(urlPath, liveProducts);

  let modified = html;

  // 1. Replace <title>
  modified = modified.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(seo.title)}</title>`);

  // 2. Replace meta description
  modified = modified.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="description" content="${escapeAttr(seo.description)}" />`
  );

  // 3. Replace or remove canonical link (404s must NOT have canonical pointing to homepage)
  if (seo.canonicalUrl) {
    modified = modified.replace(
      /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/is,
      `<link rel="canonical" href="${escapeAttr(seo.canonicalUrl)}" />`
    );
  } else {
    modified = modified.replace(
      /\s*<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/is,
      ''
    );
  }

  // 4. Replace OpenGraph Tags
  modified = modified.replace(
    /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:title" content="${escapeAttr(seo.title)}" />`
  );
  modified = modified.replace(
    /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:description" content="${escapeAttr(seo.description)}" />`
  );
  if (seo.canonicalUrl) {
    modified = modified.replace(
      /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/is,
      `<meta property="og:url" content="${escapeAttr(seo.canonicalUrl)}" />`
    );
  } else {
    modified = modified.replace(
      /\s*<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/is,
      ''
    );
  }
  modified = modified.replace(
    /<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:image" content="${escapeAttr(seo.ogImage)}" />`
  );
  modified = modified.replace(
    /<meta\s+property=["']og:type["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:type" content="${escapeAttr(seo.ogType)}" />`
  );

  // 5. Replace Twitter Cards
  modified = modified.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`
  );
  modified = modified.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`
  );
  modified = modified.replace(
    /<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="twitter:image" content="${escapeAttr(seo.ogImage)}" />`
  );

  // 6. Replace Schema.org JSON-LD in head (Omit completely on 404s)
  if (seo.jsonLd && seo.jsonLd.length > 0) {
    const jsonLdScript = `
      <!-- Comprehensive Schema.org Structured Data (Organization, WebSite, Breadcrumbs & Product) -->
      <script type="application/ld+json">
      ${JSON.stringify({ '@context': 'https://schema.org', '@graph': seo.jsonLd }, null, 2)}
      </script>
    `;
    modified = modified.replace(
      /<script\s+type=["']application\/ld\+json["']>.*?<\/script>/is,
      jsonLdScript.trim()
    );
  } else {
    modified = modified.replace(
      /\s*<script\s+type=["']application\/ld\+json["']>.*?<\/script>/is,
      ''
    );
  }

  // 7. Inject robots noindex, follow on 404 pages
  if (seo.status === 404) {
    if (/<meta\s+name=["']robots["']/i.test(modified)) {
      modified = modified.replace(/<meta\s+name=["']robots["'].*?\/?>/is, '<meta name="robots" content="noindex, follow" />');
    } else {
      modified = modified.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n  </head>');
    }
  }

  // 8. Inject crawler-accessible HTML inside <div id="root">
  if (seo.crawlerHtml) {
    modified = modified.replace(
      /<div id=["']root["']>\s*<\/div>/is,
      `<div id="root">${seo.crawlerHtml}</div>`
    );
  }

  return { html: modified, status: seo.status };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
