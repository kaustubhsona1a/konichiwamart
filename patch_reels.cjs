const fs = require('fs');
let code = fs.readFileSync('src/data/reels.ts', 'utf8');

code = code.replace(
  /export const INITIAL_REELS: ReelItem\[\] = \[\s*\{[\s\S]*\}\s*\];/,
  'export const INITIAL_REELS: ReelItem[] = [];'
);

fs.writeFileSync('src/data/reels.ts', code);
console.log("Patched reels.ts");
