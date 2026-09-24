// src/components/Header/Header.tsx
import type { ReactNode } from 'react';
import { useDateContext, type ThemeChoice } from '../../context/DateContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useOnline } from '../../hooks/useOnline';
import { useHolidays } from '../../hooks/useHolidays';
import { parseISODate } from '../../utils/format';

const THEMES: { value: ThemeChoice; label: string; icon: ReactNode }[] = [
  {
    value: 'system',
    label: 'Tema do sistema',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: 'Tema claro',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 1.8v2.2M10 16v2.2M1.8 10H4M16 10h2.2M4.2 4.2l1.6 1.6M14.2 14.2l1.6 1.6M4.2 15.8l1.6-1.6M14.2 5.8l1.6-1.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Tema escuro',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Header() {
  const { state, dispatch } = useDateContext();
  const { canInstall, install } = useInstallPrompt();
  const online = useOnline();
  const year = (parseISODate(state.startDate) ?? new Date()).getFullYear();
  const { holidays } = useHolidays(year);

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          {/* mini folhinha: mesma cara da folha 3D da calculadora */}
          <span className="brand-sheet">
            <span className="brand-rings">
              <i />
              <i />
            </span>
            <span className="brand-band" />
            <span className="brand-day">{new Date().getDate()}</span>
          </span>
        </span>
        <div>
          <h1>Folhinha de Prazos</h1>
          <p className="brand-sub">Dias corridos e úteis com feriados nacionais</p>
        </div>
      </div>

      <div className="header-actions">
        {!online && <span className="pill pill-amber" role="status">Offline</span>}
        <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'openHolidays' })}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="btn-icon">
            <rect x="3" y="4.5" width="14" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 8.5h14M7 2.8v3.4M13 2.8v3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="12.5" cy="12.8" r="1.6" fill="currentColor" />
          </svg>
          Feriados {year}
          <span className="count-badge">{holidays.length}</span>
        </button>
        {canInstall && (
          <button type="button" className="btn btn-primary" onClick={install}>
            Instalar app
          </button>
        )}
        <div className="segmented" role="radiogroup" aria-label="Tema">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={state.theme === t.value}
              aria-label={t.label}
              title={t.label}
              className="segmented-btn icon-only"
              onClick={() => dispatch({ type: 'setTheme', value: t.value })}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
