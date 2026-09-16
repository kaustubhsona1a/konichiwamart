const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

content = content.replace(/Razorpay Notice: Authentication failed with your Razorpay Key ID & Secret\. You can complete this order right away with "Test Mode Checkout" below\./g, 
  "Razorpay Notice: Authentication failed. Your Razorpay Key ID & Secret were rejected by the Razorpay API. Please generate a fresh pair of live keys in your Razorpay dashboard and update them in your AI Studio secrets.");

content = content.replace(/Payment transaction encountered an issue\. Please try again or test in Sandbox mode\./g,
  "Payment transaction encountered an issue. Please try again.");

fs.writeFileSync('src/components/RazorpayModal.tsx', content);
