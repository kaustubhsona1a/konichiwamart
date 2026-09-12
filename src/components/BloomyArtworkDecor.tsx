import React, { useEffect, useRef } from 'react';

interface BloomyArtworkDecorProps {
  className?: string;
}

interface DriftingPetal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  swayAmp: number;
  swayFreq: number;
  swayOffset: number;
  opacity: number;
  colorGrade: number;
}

export const BloomyArtworkDecor: React.FC<BloomyArtworkDecorProps> = ({
  className = 'absolute inset-0 pointer-events-none z-[1] overflow-hidden select-none'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic canvas-driven small sakura petal drift originating from the blossom branch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Dainty, realistic small sakura petals like real Kyoto cherry blossom falls
    const petals: DriftingPetal[] = [];
    const count = width < 768 ? 20 : 36;

    for (let i = 0; i < count; i++) {
      petals.push({
        x: width * 0.3 + Math.random() * (width * 0.75),
        y: Math.random() * (height * 0.95),
        size: 5 + Math.random() * 5, // Small, delicate petal size
        speedY: 0.5 + Math.random() * 0.7,
        speedX: -(0.35 + Math.random() * 0.65), // Soft leftward breeze drift
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.015 + Math.random() * 0.02,
        swayAmp: 0.8 + Math.random() * 1.5,
        swayFreq: 0.009 + Math.random() * 0.014,
        swayOffset: Math.random() * 100,
        opacity: 0.55 + Math.random() * 0.35,
        colorGrade: Math.floor(Math.random() * 3),
      });
    }

    let frame = 0;

    // Draw small authentic Somei-Yoshino petal with notched tip
    const drawSmallPetal = (c: CanvasRenderingContext2D, p: DriftingPetal) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.scale(1, Math.cos(p.flip));

      const s = p.size;
      const grad = c.createRadialGradient(0, s * 0.2, 0, 0, 0, s);
      
      if (p.colorGrade === 0) {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
        grad.addColorStop(0.65, 'rgba(254, 226, 236, 0.9)');
        grad.addColorStop(1, 'rgba(244, 114, 182, 0.6)');
      } else if (p.colorGrade === 1) {
        grad.addColorStop(0, 'rgba(255, 245, 248, 0.95)');
        grad.addColorStop(0.6, 'rgba(251, 207, 232, 0.88)');
        grad.addColorStop(1, 'rgba(251, 113, 133, 0.7)');
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
        grad.addColorStop(0.7, 'rgba(249, 168, 212, 0.88)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.65)');
      }

      c.fillStyle = grad;

      c.beginPath();
      c.moveTo(0, s);
      c.bezierCurveTo(-s * 0.6, s * 0.45, -s * 0.7, -s * 0.45, -s * 0.26, -s * 0.92);
      c.quadraticCurveTo(0, -s * 0.7, s * 0.26, -s * 0.92);
      c.bezierCurveTo(s * 0.7, -s * 0.45, s * 0.6, s * 0.45, 0, s);
      c.closePath();
      c.fill();

      // Subtle translucent vein
      c.strokeStyle = 'rgba(255, 225, 238, 0.5)';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(0, s * 0.8);
      c.quadraticCurveTo(0, 0, 0, -s * 0.55);
      c.stroke();

      c.restore();
    };

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const naturalBreeze = Math.sin(frame * 0.006) * 0.4;

      petals.forEach(p => {
        const sway = Math.sin(frame * p.swayFreq + p.swayOffset) * p.swayAmp;
        p.x += p.speedX + naturalBreeze + sway * 0.2;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        if (p.y > height + 20 || p.x < -20) {
          p.y = Math.random() * (height * 0.35) - 15;
          p.x = width * 0.55 + Math.random() * (width * 0.5);
        }

        ctx.globalAlpha = p.opacity;
        drawSmallPetal(ctx, p);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={className}>
      {/* 
        AUTHENTIC KYOTO SAKURA CANOPY:
        - Modeled after authentic Kyoto cherry blossom photography (Ninenzaka / Chawanzaka)
        - Hundreds of delicate, small, dense sakura blossoms forming fluffy blooming clouds
        - Anatomically accurate Somei-Yoshino 5-notched petals, crimson calyxes, and golden stamens
        - Background depth-of-field bokeh clusters + crisp foreground branches and twigs
        - Sunset peach-pink ambient glow matching Kyoto dusk
      */}

      {/* Atmospheric Kyoto Sunset Glow in Upper Right Corner */}
      <div 
        className="absolute top-0 right-0 w-[340px] sm:w-[580px] md:w-[750px] h-[300px] sm:h-[500px] md:h-[620px] pointer-events-none select-none blur-3xl opacity-70"
        style={{
          background: 'radial-gradient(circle at 85% 15%, rgba(254, 215, 170, 0.45) 0%, rgba(251, 207, 232, 0.5) 35%, rgba(255, 241, 245, 0.25) 65%, transparent 80%)'
        }}
      />

      {/* Dynamic Drifting Small Petals Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-[2]" 
      />

      {/* Kyoto Sakura Tree Canopy (Top-Right Natural Drape) */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[540px] md:w-[700px] lg:w-[840px] h-[300px] sm:h-[520px] md:h-[640px] pointer-events-none select-none z-[1] animate-blossom-sway">
        <svg 
          viewBox="0 0 900 700" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-xs"
        >
          <defs>
            {/* Soft Petal Gradients for authentic Somei-Yoshino blossoms */}
            <linearGradient id="sakuraPetalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FBCFE8" stopOpacity="0.96" />
              <stop offset="35%" stopColor="#FCE7F3" stopOpacity="0.97" />
              <stop offset="80%" stopColor="#FFF5F8" stopOpacity="0.99" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="sakuraPetalBlush" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="0.92" />
              <stop offset="40%" stopColor="#F9A8D4" stopOpacity="0.96" />
              <stop offset="85%" stopColor="#FFF0F5" stopOpacity="0.99" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="sakuraBudGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#BE185D" />
              <stop offset="60%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#FCE7F3" />
            </linearGradient>

            {/* Organic Bark Wood Gradient */}
            <linearGradient id="woodBarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#25160E" />
              <stop offset="45%" stopColor="#3E2416" />
              <stop offset="70%" stopColor="#301B0F" />
              <stop offset="100%" stopColor="#1E100A" />
            </linearGradient>

            <linearGradient id="woodBarkHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5C3A24" />
              <stop offset="100%" stopColor="#2D170D" />
            </linearGradient>

            {/* Calyx & Pedicel (Stem) */}
            <linearGradient id="calyxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#881337" />
              <stop offset="100%" stopColor="#4C0519" />
            </linearGradient>

            {/* Photographic Depth of Field Filter for Background Blossom Clouds */}
            <filter id="sakuraBokeh" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>

            <filter id="sakuraSoftGaze" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>

            {/* 1. Small Individual Notched Sakura Petal (~10 units long) */}
            <path
              id="smallNotchedPetal"
              d="M0,0 C-2.6,-3.2 -3.8,-7.8 -1.5,-10.8 C-0.5,-11.5 0,-11 0,-10.2 C0,-11 0.5,-11.5 1.5,-10.8 C3.8,-7.8 2.6,-3.2 0,0 Z"
            />

            {/* 2. Realistic Small Front-Facing Cherry Blossom (~20 units diameter) */}
            <g id="miniBlossomFront">
              <g transform="rotate(0)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" /></g>
              <g transform="rotate(72)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalBlush)" /></g>
              <g transform="rotate(144)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" /></g>
              <g transform="rotate(216)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalBlush)" /></g>
              <g transform="rotate(288)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" /></g>

              {/* Crimson Center Eye */}
              <circle cx="0" cy="0" r="1.8" fill="#9F1239" />
              <circle cx="0" cy="0" r="0.9" fill="#4C0519" />

              {/* Fine Micro Stamens & Golden Anthers */}
              {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const len = 3.2 + (i % 2) * 1.2;
                const x = Math.cos(rad) * len;
                const y = Math.sin(rad) * len;
                return (
                  <g key={`stamen-${i}`}>
                    <line x1="0" y1="0" x2={x} y2={y} stroke="#FB7185" strokeWidth="0.4" strokeOpacity="0.8" />
                    <circle cx={x} cy={y} r="0.5" fill="#F59E0B" />
                  </g>
                );
              })}
            </g>

            {/* 3. Small Profile/Angled Blossom with delicate pedicel stem */}
            <g id="miniBlossomProfile">
              {/* Slender red-brown pedicel stem */}
              <path d="M0,0 Q-4,-6 -8,-14" stroke="url(#calyxGrad)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <g transform="translate(-8, -14)">
                {/* Crimson Calyx cup */}
                <path d="M0,0 L-2,-3 L0,-2 L2,-3 Z" fill="#881337" />
                {/* Petals cupped in profile */}
                <path d="M0,-1.5 C-4.5,-5 -6,-10 -3.5,-13 C-1.5,-11.5 -1,-7 0,-1.5" fill="url(#sakuraPetalBlush)" opacity="0.9" />
                <path d="M0,-1.5 C4.5,-5 6,-10 3.5,-13 C1.5,-11.5 1,-7 0,-1.5" fill="url(#sakuraPetalGrad)" opacity="0.92" />
                <path d="M-0.8,-1 C-2,-6 -3.5,-12 0,-14.5 C3.5,-12 2,-6 0.8,-1" fill="url(#sakuraPetalGrad)" opacity="0.97" />
                <circle cx="-1" cy="-7" r="0.4" fill="#F59E0B" />
                <circle cx="1" cy="-8" r="0.4" fill="#F59E0B" />
              </g>
            </g>

            {/* 4. Small Spring Sakura Bud */}
            <g id="miniBud">
              <path d="M0,0 Q-2,-4 -3.5,-8" stroke="url(#calyxGrad)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <g transform="translate(-3.5, -8)">
                <path d="M-1.5,0 L-2.5,-3.5 L-1,-2.5 L0,0" fill="#365314" />
                <path d="M1.5,0 L2.5,-3.5 L1,-2.5 L0,0" fill="#365314" />
                <path d="M-1.5,-1.5 C-2.5,-5 0,-8 1,-8 C2,-8 2.5,-5 1.5,-1.5 Z" fill="url(#sakuraBudGrad)" />
              </g>
            </g>

            {/* 5. Botanical Corymb: DENSE CLUSTER of 5-6 small florets (Real Japanese Sakura pattern) */}
            <g id="blossomClusterDense">
              <g transform="translate(-8, -4)"><use href="#miniBlossomProfile" transform="rotate(-30) scale(0.95)" /></g>
              <g transform="translate(6, -6)"><use href="#miniBlossomProfile" transform="rotate(35) scale(0.9)" /></g>
              <g transform="translate(-5, 4)"><use href="#miniBlossomFront" transform="rotate(18) scale(1.05)" /></g>
              <g transform="translate(7, 3)"><use href="#miniBlossomFront" transform="rotate(-40) scale(0.95)" /></g>
              <g transform="translate(0, -5)"><use href="#miniBlossomFront" transform="rotate(75) scale(1.1)" /></g>
              <g transform="translate(-10, -10)"><use href="#miniBud" transform="rotate(-20)" /></g>
              <g transform="translate(11, -8)"><use href="#miniBud" transform="rotate(25)" /></g>
            </g>

            {/* 6. Botanical Spray: Cascading cluster of 4-5 small florets */}
            <g id="blossomSpray">
              <g transform="translate(-6, -8)"><use href="#miniBlossomProfile" transform="rotate(-45) scale(0.9)" /></g>
              <g transform="translate(0, -3)"><use href="#miniBlossomFront" transform="rotate(12) scale(1.0)" /></g>
              <g transform="translate(-7, 6)"><use href="#miniBlossomFront" transform="rotate(65) scale(0.95)" /></g>
              <g transform="translate(7, 2)"><use href="#miniBlossomFront" transform="rotate(-25) scale(1.05)" /></g>
              <g transform="translate(2, 9)"><use href="#miniBlossomProfile" transform="rotate(60) scale(0.85)" /></g>
              <g transform="translate(10, -6)"><use href="#miniBud" transform="rotate(40)" /></g>
            </g>

            {/* 7. Drooping Fluffy Cluster: Hanging blooms like in Kyoto weeping cherry (Shidarezakura) */}
            <g id="blossomDroop">
              <path d="M0,0 Q-2,10 -5,18" stroke="url(#calyxGrad)" strokeWidth="0.8" fill="none" />
              <path d="M0,0 Q4,12 8,22" stroke="url(#calyxGrad)" strokeWidth="0.8" fill="none" />
              <g transform="translate(-5, 18)"><use href="#miniBlossomProfile" transform="rotate(160) scale(0.95)" /></g>
              <g transform="translate(8, 22)"><use href="#miniBlossomProfile" transform="rotate(145) scale(0.9)" /></g>
              <g transform="translate(0, 8)"><use href="#miniBlossomFront" transform="rotate(30) scale(1.0)" /></g>
              <g transform="translate(-8, 8)"><use href="#miniBlossomFront" transform="rotate(-15) scale(0.92)" /></g>
              <g transform="translate(6, 12)"><use href="#miniBlossomFront" transform="rotate(85) scale(1.05)" /></g>
            </g>

            {/* 8. Soft Background Blossom Bokeh Cloud (Simulating thousands of blossoms in the distance) */}
            <g id="bokehBlossomCloud" filter="url(#sakuraBokeh)" opacity="0.6">
              <circle cx="0" cy="0" r="22" fill="#FBCFE8" />
              <circle cx="-14" cy="-8" r="18" fill="#FCE7F3" />
              <circle cx="16" cy="-6" r="16" fill="#F9A8D4" />
              <circle cx="-8" cy="14" r="18" fill="#FFF0F5" />
              <circle cx="12" cy="12" r="15" fill="#FCE7F3" />
              <circle cx="0" cy="-14" r="14" fill="#F472B6" />
            </g>
          </defs>

          {/* LAYER 1: Dreamy Out-of-Focus Background Blossom Clouds (Creating photographic depth of field like Kyoto photo) */}
          <g id="depthBlossomClouds">
            <g transform="translate(820, 40)"><use href="#bokehBlossomCloud" transform="scale(1.5)" /></g>
            <g transform="translate(740, 80)"><use href="#bokehBlossomCloud" transform="scale(1.3)" /></g>
            <g transform="translate(660, 110)"><use href="#bokehBlossomCloud" transform="scale(1.2)" /></g>
            <g transform="translate(580, 130)"><use href="#bokehBlossomCloud" transform="scale(1.1)" /></g>
            <g transform="translate(500, 170)"><use href="#bokehBlossomCloud" transform="scale(1.0)" /></g>
            <g transform="translate(420, 230)"><use href="#bokehBlossomCloud" transform="scale(0.9)" /></g>
            <g transform="translate(340, 310)"><use href="#bokehBlossomCloud" transform="scale(0.85)" /></g>
            <g transform="translate(280, 400)"><use href="#bokehBlossomCloud" transform="scale(0.75)" /></g>
          </g>

          {/* LAYER 2: Authentic Gnarled Cherry Tree Wood Branches */}
          <g id="naturalCherryBoughs">
            {/* Main Arching Bough (Top right to center-down) */}
            <path
              d="M920,-20 
                 C830,30 740,65 650,100 
                 C560,130 500,165 420,230 
                 C355,280 305,350 250,450
                 C258,446 315,340 410,235
                 C510,140 610,105 710,60
                 C800,20 860,-10 920,-20 Z"
              fill="url(#woodBarkGrad)"
            />

            {/* Bark Texture & Organic Highlights */}
            <path
              d="M870,5 C780,45 680,85 590,120 C490,160 420,225 350,320 C310,380 275,440 255,448"
              stroke="url(#woodBarkHighlight)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M720,70 C640,100 560,135 480,190 C420,240 370,310 330,380"
              stroke="#1C0E07"
              strokeWidth="1.4"
              fill="none"
              opacity="0.5"
            />

            {/* Branch 1: Upper Canopy Sprig (Reaching leftward along top) */}
            <path
              d="M710,75 C640,50 570,35 480,40 C420,45 370,70 310,105"
              stroke="url(#woodBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M540,40 C480,20 420,15 350,22"
              stroke="url(#woodBarkGrad)"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M370,70 C330,60 290,65 250,80"
              stroke="url(#woodBarkGrad)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Branch 2: Mid Cascading Bough */}
            <path
              d="M560,130 C500,180 460,230 420,300 C390,350 370,410 355,470"
              stroke="url(#woodBarkGrad)"
              strokeWidth="3.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M440,260 C390,290 350,340 320,400"
              stroke="url(#woodBarkGrad)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Branch 3: Lower Graceful Drooping Twigs */}
            <path
              d="M410,240 C350,270 290,325 250,395 C225,440 200,500 180,560"
              stroke="url(#woodBarkGrad)"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M270,360 C230,385 195,430 165,490"
              stroke="url(#woodBarkGrad)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M210,480 C185,505 160,545 140,590"
              stroke="url(#woodBarkGrad)"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />

            {/* Fine slender twigs spreading outward */}
            <path d="M480,40 Q445,20 410,18" stroke="url(#woodBarkGrad)" strokeWidth="1.6" fill="none" />
            <path d="M350,22 Q315,15 280,20" stroke="url(#woodBarkGrad)" strokeWidth="1.4" fill="none" />
            <path d="M310,105 Q275,115 240,135" stroke="url(#woodBarkGrad)" strokeWidth="1.6" fill="none" />
            <path d="M420,300 Q375,325 340,345" stroke="url(#woodBarkGrad)" strokeWidth="1.8" fill="none" />
            <path d="M355,470 Q335,505 310,540" stroke="url(#woodBarkGrad)" strokeWidth="1.5" fill="none" />
            <path d="M250,395 Q215,410 185,435" stroke="url(#woodBarkGrad)" strokeWidth="1.6" fill="none" />
            <path d="M180,560 Q155,585 130,620" stroke="url(#woodBarkGrad)" strokeWidth="1.4" fill="none" />
          </g>

          {/* LAYER 3: Midground Soft Blossom Clusters (Subtle Soft-Gaze Filter for Rich Depth) */}
          <g id="midgroundBlossomFill" filter="url(#sakuraSoftGaze)" opacity="0.85">
            <g transform="translate(850, 20)"><use href="#blossomClusterDense" transform="scale(1.2)" /></g>
            <g transform="translate(800, 45)"><use href="#blossomSpray" transform="scale(1.15) rotate(15)" /></g>
            <g transform="translate(730, 70)"><use href="#blossomClusterDense" transform="scale(1.25) rotate(-20)" /></g>
            <g transform="translate(680, 95)"><use href="#blossomDroop" transform="scale(1.2) rotate(10)" /></g>
            <g transform="translate(620, 115)"><use href="#blossomClusterDense" transform="scale(1.3) rotate(35)" /></g>
            <g transform="translate(560, 135)"><use href="#blossomSpray" transform="scale(1.2) rotate(-15)" /></g>
            <g transform="translate(500, 160)"><use href="#blossomClusterDense" transform="scale(1.25) rotate(45)" /></g>
            <g transform="translate(450, 195)"><use href="#blossomDroop" transform="scale(1.15) rotate(-25)" /></g>
            <g transform="translate(390, 240)"><use href="#blossomClusterDense" transform="scale(1.2) rotate(30)" /></g>
            <g transform="translate(340, 290)"><use href="#blossomSpray" transform="scale(1.1) rotate(60)" /></g>
            <g transform="translate(290, 350)"><use href="#blossomDroop" transform="scale(1.15) rotate(20)" /></g>
            <g transform="translate(240, 410)"><use href="#blossomClusterDense" transform="scale(1.1) rotate(-40)" /></g>
            <g transform="translate(190, 480)"><use href="#blossomSpray" transform="scale(1.05) rotate(15)" /></g>
          </g>

          {/* LAYER 4: Foreground CRISP, DENSE SMALL BLOSSOM CANOPY (Real Kyoto Photography Atmosphere) */}
          <g id="foregroundKyotoBlossoms">
            {/* Top Branch 1: Upper Skyward Drift */}
            <g transform="translate(520, 25)"><use href="#blossomClusterDense" transform="scale(1.1) rotate(-10)" /></g>
            <g transform="translate(460, 28)"><use href="#blossomSpray" transform="scale(1.05) rotate(20)" /></g>
            <g transform="translate(400, 25)"><use href="#blossomClusterDense" transform="scale(1.15) rotate(-35)" /></g>
            <g transform="translate(340, 20)"><use href="#blossomSpray" transform="scale(0.95) rotate(15)" /></g>
            <g transform="translate(290, 22)"><use href="#miniBlossomFront" transform="scale(1.2) rotate(45)" /></g>
            <g transform="translate(270, 20)"><use href="#miniBud" transform="rotate(-30)" /></g>

            {/* Upper-Mid Sprig */}
            <g transform="translate(470, 65)"><use href="#blossomClusterDense" transform="scale(1.1) rotate(40)" /></g>
            <g transform="translate(420, 60)"><use href="#blossomSpray" transform="scale(1.15) rotate(-15)" /></g>
            <g transform="translate(370, 75)"><use href="#blossomDroop" transform="scale(1.05) rotate(25)" /></g>
            <g transform="translate(320, 95)"><use href="#blossomClusterDense" transform="scale(1.1) rotate(-20)" /></g>
            <g transform="translate(275, 115)"><use href="#blossomSpray" transform="scale(1.0) rotate(50)" /></g>
            <g transform="translate(235, 130)"><use href="#miniBlossomFront" transform="scale(1.1) rotate(10)" /></g>
            <g transform="translate(220, 135)"><use href="#miniBud" transform="rotate(-45)" /></g>

            {/* Main Center Bough Dense Flower Canopy */}
            <g transform="translate(780, 50)"><use href="#blossomClusterDense" transform="scale(1.2) rotate(10)" /></g>
            <g transform="translate(750, 75)"><use href="#blossomSpray" transform="scale(1.15) rotate(-25)" /></g>
            <g transform="translate(700, 85)"><use href="#blossomClusterDense" transform="scale(1.25) rotate(30)" /></g>
            <g transform="translate(650, 105)"><use href="#blossomDroop" transform="scale(1.2) rotate(-10)" /></g>
            <g transform="translate(600, 120)"><use href="#blossomClusterDense" transform="scale(1.2) rotate(45)" /></g>
            <g transform="translate(550, 140)"><use href="#blossomSpray" transform="scale(1.15) rotate(-30)" /></g>
            <g transform="translate(510, 155)"><use href="#blossomClusterDense" transform="scale(1.3) rotate(15)" /></g>
            <g transform="translate(460, 180)"><use href="#blossomDroop" transform="scale(1.2) rotate(40)" /></g>
            <g transform="translate(420, 215)"><use href="#blossomClusterDense" transform="scale(1.25) rotate(-15)" /></g>
            <g transform="translate(375, 255)"><use href="#blossomSpray" transform="scale(1.15) rotate(25)" /></g>

            {/* Cascading Mid Bough */}
            <g transform="translate(480, 210)"><use href="#blossomClusterDense" transform="scale(1.15) rotate(60)" /></g>
            <g transform="translate(440, 260)"><use href="#blossomSpray" transform="scale(1.1) rotate(-20)" /></g>
            <g transform="translate(400, 310)"><use href="#blossomDroop" transform="scale(1.2) rotate(35)" /></g>
            <g transform="translate(365, 360)"><use href="#blossomClusterDense" transform="scale(1.15) rotate(-10)" /></g>
            <g transform="translate(345, 420)"><use href="#blossomSpray" transform="scale(1.05) rotate(45)" /></g>
            <g transform="translate(330, 480)"><use href="#blossomDroop" transform="scale(1.0) rotate(15)" /></g>
            <g transform="translate(305, 540)"><use href="#miniBlossomFront" transform="scale(1.1) rotate(-30)" /></g>
            <g transform="translate(295, 550)"><use href="#miniBud" transform="rotate(25)" /></g>

            {/* Lower Graceful Branch (Drooping toward viewer) */}
            <g transform="translate(330, 270)"><use href="#blossomClusterDense" transform="scale(1.15) rotate(15)" /></g>
            <g transform="translate(290, 315)"><use href="#blossomSpray" transform="scale(1.2) rotate(-35)" /></g>
            <g transform="translate(250, 365)"><use href="#blossomDroop" transform="scale(1.15) rotate(40)" /></g>
            <g transform="translate(220, 415)"><use href="#blossomClusterDense" transform="scale(1.1) rotate(-15)" /></g>
            <g transform="translate(185, 465)"><use href="#blossomSpray" transform="scale(1.1) rotate(30)" /></g>
            <g transform="translate(155, 515)"><use href="#blossomDroop" transform="scale(1.05) rotate(-20)" /></g>
            <g transform="translate(130, 570)"><use href="#blossomClusterDense" transform="scale(0.95) rotate(45)" /></g>
            <g transform="translate(115, 620)"><use href="#miniBlossomFront" transform="scale(1.0) rotate(10)" /></g>
            <g transform="translate(105, 630)"><use href="#miniBud" transform="rotate(-15)" /></g>

            {/* Organic individual accent florets and buds along branches */}
            <g transform="translate(730, 110)"><use href="#miniBlossomFront" transform="scale(0.95) rotate(120)" /></g>
            <g transform="translate(670, 130)"><use href="#miniBlossomProfile" transform="scale(1.0) rotate(-65)" /></g>
            <g transform="translate(590, 160)"><use href="#miniBlossomFront" transform="scale(1.05) rotate(80)" /></g>
            <g transform="translate(530, 185)"><use href="#miniBlossomProfile" transform="scale(0.9) rotate(25)" /></g>
            <g transform="translate(470, 230)"><use href="#miniBlossomFront" transform="scale(1.0) rotate(-45)" /></g>
            <g transform="translate(380, 210)"><use href="#miniBlossomProfile" transform="scale(0.95) rotate(110)" /></g>
            <g transform="translate(310, 240)"><use href="#miniBlossomFront" transform="scale(0.9) rotate(15)" /></g>
            <g transform="translate(260, 280)"><use href="#miniBlossomProfile" transform="scale(1.0) rotate(-80)" /></g>
            <g transform="translate(200, 350)"><use href="#miniBlossomFront" transform="scale(0.95) rotate(55)" /></g>
            <g transform="translate(160, 420)"><use href="#miniBlossomProfile" transform="scale(0.9) rotate(35)" /></g>
          </g>

          {/* LAYER 5: Swirling Detaching Blossoms & Petals floating off the branches */}
          <g id="swirlingBranchPetals" opacity="0.85">
            <g transform="translate(280, 120) rotate(-35)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" transform="scale(0.9)" /></g>
            <g transform="translate(230, 170) rotate(40)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalBlush)" transform="scale(0.85)" /></g>
            <g transform="translate(190, 240) rotate(-60)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" transform="scale(0.95)" /></g>
            <g transform="translate(150, 310) rotate(15)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalBlush)" transform="scale(0.8)" /></g>
            <g transform="translate(130, 400) rotate(75)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" transform="scale(0.9)" /></g>
            <g transform="translate(100, 480) rotate(-20)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalBlush)" transform="scale(0.85)" /></g>
            <g transform="translate(80, 560) rotate(45)"><use href="#smallNotchedPetal" fill="url(#sakuraPetalGrad)" transform="scale(0.75)" /></g>
          </g>
        </svg>
      </div>
    </div>
  );
};
