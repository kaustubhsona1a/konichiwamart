const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

code = code.replace(
  '  return (\n    <div className="space-y-6 max-w-5xl">\n      \n      {/* SECTION HEADER */}\n      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-5">\n        <div>',
  '  return (\n    <div className="space-y-6 max-w-5xl">\n      \n      {/* SECTION HEADER */}\n      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-5">\n        <div>'
);
// Above did nothing, let's fix the missing closing div at the end by adding one.
code = code.replace(
  '  );\n};\n',
  '    </div>\n    </div>\n  );\n};\n'
);

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
