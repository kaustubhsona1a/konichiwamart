const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const handleDeleteOrder =')) {
  code = code.replace(
    /const handleUpdateOrderStatus = [\s\S]*?localStorage\.setItem\('km_customer_profile'[\s\S]*?return \{ \.\.\.prev, orders: updatedOrders \};\n    \}\);\n  };/,
    `$&
  
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
  };`
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx");
}
