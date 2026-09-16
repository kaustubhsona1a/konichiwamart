const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

code = code.replace(
  '<div><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-5">',
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-5">'
);

code = code.replace(
  '    </div>\n  );\n};\n',
  '    </div>\n    </div>\n  );\n};\n'
);

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
