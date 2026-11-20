// Betyget: hur väl en tagning passar det rollen kräver, från 1 till 10.
//
// Varje roll i scenerna har ett krav (kraver i scenes.js), en av förinställningarna nedan:
// var rösten och ansiktet bör ligga på skalan 0–1 för just den rollen. Rösten mäts som i
// Din spelstil (style.js), och ansiktet i face.js om användaren har sagt ja. Betyget visar
// hur nära tagningen kom kraven. Allt räknas i mobilen och inget skickas någonstans.
//
// Kraven och gränserna är startvärden som behöver provas på riktiga mobiler och av kunniga
// personer. Betyget är en fingervisning från mätningar, inte ett omdöme om någons talang,
// och utseendet räknas aldrig.

import { profile } from './style.js';

export const VOICE_KEYS = ['tempo', 'pauser', 'dynamik', 'melodi', 'energi'];
// Samma vikter som i style.js. Energin väger mindre, eftersom den också beror på avståndet till mobilen.
export const WEIGHTS = { tempo: 1, pauser: 1, dynamik: 1, melodi: 1, energi: 0.6 };

// Vad en roll kräver, på skalan 0–1. ansikte är hur mycket ansiktet rör sig när man spelar.
export const DEMANDS = {
  vardag: { tempo: 0.5, pauser: 0.35, dynamik: 0.4, melodi: 0.5, energi: 0.5, ansikte: 0.5 },
  kraft: { tempo: 0.55, pauser: 0.2, dynamik: 0.65, melodi: 0.5, energi: 0.85, ansikte: 0.6 },
  kontroll: { tempo: 0.3, pauser: 0.6, dynamik: 0.3, melodi: 0.3, energi: 0.45, ansikte: 0.3 },
  lugn: { tempo: 0.35, pauser: 0.5, dynamik: 0.3, melodi: 0.5, energi: 0.4, ansikte: 0.45 },
  sarbar: { tempo: 0.4, pauser: 0.6, dynamik: 0.55, melodi: 0.65, energi: 0.35, ansikte: 0.7 },
  desperat: { tempo: 0.8, pauser: 0.15, dynamik: 0.75, melodi: 0.7, energi: 0.8, ansikte: 0.75 },
  komisk: { tempo: 0.75, pauser: 0.3, dynamik: 0.6, melodi: 0.85, energi: 0.65, ansikte: 0.75 },
  gatfull: { tempo: 0.25, pauser: 0.7, dynamik: 0.2, melodi: 0.2, energi: 0.3, ansikte: 0.2 },
  karlek: { tempo: 0.35, pauser: 0.55, dynamik: 0.4, melodi: 0.6, energi: 0.3, ansikte: 0.6 },
  charm: { tempo: 0.6, pauser: 0.25, dynamik: 0.5, melodi: 0.75, energi: 0.6, ansikte: 0.65 }
};

export const LEVEL_SIZE = 5; // så många scener som ger ett resultat

const SIGMA_VOICE = 0.45; // större värde ger snällare betyg när rösten ligger en bit från kravet
const SIGMA_FACE = 0.3;
const FACE_SHARE = 0.3; // ansiktets del av betyget, när det har mätts
const TIP_MIN = 0.15; // så stor skillnad mot kravet som ger ett tips
const STRENGTH_MAX = 0.12; // så nära kravet som räknas som en styrka
export const LOOK_DOWN_LIMIT = 0.4; // andelen av tiden med blicken nere i texten innan det drar ned

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toTen = (fit) => clamp(Math.round(1 + 9 * fit), 1, 10);

export const demandFor = (role) => (role && DEMANDS[role.kraver]) || null;

// Betyget för en tagning. measures är Din spelstils mått (style.js summarize), face är
// ansiktets mått (face.js summarizeFace) eller null. Utan tillräckligt med tal blir det inget betyg.
export function rateTake({ measures, face = null, demand }) {
  if (!demand || !measures || !measures.enough) return { enough: false };
  const p = profile(measures);
  let d2 = 0;
  for (const k of VOICE_KEYS) d2 += WEIGHTS[k] * (p[k] - demand[k]) ** 2;
  const voiceFit = Math.exp(-d2 / (2 * SIGMA_VOICE ** 2));
  const hasFace = !!(face && face.enough);
  const faceFit = hasFace ? Math.exp(-((face.uttryck - demand.ansikte) ** 2) / (2 * SIGMA_FACE ** 2)) : null;
  const fit = hasFace ? (1 - FACE_SHARE) * voiceFit + FACE_SHARE * faceFit : voiceFit;
  const lookDown = hasFace ? face.blickNere : null;
  let raw = 1 + 9 * fit;
  if (hasFace && lookDown > LOOK_DOWN_LIMIT) raw -= Math.min(1, (lookDown - LOOK_DOWN_LIMIT) * 2.5);

  // Tipsen: det rollen kräver mer eller mindre av, störst skillnad först.
  const gaps = VOICE_KEYS.map((key) => ({ key, diff: demand[key] - p[key], weight: WEIGHTS[key] }));
  if (hasFace) gaps.push({ key: 'ansikte', diff: demand.ansikte - face.uttryck, weight: 1 });
  const tips = gaps
    .filter((g) => Math.abs(g.diff) >= TIP_MIN)
    .sort((a, b) => b.weight * Math.abs(b.diff) - a.weight * Math.abs(a.diff))
    .slice(0, 2)
    .map((g) => ({ key: g.key, mer: g.diff > 0 }));
  if (hasFace && lookDown > LOOK_DOWN_LIMIT) tips.push({ key: 'blick', mer: false });

  // Styrkan: det mått som låg närmast kravet, bland dem som väger fullt.
  const close = gaps
    .filter((g) => g.weight === 1 && Math.abs(g.diff) <= STRENGTH_MAX)
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

  return {
    enough: true,
    betyg: clamp(Math.round(raw), 1, 10),
    rost: toTen(voiceFit),
    ansikte: hasFace ? toTen(faceFit) : null,
    blickNere: lookDown,
    styrka: close.length ? close[0].key : null,
    tips,
    profil: hasFace ? { ...p, ansikte: face.uttryck } : p
  };
}

