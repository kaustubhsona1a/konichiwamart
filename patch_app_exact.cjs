const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');
const insertIndex = 948;
const newLines = `
  const handleDeleteOrder = (orderId: string) => {
    setStoreOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleModifyOrder = (orderId: string, updates: Partial<Order>) => {
    setStoreOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, ...updates } : o);
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };
`;

lines.splice(insertIndex, 0, ...newLines.split('\n'));
fs.writeFileSync('src/App.tsx', lines.join('\n'));
