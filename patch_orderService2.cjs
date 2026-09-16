const fs = require('fs');
let content = fs.readFileSync('src/lib/orderService.ts', 'utf8');

const target = `  } catch (rzpErr: any) {
    console.error('Failed to create Razorpay order in orderService (falling back to simulation):', rzpErr);
    razorpayOrderId = 'order_simulated_' + Date.now();
    isRazorpayConfigured = false;
  }`;

const replacement = `  } catch (rzpErr: any) {
    console.error('Failed to create Razorpay order in orderService:', rzpErr);
    throw new Error('Razorpay API Rejected your keys: ' + (rzpErr?.error?.description || rzpErr?.message || 'Authentication failed.'));
  }`;

content = content.replace(target, replacement);

const target2 = `    razorpayOrderId: razorpayOrderId || \`order_simulated_\${orderNumber}\`, // Ensure frontend simulation interceptor catches this`;
const replacement2 = `    razorpayOrderId: razorpayOrderId || undefined,`;
content = content.replace(target2, replacement2);

fs.writeFileSync('src/lib/orderService.ts', content);
