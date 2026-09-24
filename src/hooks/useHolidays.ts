// src/hooks/useHolidays.ts
import { useMemo } from 'react';
import { useDateContext } from '../context/DateContext';
import { getHolidaysForYear, type Holiday } from '../utils/holidays';

/** Lista de feriados de um ano com as regras atuais + a função de consulta. */
export function useHolidays(year: number): { holidays: Holiday[]; isHoliday: (d: Date) => Holiday | null } {
  const { rules, lookup } = useDateContext();
  const holidays = useMemo(() => getHolidaysForYear(year, rules), [year, rules]);
  return { holidays, isHoliday: lookup };
}
