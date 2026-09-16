const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

code = code.replace(
  '    </div>\n  );\n};\n',
  '    </div>\n    </div>\n    </div>\n  );\n};\n'
);

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
