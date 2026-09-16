sed -i 's/state: shippingAddress.state/state: shippingAddress.state || "N\/A"/g' src/lib/orderService.ts
