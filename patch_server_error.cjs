const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `    } catch (rzpErr: any) {
      console.error('Razorpay API Error in /api/create-order:', rzpErr);
      return res.status(200).json({
        order_id: 'order_simulated_fallback_' + Date.now(),
        amount: parsedAmount,
        currency
      });
    }`;

const replacement = `    } catch (rzpErr: any) {
      console.error('Razorpay API Error in /api/create-order:', rzpErr);
      return res.status(400).json({
        error: rzpErr?.error?.description || rzpErr?.message || 'Razorpay order creation failed.'
      });
    }`;

content = content.replace(target, replacement);
fs.writeFileSync('server.ts', content);
