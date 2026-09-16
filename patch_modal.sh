# Remove the misleading cancel button block
sed -i '/Cancel \/ Reset Button if user gets stuck/,/<\/div>/d' src/components/RazorpayModal.tsx

# Increase watchdog timer
sed -i 's/25000/45000/g' src/components/RazorpayModal.tsx
