const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

// The Title and Tagged Product fields are wrapped in a <div className="hidden">. We need to un-hide them.
code = code.replace(/<div className="hidden">\s*<div className="space-y-1">\s*<label className="text-\[11px\] font-bold uppercase tracking-wider text-slate-700">\s*Reel Title \*/, '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n                <div className="space-y-1">\n                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">\n                    Reel Title *');

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
console.log('Fixed hidden form fields in ReelsManager.');
