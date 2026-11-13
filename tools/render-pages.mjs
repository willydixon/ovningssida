// Skapar sidorna i public/ från mallarna i templates/ och texterna i public/texts.js.
// Körs med: node tools/render-pages.mjs
//
// I mallarna byts {{nyckel}} mot texten med samma nyckel. Ändra texter i texts.js
// och sidornas kod i templates/, inte i public/. manifest.json skapas också här.
// Informationssidorna (om.html med flera) är handskrivna och ligger inte i templates/.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sv } from '../public/texts.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATES = path.join(root, 'templates');
export const PUBLIC = path.join(root, 'public');
export const MANIFEST = path.join(PUBLIC, 'manifest.json');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderPage(template, texts = sv) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (typeof texts[key] !== 'string') throw new Error(`Texten saknas: ${key}`);
    return escapeHtml(texts[key]);
  });
}

// Alla mallar, som [filnamn, innehåll i mallen].
export async function readTemplates() {
  const names = (await readdir(TEMPLATES)).filter((f) => f.endsWith('.html')).sort();
  return Promise.all(names.map(async (name) => [name, await readFile(path.join(TEMPLATES, name), 'utf8')]));
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
  const templates = await readTemplates();
  for (const [name, template] of templates) {
    await writeFile(path.join(PUBLIC, name), renderPage(template));
  }
  await writeFile(MANIFEST, renderManifest());
  console.log(`Skrev ${templates.map(([name]) => name).join(', ')} och manifest.json från texts.js.`);
}
