const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

content = content.replace(`    if (!isRazorpayConfigured) {
      return handleSimulatePayment();
    }`, '');

content = content.replace(`      if (validatedServerOrder.razorpayOrderId && validatedServerOrder.razorpayOrderId.startsWith('order_simulated_')) {
          console.warn('Backend rejected Razorpay keys (fallback to simulation).');
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          setPaymentError('Razorpay API Rejected your keys! Ensure your Razorpay Key ID and Secret are correct and active in your environment variables.');
          return;
      }`, '');

fs.writeFileSync('src/components/RazorpayModal.tsx', content);
