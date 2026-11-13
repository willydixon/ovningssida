// Enhetstester utan webbläsare: teknikkollens gränser och scenfilernas format.
// Körs med: node tests/unit.mjs

import { readFileSync } from 'node:fs';
import { levelsFrom, lumaStats, percentile, rateSpeech, ratePeaks, rateNoise, rateLight } from '../public/check.js';
import { SCENES } from '../public/scenes.js';
import { sv, t } from '../public/texts.js';
import { renderIndex, renderManifest, TEMPLATE, INDEX, MANIFEST } from '../tools/render-pages.mjs';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// ---- Ljudnivåer från kända signaler ----
const sine = (amp, n = 4800) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * 220 * i) / 48000));
const quiet = levelsFrom(sine(0.005));
const good = levelsFrom(sine(0.1));
const loud = levelsFrom(sine(1));
check(Math.abs(good.rmsDb - -23) < 0.5, `Sinus 0,1 ger cirka -23 dBFS (${good.rmsDb.toFixed(1)})`);
check(rateSpeech(quiet.rmsDb)[0] === 'bad', `Svagt ljud (${quiet.rmsDb.toFixed(0)} dB) blir rött`);
check(rateSpeech(-30)[0] === 'warn', 'Ljud på -30 dB blir gult');
check(rateSpeech(good.rmsDb)[0] === 'good', 'Ljud på -23 dB blir grönt');
check(rateSpeech(-8)[0] === 'warn', 'Ljud på -8 dB blir gult (högt)');
check(ratePeaks(loud.peakDb, loud.clipped)[0] === 'bad', 'Full styrka klipper och blir rött');
check(ratePeaks(-2, false)[0] === 'warn', 'Topp på -2 dB blir gul');
check(ratePeaks(-6, false)[0] === 'good', 'Topp på -6 dB blir grön');
check(rateNoise(-60)[0] === 'good', 'Bakgrund på -60 dB blir grön');
check(rateNoise(-45)[0] === 'warn', 'Bakgrund på -45 dB blir gul');
check(rateNoise(-35)[0] === 'bad', 'Bakgrund på -35 dB blir röd');
check(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9) === 9, '90:e percentilen räknas rätt');

// ---- Ljus från kända bilder ----
const image = (gray, whiteShare = 0, n = 64 * 48) => {
  const data = new Uint8ClampedArray(n * 4);
  const whites = Math.round(n * whiteShare);
  for (let i = 0; i < n; i++) {
    const v = i < whites ? 255 : gray;
    data.set([v, v, v, 255], i * 4);
  }
  return data;
};
check(rateLight(lumaStats(image(120)))[0] === 'good', 'Grå bild (120) ger bra ljus');
check(rateLight(lumaStats(image(30)))[0] === 'bad', 'Mörk bild (30) blir röd');
check(rateLight(lumaStats(image(60)))[0] === 'warn', 'Halvmörk bild (60) blir gul');
check(rateLight(lumaStats(image(220)))[0] === 'warn', 'Mycket ljus bild (220) blir gul');
check(rateLight(lumaStats(image(120, 0.3)))[0] === 'bad', 'Bild med 30 % vitt (motljus) blir röd');
check(rateLight(null)[0] === 'warn', 'Saknad bild ger en uppmaning att kontrollera själv');

// ---- Scenernas format ----
const ids = new Set();
for (const s of SCENES) {
  const where = `Scen ${s.id || '?'}`;
  check(typeof s.id === 'string' && /^scen-\d{3}$/.test(s.id) && !ids.has(s.id), `${where}: id är unikt och har rätt form`);
  ids.add(s.id);
  check(typeof s.titel === 'string' && s.titel.length > 0, `${where}: har titel`);
  check(typeof s.situation === 'string' && s.situation.length > 0, `${where}: har situation`);
  check(Number.isInteger(s.langd_sekunder) && s.langd_sekunder >= 30 && s.langd_sekunder <= 180, `${where}: längd 30–180 s`);
  check(Array.isArray(s.roller) && s.roller.length === 2, `${where}: två roller`);
  const roleIds = new Set(s.roller.map((r) => r.id));
  check(Array.isArray(s.repliker) && s.repliker.length >= 6 && s.repliker.every((l) => roleIds.has(l.roll) && l.text.trim()), `${where}: repliker hör till rollerna`);
  check(['utkast', 'godkand'].includes(s.status), `${where}: status är utkast eller godkand`);
  if (s.status === 'godkand') {
    check(!!s.godkand_av && !!s.godkand_datum, `${where}: godkänd scen anger vem och när`);
  } else {
    check(s.godkand_av === null && s.godkand_datum === null, `${where}: utkast saknar godkännande`);
  }
  check(s.ai_stod === true || s.ai_stod === false, `${where}: anger om AI har hjälpt till`);
}

// ---- Texterna ----
// Alla texter ligger i texts.js. index.html och manifest.json skapas från dem.
const template = readFileSync(TEMPLATE, 'utf8');
check(renderIndex(template) === readFileSync(INDEX, 'utf8'),
  'index.html är skapad från texts.js (kör annars node tools/render-pages.mjs)');
check(renderManifest() === readFileSync(MANIFEST, 'utf8'),
  'manifest.json är skapad från texts.js (kör annars node tools/render-pages.mjs)');
const code = ['public/app.js', 'public/check.js', 'tools/render-pages.mjs']
  .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
const usedKeys = new Set([
  ...[...code.matchAll(/'([a-z]+(?:_[a-z0-9]+)+)'/g)].map((m) => m[1]),
  ...[...code.matchAll(/texts\.([a-z]+(?:_[a-z0-9]+)*)/g)].map((m) => m[1]).filter((k) => k !== 'js'), // inte filnamnet texts.js
  ...[...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
]);
const missingKeys = [...usedKeys].filter((k) => !(k in sv));
const unusedKeys = Object.keys(sv).filter((k) => !usedKeys.has(k));
check(missingKeys.length === 0, `Alla texter som används finns i texts.js (${missingKeys.join(', ') || 'inga saknas'})`);
check(unusedKeys.length === 0, `Alla texter i texts.js används (${unusedKeys.join(', ') || 'inga oanvända'})`);
check(Object.values(sv).every((v) => typeof v === 'string' && v.trim() === v && v.length > 0), 'Inga tomma texter och inga mellanslag i början eller slutet');
check(t('role_button', { name: 'Sam' }) === 'Spela Sam', 'Värden fylls i, till exempel Spela Sam');
let threw = false;
try { t('finns_inte'); } catch { threw = true; }
check(threw, 'En felstavad textnyckel ger ett fel i stället för en tom text');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla enhetstester gick igenom.');
