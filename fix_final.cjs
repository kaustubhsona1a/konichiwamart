const fs = require('fs');

// Fix email.ts
let code = fs.readFileSync('src/lib/email.ts', 'utf8');
code = code.replace(/reply_to:/g, 'replyTo:');
fs.writeFileSync('src/lib/email.ts', code);

// Fix AdminPortal.tsx (imports and missing props)
let admin = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');
if (!admin.includes('Edit3')) {
  admin = admin.replace(
    /import \{([^{}]*)\} from 'lucide-react';/,
    "import { $1, Edit3 } from 'lucide-react';"
  );
}

// Add onDeleteOrder and onModifyOrder to props
admin = admin.replace(
  'onUpdateOrderStatus: (orderId: string, status: Order[\'status\']) => void;',
  "onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;\n  onDeleteOrder?: (orderId: string) => void;\n  onModifyOrder?: (orderId: string, updates: Partial<Order>) => void;"
);

// We need to add it to destructuring as well, but earlier patching might have failed for desktop only. Let's make sure it's there.
// If we missed adding it to destructuring:
if (!admin.includes('onDeleteOrder,')) {
    admin = admin.replace(
      'onUpdateOrderStatus,\n  onViewInvoice,',
      'onUpdateOrderStatus,\n  onDeleteOrder,\n  onModifyOrder,\n  onViewInvoice,'
    );
}

fs.writeFileSync('src/components/AdminPortal.tsx', admin);

console.log("Fixed final errors");
