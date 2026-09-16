sed -i 's/quantity: i.quantity/quantity: i.quantity,\n          title: i.product.title,\n          price: i.product.price,\n          image: i.product.image/g' src/components/RazorpayModal.tsx
