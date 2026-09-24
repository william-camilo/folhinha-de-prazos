import { describe, expect, it } from 'vitest';
import { addBusinessDays, addCalendarDays, buildTermTable, countBetween } from '../calculator';
import { createHolidayLookup, dateKey } from '../holidays';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const lookup = createHolidayLookup();

describe('addBusinessDays', () => {
  it('15 dias úteis a partir de ter 22/09/2026 pula o feriado de 12/10', () => {
    const r = addBusinessDays(d(2026, 9, 22), 15, lookup);
    expect(dateKey(r.end)).toBe('2026-10-14');
    expect(r.holidaysInPath.map((h) => h.name)).toEqual(['Nossa Senhora Aparecida']);
    expect(r.weekendsSkipped).toBe(6);
    expect(r.extended).toBe(false);
  });

  it('começa no primeiro dia útil quando a data inicial é sexta', () => {
    const r = addBusinessDays(d(2026, 9, 25), 1, lookup);
    expect(dateKey(r.end)).toBe('2026-09-28');
  });

  it('pode incluir o dia do começo', () => {
    const r = addBusinessDays(d(2026, 9, 22), 1, lookup, { excludeStartDay: false, extendToBusinessDay: true });
    expect(dateKey(r.end)).toBe('2026-09-22');
  });

  it('zero dias devolve a própria data', () => {
    expect(dateKey(addBusinessDays(d(2026, 9, 22), 0, lookup).end)).toBe('2026-09-22');
  });

  it('atravessa o Carnaval quando facultativos contam', () => {
    // sex 13/02/2026 + 1 útil: seg 16 e ter 17 (Carnaval), qua 18 (Cinzas) → qui 19
    expect(dateKey(addBusinessDays(d(2026, 2, 13), 1, lookup).end)).toBe('2026-02-19');
    const semFacultativo = createHolidayLookup({ includeOptional: false, custom: [] });
    expect(dateKey(addBusinessDays(d(2026, 2, 13), 1, semFacultativo).end)).toBe('2026-02-16');
  });
});

describe('addCalendarDays', () => {
  it('10 dias corridos a partir de 22/09/2026 vencem 02/10', () => {
    const r = addCalendarDays(d(2026, 9, 22), 10, lookup);
    expect(dateKey(r.end)).toBe('2026-10-02');
    expect(r.extended).toBe(false);
  });

  it('prorroga vencimento no domingo para segunda', () => {
    const r = addCalendarDays(d(2026, 9, 22), 5, lookup);
    expect(dateKey(r.originalEnd)).toBe('2026-09-27');
    expect(dateKey(r.end)).toBe('2026-09-28');
    expect(r.extended).toBe(true);
    expect(r.steps.at(-1)?.status).toBe('extension');
  });

  it('prorroga sábado + feriado na segunda até terça', () => {
    // 10/10/2026 é sábado; 12/10 feriado → 13/10
    const r = addCalendarDays(d(2026, 9, 30), 10, lookup);
    expect(dateKey(r.originalEnd)).toBe('2026-10-10');
    expect(dateKey(r.end)).toBe('2026-10-13');
  });

  it('sem prorrogação mantém o vencimento original', () => {
    const r = addCalendarDays(d(2026, 9, 22), 5, lookup, { excludeStartDay: true, extendToBusinessDay: false });
    expect(dateKey(r.end)).toBe('2026-09-27');
  });

  it('incluindo o dia do começo conta um dia a menos', () => {
    const r = addCalendarDays(d(2026, 9, 22), 10, lookup, { excludeStartDay: false, extendToBusinessDay: false });
    expect(dateKey(r.end)).toBe('2026-10-01');
  });

  it('passa pela virada do ano', () => {
    const r = addCalendarDays(d(2026, 12, 20), 12, lookup);
    // 20/12 + 12 = sex 01/01/2027 (feriado) → prorroga para seg 04/01
    expect(dateKey(r.originalEnd)).toBe('2027-01-01');
    expect(dateKey(r.end)).toBe('2027-01-04');
  });
});

describe('countBetween', () => {
  it('conta corridos e úteis entre duas datas', () => {
    const r = countBetween(d(2026, 9, 22), d(2026, 10, 14), lookup);
    expect(r.calendarDays).toBe(22);
    expect(r.businessDays).toBe(15);
    expect(r.holidays).toHaveLength(1);
    expect(r.reversed).toBe(false);
  });

  it('aceita datas invertidas', () => {
    const r = countBetween(d(2026, 10, 14), d(2026, 9, 22), lookup);
    expect(r.reversed).toBe(true);
    expect(r.businessDays).toBe(15);
  });
});

describe('buildTermTable', () => {
  it('gera uma linha por prazo', () => {
    const rows = buildTermTable('uteis', d(2026, 9, 22), lookup);
    expect(rows).toHaveLength(10);
    expect(rows[2].days).toBe(15);
    expect(dateKey(rows[2].result.end)).toBe('2026-10-14');
  });
});
