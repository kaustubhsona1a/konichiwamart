import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Plane, 
  Heart, 
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
  Flower2,
  Compass,
  Smile
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
      q: 'Why are Japanese skincare products so gentle yet remarkably effective?',
      a: 'Japanese skincare (J-Beauty) is built upon centuries of respect for the skin barrier. Rather than relying on abrasive peeling acids or aggressive stripping agents, traditional and modern formulations use multi-molecular hyaluronic acids, fermented rice extracts, soothing botanicals, and micro-dense lather cushions to foster long-term skin health, natural barrier resilience, and timeless radiance.'
    },
    {
      q: 'How do I check the manufacturing or expiry date on Japanese cosmetics?',
      a: 'Under the Japanese Pharmaceutical and Medical Devices Act, cosmetics that maintain their stability for at least 3 years unopened are not legally required to carry a printed expiration date. Instead, manufacturers stamp an alphanumeric batch lot code on the bottle base or crimp. At Konichiwa Mart, we source directly through fresh bi-weekly dispensary shipments so every product arrives in India within 3 to 6 months of laboratory production.'
    },
    {
      q: 'How do you safeguard sensitive ingredients during international transit?',
      a: 'We strictly avoid slow sea containers where cargo sits under equatorial heat for weeks. Every order for Konichiwa Mart is transported via rapid air freight from Japan to Mumbai and stored in temperature-controlled 20°C warehouses, keeping sensitive active ingredients like pure Vitamin C (Melano CC), Retinol, and Ceramide complexes active and potent.'
    },
    {
      q: 'Do orders come with official Tax Invoices in India?',
      a: 'Yes, absolutely. Every parcel is 100% customs-cleared, fully duty-paid, and accompanied by an official tax invoice with registered HSN classifications, so your purchase is fully documented, legal, and verifiable.'
    }
  ];

  return (
    <div className="relative min-h-screen pt-20 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-slate-800 dark:text-zinc-200">
      
      {/* 1. EDITORIAL HEADER & FOUNDER STORY HERO */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-white via-pink-50/40 to-white dark:from-[#141724] dark:via-[#1A1E2E] dark:to-[#141724] border border-pink-200/80 dark:border-zinc-800 p-6 sm:p-10 md:p-14 shadow-sm mb-12 sm:mb-16 text-left">
        
        {/* Soft Decorative Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-300/25 via-rose-200/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-200/20 via-pink-200/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/90 dark:bg-pink-950/70 border border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300 text-xs font-semibold tracking-wide shadow-2xs">
            <span className="text-sm">🌸</span>
            <span className="tracking-wider uppercase text-[11px]">Founder's Story &bull; 沖縄からインドへ</span>
          </div>

          {/* Main Title Requested by User */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              THE STORY BEHIND KONICHIWA MART.
            </h1>
            
            {/* Subtitle Requested by User */}
            <div className="pt-2">
              <p className="text-base sm:text-xl md:text-2xl font-serif text-pink-700 dark:text-pink-300 font-medium leading-snug">
                From Okinawa to India:
              </p>
              <p className="text-base sm:text-xl md:text-2xl font-serif italic text-slate-700 dark:text-zinc-200 font-normal leading-snug">
                A little bit of Japan, a little bit of India, and a whole lot of heart.
              </p>
            </div>
          </div>

          {/* Quick Bridge Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-zinc-850 border border-pink-100 dark:border-zinc-700 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Okinawa Roots</span>
            </span>
            <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-zinc-850 border border-pink-100 dark:border-zinc-700 shadow-2xs">
              <Plane className="w-3.5 h-3.5 text-blue-500" />
              <span>Direct Flight Transit</span>
            </span>
            <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-zinc-850 border border-pink-100 dark:border-zinc-700 shadow-2xs">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>India Home</span>
            </span>
          </div>

        </div>
      </section>

      {/* 2. ROSHNI'S PERSONAL LETTER / ESSAY */}
      <section className="mb-14 sm:mb-20 text-left">
        <div className="relative rounded-3xl bg-white dark:bg-[#151928] border border-pink-200/90 dark:border-zinc-800 shadow-md shadow-pink-900/5 p-6 sm:p-10 md:p-14 overflow-hidden">
          
          {/* Subtle Japanese Paper Texture Accent */}
          <div className="absolute top-4 right-6 text-7xl font-serif text-pink-500/10 dark:text-pink-400/5 select-none pointer-events-none font-black">
            沖縄
          </div>

          {/* Letter Content */}
          <div className="max-w-3xl space-y-6 text-slate-700 dark:text-zinc-200 text-sm sm:text-base md:text-[17px] leading-[1.8] font-sans">
            
            {/* Paragraph 1 */}
            <p className="first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-pink-600 first-letter:mr-2 first-letter:float-left">
              I was born and raised in Okinawa, Japan, surrounded by a culture that taught me from an early age to appreciate simplicity, quality, care, and attention to detail.
            </p>

            {/* Paragraph 2 */}
            <p>
              Growing up in Okinawa gave me more than just a connection to Japan — it gave me an understanding of the little things that make Japanese products and everyday life so special. The thoughtfulness behind a product, the importance of quality, and the belief that even the simplest things should be done with care have stayed with me throughout my life.
            </p>

            {/* Highlighted Pull Quote */}
            <div className="my-8 p-5 sm:p-7 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50/70 to-pink-50/30 dark:from-pink-950/30 dark:via-zinc-850 dark:to-zinc-850 border-l-4 border-pink-500 dark:border-pink-400 shadow-2xs">
              <p className="font-serif italic text-base sm:text-lg text-slate-800 dark:text-pink-200 leading-relaxed">
                “The thoughtfulness behind a product, the importance of quality, and the belief that even the simplest things should be done with care have stayed with me throughout my life.”
              </p>
            </div>

            {/* Paragraph 3 */}
            <p>
              Today, living in India, I found myself looking at Japan from a different perspective. I saw how much Indian consumers appreciate authentic, high-quality beauty products and how curious they are to discover what Japan has to offer.
            </p>

            {/* Paragraph 4 */}
            <p className="font-medium text-slate-900 dark:text-white">
              And that is where the idea for Konichiwa Mart began.
            </p>

            {/* Paragraph 5 */}
            <p>
              I wanted to create more than just a place to buy Japanese skincare. I wanted to build a little bridge between two countries that are both very close to my heart — bringing authentic Japanese beauty, trusted products, and a piece of the Japan I grew up with to India.
            </p>

            {/* Paragraph 6 */}
            <p className="text-pink-700 dark:text-pink-300 font-medium">
              Konichiwa Mart is my way of sharing a part of my Japan with India.
            </p>

            {/* Paragraph 7 */}
            <p>
              Thank you for being a part of this beautiful journey.
            </p>

            {/* Founder Sign-off Box */}
            <div className="pt-6 mt-8 border-t border-pink-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-wide">
                    Roshni
                  </span>
                  <span className="text-xl">🌸</span>
                </div>
                <p className="text-xs font-medium text-pink-700 dark:text-pink-400">
                  Founder, Konichiwa Mart
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Born in Okinawa &bull; Living in India
                </p>
              </div>

              {/* Cultural Stamp / Seal */}
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-pink-50/80 dark:bg-zinc-800/80 border border-pink-200/80 dark:border-zinc-700 text-xs text-slate-600 dark:text-zinc-300">
                <KonichiwaMartLogo size={32} />
                <div className="text-left">
                  <span className="block font-bold text-slate-800 dark:text-zinc-100 text-[11px]">
                    心を込めて (Kokoro wo Komete)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    With all my heart &bull; Direct Japan Dispensary
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 3. TWO HOMES, ONE BRIDGE: THE CULTURAL INSPIRATION */}
      <section className="mb-14 sm:mb-20 text-left">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>The Heart of Konichiwa Mart</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
            Building a Living Bridge Between Two Worlds
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl">
            How growing up in Okinawa and making a home in India shaped every promise we make to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: Okinawa Roots */}
          <div className="rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-pink-200/70 dark:border-zinc-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100/90 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xl shadow-2xs">
                🌊
              </div>
              <div>
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest block">
                  CHAPTER 01 &bull; 沖縄
                </span>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white mt-0.5">
                  The Okinawa Spirit
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                Surrounded by emerald seas, coral breezes, and a peaceful way of life, Okinawa instilled an instinctive respect for simplicity, purity, and patient craftsmanship. That same mindfulness guides every skincare formulation we curate.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-medium text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
              <span>✓ Purity, Care & Attention to Detail</span>
            </div>
          </div>

          {/* Card 2: The Bridge */}
          <div className="rounded-3xl p-6 bg-gradient-to-b from-pink-50/70 via-white to-pink-50/40 dark:from-[#181C2C] dark:via-[#161926] dark:to-[#181C2C] border-2 border-pink-300/80 dark:border-pink-800/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-600 text-white flex items-center justify-center text-xl shadow-xs shadow-pink-600/30">
                🌉
              </div>
              <div>
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest block">
                  CHAPTER 02 &bull; 架け橋
                </span>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white mt-0.5">
                  The Honest Bridge
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                Eliminating gray-market uncertainty, inflated markups, and stale storage. We procure directly from Japan pharmaceutical networks and fly fresh batches to India with full temperature preservation and factory seals intact.
              </p>
            </div>
            <div className="pt-3 border-t border-pink-200/70 dark:border-zinc-750 text-[11px] font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
              <span>✓ 100% Factory-Sealed Direct Air Imports</span>
            </div>
          </div>

          {/* Card 3: Indian Heart */}
          <div className="rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-pink-200/70 dark:border-zinc-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/90 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl shadow-2xs">
                🪷
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
                  CHAPTER 03 &bull; भारत
                </span>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white mt-0.5">
                  Indian Appreciation
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                Indian consumers hold a deep appreciation for genuine quality, authentic self-care rituals, and honest brands. Konichiwa Mart exists to celebrate this curiosity with transparent pricing, official GST invoices, and warm customer care.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <span>✓ Pan-India Delivery Across 19,000+ Pincodes</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. THE FOUR PILLARS OF ROSHNI'S PROMISE */}
      <section className="mb-14 sm:mb-20 text-left">
        <div className="rounded-3xl bg-slate-900 dark:bg-black text-white p-6 sm:p-10 md:p-12 relative overflow-hidden border border-slate-800">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mb-8 space-y-2">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest block">
              OUR UNCOMPROMISING PROTOCOLS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
              What “Care & Attention to Detail” Means In Practice
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every principle Roshni learned in Okinawa is reflected in how your skincare is sourced, handled, and delivered.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Pillar 1 */}
            <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/80 dark:border-zinc-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-mono text-pink-400 font-bold uppercase">AUTHENTICITY</div>
              <h3 className="text-sm font-bold text-white">Direct Japan Dispensary Sourcing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Procured directly from authorized pharmaceutical dispensaries and drugstore chains in Japan. Zero gray-market brokers.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/80 dark:border-zinc-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <ThermometerSnowflake className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-mono text-blue-400 font-bold uppercase">INTEGRITY</div>
              <h3 className="text-sm font-bold text-white">Air Cargo & Cold-Chain Care</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Active J-Beauty ingredients like pure Vitamin C and ceramides easily oxidize in tropical shipping containers. We fly stock and store at 20°C.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/80 dark:border-zinc-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">FRESHNESS</div>
              <h3 className="text-sm font-bold text-white">Bi-Weekly Fresh Cycles</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rather than stockpiling years of old bulk inventory, we import frequent small air consignments so products were recently bottled in Japan.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/80 dark:border-zinc-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">COMPLIANCE</div>
              <h3 className="text-sm font-bold text-white">Official GST Invoices</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every bottle is officially cleared through Indian customs with import duties fully settled. Every order includes a verified GST Tax Invoice (PDF).
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section className="mb-14 sm:mb-20 text-left max-w-3xl mx-auto">
        <div className="text-center mb-6 space-y-1">
          <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider block">
            Clarity & Transparency
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Everything you need to know about our imports, freshness, and packaging.
          </p>
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
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-zinc-800 pt-3 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. CLOSING INVITATION CALL TO ACTION */}
      <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-pink-50 via-rose-50/70 to-pink-100/60 dark:from-[#1A1424] dark:via-[#161220] dark:to-[#181122] border border-pink-200 dark:border-zinc-800 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm mx-auto flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-zinc-700">
          <KonichiwaMartLogo size={42} />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            “Konichiwa Mart is my way of sharing a part of my Japan with India.”
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            Thank you for being a part of this beautiful journey. Explore Japan’s most loved skincare formulations, bottled with care and delivered with heart.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onNavigateToProducts}
            className="px-6 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-pink-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Japanese Skincare</span>
          </button>

          <button
            onClick={onOpenContact}
            className="px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-pink-50/50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-pink-500" />
            <span>Connect with Roshni & Team</span>
          </button>
        </div>
      </section>

    </div>
  );
};

