// src/components/BirthdayWidget/Confetti.tsx
import { useEffect, useRef } from 'react';

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  angle: number;
  spin: number;
  life: number;
  maxLife: number;
};

const COLORS = ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0', '#f9c74f', '#90be6d', '#f94144'];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!active || fired.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    fired.current = true;

    const canvas = canvasRef.current!;
    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx = context;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];

    const origins = [
      { x: canvas.width * 0.2, y: canvas.height },
      { x: canvas.width * 0.8, y: canvas.height },
    ];

    origins.forEach((o) => {
      for (let i = 0; i < 120; i++) {
        const angle = rand(-Math.PI, -Math.PI * 0.05);
        const speed = rand(6, 18);
        particles.push({
          x: o.x, y: o.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: rand(4, 10),
          angle: rand(0, Math.PI * 2),
          spin: rand(-0.15, 0.15),
          life: 0,
          maxLife: rand(80, 160),
        });
      }
    });

    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.vx *= 0.99;
        p.angle += p.spin;
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); fired.current = false; };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
      aria-hidden="true"
    />
  );
}
