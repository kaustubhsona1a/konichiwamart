const fs = require('fs');
let admin = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

admin = admin.replace(
  /import \{([^{}]*)\} from 'lucide-react';/,
  (match, p1) => {
    if (!p1.includes('Edit3')) {
      return `import { ${p1.trim()}, Edit3 } from 'lucide-react';`;
    }
    return match;
  }
);

fs.writeFileSync('src/components/AdminPortal.tsx', admin);
console.log("Fixed Edit3 import");
