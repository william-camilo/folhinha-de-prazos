// src/components/DayTimeline/DayTimeline.tsx
// Mini-calendário que mostra, dia a dia, como o prazo foi contado.
import { addMonths, differenceInCalendarMonths, eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DayStep } from '../../utils/calculator';
import { dateKey, isWeekend, type HolidayLookup } from '../../utils/holidays';
import { formatDateBR } from '../../utils/format';

type Props = {
  start: Date;
  end: Date;
  originalEnd?: Date;
  steps: DayStep[];
  lookup: HolidayLookup;
  /** Em dias corridos fins de semana contam; em úteis são pulados. */
  weekendsCount: boolean;
  /** Clique num dia: a calculadora ajusta o prazo para vencer nele. */
  onPick?: (date: Date) => void;
  /** Quais dias aceitam clique (padrão: todos). */
  isPickable?: (date: Date) => boolean;
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MAX_MONTHS = 3;

export function DayTimeline({ start, end, originalEnd, steps, lookup, weekendsCount, onPick, isPickable }: Props) {
  const byKey = new Map(steps.map((s) => [dateKey(s.date), s]));
  const startKey = dateKey(start);
  const endKey = dateKey(end);
  const origKey = originalEnd && dateKey(originalEnd) !== endKey ? dateKey(originalEnd) : null;

  const total = differenceInCalendarMonths(end, start) + 1;
  const months: (Date | 'gap')[] = [];
  if (total <= MAX_MONTHS) {
    for (let i = 0; i < total; i++) months.push(addMonths(startOfMonth(start), i));
  } else {
    months.push(startOfMonth(start), 'gap', startOfMonth(end));
  }

  return (
    <div className="timeline">
      <div className="timeline-months">
        {months.map((m, idx) =>
          m === 'gap' ? (
            <div key={`gap-${idx}`} className="month-gap" aria-hidden="true">
              <span>+{total - 2} meses</span>
            </div>
          ) : (
            <Month
              key={dateKey(m)}
              month={m}
              byKey={byKey}
              startKey={startKey}
              endKey={endKey}
              origKey={origKey}
              lookup={lookup}
              weekendsCount={weekendsCount}
              onPick={onPick}
              isPickable={isPickable}
            />
          ),
        )}
      </div>
      {onPick && <p className="timeline-hint">Toque num dia para usá-lo como vencimento.</p>}
      <ul className="legend" aria-label="Legenda">
        <li>
          <i className="sw sw-start" /> Início
        </li>
        <li>
          <i className="sw sw-counted" /> Dia contado
        </li>
        {!weekendsCount && (
          <li>
            <i className="sw sw-skip" /> Pulado
          </li>
        )}
        <li>
          <i className="sw sw-holiday" /> Feriado
        </li>
        <li>
          <i className="sw sw-end" /> Vencimento
        </li>
        {origKey && (
          <li>
            <i className="sw sw-orig" /> Vencimento original
          </li>
        )}
      </ul>
    </div>
  );
}

type MonthProps = {
  month: Date;
  byKey: Map<string, DayStep>;
  startKey: string;
  endKey: string;
  origKey: string | null;
  lookup: HolidayLookup;
  weekendsCount: boolean;
  onPick?: (date: Date) => void;
  isPickable?: (date: Date) => boolean;
};

function Month({ month, byKey, startKey, endKey, origKey, lookup, weekendsCount, onPick, isPickable }: MonthProps) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const lead = days[0].getDay();

  return (
    <figure className="month">
      <figcaption>{format(month, 'MMMM yyyy', { locale: ptBR })}</figcaption>
      <div className="month-grid">
        {WEEKDAYS.map((w, i) => (
          <span key={`h${i}`} className={`wd${i === 0 ? ' is-sun' : ''}`} aria-hidden="true">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`e${i}`} className="cell is-empty" aria-hidden="true" />
        ))}
        {days.map((d) => {
          const k = dateKey(d);
          const step = byKey.get(k);
          const holiday = lookup(d);
          const cls = ['cell'];
          if (holiday || d.getDay() === 0) cls.push('is-redday');
          if (step) {
            if (step.status === 'counted' || step.status === 'extension' || (weekendsCount && step.index)) cls.push('is-counted');
            else cls.push('is-skipped');
          }
          if (holiday) cls.push('is-holiday');
          if (k === startKey) cls.push('is-start');
          if (k === endKey) cls.push('is-end');
          if (k === origKey) cls.push('is-orig');
          const parts = [formatDateBR(d)];
          if (holiday) parts.push(holiday.name);
          else if (isWeekend(d)) parts.push('fim de semana');
          if (step?.index) parts.push(`dia ${step.index} da contagem`);
          if (k === startKey) parts.push('data inicial');
          if (k === endKey) parts.push('vencimento');
          if (onPick && (!isPickable || isPickable(d))) {
            return (
              <button
                key={k}
                type="button"
                className={[...cls, 'is-pickable'].join(' ')}
                title={`${parts.join(' · ')} — clique para vencer neste dia`}
                aria-label={`${parts.join(', ')}. Definir como vencimento`}
                aria-current={k === endKey ? 'date' : undefined}
                onClick={() => onPick(d)}
              >
                {d.getDate()}
              </button>
            );
          }
          return (
            <span key={k} className={cls.join(' ')} title={parts.join(' · ')}>
              {d.getDate()}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
