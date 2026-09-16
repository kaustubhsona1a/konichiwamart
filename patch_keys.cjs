const fs = require('fs');

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(/let key_id = \(process\.env\.RAZORPAY_KEY_ID \|\| ''\)\.trim\(\);/g, "let key_id = (process.env.RAZORPAY_KEY_ID || '').replace(/['\\\"\\s]/g, '').trim();");
  content = content.replace(/let key_secret = \(process\.env\.RAZORPAY_KEY_SECRET \|\| ''\)\.trim\(\);/g, "let key_secret = (process.env.RAZORPAY_KEY_SECRET || '').replace(/['\\\"\\s]/g, '').trim();");
  content = content.replace(/const key_id = \(process\.env\.RAZORPAY_KEY_ID \|\| ''\)\.trim\(\);/g, "const key_id = (process.env.RAZORPAY_KEY_ID || '').replace(/['\\\"\\s]/g, '').trim();");
  content = content.replace(/const key_secret = \(process\.env\.RAZORPAY_KEY_SECRET \|\| ''\)\.trim\(\);/g, "const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').replace(/['\\\"\\s]/g, '').trim();");
  fs.writeFileSync(filename, content);
}

patchFile('server.ts');
patchFile('src/lib/orderService.ts');
