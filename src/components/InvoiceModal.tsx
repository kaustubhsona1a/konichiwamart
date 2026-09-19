import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  FileText, 
  Sparkles,
  ExternalLink,
  Mail,
  Check,
  Loader2
} from 'lucide-react';
import { Order } from '../types';
import { formatINR } from '../data/pincodes';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';
import { dispatchInvoiceEmail } from '../lib/razorpay';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder?: (order: Order) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  onTrackOrder
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    const targetEmail = order.customerEmail;
    if (!targetEmail) return;

    setIsResending(true);
    setResendStatus(null);
    try {
      await dispatchInvoiceEmail({
        email: targetEmail,
        invoiceNumber: order.invoiceNumber,
        orderNumber: order.orderNumber,
        customerName: order.shippingAddress.fullName,
        totalAmount: order.totalAmount
      });
      setResendStatus(`Tax invoice resent to ${targetEmail}`);
      setTimeout(() => setResendStatus(null), 4000);
    } catch {
      setResendStatus('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A0F15]/60 dark:bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Invoice Modal Window */}
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-[#EAC4D3] dark:border-zinc-800 overflow-hidden text-left p-6 sm:p-10 max-h-[94vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-6 border-b border-[#F0D5DF] dark:border-zinc-800 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EAF8F0] dark:bg-emerald-950/60 text-[#1B8055] dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-xs text-[#1E7E56] dark:text-emerald-400 uppercase tracking-wider block">
                Official Indian GST Tax Invoice
              </span>
              <span className="text-xs text-[#6B4B59] dark:text-zinc-400">
                Invoice #{order.invoiceNumber} • Order #{order.orderNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order.customerEmail && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResending}
                className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/60 text-pink-800 dark:text-pink-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-pink-200 dark:border-pink-800 disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : resendStatus ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-pink-500" />
                )}
                <span>{resendStatus || 'Resend to Email'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#F5E8EE] dark:bg-zinc-800 hover:bg-[#EED5DF] dark:hover:bg-zinc-700 text-[#712A45] dark:text-pink-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-pink-200/50 dark:border-zinc-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {onTrackOrder && (
              <button
                onClick={() => {
                  onClose();
                  onTrackOrder(order);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#A53460] hover:bg-[#8F264E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Courier</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F4F4F5] dark:bg-zinc-800 hover:bg-[#E4E4E7] dark:hover:bg-zinc-700 flex items-center justify-center text-[#52525B] dark:text-zinc-400 cursor-pointer border border-slate-200/60 dark:border-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Dispatched Alert Banner (Hidden on print) */}
        {order.customerEmail && (
          <div className="mb-6 p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 flex items-center justify-between gap-3 text-xs text-pink-950 dark:text-pink-200 print:hidden">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>
                Tax Invoice PDF dispatched to verified recipient: <strong>{order.customerEmail}</strong>
              </span>
            </div>
            <span className="text-[10px] bg-pink-200/70 dark:bg-pink-900/60 text-pink-900 dark:text-pink-200 font-semibold px-2 py-0.5 rounded-full">
              Delivered
            </span>
          </div>
        )}

        {/* INVOICE DOCUMENT BODY */}
        <div className="space-y-6 text-[#2B1B22] dark:text-zinc-200 font-sans text-xs print:text-[#2B1B22]">
          
          {/* Header: Company Details & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-[#E2E8F0] dark:border-zinc-800 print:border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <KonichiwaMartLogo size={36} />
                <span className="font-serif font-black text-xl text-[#181818] dark:text-white print:text-[#181818]">
                  Konichiwa<span className="text-[#DC2626]">_Mart</span>
                </span>
                <span className="text-[11px] text-[#9B3C62] dark:text-pink-400 font-sans font-medium print:text-[#9B3C62]">
                  • K-Beauty & Glass Skin
                </span>
              </div>
              <p className="font-semibold text-xs text-[#3D2530] dark:text-zinc-200 print:text-[#3D2530]">
                KONICHIWA_MART PRIVATE LIMITED
              </p>
              <p className="text-[#64748B] dark:text-zinc-400 text-[11px] leading-relaxed print:text-[#64748B]">
                Plot 42, Bio-Tech Innovation Park, Bandra Kurla Complex,<br />
                Mumbai, Maharashtra — 400051, India<br />
                <strong>State:</strong> Maharashtra (Code: 27)
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-block bg-[#F8FAFC] dark:bg-zinc-800 px-3 py-1 rounded-lg border border-[#E2E8F0] dark:border-zinc-700 font-mono text-xs font-bold text-[#0F172A] dark:text-zinc-100 print:bg-[#F8FAFC] print:text-[#0F172A]">
                TAX INVOICE
              </div>
              <div className="pt-1">
                <span className="text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">Invoice No:</span> <strong className="font-mono text-[#0F172A] dark:text-zinc-100 print:text-[#0F172A]">{order.invoiceNumber}</strong>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">Invoice Date:</span> <strong>{order.date}</strong>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">Order Ref:</span> <span className="font-mono">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">Place of Supply:</span> <strong>{order.shippingAddress.state} (Code: 27)</strong>
              </div>
            </div>
          </div>

          {/* Billed To & Shipped To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F8] dark:bg-zinc-850 border border-[#F0D5DF] dark:border-zinc-800 print:bg-[#FAF7F8] print:border-[#F0D5DF]">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A3B5A] dark:text-pink-400 block mb-1 print:text-[#8A3B5A]">
                Billed To & Shipped To:
              </span>
              <p className="font-semibold text-[#1F1218] dark:text-white text-sm print:text-[#1F1218]">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-[#59424D] dark:text-zinc-300 text-xs leading-relaxed mt-0.5 print:text-[#59424D]">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} — <strong>{order.shippingAddress.pincode}</strong><br />
                <span>Phone: <strong>{order.customerPhone || order.shippingAddress.phone}</strong></span><br />
                {order.customerEmail && (
                  <span className="text-slate-700 dark:text-zinc-300 print:text-slate-700">
                    Email: <strong>{order.customerEmail}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="sm:text-right space-y-1 border-t sm:border-t-0 sm:border-l border-[#EAD0DC] dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-4 print:border-[#EAD0DC]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A3B5A] dark:text-pink-400 block mb-1 print:text-[#8A3B5A]">
                Payment & Fulfillment Details:
              </span>
              <div>
                <span className="text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">Payment Mode:</span> <strong className="text-[#1E7E56] dark:text-emerald-400 print:text-[#1E7E56]">{order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)'}</strong>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">Transaction ID:</span> <span className="font-mono text-[11px]">{order.paymentId}</span>
              </div>
            </div>
          </div>

          {/* Itemized Goods Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0] dark:border-zinc-700 text-[11px] text-[#475569] dark:text-zinc-400 bg-[#F8FAFC] dark:bg-zinc-800 print:bg-[#F8FAFC] print:text-[#475569] print:border-[#E2E8F0]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Formulation & Description</th>
                  <th className="py-2.5 px-3">HSN</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-3 text-right">GST (18%)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-zinc-800 print:divide-[#F1F5F9]">
                {order.items.map((item, index) => {
                  const itemTotal = item.price * item.quantity;
                  const itemTax = Math.round(itemTotal * 0.18);
                  const hsnCode = item.title.toLowerCase().includes('lip') ? '33041000' : '33049910';
                  
                  return (
                    <tr key={index} className="text-xs">
                      <td className="py-2.5 px-3 text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#1E293B] dark:text-zinc-100 print:text-[#1E293B]">{item.title}</div>
                        <div className="text-[10px] text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
                          {item.volume} {item.shade && `• Shade: ${item.shade}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">{hsnCode}</td>
                      <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatINR(Math.round(itemTotal * 0.82))}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatINR(itemTax)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#0F172A] dark:text-white print:text-[#0F172A]">
                        {formatINR(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-[#E2E8F0] dark:border-zinc-800 print:border-[#E2E8F0]">
            <div className="space-y-1.5 max-w-sm">
              <div className="text-[11px] text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
                <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#1E7E56] dark:text-emerald-400 bg-[#EAF8F0] dark:bg-emerald-950/40 p-2 rounded-lg border border-[#D5EADF] dark:border-emerald-900/60 print:bg-[#EAF8F0] print:text-[#1E7E56]">
                <ShieldCheck className="w-4 h-4 text-[#1B8055] dark:text-emerald-400 flex-shrink-0" />
                <span>This is a computer-generated tax invoice and does not require a physical signature.</span>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
                <span>Taxable Subtotal:</span>
                <span className="font-mono">{formatINR(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#1E7E56] dark:text-emerald-400 print:text-[#1E7E56]">
                  <span>Privilege Discount:</span>
                  <span className="font-mono">-{formatINR(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
                <span>CGST (9.0%):</span>
                <span className="font-mono">{formatINR(order.cgst)}</span>
              </div>

              <div className="flex justify-between text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
                <span>SGST (9.0%):</span>
                <span className="font-mono">{formatINR(order.sgst)}</span>
              </div>

              <div className="flex justify-between text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
                <span>Shipping & Freight:</span>
                <span className="font-mono">{order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}</span>
              </div>

              <div className="pt-2 border-t-2 border-[#0F172A] dark:border-zinc-600 flex justify-between items-baseline text-base font-bold text-[#0F172A] dark:text-white print:border-[#0F172A] print:text-[#0F172A]">
                <span>Grand Total:</span>
                <span className="font-display text-lg text-[#9B2A56] dark:text-pink-400 print:text-[#9B2A56]">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Official Digital Seal */}
          <div className="pt-6 border-t border-[#E2E8F0] dark:border-zinc-800 print:border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="text-[11px] text-[#64748B] dark:text-zinc-400 print:text-[#64748B]">
              Thank you for choosing Konichiwa_Mart K-Beauty Dispensary. For support, contact <strong>info@konichiwamart.com</strong>
            </div>

            <div className="p-3 rounded-xl border border-[#D1E0D7] dark:border-zinc-700 bg-[#F4FAF6] dark:bg-zinc-850 text-center sm:text-right print:bg-[#F4FAF6]">
              <div className="text-[10px] font-bold text-[#1E7E56] dark:text-emerald-400 uppercase tracking-wider print:text-[#1E7E56]">
                For Konichiwa_Mart Pvt. Ltd.
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 print:text-slate-500">
                Authorized Signatory (Digital)
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
