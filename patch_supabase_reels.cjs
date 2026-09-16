const fs = require('fs');

let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

if (!code.includes('export const fetchReelsFromSupabase')) {
  code += `
// --- REELS SYNCHRONIZATION ---

export const fetchReelsFromSupabase = async (): Promise<any[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('reels').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch reels from Supabase (table might not exist yet):', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
};

export const syncReelsListToSupabase = async (reels: any[]): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  try {
    // Basic upsert loop for reels
    for (const reel of reels) {
      await supabase.from('reels').upsert({
        id: reel.id,
        creator_handle: reel.creatorHandle,
        creator_name: reel.creatorName,
        creator_avatar: reel.creatorAvatar,
        location: reel.location,
        title: reel.title,
        caption: reel.caption,
        views: reel.views,
        likes: reel.likes,
        comments_count: reel.commentsCount,
        audio_track: reel.audioTrack,
        product_id: reel.productId,
        video_thumb: reel.videoThumb,
        video_url: reel.videoUrl,
        instagram_url: reel.instagramUrl,
        tags: reel.tags
      });
    }
    return true;
  } catch (err) {
    console.error('Error syncing reels:', err);
    return false;
  }
};
`;
  fs.writeFileSync('src/lib/supabase.ts', code);
  console.log('Added reels sync to supabase.ts');
}
