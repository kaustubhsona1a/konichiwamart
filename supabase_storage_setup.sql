
-- Run this in your Supabase SQL Editor to create the product-images bucket

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

create policy "Admin Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' );

