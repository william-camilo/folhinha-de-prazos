// src/services/csvExport.ts
// Geração de CSV com papaparse e download via Blob.
import Papa from 'papaparse';
import type { TermRow } from '../utils/calculator';
import type { Holiday } from '../utils/holidays';
import { formatDateBR, getDayOfWeekName, toISODate } from '../utils/format';

export type CsvFlavor = 'excel' | 'datastudio';

/** Defina VITE_NO_DOWNLOAD=true para builds embutidos onde o download é bloqueado (sobra o "Copiar"). */
export const canDownload = import.meta.env.VITE_NO_DOWNLOAD !== 'true';

/**
 * - excel: separador ";" e BOM UTF-8 (abre direto no Excel pt-BR).
 * - datastudio: separador "," e datas ISO (Looker Studio / Google Sheets).
 */
export function toCSV(rows: Record<string, string | number>[], flavor: CsvFlavor = 'excel'): string {
  const csv = Papa.unparse(rows, { delimiter: flavor === 'excel' ? ';' : ',', newline: '\r\n' });
  return flavor === 'excel' ? '﻿' + csv : csv;
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copia para a área de transferência (fallback: seleção de textarea). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text.replace(/^﻿/, ''));
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text.replace(/^﻿/, '');
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function termRowsToRecords(rows: TermRow[]): Record<string, string | number>[] {
  return rows.map(({ days, result }) => ({
    prazo_dias: days,
    tipo: result.mode === 'uteis' ? 'dias úteis' : 'dias corridos',
    data_inicial: formatDateBR(result.start),
    vencimento: formatDateBR(result.end),
    dia_semana: getDayOfWeekName(result.end),
    prorrogado: result.extended ? `sim (de ${formatDateBR(result.originalEnd)})` : 'não',
    feriados_no_caminho: result.holidaysInPath.map((h) => h.name).join(' | '),
  }));
}

export function holidaysToRecords(holidays: Holiday[], flavor: CsvFlavor): Record<string, string>[] {
  return holidays.map((h) => ({
    data: flavor === 'datastudio' ? toISODate(h.date) : formatDateBR(h.date),
    dia_semana: getDayOfWeekName(h.date),
    nome: h.name,
    tipo: h.type,
    ponto_facultativo: h.optional ? 'sim' : 'não',
  }));
}
