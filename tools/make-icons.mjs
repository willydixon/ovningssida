// Ritar sidans ikoner från en enda SVG och sparar dem som PNG i public/icons/.
// Körs med: NODE_PATH=$(npm root -g) node tools/make-icons.mjs
//
// Ikonen är en pratbubbla med en inspelningsprick: repliker och inspelning.
// Färgerna kommer från sidans accentfärg. Byt gärna när tjänsten har ett namn.

import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const ACCENT = '#b34d2e';

// rx = hörnradie på bakgrunden i en 512-ruta. 0 ger en hel fyrkant, som iPhone och
// Android själva rundar av. Pratbubblan ligger inom den säkra zonen för maskable-ikoner.
const svg = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="${rx}" fill="${ACCENT}"/>
  <g fill="#ffffff">
    <rect x="112" y="120" width="288" height="220" rx="68"/>
    <path d="M168 312 L144 396 L236 332 Z"/>
  </g>
  <circle cx="256" cy="230" r="60" fill="${ACCENT}"/>
</svg>`;

const variants = [
  { file: 'icon-192.png', size: 192, rx: 112 },
  { file: 'icon-512.png', size: 512, rx: 112 },
  { file: 'icon-maskable-512.png', size: 512, rx: 0 },
  { file: 'apple-touch-icon.png', size: 180, rx: 0 },
  { file: 'favicon-32.png', size: 32, rx: 112 }
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const v of variants) {
    await page.setViewportSize({ width: v.size, height: v.size });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
      <div style="width:${v.size}px;height:${v.size}px">${svg(v.rx)}</div></body></html>`);
    await page.screenshot({ path: path.join(out, v.file), omitBackground: true, clip: { x: 0, y: 0, width: v.size, height: v.size } });
    console.log('Sparade', v.file);
  }
} finally {
  await browser.close();
}
