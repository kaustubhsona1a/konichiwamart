const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

admin = admin.replace(
  '  onDeleteOrder?: (orderId: string) => void;\n  onModifyOrder?: (orderId: string, updates: Partial<Order>) => void;\n  onDeleteOrder?: (orderId: string) => void;\n  onModifyOrder?: (orderId: string, updates: Partial<Order>) => void;',
  '  onDeleteOrder?: (orderId: string) => void;\n  onModifyOrder?: (orderId: string, updates: Partial<Order>) => void;'
);

fs.writeFileSync('src/components/AdminPortal.tsx', admin);

console.log("Fixed AdminPortal duplicates");
