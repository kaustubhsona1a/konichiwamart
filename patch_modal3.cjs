const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

const target = "      setStatusMessage('Order verified! Initiating secure Razorpay checkout...');";
const replacement = `      if (validatedServerOrder.razorpayOrderId && validatedServerOrder.razorpayOrderId.startsWith('order_simulated_')) {
          console.warn('Backend rejected Razorpay keys (fallback to simulation).');
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          return handleSimulatePayment();
      }

      setStatusMessage('Order verified! Initiating secure Razorpay checkout...');`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/RazorpayModal.tsx', content);
