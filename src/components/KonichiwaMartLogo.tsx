import React from 'react';

interface KonichiwaMartLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const KonichiwaMartLogo: React.FC<KonichiwaMartLogoProps> = ({
  className = '',
  size = 40,
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Precision SVG Emblem matching the Konichiwa_Mart seal */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform hover:scale-105"
      >
        {/* Outer Circular Boundary */}
        <circle cx="200" cy="200" r="185" stroke="#16202C" strokeWidth="6" fill="#FFFDFD" />

        {/* Indian Tricolor Arch (Saffron / White / Green) */}
        <path
          d="M 120 70 A 160 160 0 0 1 360 190"
          stroke="#FF9933"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M 140 60 A 175 175 0 0 1 370 190"
          stroke="#138808"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Ashoka Chakra (Blue 24-spoke wheel) */}
        <g transform="translate(255, 105) scale(0.65)">
          <circle cx="0" cy="0" r="32" stroke="#000080" strokeWidth="4" fill="none" />
          <circle cx="0" cy="0" r="6" fill="#000080" />
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1="-30"
              x2="0"
              y2="30"
              stroke="#000080"
              strokeWidth="2.5"
              transform={`rotate(${i * 15})`}
            />
          ))}
        </g>

        {/* India Gate Silhouette (Sandstone Orange/Gold) */}
        <g transform="translate(270, 120) scale(0.55)">
          {/* Main Arch Base */}
          <path
            d="M 10 100 L 10 20 L 70 20 L 70 100 L 52 100 L 52 50 C 52 38 28 38 28 50 L 28 100 Z"
            fill="#D97706"
            stroke="#92400E"
            strokeWidth="3"
          />
          {/* Top cornice */}
          <rect x="0" y="10" width="80" height="12" fill="#B45309" rx="2" />
          <rect x="15" y="0" width="50" height="10" fill="#92400E" rx="2" />
        </g>

        {/* Japanese Pagoda Silhouette (Left) */}
        <g transform="translate(90, 70) scale(0.65)">
          {/* Spire */}
          <line x1="25" y1="0" x2="25" y2="30" stroke="#1E293B" strokeWidth="3" />
          {/* Roof 1 */}
          <path d="M 0 35 Q 25 25 50 35 L 42 45 L 8 45 Z" fill="#0F172A" />
          {/* Tier 1 */}
          <rect x="15" y="45" width="20" height="15" fill="#1E293B" />
          {/* Roof 2 */}
          <path d="M -5 60 Q 25 50 55 60 L 45 70 L 5 70 Z" fill="#0F172A" />
          {/* Tier 2 */}
          <rect x="12" y="70" width="26" height="15" fill="#1E293B" />
          {/* Roof 3 */}
          <path d="M -10 85 Q 25 73 60 85 L 50 95 L 0 95 Z" fill="#0F172A" />
          {/* Tier 3 */}
          <rect x="10" y="95" width="30" height="25" fill="#1E293B" />
        </g>

        {/* Cherry Blossom (Sakura) Branches on Left */}
        <g transform="translate(45, 110)">
          {/* Branch */}
          <path
            d="M 5 60 Q 25 40 50 35 Q 75 30 100 45"
            stroke="#451A03"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 35 45 Q 40 25 30 10"
            stroke="#451A03"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Pink blossoms */}
          {[[25, 10], [55, 30], [80, 42], [42, 38], [15, 52], [5, 65]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill="#F472B6" opacity="0.9" />
          ))}
          {[[25, 10], [55, 30], [80, 42], [42, 38], [15, 52], [5, 65]].map(([x, y], i) => (
            <circle key={`c-${i}`} cx={x} cy={y} r="2.5" fill="#FDF2F8" />
          ))}
        </g>

        {/* Red Japanese Sun (Hinomaru) */}
        <circle cx="175" cy="115" r="44" fill="#DC2626" />

        {/* Mount Fuji (Deep Indigo with Snow Cap) */}
        <g id="fuji">
          {/* Base Mountain */}
          <path
            d="M 60 205 Q 160 170 185 135 L 215 135 Q 240 170 340 205 L 340 215 L 60 215 Z"
            fill="#1E293B"
          />
          {/* Snow Summit */}
          <path
            d="M 175 145 L 185 135 L 215 135 L 225 145 L 218 160 L 210 150 L 200 162 L 190 152 L 182 160 Z"
            fill="#F8FAFC"
          />
        </g>

        {/* THE CUTE LUCKY CAT (Maneki-Neko / Korean & Japanese Cat) on Mt. Fuji */}
        <g id="lucky-cat" transform="translate(182, 92)">
          {/* Cat Body */}
          <path
            d="M 6 42 Q 6 22 20 22 Q 34 22 34 42 Z"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="2.5"
          />

          {/* Ears */}
          <path d="M 9 22 L 4 10 L 16 16 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M 7 19 L 6 12 L 14 16 Z" fill="#FDA4AF" />

          <path d="M 31 22 L 36 10 L 24 16 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M 33 19 L 34 12 L 26 16 Z" fill="#FDA4AF" />

          {/* Cat Head */}
          <ellipse cx="20" cy="24" rx="14" ry="12" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />

          {/* Happy Eyes (Smiling Arcs) */}
          <path d="M 12 22 Q 15 19 18 22" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 22 22 Q 25 19 28 22" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Blushing Cheeks */}
          <circle cx="11" cy="27" r="2.5" fill="#FB7185" opacity="0.6" />
          <circle cx="29" cy="27" r="2.5" fill="#FB7185" opacity="0.6" />

          {/* Cute Nose & Mouth */}
          <polygon points="19,25 21,25 20,27" fill="#E11D48" />
          <path d="M 18 28 Q 20 30 22 28" stroke="#1E293B" strokeWidth="1.5" fill="none" />

          {/* Whiskers */}
          <line x1="7" y1="24" x2="2" y2="23" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="7" y1="27" x2="3" y2="29" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="33" y1="24" x2="38" y2="23" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="33" y1="27" x2="37" y2="29" stroke="#1E293B" strokeWidth="1.5" />

          {/* Red Collar & Golden Bell */}
          <path d="M 10 34 Q 20 37 30 34" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          <circle cx="20" cy="37" r="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

          {/* Right Waving Paw (Beckoning Fortune / Maneki-Neko) */}
          <g id="waving-paw">
            <path
              d="M 31 28 Q 38 20 40 12 Q 38 8 34 10 Q 30 14 28 22 Z"
              fill="#FFFFFF"
              stroke="#1E293B"
              strokeWidth="2.5"
            />
            {/* Paw pads */}
            <ellipse cx="36" cy="12" rx="2" ry="2.5" fill="#FDA4AF" />
          </g>

          {/* Left resting paw */}
          <ellipse cx="10" cy="33" rx="3.5" ry="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
        </g>

        {/* LOGO TEXT: "Konichiwa" in Japanese Ink Style & "_Mart" in Bold Red */}
        <text
          x="200"
          y="255"
          textAnchor="middle"
          fill="#111827"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="900"
          fontSize="46"
          letterSpacing="-1"
        >
          Konichiwa
        </text>

        <text
          x="200"
          y="298"
          textAnchor="middle"
          fill="#DC2626"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="900"
          fontSize="48"
          letterSpacing="-0.5"
        >
          _Mart
        </text>

        {/* Underline Red Bar */}
        <rect x="95" y="293" width="34" height="6" fill="#DC2626" rx="2" />

        {/* Shopping Cart Icon at Bottom with Red Dot (Japanese Flag Motif) */}
        <g transform="translate(165, 325) scale(0.7)">
          <path
            d="M 0 5 L 12 5 L 24 38 L 75 38 L 85 14 L 18 14"
            stroke="#1E293B"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Cart Wheels */}
          <circle cx="32" cy="48" r="7" fill="#1E293B" />
          <circle cx="68" cy="48" r="7" fill="#1E293B" />
          {/* Japanese flag circle inside cart */}
          <circle cx="48" cy="26" r="8" fill="#DC2626" />
          <rect x="25" y="32" width="46" height="4" fill="#10B981" rx="1" />
        </g>
      </svg>

      {/* Optional brand text display alongside icon */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="font-serif font-black tracking-tight text-[#161616] text-xl sm:text-2xl">
            Konichiwa<span className="text-[#DC2626]">_Mart</span>
          </span>
          <span className="text-[10px] tracking-widest text-[#7B4457] uppercase font-sans font-medium mt-0.5">
            K-Beauty & J-Glow Dispensary
          </span>
        </div>
      )}
    </div>
  );
};
