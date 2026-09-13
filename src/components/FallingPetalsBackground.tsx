import React, { useEffect, useRef, useState } from 'react';
import { Wind, Play, Pause } from 'lucide-react';

interface Petal {
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
  colorType: number; // 0: Pure white blossom, 1: Soft blush pink, 2: Pale sakura rose, 3: Full 5-petal flower, 4: Pollen glow
  depth: number; // 0.6 (far) to 1.3 (near)
}

interface FallingPetalsBackgroundProps {
  initialActive?: boolean;
  isActive?: boolean;
  breezeMode?: 'still' | 'gentle' | 'fresh' | 'vibrant';
  density?: 'low' | 'medium' | 'high';
}

export const FallingPetalsBackground: React.FC<FallingPetalsBackgroundProps> = ({
  initialActive = false,
  isActive: propIsActive,
  breezeMode: propBreezeMode,
  density = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalActive, setInternalActive] = useState(initialActive);
  const [internalBreeze, setInternalBreeze] = useState<'still' | 'gentle' | 'fresh' | 'vibrant'>('gentle');

  const active = propIsActive !== undefined ? propIsActive : internalActive;
  const currentBreeze = propBreezeMode !== undefined ? propBreezeMode : internalBreeze;

  const petalsRef = useRef<Petal[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const mouseWindRef = useRef<{ x: number; targetX: number }>({ x: 0, targetX: 0 });

  // Initialize petals
  const initPetals = (width: number, height: number) => {
    const isMobile = width < 768;
    let count = 50;
    if (density === 'low') {
      count = isMobile ? 18 : 26;
    } else if (density === 'high') {
      count = isMobile ? 55 : 95;
    } else {
      count = isMobile ? 32 : 55;
    }

    const petals: Petal[] = [];

    for (let i = 0; i < count; i++) {
      const depth = 0.6 + Math.random() * 0.7; // 0.6 - 1.3
      const isFullFlower = Math.random() < 0.12; // 12% are full 5-petal flowers
      const isPollen = Math.random() < 0.18; // 18% are ambient pollen sparkles

      petals.push({
        x: Math.random() * width,
        y: Math.random() * height - (Math.random() * 200),
        size: isPollen 
          ? 1.5 + Math.random() * 2 
          : isFullFlower 
            ? (9 + Math.random() * 5) * depth 
            : (6 + Math.random() * 5) * depth,
        speedY: (0.7 + Math.random() * 1.3) * depth,
        speedX: (Math.random() - 0.4) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.015 + Math.random() * 0.03,
        swayAmp: 1.2 + Math.random() * 2.2,
        swayFreq: 0.01 + Math.random() * 0.015,
        swayOffset: Math.random() * 100,
        opacity: isPollen ? 0.4 + Math.random() * 0.4 : 0.65 + Math.random() * 0.35,
        colorType: isPollen ? 4 : isFullFlower ? 3 : Math.floor(Math.random() * 3),
        depth
      });
    }

    petalsRef.current = petals;
  };

  useEffect(() => {
    if (!active) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    initPetals(width, height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initPetals(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Gentle wind nudge based on horizontal mouse movement
      const normalizedX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseWindRef.current.targetX = normalizedX * 1.8;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Draw a single sakura petal with authentic natural curvature
    const drawSinglePetal = (
      c: CanvasRenderingContext2D, 
      p: Petal, 
      colorA: string, 
      colorB: string
    ) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.scale(1, Math.cos(p.flip));

      const grad = c.createRadialGradient(0, -p.size * 0.4, 1, 0, 0, p.size);
      grad.addColorStop(0, colorA);
      grad.addColorStop(0.7, colorB);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

      c.fillStyle = grad;
      c.shadowColor = 'rgba(180, 210, 235, 0.35)';
      c.shadowBlur = 4 * p.depth;

      c.beginPath();
      // Natural cherry blossom petal with subtle cleft at tip
      const s = p.size;
      c.moveTo(0, s);
      c.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.8, -s * 0.4, -s * 0.25, -s * 0.9);
      c.quadraticCurveTo(0, -s * 0.75, s * 0.25, -s * 0.9);
      c.bezierCurveTo(s * 0.8, -s * 0.4, s * 0.7, s * 0.5, 0, s);
      c.closePath();
      c.fill();

      // Delicate petal central vein
      c.strokeStyle = 'rgba(255, 230, 240, 0.4)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(0, s * 0.8);
      c.quadraticCurveTo(0, 0, 0, -s * 0.6);
      c.stroke();

      c.restore();
    };

    // Draw full 5-petal blooming cherry blossom
    const drawFullFlower = (c: CanvasRenderingContext2D, p: Petal) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.scale(Math.cos(p.flip * 0.6) * 0.4 + 0.6, 1);

      const petalLen = p.size * 0.5;

      for (let i = 0; i < 5; i++) {
        c.save();
        c.rotate((i * Math.PI * 2) / 5);

        const grad = c.createLinearGradient(0, 0, 0, -petalLen);
        grad.addColorStop(0, 'rgba(255, 220, 235, 0.95)');
        grad.addColorStop(0.4, 'rgba(255, 245, 250, 0.92)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
        c.fillStyle = grad;

        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(-petalLen * 0.55, -petalLen * 0.3, -petalLen * 0.6, -petalLen * 0.8, -petalLen * 0.2, -petalLen);
        c.quadraticCurveTo(0, -petalLen * 0.85, petalLen * 0.2, -petalLen);
        c.bezierCurveTo(petalLen * 0.6, -petalLen * 0.8, petalLen * 0.55, -petalLen * 0.3, 0, 0);
        c.closePath();
        c.fill();
        c.restore();
      }

      // Golden floral core pistil / stamen dots
      c.fillStyle = '#E89F48';
      c.beginPath();
      c.arc(0, 0, p.size * 0.12, 0, Math.PI * 2);
      c.fill();

      // Tiny stamen lines
      c.strokeStyle = '#D97706';
      c.lineWidth = 0.8;
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI * 2) / 6;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(angle) * (p.size * 0.2), Math.sin(angle) * (p.size * 0.2));
        c.stroke();
      }

      c.restore();
    };

    // Draw ambient pollen mote / sparkle
    const drawPollen = (c: CanvasRenderingContext2D, p: Petal) => {
      c.save();
      c.translate(p.x, p.y);
      const rad = c.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
      rad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      rad.addColorStop(0.4, 'rgba(254, 235, 242, 0.6)');
      rad.addColorStop(1, 'rgba(220, 240, 255, 0)');

      c.fillStyle = rad;
      c.beginPath();
      c.arc(0, 0, p.size * 2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    let step = 0;

    const render = () => {
      step++;
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp mouse wind
      const windDiff = mouseWindRef.current.targetX - mouseWindRef.current.x;
      mouseWindRef.current.x += windDiff * 0.05;

      // Base breeze factor
      const breezeMultiplier = 
        currentBreeze === 'vibrant' ? 2.6 :
        currentBreeze === 'fresh' ? 1.7 : 
        currentBreeze === 'still' ? 0.25 : 1.0;

      const naturalWind = Math.sin(step * 0.008) * 0.6 * breezeMultiplier + (mouseWindRef.current.x * 0.5);

      if (active) {
        petalsRef.current.forEach((p) => {
          // Physics step
          const sway = Math.sin(step * p.swayFreq + p.swayOffset) * p.swayAmp;
          p.x += (p.speedX + naturalWind + sway * 0.3) * breezeMultiplier;
          p.y += (p.speedY * breezeMultiplier);
          p.rotation += p.rotationSpeed * breezeMultiplier;
          p.flip += p.flipSpeed * breezeMultiplier;

          // Wrap around edges smoothly
          if (p.y > height + 40) {
            p.y = -30;
            p.x = Math.random() * (width + 100) - 50;
          }
          if (p.x > width + 50) {
            p.x = -40;
          } else if (p.x < -50) {
            p.x = width + 40;
          }

          // Rendering based on petal type
          ctx.globalAlpha = p.opacity;

          if (p.colorType === 4) {
            drawPollen(ctx, p);
          } else if (p.colorType === 3) {
            drawFullFlower(ctx, p);
          } else if (p.colorType === 0) {
            // Crisp porcelain white with soft pink blush tip
            drawSinglePetal(ctx, p, 'rgba(255, 255, 255, 0.95)', 'rgba(254, 230, 240, 0.85)');
          } else if (p.colorType === 1) {
            // Ethereal sakura pink
            drawSinglePetal(ctx, p, 'rgba(255, 238, 245, 0.92)', 'rgba(251, 207, 222, 0.85)');
          } else {
            // Soft rosy dawn
            drawSinglePetal(ctx, p, 'rgba(255, 244, 248, 0.95)', 'rgba(247, 195, 214, 0.8)');
          }
        });
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [active, currentBreeze, density]);

  if (!active) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-25 w-full h-full"
      style={{ mixBlendMode: 'normal' }}
    />
  );
};
