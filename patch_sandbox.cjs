const fs = require('fs');
let content = fs.readFileSync('src/lib/orderService.ts', 'utf8');

content = content.replace(
  'razorpayOrderId: razorpayOrderId || `sandbox_${orderNumber}`,',
  'razorpayOrderId: razorpayOrderId || `order_simulated_${orderNumber}`, // Ensure frontend simulation interceptor catches this'
);
fs.writeFileSync('src/lib/orderService.ts', content);
