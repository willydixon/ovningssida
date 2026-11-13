// Skapar public/index.html och public/manifest.json från texterna i public/texts.js.
// Körs med: node tools/render-pages.mjs
//
// Mallen ligger i templates/index.html, där {{nyckel}} byts mot texten med samma
// nyckel. Ändra texter i texts.js och mallens kod i templates/, inte i public/.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sv } from '../public/texts.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATE = path.join(root, 'templates', 'index.html');
export const INDEX = path.join(root, 'public', 'index.html');
export const MANIFEST = path.join(root, 'public', 'manifest.json');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderIndex(template, texts = sv) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (typeof texts[key] !== 'string') throw new Error(`Texten saknas: ${key}`);
    return escapeHtml(texts[key]);
  });
}

export function renderManifest(texts = sv) {
  const manifest = {
    id: '/',
    name: texts.app_name,
    short_name: texts.app_name,
    description: texts.app_description,
    lang: texts.lang,
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#faf9f7',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

// Skriv filerna bara när skriptet körs direkt, inte när testerna importerar det.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeFile(INDEX, renderIndex(await readFile(TEMPLATE, 'utf8')));
  await writeFile(MANIFEST, renderManifest());
  console.log('Skrev public/index.html och public/manifest.json från texts.js.');
}
