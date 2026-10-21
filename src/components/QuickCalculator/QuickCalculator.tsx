// src/components/QuickCalculator/QuickCalculator.tsx
import { useMemo } from 'react';
import { useDateContext, type CalcMode } from '../../context/DateContext';
import { calculateDeadline, countBetween } from '../../utils/calculator';
import { formatDateBR, formatLong, formatShort, getDayOfWeekName, getDayOfWeekShort, parseISODate, plural, toISODate } from '../../utils/format';
import { CalendarDisplay } from '../Folhinha3D/CalendarDisplay';
import { DayTimeline } from '../DayTimeline/DayTimeline';
import { useAutoRepeat } from '../../hooks/useAutoRepeat';

const MODES: { value: CalcMode; label: string }[] = [
  { value: 'uteis', label: 'Dias úteis' },
  { value: 'corridos', label: 'Dias corridos' },
  { value: 'entre', label: 'Entre datas' },
];

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 50, 60, 80, 100, 120];

export function QuickCalculator() {
  const { state, dispatch, lookup, options } = useDateContext();
  const minus = useAutoRepeat(() => dispatch({ type: 'stepDays', delta: -1 }));
  const plus = useAutoRepeat(() => dispatch({ type: 'stepDays', delta: 1 }));
  const start = parseISODate(state.startDate) ?? new Date();
  const endInput = parseISODate(state.endDate) ?? start;

  const deadline = useMemo(
    () => (state.mode === 'entre' ? null : calculateDeadline(state.mode, start, state.days, lookup, options)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.mode, state.startDate, state.days, lookup, options],
  );
  const interval = useMemo(
    () => (state.mode === 'entre' ? countBetween(start, endInput, lookup, options) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.mode, state.startDate, state.endDate, lookup, options],
  );

  const shownDate = deadline ? deadline.end : interval!.end;

  const pickDay = (d: Date) => {
    if (state.mode === 'entre') {
      dispatch({ type: 'setEndDate', value: toISODate(d) });
      return;
    }
    const r = countBetween(start, d, lookup, options);
    dispatch({ type: 'setDays', value: state.mode === 'uteis' ? r.businessDays : r.calendarDays });
  };
  const canPick = (d: Date) => {
    if (state.mode === 'entre') return true;
    const diff = d.getTime() - start.getTime();
    return options.excludeStartDay ? diff > 0 : diff >= 0;
  };
  const shownHoliday = lookup(shownDate);
  const unit = state.mode === 'uteis' ? 'úteis' : 'corridos';

  const calendarEquiv = useMemo(
    () =>
      state.mode === 'uteis' && deadline
        ? countBetween(deadline.start, deadline.end, lookup, options).calendarDays
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.mode, deadline?.start, deadline?.end, lookup, options],
  );

  return (
    <section className="panel quick" aria-labelledby="quick-title">
      <div className="quick-main">
        <div className="panel-head">
          <h2 id="quick-title">Calculadora rápida</h2>
          <div className="tabs" role="tablist" aria-label="Tipo de contagem">
            {MODES.map((m) => (
              <button
                key={m.value}
                id={`tab-${m.value}`}
                type="button"
                role="tab"
                aria-selected={state.mode === m.value}
                className="tab"
                onClick={() => dispatch({ type: 'setMode', value: m.value })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {state.mode !== 'entre' ? (
          <div className="quick-inputs">
            <div className="field">
              <label htmlFor="days-input">Prazo em dias {unit}</label>
              <div className="stepper">
                <button type="button" className="key3d" aria-label="Diminuir um dia" title="Segure para repetir" {...minus}>−</button>
                <input
                  id="days-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={3650}
                  value={state.days}
                  onChange={(e) => dispatch({ type: 'setDays', value: Number(e.target.value) })}
                />
                <button type="button" className="key3d" aria-label="Aumentar um dia" title="Segure para repetir" {...plus}>+</button>
              </div>
            </div>
            <div className="presets" role="group" aria-label="Prazos comuns">
              {PRESETS.map((p) => (
                <button key={p} type="button" className="key3d chip" aria-pressed={state.days === p} onClick={() => dispatch({ type: 'setDays', value: p })}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="quick-inputs">
            <div className="field">
              <label htmlFor="end-date">Data final</label>
              <input
                id="end-date"
                type="date"
                value={state.endDate}
                onChange={(e) => e.target.value && dispatch({ type: 'setEndDate', value: e.target.value })}
              />
            </div>
            <p className="field-note">Começa em {formatDateBR(start)} (data inicial da barra acima).</p>
          </div>
        )}

        {deadline && (
          <div className="result" aria-live="polite">
            <p className="result-eyebrow">
              {formatDateBR(start)} + {plural(deadline.days, state.mode === 'uteis' ? 'dia útil' : 'dia corrido', `dias ${unit}`)}
              {calendarEquiv !== null && (
                <span className="result-equiv"> · Total de {plural(calendarEquiv, 'dia corrido', 'dias corridos')}</span>
              )}
            </p>
            <p className="result-headline" data-testid="result-date">
              Vence em {getDayOfWeekName(deadline.end)},
              <strong>{formatLong(deadline.end).split(', ').slice(1).join(', ')}</strong>
            </p>
            <ul className="facts">
              {deadline.extended && (
                <li className="fact fact-amber">
                  Prorrogado: cairia em {getDayOfWeekShort(deadline.originalEnd)} {formatShort(deadline.originalEnd)}
                  {lookup(deadline.originalEnd) ? ` (${lookup(deadline.originalEnd)!.name})` : ''}
                </li>
              )}
              <li className="fact">
                {plural(deadline.weekendsSkipped, 'dia de fim de semana', 'dias de fim de semana')}
                {state.mode === 'uteis' ? ' pulados' : ' no caminho'}
              </li>
              <li className={`fact${deadline.holidaysInPath.length ? ' fact-red' : ''}`}>
                {deadline.holidaysInPath.length
                  ? `${plural(deadline.holidaysInPath.length, 'feriado', 'feriados')}: ${deadline.holidaysInPath.map((h) => `${h.name} (${formatShort(h.date)})`).join(', ')}`
                  : 'Nenhum feriado no caminho'}
              </li>
            </ul>
          </div>
        )}

        {interval && (
          <div className="result" aria-live="polite">
            <p className="result-eyebrow">
              {formatDateBR(interval.start)} → {formatDateBR(interval.end)}
              {interval.reversed ? ' (datas invertidas)' : ''}
            </p>
            <div className="big-counts">
              <div>
                <span className="big-num" data-testid="count-corridos">{interval.calendarDays}</span>
                <span className="big-label">dias corridos</span>
              </div>
              <div>
                <span className="big-num is-pen" data-testid="count-uteis">{interval.businessDays}</span>
                <span className="big-label">dias úteis</span>
              </div>
            </div>
            <ul className="facts">
              <li className="fact">{plural(interval.weekendDays, 'dia de fim de semana', 'dias de fim de semana')}</li>
              <li className={`fact${interval.holidays.length ? ' fact-red' : ''}`}>
                {interval.holidays.length
                  ? `${plural(interval.holidays.length, 'feriado', 'feriados')}: ${interval.holidays.map((h) => `${h.name} (${formatShort(h.date)})`).join(', ')}`
                  : 'Nenhum feriado no intervalo'}
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="quick-visual">
        <CalendarDisplay
          date={shownDate}
          redDay={!!shownHoliday || shownDate.getDay() === 0}
          holidayName={shownHoliday?.name}
          caption={deadline ? 'Vencimento' : 'Data final'}
          sub={deadline ? `D+${deadline.days} ${unit}` : `${interval!.businessDays} dias úteis`}
          label={`${deadline ? 'Vencimento' : 'Data final'}: ${formatLong(shownDate)}`}
        />
      </div>

      <div className="quick-overview">
        <div id="birthday-overview" className="overview-card birthday-overview" />
        <section className="overview-card deadline-overview" aria-label="Linha do prazo">
          <h2><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v4m12-4v4M4 10h16M5 6h14v14H5zM8 14h3m2 3h3" /></svg>Linha do prazo</h2>
          <div className="deadline-track">
            <div><strong>{formatShort(deadline ? deadline.start : interval!.start)} {(deadline ? deadline.start : interval!.start).getFullYear()}</strong><small>Data inicial</small></div>
            <div className="deadline-track-line"><span>{deadline ? `${deadline.days} dias ${unit}` : `${interval!.businessDays} dias úteis`}</span><i /><small>{calendarEquiv ?? interval?.calendarDays ?? deadline?.steps.length} dias corridos</small></div>
            <div><strong>{formatShort(shownDate)} {shownDate.getFullYear()}</strong><small>Vencimento</small></div>
          </div>
        </section>
      </div>

      <details className="quick-timeline">
        <summary><span>Contagem dia a dia</span><span className="timeline-summary-hint">Veja os dias contados e os feriados</span></summary>
        <DayTimeline
          start={deadline ? deadline.start : interval!.start}
          end={shownDate}
          originalEnd={deadline?.originalEnd}
          steps={deadline ? deadline.steps : interval!.steps}
          lookup={lookup}
          weekendsCount={state.mode === 'corridos'}
          onPick={pickDay}
          isPickable={canPick}
        />
      </details>
    </section>
  );
}
