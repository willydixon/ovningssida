// Enhetstester utan webbläsare: teknikkollens gränser och scenfilernas format.
// Körs med: node tests/unit.mjs

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { levelsFrom, lumaStats, percentile, rateSpeech, ratePeaks, rateNoise, rateLight } from '../public/check.js';
import { SCENES, SCENES_BY_LANG } from '../public/scenes.js';
import { sv, en, t, TEXTS, LANGS } from '../public/texts.js';
import { renderPage, renderManifest, readTemplates, PUBLIC, MANIFEST, LANG_DIRS, pageOptions } from '../tools/render-pages.mjs';
import path from 'node:path';

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

// ---- Scenernas format, på alla språk ----
for (const [language, scenes] of Object.entries(SCENES_BY_LANG)) {
const ids = new Set();
for (const s of scenes) {
  const where = `Scen ${s.id || '?'} (${language})`;
  check(typeof s.id === 'string' && /^scen-\d{3}$/.test(s.id) && !ids.has(s.id), `${where}: id är unikt och har rätt form`);
  ids.add(s.id);
  check(typeof s.titel === 'string' && s.titel.length > 0, `${where}: har titel`);
  check(typeof s.situation === 'string' && s.situation.length > 0, `${where}: har situation`);
  check(Number.isInteger(s.langd_sekunder) && s.langd_sekunder >= 30 && s.langd_sekunder <= 180, `${where}: längd 30–180 s`);
  check(Array.isArray(s.roller) && s.roller.length === 2, `${where}: två roller`);
  check(s.roller.every((r) => typeof r.vill === 'string' && r.vill.length > 0 && typeof r.inre === 'string' && r.inre.length > 0), `${where}: varje roll har en vilja och ett inre liv`);
  const roleIds = new Set(s.roller.map((r) => r.id));
  check(Array.isArray(s.repliker) && s.repliker.length >= 6 && s.repliker.every((l) => roleIds.has(l.roll) && l.text.trim()), `${where}: repliker hör till rollerna`);
  // Motspelaren lyssnar efter en replik i taget, så två repliker i rad av samma roll slås ihop till en.
  check(s.repliker.every((l, i) => i === 0 || l.roll !== s.repliker[i - 1].roll), `${where}: replikerna växlar mellan rollerna`);
  check(['utkast', 'godkand'].includes(s.status), `${where}: status är utkast eller godkand`);
  if (s.status === 'godkand') {
    check(!!s.godkand_av && !!s.godkand_datum, `${where}: godkänd scen anger vem och när`);
  } else {
    check(s.godkand_av === null && s.godkand_datum === null, `${where}: utkast saknar godkännande`);
  }
  check(s.ai_stod === true || s.ai_stod === false, `${where}: anger om AI har hjälpt till`);
}
}
// Varje språk har samma scener, med samma roller, repliker i samma ordning och samma bilder.
const shape = (s) => JSON.stringify([s.id, s.bild, s.langd_sekunder, s.status, s.roller.map((r) => r.id), s.repliker.map((l) => l.roll)]);
check(LANGS.every((l) => SCENES_BY_LANG[l] && SCENES_BY_LANG[l].map(shape).join() === SCENES_BY_LANG.sv.map(shape).join()), 'Scenerna är desamma på alla språk');
check(SCENES === SCENES_BY_LANG.sv, 'Utan sida, som här, används de svenska scenerna');

