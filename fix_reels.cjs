const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

code = code.replace(/<\/div><\/div>/g, '</div>');

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
