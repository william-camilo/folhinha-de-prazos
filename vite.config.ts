/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { getBrazilianHolidays } from './src/utils/holidays';

/**
 * Gera /api/holidays.csv (sem back-end) para o Looker Studio / Data Studio.
 * - Em `npm run dev`: servido pelo middleware do Vite (aceita ?from=2025&to=2030).
 * - Em `npm run build`: emitido como arquivo estático em dist/api/holidays.csv
 *   cobrindo do ano anterior até 5 anos à frente.
 */
function holidaysCsv(fromYear: number, toYear: number): string {
  const lines = ['data,dia_semana,nome,tipo,ponto_facultativo'];
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
  for (let y = fromYear; y <= toYear; y++) {
    for (const h of getBrazilianHolidays(y)) {
      const iso = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(
        h.date.getDate(),
      ).padStart(2, '0')}`;
      lines.push([iso, weekday.format(h.date), `"${h.name}"`, h.type, h.optional ? 'sim' : 'nao'].join(','));
    }
  }
  return lines.join('\n') + '\n';
}

function holidaysApiPlugin(): Plugin {
  const now = new Date().getFullYear();
  return {
    name: 'holidays-csv-api',
    configureServer(server) {
      server.middlewares.use('/api/holidays.csv', (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const from = Number(url.searchParams.get('from')) || now - 1;
        const to = Number(url.searchParams.get('to')) || now + 5;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(holidaysCsv(from, Math.min(to, from + 50)));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'api/holidays.csv', source: holidaysCsv(now - 1, now + 5) });
    },
  };
}

export default defineConfig({
  // Para GitHub Pages em subpasta, troque por '/nome-do-repo/'.
  base: './',
  plugins: [react(), holidaysApiPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: false,
  },
});
