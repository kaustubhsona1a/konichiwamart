export interface SeoCategoryInfo {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  h1: string;
  introText: string;
  badge: string;
}

export interface SeoBrandInfo {
  slug: string;
  name: string;
  japaneseName: string;
  title: string;
  metaDescription: string;
  h1: string;
  brandStory: string;
  countryOfOrigin: string;
  foundingYear?: string;
}

export interface SeoGuideInfo {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  excerpt: string;
  readTime: string;
  publishedDate: string;
  updatedDate: string;
  author: string;
  category: string;
  sections: {
    heading: string;
    content: string;
    recommendedProductSlugs?: string[];
  }[];
}

export const CANONICAL_SITE_URL = 'https://www.konichiwamart.com';

/**
 * Authentic Japanese Skincare Categories with search-intent optimization
 */
export const SEO_CATEGORIES: Record<string, SeoCategoryInfo> = {
  'sunscreen': {
    slug: 'sunscreen',
    name: 'Japanese Sunscreen',
    title: 'Japanese Sunscreens in India | Watery Essence & Mineral UV | Konichiwa Mart',
    metaDescription: 'Shop 100% authentic Japanese sunscreens in India. Ultra-light watery gel textures with zero white cast and sweat resistance: Bioré UV Aqua Rich, Bioré Kids & more.',
    h1: 'Authentic Japanese Sunscreens',
    introText: 'Japanese sunscreens are globally celebrated for their revolutionary micro-defense filters, weightless water-gel textures, and completely transparent, non-greasy finishes that perform exceptionally well in humid Indian weather.',
    badge: 'High UV Protection PA++++'
  },
  'face-wash': {
    slug: 'face-wash',
    name: 'Japanese Face Wash & Cleansers',
    title: 'Japanese Cleansers & Face Wash in India | Senka Perfect Whip | Konichiwa Mart',
    metaDescription: 'Buy authentic Japanese facial cleansers in India. Rich micro-dense whipped foams with silk essence & collagen that cleanse deeply without stripping moisture.',
    h1: 'Japanese Micro-Dense Cleansers & Face Washes',
    introText: 'Japanese facial cleansing centers on high-density micro-foam cushions that cleanse pores through surface tension rather than harsh rubbing, safeguarding the skin barrier.',
    badge: 'Silk Essence Micro-Foam'
  },
  'toner': {
    slug: 'toner',
    name: 'Japanese Hydrating Lotions & Toners',
    title: 'Japanese Toners & Hydrating Lotions in India | Melano CC, Hada Labo | Konichiwa Mart',
    metaDescription: 'Shop genuine Japanese lotion toners in India. Multi-molecular hyaluronic acid and stable active vitamin C formulas for plumping glass skin and blemish control.',
    h1: 'Japanese Hydrating Lotions & Conditioning Toners',
    introText: 'In Japanese skincare (J-Beauty), "lotion" (Keshousui) is the cornerstone hydration step, replenishing water-soluble actives deep into the stratum corneum before heavier treatments.',
    badge: 'Glass Skin Hydration'
  },
  'serum': {
    slug: 'serum',
    name: 'Japanese Face Serums & Treatments',
    title: 'Japanese Face Serums in India | Fresh Capsule Vitamin C | Konichiwa Mart',
    metaDescription: 'Discover viral Japanese face serums in India. Fresh micro-capsule Vitamin C, pore tightening and brightening treatments direct from Tokyo.',
    h1: 'Japanese Intensive Serums & Concentrates',
    introText: 'Targeted Japanese serums harness stabilization technology—such as micro-capsule encapsulation—to preserve raw actives and deliver uncompromised potency.',
    badge: 'Fresh Capsule Potency'
  },
  'face-mask': {
    slug: 'face-mask',
    name: 'Japanese Sheet Masks',
    title: 'Japanese Sheet Masks in India | Keana Rice, LuLuLun, Derma Laser | Konichiwa Mart',
    metaDescription: 'Buy authentic Japanese sheet masks in India. Keana Nadeshiko domestic rice extract, LuLuLun multi-sheet packs & Derma Laser Super Retinol treatments.',
    h1: 'Japanese Sheet Masks & Intensive Packs',
    introText: 'From 100% Japanese domestic rice ferment masks to daily multi-sheet cotton packs and clinical Derma Laser silicone-fit sheets, explore Tokyo’s most iconic sheet mask rituals.',
    badge: 'Pure Ferment & Botanical'
  },
  'hair-care': {
    slug: 'hair-care',
    name: 'Japanese Hair Care & Treatments',
    title: 'Japanese Hair Care in India | Fino Premium Touch, &honey | Konichiwa Mart',
    metaDescription: 'Shop cult-favorite Japanese hair masks and treatments in India. Shiseido Fino Premium Touch 7-essence mask and &honey organic deep repair packs.',
    h1: 'Japanese Hair Care & Intensive Hair Masks',
    introText: 'Japanese hair treatments utilize salon-grade royal jelly, lipid-replenishing squalane, and amino acid complexes that melt into damaged cuticles for lasting mirror shine.',
    badge: 'Salon Royal Jelly Care'
  },
  'skincare': {
    slug: 'skincare',
    name: 'All Japanese Skincare',
    title: 'Authentic Japanese Skincare Products in India | 100% Japan Import | Konichiwa Mart',
    metaDescription: 'Explore the complete collection of 100% authentic Japanese skincare in India. Curated Tokyo bestsellers with express shipping and genuine batch authentication.',
    h1: 'Complete Japanese Skincare Collection',
    introText: 'Every item in our collection is sourced directly from certified Tokyo distributors, featuring genuine Japanese seals, verified expiration batches, and doorstep delivery across India.',
    badge: '100% Tokyo Imports'
  }
};

