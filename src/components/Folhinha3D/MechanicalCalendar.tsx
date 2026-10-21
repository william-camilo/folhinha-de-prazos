import { useLayoutEffect, useRef, useState } from 'react';
import { getDayOfWeekName, getMonthName } from '../../utils/format';
import { useTilt } from '../../hooks/useTilt';
import type { Folhinha3DProps } from './Folhinha3D';
import mechanicalModel from '../../assets/mechanical-model.webp';

function Flap({ value, className = '' }: { value: string; className?: string }) {
  const previous = useRef(value);
  const sequence = useRef(0);
  const [turn, setTurn] = useState<{ old: string; id: number } | null>(null);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = value;
    if (old === value) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTurn(null);
      return;
    }
    setTurn({ old, id: ++sequence.current });
    // O timer também limpa a placa quando a aba do navegador está oculta.
    const timer = window.setTimeout(() => setTurn(null), 650);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <div className={`flip-cell ${className}`} aria-hidden="true">
      <span className="flip-half flip-top"><span>{value}</span></span>
      <span className="flip-half flip-bottom"><span>{turn ? turn.old : value}</span></span>
      {turn && <div key={turn.id} className="flip-turn">
        <span className="flip-half flip-top flip-old"><span>{turn.old}</span></span>
        <span className="flip-half flip-bottom flip-new"><span>{value}</span></span>
      </div>}
      <i className="flip-pin flip-pin-left" /><i className="flip-pin flip-pin-right" />
    </div>
  );
}

export function MechanicalCalendar(props: Folhinha3DProps) {
  const stageRef = useTilt<HTMLDivElement>(3);
  const digits = String(props.date.getDate()).padStart(2, '0');
  return (
    <div className="mechanical-stage" ref={stageRef} role="img" aria-label={props.label}>
      <div className="mechanical-calendar">
        <img className="calendar-material" src={mechanicalModel} width="1024" height="1024" alt="" draggable={false} />
        <Flap value={getDayOfWeekName(props.date).toLocaleUpperCase('pt-BR')} className="flip-weekday" />
        <div className={`mechanical-digits${props.redDay ? ' is-red' : ''}`}>
          <Flap value={digits[0]} /><Flap value={digits[1]} />
        </div>
        <div className="mechanical-bottom">
          <Flap value={getMonthName(props.date).toLocaleUpperCase('pt-BR')} className="flip-month" />
          <Flap value={String(props.date.getFullYear())} className="flip-year" />
        </div>
        <p className="mechanical-note" aria-hidden="true">{props.holidayName || props.sub}</p>
      </div>
    </div>
  );
}
