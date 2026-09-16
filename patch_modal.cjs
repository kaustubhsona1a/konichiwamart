const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

const target = `  const handleStartRazorpayCheckout = async () => {
    if (amountInPaise < 100) {
      setPaymentError('Minimum order amount for Razorpay checkout is ₹1.00 (100 paise).');
      return;
    }`;
const replacement = `  const handleStartRazorpayCheckout = async () => {
    if (amountInPaise < 100) {
      setPaymentError('Minimum order amount for Razorpay checkout is ₹1.00 (100 paise).');
      return;
    }

    if (!isRazorpayConfigured) {
      return handleSimulatePayment();
    }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/RazorpayModal.tsx', content);
