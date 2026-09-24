// src/context/DateContext.tsx
// Estado global com React Context + useReducer (persistência leve em localStorage).
import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { createHolidayLookup, type HolidayLookup, type HolidayRules } from '../utils/holidays';
import type { CountMode, CountOptions } from '../utils/calculator';
import { toISODate } from '../utils/format';

export type CalcMode = CountMode | 'entre';
export type ThemeChoice = 'system' | 'light' | 'dark';

export type DateState = {
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd (modo "entre datas")
  days: number;
  mode: CalcMode;
  excludeStartDay: boolean;
  extendToBusinessDay: boolean;
  includeOptional: boolean;
  customHolidays: { date: string; name: string }[];
  theme: ThemeChoice;
  holidaysOpen: boolean;
};

export type DateAction =
  | { type: 'setStartDate'; value: string }
  | { type: 'setEndDate'; value: string }
  | { type: 'setDays'; value: number }
  | { type: 'stepDays'; delta: number }
  | { type: 'setMode'; value: CalcMode }
  | { type: 'pickTerm'; mode: CountMode; days: number }
  | { type: 'toggle'; key: 'excludeStartDay' | 'extendToBusinessDay' | 'includeOptional' }
  | { type: 'addHoliday'; date: string; name: string }
  | { type: 'removeHoliday'; date: string }
  | { type: 'setTheme'; value: ThemeChoice }
  | { type: 'openHolidays' }
  | { type: 'closeHolidays' };

const STORAGE_KEY = 'folhinha-prazos:v1';
const PERSISTED: (keyof DateState)[] = [
  'days',
  'mode',
  'excludeStartDay',
  'extendToBusinessDay',
  'includeOptional',
  'customHolidays',
  'theme',
];

export function createInitialState(today = new Date()): DateState {
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return {
    startDate: toISODate(today),
    endDate: toISODate(end),
    days: 15,
    mode: 'uteis',
    excludeStartDay: true,
    extendToBusinessDay: true,
    includeOptional: true,
    customHolidays: [],
    theme: 'system',
    holidaysOpen: false,
  };
}

function loadState(): DateState {
  const base = createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<DateState>;
    const merged = { ...base };
    for (const key of PERSISTED) {
      if (saved[key] !== undefined) (merged as Record<string, unknown>)[key] = saved[key];
    }
    return merged;
  } catch {
    return base;
  }
}

export function dateReducer(state: DateState, action: DateAction): DateState {
  switch (action.type) {
    case 'setStartDate':
      return { ...state, startDate: action.value };
    case 'setEndDate':
      return { ...state, endDate: action.value };
    case 'setDays':
      return { ...state, days: Math.min(3650, Math.max(0, Math.floor(action.value || 0))) };
    case 'stepDays':
      return { ...state, days: Math.min(3650, Math.max(0, state.days + action.delta)) };
    case 'setMode':
      return { ...state, mode: action.value };
    case 'pickTerm':
      return { ...state, mode: action.mode, days: action.days };
    case 'toggle':
      return { ...state, [action.key]: !state[action.key] };
    case 'addHoliday': {
      const others = state.customHolidays.filter((h) => h.date !== action.date);
      const customHolidays = [...others, { date: action.date, name: action.name }].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      return { ...state, customHolidays };
    }
    case 'removeHoliday':
      return { ...state, customHolidays: state.customHolidays.filter((h) => h.date !== action.date) };
    case 'setTheme':
      return { ...state, theme: action.value };
    case 'openHolidays':
      return { ...state, holidaysOpen: true };
    case 'closeHolidays':
      return { ...state, holidaysOpen: false };
    default:
      return state;
  }
}

type DateContextValue = {
  state: DateState;
  dispatch: Dispatch<DateAction>;
  rules: HolidayRules;
  options: CountOptions;
  lookup: HolidayLookup;
};

const DateContext = createContext<DateContextValue | null>(null);

export function DateProvider({ children, initialState }: { children: ReactNode; initialState?: DateState }) {
  const [state, dispatch] = useReducer(dateReducer, initialState, (init) => init ?? loadState());

  useEffect(() => {
    try {
      const toSave: Partial<DateState> = {};
      for (const key of PERSISTED) (toSave as Record<string, unknown>)[key] = state[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  }, [state]);

  const rules = useMemo<HolidayRules>(
    () => ({ includeOptional: state.includeOptional, custom: state.customHolidays }),
    [state.includeOptional, state.customHolidays],
  );
  const options = useMemo<CountOptions>(
    () => ({ excludeStartDay: state.excludeStartDay, extendToBusinessDay: state.extendToBusinessDay }),
    [state.excludeStartDay, state.extendToBusinessDay],
  );
  const lookup = useMemo(() => createHolidayLookup(rules), [rules]);

  const value = useMemo(() => ({ state, dispatch, rules, options, lookup }), [state, rules, options, lookup]);
  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDateContext(): DateContextValue {
  const ctx = useContext(DateContext);
  if (!ctx) throw new Error('useDateContext precisa estar dentro de <DateProvider>');
  return ctx;
}
