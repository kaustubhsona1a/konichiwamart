const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

if (!code.includes('onDeleteOrder?:')) {
  code = code.replace(
    /onUpdateOrderStatus: \(orderId: string, status: Order\['status'\]\) => void;/,
    "onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;\n  onDeleteOrder?: (orderId: string) => void;\n  onModifyOrder?: (orderId: string, updates: Partial<Order>) => void;"
  );
  
  code = code.replace(
    /onUpdateOrderStatus,\n\s+onViewInvoice,/,
    "onUpdateOrderStatus,\n  onDeleteOrder,\n  onModifyOrder,\n  onViewInvoice,"
  );
  
  fs.writeFileSync('src/components/AdminPortal.tsx', code);
  console.log("Patched props!");
} else {
  console.log("Already patched.");
}
