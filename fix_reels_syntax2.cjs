const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

code = code.replace(
  '    </div>\n    </div>\n    </div>\n  );\n};\n',
  '    </div>\n  );\n};\n'
);

code = code.replace(
  '<div className="hidden"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">',
  '<div className="hidden">'
);

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
