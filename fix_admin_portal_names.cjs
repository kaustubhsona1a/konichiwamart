const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// We need to add onDeleteOrder and onModifyOrder to the component destructured props since we added them to the interface but not the function arguments
admin = admin.replace(
  '  onUpdateOrderStatus,\n  onViewInvoice,',
  '  onUpdateOrderStatus,\n  onDeleteOrder,\n  onModifyOrder,\n  onViewInvoice,'
);

// We need to make sure Edit3 is imported from lucide-react
if (!admin.includes('Edit3')) {
  admin = admin.replace(
    /import \{([^{}]*)\} from 'lucide-react';/,
    "import { $1, Edit3 } from 'lucide-react';"
  );
}

fs.writeFileSync('src/components/AdminPortal.tsx', admin);

console.log("Fixed AdminPortal destructured props and imports");
