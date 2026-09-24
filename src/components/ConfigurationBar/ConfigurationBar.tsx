// src/components/ConfigurationBar/ConfigurationBar.tsx
import { useDateContext } from '../../context/DateContext';
import { formatLong, parseISODate } from '../../utils/format';

type ToggleKey = 'excludeStartDay' | 'extendToBusinessDay' | 'includeOptional';

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  {
    key: 'excludeStartDay',
    label: 'Excluir o dia do começo',
    hint: 'Conta a partir do dia seguinte (CPC, art. 224)',
  },
  {
    key: 'extendToBusinessDay',
    label: 'Prorrogar para dia útil',
    hint: 'Em dias corridos, vencimento em dia sem expediente passa para o próximo dia útil',
  },
  {
    key: 'includeOptional',
    label: 'Pontos facultativos como feriado',
    hint: 'Carnaval, Quarta-feira de Cinzas e Corpus Christi',
  },
];

export function ConfigurationBar() {
  const { state, dispatch, lookup } = useDateContext();
  const start = parseISODate(state.startDate);
  const startHoliday = start ? lookup(start) : null;

  return (
    <section className="config-bar" aria-label="Configurações da contagem">
      <div className="field start-field">
        <label htmlFor="start-date">Data inicial</label>
        <div className="date-row">
          <input
            id="start-date"
            type="date"
            value={state.startDate}
            onChange={(e) => e.target.value && dispatch({ type: 'setStartDate', value: e.target.value })}
          />
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              const t = new Date();
              const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
              dispatch({ type: 'setStartDate', value: iso });
            }}
          >
            Hoje
          </button>
        </div>
        <p className="field-note">
          {start ? formatLong(start) : 'Data inválida'}
          {startHoliday && <span className="pill pill-red">{startHoliday.name}</span>}
        </p>
      </div>

      <div className="toggles" role="group" aria-label="Regras de contagem">
        {TOGGLES.map((t) => (
          <label key={t.key} className="toggle" htmlFor={`opt-${t.key}`}>
            <input
              id={`opt-${t.key}`}
              type="checkbox"
              role="switch"
              checked={state[t.key]}
              onChange={() => dispatch({ type: 'toggle', key: t.key })}
            />
            <span className="switch" aria-hidden="true" />
            <span className="toggle-text">
              <span className="toggle-label">{t.label}</span>
              <span className="toggle-hint">{t.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
