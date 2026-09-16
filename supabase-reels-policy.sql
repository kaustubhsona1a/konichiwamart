-- Create Community Reels Table
CREATE TABLE IF NOT EXISTS public.reels (
  id text PRIMARY KEY,
  creator_handle text NOT NULL,
  creator_name text NOT NULL,
  creator_avatar text,
  location text,
  title text NOT NULL,
  caption text,
  views text,
  likes integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  audio_track text,
  product_id text,
  video_thumb text,
  video_url text,
  instagram_url text,
  tags text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reels
CREATE POLICY "Allow public read access on reels"
  ON public.reels
  FOR SELECT
  USING (true);

-- Allow authenticated admins to insert/update/delete
CREATE POLICY "Allow authenticated users to manage reels"
  ON public.reels
  FOR ALL
  USING (auth.role() = 'authenticated');
