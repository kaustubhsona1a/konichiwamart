const fs = require('fs');
let code = fs.readFileSync('src/lib/email.ts', 'utf8');

code = code.replace(
  'from: fromAddress,',
  "from: fromAddress,\n      reply_to: 'support@konichiwamart.com',"
);

fs.writeFileSync('src/lib/email.ts', code);
console.log("Patched email.ts");
