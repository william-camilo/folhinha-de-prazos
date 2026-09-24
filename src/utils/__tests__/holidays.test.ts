import { describe, expect, it } from 'vitest';
import {
  calculateEaster,
  createHolidayLookup,
  dateKey,
  getBrazilianHolidays,
  getHolidaysForYear,
  getNextBusinessDay,
  isBusinessDay,
  isWeekend,
} from '../holidays';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('calculateEaster', () => {
  it.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2030, '2030-04-21'],
  ])('Páscoa de %i', (year, expected) => {
    expect(dateKey(calculateEaster(year))).toBe(expected);
  });
});

describe('getBrazilianHolidays', () => {
  const list = getBrazilianHolidays(2026);
  const byName = (name: string) => list.find((h) => h.name === name)!;

  it('traz 9 fixos + 5 móveis em ordem cronológica', () => {
    expect(list).toHaveLength(14);
    const times = list.map((h) => h.date.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('calcula os móveis a partir da Páscoa', () => {
    expect(dateKey(byName('Carnaval').date)).toBe('2026-02-17');
    expect(dateKey(byName('Quarta-feira de Cinzas').date)).toBe('2026-02-18');
    expect(dateKey(byName('Sexta-feira Santa').date)).toBe('2026-04-03');
    expect(dateKey(byName('Corpus Christi').date)).toBe('2026-06-04');
  });

  it('marca pontos facultativos', () => {
    expect(byName('Carnaval').optional).toBe(true);
    expect(byName('Sexta-feira Santa').optional).toBe(false);
    expect(byName('Natal').type).toBe('fixo');
  });
});

describe('regras de feriado', () => {
  it('remove facultativos quando includeOptional = false', () => {
    const list = getHolidaysForYear(2026, { includeOptional: false, custom: [] });
    expect(list).toHaveLength(10);
    expect(list.some((h) => h.name === 'Corpus Christi')).toBe(false);
  });

  it('inclui feriados locais do ano certo', () => {
    const rules = { includeOptional: true, custom: [{ date: '2026-09-08', name: 'N. Sra. da Vitória' }] };
    expect(getHolidaysForYear(2026, rules).some((h) => h.type === 'local')).toBe(true);
    expect(getHolidaysForYear(2027, rules).some((h) => h.type === 'local')).toBe(false);
    const lookup = createHolidayLookup(rules);
    expect(lookup(d(2026, 9, 8))?.name).toBe('N. Sra. da Vitória');
  });
});

describe('dias úteis', () => {
  const lookup = createHolidayLookup();

  it('reconhece fim de semana', () => {
    expect(isWeekend(d(2026, 9, 26))).toBe(true); // sábado
    expect(isWeekend(d(2026, 9, 28))).toBe(false);
  });

  it('feriado não é dia útil', () => {
    expect(isBusinessDay(d(2026, 10, 12), lookup)).toBe(false);
    expect(isBusinessDay(d(2026, 10, 13), lookup)).toBe(true);
  });

  it('próximo dia útil pula fim de semana + feriado', () => {
    // sexta 09/10/2026 → segunda 12/10 é feriado → terça 13/10
    expect(dateKey(getNextBusinessDay(d(2026, 10, 9), lookup))).toBe('2026-10-13');
  });
});
