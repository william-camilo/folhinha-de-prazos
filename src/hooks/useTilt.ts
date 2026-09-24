// src/hooks/useTilt.ts
// Inclinação 3D que acompanha o ponteiro. Escreve variáveis CSS (--rx, --ry,
// --gx, --gy) no elemento, sem re-renderizar o React.
import { useEffect, useRef } from 'react';

export function useTilt<T extends HTMLElement>(maxDeg = 14) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let frame = 0;
    const set = (rx: number, ry: number, gx: number, gy: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--gx', `${gx.toFixed(1)}%`);
        el.style.setProperty('--gy', `${gy.toFixed(1)}%`);
      });
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height;
      set((0.5 - py) * maxDeg, (px - 0.5) * maxDeg * 1.4, px * 100, py * 100);
      el.dataset.active = 'true';
    };
    const onLeave = () => {
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
      el.style.removeProperty('--gx');
      el.style.removeProperty('--gy');
      delete el.dataset.active;
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [maxDeg]);

  return ref;
}