// ---- Resultatet efter en nivå ----

const distance = (a, b) => Math.sqrt(VOICE_KEYS.reduce((s, k) => s + WEIGHTS[k] * (a[k] - b[k]) ** 2, 0));

// Hur olika profilerna är, i snitt mellan alla par.
function spread(list) {
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      sum += distance(list[i], list[j]);
      pairs += 1;
    }
  }
  return pairs ? sum / pairs : 0;
}

// entries: en per scen i nivån, med det bästa betyget för scenen:
// { betyg, profil, krav, tips, blickNere }. Ger null tills alla scener har ett betyg.
//   total    snittet, med en decimal
//   best     den roll som fick högst betyg, worst den som fick lägst
//   range    hur mycket rösten ändrades mellan rollerna, jämfört med hur olika rollerna är: hog, mellan, lag
//   repeat   ett tips som kom i minst två roller: { key, mer, n }, eller null
//   lookDown andelen av tiden med blicken nere i texten, i snitt, om ansiktet har mätts
//   roles    storre, mindre eller grund: vilka roller som passar just nu
//   band     1–4, hur det gick totalt, för första meningen i sammanfattningen
export function levelResult(entries, size = LEVEL_SIZE) {
  if (!Array.isArray(entries) || entries.length < size) return null;
  const scores = entries.map((e) => e.betyg);
  const total = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const best = entries.reduce((a, b) => (b.betyg > a.betyg ? b : a));
  const worst = entries.reduce((a, b) => (b.betyg < a.betyg ? b : a));
  const demandSpread = spread(entries.map((e) => e.krav));
  const ratio = demandSpread > 0.05 ? spread(entries.map((e) => e.profil)) / demandSpread : 1;
  const range = ratio >= 0.7 ? 'hog' : ratio < 0.4 ? 'lag' : 'mellan';
  const evenness = Math.max(...scores) - Math.min(...scores);

  const counts = new Map();
  for (const e of entries) {
    for (const tip of e.tips || []) {
      const id = `${tip.key}:${tip.mer ? 'mer' : 'mindre'}`;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  let repeat = null;
  for (const [id, n] of counts) {
    if (n >= 2 && (!repeat || n > repeat.n)) repeat = { key: id.split(':')[0], mer: id.endsWith(':mer'), n };
  }

  const faced = entries.filter((e) => typeof e.blickNere === 'number');
  const lookDown = faced.length ? faced.reduce((s, e) => s + e.blickNere, 0) / faced.length : null;
  const roles = total >= 7 && evenness <= 3 && range !== 'lag' ? 'storre' : total >= 5 ? 'mindre' : 'grund';
  const band = total >= 8 ? 4 : total >= 6 ? 3 : total >= 4 ? 2 : 1;
  return { total, best, worst, range, evenness, repeat, lookDown, roles, band };
}

// ---- Betygen i mobilens lagring ----
// { v: 1, scener: { [scen-id]: { betyg, roll, profil, krav, tips, blickNere, datum } } }
// Bara det bästa betyget för varje scen sparas. Vid lika betyg gäller det senaste.

export const RESULTS_KEY = 'provspelning';

export function readResults(raw) {
  try {
    const data = JSON.parse(raw || 'null');
    if (data && data.v === 1 && data.scener && typeof data.scener === 'object') return data;
  } catch { /* trasigt: börja om */ }
  return { v: 1, scener: {} };
}

// Lägger in ett nytt betyg. Ger { results, best, improved }: best är det bästa för scenen efteråt.
export function addResult(results, sceneId, entry) {
  const old = results.scener[sceneId];
  const improved = !old || entry.betyg >= old.betyg;
  const next = { v: 1, scener: { ...results.scener, [sceneId]: improved ? entry : old } };
  return { results: next, best: next.scener[sceneId], improved };
}
