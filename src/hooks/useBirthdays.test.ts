import { describe, expect, it } from 'vitest';
import { daysUntilBirthday } from './useBirthdays';

describe('daysUntilBirthday', () => {
  it('mantém o aniversário de hoje durante todo o dia', () => {
    expect(daysUntilBirthday('10-20', new Date(2026, 9, 20, 23, 59))).toBe(0);
  });
  it('conta amanhã e a virada de ano por dias de calendário', () => {
    expect(daysUntilBirthday('01-01', new Date(2026, 11, 31, 18))).toBe(1);
    expect(daysUntilBirthday('10-19', new Date(2026, 9, 20, 18))).toBe(364);
  });
});
