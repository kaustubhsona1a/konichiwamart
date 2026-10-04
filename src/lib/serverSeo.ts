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
  getCategoryCollectionSlug,
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
  PRODUCTS.forEach(p => {
    if (p && p.id) allProductsMap.set(p.id, p);
  });
  (liveProducts || []).forEach(p => {
    if (p && p.id) allProductsMap.set(p.id, { ...allProductsMap.get(p.id), ...p });
  });
  const allProducts = Array.from(allProductsMap.values()).filter(Boolean);

  const orgSchema = generateOrganizationJsonLd();
  const webSiteSchema = generateWebSiteJsonLd();

  // 1. PRODUCT DETAIL PAGE: /products/:slug
  if (path.startsWith('/products/')) {
    const slug = path.replace('/products/', '').toLowerCase().trim();
    const normalizedReqSlug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const strippedReqSlug = normalizedReqSlug.replace(/^(rohto|shiseido|kose|kao)-/, '');
    const product = slug ? allProducts.find(p => {
      const pSlug = getProductCanonicalSlug(p).toLowerCase();
      const normPSlug = pSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const rawSlug = (p.slug || '').toLowerCase();
      const normRawSlug = rawSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const id = p.id.toLowerCase();
      return pSlug === slug || 
             rawSlug === slug || 
             id === slug || 
             normPSlug === normalizedReqSlug || 
             normRawSlug === normalizedReqSlug ||
             normPSlug === strippedReqSlug ||
             normRawSlug === strippedReqSlug;
    }) || PRODUCTS.find(p => {
      const pSlug = getProductCanonicalSlug(p).toLowerCase();
      const normPSlug = pSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return pSlug === slug || p.id.toLowerCase() === slug || normPSlug === normalizedReqSlug || normPSlug === strippedReqSlug;
    }) : undefined;

    if (product) {
      const title = getProductSeoTitle(product);
      const description = getProductSeoDescription(product);
      const canonicalUrl = getProductCanonicalUrl(product);
      const brand = inferBrandFromProduct(product);
      const categorySlug = getCategoryCollectionSlug(product.category);
      const categoryInfo = SEO_CATEGORIES[categorySlug] || SEO_CATEGORIES['skincare'];
      const categoryName = categoryInfo ? categoryInfo.name : (product.category || 'Japanese Skincare');
      const hasBrandLink = Boolean(brand && brand.slug && SEO_BRANDS[brand.slug]);
      
      const productJsonLd = generateProductJsonLd(product);
      
      const breadcrumbs = [
        { name: 'Home', url: `${CANONICAL_SITE_URL}/` },
        { name: categoryName, url: `${CANONICAL_SITE_URL}/collections/${categorySlug}` },
        ...(hasBrandLink && brand ? [{ name: brand.name, url: `${CANONICAL_SITE_URL}/brands/${brand.slug}` }] : []),
        { name: product.title, url: canonicalUrl }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

      const isInStock = (product.stock ?? 0) > 0 && !product.isComingSoon;
      const mainImage = product.image?.startsWith('http') 
        ? product.image 
        : `${CANONICAL_SITE_URL}${product.image?.startsWith('/') ? product.image : `/${product.image || 'products/keana-rice-mask.png'}`}`;

      const relatedProducts = allProducts
        .filter(p => p.id !== product.id && getCategoryCollectionSlug(p.category) === categorySlug)
        .slice(0, 4);

      const crawlerHtml = `
        <article class="seo-crawler-page product-page-seo" itemscope itemtype="https://schema.org/Product">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; 
            <a href="/collections/${categorySlug}">${escapeHtml(categoryName)}</a>
            ${hasBrandLink && brand ? ` &gt; <a href="/brands/${brand.slug}">${escapeHtml(brand.name)}</a>` : ''} &gt; 
            <span>${escapeHtml(product.title)}</span>
          </nav>

          <h1 itemprop="name">${escapeHtml(product.title)}</h1>
          ${product.subtitle ? `<p class="product-subtitle">${escapeHtml(product.subtitle)}</p>` : ''}

          <div class="product-core-meta">
            <p>
              ${brand && brand.name ? `<strong>Brand:</strong> ${hasBrandLink ? `<a href="/brands/${brand.slug}">${escapeHtml(brand.name)}</a>` : `<span>${escapeHtml(brand.name)}</span>`} | ` : ''}
              <strong>Category:</strong> <a href="/collections/${categorySlug}">${escapeHtml(product.category || categoryName)}</a>
              ${product.volume ? ` | <strong>Size:</strong> <span>${escapeHtml(product.volume)}</span>` : ''} | 
              <strong>Origin:</strong> <span>Japan (Direct Tokyo Import)</span>
            </p>
          </div>

          <div class="product-media">
            <img src="${escapeAttr(mainImage)}" alt="${escapeAttr(product.title)}" itemprop="image" loading="eager" />
          </div>

          <div class="product-purchase" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <link itemprop="url" href="${escapeAttr(canonicalUrl)}" />
            <meta itemprop="priceCurrency" content="INR" />
            <meta itemprop="price" content="${product.price}" />
            <link itemprop="availability" href="${isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}" />
            <div class="product-price">
              <strong>Price:</strong> ₹${product.price} INR (Inclusive of all taxes)
              ${product.originalPrice && product.originalPrice > product.price ? ` <span class="product-mrp">(MRP: ₹${product.originalPrice})</span>` : ''}
            </div>
            <div class="product-status">
              <strong>Availability:</strong> ${isInStock ? 'In Stock — Available for online order in India' : 'Currently Out of Stock'}
            </div>
          </div>

          <section class="product-description" itemprop="description">
            <h2>Product Description</h2>
            <p>${escapeHtml(product.description || product.subtitle || `${product.title} imported directly from Tokyo, Japan.`)}</p>
          </section>

          ${product.benefits && product.benefits.length > 0 ? `
          <section class="product-benefits">
            <h2>Key Benefits</h2>
            <ul>
              ${product.benefits.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>
          </section>` : ''}

          ${product.keyActives && product.keyActives.length > 0 ? `
          <section class="product-actives">
            <h2>Key Ingredients &amp; Actives</h2>
            <ul>
              ${product.keyActives.map(a => `<li><strong>${escapeHtml(a.name)}</strong>${a.percentage ? ` (${escapeHtml(a.percentage)})` : ''}: ${escapeHtml(a.purpose)}</li>`).join('')}
            </ul>
          </section>` : ''}

          ${product.fullIngredients ? `
          <section class="product-ingredients">
            <h2>Full Ingredients (INCI)</h2>
            <p>${escapeHtml(product.fullIngredients)}</p>
          </section>` : ''}

          ${product.usageHowTo ? `
          <section class="product-usage">
            <h2>How to Use</h2>
            <p>${escapeHtml(product.usageHowTo)}</p>
          </section>` : ''}

          ${product.skinTypes && product.skinTypes.length > 0 && !product.skinTypes.includes('All') ? `
          <div class="product-skintypes">
            <strong>Suitable Skin Types:</strong> ${product.skinTypes.map(escapeHtml).join(', ')}
          </div>` : ''}

          ${product.skinConcerns && product.skinConcerns.length > 0 ? `
          <div class="product-concerns">
            <strong>Target Skin Concerns:</strong> ${product.skinConcerns.map(escapeHtml).join(', ')}
          </div>` : ''}

          ${product.routine ? `
          <div class="product-routine">
            <strong>Recommended Routine:</strong> ${escapeHtml(product.routine)}
          </div>` : ''}

          ${relatedProducts.length > 0 ? `
          <section class="related-products">
            <h2>More Japanese ${escapeHtml(categoryName)} Products</h2>
            <ul>
              ${relatedProducts.map(rp => `
                <li>
                  <a href="${getProductCanonicalUrl(rp)}">${escapeHtml(rp.title)}</a> - ₹${rp.price}
                </li>
              `).join('')}
            </ul>
          </section>` : ''}

          <footer class="product-footer-links">
            <p>
              Explore all <a href="/collections/${categorySlug}">${escapeHtml(categoryName)}</a> and genuine Tokyo imports at <a href="/">Konichiwa Mart</a>.
              ${hasBrandLink && brand ? ` View more products from <a href="/brands/${brand.slug}">${escapeHtml(brand.name)}</a>.` : ''}
            </p>
          </footer>
        </article>
      `;

      return {
        title,
        description,
        canonicalUrl,
        ogImage: mainImage,
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
  // 2. CATEGORY / COLLECTION PAGE: /collections/:slug
  if (path.startsWith('/collections/')) {
    const slug = path.replace('/collections/', '').toLowerCase().trim();
    const categoryInfo: SeoCategoryInfo | undefined = slug ? SEO_CATEGORIES[slug] : undefined;

    if (categoryInfo) {
      const canonicalUrl = `${CANONICAL_SITE_URL}/collections/${categoryInfo.slug}`;
      const matchingProducts = allProducts.filter(p => {
        if (!p) return false;
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

      const otherCategories = Object.values(SEO_CATEGORIES).filter(c => c.slug !== categoryInfo.slug);

      const crawlerHtml = `
        <main class="seo-crawler-page collection-page-seo">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; <span>${escapeHtml(categoryInfo.name)}</span>
          </nav>
          <h1>${escapeHtml(categoryInfo.h1)}</h1>
          <p class="category-intro">${escapeHtml(categoryInfo.introText)}</p>

          ${categoryInfo.relatedBrandSlugs && categoryInfo.relatedBrandSlugs.length > 0 ? `
          <section class="category-brands-nav">
            <h2>Featured Japanese Brands in this Collection</h2>
            <p>Explore authentic Tokyo brands formulating genuine ${escapeHtml(categoryInfo.name)}:</p>
            <ul>
              ${categoryInfo.relatedBrandSlugs.map(bSlug => {
                const b = SEO_BRANDS[bSlug];
                return b ? `<li><a href="/brands/${b.slug}">${escapeHtml(b.name)}</a> – ${escapeHtml(b.h1)}</li>` : '';
              }).filter(Boolean).join('')}
            </ul>
          </section>` : ''}

          <div class="product-listing">
            <h2>Available ${escapeHtml(categoryInfo.name)} in India (${matchingProducts.length})</h2>
            ${matchingProducts.length > 0 ? `
            <ul>
              ${matchingProducts.filter(Boolean).map(p => `
                <li>
                  <a href="${getProductCanonicalUrl(p)}">${escapeHtml(p.title || '')}</a> - ₹${p.price}
                </li>
              `).join('')}
            </ul>` : `
            <p>Our upcoming Tokyo shipment is currently restocking items in this collection. Explore other Japanese skincare essentials below.</p>`}
          </div>

          <section class="other-collections-nav">
            <h2>Explore Other Japanese Skincare Collections</h2>
            <ul>
              ${otherCategories.map(c => `<li><a href="/collections/${c.slug}">${escapeHtml(c.name)}</a></li>`).join('')}
            </ul>
          </section>
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
        if (!p) return false;
        const brand = inferBrandFromProduct(p);
        if (brand?.slug === slug) return true;
        if (brand?.name && brand.name.toLowerCase() === brandInfo.name.toLowerCase()) return true;
        const titleLower = (p.title || '').toLowerCase();
        if (titleLower.includes(brandInfo.name.toLowerCase())) return true;
        // Parent house brand umbrella queries
        if (slug === 'shiseido' && (titleLower.includes('fino') || titleLower.includes('tsubaki') || titleLower.includes('senka') || titleLower.includes('anessa'))) return true;
        if (slug === 'rohto' && (titleLower.includes('melano cc') || titleLower.includes('hada labo') || titleLower.includes('skin aqua'))) return true;
        return false;
      });

      const breadcrumbs = [
        { name: 'Home', url: `${CANONICAL_SITE_URL}/` },
        { name: 'Brands', url: `${CANONICAL_SITE_URL}/#collection` },
        { name: brandInfo.name, url: canonicalUrl }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
      const collectionJsonLd = generateCollectionPageJsonLd(brandInfo.name, brandInfo.metaDescription, canonicalUrl, matchingProducts);

      const crawlerHtml = `
        <main class="seo-crawler-page brand-page-seo">
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> &gt; <span>${escapeHtml(brandInfo.name)}</span>
          </nav>
          <h1>${escapeHtml(brandInfo.h1)}</h1>
          <p class="brand-origin">Origin: ${escapeHtml(brandInfo.countryOfOrigin)} (${escapeHtml(brandInfo.japaneseName)}) ${brandInfo.foundingYear ? `• Est. ${escapeHtml(brandInfo.foundingYear)}` : ''}</p>
          <p class="brand-story">${escapeHtml(brandInfo.brandStory)}</p>

          ${brandInfo.relatedCategorySlugs && brandInfo.relatedCategorySlugs.length > 0 ? `
          <section class="brand-categories-nav">
            <h2>Explore ${escapeHtml(brandInfo.name)} by Category</h2>
            <ul>
              ${brandInfo.relatedCategorySlugs.map(cSlug => {
                const cat = SEO_CATEGORIES[cSlug];
                return cat ? `<li><a href="/collections/${cat.slug}">${escapeHtml(cat.name)}</a></li>` : '';
              }).filter(Boolean).join('')}
            </ul>
          </section>` : ''}

          <div class="product-listing">
            <h2>Authentic ${escapeHtml(brandInfo.name)} Products Available in India (${matchingProducts.length})</h2>
            ${matchingProducts.length > 0 ? `
            <ul>
              ${matchingProducts.filter(Boolean).map(p => `
                <li>
                  <a href="${getProductCanonicalUrl(p)}">${escapeHtml(p.title || '')}</a> - ₹${p.price}
                </li>
              `).join('')}
            </ul>` : `
            <div class="brand-restock-notice">
              <p>Fresh batches of authentic ${escapeHtml(brandInfo.name)} from Tokyo are currently en route or restocking. In the meantime, browse our popular Japanese skincare essentials below or visit our <a href="/collections/skincare">Skincare Collection</a>.</p>
              <ul>
                ${allProducts.slice(0, 6).map(p => `
                  <li>
                    <a href="${getProductCanonicalUrl(p)}">${escapeHtml(p.title || '')}</a> - ₹${p.price}
                  </li>
                `).join('')}
              </ul>
            </div>`}
          </div>

          <footer class="brand-footer-nav">
            <p>
              Explore all <a href="/collections/skincare">Japanese Skincare Collections</a> or learn about our direct Tokyo sourcing on our <a href="/about">About Us</a> page.
            </p>
          </footer>
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

      <section class="seo-collections-nav">
        <h2>Shop by Japanese Skincare Collection</h2>
        <ul>
          <li><a href="/collections/sunscreen">Authentic Japanese Sunscreens (SPF50+ PA++++)</a></li>
          <li><a href="/collections/face-wash">Japanese Cleansers & Face Washes (Micro-Dense Foam)</a></li>
          <li><a href="/collections/toner">Hydrating Toners & Conditioning Lotions (Hyaluronic Acid & Vit C)</a></li>
          <li><a href="/collections/serum">Japanese Serums & Fresh Micro-Capsules</a></li>
          <li><a href="/collections/face-mask">Japanese Sheet Masks (100% Domestic Rice & Laser Delivery)</a></li>
          <li><a href="/collections/hair-care">Japanese Hair Masks & Deep Treatments</a></li>
        </ul>
      </section>

      <section class="seo-brands-nav">
        <h2>Authentic Tokyo Brands</h2>
        <ul>
          <li><a href="/brands/senka">Senka by Shiseido</a></li>
          <li><a href="/brands/biore">Bioré UV & Skincare</a></li>
          <li><a href="/brands/hada-labo">Hada Labo Rohto</a></li>
          <li><a href="/brands/melano-cc">Melano CC Vitamin C</a></li>
          <li><a href="/brands/fino">Fino Premium Touch</a></li>
          <li><a href="/brands/honey">&honey Organic Moisture</a></li>
          <li><a href="/brands/keana-nadeshiko">Keana Nadeshiko Rice Care</a></li>
          <li><a href="/brands/quality-1st">Quality 1st Derma Laser</a></li>
          <li><a href="/brands/lululun">LuLuLun Daily Face Masks</a></li>
          <li><a href="/brands/capsule-serum">Capsule Serum Japan</a></li>
          <li><a href="/brands/kose">Kosé Cosmeport</a></li>
          <li><a href="/brands/tsubaki">Tsubaki by Shiseido</a></li>
          <li><a href="/brands/shiseido">Shiseido Heritage</a></li>
          <li><a href="/brands/rohto">Rohto Pharmaceutical</a></li>
        </ul>
      </section>

      <section class="seo-products-nav">
        <h2>Featured Japanese Skincare Products in India</h2>
        <ul>
          ${allProducts.filter(Boolean).map(p => `
            <li>
              <a href="${getProductCanonicalUrl(p)}">${escapeHtml(p.title || '')}</a> - ₹${p.price}
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
