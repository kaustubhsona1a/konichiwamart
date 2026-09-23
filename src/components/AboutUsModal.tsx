import React from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Plane, 
  Award, 
  HeartHandshake, 
  MapPin, 
  CheckCircle2,
  ExternalLink,
  Star
} from 'lucide-react';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';
import { STORE_LOCATION_CONFIG } from '../data/storeLocation';

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
  // Lock background body scroll when open and handle ESC
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="about-us-modal"
      className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 sm:my-auto">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-pink-100/70 dark:border-zinc-800 bg-gradient-to-b from-pink-50/50 to-white dark:from-zinc-850 dark:to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 shadow-xs border border-pink-100 dark:border-zinc-700 flex items-center justify-center">
              <KonichiwaMartLogo size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-zinc-100 tracking-tight">
                  About Konichiwa<span className="text-pink-600 dark:text-pink-400">_Mart</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 uppercase tracking-wider border border-pink-200 dark:border-pink-800">
                  Japan Direct
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Bringing authentic Japanese skincare rituals directly to India
              </p>
            </div>
          </div>

          <button
            id="about-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-pink-100 dark:hover:bg-zinc-700 hover:text-pink-600 dark:hover:text-pink-400 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60 dark:border-zinc-700"
            aria-label="Close About Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-left">
          
          {/* Hero Story Banner: The Story Behind Konichiwa Mart */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-50 via-rose-50/60 to-amber-50/40 dark:from-zinc-800/90 dark:via-zinc-800/60 dark:to-zinc-900 border border-pink-200/70 dark:border-zinc-700 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-100/90 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 text-[11px] font-bold">
                <span>🌸</span>
                <span className="uppercase tracking-wider">THE STORY BEHIND KONICHIWA MART</span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
                  From Okinawa to India:
                </h3>
                <p className="text-xs sm:text-sm font-serif italic text-pink-700 dark:text-pink-300 font-medium">
                  A little bit of Japan, a little bit of India, and a whole lot of heart.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">
                <p>
                  I was born and raised in Okinawa, Japan, surrounded by a culture that taught me from an early age to appreciate simplicity, quality, care, and attention to detail.
                </p>
                <p>
                  Growing up in Okinawa gave me more than just a connection to Japan — it gave me an understanding of the little things that make Japanese products and everyday life so special. The thoughtfulness behind a product, the importance of quality, and the belief that even the simplest things should be done with care have stayed with me throughout my life.
                </p>
                <p>
                  Today, living in India, I found myself looking at Japan from a different perspective. I saw how much Indian consumers appreciate authentic, high-quality beauty products and how curious they are to discover what Japan has to offer.
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  And that is where the idea for Konichiwa Mart began.
                </p>
                <p>
                  I wanted to create more than just a place to buy Japanese skincare. I wanted to build a little bridge between two countries that are both very close to my heart — bringing authentic Japanese beauty, trusted products, and a piece of the Japan I grew up with to India.
                </p>
                <p className="text-pink-700 dark:text-pink-300 font-medium">
                  Konichiwa Mart is my way of sharing a part of my Japan with India.
                </p>
                <p>
                  Thank you for being a part of this beautiful journey.
                </p>
              </div>

              {/* Founder Signoff */}
              <div className="pt-3 border-t border-pink-200/60 dark:border-zinc-750 flex items-center justify-between">
                <div>
                  <span className="font-serif font-bold text-base text-slate-900 dark:text-white">
                    Roshni 🌸
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Founder, Konichiwa Mart &bull; Born in Okinawa, Living in India
                  </span>
                </div>
                <div className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg bg-white/80 dark:bg-zinc-800 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-zinc-700">
                  心を込めて
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars of Konichiwa Mart */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Why Skincare Enthusiasts Trust Us
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-750 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100">100% Guaranteed Genuine</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Direct from Japan authorized dispensaries with intact factory safety seals and verifiable JAN codes.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-750 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100">Fresh Air-Flown Batches</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Never old clearance stock. Frequent small air batches protect active Vitamin C, Retinol & Ceramides.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-750 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100">Fair Transparent Pricing</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Transparent pricing in Indian Rupees (INR) with standard import duty and GST covered.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-750 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100">Pan-India Express Dispatch</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Dispatched within 3-5 days across 19,000+ Indian pincodes with GST invoices and dedicated customer care.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Location & Sourcing info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>
                <strong>Sourcing Desk:</strong> Shibuya-ku, Japan &nbsp;|&nbsp; <strong>India Hub:</strong> Andheri East, Mumbai
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Registered Importer</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-850/70 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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
