const fs = require('fs');
let content = fs.readFileSync('src/components/RazorpayModal.tsx', 'utf8');

const target = `      const validatedServerOrder = await createValidatedCheckoutOrder({
        items: items.map(i => ({
          productId: i.product.id,
          variantId: i.selectedShade?.id,
          quantity: i.quantity,
          title: i.product.title,
          price: i.product.price,
          image: i.product.image
        })),
        customer: {
          fullName: (fullName || 'Valued Customer').trim(),
          email: email.trim(),
          phone: phone.replace(/\\D/g, '').slice(-10)
        },
        shippingAddress: {
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country: 'India'
        },
        discountCode: discountCode || undefined
      });

      if (!validatedServerOrder || !validatedServerOrder.orderNumber) {
        throw new Error("Server failed to generate a valid order response.");
      }

      setStatusMessage('Order verified! Initiating secure Razorpay checkout...');`;

const replacement = `      const validatedServerOrder = await createValidatedCheckoutOrder({
        items: items.map(i => ({
          productId: i.product.id,
          variantId: i.selectedShade?.id,
          quantity: i.quantity,
          title: i.product.title,
          price: i.product.price,
          image: i.product.image
        })),
        customer: {
          fullName: (fullName || 'Valued Customer').trim(),
          email: email.trim(),
          phone: phone.replace(/\\D/g, '').slice(-10)
        },
        shippingAddress: {
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country: 'India'
        },
        discountCode: discountCode || undefined
      });

      if (!validatedServerOrder || !validatedServerOrder.orderNumber) {
        throw new Error("Server failed to generate a valid order response.");
      }

      if (validatedServerOrder.razorpayOrderId && validatedServerOrder.razorpayOrderId.startsWith('order_simulated_')) {
          console.warn('Backend rejected Razorpay keys (fallback to simulation).');
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          return handleSimulatePayment();
      }

      setStatusMessage('Order verified! Initiating secure Razorpay checkout...');`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/RazorpayModal.tsx', content);
