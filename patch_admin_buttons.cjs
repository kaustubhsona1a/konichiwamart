const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// For mobile
code = code.replace(
  'o.items.length > 1 ? \'s\' : \'\'}</span>\n                            </button>',
  `o.items.length > 1 ? 's' : ''}</span>\n                            </button>
                            <button
                              onClick={() => {
                                const newName = prompt('Enter new customer name', o.customerName);
                                if (newName) {
                                  onModifyOrder?.(o.id, { customerName: newName });
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this order?')) onDeleteOrder?.(o.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold"
                            >
                              Delete
                            </button>`
);

// For desktop
code = code.replace(
  '<button\n                                  onClick={() => onViewInvoice(o)}',
  `<button
                                  onClick={() => {
                                    const newName = prompt('Enter new customer name:', o.customerName);
                                    if (newName) {
                                      onModifyOrder?.(o.id, { customerName: newName });
                                    }
                                  }}
                                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
                                  title="Edit Order"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this order?')) onDeleteOrder?.(o.id);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center transition-colors shadow-xs"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onViewInvoice(o)}`
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Patched buttons!");
