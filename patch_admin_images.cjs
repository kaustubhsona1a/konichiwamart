const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const target = `        if (error) {
          console.error('Supabase upload error:', error);
          throw error;
        }`;

const replacement = `        if (error) {
          console.warn('Supabase storage upload error, falling back to optimized base64 encoding:', error);
          const base64 = await resizeAndOptimizeImage(file);
          processedUrls.push(base64);
          continue;
        }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/AdminPortal.tsx', content);
console.log('Updated AdminPortal.tsx for image upload fallback!');
