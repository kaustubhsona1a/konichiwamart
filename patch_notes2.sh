sed -i 's/customerName: customer.fullName/customerName: customer.fullName || "Guest"/g' src/lib/orderService.ts
sed -i 's/customerPhone: customer.phone/customerPhone: customer.phone || "0000000000"/g' src/lib/orderService.ts
