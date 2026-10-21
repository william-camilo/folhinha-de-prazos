import { expect, it } from 'vitest';
import { toCSV } from './csvExport';

it('mantém BOM, separadores e escape após carregar o exportador sob demanda', async () => {
  expect(await toCSV([{ nome: 'São Paulo; "Centro"', dias: 15 }]))
    .toBe('\uFEFFnome;dias\r\n"São Paulo; ""Centro""";15');
  expect(await toCSV([{ nome: 'A,B', dias: 5 }], 'datastudio'))
    .toBe('nome,dias\r\n"A,B",5');
});
