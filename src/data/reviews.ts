import { Review } from '../types';

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

/**
 * Calculates a dynamic, human-friendly timeline string that updates automatically every single day
 * (e.g., "Just now", "25 mins ago", "3 hours ago", "1 day ago", "2 days ago", "1 week ago", "2 weeks ago", "1 month ago").
 * 
 * Works with numeric timestamp (epoch ms), ISO date string (createdAt), or relative date.
 */
export function formatReviewTime(review: Review | { date?: string; timestamp?: number; createdAt?: string }): string {
  if (!review) return 'Recently';

  const now = Date.now();
  let timeMs: number | null = null;

  // 1. Try explicit numeric timestamp
  if (typeof review.timestamp === 'number' && !isNaN(review.timestamp) && review.timestamp > 0) {
    timeMs = review.timestamp;
  }
  
  // 2. Try ISO string (createdAt)
  if (timeMs === null && review.createdAt) {
    const parsed = Date.parse(review.createdAt);
    if (!isNaN(parsed) && parsed > 0) {
      timeMs = parsed;
    }
  }

  // 3. Fallback: parse from relative date string if present
  if (timeMs === null && review.date) {
    const raw = review.date.trim().toLowerCase();
    if (raw.includes('just now') || raw.includes('today')) {
      return 'Just now';
    }
    const daysMatch = raw.match(/(\d+)\s*days?\s*ago/);
    const hoursMatch = raw.match(/(\d+)\s*hours?\s*ago/);
    const weeksMatch = raw.match(/(\d+)\s*weeks?\s*ago/);
    const monthsMatch = raw.match(/(\d+)\s*months?\s*ago/);

    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      timeMs = now - days * ONE_DAY;
    } else if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      timeMs = now - hours * ONE_HOUR;
    } else if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1], 10);
      timeMs = now - weeks * 7 * ONE_DAY;
    } else if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10);
      timeMs = now - months * 30 * ONE_DAY;
    } else {
      const parsed = Date.parse(review.date);
      if (!isNaN(parsed) && parsed > 0) {
        timeMs = parsed;
      }
    }
  }

  if (!timeMs) return review.date || 'Recently';

  const diffMs = Math.max(0, now - timeMs);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay === 1) return '1 day ago';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 14) return '1 week ago';
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
  if (diffDay < 60) return '1 month ago';
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} months ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) === 1 ? '' : 's'} ago`;
}

// Seed reviews initialized with fixed past dates so their relative timeline advances automatically every single day
export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Priya Sharma',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    createdAt: '2026-09-28T14:30:00.000Z',
    timestamp: Date.parse('2026-09-28T14:30:00.000Z'),
    date: '2 days ago',
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
    createdAt: '2026-09-26T11:15:00.000Z',
    timestamp: Date.parse('2026-09-26T11:15:00.000Z'),
    date: '4 days ago',
    verified: true,
    productId: 'keana-rice-mask',
    productName: 'Keana Nadeshiko Rice Mask',
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
    createdAt: '2026-09-24T18:45:00.000Z',
    timestamp: Date.parse('2026-09-24T18:45:00.000Z'),
    date: '6 days ago',
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
    createdAt: '2026-09-21T09:20:00.000Z',
    timestamp: Date.parse('2026-09-21T09:20:00.000Z'),
    date: '1 week ago',
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
    createdAt: '2026-09-17T16:00:00.000Z',
    timestamp: Date.parse('2026-09-17T16:00:00.000Z'),
    date: '2 weeks ago',
    verified: true,
    productId: 'fino-premium-touch-mask',
    productName: 'Fino Premium Touch Hair Mask',
    skinType: 'Dry & Dehydrated',
    headline: 'Glass skin softness & salon shine in just 10 minutes',
    comment: 'Used this after a long week in dry AC air. The Royal Jelly extract makes your hair and skin feel like velvet! It deeply hydrates without causing any weighted residue. Authentic Japanese import.',
    helpfulCount: 21
  },
  {
    id: 'rev-6',
    author: 'Devika Nair',
    location: 'Kochi, Kerala',
    rating: 5,
    createdAt: '2026-09-29T10:00:00.000Z',
    timestamp: Date.parse('2026-09-29T10:00:00.000Z'),
    date: '1 day ago',
    verified: true,
    productId: 'capsule-serum-vitamin-c',
    productName: 'Premium Capsule Serum Vitamin C',
    skinType: 'Sensitive / Dullness',
    headline: 'The fresh micro-capsules work like magic',
    comment: 'You can actually see and feel the micro-capsules dissolving as you massage it onto your face. My skin looks noticeably brighter and even-toned within a week. No tingling or irritation on sensitive skin!',
    helpfulCount: 18
  },
  {
    id: 'rev-7',
    author: 'Meera Chawla',
    location: 'Chandigarh',
    rating: 5,
    createdAt: '2026-09-27T12:00:00.000Z',
    timestamp: Date.parse('2026-09-27T12:00:00.000Z'),
    date: '3 days ago',
    verified: true,
    productId: 'biore-kids-sunscreen',
    productName: 'Biore Kids Sunscreen',
    skinType: 'Ultra-Sensitive / Child-Safe',
    headline: 'Gentle, zero eye stinging for daily school runs',
    comment: 'Mineral UV barrier formulated without alcohol or fragrance. Glides on smoothly and washes off easily with regular soap. Perfect for humid Indian climates and delicate skin.',
    helpfulCount: 15
  }
];
