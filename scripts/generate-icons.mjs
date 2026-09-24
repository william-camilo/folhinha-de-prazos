// Gera os PNGs do manifest a partir de public/icons/icon.svg (requer `npm i -D sharp`).
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/icons/icon.svg', import.meta.url));
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

await sharp(svg).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(svg).resize(512, 512).png().toFile(out('icon-512.png'));
await sharp(svg).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
// maskable: arte reduzida a 80% dentro de um fundo cheio (zona segura)
const inner = await sharp(svg).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1F4FD1' } })
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(out('icon-maskable-512.png'));
console.log('Ícones gerados.');
