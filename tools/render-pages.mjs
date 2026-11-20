// Skapar sidorna i public/ från mallarna i templates/ och texterna i public/texts.js.
// Körs med: node tools/render-pages.mjs
//
// I mallarna byts {{nyckel}} mot texten med samma nyckel. Ändra texter i texts.js
// och sidornas kod i templates/, inte i public/. manifest.json skapas också här.
// Informationssidorna (om.html med flera) är handskrivna och ligger inte i templates/.

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sv, TEXTS, LANGS } from '../public/texts.js';
import { ART, resetIds } from './scene-art.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATES = path.join(root, 'templates');
export const PUBLIC = path.join(root, 'public');
export const MANIFEST = path.join(PUBLIC, 'manifest.json');
export const IMAGES = path.join(PUBLIC, 'img');
// Ansiktsanalysen (public/face.js): modellen läggs in för hand, och models.json säger om den finns,
// så att sidan kan fråga utan att få 404 när den saknas.
export const FACE_DIR = path.join(PUBLIC, 'vendor', 'mediapipe');
export const renderFaceModels = () => `${JSON.stringify({ ansikte: existsSync(path.join(FACE_DIR, 'face_landmarker.task')) })}\n`;
// Svenska sidor ligger i public/, engelska i public/en/. Skript, stil, ikoner och bilder
// är gemensamma och ligger i public/.
export const LANG_DIRS = { sv: PUBLIC, en: path.join(PUBLIC, 'en') };
export const pageOptions = (lang) => (lang === 'sv'
  ? { root: '', base: '/', other: 'en/' }
  : { root: '../', base: `/${lang}/`, other: '../' });
const ICONS = path.join(root, 'tools', 'icons');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// {{icon:namn}} blir ikonen tools/icons/namn.svg (Lucide, ISC-licens) direkt i sidan.
export function iconSvg(name) {
  const svg = readFileSync(path.join(ICONS, `${name}.svg`), 'utf8').replace(/<!--.*?-->/s, '').trim();
  return svg
    .replace(/\s*\n\s*/g, ' ')
    .replace('<svg class="', '<svg aria-hidden="true" focusable="false" class="ic ');
}

// {{@root}} blir vägen till de gemensamma filerna, {{@base}} sidans mapp på servern och
// {{@other}} sidan på det andra språket.
export function renderPage(template, texts = sv, options = pageOptions('sv')) {
  return template
    .replace(/\{\{@(root|base|other)\}\}/g, (match, name) => options[name])
    .replace(/\{\{icon:([a-z-]+)\}\}/g, (match, name) => iconSvg(name))
    .replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (typeof texts[key] !== 'string') throw new Error(`Texten saknas: ${key}`);
      return escapeHtml(texts[key]);
    });
}

// Färgerna i scenbilderna, i utseendet Premiär.
export const ART_PALETTE = {
  wall1: '#2a1f17', wall2: '#120d0a', sky1: '#0c2630', sky2: '#14404a', moon: '#f6e6c4', city: '#071318',
  light: '#f2b544', frame: '#0a0705', lamp: '#2e2118', table: '#0d0907', key: '#f2b544', person: '#050403',
  machine: '#0d0907', steam: '#f6e6c4', cup: '#3a2a1e', dark1: '#07090c', dark2: '#020304', screen: '#9fd9ff',
  train: '#0e1418', platform: '#08090a',
  // Till nivå 2–5: eld, vatten, rymd, sten och guld.
  fire: '#e0603a', water: '#0b2a33', wave: '#1d5a6b', space1: '#03050b', space2: '#0b1630', planet: '#c9733a',
  stone: '#1a1512', gold: '#d9a640', field: '#0d1a10', alien: '#9fe6c9'
};

// Bilderna till scenerna, som [filnamn, svg].
export function renderImages() {
  return Object.entries(ART).map(([name, draw]) => {
    resetIds();
    return [`${name}.svg`, `${draw(ART_PALETTE).trim()}\n`];
  });
}

// Alla mallar, som [filnamn, innehåll i mallen].
export async function readTemplates() {
  const names = (await readdir(TEMPLATES)).filter((f) => f.endsWith('.html')).sort();
  return Promise.all(names.map(async (name) => [name, await readFile(path.join(TEMPLATES, name), 'utf8')]));
}

export function renderManifest(texts = sv, lang = 'sv') {
  const { base, root } = pageOptions(lang);
  const manifest = {
    id: base,
    name: texts.app_name,
    short_name: texts.app_name,
    description: texts.app_description,
    lang: texts.lang,
    dir: 'ltr',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#0d0b09',
    theme_color: '#0d0b09',
    icons: [
      { src: `${root}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${root}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${root}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

// Skriv filerna bara när skriptet körs direkt, inte när testerna importerar det.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const templates = await readTemplates();
  for (const lang of LANGS) {
    await mkdir(LANG_DIRS[lang], { recursive: true });
    for (const [name, template] of templates) {
      await writeFile(path.join(LANG_DIRS[lang], name), renderPage(template, TEXTS[lang], pageOptions(lang)));
    }
    await writeFile(path.join(LANG_DIRS[lang], 'manifest.json'), renderManifest(TEXTS[lang], lang));
  }
  await writeFile(path.join(FACE_DIR, 'models.json'), renderFaceModels());
  await mkdir(IMAGES, { recursive: true });
  const images = renderImages();
  for (const [name, svg] of images) await writeFile(path.join(IMAGES, name), svg);
  console.log(`Skrev ${templates.map(([name]) => name).join(', ')} och manifest.json på ${LANGS.join(' och ')}, och ${images.length} scenbilder.`);
}
