/**
 * Konichiwa Mart – Search Intent & Organic Product Discovery Map
 *
 * Centralized, maintainable search-intent mapping connecting:
 * User Search Query (Intent) → Best Existing Konichiwa Mart Page
 *
 * Grounded strictly in authentic Japanese beauty products and brands we actually stock.
 * Hierarchy:
 * GUIDE (Informational)
 *   ↓
 * CATEGORY (Commercial Investigation)
 *   ↓
 * BRAND (Brand Commercial)
 *   ↓
 * PRODUCT (Transactional / Purchase)
 */

export interface SearchIntentItem {
  id: string;
  path: string;
  pageType: 'product' | 'category' | 'brand' | 'guide' | 'home';
  title: string;
  primaryIntent: string;
  secondaryIntents: string[];
  targetAudience: string;
  searchContext: string;
  relatedCategorySlug?: string;
  relatedBrandSlug?: string;
  relatedProductSlugs?: string[];
  relatedGuideSlugs?: string[];
}

export const SEARCH_INTENT_MAP: Record<string, SearchIntentItem> = {
  // =========================================================================
  // 1. HOMEPAGE / BRAND DISPENSARY INTENT
  // =========================================================================
  'home': {
    id: 'home',
    path: '/',
    pageType: 'home',
    title: 'Konichiwa Mart | Authentic Japanese Skincare & Cosmetics India',
    primaryIntent: 'Japanese skincare products India',
    secondaryIntents: [
      'Japanese beauty products online India',
      'Japanese cosmetics online India',
      'authentic Japanese skincare India',
      'J-Beauty products India',
      'buy Japanese skincare India'
    ],
    targetAudience: 'Indian beauty shoppers seeking verified, authentic Tokyo-imported J-Beauty products with fast domestic shipping.',
    searchContext: 'Central dispensary hub showcasing certified Japanese skincare collections, featured Tokyo brands, and genuine imports.',
    relatedCategorySlug: 'skincare',
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners',
      'japanese-sunscreen-guide-india',
      'double-cleansing-japanese-routine'
    ]
  },

  // =========================================================================
  // 2. CATEGORY SEARCH INTENTS (Commercial Investigation)
  // =========================================================================
  'category-sunscreen': {
    id: 'category-sunscreen',
    path: '/collections/sunscreen',
    pageType: 'category',
    title: 'Japanese Sunscreens in India | SPF & UV Protection | Konichiwa Mart',
    primaryIntent: 'Japanese sunscreen India',
    secondaryIntents: [
      'Japanese sunscreen',
      'Japanese SPF',
      'Japanese UV protection India',
      'best Japanese sunscreen zero white cast',
      'Japanese water gel sunscreen India'
    ],
    targetAudience: 'Shoppers looking for water-light, high-SPF sun protection that performs without white cast or greasiness in warm/humid Indian weather.',
    searchContext: 'Presents verified SPF50+ PA++++ Japanese sunscreens (Bioré UV Aqua Rich, Biore Kids) with invisible finishes.',
    relatedCategorySlug: 'sunscreen',
    relatedBrandSlug: 'biore',
    relatedProductSlugs: [
      'biore-uv-aqua-rich-watery-essence-spf-50',
      'km-1789877832835'
    ],
    relatedGuideSlugs: [
      'japanese-sunscreen-guide-india',
      'japanese-skincare-routine-beginners'
    ]
  },

  'category-face-wash': {
    id: 'category-face-wash',
    path: '/collections/face-wash',
    pageType: 'category',
    title: 'Japanese Face Wash & Cleansers in India | Konichiwa Mart',
    primaryIntent: 'Japanese face wash India',
    secondaryIntents: [
      'Japanese face wash',
      'Japanese cleanser',
      'Japanese cleanser India',
      'Japanese whipping foam cleanser',
      'Japanese foaming face wash India'
    ],
    targetAudience: 'Skincare enthusiasts seeking micro-dense whipped foam and gentle massage gel cleansers that purify pores without stripping the moisture barrier.',
    searchContext: 'Features Japan’s iconic cleansers including Senka Perfect Whip (Original, Collagen, Acne) and Bioré Ouchi de Esthe gel.',
    relatedCategorySlug: 'face-wash',
    relatedBrandSlug: 'senka',
    relatedProductSlugs: [
      'senka-perfect-whip-face-wash',
      'km-1789873626221',
      'km-1789596639792',
      'km-1790951777917'
    ],
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine',
      'how-to-choose-japanese-face-wash'
    ]
  },

  'category-toner': {
    id: 'category-toner',
    path: '/collections/toner',
    pageType: 'category',
    title: 'Japanese Toners & Hydrating Lotions in India | Konichiwa Mart',
    primaryIntent: 'Japanese toner India',
    secondaryIntents: [
      'Japanese hydrating lotion',
      'Japanese keshousui India',
      'Japanese Vitamin C lotion India',
      'Japanese hyaluronic acid lotion India'
    ],
    targetAudience: 'Users seeking watery essence-lotions formulated with stable Vitamin C and multi-weight hyaluronic acid for glass skin.',
    searchContext: 'Curates Rohto Melano CC Vitamin C lotions and Japanese hydrating conditioning waters.',
    relatedCategorySlug: 'toner',
    relatedBrandSlug: 'melano-cc',
    relatedProductSlugs: [
      'rohto-melano-cc-vitamin-c-toner',
      'km-1790347775970',
      'km-1790348072678'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'category-serum': {
    id: 'category-serum',
    path: '/collections/serum',
    pageType: 'category',
    title: 'Japanese Face Serums & Treatments in India | Konichiwa Mart',
    primaryIntent: 'Japanese serum India',
    secondaryIntents: [
      'Japanese skincare serum',
      'Japanese face serum India',
      'Japanese Vitamin C serum India',
      'Japanese capsule serum'
    ],
    targetAudience: 'Shoppers looking for potent, micro-encapsulated actives and brightening treatments engineered for non-greasy absorption.',
    searchContext: 'Features fresh micro-capsule Vitamin C serums that maintain active potency until skin application.',
    relatedCategorySlug: 'serum',
    relatedBrandSlug: 'capsule-serum',
    relatedProductSlugs: [
      'premium-capsule-serum-vitamin-c',
      'vitamin-c-capsule-serum'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'category-face-mask': {
    id: 'category-face-mask',
    path: '/collections/face-mask',
    pageType: 'category',
    title: 'Japanese Sheet Masks in India | Tokyo Facial Care | Konichiwa Mart',
    primaryIntent: 'Japanese sheet masks India',
    secondaryIntents: [
      'Japanese face mask',
      'Japanese rice mask India',
      'buy Japanese sheet masks online',
      'LuLuLun sheet mask India',
      'Quality 1st Derma Laser mask India'
    ],
    targetAudience: 'Customers searching for domestic rice ferment, daily multi-sheet cotton packs, or laser nanocapsule masks.',
    searchContext: 'Offers Keana Nadeshiko 100% Japanese Rice Masks, Quality 1st Derma Laser (Retinol & Glutathione), and LuLuLun Precious series.',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'keana-nadeshiko',
    relatedProductSlugs: [
      'keana-nadeshiko-rice-mask-10th-anniversary',
      'quality-1st-derma-laser-super-retinol-100',
      'quality-1st-derma-laser-super-glutathione-100',
      'lululun-precious-clear-white',
      'km-1790773017649'
    ],
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine',
      'japanese-skincare-routine-beginners'
    ]
  },

  'category-hair-care': {
    id: 'category-hair-care',
    path: '/collections/hair-care',
    pageType: 'category',
    title: 'Japanese Hair Care & Treatments in India | Konichiwa Mart',
    primaryIntent: 'Japanese hair care India',
    secondaryIntents: [
      'Japanese hair mask India',
      'Fino hair mask India',
      'Tsubaki hair mask India',
      '&honey hair pack India',
      'Japanese hair treatment for frizzy hair'
    ],
    targetAudience: 'Individuals battling frizz, humidity damage, or roughness seeking salon-grade royal jelly, red camellia oil, or organic honey masks.',
    searchContext: 'Collects Japan’s viral sensations: Shiseido Fino Premium Touch, Tsubaki Hair Mask, and &honey Melty Moist Repair.',
    relatedCategorySlug: 'hair-care',
    relatedBrandSlug: 'fino',
    relatedProductSlugs: [
      'fino-premium-touch-hair-mask',
      'km-1789878278891',
      'honey-melty-moist-repair-hair-pack-step-15'
    ],
    relatedGuideSlugs: [
      'how-to-use-japanese-hair-mask'
    ]
  },

  'category-skincare': {
    id: 'category-skincare',
    path: '/collections/skincare',
    pageType: 'category',
    title: 'Japanese Skincare in India | 100% Tokyo Imports | Konichiwa Mart',
    primaryIntent: 'Japanese skincare products India',
    secondaryIntents: [
      'Japanese beauty products online India',
      'buy Japanese skincare India',
      'authentic Japanese beauty India',
      'Tokyo skincare dispensary India'
    ],
    targetAudience: 'General J-Beauty shoppers looking to browse the complete Tokyo-imported catalog across all routines.',
    searchContext: 'Comprehensive collection of all authentic Japanese skincare, sun protection, and hair care items.',
    relatedCategorySlug: 'skincare',
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  // =========================================================================
  // 3. BRAND SEARCH INTENTS (Commercial Brand Queries)
  // =========================================================================
  'brand-senka': {
    id: 'brand-senka',
    path: '/brands/senka',
    pageType: 'brand',
    title: 'Senka Products in India | Perfect Whip Cleansers | Konichiwa Mart',
    primaryIntent: 'Senka products India',
    secondaryIntents: [
      'Senka India',
      'Senka Perfect Whip India',
      'buy Senka face wash online India',
      'Shiseido Senka cleanser'
    ],
    targetAudience: 'Shoppers looking for genuine Shiseido Senka Perfect Whip facial washes with natural silk essence micro-foam.',
    searchContext: 'Dedicated brand showcase for Senka Perfect Whip (Original, Acne Care, Collagen) with direct Tokyo authenticity.',
    relatedCategorySlug: 'face-wash',
    relatedBrandSlug: 'senka',
    relatedProductSlugs: [
      'senka-perfect-whip-face-wash',
      'km-1789873626221',
      'km-1789596639792'
    ],
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine',
      'how-to-choose-japanese-face-wash'
    ]
  },

  'brand-biore': {
    id: 'brand-biore',
    path: '/brands/biore',
    pageType: 'brand',
    title: 'Bioré Products in India | UV Aqua Rich & Sunscreens | Konichiwa Mart',
    primaryIntent: 'Biore products India',
    secondaryIntents: [
      'Biore India',
      'Biore sunscreen India',
      'Biore UV Aqua Rich online India',
      'Biore Japan skincare India'
    ],
    targetAudience: 'Shoppers searching for Bioré’s patented micro-defense sunscreens and pore-friendly facial cleansing gels.',
    searchContext: 'Curates Bioré UV Aqua Rich Watery Essence SPF50+ PA++++, Bioré Kids Sunscreen, and Ouchi de Esthe cleansing gels.',
    relatedCategorySlug: 'sunscreen',
    relatedBrandSlug: 'biore',
    relatedProductSlugs: [
      'biore-uv-aqua-rich-watery-essence-spf-50',
      'km-1789877832835',
      'km-1790951777917'
    ],
    relatedGuideSlugs: [
      'japanese-sunscreen-guide-india',
      'how-to-choose-japanese-face-wash'
    ]
  },

  'brand-hada-labo': {
    id: 'brand-hada-labo',
    path: '/brands/hada-labo',
    pageType: 'brand',
    title: 'Hada Labo Products in India | Japanese Skincare | Konichiwa Mart',
    primaryIntent: 'Hada Labo products India',
    secondaryIntents: [
      'Hada Labo India',
      'Hada Labo skincare India',
      'buy Hada Labo online India',
      'Rohto Hada Labo hyaluronic lotion'
    ],
    targetAudience: 'Indian skincare shoppers looking for Rohto Hada Labo’s legendary multi-molecular hyaluronic acid lotions.',
    searchContext: 'Brand page explaining Rohto Hada Labo philosophy, incoming Tokyo restock status, and seamless connections to toners & J-Beauty routines.',
    relatedCategorySlug: 'toner',
    relatedBrandSlug: 'hada-labo',
    relatedProductSlugs: [
      'rohto-melano-cc-vitamin-c-toner'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'brand-melano-cc': {
    id: 'brand-melano-cc',
    path: '/brands/melano-cc',
    pageType: 'brand',
    title: 'Melano CC Products in India | Vitamin C Brightening | Konichiwa Mart',
    primaryIntent: 'Melano CC products India',
    secondaryIntents: [
      'Melano CC India',
      'Rohto Melano CC Vitamin C',
      'buy Melano CC online India',
      'Melano CC brightening toner India'
    ],
    targetAudience: 'Shoppers targeting post-acne marks, sun spots, and dullness with Rohto Pharmaceutical’s stabilized pure ascorbic acid.',
    searchContext: 'Features Melano CC Vitamin C Brightening Toner, Melano CC Moist, and Melano CC Men direct from Japan.',
    relatedCategorySlug: 'toner',
    relatedBrandSlug: 'melano-cc',
    relatedProductSlugs: [
      'rohto-melano-cc-vitamin-c-toner',
      'km-1790347775970',
      'km-1790348072678'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'brand-fino': {
    id: 'brand-fino',
    path: '/brands/fino',
    pageType: 'brand',
    title: 'Fino Hair Care in India | Premium Touch Hair Mask | Konichiwa Mart',
    primaryIntent: 'Fino products India',
    secondaryIntents: [
      'Fino India',
      'Shiseido Fino hair mask India',
      'buy Fino hair mask online India',
      'Fino Premium Touch India'
    ],
    targetAudience: 'Customers searching for Japan’s viral 7-essence salon hair treatment for damaged, dry, or frizzy hair.',
    searchContext: 'Showcases authentic Shiseido Fino Premium Touch Hair Mask with royal jelly and squalane.',
    relatedCategorySlug: 'hair-care',
    relatedBrandSlug: 'fino',
    relatedProductSlugs: [
      'fino-premium-touch-hair-mask'
    ],
    relatedGuideSlugs: [
      'how-to-use-japanese-hair-mask'
    ]
  },

  'brand-tsubaki': {
    id: 'brand-tsubaki',
    path: '/brands/tsubaki',
    pageType: 'brand',
    title: 'Tsubaki Hair Care in India | Camellia Oil Masks | Konichiwa Mart',
    primaryIntent: 'Tsubaki products India',
    secondaryIntents: [
      'Tsubaki India',
      'Shiseido Tsubaki hair mask India',
      'Tsubaki red camellia hair care',
      'buy Tsubaki hair mask online'
    ],
    targetAudience: 'Shoppers looking for high-purity Japanese red camellia oil formulas for salon mirror gloss and deep repair.',
    searchContext: 'Features Shiseido Tsubaki Premium Repair Hair Mask direct from Tokyo.',
    relatedCategorySlug: 'hair-care',
    relatedBrandSlug: 'tsubaki',
    relatedProductSlugs: [
      'km-1789878278891'
    ],
    relatedGuideSlugs: [
      'how-to-use-japanese-hair-mask'
    ]
  },

  'brand-honey': {
    id: 'brand-honey',
    path: '/brands/honey',
    pageType: 'brand',
    title: '&honey Products in India | Organic Honey Hair Care | Konichiwa Mart',
    primaryIntent: '&honey products India',
    secondaryIntents: [
      'and honey India',
      '&honey hair care India',
      'buy &honey online India',
      '&honey melty moist hair pack'
    ],
    targetAudience: 'Shoppers looking for organic Manuka and Japanese raw honey moisture-lock treatments for wavy, coarse, or frizzy hair.',
    searchContext: 'Presents &honey Melty Moist Repair Hair Pack Step 1.5 and &honey Capsule Oil.',
    relatedCategorySlug: 'hair-care',
    relatedBrandSlug: 'honey',
    relatedProductSlugs: [
      'honey-melty-moist-repair-hair-pack-step-15',
      'km-1790346453185'
    ],
    relatedGuideSlugs: [
      'how-to-use-japanese-hair-mask'
    ]
  },

  'brand-keana-nadeshiko': {
    id: 'brand-keana-nadeshiko',
    path: '/brands/keana-nadeshiko',
    pageType: 'brand',
    title: 'Keana Nadeshiko Products in India | Rice Pore Care | Konichiwa Mart',
    primaryIntent: 'Keana Nadeshiko products India',
    secondaryIntents: [
      'Keana Nadeshiko India',
      'Keana rice mask online India',
      'Ishizawa Lab Keana',
      'Japanese rice sheet mask India'
    ],
    targetAudience: 'Customers searching for 100% domestic Japanese rice extract skincare to refine enlarged pores and rough texture.',
    searchContext: 'Features Ishizawa Laboratories’ Keana Nadeshiko Rice Mask (10th Anniversary pack).',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'keana-nadeshiko',
    relatedProductSlugs: [
      'keana-nadeshiko-rice-mask-10th-anniversary'
    ],
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine'
    ]
  },

  'brand-quality-1st': {
    id: 'brand-quality-1st',
    path: '/brands/quality-1st',
    pageType: 'brand',
    title: 'Quality 1st Derma Laser in India | Sheet Masks | Konichiwa Mart',
    primaryIntent: 'Quality 1st products India',
    secondaryIntents: [
      'Quality 1st Derma Laser India',
      'Quality 1st sheet masks',
      'Derma Laser Super Retinol India',
      'Derma Laser Glutathione mask'
    ],
    targetAudience: 'Skincare enthusiasts seeking clinical active concentrations (Retinol, Glutathione) in laser-cut nanocapsule sheets.',
    searchContext: 'Features Quality 1st Derma Laser Super Retinol 100 and Super Glutathione 100 masks.',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'quality-1st',
    relatedProductSlugs: [
      'quality-1st-derma-laser-super-retinol-100',
      'quality-1st-derma-laser-super-glutathione-100'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'brand-lululun': {
    id: 'brand-lululun',
    path: '/brands/lululun',
    pageType: 'brand',
    title: 'LuLuLun Sheet Masks in India | Daily Facial Masks | Konichiwa Mart',
    primaryIntent: 'LuLuLun products India',
    secondaryIntents: [
      'LuLuLun India',
      'LuLuLun sheet masks India',
      'buy LuLuLun face mask online',
      'LuLuLun Precious Clear'
    ],
    targetAudience: 'Shoppers looking for Tokyo’s No. 1 daily face mask ritual with 3-layer microfiber cotton sheets.',
    searchContext: 'Features LuLuLun Precious CLEAR (White), Precious MOIST (Red), and Precious BALANCE (Green).',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'lululun',
    relatedProductSlugs: [
      'lululun-precious-clear-white',
      'km-1789877437001',
      'km-1789877630201'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'brand-kose': {
    id: 'brand-kose',
    path: '/brands/kose',
    pageType: 'brand',
    title: 'Kosé Beauty Products in India | Clear Turn & Mist | Konichiwa Mart',
    primaryIntent: 'Kose products India',
    secondaryIntents: [
      'Kose India',
      'Kose Clear Turn masks India',
      'Kose Makeup Keep Mist India',
      'Kose Cosmeport Tokyo'
    ],
    targetAudience: 'Shoppers seeking heritage Japanese cosmetics, Clear Turn Vitamin Bomb sheet masks, and viral long-wear setting mists.',
    searchContext: 'Features Kosé Clear Turn Vitamin Bomb, Uruuru Bomb, Glutathione Bomb, and Makeup Keep Mist.',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'kose',
    relatedProductSlugs: [
      'km-1790773017649',
      'km-1790773728678',
      'km-1790776875945',
      'km-1790349840347'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'brand-capsule-serum': {
    id: 'brand-capsule-serum',
    path: '/brands/capsule-serum',
    pageType: 'brand',
    title: 'Capsule Serum in India | Fresh Vitamin C Serums | Konichiwa Mart',
    primaryIntent: 'Capsule Serum products India',
    secondaryIntents: [
      'Capsule Serum India',
      'micro capsule Vitamin C serum Japan',
      'fresh encapsulated Vitamin C serum'
    ],
    targetAudience: 'Shoppers seeking stabilized micro-capsule suspension technology for pure Vitamin C pore and brightening therapy.',
    searchContext: 'Features Premium Capsule Serum Vitamin C and Vitamin C Capsule Serum direct from Tokyo.',
    relatedCategorySlug: 'serum',
    relatedBrandSlug: 'capsule-serum',
    relatedProductSlugs: [
      'premium-capsule-serum-vitamin-c',
      'vitamin-c-capsule-serum'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'brand-shiseido': {
    id: 'brand-shiseido',
    path: '/brands/shiseido',
    pageType: 'brand',
    title: 'Shiseido Products in India | Japanese Beauty Care | Konichiwa Mart',
    primaryIntent: 'Shiseido products India',
    secondaryIntents: [
      'Shiseido India',
      'Shiseido skincare India',
      'Shiseido Tokyo imports',
      'buy Shiseido online India'
    ],
    targetAudience: 'Shoppers searching for Shiseido’s heritage beauty lines, including Senka, Fino, and Tsubaki.',
    searchContext: 'Umbrella house brand page connecting to Senka cleansers, Fino hair masks, and Tsubaki camellia oil treatments.',
    relatedCategorySlug: 'skincare',
    relatedBrandSlug: 'shiseido',
    relatedProductSlugs: [
      'senka-perfect-whip-face-wash',
      'fino-premium-touch-hair-mask',
      'km-1789878278891'
    ],
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine',
      'how-to-use-japanese-hair-mask'
    ]
  },

  'brand-rohto': {
    id: 'brand-rohto',
    path: '/brands/rohto',
    pageType: 'brand',
    title: 'Rohto Pharmaceutical Japan Products in India | Konichiwa Mart',
    primaryIntent: 'Rohto products India',
    secondaryIntents: [
      'Rohto Pharmaceutical India',
      'Rohto skincare India',
      'Rohto Mentholatum Japan',
      'Rohto Melano CC India'
    ],
    targetAudience: 'Shoppers seeking research-backed Japanese skincare formulated by Rohto Pharmaceutical (Melano CC, Hada Labo, Skin Aqua).',
    searchContext: 'Connects Rohto’s dermatological lines with authentic batch authenticity verified from Osaka.',
    relatedCategorySlug: 'skincare',
    relatedBrandSlug: 'rohto',
    relatedProductSlugs: [
      'rohto-melano-cc-vitamin-c-toner',
      'km-1790347775970'
    ],
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  // =========================================================================
  // 4. CORE PRODUCT SEARCH INTENTS (Transactional Queries)
  // =========================================================================
  'product-senka-perfect-whip': {
    id: 'product-senka-perfect-whip',
    path: '/products/senka-perfect-whip-face-wash',
    pageType: 'product',
    title: 'Senka Perfect Whip Face Wash | Buy Online India | Konichiwa Mart',
    primaryIntent: 'Senka Perfect Whip Face Wash India',
    secondaryIntents: [
      'Senka Perfect Whip Face Wash',
      'buy Senka Perfect Whip online',
      'Japanese face wash Senka',
      'Senka Perfect Whip 120g India',
      'Shiseido Senka face wash India'
    ],
    targetAudience: 'Shoppers seeking the authentic Japanese No. 1 micro-dense whipped foam cleanser with natural silk essence.',
    searchContext: 'Exact product details, 120g size, verified Tokyo import, ₹1099 INR with fast 3-5 day pan-India shipping.',
    relatedCategorySlug: 'face-wash',
    relatedBrandSlug: 'senka',
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine',
      'how-to-choose-japanese-face-wash'
    ]
  },

  'product-biore-uv-aqua-rich': {
    id: 'product-biore-uv-aqua-rich',
    path: '/products/biore-uv-aqua-rich-watery-essence-spf-50',
    pageType: 'product',
    title: 'Bioré UV Aqua Rich Watery Essence SPF 50+ | Konichiwa Mart India',
    primaryIntent: 'Biore UV Aqua Rich Watery Essence India',
    secondaryIntents: [
      'Japanese sunscreen India',
      'Biore sunscreen India',
      'Biore UV Aqua Rich SPF 50+',
      'buy Biore sunscreen online India',
      'Japanese sunscreen zero white cast'
    ],
    targetAudience: 'Indian buyers needing invisible, broad-spectrum UVA/UVB defense (SPF50+ PA++++) that absorbs instantly without greasy residue.',
    searchContext: 'Authentic 50g Japanese formulation featuring Micro Defense technology, ₹1275 INR, delivered across India.',
    relatedCategorySlug: 'sunscreen',
    relatedBrandSlug: 'biore',
    relatedGuideSlugs: [
      'japanese-sunscreen-guide-india',
      'japanese-skincare-routine-beginners'
    ]
  },

  'product-fino-hair-mask': {
    id: 'product-fino-hair-mask',
    path: '/products/fino-premium-touch-hair-mask',
    pageType: 'product',
    title: 'Fino Premium Touch Hair Mask | Buy Online India | Konichiwa Mart',
    primaryIntent: 'Fino Premium Touch Hair Mask India',
    secondaryIntents: [
      'buy Fino hair mask India',
      'Shiseido Fino hair mask online',
      'Japanese hair mask for frizzy hair',
      'Fino 230g hair mask India',
      'Fino 7 beauty essence treatment'
    ],
    targetAudience: 'Consumers dealing with dry, frizzy, or heat-damaged hair seeking Japan’s viral salon-finish rinse-off hair mask.',
    searchContext: 'Full 230g salon tub with royal jelly extract and squalane, ₹999 INR, verified direct Tokyo import.',
    relatedCategorySlug: 'hair-care',
    relatedBrandSlug: 'fino',
    relatedGuideSlugs: [
      'how-to-use-japanese-hair-mask'
    ]
  },

  'product-melano-cc-toner': {
    id: 'product-melano-cc-toner',
    path: '/products/rohto-melano-cc-vitamin-c-toner',
    pageType: 'product',
    title: 'Rohto Melano CC Vitamin C Toner | Buy Online India | Konichiwa Mart',
    primaryIntent: 'Melano CC Vitamin C Toner India',
    secondaryIntents: [
      'Rohto Melano CC India',
      'buy Melano CC toner online India',
      'Japanese Vitamin C brightening lotion',
      'Melano CC 170ml lotion India',
      'Melano CC blemish care'
    ],
    targetAudience: 'Shoppers looking to fade post-acne dark spots and refine pores with gentle, stabilized ascorbic acid.',
    searchContext: 'Authentic 170ml Rohto Pharmaceutical bottle, ₹1225 INR, fast delivery in India.',
    relatedCategorySlug: 'toner',
    relatedBrandSlug: 'melano-cc',
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  'product-keana-rice-mask': {
    id: 'product-keana-rice-mask',
    path: '/products/keana-nadeshiko-rice-mask-10th-anniversary',
    pageType: 'product',
    title: 'Keana Nadeshiko Rice Mask (10th Anniversary) | Konichiwa Mart India',
    primaryIntent: 'Keana Nadeshiko Rice Mask India',
    secondaryIntents: [
      'Japanese rice sheet mask India',
      'buy Keana rice mask online',
      'Ishizawa Keana pore care',
      '100% Japanese rice face mask'
    ],
    targetAudience: 'Individuals battling enlarged pores and dry, bumpy skin seeking 100% Japanese domestic rice ferment essence.',
    searchContext: '10-sheet resealable pouch from Ishizawa Laboratories, ₹1099 INR.',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'keana-nadeshiko',
    relatedGuideSlugs: [
      'double-cleansing-japanese-routine'
    ]
  },

  'product-lululun-precious-clear': {
    id: 'product-lululun-precious-clear',
    path: '/products/lululun-precious-clear-white',
    pageType: 'product',
    title: 'LuLuLun Precious CLEAR (White) | Buy Online India | Konichiwa Mart',
    primaryIntent: 'LuLuLun Precious Clear Sheet Mask India',
    secondaryIntents: [
      'LuLuLun face mask India',
      'Japanese daily sheet masks',
      'LuLuLun white brightening mask',
      'buy LuLuLun online India'
    ],
    targetAudience: 'Customers seeking everyday brightening and translucency hydration with Japanese botanical rice and seaweed extracts.',
    searchContext: '7-sheet daily pack from Tokyo, ₹799 INR.',
    relatedCategorySlug: 'face-mask',
    relatedBrandSlug: 'lululun',
    relatedGuideSlugs: [
      'japanese-skincare-routine-beginners'
    ]
  },

  // =========================================================================
  // 5. CONTENT / EDUCATIONAL GUIDES (Informational Intent)
  // =========================================================================
  'guide-japanese-skincare-routine-beginners': {
    id: 'guide-japanese-skincare-routine-beginners',
    path: '/guides/japanese-skincare-routine-beginners',
    pageType: 'guide',
    title: 'The Essential Japanese Skincare Routine for Beginners | Konichiwa Mart India',
    primaryIntent: 'Japanese skincare routine',
    secondaryIntents: [
      'Japanese skincare for beginners',
      'J-Beauty routine steps',
      'Japanese skincare routine India',
      'how to do Japanese skincare routine'
    ],
    targetAudience: 'Beginners looking to understand the J-Beauty philosophy of gentle barrier care, watery hydration, and disciplined sun defense.',
    searchContext: 'Comprehensive 4-step routine walkthrough connecting to Senka foam, Melano CC lotion, Capsule Serum, and Bioré sunscreen.',
    relatedCategorySlug: 'skincare',
    relatedProductSlugs: [
      'senka-perfect-whip-face-wash',
      'rohto-melano-cc-vitamin-c-toner',
      'premium-capsule-serum-vitamin-c',
      'biore-uv-aqua-rich-watery-essence-spf-50'
    ]
  },

  'guide-japanese-sunscreen-guide-india': {
    id: 'guide-japanese-sunscreen-guide-india',
    path: '/guides/japanese-sunscreen-guide-india',
    pageType: 'guide',
    title: 'Why Japanese Sunscreens are Best for Indian Climates | Konichiwa Mart',
    primaryIntent: 'how to use Japanese sunscreen',
    secondaryIntents: [
      'why Japanese sunscreens are best for India',
      'Japanese sunscreen PA++++ rating explained',
      'Japanese sunscreen no white cast',
      'best Japanese sunscreen for Indian skin'
    ],
    targetAudience: 'Indian consumers tired of heavy, chalky Western sunscreens wanting to understand why Japanese micro-defense formulas excel in heat and humidity.',
    searchContext: 'Explains cosmetic elegance, PA++++ UVA criteria, and water-gel micro-capsules, directly linking to Bioré UV Aqua Rich.',
    relatedCategorySlug: 'sunscreen',
    relatedBrandSlug: 'biore',
    relatedProductSlugs: [
      'biore-uv-aqua-rich-watery-essence-spf-50',
      'km-1789877832835'
    ]
  },

  'guide-double-cleansing-japanese-routine': {
    id: 'guide-double-cleansing-japanese-routine',
    path: '/guides/double-cleansing-japanese-routine',
    pageType: 'guide',
    title: 'How to Double Cleanse the Japanese Way | Clear Pores Without Stripping',
    primaryIntent: 'Japanese double cleansing',
    secondaryIntents: [
      'how to double cleanse the Japanese way',
      'double cleansing for pores and sunscreen',
      'Japanese face wash technique',
      'whipped foam cleansing method'
    ],
    targetAudience: 'People struggling with clogged pores, waterproof sunscreen residue, or tightness after washing.',
    searchContext: 'Demonstrates micro-dense foam cushioning technique without skin drag, connecting to Senka Perfect Whip and Keana Rice Mask.',
    relatedCategorySlug: 'face-wash',
    relatedBrandSlug: 'senka',
    relatedProductSlugs: [
      'senka-perfect-whip-face-wash',
      'keana-nadeshiko-rice-mask-10th-anniversary'
    ]
  },

  'guide-how-to-choose-japanese-face-wash': {
    id: 'guide-how-to-choose-japanese-face-wash',
    path: '/guides/how-to-choose-japanese-face-wash',
    pageType: 'guide',
    title: 'How to Choose the Right Japanese Face Wash for Your Skin Type | Konichiwa Mart',
    primaryIntent: 'how to choose Japanese face wash',
    secondaryIntents: [
      'best Japanese face wash for skin type',
      'Japanese foaming cleanser vs cleansing gel',
      'Senka vs Biore face wash',
      'Japanese face wash for oily acne skin India'
    ],
    targetAudience: 'Shoppers overwhelmed by choices seeking to identify whether whipped foam (Senka) or massage gel (Bioré) fits their skin type.',
    searchContext: 'Clear decision guide breaking down dense foam vs non-foaming gel, with direct catalog matches for oily, dry, acne-prone, and mature skin.',
    relatedCategorySlug: 'face-wash',
    relatedBrandSlug: 'senka',
    relatedProductSlugs: [
      'senka-perfect-whip-face-wash',
      'km-1789873626221',
      'km-1789596639792',
      'km-1790951777917'
    ]
  },

  'guide-how-to-use-japanese-hair-mask': {
    id: 'guide-how-to-use-japanese-hair-mask',
    path: '/guides/how-to-use-japanese-hair-mask',
    pageType: 'guide',
    title: 'How to Use Japanese Hair Masks for Frizzy & Damaged Hair | Fino & Tsubaki Guide',
    primaryIntent: 'how to use Japanese hair mask',
    secondaryIntents: [
      'Japanese hair mask for frizzy hair',
      'how often to use Fino hair mask',
      'Fino vs Tsubaki hair mask routine',
      'Japanese salon hair treatment at home'
    ],
    targetAudience: 'Shoppers looking for the correct application frequency, warm-towel technique, and comparison between Fino, Tsubaki, and &honey.',
    searchContext: 'Practical, step-by-step masterclass on deep cuticle sealing and moisture retention, linking directly to Fino, Tsubaki, and &honey.',
    relatedCategorySlug: 'hair-care',
    relatedBrandSlug: 'fino',
    relatedProductSlugs: [
      'fino-premium-touch-hair-mask',
      'km-1789878278891',
      'honey-melty-moist-repair-hair-pack-step-15'
    ]
  }
};

/**
 * Returns search intent entry by exact URL path
 */
export function getSearchIntentForPath(urlPath: string): SearchIntentItem | undefined {
  const clean = urlPath.split('?')[0].replace(/\/+$/, '') || '/';
  return Object.values(SEARCH_INTENT_MAP).find(item => item.path === clean);
}

/**
 * Returns all search intent items of a specific page type
 */
export function getSearchIntentsByPageType(pageType: SearchIntentItem['pageType']): SearchIntentItem[] {
  return Object.values(SEARCH_INTENT_MAP).filter(item => item.pageType === pageType);
}

/**
 * Returns all search intent items
 */
export function getAllSearchIntents(): SearchIntentItem[] {
  return Object.values(SEARCH_INTENT_MAP);
}
