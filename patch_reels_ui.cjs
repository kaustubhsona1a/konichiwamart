const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

// Hide everything except videoThumb, videoUrl, instagramUrl, and product selection.
code = code.replace(
  '<h3 className="text-sm font-bold text-slate-800">1. Video Files & Instagram Link</h3>',
  '<h3 className="text-sm font-bold text-slate-800">Link Information</h3>'
);

code = code.replace(
  '<h3 className="text-sm font-bold text-slate-800">2. Creator Details</h3>',
  '<h3 className="hidden">2. Creator Details</h3>'
);

code = code.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">[\s\S]*?creatorHandle[\s\S]*?<\/div>\s*<\/div>/g,
  '<div className="hidden">$&</div>'
);

code = code.replace(
  '<h3 className="text-sm font-bold text-slate-800">3. Reel Metadata</h3>',
  '<h3 className="hidden">3. Reel Metadata</h3>'
);

code = code.replace(
  /<div className="space-y-4">[\s\S]*?title[\s\S]*?audioTrack[\s\S]*?<\/div>/,
  '<div className="hidden">$&</div>'
);

code = code.replace(
  '<h3 className="text-sm font-bold text-slate-800">4. Engagement Stats</h3>',
  '<h3 className="hidden">4. Engagement Stats</h3>'
);

code = code.replace(
  /<div className="grid grid-cols-3 gap-4">[\s\S]*?views[\s\S]*?<\/div>/,
  '<div className="hidden">$&</div>'
);

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
console.log("Patched ReelsManager.tsx");
