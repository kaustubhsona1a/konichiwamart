const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(
  /let keyId = \(process\.env\.RAZORPAY_KEY_ID \|\| ''\)\.trim\(\);/g,
  "let keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();"
);
server = server.replace(
  /let keySecret = \(\(process\.env\.RAZORPAY_KEY_SECRET \|\| process\.env\.RAZORPAY_KEY_SECRE\) \|\| ''\)\.trim\(\);/g,
  "let keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRE || process.env.RAZORPAY_SECRET_KEY || '').trim();"
);
fs.writeFileSync('server.ts', server);

let os = fs.readFileSync('src/lib/orderService.ts', 'utf8');
os = os.replace(
  /let key_id = \(process\.env\.RAZORPAY_KEY_ID \|\| ''\)\.replace\(\/\['"\\s\]\/g, ''\)\.trim\(\);/g,
  "let key_id = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').replace(/['\"\\s]/g, '').trim();"
);
os = os.replace(
  /let key_secret = \(\(process\.env\.RAZORPAY_KEY_SECRET \|\| process\.env\.RAZORPAY_KEY_SECRE\) \|\| ''\)\.replace\(\/\['"\\s\]\/g, ''\)\.trim\(\);/g,
  "let key_secret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRE || process.env.RAZORPAY_SECRET_KEY || '').replace(/['\"\\s]/g, '').trim();"
);
fs.writeFileSync('src/lib/orderService.ts', os);

console.log('Updated env variable resolution in server.ts and orderService.ts');
