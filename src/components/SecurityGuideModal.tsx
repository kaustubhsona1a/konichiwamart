import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Database, 
  Truck, 
  FileText, 
  CheckCircle2, 
  KeyRound, 
  Layers 
} from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A0F15]/50 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-[#F2D1DE] overflow-hidden text-left p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F8FAFC] hover:bg-[#E2E8F0] flex items-center justify-center text-[#475569] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0] mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF8F0] text-[#166534] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1E293B]">
              Store Security & Data Architecture Blueprint
            </h2>
            <p className="text-xs text-[#64748B]">
              How payments, customer records, GST invoices, and Shiprocket logistics operate safely.
            </p>
          </div>
        </div>

        {/* 4 Architectural Columns */}
        <div className="space-y-4 text-xs text-[#334155]">
          
          {/* Section 1: Payment Security */}
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#166534] text-sm">
              <Lock className="w-4 h-4 text-[#16A34A]" />
              <span>1. Why Payments Cannot Be Hijacked or Diverted</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#15803D]">
              <strong>• Server-Side Pricing:</strong> The browser never determines the price. When a customer checks out, the backend calculates the exact INR total directly from the database and signs it with the secret merchant key.
            </p>
            <p className="text-[11px] leading-relaxed text-[#15803D]">
              <strong>• HMAC-SHA256 Signatures:</strong> Razorpay generates an encrypted cryptographic hash after successful payment. The backend verifies this hash with your private `RAZORPAY_KEY_SECRET` before marking the order as PAID.
            </p>
          </div>

          {/* Section 2: Data Storage */}
          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#1E40AF] text-sm">
              <Database className="w-4 h-4 text-[#2563EB]" />
              <span>2. Where Customer Data & Addresses Are Stored</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#1D4ED8]">
              <strong>• PostgreSQL Database (Supabase in AWS Mumbai):</strong> All customer records, passwords, addresses, and order histories are stored with <strong>Row-Level Security (RLS)</strong> so users can only ever access their own data.
            </p>
            <p className="text-[11px] leading-relaxed text-[#1D4ED8]">
              <strong>• Zero Card Storage (PCI-DSS):</strong> Card numbers and CVVs are entered inside secure bank iframes; your server never touches raw card data.
            </p>
          </div>

          {/* Section 3: Automated Invoices */}
          <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#F3E8FF] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#6B21A8] text-sm">
              <FileText className="w-4 h-4 text-[#9333EA]" />
              <span>3. Automated GST Invoices & Receipts</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#7E22CE]">
              <strong>• Instant Generation:</strong> Upon payment verification, a GST-compliant tax invoice with your GSTIN, HSN codes (33049910), CGST 9%, and SGST 9% is rendered.
            </p>
            <p className="text-[11px] leading-relaxed text-[#7E22CE]">
              <strong>• 1-Click Access:</strong> Stored securely in Cloud Storage with instant printable and PDF download links inside the customer's account portal.
            </p>
          </div>

          {/* Section 4: Shiprocket Logistics */}
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#92400E] text-sm">
              <Truck className="w-4 h-4 text-[#D97706]" />
              <span>4. How Shipping & Courier Assignment Works</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#B45309]">
              <strong>• Shiprocket API Integration:</strong> Connects to 19,000+ Indian pincodes across Blue Dart, Delhivery, DTDC, and Shadowfax.
            </p>
            <p className="text-[11px] leading-relaxed text-[#B45309]">
              <strong>• AWB Generation:</strong> Automatically assigns Air Waybills and generates printable shipping labels for package dispatch.
            </p>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-pink-600/25 transition-all active:scale-95"
          >
            Got it, Return to Store
          </button>
        </div>

      </div>

    </div>
  );
};
