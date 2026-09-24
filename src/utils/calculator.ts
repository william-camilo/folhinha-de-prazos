// src/utils/calculator.ts
// Algoritmos de contagem de prazos (dias corridos e dias úteis).
//
// Convenções (CPC, art. 224 e art. 219):
// - Por padrão exclui-se o dia do começo e inclui-se o do vencimento.
// - Em dias úteis, só contam dias com expediente (sem fim de semana/feriado).
// - Em dias corridos, se o vencimento cair em dia sem expediente, pode ser
//   prorrogado para o primeiro dia útil seguinte.
import { addDays, differenceInCalendarDays } from 'date-fns';
import { getNextBusinessDay, isBusinessDay, isWeekend, type Holiday, type HolidayLookup } from './holidays';

export type CountMode = 'corridos' | 'uteis';

export type CountOptions = {
  /** Excluir o dia do começo da contagem (padrão do CPC). */
  excludeStartDay: boolean;
  /** Prorrogar o vencimento em dias corridos para o próximo dia útil. */
  extendToBusinessDay: boolean;
};

export const DEFAULT_OPTIONS: CountOptions = { excludeStartDay: true, extendToBusinessDay: true };

export type DayStatus = 'counted' | 'weekend' | 'holiday' | 'extension';

export type DayStep = {
  date: Date;
  status: DayStatus;
  /** Posição na contagem (1..n) quando o dia foi contado. */
  index?: number;
  holiday?: Holiday;
};

export type DeadlineResult = {
  mode: CountMode;
  days: number;
  start: Date;
  /** Vencimento final (já prorrogado, se for o caso). */
  end: Date;
  /** Vencimento antes da prorrogação (igual a `end` quando não houve). */
  originalEnd: Date;
  extended: boolean;
  steps: DayStep[];
  weekendsSkipped: number;
  holidaysInPath: Holiday[];
};

const classify = (date: Date, lookup: HolidayLookup): Omit<DayStep, 'index'> => {
  const holiday = lookup(date);
  if (holiday) return { date, status: 'holiday', holiday };
  if (isWeekend(date)) return { date, status: 'weekend' };
  return { date, status: 'counted' };
};

function summarize(
  mode: CountMode,
  days: number,
  start: Date,
  originalEnd: Date,
  end: Date,
  steps: DayStep[],
  lookup: HolidayLookup,
): DeadlineResult {
  const holidaysInPath: Holiday[] = [];
  let weekendsSkipped = 0;
  for (const s of steps) {
    const h = lookup(s.date);
    if (h) holidaysInPath.push(h);
    else if (isWeekend(s.date)) weekendsSkipped++;
  }
  return {
    mode,
    days,
    start,
    end,
    originalEnd,
    extended: end.getTime() !== originalEnd.getTime(),
    steps,
    weekendsSkipped,
    holidaysInPath,
  };
}

/** Soma N dias corridos a partir da data inicial. */
export function addCalendarDays(
  start: Date,
  days: number,
  lookup: HolidayLookup,
  options: CountOptions = DEFAULT_OPTIONS,
): DeadlineResult {
  const n = Math.max(0, Math.floor(days));
  const first = options.excludeStartDay ? addDays(start, 1) : start;
  const steps: DayStep[] = [];
  for (let i = 0; i < n; i++) {
    const date = addDays(first, i);
    const base = classify(date, lookup);
    // em dias corridos todo dia conta; o status indica apenas o que ele é
    steps.push({ ...base, index: i + 1 });
  }
  const originalEnd = n === 0 ? start : addDays(first, n - 1);
  let end = originalEnd;
  if (n > 0 && options.extendToBusinessDay && !isBusinessDay(originalEnd, lookup)) {
    end = getNextBusinessDay(originalEnd, lookup);
    // dias entre o vencimento original e o prorrogado (o último é o novo vencimento)
    for (let d = addDays(originalEnd, 1); d <= end; d = addDays(d, 1)) {
      const base = classify(d, lookup);
      steps.push(d.getTime() === end.getTime() ? { ...base, status: 'extension' } : base);
    }
  }
  return summarize('corridos', n, start, originalEnd, end, steps, lookup);
}

/** Soma N dias úteis (pula fins de semana e feriados). */
export function addBusinessDays(
  start: Date,
  days: number,
  lookup: HolidayLookup,
  options: CountOptions = DEFAULT_OPTIONS,
): DeadlineResult {
  const n = Math.max(0, Math.floor(days));
  const steps: DayStep[] = [];
  let counted = 0;
  let cursor = options.excludeStartDay ? addDays(start, 1) : start;
  // limite de segurança: 20 anos
  for (let guard = 0; counted < n && guard < 7300; guard++) {
    const base = classify(cursor, lookup);
    if (base.status === 'counted') {
      counted++;
      steps.push({ ...base, index: counted });
    } else {
      steps.push(base);
    }
    if (counted === n) break;
    cursor = addDays(cursor, 1);
  }
  const end = n === 0 ? start : cursor;
  return summarize('uteis', n, start, end, end, steps, lookup);
}

/** Atalho que escolhe o algoritmo pelo modo. */
export function calculateDeadline(
  mode: CountMode,
  start: Date,
  days: number,
  lookup: HolidayLookup,
  options: CountOptions = DEFAULT_OPTIONS,
): DeadlineResult {
  return mode === 'uteis'
    ? addBusinessDays(start, days, lookup, options)
    : addCalendarDays(start, days, lookup, options);
}

export type IntervalResult = {
  start: Date;
  end: Date;
  calendarDays: number;
  businessDays: number;
  weekendDays: number;
  holidays: Holiday[];
  steps: DayStep[];
  /** true quando a data final é anterior à inicial (contagem invertida). */
  reversed: boolean;
};

/** Conta dias corridos e úteis entre duas datas. */
export function countBetween(
  a: Date,
  b: Date,
  lookup: HolidayLookup,
  options: Pick<CountOptions, 'excludeStartDay'> = DEFAULT_OPTIONS,
): IntervalResult {
  const reversed = b < a;
  const start = reversed ? b : a;
  const end = reversed ? a : b;
  const first = options.excludeStartDay ? addDays(start, 1) : start;
  const steps: DayStep[] = [];
  let businessDays = 0;
  let weekendDays = 0;
  const holidays: Holiday[] = [];
  for (let d = first; d <= end; d = addDays(d, 1)) {
    const base = classify(d, lookup);
    if (base.status === 'counted') {
      businessDays++;
      steps.push({ ...base, index: businessDays });
    } else {
      if (base.holiday) holidays.push(base.holiday);
      else weekendDays++;
      steps.push(base);
    }
  }
  const calendarDays = differenceInCalendarDays(end, start) + (options.excludeStartDay ? 0 : 1);
  return { start, end, calendarDays, businessDays, weekendDays, holidays, steps, reversed };
}

/** Prazos usuais exibidos nas tabelas. */
export const COMMON_TERMS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180];

export type TermRow = {
  days: number;
  result: DeadlineResult;
};

/** Tabela de vencimentos para vários prazos a partir da mesma data. */
export function buildTermTable(
  mode: CountMode,
  start: Date,
  lookup: HolidayLookup,
  options: CountOptions = DEFAULT_OPTIONS,
  terms: number[] = COMMON_TERMS,
): TermRow[] {
  return terms.map((days) => ({ days, result: calculateDeadline(mode, start, days, lookup, options) }));
}
