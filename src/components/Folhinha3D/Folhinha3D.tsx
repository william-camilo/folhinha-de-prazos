// src/components/Folhinha3D/Folhinha3D.tsx
// Base fotográfica com texto vivo e folha que se desprende ao mudar a data.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import paperModel from '../../assets/paper-model.webp';
import { useTilt } from '../../hooks/useTilt';
import { getDayOfWeekName, getMonthName } from '../../utils/format';
import { dateKey } from '../../utils/holidays';
import { PageCurl } from './PageCurl';

type PageProps = {
  date: Date;
  caption: string;
  sub?: string;
  redDay: boolean;
  holidayName?: string;
};

function Page({ date, caption, sub, redDay, holidayName }: PageProps) {
  return (
    <>
      <div className={`page-band${redDay ? ' is-red' : ''}`}>
        <span>{getDayOfWeekName(date)}</span>
      </div>
      <div className="page-body">
        <span className="page-caption">{caption}</span>
        <span className={`page-day${redDay ? ' is-red' : ''}`}>{date.getDate()}</span>
        <span className="page-month">
          {getMonthName(date)} <b>{date.getFullYear()}</b>
        </span>
        {holidayName ? <span className="page-note is-red">{holidayName}</span> : sub && <span className="page-note">{sub}</span>}
      </div>
    </>
  );
}

export type Folhinha3DProps = PageProps & { label: string };

export function Folhinha3D(props: Folhinha3DProps) {
  const stageRef = useTilt<HTMLDivElement>(3);
  const key = dateKey(props.date);
  const prev = useRef<{ key: string; props: PageProps } | null>(null);
  // folhas saindo (até 3 ao mesmo tempo quando a data muda rápido)
  const [leaving, setLeaving] = useState<{ id: number; corner: 'right' | 'left'; duration: number; props: PageProps }[]>([]);
  const seq = useRef(0);

  // useLayoutEffect: a folha antiga entra por cima ANTES da pintura. Com
  // useEffect o navegador chegava a pintar um quadro só com a data nova
  // (o "piscar"), sobretudo nas trocas vindas de timer (botão segurado).
  useLayoutEffect(() => {
    const last = prev.current;
    prev.current = { key, props: { ...props } };
    if (!last || last.key === key) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setLeaving([]);
      return;
    }
    const id = ++seq.current;
    // avançar a data puxa o canto direito; voltar, o esquerdo
    const corner = props.date.getTime() >= last.props.date.getTime() ? 'right' : 'left';
    // com folhas ainda no ar (cliques seguidos / botão segurado) a próxima vai mais rápido
    // no limite de 3 folhas no ar, a troca acontece por baixo delas (sem cortar animações)
    setLeaving((list) =>
      list.length >= 3 ? list : [...list, { id, corner, duration: list.length ? 650 : 1150, props: last.props }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // mantém o snapshot atualizado se só a legenda mudar
  useEffect(() => {
    if (prev.current && prev.current.key === key) prev.current.props = { ...props };
  });

  const remove = (id: number) => setLeaving((list) => list.filter((l) => l.id !== id));

  return (
    <div className="folhinha-stage" ref={stageRef} role="img" aria-label={props.label}>
      <div className="paper-product">
      <img className="calendar-material" src={paperModel} width="1024" height="1024" alt="" draggable={false} />
      <div className="folhinha">
        <div className="page page-current" aria-hidden="true">
          <Page {...props} />
        </div>
        {/* a mais antiga por cima: foi arrancada primeiro */}
        {[...leaving].reverse().map((l) => (
          <PageCurl key={l.id} corner={l.corner} duration={l.duration} onDone={() => remove(l.id)}>
            <Page {...l.props} />
          </PageCurl>
        ))}
      </div>
      <img className="calendar-material paper-hardware" src={paperModel} width="1024" height="1024" alt="" draggable={false} />
      </div>
    </div>
  );
}