// ---- Bilder, utmaningar och uppvärmning ----
const { CHALLENGES, challengeFor, WARMUP } = await import('../public/content.js');
const { renderImages, IMAGES } = await import('../tools/render-pages.mjs');
for (const s of SCENES) {
  check(typeof s.genre === 'string' && s.genre.length > 0, `Scen ${s.id}: har genre`);
  check(existsSync(path.join(IMAGES, `${s.bild}.svg`)), `Scen ${s.id}: bilden ${s.bild}.svg finns`);
}
for (const [name, svg] of renderImages()) {
  check(svg === readFileSync(path.join(IMAGES, name), 'utf8'), `img/${name} är skapad av tools/render-pages.mjs`);
}
check(CHALLENGES.length >= 7 && CHALLENGES.every((c) => typeof c === 'string' && c.trim() === c && c.length > 10), 'Utmaningarna är minst sju och har text');
check(challengeFor(new Date(2026, 0, 1)) !== challengeFor(new Date(2026, 0, 2)) && challengeFor(new Date(2026, 5, 3, 8)) === challengeFor(new Date(2026, 5, 3, 22)), 'Ny utmaning varje dag, samma hela dagen');
check(WARMUP.length === 4 && WARMUP.every((w) => w.titel && w.text && (w.sekunder || w.lista)), 'Uppvärmningen har fyra steg med text och klocka eller lista');
const breath = WARMUP.find((w) => w.andning);
check(!!breath && breath.andning.reduce((sum, [, sec]) => sum + sec, 0) * 3 === breath.sekunder, 'Andningen går jämnt upp i tre varv');
const { CONTENT } = await import('../public/content.js');
const contentShape = (c) => JSON.stringify([
  c.challenges.length, c.warmup.map((w) => [w.id, w.sekunder, (w.lista || []).length]), c.fivewaysLines.length, c.fivewaysWays.length,
  c.monologues.map((m) => [m.id, m.stycken.length, m.langd_sekunder]), c.improvs.map((i) => [i.id, !!i.ai.forsta])
]);
check(LANGS.every((l) => CONTENT[l] && contentShape(CONTENT[l]) === contentShape(CONTENT.sv)), 'Övningarna finns på alla språk, med lika många delar');
const { lang_other_label: _otherLabel, ...englishTexts } = en; // länken till svenska är på svenska
const allEnglish = JSON.stringify([CONTENT.en, SCENES_BY_LANG.en, englishTexts]);
check(!/[åäö]/i.test(allEnglish), 'Det engelska innehållet har inga svenska bokstäver kvar');
const { STYLES_BY_LANG } = await import('../public/style.js');
check(LANGS.every((l) => STYLES_BY_LANG[l] && STYLES_BY_LANG[l].map((x) => x.id).join() === STYLES_BY_LANG.sv.map((x) => x.id).join() && STYLES_BY_LANG[l].every((x) => x.namn && x.text && x.hur)), 'Spelstilarna har namn och texter på alla språk');

// ---- Mina tagningar ----
const { FREE_TAKES, canSaveMore, takeId, isQuotaError } = await import('../public/takes.js');
check(FREE_TAKES === 3 && canSaveMore(2, 'gratis') && !canSaveMore(3, 'gratis') && !canSaveMore(5, 'gratis'), 'Gratis får spara 3 tagningar i Mina tagningar');
check(canSaveMore(3, 'plus') && canSaveMore(500, 'plus'), 'Med Plus finns ingen gräns för Mina tagningar');
check(takeId(1000, () => 0.5) !== takeId(1001, () => 0.5) && /^t[0-9a-z]+$/.test(takeId()), 'Varje tagning får ett eget nummer');
check(isQuotaError({ name: 'QuotaExceededError' }) && !isQuotaError(new Error('annat')) && !isQuotaError(null), 'Fullt i mobilen känns igen');

