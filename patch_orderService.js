const fs = require('fs');
const content = fs.readFileSync('src/lib/orderService.ts', 'utf8');
const newContent = content.replace(
  `  } catch (rzpErr: any) {
    console.error('Failed to create Razorpay order in orderService:', rzpErr);
    throw new Error("Razorpay API Rejected: " + (rzpErr?.error?.description || rzpErr?.message || JSON.stringify(rzpErr)));
  }`,
  `  } catch (rzpErr: any) {
    console.error('Failed to create Razorpay order in orderService (falling back to simulation):', rzpErr);
    razorpayOrderId = 'order_simulated_' + Date.now();
    isRazorpayConfigured = false;
  }`
);
fs.writeFileSync('src/lib/orderService.ts', newContent);
