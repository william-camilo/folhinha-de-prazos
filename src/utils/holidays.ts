// src/utils/holidays.ts
// Feriados nacionais do Brasil (fixos + móveis) e utilitários de dia útil.
// Não depende de bibliotecas: usa apenas Date local (sem UTC) para evitar
// deslocamentos de fuso.

export type HolidayType = 'fixo' | 'movel' | 'local';

export type Holiday = {
  date: Date;
  name: string;
  type: HolidayType;
  /** Ponto facultativo nacional (Carnaval, Cinzas, Corpus Christi). */
  optional?: boolean;
};

/** Regras que decidem o que conta como dia sem expediente. */
export type HolidayRules = {
  /** Tratar pontos facultativos como feriado. */
  includeOptional: boolean;
  /** Feriados locais/estaduais/municipais informados pelo usuário (ISO yyyy-MM-dd). */
  custom: { date: string; name: string }[];
};

export const DEFAULT_RULES: HolidayRules = { includeOptional: true, custom: [] };

const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: 'Confraternização Universal' },
  { month: 3, day: 21, name: 'Tiradentes' },
  { month: 4, day: 1, name: 'Dia do Trabalho' },
  { month: 8, day: 7, name: 'Independência do Brasil' },
  { month: 9, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 10, day: 2, name: 'Finados' },
  { month: 10, day: 15, name: 'Proclamação da República' },
  { month: 10, day: 20, name: 'Dia da Consciência Negra' },
  { month: 11, day: 25, name: 'Natal' },
];

/** Deslocamentos em relação ao domingo de Páscoa. */
const MOVABLE_HOLIDAYS = [
  { offset: -48, name: 'Carnaval (segunda-feira)', optional: true },
  { offset: -47, name: 'Carnaval', optional: true },
  { offset: -46, name: 'Quarta-feira de Cinzas', optional: true },
  { offset: -2, name: 'Sexta-feira Santa', optional: false },
  { offset: 60, name: 'Corpus Christi', optional: true },
];

/** Chave estável yyyy-MM-dd em horário local. */
export const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Algoritmo Meeus/Jones/Butcher – calcula o domingo de Páscoa. */
export function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = março, 4 = abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Lista completa de feriados nacionais (fixos + móveis) de um ano, em ordem. */
export function getBrazilianHolidays(year: number): Holiday[] {
  const easter = calculateEaster(year);
  const holidays: Holiday[] = FIXED_HOLIDAYS.map(({ month, day, name }) => ({
    date: new Date(year, month, day),
    name,
    type: 'fixo' as const,
  }));

  MOVABLE_HOLIDAYS.forEach(({ offset, name, optional }) => {
    const d = new Date(easter);
    d.setDate(d.getDate() + offset);
    holidays.push({ date: d, name, type: 'movel', optional });
  });

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Feriados de um ano já aplicando as regras (facultativos + locais). */
export function getHolidaysForYear(year: number, rules: HolidayRules = DEFAULT_RULES): Holiday[] {
  const base = getBrazilianHolidays(year).filter((h) => rules.includeOptional || !h.optional);
  const local: Holiday[] = rules.custom
    .filter((c) => c.date.startsWith(`${year}-`))
    .map((c) => {
      const [y, m, d] = c.date.split('-').map(Number);
      return { date: new Date(y, m - 1, d), name: c.name, type: 'local' as const };
    });
  return [...base, ...local].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Verifica se a data é sábado (6) ou domingo (0). */
export const isWeekend = (date: Date): boolean => date.getDay() === 0 || date.getDay() === 6;

/**
 * Cria uma consulta de feriados com cache por ano.
 * Use uma instância por conjunto de regras (o contexto já faz isso).
 */
export type HolidayLookup = (date: Date) => Holiday | null;

export function createHolidayLookup(rules: HolidayRules = DEFAULT_RULES): HolidayLookup {
  const cache: Record<number, Map<string, Holiday>> = {};
  return (date: Date) => {
    const year = date.getFullYear();
    if (!cache[year]) {
      cache[year] = new Map(getHolidaysForYear(year, rules).map((h) => [dateKey(h.date), h]));
    }
    return cache[year].get(dateKey(date)) ?? null;
  };
}

const defaultLookup = createHolidayLookup();

/** Retorna o feriado correspondente ou null. */
export const isHoliday = (date: Date, lookup: HolidayLookup = defaultLookup): Holiday | null => lookup(date);

/** Dia útil? Não é fim de semana nem feriado. */
export const isBusinessDay = (date: Date, lookup: HolidayLookup = defaultLookup): boolean =>
  !isWeekend(date) && !lookup(date);

/** Próximo dia útil (exclui o próprio dia caso já seja útil). */
export const getNextBusinessDay = (date: Date, lookup: HolidayLookup = defaultLookup): Date => {
  const next = new Date(date);
  do {
    next.setDate(next.getDate() + 1);
  } while (!isBusinessDay(next, lookup));
  return next;
};
