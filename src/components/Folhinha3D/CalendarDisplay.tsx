import { useEffect, useState } from 'react';
import { Folhinha3D, type Folhinha3DProps } from './Folhinha3D';
import { MechanicalCalendar } from './MechanicalCalendar';

const STORAGE_KEY = 'folhinha-prazos:calendar-model';

export function CalendarDisplay(props: Folhinha3DProps) {
  const [model, setModel] = useState<'paper' | 'mechanical'>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'mechanical' ? 'mechanical' : 'paper'; }
    catch { return 'paper'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, model); }
    catch { /* A troca continua disponível sem armazenamento. */ }
  }, [model]);

  return (
    <div className="calendar-display">
      <div className="calendar-toolbar">
        <span className="calendar-eyebrow">Seu calendário</span>
        <div className="calendar-models" role="group" aria-label="Modelo do calendário">
          <button type="button" aria-pressed={model === 'paper'} onClick={() => setModel('paper')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5zM8 3v4m8-4v4M5 10h14m-10 4h6" /></svg>
            Modelo de folha
          </button>
          <button type="button" aria-pressed={model === 'mechanical'} onClick={() => setModel('mechanical')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M12 5v15M3 12h18"/></svg>
            Modelo mecânico
          </button>
        </div>
      </div>
      <div className={`desk-scene desk-scene-${model}`}>
        {model === 'paper' ? <Folhinha3D {...props} /> : <MechanicalCalendar {...props} />}
        <p className="desk-caption">{model === 'paper' ? 'Um novo prazo. Uma nova folha.' : 'Cada prazo, uma nova virada.'}</p>
      </div>
    </div>
  );
}
