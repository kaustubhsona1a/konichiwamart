import React from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Plane, 
  Award, 
  HeartHandshake, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreProducts: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onExploreProducts
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="about-us-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-pink-100/70 bg-gradient-to-b from-pink-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-pink-100 flex items-center justify-center">
              <KonichiwaMartLogo size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
                  About Konichiwa<span className="text-pink-600">_Mart</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 uppercase tracking-wider">
                  Tokyo Direct
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Bringing authentic Japanese skincare rituals directly to India
              </p>
            </div>
          </div>

          <button
            id="about-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-pink-100 hover:text-pink-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close About Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-left">
          
          {/* Hero Story Banner */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-pink-50 via-rose-50/60 to-amber-50/40 border border-pink-200/60 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-700">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>OUR PROMISE: ZERO COMPROMISE AUTHENTICITY</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                <strong>Konichiwa_Mart</strong> was founded out of a shared frustration with counterfeit, expired, and heavily marked-up Japanese skincare products sold across unofficial channels in India.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                We work directly with certified Tokyo pharmacy dispensaries and authorized distributors in Japan. Every single bottle, mask pack, and tube is air-freighted, temperature-preserved, and verified with authentic batch codes.
              </p>
            </div>
          </div>

          {/* 4 Pillars of Konichiwa Mart */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Why Skincare Enthusiasts Trust Us
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">100% Guaranteed Genuine</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Direct from Shibuya and Ginza dispensaries with intact factory safety seals and QR verification.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Fresh Air-Flown Batches</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Never old clearance stock. We order frequent small air batches to preserve active Vitamin C and Ceramides.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Fair Tokyo Direct Pricing</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Transparent pricing in Indian Rupees (INR) with standard import duty absorbed, avoiding middleman price spikes.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Pan-India Express Dispatch</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Fast courier shipping across 19,000+ Indian pincodes with GST invoices and dedicated WhatsApp customer care.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Location & Sourcing info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>
                <strong>Sourcing Desk:</strong> Shibuya-ku, Tokyo, Japan &nbsp;|&nbsp; <strong>India Hub:</strong> Andheri East, Mumbai
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Registered Importer</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            id="about-explore-products-btn"
            onClick={() => {
              onClose();
              onExploreProducts();
            }}
            className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md shadow-pink-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore Japanese Collection</span>
          </button>
        </div>

      </div>
    </div>
  );
};
