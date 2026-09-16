const fs = require('fs');
let content = fs.readFileSync('src/lib/razorpay.ts', 'utf8');

const target = `    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.on('payment.failed', function (response: any) {
      const errorMsg = response?.error?.description || response?.error?.reason || 'Payment transaction failed.';
      options.onError?.(errorMsg);
    });

    try {
      rzp.open();
    } catch (openErr: any) {
      options.onError?.(openErr?.message || 'Could not open Razorpay checkout window.');
      return;
    }`;

const replacement = `    try {
      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on('payment.failed', function (response: any) {
        const errorMsg = response?.error?.description || response?.error?.reason || 'Payment transaction failed.';
        options.onError?.(errorMsg);
      });
      rzp.open();
    } catch (openErr: any) {
      options.onError?.(openErr?.message || 'Could not open Razorpay checkout window. Please check if your API keys are correct.');
      return;
    }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/razorpay.ts', content);
