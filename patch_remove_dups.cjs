const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

const target = `        onError: (err) => {
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          setPaymentError(err);
        },
        onDismiss: () => {
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
        },
        onSuccess: async`;

const replacement = `        onSuccess: async`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/RazorpayModal.tsx', content);
