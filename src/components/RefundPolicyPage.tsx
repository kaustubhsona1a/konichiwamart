import React, { useEffect } from 'react';
import { ShieldCheck, RotateCcw, Truck, RefreshCw, Mail, Phone, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RefundPolicyPageProps {
  onBackToStore?: () => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({ onBackToStore }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-zinc-800 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-pink-500" />
              <span>100% Buyer Protection & Transparent Guarantee</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-zinc-50">
              Refund, Return & Cancellation Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              At <strong>Konichiwa Mart</strong>, we import 100% authentic Japanese skincare and cosmetics. We ensure every parcel is packed with care and shipped across India with complete transparency.
            </p>
          </div>

          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              className="px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              Back to Store
            </button>
          )}
        </div>

        {/* Highlight Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">7-Day Return Window</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">For damaged, defective, or incorrect items</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">3-5 Business Days</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">Instant original payment method refund</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">Zero Restocking Fee</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">Free replacement for transit damage</div>
            </div>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-8 leading-relaxed text-slate-700 dark:text-zinc-300 text-sm">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <CheckCircle2 className="w-5 h-5 text-pink-500" />
              <span>1. Return Policy & Eligibility</span>
            </h2>
            <p>
              We accept return requests within <strong>7 days</strong> from the date of order delivery under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Damaged in Transit:</strong> The outer parcel or product packaging arrived leaking, broken, or crushed.</li>
              <li><strong>Defective or Expired Product:</strong> The product received has a manufacturing defect or expired batch date.</li>
              <li><strong>Incorrect Item Received:</strong> The product delivered does not match the item, size, or shade ordered.</li>
              <li><strong>Condition Requirement:</strong> Items must be returned unused, in their original Japanese retail packaging, with all seals, caps, tags, and batch codes intact.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>2. Non-Returnable Items (Hygiene & Safety)</span>
            </h2>
            <p>
              For public health, personal hygiene, and safety reasons under Indian regulations for cosmetics and skincare:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>Opened, tested, or used skincare, sunscreens, serums, face washes, or cosmetics cannot be returned unless received damaged/defective upon initial delivery.</li>
              <li>Items damaged due to customer misuse, improper storage, or neglect after delivery are not eligible for return.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <RefreshCw className="w-5 h-5 text-emerald-500" />
              <span>3. How to Request a Return or Replacement</span>
            </h2>
            <p>
              Requesting a return or replacement is simple and hassle-free:
            </p>
            <ol className="list-decimal pl-5 space-y-2.5 text-xs sm:text-sm">
              <li>
                <strong>Contact Support:</strong> Email us at <a href="mailto:info@konichiwamart.com" className="text-pink-600 dark:text-pink-400 font-bold underline">info@konichiwamart.com</a> or WhatsApp us at <strong>+91 96720 51678</strong> within 7 days of delivery.
              </li>
              <li>
                <strong>Provide Details:</strong> Share your <strong>Order Number (e.g., KM-ORD-12345)</strong> along with 2-3 clear unboxing photos/videos showing the damaged or incorrect item.
              </li>
              <li>
                <strong>Pickup / Reverse Courier:</strong> Our logistics partner (Shiprocket / Blue Dart / Delhivery) will arrange a reverse pickup from your doorstep free of cost.
              </li>
              <li>
                <strong>Verification & Dispatch:</strong> Once inspected, we will immediately dispatch a fresh replacement or initiate a full refund.
              </li>
            </ol>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <RotateCcw className="w-5 h-5 text-blue-500" />
              <span>4. Refund Process & Timeline</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Refund Mode:</strong> All approved refunds are credited back directly to the original payment method used during checkout (Credit/Debit Card, NetBanking, UPI, or Wallet).</li>
              <li><strong>COD Orders:</strong> For Cash on Delivery orders, refunds will be transferred directly to the customer's verified UPI ID or Bank Account via NEFT/IMPS.</li>
              <li><strong>Processing Time:</strong> Once the returned item is received and verified, refunds are processed within <strong>3 to 5 business days</strong>.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              <span>5. Order Cancellation Policy</span>
            </h2>
            <p className="text-xs sm:text-sm">
              You can cancel your order anytime <strong>before it is dispatched</strong> for a <strong>100% full refund</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>To cancel, email <a href="mailto:info@konichiwamart.com" className="text-pink-600 dark:text-pink-400 font-bold underline">info@konichiwamart.com</a> or WhatsApp <strong>+91 96720 51678</strong> with your Order ID.</li>
              <li>If the order has already been handed over to the courier partner and an AWB tracking number has been issued, it cannot be cancelled in transit. You may refuse delivery upon arrival, and a full refund will be processed once returned.</li>
            </ul>
          </section>

          {/* Section 6 - Support Contact Info */}
          <section className="bg-pink-50/70 dark:bg-zinc-800/50 p-6 rounded-2xl border border-pink-100 dark:border-zinc-800 space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-zinc-100">
              Need Assistance? Contact Customer Support
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-pink-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-zinc-100">Email Support</div>
                  <a href="mailto:info@konichiwamart.com" className="text-pink-600 dark:text-pink-400 font-semibold hover:underline">info@konichiwamart.com</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-pink-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-zinc-100">Phone & WhatsApp</div>
                  <div className="text-slate-700 dark:text-zinc-300 font-semibold">+91 96720 51678</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-zinc-100">Fulfillment Hub</div>
                  <div className="text-slate-600 dark:text-zinc-400 text-[11px] leading-snug">
                    Car's Empire, Sardar Vallabhai Patel Rd, opp. Model Town, near Punjab & Maharashtra Bank, MMRDA Colony, Andheri East, Mumbai, MH 400093
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};
