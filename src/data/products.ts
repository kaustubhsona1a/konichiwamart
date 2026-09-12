import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'senka-perfect-whip',
    title: 'Senka Perfect Whip Face Wash',
    subtitle: 'Micro-Dense Cleansing Foam with Silk Essence',
    price: 620,
    originalPrice: 750,
    rating: 4.92,
    reviewsCount: 428,
    category: 'Face Wash',
    skinTypes: ['All', 'Oily', 'Combination', 'Normal'],
    skinConcerns: ['Hydration', 'Blemishes & Texture', 'Glow & Dullness'],
    routine: 'AM/PM',
    volume: '120g',
    badges: ['Japan #1 Cleanser', 'Dense Foam', 'Moisture Lock'],
    image: 'https://japanesetaste.com/cdn/shop/files/Senka-Perfect-Whip-Cleansing-Foam-120g-1-2025-08-25T00_18_50.384Z.jpg',
    secondaryImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#0284C7',
    bgGradient: 'from-blue-50 to-sky-100',
    isBestSeller: true,
    stock: 85,
    keyActives: [
      { name: 'Naturally Derived Silk Essence', purpose: 'Protects natural moisture while creating an ultra-fine foam cushion' },
      { name: 'Double Hyaluronic Acid', purpose: 'Keeps skin soft, hydrated, and refreshed without feeling tight' }
    ],
    fullIngredients: 'Water, Stearic Acid, PEG-8, Myristic Acid, Potassium Hydroxide, Glycerin, Lauric Acid, Alcohol, Butylene Glycol, Glyceryl Stearate SE, Polyquaternium-7, Sodium Hyaluronate, Sericin, Sodium Acetylated Hyaluronate, Hydrolyzed Silk, Disodium EDTA, Sodium Metabisulfite, Citric Acid, Potassium Sorbate, Fragrance.',
    description: 'Japan’s best-selling facial cleanser. Formulated with micro-dense whipped foam technology that gently cushions and lifts impurities and excess sebum from pores without drying out your skin.',
    benefits: [
      'Creates dense, pillowy whipped foam that reduces friction during washing',
      'Purifies pores and removes everyday pollution and buildup',
      'Preserves the skin’s natural protective moisture barrier'
    ],
    usageHowTo: 'Wet your hands and face. Squeeze about 2 cm onto your palm, lather thoroughly with cool or lukewarm water to create a rich foam cushion, gently wash your face, and rinse thoroughly.'
  },
  {
    id: 'fino-premium-touch-mask',
    title: 'Fino Premium Touch Face Mask',
    subtitle: 'Deep Hydration & Skin Conditioning Essence Mask',
    price: 1290,
    originalPrice: 1550,
    rating: 4.96,
    reviewsCount: 395,
    category: 'Face Mask',
    skinTypes: ['All', 'Dry', 'Sensitive', 'Combination'],
    skinConcerns: ['Hydration', 'Barrier Repair', 'Glow & Dullness'],
    routine: 'PM',
    volume: '230g',
    badges: ['Viral Sensation', 'Royal Jelly EX', 'Intensive Care'],
    image: 'https://cdn.shopify.com/s/files/1/0231/1294/1648/products/SHI1.jpg?v=1756979613',
    secondaryImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#E11D48',
    bgGradient: 'from-rose-50 to-red-100',
    isBestSeller: true,
    stock: 42,
    keyActives: [
      { name: 'Royal Jelly Extract', purpose: 'Deeply nourishes dry, stressed skin with essential amino acids' },
      { name: 'Squalane & Trehalose', purpose: 'Restores suppleness and seals in lasting hydration' },
      { name: 'PCA Complex', purpose: 'Softens coarse texture for a silky-smooth finish' }
    ],
    fullIngredients: 'Water, Sorbitol, Dimethicone, Hydrogenated Rapeseed Alcohol, Isopentyldiol, Behentrimonium Chloride, Squalane, Royal Jelly Extract, Trehalose, PCA, Glutamic Acid, Hydrolyzed Wheat Protein, Tocopherol, Phenoxyethanol, Fragrance.',
    description: 'An intensive beauty essence treatment packed with 7 nourishing essences. Melts smoothly into skin to restore moisture balance, relieve rough patches, and give a velvety, healthy-looking glow.',
    benefits: [
      'Delivers immediate, rich hydration to dry and dehydrated skin',
      'Smoothes and refines rough skin texture within minutes',
      'Leaves a soft, smooth, non-greasy moisture veil'
    ],
    usageHowTo: 'After cleansing, smooth an even layer over face avoiding immediate eye area. Leave on for 5 to 10 minutes to allow deep absorption, then rinse gently with lukewarm water. Use 1–2 times weekly.'
  },
  {
    id: 'melano-cc-brightening-toner',
    title: 'Rohto Melano CC Vitamin C Toner',
    subtitle: 'Brightening & Blemish Care Daily Essence Lotion',
    price: 1150,
    originalPrice: 1399,
    rating: 4.89,
    reviewsCount: 310,
    category: 'Toner',
    skinTypes: ['All', 'Oily', 'Combination', 'Sensitive'],
    skinConcerns: ['Glow & Dullness', 'Blemishes & Texture', 'Hydration'],
    routine: 'AM/PM',
    volume: '170ml',
    badges: ['Pure Vitamin C', 'Dark Spot Care', 'Pore Clarifying'],
    image: 'https://japanesetaste.com/cdn/shop/files/Rohto-Melano-CC-Brightening-Lotion-Rich-170ml-1-2025-10-07T07_32_18.366Z_large.jpg',
    secondaryImage: 'https://images.unsplash.com/photo-1608248597359-009765369eb3?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#F59E0B',
    bgGradient: 'from-amber-50 to-yellow-100',
    isBestSeller: true,
    stock: 58,
    keyActives: [
      { name: 'Active Vitamin C Derivative (3-O-Ethyl Ascorbic Acid)', percentage: '3.0%', purpose: 'Fades hyperpigmentation, clears dullness, and boosts skin radiance' },
      { name: 'Dipotassium Glycyrrhizate', purpose: 'Calms redness, irritation, and soothes acne-prone skin' },
      { name: 'Grapefruit & Lemon Botanical Extracts', purpose: 'Gently clarifies pores with a natural refreshing citrus aroma' }
    ],
    fullIngredients: 'Water, Butylene Glycol, Dipropylene Glycol, Glycerin, 3-O-Ethyl Ascorbic Acid, Ascorbic Acid, Dipotassium Glycyrrhizate, Alpinia Katsumadai Seed Extract, Citrus Limon (Lemon) Fruit Extract, Citrus Grandis (Grapefruit) Fruit Extract, Menthol, PEG-60 Hydrogenated Castor Oil, Citric Acid, Sodium Citrate, Disodium EDTA, Fragrance.',
    description: 'A cult-favorite Japanese brightening lotion formulated with high-potency Vitamin C. Penetrates deep into the stratum corneum to brighten dark spots, prevent blemishes, and tighten pores while keeping skin refreshed and balanced.',
    benefits: [
      'Visibly brightens dull complexion and evens skin tone',
      'Soothes post-blemish redness and calms irritation',
      'Provides weightless daily hydration with a clean, fast-absorbing texture'
    ],
    usageHowTo: 'After cleansing with Senka Perfect Whip, pour 4–5 drops onto palms or a soft cotton pad. Gently pat across the face and neck until fully absorbed.'
  },
  {
    id: 'biore-uv-aqua-rich-sunscreen',
    title: 'Bioré UV Aqua Rich Watery Essence SPF 50+',
    subtitle: 'Invisible Water-Light Daily Sunscreen with PA++++',
    price: 980,
    originalPrice: 1200,
    rating: 4.97,
    reviewsCount: 562,
    category: 'Sunscreen',
    skinTypes: ['All', 'Oily', 'Combination', 'Dry', 'Sensitive', 'Normal'],
    skinConcerns: ['Hydration', 'Anti-Aging', 'Barrier Repair'],
    routine: 'AM',
    volume: '70g',
    badges: ['SPF 50+ PA++++', 'Zero White Cast', 'Water Resistant 80m'],
    image: 'https://japanesetaste.com/cdn/shop/files/Kao-Biore-UV-Aqua-Rich-Watery-Essence-SPF50_-PA_-70g-1-2025-02-09T23_11_57.725Z.jpg',
    secondaryImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#0284C7',
    bgGradient: 'from-sky-50 to-blue-100',
    isBestSeller: true,
    stock: 94,
    keyActives: [
      { name: 'Micro Defense UV Formula', purpose: 'Covers skin evenly at the micro-level preventing uneven UV penetration' },
      { name: 'Hyaluronic Acid & Royal Jelly Extract', purpose: 'Hydrates continuously with refreshing moisture capsules' }
    ],
    fullIngredients: 'Water, Alcohol, Ethylhexyl Methoxycinnamate, Lauryl Methacrylate/Sodium Methacrylate Crosspolymer, Ethylhexyl Triazone, Dimethicone, C12-15 Alkyl Benzoate, Titanium Dioxide, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Dimethicone/Vinyl Dimethicone Crosspolymer, Sodium Hyaluronate, Royal Jelly Extract, Fragrance.',
    description: 'The world-famous Japanese water-light sunscreen. Features proprietary Micro Defense technology that shields against UVA and UVB rays while feeling lighter than air on skin. Leaves zero sticky feeling and no white cast.',
    benefits: [
      'Maximum Japanese SPF 50+ PA++++ broad-spectrum defense',
      'Melts into skin like water with zero residue or white cast',
      'Water and sweat resistant for up to 80 minutes',
      'Works perfectly under everyday makeup as a smooth hydrating primer'
    ],
    usageHowTo: 'Apply an appropriate amount evenly onto face and neck as the final step of your morning skincare routine. Reapply every 2 to 3 hours when outdoors.'
  },
  {
    id: 'velvet-petal-matte-lipstick',
    title: 'Velvet Petal Soft-Focus Matte Lipstick',
    subtitle: 'Weightless Silk Hydration with Japanese Camellia Oil',
    price: 1450,
    originalPrice: 1750,
    rating: 4.95,
    reviewsCount: 264,
    category: 'Lips',
    skinTypes: ['All', 'Dry', 'Normal', 'Sensitive'],
    skinConcerns: ['Hydration', 'Glow & Dullness'],
    routine: 'AM/PM',
    volume: '3.8g',
    badges: ['Boutique Best-Seller', '10hr Wear', 'Non-Drying'],
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#BE123C',
    bgGradient: 'from-rose-50 to-pink-100',
    isBestSeller: true,
    isNew: false,
    stock: 48,
    shades: [
      { id: 'sh-01', name: '01 Tokyo Crimson', hex: '#BE123C', sku: 'LIP-VK-01' },
      { id: 'sh-02', name: '02 Sakura Bloom', hex: '#E11D48', sku: 'LIP-VK-02' },
      { id: 'sh-04', name: '04 Dusty Rose', hex: '#BE185D', sku: 'LIP-VK-04' },
      { id: 'sh-05', name: '05 Kyoto Warm Nude', hex: '#B45309', sku: 'LIP-VK-05' }
    ],
    keyActives: [
      { name: 'Pure Tsubaki Camellia Seed Oil', percentage: '4.5%', purpose: 'Deeply nourishes lips to prevent feathering and parched lines' },
      { name: 'Ultra-Fine Spherical Silica', purpose: 'Blurs fine lip texture for an airbrushed velvet finish' },
      { name: 'Vitamin E & Squalane', purpose: 'Protects delicate lip barrier in dry air and AC environments' }
    ],
    fullIngredients: 'Dimethicone, Polyglyceryl-2 Triisostearate, Camellia Japonica Seed Oil, Squalane, Synthetic Wax, Silica Dimethyl Silylate, Tocopherol, Microcrystalline Wax, Isododecane, Trimethylsiloxysilicate, CI 77891, CI 77491, CI 15850, CI 77499, Ethylhexylglycerin.',
    description: 'A revolutionary cashmere-matte lipstick infused with cold-pressed Japanese Tsubaki oil. Delivers high-impact pigment in one swipe while keeping lips supple, cushiony, and comfortable throughout a 10-hour day.',
    benefits: [
      'Soft-focus blurring technology eliminates cakey creasing',
      'Weightless hydrating formula prevents lip dryness',
      'Flattering shades curated specifically for warm and olive skin tones',
      'Feather-resistant with clean Transfer-Safe pigments'
    ],
    usageHowTo: 'Glide directly from the bullet starting from center of lips outward. For a blurred blotted French-Japanese stain, dab with fingertips.'
  },
  {
    id: 'luminous-silk-serum-foundation',
    title: 'Luminous Silk Serum Foundation SPF 30',
    subtitle: 'Breathable Second-Skin Glow with 83% Skincare Base',
    price: 2190,
    originalPrice: 2550,
    rating: 4.91,
    reviewsCount: 198,
    category: 'Face',
    skinTypes: ['All', 'Dry', 'Combination', 'Sensitive'],
    skinConcerns: ['Glow & Dullness', 'Hydration', 'Barrier Repair'],
    routine: 'AM',
    volume: '30ml',
    badges: ['83% Skincare Base', 'SPF 30 PA+++', 'Non-Comedogenic'],
    image: 'https://images.unsplash.com/photo-1631730486784-5456119f69ae?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#D97706',
    bgGradient: 'from-amber-50 to-orange-100',
    isBestSeller: true,
    isNew: true,
    stock: 62,
    shades: [
      { id: 'fnd-101', name: '101 Fair Warm Porcelain', hex: '#FDE68A', sku: 'FND-LS-101' },
      { id: 'fnd-102', name: '102 Light Warm Beige', hex: '#FCD34D', sku: 'FND-LS-102' },
      { id: 'fnd-201', name: '201 Medium Natural Sand', hex: '#F59E0B', sku: 'FND-LS-201' },
      { id: 'fnd-301', name: '301 Warm Honey Tan', hex: '#D97706', sku: 'FND-LS-301' }
    ],
    keyActives: [
      { name: 'Okinawa Fermented Rice Filtrate', purpose: 'Enhances skin luminosity and prevents midday oxidation' },
      { name: 'Triple Hyaluronic Acid Complex', percentage: '2.0%', purpose: 'Locks in moisture so foundation never clings to dry patches' },
      { name: 'Niacinamide (Vitamin B3)', percentage: '3.0%', purpose: 'Soothes redness and refines pores over time' }
    ],
    fullIngredients: 'Water, Cyclopentasiloxane, Titanium Dioxide, Dimethicone, Ethylhexyl Methoxycinnamate, Niacinamide, Glycerin, Rice Ferment Filtrate, Sodium Hyaluronate, Hydrolyzed Hyaluronic Acid, Tocopherol, PEG-10 Dimethicone, Silica, Iron Oxides (CI 77492, CI 77491, CI 77499), Phenoxyethanol.',
    description: 'An ethereal serum foundation infused with Japanese fermented rice essence and triple hyaluronic acid. Provides customizable light-to-medium coverage with an lit-from-within dewy finish that resists humidity.',
    benefits: [
      'Gives a natural glass-skin radiance that does not look greasy',
      'Infused with 83% skincare actives that actively improve bare skin',
      'Formulated with non-oxidizing coated mineral pigments',
      'Broad-spectrum SPF 30 protection against daily ambient rays'
    ],
    usageHowTo: 'Shake bottle well. Dispense 1–2 drops on back of hand. Smooth over skin with fingertips, sponge, or dense foundation brush, buffing outward.'
  },
  {
    id: 'souffle-cream-blush',
    title: 'Soufflé Velvet Cream-to-Powder Blush',
    subtitle: 'Airy Watercolor Flush Infused with Peony & Squalane',
    price: 1190,
    originalPrice: 1450,
    rating: 4.88,
    reviewsCount: 175,
    category: 'Face',
    skinTypes: ['All', 'Oily', 'Combination', 'Dry'],
    skinConcerns: ['Glow & Dullness', 'Hydration'],
    routine: 'AM/PM',
    volume: '8g',
    badges: ['Cream-to-Powder', 'Seamless Blend', 'Vegan'],
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#FB7185',
    bgGradient: 'from-pink-50 to-rose-100',
    isBestSeller: false,
    isNew: true,
    stock: 54,
    shades: [
      { id: 'bl-01', name: 'Peach Yuzu Glow', hex: '#FDBA74', sku: 'BL-SF-01' },
      { id: 'bl-02', name: 'Sakura Petal Pink', hex: '#FB7185', sku: 'BL-SF-02' },
      { id: 'bl-03', name: 'Warm Berry Jam', hex: '#E11D48', sku: 'BL-SF-03' }
    ],
    keyActives: [
      { name: 'Japanese Peony Extract', purpose: 'Provides soothing antioxidant care to sensitive cheek skin' },
      { name: 'Plant-Derived Squalane', percentage: '3.0%', purpose: 'Ensures effortless blendability without disturbing base makeup' }
    ],
    fullIngredients: 'Caprylic/Capric Triglyceride, Mica, Squalane, Synthetic Fluorphlogopite, Dimethicone, Paeonia Suffruticosa Root Extract, Silica, Tocopheryl Acetate, CI 77891, CI 77491, CI 15850, CI 77499.',
    description: 'A whipped, pillowy cream blush that melts effortlessly into cheekbones before drying down to a soft-focus satin finish. Melts seamlessly over bare skin or foundation without lifting or streaking.',
    benefits: [
      'Never looks patchy, sticky, or greasy in high humidity',
      'Sheer, buildable watercolor flush from subtle daylight tint to evening pop',
      'Dual-use formula: gorgeous on cheeks, lips, and eyelids'
    ],
    usageHowTo: 'Tap lightly onto apples of cheeks with ring finger or beauty sponge, blending upward along cheekbones toward the temples.'
  },
  {
    id: 'gold-squalane-radiance-elixir',
    title: '24K Gold & Squalane Radiance Elixir Serum',
    subtitle: 'Ultra-Lightweight Facial Oil Infused with Pure Gold Leaf',
    price: 2450,
    originalPrice: 2890,
    rating: 4.97,
    reviewsCount: 210,
    category: 'Serum',
    skinTypes: ['All', 'Dry', 'Combination', 'Mature'],
    skinConcerns: ['Glow & Dullness', 'Anti-Aging', 'Barrier Repair'],
    routine: 'AM/PM',
    volume: '30ml',
    badges: ['24K Kanazawa Gold', 'Fast-Absorbing', 'Luxury Elixir'],
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1608248597359-009765369eb3?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#CA8A04',
    bgGradient: 'from-amber-50 to-yellow-100',
    isBestSeller: true,
    isNew: false,
    stock: 35,
    keyActives: [
      { name: 'Kanazawa 24K Gold Flakes', percentage: '0.05%', purpose: 'Stimulates microcirculation for an instant regal luminosity' },
      { name: 'Plant-Derived Sugarcane Squalane', percentage: '92%', purpose: 'Bio-identical lipid that mimics natural skin sebum without clogging pores' },
      { name: 'Rosehip & Tsubaki Seed Oil', purpose: 'Fades fine dehydration lines and boosts cellular renewal' }
    ],
    fullIngredients: 'Squalane, Camellia Japonica Seed Oil, Rosa Canina (Rosehip) Seed Oil, Gold Leaf (24 Karat), Tocopherol, Helianthus Annuus Seed Oil, Citrus Aurantium Bergamia Fruit Oil, Limonene, Linalool.',
    description: 'A sumptuous beauty nectar formulated with artisanal 24K gold flakes from Kanazawa, Japan. Deeply replenishes moisture reserves and leaves the skin with a luminous, non-greasy satin sheen.',
    benefits: [
      'Absorbs in under 30 seconds leaving zero greasy residue',
      'Can be mixed with foundation for an amplified dewiness',
      'Seals in moisture layers for up to 24 hours'
    ],
    usageHowTo: 'Warm 2–3 drops between palms and gently press onto cleansed face, neck, and décolletage after your toner or moisturiser.'
  },
  {
    id: 'centella-ceramide-barrier-serum',
    title: 'Centella & 5-Ceramide Barrier Rescue Serum',
    subtitle: 'Calming SOS Serum for Stressed, Irritated, or Over-Exfoliated Skin',
    price: 1690,
    originalPrice: 1950,
    rating: 4.93,
    reviewsCount: 184,
    category: 'Serum',
    skinTypes: ['All', 'Sensitive', 'Dry', 'Oily'],
    skinConcerns: ['Barrier Repair', 'Redness Relief', 'Hydration'],
    routine: 'AM/PM',
    volume: '50ml',
    badges: ['5 Essential Ceramides', 'Fragrance-Free', 'Dermatologist Tested'],
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#059669',
    bgGradient: 'from-emerald-50 to-teal-100',
    isBestSeller: false,
    isNew: true,
    stock: 46,
    keyActives: [
      { name: '5-Ceramide Multi-Lipid Complex (EOP, NS, NP, AS, AP)', percentage: '3.5%', purpose: 'Restores the stratum corneum barrier to lock in hydration' },
      { name: 'Madagascar Centella Asiatica & Madecassoside', percentage: '65%', purpose: 'Rapidly extinguishes redness, burning sensations, and itching' },
      { name: 'Panthenol (Pro-Vitamin B5)', percentage: '2.0%', purpose: 'Accelerates skin tissue regeneration' }
    ],
    fullIngredients: 'Centella Asiatica Extract (65%), Water, Glycerin, Dipropylene Glycol, Panthenol, Ceramide NP, Ceramide NS, Ceramide AP, Ceramide AS, Ceramide EOP, Cholesterol, Hydrogenated Lecithin, Allantoin, Betaine, Sodium Hyaluronate, Hydroxyethylcellulose, Disodium EDTA.',
    description: 'An emergency repair serum engineered to fortify broken skin barriers. Packed with 5 bio-identical ceramides and high-concentration Centella, it calms flared skin, heals AC-induced dehydration, and repels environmental stressors.',
    benefits: [
      'Clinically soothes visible redness in as little as 15 minutes',
      'Strengthens compromised skin barriers from harsh actives or sun exposure',
      'Ultra-clean milky serum texture that absorbs without stickiness'
    ],
    usageHowTo: 'Dispense 1 full dropper onto fingertips and press gently into face and neck morning and night before heavier moisturizers.'
  },
  {
    id: 'camellia-tinted-lip-treatment-oil',
    title: 'Tsubaki Camellia Tinted Lip Treatment Oil',
    subtitle: 'Nourishing Glass Shine Treatment with Sheer Tokyo Tint',
    price: 990,
    originalPrice: 1200,
    rating: 4.86,
    reviewsCount: 142,
    category: 'Lips',
    skinTypes: ['All', 'Dry', 'Sensitive'],
    skinConcerns: ['Hydration'],
    routine: 'AM/PM',
    volume: '6ml',
    badges: ['Mirror Glass Shine', 'Non-Sticky', 'Peptide Plump'],
    image: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#DB2777',
    bgGradient: 'from-pink-50 to-fuchsia-100',
    isBestSeller: false,
    isNew: true,
    stock: 75,
    shades: [
      { id: 'lip-oil-01', name: 'Berry Glaze', hex: '#BE185D', sku: 'LIP-OIL-01' },
      { id: 'lip-oil-02', name: 'Sakura Sparkle', hex: '#F472B6', sku: 'LIP-OIL-02' },
      { id: 'lip-oil-03', name: 'Honey Nectar', hex: '#F59E0B', sku: 'LIP-OIL-03' }
    ],
    keyActives: [
      { name: 'Oshima Tsubaki Camellia Oil', purpose: 'Imparts intense moisture and protective fatty acids' },
      { name: 'Palmitoyl Tripeptide-38', purpose: 'Stimulates hyaluronic acid synthesis for naturally plump lips' }
    ],
    fullIngredients: 'Polybutene, Diisostearyl Malate, Hydrogenated Polyisobutene, Camellia Japonica Seed Oil, Simmondsia Chinensis (Jojoba) Seed Oil, Palmitoyl Tripeptide-38, Tocopheryl Acetate, CI 45410, CI 77891, CI 15850, Flavor.',
    description: 'A hybrid lip treatment and high-shine gloss that bathes lips in nutrient-rich botanical oils. Provides an addictive cushiony slip with zero stickiness and an juicy glass finish.',
    benefits: [
      'Gives intense high-gloss shine with deep overnight-quality hydration',
      'Non-sticky cushion applicator glides effortlessly over lipstick or bare lips',
      'Protects lips against peeling in dry weather'
    ],
    usageHowTo: 'Swipe over bare lips for an everyday glazed glow, or layer over your favorite Velvet Petal Lipstick for a 3D vinyl sheen.'
  },
  {
    id: 'rice-water-essence-mist',
    title: 'Fermented Rice Water Glass Skin Essence Mist',
    subtitle: 'Micro-Fine Refreshing Hydration Veil with Galactomyces',
    price: 1190,
    originalPrice: 1399,
    rating: 4.89,
    reviewsCount: 168,
    category: 'Skincare',
    skinTypes: ['All', 'Oily', 'Combination', 'Dry', 'Sensitive'],
    skinConcerns: ['Glow & Dullness', 'Hydration', 'Redness Relief'],
    routine: 'AM/PM',
    volume: '150ml',
    badges: ['Galactomyces 85%', 'Micro-Mist Pump', 'Instant Refresh'],
    image: 'https://images.unsplash.com/photo-1608248597249-c976906e6188?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#6366F1',
    bgGradient: 'from-indigo-50 to-blue-100',
    isBestSeller: false,
    isNew: true,
    stock: 50,
    keyActives: [
      { name: 'Galactomyces Ferment Filtrate', percentage: '85%', purpose: 'Enhances skin tone clarity and refines coarse pore texture' },
      { name: 'Japanese Green Tea Extract', purpose: 'Protects skin against urban pollution and free radicals' }
    ],
    fullIngredients: 'Galactomyces Ferment Filtrate, Butylene Glycol, Camellia Sinensis (Green Tea) Leaf Extract, Betaine, 1,2-Hexanediol, Sodium Hyaluronate, Allantoin, Disodium EDTA.',
    description: 'A cloud-like facial mist engineered with a specialized Japanese micro-nozzle. Delivers microscopic droplets of fermented rice essence to instantly quench dry skin, set makeup, and revitalize dullness throughout the day.',
    benefits: [
      'Ultra-fine atomizer releases a continuous featherlight cloud without large water drops',
      'Hydrates over or under makeup without causing foundation to break or slide',
      'Delivers an instant dewy glass-skin glow on demand'
    ],
    usageHowTo: 'Hold bottle 20 cm from face, close eyes, and mist evenly in circular motion. Use anytime skin feels dry or needs a radiant midday boost.'
  },
  {
    id: 'keana-rice-mask-10',
    title: 'Keana Nadeshiko Rice Mask (10 Sheets)',
    subtitle: '100% Japanese Domestic Rice Serum for Pore Tightening',
    price: 920,
    originalPrice: 1150,
    rating: 4.95,
    reviewsCount: 384,
    category: 'Face Mask',
    skinTypes: ['All', 'Dry', 'Combination', 'Normal'],
    skinConcerns: ['Hydration', 'Blemishes & Texture', 'Glow & Dullness'],
    routine: 'AM/PM',
    volume: '10 Sheets',
    badges: ['10th Anniversary', '100% Domestic Rice', '#1 Cosme Pore Mask', 'Thick Sheet'],
    image: '/products/keana-rice-mask.png',
    secondaryImage: 'https://japaneseselect.com/cdn/shop/files/20260225215051_373_159_730a1913-2e7f-4351-a48d-59d9e338080e.png',
    accentColor: '#D97706',
    bgGradient: 'from-amber-50 to-orange-100',
    isBestSeller: true,
    isNew: true,
    stock: 65,
    keyActives: [
      { name: '100% Japanese Rice Ferment Filtrate', purpose: 'Deeply quenches dehydrated pores and restores skin suppleness' },
      { name: 'Pure Rice Bran Oil', purpose: 'Rich in natural Vitamin E and ceramides to replenish smooth lipid bounce' },
      { name: 'Rice Sphingolipids (Rice Ceramides)', purpose: 'Fortifies the delicate moisture barrier against roughness' },
      { name: 'Hydrolyzed Rice Bran Extract', purpose: 'Refines uneven texture and leaves pores visibly tightened' }
    ],
    fullIngredients: 'Water, Glycerin, Propylene Glycol, Alcohol, Styrene/VP Copolymer, Rice Ferment Filtrate (Sake), Oryza Sativa (Rice) Bran Oil, Sphingoglycolipids (Rice Ceramide), Rice Bran Extract, Hydrolyzed Rice Bran Extract, PEG-60 Hydrogenated Castor Oil, Xanthan Gum, Polysorbate 80, Citric Acid, Sodium Citrate, Phenoxyethanol, Methylparaben.',
    description: 'The award-winning 10th Anniversary edition of Japan’s most famous pore-care sheet mask. Saturated with pure serum derived 100% from Japanese domestically grown rice. Plumps dry, sunken pores and refines coarse skin texture so your bare face feels as soft, moist, and smooth as freshly steamed rice.',
    benefits: [
      'Formulated with 4 types of 100% Japanese rice-derived botanical serums',
      'Plumps and tightens dry, enlarged "strawberry" pores',
      'Ultra-thick, Japanese-made cotton mask sheet conforms closely to facial contours',
      'Leaves skin dewy, supple, and velvety smooth without stickiness'
    ],
    usageHowTo: 'Can be used daily or whenever pores feel dry and rough. After cleansing, unfold the mask and align with eyes and mouth. Leave on for 5 to 10 minutes. Remove and gently press remaining essence into skin with palms.'
  },
  {
    id: 'capsule-serum-vitamin-c',
    title: 'Capsule Serum Vitamin C',
    subtitle: 'Enriched by Fresh Micro-Capsules for Pore & Radiance Renewal',
    price: 1580,
    originalPrice: 1890,
    rating: 4.93,
    reviewsCount: 247,
    category: 'Serum',
    skinTypes: ['All', 'Oily', 'Combination', 'Normal', 'Sensitive'],
    skinConcerns: ['Glow & Dullness', 'Blemishes & Texture', 'Hydration'],
    routine: 'AM/PM',
    volume: '30ml',
    badges: ['Fresh Micro-Capsules', 'Dual Vitamin C', 'Instant Burst Delivery', 'Tokyo Favorite'],
    image: '/products/capsule-serum-vitamin-c.jpg',
    secondaryImage: 'https://d2w53g1q050m78.cloudfront.net/shopcapsuleserum/uploads/top/serum_category_pc.jpg',
    accentColor: '#EAB308',
    bgGradient: 'from-amber-50 to-yellow-100',
    isBestSeller: true,
    isNew: true,
    stock: 52,
    keyActives: [
      { name: 'Fresh Micro-Encapsulated Raw Vitamin C', purpose: 'Preserved inside golden beads, bursts on pump contact for maximum antioxidant freshness' },
      { name: 'High-Penetration 5x Vitamin C Derivatives', percentage: '4.5%', purpose: 'Targets stubborn dark spots, revives dullness, and tightens sagging pores' },
      { name: 'Niacinamide & Centella Asiatica (CICA)', purpose: 'Soothes inflammation, reduces redness, and clarifies skin tone' },
      { name: 'Triple Ceramide & Hyaluronic Acid Matrix', purpose: 'Infuses continuous moisture into the dermal barrier' }
    ],
    fullIngredients: 'Water, Butylene Glycol, Glycerin, Dipropylene Glycol, Ascorbic Acid (Pure Vitamin C), 3-O-Ethyl Ascorbic Acid, Ascorbyl Glucoside, Tetrahexyldecyl Ascorbate, Ascorbyl Tetraisopalmitate, Niacinamide, Centella Asiatica Extract, Ceramide NP, Ceramide AP, Ceramide EOP, Sodium Hyaluronate, Hydrolyzed Collagen, Fullerene, Agar, Algin, Xanthan Gum, Carbomer, Citric Acid, Phenoxyethanol.',
    description: 'The viral Japanese innovation in high-potency Vitamin C skincare. Delicate raw Vitamin C is suspended in freshly sealed micro-capsules within a soothing hydration matrix. Each pump freshly crushes the capsules, delivering pure, unoxidized brightening power directly to your skin to visibly tighten pores and awaken luminosity.',
    benefits: [
      'Innovative fresh-capsule technology prevents Vitamin C oxidation and degradation',
      'Dual-action pure Vitamin C plus multi-penetration stable Vitamin C derivatives',
      'Visibly refines rough texture, fades post-acne marks, and tightens open pores',
      'Lightweight, non-sticky gel serum texture absorbs instantly'
    ],
    usageHowTo: 'After cleansing and toning, dispense 1 to 2 pumps into palms. Gently smooth and press across face, allowing the fresh micro-capsules to dissolve into the skin. Follow with your favorite moisturizer or sunscreen.'
  },
  {
    id: 'quality-1st-derma-laser-super-retinol-100',
    title: 'Quality 1st Derma Laser Super Retinol 100',
    subtitle: 'Night Intensive Anti-Aging Mask with Laser Delivery Nanocapsules',
    price: 1180,
    originalPrice: 1450,
    rating: 4.98,
    reviewsCount: 412,
    category: 'Face Mask',
    skinTypes: ['All', 'Dry', 'Combination', 'Normal'],
    skinConcerns: ['Anti-Aging', 'Blemishes & Texture', 'Hydration', 'Barrier Repair'],
    routine: 'PM',
    volume: '7 Sheets',
    badges: ['@cosme 50 Awards Winner', 'Super Retinol 100', 'Super Delivery 3-Min', 'Night Intensive'],
    image: '/products/derma-laser-retinol.png',
    secondaryImage: 'https://atbeauty.shop/cdn/shop/files/Quality1StDermaLaserSuperRetinol100Mask7Pcs.png',
    accentColor: '#DC2626',
    bgGradient: 'from-red-50 to-rose-100',
    isBestSeller: true,
    isNew: true,
    stock: 44,
    keyActives: [
      { name: 'Stabilized Hydrogenated Retinol', percentage: '1.0%', purpose: 'Accelerates cellular turnover, firms sagging areas, and smooths wrinkles' },
      { name: 'Laser Delivery Nanocapsules', purpose: 'Penetrates deeply and rapidly into stratum corneum within just 3 minutes' },
      { name: 'Niacinamide & Ceramide NP', purpose: 'Fortifies dermal elasticity, cushions barrier, and prevents retinoid dryness' },
      { name: 'High-Density Non-Woven Adhesion Sheet', purpose: 'Locks in 70ml of rich youth-restoring essence against the facial contours' }
    ],
    fullIngredients: 'Water, DPG, Glycerin, Niacinamide, Hydrogenated Retinol, Ceramide NP, Squalane, Dipotassium Glycyrrhizate, Hydrogenated Lecithin, Glycine Soja (Soybean) Sterols, Lavandula Angustifolia (Lavender) Oil, Citrus Limon Peel Oil, Citrus Aurantifolia Oil, Cymbopogon Schoenanthus Oil, PEG-60 Hydrogenated Castor Oil, Xanthan Gum, Ethylhexylglycerin, Potassium Hydroxide, Citric Acid, Sodium Citrate.',
    description: 'Winner of over 50 Best Cosme awards in Japan. The Derma Laser Super Retinol 100 uses medical-inspired laser delivery technology to transport concentrated hydrogenated retinol nano-capsules deep into the skin in just 3 minutes. Ideal as a PM intensive age-defying treatment to restore bounce, blur lines, and impart a firm glass-skin elasticity.',
    benefits: [
      'Advanced laser delivery system provides concentrated results in only 3 minutes',
      'Clinically formulated with stabilized hydrogenated retinol and ceramide nano-capsules',
      'Firms slackening skin and smooths expression lines overnight',
      'Free from alcohol, artificial fragrances, synthetic colorants, and mineral oils'
    ],
    usageHowTo: 'Use at night after cleansing. Take out one sheet and place it firmly over the face, smoothing out air bubbles. Leave on for 3 minutes (up to 5 minutes for extra dry skin), then remove and fold the sheet to gently wipe remaining essence across the neck and décolleté.'
  }
];

