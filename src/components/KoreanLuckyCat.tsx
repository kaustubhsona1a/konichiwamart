import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Gift, Volume2, Copy, Check, X } from 'lucide-react';

interface KoreanLuckyCatProps {
  scrollStage?: number; // 0, 1, 2, 3
  onApplyCoupon?: (code: string) => void;
  floating?: boolean;
}

const CAT_QUOTES = [
  "Konichiwa! Waving good luck and glass skin blessings to you nya~ ✨",
  "Paws-itively obsessed with bio-fermented Tremella snow mushrooms! 🍄",
  "Did you know? Polyglutamic acid holds 5x more hydration than standard HA nya! 💧",
  "Tap my paw to claim the secret MEOW15 discount code! 🐾",
  "Your skin barrier deserves pure cold-pressed floral dew! 🌸",
  "0.02s Flash absorption—faster than a cat pounce! ⚡"
];

export const KoreanLuckyCat: React.FC<KoreanLuckyCatProps> = ({
  scrollStage = 0,
  onApplyCoupon,
  floating = false
}) => {
  const [isWaving, setIsWaving] = useState(true);
  const [mood, setMood] = useState<'happy' | 'wink' | 'love' | 'excited'>('happy');
  const [showBubble, setShowBubble] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Synchronize cat expression to scroll stage
  useEffect(() => {
    if (scrollStage === 0) {
      setMood('happy');
      setQuoteIndex(0);
    } else if (scrollStage === 1) {
      setMood('wink');
      setQuoteIndex(1);
    } else if (scrollStage === 2) {
      setMood('excited');
      setQuoteIndex(5);
    } else if (scrollStage === 3) {
      setMood('love');
      setQuoteIndex(3);
    }
  }, [scrollStage]);

  // Paw wave animation loop
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(prev => !prev);
    }, 450);
    return () => clearInterval(waveInterval);
  }, []);

  const handleCatClick = () => {
    // Generate celebratory sparkles
    const newSparkles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60 - 20
    }));
    setSparkles(newSparkles);
    setTimeout(() => setSparkles([]), 1200);

    // Cycle mood
    const moods: ('happy' | 'wink' | 'love' | 'excited')[] = ['love', 'excited', 'wink', 'happy'];
    setMood(moods[Math.floor(Math.random() * moods.length)]);
    setQuoteIndex(prev => (prev + 1) % CAT_QUOTES.length);
    setShowBubble(true);

    // Copy secret coupon code
    navigator.clipboard?.writeText('MEOW15');
    setCopiedCoupon(true);
    if (onApplyCoupon) onApplyCoupon('MEOW15');
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  return (
    <div className={`relative select-none ${floating ? 'fixed bottom-6 right-6 z-40' : 'inline-block'}`}>
      
      {/* Interactive Speech Bubble */}
      {showBubble && (
        <div 
          className={`absolute ${floating ? 'bottom-28 right-0' : '-top-20 -left-6 sm:left-1/2 sm:-translate-x-1/2'} z-50 w-56 sm:w-64 liquid-glass-rose rounded-2xl p-3 border border-white shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300`}
        >
          <div className="flex items-start justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-serif font-bold text-[#8E264E] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#E11D48] animate-pulse" />
              <span>Neko-chan • Konichiwa Cat</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
              className="text-[#9D687A] hover:text-[#421727] text-xs p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[11px] text-[#4A2031] font-medium leading-snug">
            {CAT_QUOTES[quoteIndex]}
          </p>

          {/* Secret coupon pill inside speech bubble */}
          <div 
            onClick={handleCatClick}
            className="mt-2 py-1 px-2.5 rounded-xl bg-white/90 border border-[#F3C4D6] hover:bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-1 text-[10px] text-[#A22855] font-semibold">
              <Gift className="w-3 h-3 text-[#E11D48]" />
              <span>Code: <strong className="font-mono tracking-wider text-[#E11D48]">MEOW15</strong> (15% Off)</span>
            </div>
            <span className="text-[10px] text-[#7C3650] flex items-center gap-0.5 group-hover:text-[#E11D48]">
              {copiedCoupon ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCoupon ? 'Copied!' : 'Copy'}</span>
            </span>
          </div>

          {/* Speech Bubble Tail */}
          <div className={`absolute ${floating ? '-bottom-2 right-8' : '-bottom-2 left-10 sm:left-1/2 sm:-translate-x-1/2'} w-3 h-3 bg-white border-b border-r border-[#F3C4D6] transform rotate-45`} />
        </div>
      )}

      {/* Bursting Sparkles on Click */}
      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className="absolute pointer-events-none z-50 text-[#E11D48] animate-ping"
          style={{
            transform: `translate(${sp.x}px, ${sp.y}px)`,
            transition: 'all 0.8s ease-out'
          }}
        >
          <Sparkles className="w-4 h-4 text-[#F43F5E]" />
        </div>
      ))}

      {/* THE CUTE KOREAN LUCKY CAT SVG CHARACTER */}
      <div 
        onClick={handleCatClick}
        className="group relative cursor-pointer filter drop-shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95"
        title="Tap Neko-chan for lucky blessings & 15% off coupon!"
      >
        {/* Ambient Halo Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFD1DC] to-[#FDE8EE] blur-md -z-10 group-hover:blur-lg opacity-70 transition-all" />

        <svg
          width={floating ? "88" : "110"}
          height={floating ? "88" : "110"}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Shadow beneath cat */}
          <ellipse cx="80" cy="145" rx="46" ry="9" fill="#2E111C" opacity="0.12" />

          {/* Body */}
          <path
            d="M 46 142 C 42 108 48 85 80 85 C 112 85 118 108 114 142 C 112 147 48 147 46 142 Z"
            fill="#FFFFFF"
            stroke="#261820"
            strokeWidth="3.5"
          />

          {/* Belly Fur Patch */}
          <ellipse cx="80" cy="122" rx="22" ry="16" fill="#FFF5F7" />

          {/* Left Ear */}
          <path
            d="M 52 56 L 36 24 C 34 20 40 18 46 22 L 68 44 Z"
            fill="#FFFFFF"
            stroke="#261820"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Left Inner Ear Pink */}
          <path d="M 48 48 L 40 28 L 58 40 Z" fill="#FDA4AF" />

          {/* Right Ear */}
          <path
            d="M 108 56 L 124 24 C 126 20 120 18 114 22 L 92 44 Z"
            fill="#FFFFFF"
            stroke="#261820"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Right Inner Ear Pink */}
          <path d="M 112 48 L 120 28 L 102 40 Z" fill="#FDA4AF" />

          {/* Head */}
          <ellipse
            cx="80"
            cy="60"
            rx="38"
            ry="31"
            fill="#FFFFFF"
            stroke="#261820"
            strokeWidth="3.5"
          />

          {/* EYES (Morph based on mood) */}
          {mood === 'happy' && (
            <g>
              {/* Smiling curved Korean kawaii eyes */}
              <path d="M 60 56 Q 67 48 74 56" stroke="#261820" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 86 56 Q 93 48 100 56" stroke="#261820" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          )}

          {mood === 'wink' && (
            <g>
              {/* Open sparkling anime eye on left, wink on right */}
              <circle cx="67" cy="54" r="5" fill="#261820" />
              <circle cx="65.5" cy="52" r="1.8" fill="#FFFFFF" />
              <path d="M 86 56 Q 93 48 100 56" stroke="#261820" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          )}

          {mood === 'love' && (
            <g>
              {/* Heart Eyes */}
              <path
                d="M 67 52 C 67 48 62 46 62 50 C 62 54 67 58 67 58 C 67 58 72 54 72 50 C 72 46 67 48 67 52 Z"
                fill="#E11D48"
              />
              <path
                d="M 93 52 C 93 48 88 46 88 50 C 88 54 93 58 93 58 C 93 58 98 54 98 50 C 98 46 93 48 93 52 Z"
                fill="#E11D48"
              />
            </g>
          )}

          {mood === 'excited' && (
            <g>
              {/* Wide sparkling anime eyes */}
              <ellipse cx="67" cy="54" rx="6" ry="7" fill="#261820" />
              <ellipse cx="93" cy="54" rx="6" ry="7" fill="#261820" />
              <circle cx="65" cy="51" r="2.5" fill="#FFFFFF" />
              <circle cx="91" cy="51" r="2.5" fill="#FFFFFF" />
              <circle cx="69" cy="56" r="1.2" fill="#FFFFFF" />
              <circle cx="95" cy="56" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Rosy Blushed Cheeks (Korean glass skin glow) */}
          <ellipse cx="56" cy="64" rx="7" ry="4" fill="#FB7185" opacity="0.65" />
          <ellipse cx="104" cy="64" rx="7" ry="4" fill="#FB7185" opacity="0.65" />

          {/* Cute Nose */}
          <polygon points="78,63 82,63 80,66" fill="#F43F5E" />

          {/* Cat Mouth (Cute :3 expression) */}
          <path
            d="M 74 67 Q 77 71 80 67 Q 83 71 86 67"
            stroke="#261820"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Whiskers */}
          <line x1="45" y1="60" x2="30" y2="58" stroke="#261820" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="66" x2="32" y2="69" stroke="#261820" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1="60" x2="130" y2="58" stroke="#261820" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1="66" x2="128" y2="69" stroke="#261820" strokeWidth="2" strokeLinecap="round" />

          {/* Red Lucky Collar */}
          <path
            d="M 52 86 C 68 95 92 95 108 86"
            stroke="#DC2626"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Golden Lucky Bell (Suzu) */}
          <g transform="translate(80, 96)">
            <circle cx="0" cy="0" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#92400E" strokeWidth="1.5" />
            <circle cx="0" cy="3" r="2" fill="#78350F" />
          </g>

          {/* Left Resting Paw holding a miniature glowing cosmetic elixir bottle */}
          <g transform="translate(48, 114)">
            {/* Paw */}
            <circle cx="0" cy="0" r="9" fill="#FFFFFF" stroke="#261820" strokeWidth="3" />
            <ellipse cx="-2" cy="0" rx="3" ry="4" fill="#FDA4AF" />

            {/* Glowing Mini Glass Elixir Bottle */}
            <g transform="translate(-16, -18) scale(0.65)">
              <rect x="0" y="8" width="16" height="24" rx="4" fill="#FCE7F3" stroke="#9D174D" strokeWidth="2" />
              <rect x="4" y="0" width="8" height="8" rx="2" fill="#9D174D" />
              <circle cx="8" cy="18" r="3" fill="#F43F5E" />
              <line x1="2" y1="12" x2="6" y2="24" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>

          {/* RIGHT WAVING LUCKY PAW (Maneki-Neko Beckoning Fortune) */}
          {/* Animated dynamically with isWaving state */}
          <g 
            transform={`translate(108, 108) rotate(${isWaving ? -18 : 6})`}
            style={{ 
              transformOrigin: '0px 10px',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }}
          >
            {/* Forearm */}
            <path
              d="M 0 0 C 8 -12 18 -26 22 -38 C 22 -44 14 -44 8 -40 C 2 -32 -4 -16 0 0 Z"
              fill="#FFFFFF"
              stroke="#261820"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Paw Tip */}
            <circle cx="15" cy="-38" r="9" fill="#FFFFFF" stroke="#261820" strokeWidth="3" />
            {/* Cute Pink Paw Pad */}
            <ellipse cx="15" cy="-38" rx="4" ry="5" fill="#FDA4AF" />
            <circle cx="10" cy="-44" r="1.8" fill="#FDA4AF" />
            <circle cx="15" cy="-46" r="1.8" fill="#FDA4AF" />
            <circle cx="20" cy="-44" r="1.8" fill="#FDA4AF" />
          </g>

          {/* Little Sakura Blossom on Cat's Ear */}
          <g transform="translate(42, 28) scale(0.7)">
            {[0, 72, 144, 216, 288].map((rot) => (
              <ellipse
                key={rot}
                cx="0"
                cy="-7"
                rx="3.5"
                ry="5"
                fill="#F472B6"
                transform={`rotate(${rot})`}
              />
            ))}
            <circle cx="0" cy="0" r="2.5" fill="#FFF1F2" />
          </g>
        </svg>

        {/* Lucky Cat Floating Badge */}
        <div className="text-center mt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#F3C4D6] text-[10px] font-serif font-bold text-[#8B264E] shadow-2xs">
            <span>Konichiwa Neko</span>
            <span className="text-[#E11D48] text-xs">🐾</span>
          </span>
        </div>

      </div>

    </div>
  );
};