/**
 * Authentic Japanese Beauty Brands with verified brand histories
 */
export const SEO_BRANDS: Record<string, SeoBrandInfo> = {
  'biore': {
    slug: 'biore',
    name: 'Bioré',
    japaneseName: 'ビオレ',
    title: 'Bioré Japan Products in India | UV Aqua Rich & Sunscreens | Konichiwa Mart',
    metaDescription: 'Shop original Bioré Japan skincare and sunscreens in India. Official Tokyo batches of Bioré UV Aqua Rich Watery Essence SPF 50+ PA++++ with zero white cast.',
    h1: 'Bioré Japan – World-Renowned UV & Pore Care',
    brandStory: 'Created by Kao Corporation in Japan, Bioré revolutionized daily sun protection with its patented Micro Defense technology—delivering sub-micron UV capsule coverage in water-light formulations.',
    countryOfOrigin: 'Japan',
    foundingYear: '1980'
  },
  'senka': {
    slug: 'senka',
    name: 'Senka',
    japaneseName: '専科',
    title: 'Senka Shiseido Products in India | Perfect Whip Cleansers | Konichiwa Mart',
    metaDescription: 'Buy authentic Senka Shiseido Perfect Whip face washes in India. Iconic Japanese micro-dense whipped foams with natural silk essence and hyaluronic acid.',
    h1: 'Senka by Shiseido – Japan’s No. 1 Whipped Cleansing Foam',
    brandStory: 'Senka is Shiseido’s beloved cleansing line, famous across Asia for Perfect Whip—a micro-dense foam whose ultra-fine bubbles lift deep pore dirt without friction.',
    countryOfOrigin: 'Japan',
    foundingYear: '2003'
  },
  'hada-labo': {
    slug: 'hada-labo',
    name: 'Hada Labo',
    japaneseName: '肌ラボ',
    title: 'Hada Labo Tokyo Products in India | Gokujyun Premium Lotion | Konichiwa Mart',
    metaDescription: 'Order genuine Rohto Hada Labo hyaluronic acid lotions in India. Multi-weight hyaluronic acid hydration matrices for healthy, bouncy glass skin.',
    h1: 'Hada Labo Rohto – Hyaluronic Acid Perfection',
    brandStory: 'Formulated under Rohto Pharmaceutical’s "Perfect x Simple" philosophy, Hada Labo eliminates unnecessary mineral oils, fragrances, and colorants to focus on medical-grade multi-layer hyaluronic acid.',
    countryOfOrigin: 'Japan',
    foundingYear: '2004'
  },
  'melano-cc': {
    slug: 'melano-cc',
    name: 'Melano CC',
    japaneseName: 'メラノCC',
    title: 'Melano CC Rohto in India | Vitamin C Brightening Toners | Konichiwa Mart',
    metaDescription: 'Buy 100% original Rohto Melano CC Vitamin C skincare in India. Stabilized pure ascorbic acid toners that fade post-acne marks and tighten pores without oxidizing.',
    h1: 'Melano CC by Rohto – Non-Oxidizing Vitamin C Expertise',
    brandStory: 'Rohto Pharmaceutical’s patented Vitamin C technology protects pure ascorbic acid from breakdown, delivering gentle yet potent brightening and pore refinement.',
    countryOfOrigin: 'Japan',
    foundingYear: '2005'
  },
  'lululun': {
    slug: 'lululun',
    name: 'LuLuLun',
    japaneseName: 'ルルルン',
    title: 'LuLuLun Sheet Masks in India | Precious Clear, Balance & Moist | Konichiwa Mart',
    metaDescription: 'Shop authentic LuLuLun Japanese facial sheet masks in India. Daily luxury 3-layer cotton sheets soaked in botanical rice and seaweed essences.',
    h1: 'LuLuLun – Japan’s Iconic Daily Face Mask Ritual',
    brandStory: 'LuLuLun pioneered the "daily mask" movement in Tokyo, formulating gentle micro-fiber sheets tailored for every skin stage—from youthful clarity to mature barrier renewal.',
    countryOfOrigin: 'Japan',
    foundingYear: '2011'
  },
  'fino': {
    slug: 'fino',
    name: 'Fino',
    japaneseName: 'フィーノ',
    title: 'Fino Shiseido Hair Care in India | Premium Touch Hair Mask | Konichiwa Mart',
    metaDescription: 'Buy viral Shiseido Fino Premium Touch Hair Mask in India. 7 beauty essence deep conditioning treatment for silky, smooth, salon-finish hair.',
    h1: 'Fino by Shiseido – Japan’s Viral Salon Conditioning Mask',
    brandStory: 'Fino combines royal jelly extract, PCA, and squalane into an intensive conditioning treatment that repairs heat and environmental damage from cuticle to core.',
    countryOfOrigin: 'Japan',
    foundingYear: '2005'
  },
  'honey': {
    slug: 'honey',
    name: '&honey',
    japaneseName: 'アンドハニー',
    title: '&honey Japanese Hair Care in India | Melty Moist Repair Packs | Konichiwa Mart',
    metaDescription: 'Shop authentic &honey Japanese hair and body products in India. Organic Manuka honey moisture-lock formulas for frizzy, dry, and wavy hair.',
    h1: '&honey – Organic Honey Moisture Science',
    brandStory: '&honey formulates hair and body rituals with a unique 14% optimal moisture retention ratio, using certified organic Manuka, Acacia, and Japanese raw honey.',
    countryOfOrigin: 'Japan',
    foundingYear: '2018'
  },
  'keana-nadeshiko': {
    slug: 'keana-nadeshiko',
    name: 'Keana Nadeshiko',
    japaneseName: '毛穴撫子',
    title: 'Keana Nadeshiko Rice Masks in India | Ishizawa Laboratories | Konichiwa Mart',
    metaDescription: 'Buy genuine Keana Nadeshiko Rice Mask in India. 100% Japanese domestic rice extract sheet masks for rough texture, dryness, and open pores.',
    h1: 'Keana Nadeshiko – 100% Domestic Japanese Rice Care',
    brandStory: 'Manufactured by Ishizawa Laboratories in Tokyo, Keana Nadeshiko utilizes four nutrient-rich extracts derived from 100% Japanese rice to minimize pore visibility and condition uneven texture.',
    countryOfOrigin: 'Japan',
    foundingYear: '2007'
  },
  'quality-1st': {
    slug: 'quality-1st',
    name: 'Quality 1st',
    japaneseName: 'クオリティファースト',
    title: 'Quality 1st Derma Laser Masks in India | Super Retinol & Glutathione | Konichiwa Mart',
    metaDescription: 'Shop Quality 1st Derma Laser sheet masks in India. High-adhesion laser-cut sheets infused with concentrated Retinol, Glutathione, and Niacinamide.',
    h1: 'Quality 1st Derma Laser – Advanced Transdermal Care',
    brandStory: 'Quality 1st combines clinical-grade active concentrations with high-density laser-cut sheets engineered to match facial contours for maximum transdermal absorption.',
    countryOfOrigin: 'Japan',
    foundingYear: '2012'
  },
  'kose': {
    slug: 'kose',
    name: 'Kosé',
    japaneseName: 'コーセー',
    title: 'Kosé Japan Beauty & Clear Turn in India | Sheet Masks & Mist | Konichiwa Mart',
    metaDescription: 'Explore genuine Kosé Japan cosmetics, Clear Turn Vitamin Bomb face masks, and Makeup Keep Mist in India with verified Tokyo authentication.',
    h1: 'Kosé Cosmeport – Pioneer in Japanese Beauty Innovation',
    brandStory: 'Founded in Tokyo in 1946, Kosé is one of Japan’s premier cosmetics houses, renowned for pioneering powder foundations, beauty serums, and ultra-hydrating sheet masks.',
    countryOfOrigin: 'Japan',
    foundingYear: '1946'
  }
};

