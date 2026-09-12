import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Plane, 
  Award, 
  HeartHandshake, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ThermometerSnowflake, 
  FileCheck, 
  HelpCircle, 
  ChevronDown, 
  PhoneCall, 
  ShoppingBag,
  ExternalLink,
  Droplets,
  Flower2,
  ScanLine
} from 'lucide-react';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface AboutUsPageProps {
  onNavigateToProducts: () => void;
  onOpenContact: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onNavigateToProducts,
  onOpenContact
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const FAQS = [
    {
      q: 'Why are Japanese skincare products so popular and effective?',
      a: 'Japanese skincare (J-Beauty) emphasizes prevention, long-term barrier repair, and gentle multi-weight hydration over harsh stripping or abrasive acids. Formulas from labs like Rohto Mentholatum, Shiseido, and Ishizawa Lab utilize micro-dense foams, stabilized antioxidants, and fermented rice extracts designed for daily skin harmony.'
    },
    {
      q: 'How do I check the expiry date on Japanese cosmetics?',
      a: 'Under the Japanese Pharmaceutical and Medical Devices Act, cosmetics that remain stable for at least 3 years unopened are not legally required to carry a printed manufacturing or expiry date. Instead, each manufacturer stamps a unique alphanumeric batch code on the crimp or bottom. We track batch codes with our Tokyo distributors to ensure all stock arrives in India within 3 to 6 months of laboratory production.'
    },
    {
      q: 'How do you prevent active ingredients from degrading during shipping?',
      a: 'We avoid cheap sea-freight cargo containers that spend weeks in tropical heat. Every shipment for Konichiwa_Mart is transported via rapid air freight from Tokyo to Mumbai and held in a 20°C temperature-regulated facility, safeguarding sensitive ingredients like pure Vitamin C, Retinol, and Ceramide complexes.'
    },
    {
      q: 'Do your products come with official Indian GST tax invoices?',
      a: 'Yes. Every order includes a downloadable, official GST-compliant tax invoice with HSN classification codes, seller GSTIN, and consignment tracking numbers, so your purchase is 100% legal, customs-cleared, and authentic.'
    }
  ];

  return (
    <div className="relative min-h-screen pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-slate-800">
      
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-white/90 via-pink-50/50 to-white/90 dark:from-[#131722]/95 dark:via-[#181C2A]/90 dark:to-[#131722]/95 border border-pink-200/70 dark:border-slate-800 p-6 sm:p-10 md:p-14 shadow-sm mb-12 sm:mb-16">
        
        {/* Subtle Decorative Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-200/30 dark:from-pink-600/10 via-rose-100/20 dark:via-rose-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-100/30 dark:from-amber-600/5 via-pink-100/20 dark:via-pink-900/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6 text-left">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100/80 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/60 text-pink-800 dark:text-pink-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            <span>DIRECT TOKYO DISPENSARY • AUTHENTIC J-BEAUTY</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Bridging Tokyo’s Finest Skincare Dispensaries With India.
          </h1>

          {/* Japanese Kanji Subtitle */}
          <p className="text-xs sm:text-sm font-serif text-pink-600 dark:text-pink-400 tracking-widest uppercase font-medium">
            東京直送の正統派スキンケア • 100% Guaranteed Genuine Imports
          </p>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Konichiwa_Mart was built on a simple, unwavering standard: deliver factory-sealed, 100% authentic Japanese skincare essentials directly from authorized pharmacies in Tokyo to your doorstep anywhere in India.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={onNavigateToProducts}
              className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-pink-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Tokyo Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenContact}
              className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-50/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-pink-500" />
              <span>Contact Sourcing Desk</span>
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-6 sm:pt-8 border-t border-pink-100/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white block">100%</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tokyo Verified</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white block">3-6 Mo</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Fresh Batch Window</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white block">19k+</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pincodes Served</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white block">0</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Counterfeits Tolerated</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE STORY / WHY WE EXIST */}
      <section className="mb-12 sm:mb-16 text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
              <Flower2 className="w-4 h-4" />
              <span>Our Origin Story</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white tracking-tight leading-snug">
              Why Getting Real Japanese Skincare in India Was Broken.
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Anyone who has visited Tokyo knows the wonder of Japanese drugstores in Shibuya and Ginza. Shelves are stocked with formulas perfected over decades: foaming cleansers that lather into cloud-like micro-foam pillows, lightweight sunscreens that disappear like water, and pure fermented toners that deeply replenish dry skin.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Back in India, buying these products was a stressful gamble. Gray market sellers were charging 3x inflated prices, selling near-expired formulations, or worst of all, circulating diluted counterfeits that ruined sensitive skin barriers.
            </p>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              We established <strong>Konichiwa_Mart</strong> to eliminate the middlemen. By building direct procurement relationships with licensed distributors in Tokyo and establishing cold-chain transit to Mumbai, we provide Indian consumers with authentic, laboratory-fresh J-Beauty at fair, transparent prices.
            </p>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-3xl p-6 bg-gradient-to-tr from-pink-50 via-rose-50/70 to-amber-50/50 dark:from-[#181C2A] dark:via-[#1B1726] dark:to-[#161A24] border border-pink-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-pink-100 dark:border-slate-700 flex items-center justify-center text-pink-600">
                <KonichiwaMartLogo size={38} />
              </div>
              
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                The Konichiwa Standard
              </h3>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Procured directly from Tokyo authorized dispensary networks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Never stored in humid sea containers; rapid air courier transit only.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Every bottle carries an intact factory tamper seal & verifiable JAN code.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>100% Money-Back Authenticity Guarantee on every order.</span>
                </li>
              </ul>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-pink-100 dark:border-slate-700 text-[11px] text-pink-800 dark:text-pink-300 font-medium">
                📍 Sourcing Desk: Shibuya-ku, Tokyo &bull; Fulfillment: Mumbai, Maharashtra
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FOUR CORE DISPENSARY PILLARS */}
      <section className="mb-12 sm:mb-16 text-left">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Uncompromising Protocols</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
            How We Protect Your Skincare Integrity
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direct Tokyo Procurement</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We do not source through third-party liquidators. All items are purchased directly from authorized Japanese brand distributors and drugstore chains in Tokyo.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Climate Control</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Active J-Beauty ingredients like Melano CC Vitamin C and Ceramide toners oxidize when heated. We fly all inventory and warehouse at 20°C.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fresh Batch Cycles</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Instead of holding massive bulk containers for years, we import small, bi-weekly air freight batches so your product was recently bottled in Japan.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official GST Compliance</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every shipment is formally cleared through Indian Customs, fully duty-paid, and supplied with a verifiable GST Tax Invoice with product HSN codes.
            </p>
          </div>

        </div>
      </section>

      {/* 4. STEP-BY-STEP JOURNEY: FROM TOKYO DISPENSARY TO YOUR HOME */}
      <section className="mb-12 sm:mb-16 p-6 sm:p-10 rounded-3xl bg-slate-900 dark:bg-zinc-950 text-white text-left relative overflow-hidden border dark:border-zinc-800">
        
        {/* Background gradient hint */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mb-8">
          <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1">
            Transparency In Motion
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            The Journey of Your Japanese Bottle
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Follow how each authentic skincare product travels from the streets of Tokyo to your skincare shelf.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-mono font-bold text-pink-400">STAGE 01</div>
            <div className="text-sm font-bold text-white">Dispensary Sourcing</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Picked up directly from Tokyo pharmaceutical distributors with factory tamper seals intact.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-mono font-bold text-pink-400">STAGE 02</div>
            <div className="text-sm font-bold text-white">Batch & JAN Code Audit</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every case is inspected for barcode authenticity, production date validity, and packaging seals.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-mono font-bold text-pink-400">STAGE 03</div>
            <div className="text-sm font-bold text-white">Direct Air Cargo</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Air-freighted from Tokyo Haneda (HND) to Mumbai (BOM) with customs inspection and GST clearance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-mono font-bold text-pink-400">STAGE 04</div>
            <div className="text-sm font-bold text-white">Express Doorstep Delivery</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatched with shock-absorbent packaging via BlueDart, Delhivery, or India Post across 19,000+ pincodes.
            </p>
          </div>

        </div>
      </section>

      {/* 5. AUTHENTICITY GUIDE & VERIFICATION */}
      <section className="mb-12 sm:mb-16 text-left">
        <div className="rounded-3xl border border-pink-200/80 dark:border-zinc-800 bg-gradient-to-r from-pink-50/60 via-white to-pink-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 p-6 sm:p-8 md:p-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold">
                <ScanLine className="w-3.5 h-3.5" />
                <span>HOW TO VERIFY YOUR BOTTLE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                100% Verifiable With Japanese Barcode & Batch Code
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Every genuine product sold on Konichiwa_Mart carries an authentic Japanese Article Number (JAN Barcode starting with 45 or 49) and factory lot code. You can scan the barcode using standard international barcode decoders or the official brand manufacturer portals to confirm authenticity immediately upon delivery.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">✓ Authentic JAN-13 Barcode</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">✓ Factory Heat-Crimp Seal</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">✓ Zero Third-Party Relabeling</span>
              </div>
            </div>

            <div className="md:col-span-4 text-center md:text-right">
              <button
                onClick={onNavigateToProducts}
                className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-pink-600/30 transition-all cursor-pointer"
              >
                Shop Verified Japanese Range
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section className="mb-12 sm:mb-16 text-left max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider block mb-1">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all shadow-2xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-pink-600 dark:text-pink-400' : ''}`} />
              </button>
              
              {activeFaq === idx && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-pink-50 via-rose-50/70 to-pink-100/60 dark:from-[#1A1424] dark:via-[#161220] dark:to-[#181122] border border-pink-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xs mx-auto flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-slate-700">
          <KonichiwaMartLogo size={38} />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
          Ready to Experience Real Japanese Skincare?
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          From micro-foam cleansers to active Vitamin C toners and Ceramide barrier masks, explore Tokyo’s most celebrated skincare essentials.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onNavigateToProducts}
            className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-pink-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Japanese Collection</span>
          </button>

          <button
            onClick={onOpenContact}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-50/50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
          >
            Ask a Question
          </button>
        </div>
      </section>

    </div>
  );
};
