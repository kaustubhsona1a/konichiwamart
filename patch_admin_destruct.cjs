const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// The replacement likely failed to find the exact string. Let's do a more robust regex replacement for the destructuring.
admin = admin.replace(
  /const AdminPortal: React.FC<AdminPortalProps> = \(\{\n([^]*?)\}\) => \{/,
  (match, p1) => {
    if (!p1.includes('onDeleteOrder')) {
      return match.replace(
        '  onUpdateOrderStatus,',
        '  onUpdateOrderStatus,\n  onDeleteOrder,\n  onModifyOrder,'
      );
    }
    return match;
  }
);

fs.writeFileSync('src/components/AdminPortal.tsx', admin);

console.log("Fixed AdminPortal destructuring");