// ---- Texterna ----
// Alla texter ligger i texts.js. Sidorna i templates/ och manifest.json skapas från dem.
const templates = await readTemplates();
for (const language of LANGS) {
  for (const [name, template] of templates) {
    const file = path.join(LANG_DIRS[language], name);
    check(existsSync(file) && renderPage(template, TEXTS[language], pageOptions(language)) === readFileSync(file, 'utf8'),
      `${path.relative(PUBLIC, file)} är skapad från texts.js (kör annars node tools/render-pages.mjs)`);
  }
  const manifest = path.join(LANG_DIRS[language], 'manifest.json');
  check(renderManifest(TEXTS[language], language) === readFileSync(manifest, 'utf8'),
    `${path.relative(PUBLIC, manifest)} är skapad från texts.js (kör annars node tools/render-pages.mjs)`);
}
check(path.join(LANG_DIRS.sv, 'manifest.json') === MANIFEST, 'Den svenska appen har sitt manifest i public/');
// Appen heter ActWith AI på alla språk. Det gamla arbetsnamnet ska inte synas någonstans.
check(LANGS.every((l) => TEXTS[l].app_name === 'ActWith AI'), 'Appen heter ActWith AI på alla språk');
const shownFiles = LANGS.flatMap((l) => readdirSync(LANG_DIRS[l]).filter((f) => f.endsWith('.html') || f === 'manifest.json').map((f) => path.join(LANG_DIRS[l], f)));
const OLD_NAME = /[Öö]vningssidan/;
const oldName = [
  ...shownFiles.filter((f) => OLD_NAME.test(readFileSync(f, 'utf8'))).map((f) => path.relative(PUBLIC, f)),
  ...LANGS.flatMap((l) => Object.keys(TEXTS[l]).filter((k) => OLD_NAME.test(TEXTS[l][k])).map((k) => `${l}.${k}`))
];
check(shownFiles.length >= 20 && oldName.length === 0, `Det gamla namnet Övningssidan finns inte kvar i texterna eller sidorna (${oldName.join(', ') || 'ingenstans'})`);
const code = ['public/app.js', 'public/check.js', 'tools/render-pages.mjs']
  .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
const usedKeys = new Set([
  ...[...code.matchAll(/'([a-z]+(?:_[a-z0-9]+)+)'/g)].map((m) => m[1]),
  ...[...code.matchAll(/texts\.([a-z]+(?:_[a-z0-9]+)*)/g)].map((m) => m[1]).filter((k) => k !== 'js'), // inte filnamnet texts.js
  ...templates.flatMap(([, template]) => [...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))
]);
// Koder från servern och adressparametrar som ser ut som textnycklar men inte är det.
const NOT_TEXTS = new Set(['free_full', 'no_minutes', 'session_id', 'redan_avslutad']);
const missingKeys = [...usedKeys].filter((k) => !(k in sv) && !NOT_TEXTS.has(k));
const unusedKeys = Object.keys(sv).filter((k) => !usedKeys.has(k));
check(missingKeys.length === 0, `Alla texter som används finns i texts.js (${missingKeys.join(', ') || 'inga saknas'})`);
check(unusedKeys.length === 0, `Alla texter i texts.js används (${unusedKeys.join(', ') || 'inga oanvända'})`);
check(Object.values(sv).every((v) => typeof v === 'string' && v.trim() === v && v.length > 0), 'Inga tomma texter och inga mellanslag i början eller slutet');
check(t('role_button', { name: 'Sam' }) === 'Spela Sam', 'Värden fylls i, till exempel Spela Sam');
// Alla språk har samma texter, med samma värden att fylla i.
const placeholders = (v) => [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const language of LANGS.filter((l) => l !== 'sv')) {
  const texts = TEXTS[language];
  const missing = Object.keys(sv).filter((k) => !(k in texts));
  const extra = Object.keys(texts).filter((k) => !(k in sv));
  check(missing.length === 0 && extra.length === 0, `Texterna på ${language} har samma nycklar som på svenska (${[...missing, ...extra].join(', ') || 'alla finns'})`);
  const differ = Object.keys(sv).filter((k) => k in texts && placeholders(sv[k]) !== placeholders(texts[k]));
  check(differ.length === 0, `Texterna på ${language} har samma värden att fylla i (${differ.join(', ') || 'alla stämmer'})`);
  check(Object.values(texts).every((v) => typeof v === 'string' && v.trim() === v && v.length > 0), `Inga tomma texter på ${language}`);
  check(texts.lang === language, `Språkkoden för ${language} stämmer`);
}
check(t('role_button', { name: 'Sam' }, 'en') === 'Play Sam' && en.lang === 'en', 'Engelska texter hämtas med språket, till exempel Play Sam');
let threw = false;
try { t('finns_inte'); } catch { threw = true; }
check(threw, 'En felstavad textnyckel ger ett fel i stället för en tom text');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla enhetstester gick igenom.');
