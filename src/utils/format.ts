// src/utils/format.ts
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Converte Date → "yyyy-MM-dd" (valor de <input type="date">). */
export const toISODate = (d: Date): string => format(d, 'yyyy-MM-dd');

/** Converte "yyyy-MM-dd" → Date local (meia-noite), sem conversão UTC. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
}

/** 09/10/2026 */
export const formatDateBR = (d: Date): string => format(d, 'dd/MM/yyyy');

/** sexta-feira */
export const getDayOfWeekName = (d: Date): string => format(d, 'EEEE', { locale: ptBR });

/** sex */
export const getDayOfWeekShort = (d: Date): string => format(d, 'EEE', { locale: ptBR });

/** sexta-feira, 9 de outubro de 2026 */
export const formatLong = (d: Date): string => format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

/** outubro */
export const getMonthName = (d: Date): string => format(d, 'MMMM', { locale: ptBR });

/** 9 out */
export const formatShort = (d: Date): string => format(d, 'd MMM', { locale: ptBR });

/** Pluralização simples: 1 dia / 2 dias. */
export const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
