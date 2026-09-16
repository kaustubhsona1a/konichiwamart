import { Review } from '../types';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Priya Sharma',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    date: '1 day ago',
    verified: true,
    productId: 'biore-uv-aqua-rich-sunscreen',
    productName: 'Bioré UV Aqua Rich Watery Essence',
    skinType: 'Oily / Humid Climate',
    headline: 'Zero white cast in Mumbai humidity!',
    comment: 'I was skeptical about ordering authentic Japanese sunscreen online, but Konichiwa_Mart delivered the authentic Japan batch with Japanese seals! The watery texture sinks in within 10 seconds. No sweating, zero white cast on my warm Indian skin tone, and layers flawlessly under makeup.',
    helpfulCount: 42
  },
  {
    id: 'rev-2',
    author: 'Tanvi Agarwal',
    location: 'Hyderabad, Telangana',
    rating: 5,
    date: '2 days ago',
    verified: true,
    productId: 'keana-rice-mask-10',
    productName: 'Keana Nadeshiko Rice Mask (10 Sheets)',
    skinType: 'Combination / Textured Skin',
    headline: 'Shrinks enlarged pores like nothing else!',
    comment: 'The 100% Japanese domestic rice extract is pure magic for rough, uneven texture around my nose and cheeks. After just 5 minutes, my pores look plumped and invisible. The sheet is delightfully thick and soaked in milky essence!',
    helpfulCount: 31
  },
  {
    id: 'rev-3',
    author: 'Ananya Mukherjee',
    location: 'Bengaluru, Karnataka',
    rating: 5,
    date: '3 days ago',
    verified: true,
    productId: 'melano-cc-brightening-toner',
    productName: 'Rohto Melano CC Vitamin C Toner',
    skinType: 'Combination / Acne-Prone',
    headline: 'Faded stubborn acne marks in 3 weeks',
    comment: 'Melano CC is legendary for a reason. Unlike other unstable vitamin C serums that oxidize, this lotion toner stays fresh. It calmed my post-breakout redness and evened out dullness. Smells like fresh yuzu citrus. Shipped fast with safe bubble packaging.',
    helpfulCount: 29
  },
  {
    id: 'rev-4',
    author: 'Rohan Kulkarni',
    location: 'Pune, Maharashtra',
    rating: 5,
    date: '4 days ago',
    verified: true,
    productId: 'senka-perfect-whip',
    productName: 'Senka Perfect Whip Face Wash',
    skinType: 'Normal / Daily Shave',
    headline: 'The densest micro-foam I have ever used',
    comment: 'A tiny pea-sized drop whips up into a thick cloud of foam with just a little warm water. It removes pollution and sunscreen without leaving that tight, squeaky feeling. Authentic Japanese formula—will definitely keep repurchasing.',
    helpfulCount: 25
  },
  {
    id: 'rev-5',
    author: 'Sneha Deshmukh',
    location: 'Delhi NCR',
    rating: 5,
    date: '5 days ago',
    verified: true,
    productId: 'fino-premium-touch-mask',
    productName: 'Fino Premium Touch Hair Mask',
    skinType: 'Dry & Dehydrated',
    headline: 'Glass skin softness & salon shine in just 10 minutes',
    comment: 'Used this after a long week in dry AC air. The Royal Jelly extract makes your hair and skin feel like velvet! It deeply hydrates without causing any weighted residue. Authentic Japanese import.',
    helpfulCount: 21
  }
];