/**
 * Authentic Educational Guides answering high-volume search intent
 */
export const SEO_GUIDES: Record<string, SeoGuideInfo> = {
  'japanese-skincare-routine-beginners': {
    slug: 'japanese-skincare-routine-beginners',
    title: 'The Essential Japanese Skincare Routine for Beginners | Konichiwa Mart India',
    metaDescription: 'Master the 4-step Japanese skincare (J-Beauty) routine for glass skin in India: Double cleansing, hydrating lotion, targeted serum, and daily weightless sunscreen.',
    h1: 'The Beginner’s Guide to the Japanese Skincare Routine (J-Beauty)',
    excerpt: 'Unlike multi-step routines that overload the skin barrier, the traditional Japanese skincare philosophy centers on gentle hydration layering, barrier protection, and high-performance daily sun defense.',
    readTime: '5 min read',
    publishedDate: '2026-01-15',
    updatedDate: '2026-09-20',
    author: 'Konichiwa Mart Editorial Team',
    category: 'Skincare Routines',
    sections: [
      {
        heading: '1. The Philosophy: Prevention & Gentle Hydration Layering',
        content: 'Japanese beauty (J-Beauty) prioritizes "Mochi-Hada" (soft, plump, rice-cake skin) achieved through skin-barrier preservation, watery hydration layers, and disciplined sun defense, rather than harsh chemical exfoliation.',
      },
      {
        heading: '2. Step 1: The Micro-Dense Cleanse',
        content: 'Instead of aggressive scrubbing, Japanese cleansing uses thick micro-foam cushions (like Senka Perfect Whip) where fine bubbles do the lifting work, keeping natural moisture lipids intact.',
        recommendedProductSlugs: ['senka-perfect-whip']
      },
      {
        heading: '3. Step 2: The Hydrating Lotion (Keshousui)',
        content: 'In Japan, "lotion" is a watery, watery-gel essence patted onto damp skin. Formulations with multi-weight hyaluronic acid or stable vitamin C prep the skin to absorb subsequent treatments.',
        recommendedProductSlugs: ['melano-cc-brightening-toner']
      },
      {
        heading: '4. Step 3: Targeted Serum or Sheet Mask',
        content: 'Whether addressing enlarged pores with Japanese fermented rice (Keana Nadeshiko) or refining tone with fresh capsule Vitamin C, J-Beauty serums are engineered for ultra-light absorption without sticky residue.',
        recommendedProductSlugs: ['capsule-serum-vitamin-c', 'keana-rice-mask']
      },
      {
        heading: '5. Step 4: The Non-Negotiable Japanese Sunscreen',
        content: 'Japanese sunscreens are globally unmatched. Formulations like Bioré UV Aqua Rich sink into Indian skin in seconds with zero chalkiness, zero white cast, and sweat resistance suitable for our climate.',
        recommendedProductSlugs: ['biore-uv-aqua-rich-sunscreen']
      }
    ]
  },
  'japanese-sunscreen-guide-india': {
    slug: 'japanese-sunscreen-guide-india',
    title: 'Why Japanese Sunscreens are Best for Indian Climates | Konichiwa Mart',
    metaDescription: 'Discover why Japanese sunscreens (like Bioré UV) are ideal for warm Indian weather: Zero white cast on melanin-rich skin, water-light textures, and PA++++ protection.',
    h1: 'The Ultimate Guide to Japanese Sunscreens for Indian Weather',
    excerpt: 'From extreme summer humidity in Mumbai and Chennai to dry winter heat in Delhi, Japanese sunscreens offer the world’s most advanced cosmetic elegance without greasy residue.',
    readTime: '4 min read',
    publishedDate: '2026-02-10',
    updatedDate: '2026-09-25',
    author: 'Konichiwa Mart Editorial Team',
    category: 'Sun Protection',
    sections: [
      {
        heading: 'Why Western & Traditional Sunscreens Often Fail in India',
        content: 'Heavy sunscreens with high zinc concentrations often cause thick white casts on warm Indian skin tones and trigger sweating or breakouts in tropical humidity.'
      },
      {
        heading: 'The Japanese Micro-Defense Revolution',
        content: 'Japanese sunscreens encapsulate modern organic filters in water-bursting micro-capsules. When massaged into the skin, they break into a refreshing water veil that dries to a semi-matte, invisible finish within 10 seconds.',
        recommendedProductSlugs: ['biore-uv-aqua-rich-sunscreen']
      },
      {
        heading: 'Understanding the Japanese PA++++ Rating',
        content: 'While SPF measures protection against UVB (burning), the Japanese PA rating specifically measures UVA (tanning, dark spots, and collagen breakdown). A PA++++ rating denotes the highest standard of UVA shielding available worldwide.'
      }
    ]
  },
  'double-cleansing-japanese-routine': {
    slug: 'double-cleansing-japanese-routine',
    title: 'How to Double Cleanse the Japanese Way | Clear Pores Without Stripping',
    metaDescription: 'Learn how authentic Japanese double cleansing gently dissolves waterproof sunscreen, pollution, and excess sebum while protecting your natural moisture barrier.',
    h1: 'The Art of Japanese Double Cleansing: Cleanse Deeply, Never Strip',
    excerpt: 'Popularized by Tokyo aesthetic salons, Japanese double cleansing ensures modern long-wear sunscreens and pollution are dissolved without the friction that triggers sensitivity.',
    readTime: '4 min read',
    publishedDate: '2026-03-01',
    updatedDate: '2026-09-18',
    author: 'Konichiwa Mart Editorial Team',
    category: 'Skincare Techniques',
    sections: [
      {
        heading: 'Why Single Cleansing Isn’t Enough for Water-Resistant Sunscreen',
        content: 'Modern sweat-proof sunscreens and water-resistant silicones bond securely to the stratum corneum. Normal water cleansers slide over them, leaving pore buildup that can cause congestion.'
      },
      {
        heading: 'Step-by-Step Japanese Method',
        content: '1. Begin with clean, dry hands. 2. Work a dense micro-foam cleanser (such as Senka Perfect Whip) with lukewarm water until a soft, pillowy cloud forms. 3. Glide the foam over the face without letting fingertips drag against the skin.'
      },
      {
        heading: 'Follow with Ferment or Rice Sheet Masks',
        content: 'Immediately after double cleansing, follow with a 5-minute Japanese rice sheet mask (like Keana Nadeshiko) to lock in hydration while pores are receptive.',
        recommendedProductSlugs: ['keana-rice-mask']
      }
    ]
  }
};
