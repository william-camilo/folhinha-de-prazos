// src/components/DeadlineTable/DeadlineTable.tsx
// Tabela de vencimentos usada por CalendarDaysTable e BusinessDaysTable.
import { useMemo, useState } from 'react';
import { useDateContext } from '../../context/DateContext';
import { buildTermTable, type CountMode } from '../../utils/calculator';
import { formatDateBR, formatShort, getDayOfWeekName, parseISODate, toISODate } from '../../utils/format';
import { canDownload, copyText, downloadCSV, termRowsToRecords, toCSV } from '../../services/csvExport';

type Props = { mode: CountMode; title: string; description: string };

export function DeadlineTable({ mode, title, description }: Props) {
  const { state, dispatch, lookup, options } = useDateContext();
  const start = parseISODate(state.startDate) ?? new Date();
  const [flash, setFlash] = useState<string | null>(null);

  const rows = useMemo(
    () => buildTermTable(mode, start, lookup, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, state.startDate, lookup, options],
  );

  const say = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash((f) => (f === msg ? null : f)), 2200);
  };

  const csv = () => toCSV(termRowsToRecords(rows), 'excel');
  const filename = `prazos-${mode}-${toISODate(start)}.csv`;
  const headingId = `table-${mode}`;

  return (
    <section className="panel table-panel" aria-labelledby={headingId}>
      <div className="panel-head">
        <div>
          <h2 id={headingId}>{title}</h2>
          <p className="panel-sub">{description}</p>
        </div>
        <div className="table-actions">
          <button
            type="button"
            className="btn btn-quiet"
            onClick={async () => say((await copyText(csv())) ? 'CSV copiado' : 'Não foi possível copiar')}
          >
            {canDownload ? 'Copiar' : 'Copiar CSV'}
          </button>
          {canDownload && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                downloadCSV(filename, csv());
                say('Download iniciado');
              }}
            >
              Baixar CSV
            </button>
          )}
        </div>
      </div>
      <p className="flash" role="status" aria-live="polite">
        {flash}
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Prazo</th>
              <th scope="col">Vencimento</th>
              <th scope="col">Dia</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ days, result }) => {
              const active = state.mode === mode && state.days === days;
              return (
                <tr
                  key={days}
                  className={active ? 'is-active' : undefined}
                  onClick={() => dispatch({ type: 'pickTerm', mode, days })}
                >
                  <td>
                    <button
                      type="button"
                      className="row-pick"
                      aria-pressed={active}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'pickTerm', mode, days });
                      }}
                    >
                      {days} {mode === 'uteis' ? 'úteis' : 'dias'}
                    </button>
                  </td>
                  <td className="mono">{formatDateBR(result.end)}</td>
                  <td className="weekday">{getDayOfWeekName(result.end)}</td>
                  <td className="note">
                    {result.extended ? (
                      <span className="pill pill-amber" title={lookup(result.originalEnd)?.name}>
                        prorrogado de {formatShort(result.originalEnd)}
                      </span>
                    ) : result.holidaysInPath.length ? (
                      <span className="pill pill-red" title={result.holidaysInPath.map((h) => h.name).join(', ')}>
                        {result.holidaysInPath.length} {result.holidaysInPath.length === 1 ? 'feriado' : 'feriados'}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
