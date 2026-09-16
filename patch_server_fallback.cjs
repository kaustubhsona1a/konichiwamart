const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  `  res.json({ 
    key_id: keyId, 
    isConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
    false
  });`,
  `  res.json({ 
    key_id: keyId, 
    isConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
    isSandboxFallback: false
  });`
);
fs.writeFileSync('server.ts', content);
