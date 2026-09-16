sed -i 's/sku: item.id,/sku: item.productId,/g' src/lib/shiprocketServer.ts
sed -i "s/billing_email: order.shippingAddress?.email || 'customer@example.com'/billing_email: order.customerEmail || 'customer@example.com'/g" src/lib/shiprocketServer.ts
