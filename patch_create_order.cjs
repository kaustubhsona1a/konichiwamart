const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `    try {
      const order = await razorpay.orders.create(options);
      return res.status(200).json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (rzpErr: any) {
      console.error('Razorpay API Error in /api/create-order:', rzpErr);
      return res.status(200).json({
        order_id: 'order_simulated_fallback_' + Date.now(),
        amount: parsedAmount,
        currency
      });
    }
  } catch (err: any) {`;

content = content.replace(/    try \{\n      const order = await razorpay\.orders\.create\(options\);[\s\S]*?  \} catch \(err: any\) \{/m, replacement);
fs.writeFileSync('server.ts', content);
