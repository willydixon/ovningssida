// Tester för bilden med resultatet att dela (public/sharecard.js).
// Först radbrytning och kortning med påhittade bredder, sedan i Chromium med de riktiga
// typsnitten: att varje nivå, roll och bedömning på båda språken får plats inom det som
// TikTok och Instagram inte täcker, utan att något kortas, och att bilden blir en riktig PNG.
// Körs med: node tests/sharecard.mjs

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { CARD_W, CARD_H, SIDE, SAFE_TOP, SAFE_BOTTOM, fitText, wrapText, balanceText } from '../public/sharecard.js';
import { TEXTS } from '../public/texts.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// ---- Utan webbläsare: varje tecken är 10 bildpunkter brett ----
const measure = (s) => Array.from(s).length * 10;

check(CARD_W === 1080 && CARD_H === 1920 && CARD_W / CARD_H === 9 / 16, 'Bilden är 1080 × 1920, formatet 9:16 som TikTok och Instagram Stories');
check(SIDE > 0 && SAFE_TOP > 0 && SAFE_BOTTOM < CARD_H, 'Marginalerna för TikToks och Instagrams knappar och texter finns');

check(fitText(measure, 'Kuppen', 100) === 'Kuppen', 'fitText: en text som får plats ändras inte');
const cut = fitText(measure, 'Den hemliga identiteten', 100);
check(cut.endsWith('…') && measure(cut) <= 100 && cut === 'Den hemli…', `fitText: en för lång text kortas med … (${cut})`);
check(fitText(measure, 'Den hemliga', 60) === 'Den h…', 'fitText: inget mellanslag före …');

check(JSON.stringify(wrapText(measure, 'Ett ungefärligt betyg från mätningar', 160)) === JSON.stringify(['Ett ungefärligt', 'betyg från', 'mätningar']), 'wrapText: texten delas vid mellanslag');
const two = wrapText(measure, 'ett två tre fyra fem sex sju', 90, 2);
check(two.length === 2 && two[1].endsWith('…') && two.every((l) => measure(l) <= 90), `wrapText: fler rader än tillåtet kortar den sista med … (${two.join(' / ')})`);
const longWord = wrapText(measure, 'Superhjältefilmsmaraton', 100);
check(longWord.length === 1 && longWord[0].endsWith('…') && measure(longWord[0]) <= 100, 'wrapText: ett ord som är för långt kortas');

check(JSON.stringify(balanceText(measure, 'Redo för större roller', 300)) === JSON.stringify(['Redo för större roller']), 'balanceText: en rad när det får plats');
const balanced = balanceText(measure, 'Redo för större roller', 160);
check(JSON.stringify(balanced) === JSON.stringify(['Redo för', 'större roller']), `balanceText: två rader som är så lika långa som möjligt (${balanced.join(' / ')})`);
const smaller = balanceText(measure, 'Mindre roller passar dig just nu', 200);
check(smaller.length === 2 && Math.abs(measure(smaller[0]) - measure(smaller[1])) <= 60, `balanceText: ${smaller.join(' / ')}`);

for (const [code, texts] of Object.entries(TEXTS)) {
  const keys = ['result_share_title', 'result_share_text', 'result_share_button', 'result_share_save', 'result_share_note', 'result_share_alt', 'result_share_file', 'result_share_done', 'result_share_failed'];
  check(keys.every((k) => typeof texts[k] === 'string' && texts[k].length > 0), `Texterna för delningen finns på ${code}`);
  check(/^[a-z0-9-]+\{n\}$/.test(texts.result_share_file), `Filnamnet på ${code} har bara små bokstäver a–z, siffror och bindestreck (${texts.result_share_file})`);
}
check(/Utseendet räknas aldrig/.test(TEXTS.sv.result_share_note) && /Looks never count/.test(TEXTS.en.result_share_note), 'Bilden säger att utseendet aldrig räknas, på båda språken');
check(/Ingen bild på dig/.test(TEXTS.sv.result_share_text) && /No picture of you/.test(TEXTS.en.result_share_text), 'Texten vid bilden säger att ingen bild på användaren finns med');

