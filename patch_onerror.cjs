const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

const target = `      await launchRazorpayCheckout({
        amountInPaise: validatedServerOrder.amount || amountInPaise,
        currency: 'INR',
        receipt: validatedServerOrder.orderNumber,
        orderId: validatedServerOrder.razorpayOrderId,
        customerName: fullName || 'Valued Customer',
        customerEmail: email.trim(),
        customerContact: phone.replace(/\\D/g, '').slice(-10),
        address: \`\${addressLine1}, \${city}, \${pincode}\`,
        preferredMethod: selectedPaymentMode === 'UPI' ? 'upi' : 'card',
        upiApp: selectedPaymentMode === 'UPI' ? selectedUpiApp : undefined,
        vpa: selectedPaymentMode === 'UPI' && userVpa.trim() ? userVpa.trim() : undefined,
        onSuccess: async (paymentPayload: RazorpayPaymentSuccessPayload, _verification: VerifyPaymentResponse) => {`;

const replacement = `      await launchRazorpayCheckout({
        amountInPaise: validatedServerOrder.amount || amountInPaise,
        currency: 'INR',
        receipt: validatedServerOrder.orderNumber,
        orderId: validatedServerOrder.razorpayOrderId,
        customerName: fullName || 'Valued Customer',
        customerEmail: email.trim(),
        customerContact: phone.replace(/\\D/g, '').slice(-10),
        address: \`\${addressLine1}, \${city}, \${pincode}\`,
        preferredMethod: selectedPaymentMode === 'UPI' ? 'upi' : 'card',
        upiApp: selectedPaymentMode === 'UPI' ? selectedUpiApp : undefined,
        vpa: selectedPaymentMode === 'UPI' && userVpa.trim() ? userVpa.trim() : undefined,
        onError: (err) => {
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          setPaymentError(err);
        },
        onDismiss: () => {
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
        },
        onSuccess: async (paymentPayload: RazorpayPaymentSuccessPayload, _verification: VerifyPaymentResponse) => {`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/RazorpayModal.tsx', content);
