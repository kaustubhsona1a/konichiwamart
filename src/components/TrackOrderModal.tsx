import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { formatINR } from '../data/pincodes';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  onOpenContact?: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
  onOpenContact
}) => {
  const [query, setQuery] = useState(initialOrderNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  // Sync initial query if passed
  React.useEffect(() => {
    if (initialOrderNumber && isOpen) {
      setQuery(initialOrderNumber);
      handleTrack(initialOrderNumber);
    }
  }, [initialOrderNumber, isOpen]);

  if (!isOpen) return null;

  const handleTrack = async (searchQuery?: string) => {
    const q = (searchQuery || query || '').trim();
    if (!q) {
      setErrorMsg('Please enter your Order ID (e.g. KM-1002) or 10-digit Phone Number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setOrderResult(null);

    try {
      const response = await fetch('/api/orders/public-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'No active order found. Please check your Order ID or Mobile Number.');
      } else {
        setOrderResult(data.order);
      }
    } catch (err) {
      setErrorMsg('Network error. Unable to fetch order tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    const norm = (status || 'CONFIRMED').toUpperCase();
    if (norm === 'CANCELLED') return -1;
    if (norm === 'DELIVERED') return 4;
    if (norm === 'OUT_FOR_DELIVERY') return 3;
    if (norm === 'IN_TRANSIT') return 2;
    if (norm === 'DISPATCHED' || norm === 'SHIPPED') return 1;
    return 0; // CONFIRMED / PLACED
  };

  const currentStep = orderResult ? getStatusStepIndex(orderResult.status) : 0;

  const timelineSteps = [
    { label: 'Order Confirmed', description: 'Order received & being processed' },
    { label: 'Packed & Dispatched', description: 'Handed over to courier partner' },
    { label: 'In Transit', description: 'On the way to destination facility' },
    { label: 'Out for Delivery', description: 'Courier agent delivering today' },
    { label: 'Delivered', description: 'Successfully handed to customer' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121215] rounded-2xl sm:rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 overflow-hidden max-h-[92vh] flex flex-col my-auto text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 dark:border-zinc-800 bg-pink-50/60 dark:bg-pink-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-600/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
                Track Order Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Real-time Japanese Skincare Dispatch &amp; Courier Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close track order modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-zinc-300">
          
          {/* Lookup Input Form */}
          <div className="bg-stone-50 dark:bg-zinc-900/70 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Enter Order Number or Phone Number
            </label>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleTrack();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. KM-1002, 1002, or 8879258004"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-pink-600/20 whitespace-nowrap active:scale-95"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track</span>
                  </>
                )}
              </button>
            </form>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              You can search by your <strong>Order ID</strong> (from email/SMS) or your <strong>10-digit registered mobile number</strong>.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-sm">{errorMsg}</p>
                <p className="mt-1">
                  If you recently placed your order, please allow a few minutes for the system to process or contact support at <strong>+91 8879258004</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Order Details View */}
          {orderResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Order Overview Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50/80 via-purple-50/50 to-pink-50/80 dark:from-pink-950/20 dark:via-zinc-900 dark:to-pink-950/20 border border-pink-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">Order Found</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      {orderResult.paymentStatus || 'PAID'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    #{orderResult.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Placed on {new Date(orderResult.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-zinc-400">Total Amount</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {formatINR(orderResult.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Visual Logistics Timeline */}
              <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    <span>Delivery Progress</span>
                  </h4>
                  <span className="text-xs font-bold text-pink-700 dark:text-pink-400 bg-pink-100/80 dark:bg-pink-950/60 px-2.5 py-1 rounded-full border border-pink-200/80 dark:border-pink-800">
                    {orderResult.status}
                  </span>
                </div>

                <div className="relative py-2 px-2">
                  <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 dark:before:bg-zinc-700">
                    {timelineSteps.map((step, idx) => {
                      const isPassed = currentStep >= idx;
                      const isCurrent = currentStep === idx;
                      return (
                        <div key={step.label} className="flex items-start gap-4 relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                            isPassed 
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100 dark:ring-emerald-950/60' 
                              : 'bg-stone-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                          }`}>
                            {isPassed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className={`text-xs font-bold ${
                              isCurrent 
                                ? 'text-pink-600 dark:text-pink-400 font-extrabold text-sm' 
                                : isPassed 
                                  ? 'text-slate-900 dark:text-zinc-100' 
                                  : 'text-slate-400 dark:text-zinc-500'
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Courier Partner & AWB Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-zinc-900/80 border border-stone-200/80 dark:border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Courier Partner</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      {orderResult.courierPartner || 'Shiprocket Partner Network'}
                    </span>
                  </div>

                  {orderResult.awbNumber ? (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">AWB Tracking Number</span>
                      <span className="text-sm font-mono font-bold text-pink-600 dark:text-pink-400 mt-0.5 block">
                        {orderResult.awbNumber}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 font-medium">
                      AWB will be assigned upon parcel dispatch
                    </div>
                  )}
                </div>

                {orderResult.estimatedDeliveryDate && (
                  <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300">
                    <strong>Estimated Delivery:</strong> {orderResult.estimatedDeliveryDate}
                  </div>
                )}

                {/* Direct 1-Click Tracking Link Button */}
                {(orderResult.trackingUrl || orderResult.awbNumber) && (
                  <div className="pt-2">
                    <a
                      href={orderResult.trackingUrl || `https://shiprocket.co/tracking/${orderResult.awbNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4 text-pink-400" />
                      <span>Open Live Carrier Portal Tracking</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Items Ordered */}
              {Array.isArray(orderResult.items) && orderResult.items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-pink-600" />
                    <span>Items in this Shipment ({orderResult.items.length})</span>
                  </h4>
                  <div className="divide-y divide-stone-100 dark:divide-zinc-800 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                    {orderResult.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          {item.shadeName && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                              Shade: {item.shadeName}
                            </p>
                          )}
                          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 mt-0.5">
                            Qty: {item.quantity} × {formatINR(item.price)}
                          </p>
                        </div>
                        <div className="text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {formatINR((item.price || 0) * (item.quantity || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {orderResult.shippingAddress && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-200/70 dark:border-zinc-800 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-pink-600" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">
                    {orderResult.shippingAddress.fullName} ({orderResult.customerPhone || 'Phone provided'})
                  </p>
                  <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {orderResult.shippingAddress.addressLine1}
                    {orderResult.shippingAddress.addressLine2 ? `, ${orderResult.shippingAddress.addressLine2}` : ''}
                    , {orderResult.shippingAddress.city}, {orderResult.shippingAddress.state} - <strong>{orderResult.shippingAddress.pincode}</strong>
                  </p>
                </div>
              )}

              {/* Direct Support Banner */}
              <div className="p-4 rounded-2xl bg-pink-50/90 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-pink-900 dark:text-pink-200">Need Help with this Order?</h4>
                  <p className="text-[11px] text-pink-700 dark:text-pink-300 mt-0.5">
                    Connect directly with Konichiwa Mart Customer Support Hotline: <strong>+91 8879258004</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/918879258004?text=${encodeURIComponent(`Hi Konichiwa Mart, I am checking status for Order #${orderResult.orderNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="tel:+918879258004"
                    className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Support</span>
                  </a>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
