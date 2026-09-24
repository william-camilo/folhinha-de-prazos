// src/components/Folhinha3D/Folhinha3D.tsx
// "Folhinha" de mesa em 3D: um bloco de folhas com espessura real (camadas em
// translateZ), argolas, inclinação que segue o ponteiro e a folha de cima que
// é arrancada quando a data muda.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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
      <div className="page-perforation" aria-hidden="true" />
    </>
  );
}

export type Folhinha3DProps = PageProps & { label: string };

const SHEETS = 7;

export function Folhinha3D(props: Folhinha3DProps) {
  const stageRef = useTilt<HTMLDivElement>(16);
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
    const id = ++seq.current;
    // avançar a data puxa o canto direito; voltar, o esquerdo
    const corner = props.date.getTime() >= last.props.date.getTime() ? 'right' : 'left';
    // com folhas ainda no ar (cliques seguidos / botão segurado) a próxima vai mais rápido
    // no limite de 3 folhas no ar, a troca acontece por baixo delas (sem cortar animações)
    setLeaving((list) =>
      list.length >= 3 ? list : [...list, { id, corner, duration: list.length ? 460 : 720, props: last.props }],
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
      <div className="folhinha">
        {Array.from({ length: SHEETS }, (_, i) => (
          <div key={i} className="sheet" style={{ '--i': i + 1 } as CSSProperties} aria-hidden="true" />
        ))}
        <div className="page page-current" aria-hidden="true">
          <Page {...props} />
          <div className="page-gloss" />
        </div>
        {/* a mais antiga por cima: foi arrancada primeiro */}
        {[...leaving].reverse().map((l) => (
          <PageCurl key={l.id} corner={l.corner} duration={l.duration} onDone={() => remove(l.id)}>
            <Page {...l.props} />
          </PageCurl>
        ))}
        <div className="binding" aria-hidden="true">
          <span className="ring" />
          <span className="ring" />
          <span className="ring" />
        </div>
      </div>
      <div className="folhinha-shadow" aria-hidden="true" />
    </div>
  );
}
