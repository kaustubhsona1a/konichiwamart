const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(/isConfigured: Boolean\(process\.env\.RAZORPAY_KEY_ID\),/g, "isConfigured: true,");
fs.writeFileSync('server.ts', serverContent);
