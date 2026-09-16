const fs = require('fs');

let rzpContent = fs.readFileSync('src/lib/razorpay.ts', 'utf8');
rzpContent = rzpContent.replace(/return 'rzp_live_Tcn0IIOcwCPgU3';/g, "return import.meta.env.VITE_RAZORPAY_KEY_ID || '';");
rzpContent = rzpContent.replace(/const k = data\?\.key_id \|\| 'rzp_live_Tcn0IIOcwCPgU3';/g, "const k = data?.key_id || '';");
rzpContent = rzpContent.replace(/return \{ isConfigured: false, keyId: 'rzp_live_Tcn0IIOcwCPgU3' \};/g, "return { isConfigured: false, keyId: '' };");
fs.writeFileSync('src/lib/razorpay.ts', rzpContent);

let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(/'rzp_live_Tcn0IIOcwCPgU3'/g, "''");
serverContent = serverContent.replace(/'WjsuQXaoCGqxMo0HKTzc7tCI'/g, "''");
fs.writeFileSync('server.ts', serverContent);
