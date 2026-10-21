// src/components/BirthdayWidget/BirthdayWidget.tsx
import { useState, useRef, useEffect } from 'react';
import { useBirthdays, daysUntilBirthday, type Birthday } from '../../hooks/useBirthdays';
import { Confetti } from './Confetti';

function CakeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="cake-icon">
    <path d="M4 13h16v7H4zM3 20h18M7 13V9h10v4M8 6V3m4 3V2m4 4V3M4 16c2 3 4-3 6 0s4-3 6 0 4 0 4 0" />
  </svg>;
}

function BirthdayRow({ b, onRemove }: { b: Birthday; onRemove: () => void }) {
  const days = daysUntilBirthday(b.monthDay);
  const [month, day] = b.monthDay.split('-');
  const initials = b.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('');
  return <li className={`birthday-person${days === 0 ? ' birthday-today' : ''}`}>
    <span className="birthday-avatar" aria-hidden="true">{initials}</span>
    <span className="birthday-person-name">{b.name}<small>{day}/{month}</small></span>
    <span className="birthday-countdown">{days === 0 ? 'Hoje!' : days === 1 ? 'Amanhã' : `Em ${days} dias`}</span>
    <button type="button" className="btn birthday-remove" onClick={onRemove} aria-label={`Remover ${b.name}`}>×</button>
  </li>;
}

export function BirthdayWidget() {
  const { list, add, remove, next } = useBirthdays();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const modalRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isToday = next !== null && daysUntilBirthday(next.monthDay) === 0;

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      nameRef.current?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    if (!name.trim()) { setError('Digite o nome.'); nameRef.current?.focus(); return; }
    const parts = date.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    const day = Number(parts?.[1]);
    const month = Number(parts?.[2]);
    const check = new Date(2000, month - 1, day);
    if (!parts || check.getMonth() !== month - 1 || check.getDate() !== day) {
      setError('Informe uma data válida no formato DD/MM.');
      return;
    }
    add(name.trim(), `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setStatus(`${name.trim()} adicionado à lista.`);
    setName('');
    setDate('');
    setError('');
    nameRef.current?.focus();
  }

  return <>
    <Confetti active={isToday} />
    <button ref={triggerRef} type="button" className="btn birthday-trigger" onClick={() => setOpen(true)}
      aria-haspopup="dialog" aria-expanded={open}>
      <CakeIcon /><span>Adicionar aniversariante</span><span aria-hidden="true">+</span>
      {isToday && <span className="birthday-today-dot" title="Há aniversariante hoje" />}
    </button>
    <dialog ref={modalRef} className="modal birthday-dialog" aria-labelledby="birthday-title"
      onCancel={() => setOpen(false)}
      onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
      onClick={e => { if (e.target === modalRef.current) setOpen(false); }}>
      <div className="modal-card birthday-card">
        <div className="birthday-heading">
          <span className="birthday-symbol"><CakeIcon /></span>
          <div><h2 id="birthday-title">Aniversariantes</h2><p className="panel-sub">Guarde as datas de quem importa.</p></div>
          <button type="button" className="btn btn-quiet close" onClick={() => setOpen(false)} aria-label="Fechar aniversariantes">×</button>
        </div>
        <form className="birthday-form" onSubmit={handleAdd} noValidate>
          <div className="field"><label htmlFor="birthday-name">Nome</label>
            <input id="birthday-name" ref={nameRef} type="text" placeholder="Ex.: Marina Costa" value={name}
              onChange={e => setName(e.target.value)} maxLength={50} autoComplete="off" required />
          </div>
          <div className="field"><label htmlFor="birthday-date">Dia e mês</label>
            <input id="birthday-date" type="text" inputMode="numeric" placeholder="DD/MM" value={date}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                setDate(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
              }} maxLength={5} required
              aria-describedby={error ? 'birthday-error' : undefined} />
          </div>
          <button type="submit" className="btn btn-primary birthday-save"><span aria-hidden="true">+</span> Salvar aniversariante</button>
          {error && <p id="birthday-error" className="bday-error" role="alert">{error}</p>}
          <p className="birthday-status" role="status">{status}</p>
        </form>
        <div className="birthday-list-heading"><h3>Próximos aniversários</h3><span className="pill">{list.length}</span></div>
        {list.length === 0 ? <p className="birthday-empty">Nenhuma data por aqui ainda.<br />Adicione o primeiro aniversariante acima.</p> :
          <ul className="birthday-people">{[...list].sort((a, b) => daysUntilBirthday(a.monthDay) - daysUntilBirthday(b.monthDay))
            .map(b => <BirthdayRow key={b.id} b={b} onRemove={() => remove(b.id)} />)}</ul>}
        <p className="birthday-local-note">As datas ficam neste navegador.</p>
      </div>
    </dialog>
  </>;
}
