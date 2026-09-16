const fs = require('fs');

let code = fs.readFileSync('src/data/reels.ts', 'utf8');

const importStatement = `import { fetchReelsFromSupabase, syncReelsListToSupabase, isSupabaseConfigured } from '../lib/supabase';\n`;
if (!code.includes('import { fetchReelsFromSupabase')) {
  code = importStatement + code;
}

code = code.replace(/export const fetchServerReels = async \(\): Promise<ReelItem\[\]> => \{[\s\S]*?\};/, `export const fetchServerReels = async (): Promise<ReelItem[]> => {
  if (isSupabaseConfigured()) {
    const supabaseReels = await fetchReelsFromSupabase();
    if (supabaseReels && supabaseReels.length > 0) {
      const formatted = supabaseReels.map(r => ({
        id: r.id,
        creatorHandle: r.creator_handle,
        creatorName: r.creator_name,
        creatorAvatar: r.creator_avatar,
        location: r.location,
        title: r.title,
        caption: r.caption,
        views: r.views,
        likes: r.likes,
        commentsCount: r.comments_count,
        audioTrack: r.audio_track,
        productId: r.product_id,
        videoThumb: r.video_thumb,
        videoUrl: r.video_url,
        instagramUrl: r.instagram_url,
        tags: r.tags || []
      }));
      try { localStorage.setItem('km_store_reels', JSON.stringify(formatted)); } catch {}
      return formatted;
    }
  }

  try {
    const res = await fetch('/api/reels');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.reels) && data.reels.length > 0) {
        try { localStorage.setItem('km_store_reels', JSON.stringify(data.reels)); } catch {}
        return data.reels;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch reels from server endpoint, using cached reels:', err);
  }
  return getStoredReels();
};`);


code = code.replace(/export const syncReelsToServer = async \(reels: ReelItem\[\]\): Promise<boolean> => \{[\s\S]*?\};/, `export const syncReelsToServer = async (reels: ReelItem[]): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const success = await syncReelsListToSupabase(reels);
    if (success) {
      console.log('Reels synced to Supabase successfully');
      // We also try backend just in case
      fetch('/api/reels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reels }) }).catch(() => {});
      return true;
    }
  }

  try {
    const res = await fetch('/api/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reels })
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync reels to server:', err);
    return false;
  }
};`);

fs.writeFileSync('src/data/reels.ts', code);
console.log('Patched reels.ts for Supabase direct sync.');
