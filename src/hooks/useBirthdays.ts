// src/hooks/useBirthdays.ts
// Gerencia lista de aniversariantes no localStorage.
import { useState, useEffect, useCallback } from 'react';

export type Birthday = {
  id: string;
  name: string;
  /** MM-DD */
  monthDay: string;
};

const KEY = 'folhinha-prazos:birthdays';

function load(): Birthday[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Birthday[]) : [];
  } catch {
    return [];
  }
}

function save(list: Birthday[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* sem armazenamento */ }
}

/** Quantos dias faltam para o próximo aniversário a partir de hoje. */
export function daysUntilBirthday(monthDay: string, today = new Date()): number {
  const [m, d] = monthDay.split('-').map(Number);
  const thisYear = new Date(today.getFullYear(), m - 1, d);
  const nextYear = new Date(today.getFullYear() + 1, m - 1, d);
  const target = thisYear >= today ? thisYear : nextYear;
  const diff = target.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round(diff / 86_400_000);
}

/** Urgência: 0=hoje, 1=amanhã/1 dia, 7=até 7 dias, 30=até 30 dias, 999=mais distante */
export function urgency(days: number): 0 | 1 | 7 | 30 | 999 {
  if (days === 0) return 0;
  if (days === 1) return 1;
  if (days <= 7) return 7;
  if (days <= 30) return 30;
  return 999;
}

export function useBirthdays() {
  const [list, setList] = useState<Birthday[]>(load);

  useEffect(() => { save(list); }, [list]);

  const add = useCallback((name: string, monthDay: string) => {
    setList((prev) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return [...prev, { id, name, monthDay }].sort((a, b) =>
        daysUntilBirthday(a.monthDay) - daysUntilBirthday(b.monthDay),
      );
    });
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((b) => b.id !== id));
  }, []);

  /** Próximo aniversariante (menor dias faltando) */
  const next = list.length
    ? list.reduce((best, b) =>
        daysUntilBirthday(b.monthDay) < daysUntilBirthday(best.monthDay) ? b : best,
      )
    : null;

  return { list, add, remove, next };
}
