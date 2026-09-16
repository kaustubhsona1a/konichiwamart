import { ReelItem } from '../types';

export const KONICHIWA_INSTAGRAM_URL = 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr';
export const KONICHIWA_INSTAGRAM_HANDLE = '@konichiwa_mart';

export const INITIAL_REELS: ReelItem[] = [
  {
    id: 'reel_01',
    creatorHandle: '@japan_daily_glow',
    creatorName: 'Hana Tanaka',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    location: 'Japan',
    title: 'The Viral Whipped Foam Method',
    caption: 'How to lather Senka Perfect Whip for that super-dense micro-foam pillow! ☁️ Zero friction on the skin and cleans pores so gently.',
    views: '1.8M',
    likes: 142800,
    commentsCount: 942,
    audioTrack: 'Gentle Lather ASMR - Japan Skincare',
    productId: 'senka-perfect-whip',
    videoThumb: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    instagramUrl: 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr',
    tags: ['#SenkaPerfectWhip', '#JapaneseSkincare', '#FaceWash']
  },
  {
    id: 'reel_02',
    creatorHandle: '@glow_with_ria',
    creatorName: 'Ria Sengupta',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    location: 'Mumbai',
    title: 'Dark Spot Fading with Vitamin C',
    caption: 'Testing the Rohto Melano CC Toner for 14 days. Look at the post-acne mark difference! 🍋 Active Vitamin C that actually absorbs quickly.',
    views: '2.1M',
    likes: 187400,
    commentsCount: 1120,
    audioTrack: 'Bright Morning - Acoustic Chill',
    productId: 'melano-cc-brightening-toner',
    videoThumb: 'https://images.unsplash.com/photo-1608248597359-009765369eb3?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    instagramUrl: 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr',
    tags: ['#MelanoCC', '#VitaminCToner', '#DarkSpotCare']
  },
  {
    id: 'reel_03',
    creatorHandle: '@skincare_kenji',
    creatorName: 'Kenji Sato',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    location: 'Kyoto',
    title: 'Shiseido Fino Deep Nourish',
    caption: 'Why Fino Premium Touch Mask sells out across Shibuya pharmacies. Royal jelly essence that seals intense moisture within 5 minutes.',
    views: '3.4M',
    likes: 312000,
    commentsCount: 1850,
    audioTrack: 'Japan Evening Ambient',
    productId: 'fino-premium-touch-mask',
    videoThumb: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    instagramUrl: 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr',
    tags: ['#FinoMask', '#JapaneseBeauty', '#FaceMask']
  },
  {
    id: 'reel_04',
    creatorHandle: '@delhi_skingirl',
    creatorName: 'Ananya Sharma',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    location: 'Delhi NCR',
    title: 'Zero White Cast SPF in Indian Heat',
    caption: 'Bioré UV Aqua Rich tested under harsh 42°C Delhi sun! Watery essence that melts invisible into all skin tones. No sweat streaks!',
    views: '4.2M',
    likes: 421000,
    commentsCount: 2310,
    audioTrack: 'Summer Breeze Japan Beats',
    productId: 'biore-uv-aqua-rich-sunscreen',
    videoThumb: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    instagramUrl: 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr',
    tags: ['#BioreUV', '#WateryEssence', '#NoWhiteCast']
  }
];

export const getStoredReels = (): ReelItem[] => {
  try {
    const data = localStorage.getItem('km_store_reels');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load reels from storage:', err);
  }
  return INITIAL_REELS;
};

/**
 * Saves reels to both localStorage (for fast local cache)
 * and server persistent storage (/api/reels) so all store visitors see them.
 */
export const saveStoredReels = (reels: ReelItem[]): void => {
  try {
    localStorage.setItem('km_store_reels', JSON.stringify(reels));
  } catch (err) {
    console.error('Failed to save reels to storage:', err);
  }
  
  // Asynchronously persist to backend server
  syncReelsToServer(reels).catch(err => {
    console.warn('Background sync of reels to server error:', err);
  });
};

/**
 * Fetch reels from the backend server (/api/reels), which persists across
 * all devices, sessions, and reloads. Falls back to cached local storage.
 */
export const fetchServerReels = async (): Promise<ReelItem[]> => {
  try {
    const res = await fetch('/api/reels');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.reels) && data.reels.length > 0) {
        // Cache to localStorage for instant subsequent loads
        try {
          localStorage.setItem('km_store_reels', JSON.stringify(data.reels));
        } catch {}
        return data.reels;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch reels from server endpoint, using cached reels:', err);
  }
  return getStoredReels();
};

/**
 * Persist reels to the backend server API
 */
export const syncReelsToServer = async (reels: ReelItem[]): Promise<boolean> => {
  try {
    const res = await fetch('/api/reels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reels })
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync reels to server:', err);
    return false;
  }
};

/**
 * Extracts Instagram shortcode from URLs like:
 * - https://www.instagram.com/reel/C123abc/
 * - https://instagram.com/p/C123abc/
 */
export const extractInstagramCode = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
};
