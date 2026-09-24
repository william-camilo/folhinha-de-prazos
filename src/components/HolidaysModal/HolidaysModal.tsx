// src/components/HolidaysModal/HolidaysModal.tsx
// Modal (elemento <dialog> nativo: foco preso, Esc fecha) com os feriados do ano.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useDateContext } from '../../context/DateContext';
import { useHolidays } from '../../hooks/useHolidays';
import { formatDateBR, getDayOfWeekName, parseISODate, toISODate } from '../../utils/format';
import { canDownload, copyText, downloadCSV, holidaysToRecords, toCSV } from '../../services/csvExport';
import { isWeekend } from '../../utils/holidays';

export function HolidaysModal() {
  const { state, dispatch } = useDateContext();
  const ref = useRef<HTMLDialogElement>(null);
  const baseYear = (parseISODate(state.startDate) ?? new Date()).getFullYear();
  const [year, setYear] = useState(baseYear);
  const { holidays } = useHolidays(year);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (state.holidaysOpen && !dlg.open) {
      setYear(baseYear);
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    } else if (!state.holidaysOpen && dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.holidaysOpen]);

  const say = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash((f) => (f === msg ? null : f)), 2200);
  };

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!parseISODate(newDate) || !newName.trim()) {
      say('Informe a data e o nome do feriado');
      return;
    }
    dispatch({ type: 'addHoliday', date: newDate, name: newName.trim() });
    setYear(Number(newDate.slice(0, 4)));
    setNewName('');
    say('Feriado local adicionado');
  };

  const weekdayCount = holidays.filter((h) => !isWeekend(h.date)).length;

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="holidays-title"
      onClose={() => dispatch({ type: 'closeHolidays' })}
      onClick={(e) => {
        if (e.target === ref.current) dispatch({ type: 'closeHolidays' });
      }}
    >
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <h2 id="holidays-title">Feriados de {year}</h2>
            <p className="panel-sub">
              {holidays.length} datas · {weekdayCount} caem em dia de semana
              {!state.includeOptional && ' · pontos facultativos desconsiderados'}
            </p>
          </div>
          <div className="year-nav">
            <button type="button" className="key3d" aria-label="Ano anterior" onClick={() => setYear((y) => y - 1)}>
              ‹
            </button>
            <span className="mono">{year}</span>
            <button type="button" className="key3d" aria-label="Próximo ano" onClick={() => setYear((y) => y + 1)}>
              ›
            </button>
          </div>
          <button type="button" className="btn btn-quiet close" aria-label="Fechar" onClick={() => dispatch({ type: 'closeHolidays' })}>
            ✕
          </button>
        </div>

        <ol className="holiday-list">
          {holidays.map((h) => {
            const iso = toISODate(h.date);
            return (
              <li key={`${iso}-${h.name}`} className={isWeekend(h.date) ? 'is-weekend' : undefined}>
                <span className="h-date">
                  <b>{h.date.getDate()}</b>
                  <small>{formatDateBR(h.date).slice(3, 5)}</small>
                </span>
                <span className="h-name">
                  {h.name}
                  <small>{getDayOfWeekName(h.date)}</small>
                </span>
                <span className={`pill ${h.type === 'local' ? 'pill-pen' : h.optional ? 'pill-amber' : 'pill-red'}`}>
                  {h.type === 'local' ? 'local' : h.optional ? 'facultativo' : h.type === 'movel' ? 'móvel' : 'fixo'}
                </span>
                {h.type === 'local' && (
                  <button
                    type="button"
                    className="btn btn-quiet remove"
                    aria-label={`Remover ${h.name}`}
                    onClick={() => dispatch({ type: 'removeHoliday', date: iso })}
                  >
                    Remover
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <form className="add-holiday" onSubmit={onAdd}>
          <p className="form-title">Adicionar feriado estadual ou municipal</p>
          <div className="add-row">
            <input
              id="new-holiday-date"
              type="date"
              aria-label="Data do feriado"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <input
              id="new-holiday-name"
              type="text"
              placeholder="Ex.: Aniversário da cidade"
              aria-label="Nome do feriado"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Adicionar
            </button>
          </div>
        </form>

        <div className="modal-foot">
          <p className="flash" role="status" aria-live="polite">
            {flash}
          </p>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={async () =>
              say((await copyText(toCSV(holidaysToRecords(holidays, 'datastudio'), 'datastudio'))) ? 'CSV copiado' : 'Não foi possível copiar')
            }
          >
            Copiar CSV
          </button>
          {canDownload && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  downloadCSV(`feriados-${year}.csv`, toCSV(holidaysToRecords(holidays, 'datastudio'), 'datastudio'));
                  say('Download iniciado');
                }}
              >
                CSV p/ Looker Studio
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  downloadCSV(`feriados-${year}-excel.csv`, toCSV(holidaysToRecords(holidays, 'excel'), 'excel'));
                  say('Download iniciado');
                }}
              >
                CSV p/ Excel
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