export const CATEGORIES: { id: string; name: string; count: number; desc: string }[] = [
  { id: 'All', name: 'All Products', count: 14, desc: 'Complete boutique Japanese beauty & cosmetics collection' },
  { id: 'Lips', name: 'Lips', count: 2, desc: 'Velvet matte lipsticks & nourishing camellia lip oils' },
  { id: 'Face', name: 'Face', count: 2, desc: 'Luminous serum foundation & soufflé cream blushes' },
  { id: 'Serum', name: 'Serums & Oils', count: 3, desc: 'Fresh capsule vitamin C, gold radiance & barrier rescue serums' },
  { id: 'Sunscreen', name: 'Sunscreen', count: 1, desc: 'Water-light daily SPF 50+ sunscreen' },
  { id: 'Face Wash', name: 'Face Wash', count: 1, desc: 'Gentle micro-dense whipped cleansing foam' },
  { id: 'Face Mask', name: 'Face Mask', count: 3, desc: 'Keana rice mask, Derma Laser retinol & royal jelly mask' },
  { id: 'Toner', name: 'Toner', count: 1, desc: 'Brightening vitamin C essence toner' }
];

export const PROMO_CODES: Record<string, { discountPercent: number; desc: string; minAmount: number }> = {
  'GLOW15': { discountPercent: 15, desc: '15% Off Your Japanese Skincare Order', minAmount: 800 },
  'FIRSTLUXE': { discountPercent: 20, desc: '20% Off Welcome Discount for First-Time Orders', minAmount: 1200 },
  'KONICHIWA10': { discountPercent: 10, desc: '10% Off Konichiwa_Mart Order', minAmount: 500 }
};

