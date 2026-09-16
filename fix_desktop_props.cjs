const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

admin = admin.replace(
  '  onUpdateOrderStatus,\n  onViewInvoice,',
  '  onUpdateOrderStatus,\n  onDeleteOrder,\n  onModifyOrder,\n  onViewInvoice,'
);

fs.writeFileSync('src/components/AdminPortal.tsx', admin);
console.log("Fixed desktop props");
