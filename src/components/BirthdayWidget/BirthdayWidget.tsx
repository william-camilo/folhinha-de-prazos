// src/components/BirthdayWidget/BirthdayWidget.tsx
import { useState, useRef, useEffect } from 'react';
import { useBirthdays, daysUntilBirthday, urgency, type Birthday } from '../../hooks/useBirthdays';
import { Confetti } from './Confetti';

function formatMonthDay(monthDay: string): string {
  const [m, d] = monthDay.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function urgencyLabel(days: number): string {
  if (days === 0) return '🎂 Hoje!';
  if (days === 1) return 'Amanhã';
  return `em ${days} dias`;
}

function BirthdayRow({ b, onRemove }: { b: Birthday; onRemove: () => void }) {
  const days = daysUntilBirthday(b.monthDay);
  const u = urgency(days);
  return (
    <li className={`bday-row bday-u${u}`}>
      <span className="bday-name">{b.name}</span>
      <span className="bday-date">{formatMonthDay(b.monthDay)}</span>
      <span className="bday-when">{urgencyLabel(days)}</span>
      <button type="button" className="bday-remove" onClick={onRemove} aria-label={`Remover ${b.name}`}>×</button>
    </li>
  );
}

export function BirthdayWidget() {
  const { list, add, remove, next } = useBirthdays();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const nextDays = next ? daysUntilBirthday(next.monthDay) : null;
  const isToday = nextDays === 0;
  const nextUrgency = nextDays !== null ? urgency(nextDays) : 999;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 50);
  }, [open]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Digite o nome.'); return; }
    if (!date) { setError('Escolha a data.'); return; }
    const [, m, d] = date.split('-');
    add(name.trim(), `${m}-${d}`);
    setName('');
    setDate('');
    setError('');
  }

  return (
    <>
      <Confetti active={isToday} />
      <div className={`bday-widget bday-widget-u${nextUrgency}${isToday ? ' is-birthday-today' : ''}`}>
        <button
          type="button"
          className="bday-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Aniversariantes"
          title="Aniversariantes"
        >
          <span className="bday-icon" aria-hidden="true">🎂</span>
          {next ? (
            <span className="bday-preview">
              <span className="bday-preview-name">{next.name}</span>
              <span className="bday-preview-when">{urgencyLabel(nextDays!)}</span>
            </span>
          ) : (
            <span className="bday-preview">
              <span className="bday-preview-name">Aniversários</span>
            </span>
          )}
          {list.length > 0 && <span className="count-badge">{list.length}</span>}
        </button>

        {open && (
          <div className="bday-modal" ref={modalRef} role="dialog" aria-label="Aniversariantes">
            <div className="bday-modal-head">
              <strong>🎂 Aniversariantes</strong>
              <button type="button" className="bday-close" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
            </div>
            <form className="bday-form" onSubmit={handleAdd} noValidate>
              <input
                ref={nameRef}
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bday-input"
                maxLength={50}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bday-input"
              />
              <button type="submit" className="btn btn-primary bday-add-btn">Adicionar</button>
              {error && <p className="bday-error">{error}</p>}
            </form>
            {list.length === 0 ? (
              <p className="bday-empty">Nenhum aniversariante cadastrado.</p>
            ) : (
              <ul className="bday-list">
                {[...list]
                  .sort((a, b) => daysUntilBirthday(a.monthDay) - daysUntilBirthday(b.monthDay))
                  .map((b) => (
                    <BirthdayRow key={b.id} b={b} onRemove={() => remove(b.id)} />
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
