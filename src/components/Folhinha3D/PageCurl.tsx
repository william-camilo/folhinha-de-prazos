// src/components/Folhinha3D/PageCurl.tsx
// Folha que é "pega pelo canto" e sobe dobrando até sumir.
//
// Técnica (2D, sem WebGL): o canto inferior C é puxado até um ponto P.
// A linha de dobra é a mediatriz de C→P. A parte da folha do lado de P
// continua plana (clip-path); a parte do lado de C vira a aba dobrada,
// desenhada como o verso do papel refletido sobre a linha de dobra.
// Sombras e brilho acompanham a dobra; no fim a folha se solta e sobe.
import { useEffect, useRef, type ReactNode } from 'react';

type Vec = { x: number; y: number };
type Corner = 'right' | 'left';

type Props = {
  children: ReactNode;
  /** Canto puxado: direito ao avançar a data, esquerdo ao voltar. */
  corner: Corner;
  duration?: number;
  onDone: () => void;
};

const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
// "pega" curta e depois um puxão rápido que desacelera (sensação de peteleco)
const GRAB = 0.14;
const peelCurve = (t: number) => {
  if (t < GRAB) return 0.05 * (t / GRAB) * (t / GRAB);
  const x = (t - GRAB) / (1 - GRAB);
  return 0.05 + 0.95 * (1 - Math.pow(1 - x, 3));
};

/** Recorta o retângulo W×H pelo semiplano (X−M)·n ≥ 0 (Sutherland–Hodgman). */
function clipRect(w: number, h: number, m: Vec, n: Vec, keepPositive: boolean): Vec[] {
  const pts: Vec[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const side = (p: Vec) => (keepPositive ? 1 : -1) * dot(sub(p, m), n);
  const out: Vec[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb);
      out.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
    }
  }
  return out;
}

const poly = (pts: Vec[]) =>
  pts.length < 3 ? 'polygon(0 0, 0 0, 0 0)' : `polygon(${pts.map((p) => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(',')})`;

/** Ângulo CSS de linear-gradient para um vetor (y para baixo). */
const cssAngle = (v: Vec) => (Math.atan2(v.x, -v.y) * 180) / Math.PI;

/** Distância, ao longo do gradiente, do início até o ponto m. */
function gradientOffset(w: number, h: number, v: Vec, m: Vec): { at: number } {
  const len = Math.abs(w * v.x) + Math.abs(h * v.y);
  const center = { x: w / 2, y: h / 2 };
  return { at: dot(sub(m, center), v) + len / 2 };
}

/** Caminho do canto: sobe em curva pela folha e passa por cima da argola. */
function cornerPath(w: number, h: number, corner: Corner, t: number): Vec {
  const mirror = (x: number) => (corner === 'right' ? x : w - x);
  const p0 = { x: mirror(w), y: h };
  const p1 = { x: mirror(w * 0.3), y: h * 0.52 };
  const p2 = { x: mirror(w * 0.62), y: -h * 1.05 };
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function PageCurl({ children, corner, duration = 720, onDone }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const foldShadeRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  // duração lida uma vez: trocar a prop no meio não reinicia a animação
  const durationRef = useRef(duration);
  doneRef.current = onDone;

  useEffect(() => {
    const root = rootRef.current;
    const front = frontRef.current;
    const shade = foldShadeRef.current;
    const flap = flapRef.current;
    if (!root || !front || !shade || !flap) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      root.style.transition = 'opacity 200ms';
      root.style.opacity = '0';
      const t = setTimeout(() => doneRef.current(), 220);
      return () => clearTimeout(t);
    }

    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const c: Vec = { x: corner === 'right' ? w : 0, y: h };
    let raf = 0;
    const t0 = performance.now();

    const draw = (now: number) => {
      const raw = clamp01((now - t0) / durationRef.current);
      // o canto é puxado nos primeiros 80%; a folha já começa a se soltar antes
      const peel = peelCurve(clamp01(raw / 0.8));
      const p = cornerPath(w, h, corner, Math.max(peel, 0.0001));
      const cp = sub(p, c);
      const dist = Math.hypot(cp.x, cp.y) || 0.0001;
      const n = { x: cp.x / dist, y: cp.y / dist };
      const m = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 };

      // parte plana (lado de P) e aba (lado de C)
      front.style.clipPath = poly(clipRect(w, h, m, n, true));
      const flapPoly = poly(clipRect(w, h, m, n, false));
      flap.style.clipPath = flapPoly;

      // reflexão sobre a linha de dobra (direção d = perpendicular de n)
      const d = { x: -n.y, y: n.x };
      const a = 2 * d.x * d.x - 1;
      const b = 2 * d.x * d.y;
      const dd = 2 * d.y * d.y - 1;
      const e = m.x - (a * m.x + b * m.y);
      const f = m.y - (b * m.x + dd * m.y);
      flap.style.transform = `matrix(${a},${b},${b},${dd},${e},${f})`;

      // verso do papel: brilho junto da dobra, escurece para a ponta
      const toTip = { x: -n.x, y: -n.y };
      const g1 = gradientOffset(w, h, toTip, m).at;
      flap.style.backgroundImage = `linear-gradient(${cssAngle(toTip)}deg,
        var(--curl-back-edge) ${g1}px,
        var(--curl-back-light) ${g1 + 6}px,
        var(--curl-back) ${g1 + dist * 0.22}px,
        var(--curl-back-dark) ${g1 + dist * 0.5}px)`;

      // sombra da dobra sobre a parte plana
      const g2 = gradientOffset(w, h, n, m).at;
      const lift = Math.min(1, dist / (h * 0.5));
      shade.style.backgroundImage = `linear-gradient(${cssAngle(n)}deg,
        rgba(0,0,0,${(0.28 * lift).toFixed(3)}) ${g2}px,
        rgba(0,0,0,${(0.08 * lift).toFixed(3)}) ${g2 + 18}px,
        rgba(0,0,0,0) ${g2 + 46}px)`;

      // soltar: sobe girando e some
      const up = smooth(0.5, 1, raw);
      const spin = corner === 'right' ? -1 : 1;
      root.style.opacity = String(1 - smooth(0.68, 1, raw));
      root.style.transform = `translateZ(${2 + up * 70}px) translateY(${-up * 95}px) translateX(${spin * up * 18}px) rotateX(${up * 22}deg) rotateZ(${spin * up * 14}deg)`;
      root.style.setProperty('--flap-shadow', (0.1 + 0.22 * lift).toFixed(3));

      if (raw < 1) raf = requestAnimationFrame(draw);
      else doneRef.current();
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [corner]);

  return (
    <div className="page-curl" ref={rootRef} aria-hidden="true">
      <div className="curl-front-wrap">
        <div className="page curl-front" ref={frontRef}>
          {children}
          <div className="curl-fold-shade" ref={foldShadeRef} />
        </div>
      </div>
      <div className="curl-flap-wrap">
        <div className="curl-flap" ref={flapRef}>
          {/* tinta vista por trás do papel (a reflexão já espelha) */}
          <div className="page curl-ghost">{children}</div>
        </div>
      </div>
    </div>
  );
}
