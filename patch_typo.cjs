const fs = require('fs');

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(/process\.env\.RAZORPAY_KEY_SECRET/g, "(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRE)");
  fs.writeFileSync(filename, content);
}

patchFile('server.ts');
patchFile('src/lib/orderService.ts');
