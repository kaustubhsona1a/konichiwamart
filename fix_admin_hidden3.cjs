const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

// Due to unhiding by regex, there is an extra closing div at the end causing JSX syntax error.
code = code.replace(/<\/div>\n    <\/div>\n  \);\n};/, '</div>\n  );\n};');

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
console.log('Fixed extra div in ReelsManager.');
