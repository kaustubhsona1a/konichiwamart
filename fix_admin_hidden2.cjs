const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

// The main loop of reels list is wrapped in a <div className="hidden">. We need to un-hide it!
code = code.replace(/<div className="hidden"><div className="space-y-4">/, '<div className="space-y-4">');

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
console.log('Fixed hidden reels list in ReelsManager.');
