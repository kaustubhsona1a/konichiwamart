import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadProductImages() {
  const productsDir = path.join(process.cwd(), 'public', 'products');
  
  if (!fs.existsSync(productsDir)) {
    console.error('public/products directory not found.');
    return;
  }

  const files = fs.readdirSync(productsDir);

  for (const file of files) {
    const filePath = path.join(productsDir, file);
    if (fs.statSync(filePath).isFile()) {
      console.log(`Uploading ${file}...`);
      
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      if (ext === '.webp') contentType = 'image/webp';

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(file, fileBuffer, {
          contentType: contentType,
          upsert: true
        });

      if (error) {
        console.error(`Failed to upload ${file}:`, error.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(file);
        
        console.log(`Success! Public URL: ${publicUrlData.publicUrl}`);
      }
    }
  }
}

uploadProductImages();