// ---- I Chromium med de riktiga typsnitten ----
const PORT = 8127;
const BASE = `http://localhost:${PORT}`;
const server = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url)), String(PORT)], { stdio: 'ignore' });
await sleep(800);
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/index.html`);

  // Alla kombinationer: språk, nivå, roll A eller B i varje scen, de tre bedömningarna och
  // det bredaste betyget (10 överallt) och ett med decimal.
  const report = await page.evaluate(async () => {
    const { drawCard, CARD_W, CARD_H, SIDE, SAFE_TOP, SAFE_BOTTOM, CARD_FONTS } = await import('/sharecard.js');
    const { SCENES_BY_LANG, LEVELS_BY_LANG } = await import('/scenes.js');
    const { t } = await import('/texts.js');
    await Promise.all(CARD_FONTS.map((f) => document.fonts.load(f)));
    const fontsReady = CARD_FONTS.every((f) => document.fonts.check(f));
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');
    const drawn = [];
    const fill = ctx.fillText.bind(ctx);
    ctx.fillText = (text, x, y) => {
      const w = ctx.measureText(text).width;
      const left = ctx.textAlign === 'center' ? x - w / 2 : ctx.textAlign === 'right' ? x - w : x;
      drawn.push({ text, left, right: left + w, y });
      fill(text, x, y);
    };
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const problems = [];
    let cards = 0;
    let lowest = 0;
    for (const lang of ['sv', 'en']) {
      for (const level of LEVELS_BY_LANG[lang]) {
        const scenes = SCENES_BY_LANG[lang].filter((s) => s.niva === level.niva);
        for (const pick of [0, 1]) {
          for (const roles of ['result_roles_bigger_title', 'result_roles_smaller_title', 'result_roles_basics_title']) {
            for (const score of ['10', new Intl.NumberFormat(t('locale_code', {}, lang), { maximumFractionDigits: 1 }).format(9.8)]) {
              drawn.length = 0;
              const model = {
                brand: t('app_name', {}, lang),
                level: t('level_title', { n: level.niva, name: level.namn }, lang),
                score,
                of: t('rating_of', {}, lang),
                title: t(roles, {}, lang),
                rows: scenes.map((s) => ({ role: cap(s.roller[pick].typ), scene: s.titel, score: '10' })),
                note: t('result_share_note', {}, lang)
              };
              const bottom = drawCard(ctx, model);
              cards += 1;
              lowest = Math.max(lowest, bottom);
              const where = `${lang} nivå ${level.niva} roll ${pick ? 'B' : 'A'} ${roles} ${score}`;
              if (bottom > SAFE_BOTTOM) problems.push(`${where}: texten slutar på ${Math.round(bottom)}`);
              for (const d of drawn) {
                if (d.text.includes('…')) problems.push(`${where}: "${d.text}" är kortad`);
                if (d.left < SIDE - 0.5 || d.right > CARD_W - SIDE + 0.5) problems.push(`${where}: "${d.text}" går utanför sidorna (${Math.round(d.left)}–${Math.round(d.right)})`);
                if (d.y < SAFE_TOP || d.y > SAFE_BOTTOM) problems.push(`${where}: "${d.text}" står på höjden ${Math.round(d.y)}`);
              }
              const expected = [model.brand, model.level, model.note.split(' ')[0], ...model.rows.flatMap((r) => [r.role, r.scene])];
              for (const text of expected) {
                if (!drawn.some((d) => d.text.includes(text))) problems.push(`${where}: "${text}" saknas på bilden`);
              }
            }
          }
        }
      }
    }
    return { problems, cards, lowest, fontsReady };
  });
  check(report.fontsReady, 'Bilden ritas med sidans typsnitt Fraunces och Inter');
  check(report.cards === 2 * 5 * 2 * 3 * 2, `Alla ${report.cards} kombinationer av språk, nivå, roll, bedömning och betyg är ritade`);
  check(report.problems.length === 0, `All text får plats inom marginalerna och inget kortas (lägsta raden på ${Math.round(report.lowest)} av högst ${SAFE_BOTTOM})${report.problems.length ? `: ${report.problems.slice(0, 6).join(' | ')}` : ''}`);

  // En riktig PNG: rätt storlek, mörk bakgrund och guld där betyget står.
  const png = await page.evaluate(async () => {
    const { makeCard } = await import('/sharecard.js');
    const { blob } = await makeCard({
      brand: 'ActWith AI', level: 'Nivå 1: Vardag', score: '7,4', of: '/10', title: 'Redo för större roller',
      rows: [{ role: 'Den undvikande', scene: 'Nyckeln', score: '8' }], note: 'Utseendet räknas aldrig.'
    });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const corner = Array.from(ctx.getImageData(4, 4, 1, 1).data);
    const score = ctx.getImageData(180, 540, 720, 260).data;
    let gold = 0;
    for (let i = 0; i < score.length; i += 4) if (score[i] > 200 && score[i + 1] > 140 && score[i + 2] < 120) gold += 1;
    return { type: blob.type, size: blob.size, width: bitmap.width, height: bitmap.height, corner, gold };
  });
  check(png.type === 'image/png' && png.width === 1080 && png.height === 1920 && png.size > 100000, `makeCard ger en PNG på 1080 × 1920 (${Math.round(png.size / 1024)} kB)`);
  check(png.corner[0] < 30 && png.corner[1] < 30 && png.corner[2] < 30, `Hörnen är mörka som scenen (${png.corner.slice(0, 3).join(', ')})`);
  check(png.gold > 20000, `Betyget lyser i guld mitt i ljuset (${png.gold} guldfärgade bildpunkter)`);
  check(errors.length === 0, `Inga fel när bilden ritas (${errors.join(' | ') || 'inga'})`);
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester av bilden att dela gick igenom.');
