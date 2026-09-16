const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

const target = `      if (validatedServerOrder.razorpayOrderId && validatedServerOrder.razorpayOrderId.startsWith('order_simulated_')) {
          console.warn('Backend rejected Razorpay keys (fallback to simulation).');
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          return handleSimulatePayment();
      }`;

const replacement = `      if (validatedServerOrder.razorpayOrderId && validatedServerOrder.razorpayOrderId.startsWith('order_simulated_')) {
          console.warn('Backend rejected Razorpay keys (fallback to simulation).');
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          setPaymentError('Razorpay API Rejected your keys! Ensure your Razorpay Key ID and Secret are correct and active in your environment variables.');
          return;
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/RazorpayModal.tsx', content);
