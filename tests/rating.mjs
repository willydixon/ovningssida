// Tester för betyget: rollkrav, betyg 1–10, tips och resultatet efter en nivå.
// Körs med: node tests/rating.mjs

import { DEMANDS, VOICE_KEYS, rateTake, levelResult, readResults, addResult, demandFor, LEVEL_SIZE } from '../public/rating.js';
import { profile } from '../public/style.js';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// Mått från Din spelstil som ger precis den här profilen (skalorna i style.js profile).
const measuresFor = (p) => ({
  enough: true,
  tempo: 1.5 + 3 * p.tempo,
  pauseShare: 0.05 + 0.4 * p.pauser,
  dynamics: 6 + 18 * p.dynamik,
  melody: 2 + 10 * p.melodi,
  energy: 12 + 28 * p.energi
});
const near = (a, b) => VOICE_KEYS.every((k) => Math.abs(a[k] - b[k]) < 1e-9);

check(Object.values(DEMANDS).every((d) => [...VOICE_KEYS, 'ansikte'].every((k) => d[k] >= 0 && d[k] <= 1)), 'Alla rollkrav ligger mellan 0 och 1, för röst och ansikte');
check(near(profile(measuresFor(DEMANDS.kontroll)), DEMANDS.kontroll), 'Testets mått ger precis den profil som efterfrågas');
check(demandFor({ kraver: 'skurk-som-inte-finns' }) === null && demandFor({ kraver: 'kraft' }) === DEMANDS.kraft, 'Rollens krav slås upp med namnet');

// ---- Betyget för en tagning ----
const perfect = rateTake({ measures: measuresFor(DEMANDS.kontroll), demand: DEMANDS.kontroll });
check(perfect.enough && perfect.betyg === 10 && perfect.rost === 10 && perfect.ansikte === null && perfect.tips.length === 0,
  `En tagning som träffar kravet precis får 10/10 och inga tips (${perfect.betyg})`);
check(perfect.styrka === 'tempo' || VOICE_KEYS.includes(perfect.styrka), 'En träffad roll har en styrka att lyfta fram');

const wrong = rateTake({ measures: measuresFor(DEMANDS.desperat), demand: DEMANDS.kontroll });
check(wrong.enough && wrong.betyg <= 4, `Stressat och snabbt i en roll som kräver kontroll ger lågt betyg (${wrong.betyg})`);
check(wrong.tips.length === 2 && wrong.tips.some((t) => t.key === 'tempo' && !t.mer), `Tipset säger lugnare tempo (${wrong.tips.map((t) => `${t.key}:${t.mer ? 'mer' : 'mindre'}`).join(', ')})`);
check(wrong.styrka === null, 'Ingen styrka lyfts fram när allt låg långt från kravet');

const middle = rateTake({ measures: measuresFor(Object.fromEntries(VOICE_KEYS.map((k) => [k, DEMANDS.kraft[k] - 0.2]))), demand: DEMANDS.kraft });
check(middle.betyg >= 5 && middle.betyg <= 8, `En bit ifrån kravet på alla mått ger ett betyg i mitten (${middle.betyg})`);

check(rateTake({ measures: { enough: false }, demand: DEMANDS.kraft }).enough === false, 'För lite tal ger inget betyg');
check(rateTake({ measures: measuresFor(DEMANDS.kraft), demand: null }).enough === false, 'En roll utan krav ger inget betyg');

// ---- Ansiktet ----
const face = (uttryck, blickNere = 0.1) => ({ enough: true, uttryck, blickNere });
const withFace = rateTake({ measures: measuresFor(DEMANDS.sarbar), face: face(DEMANDS.sarbar.ansikte), demand: DEMANDS.sarbar });
check(withFace.betyg === 10 && withFace.ansikte === 10 && withFace.profil.ansikte === DEMANDS.sarbar.ansikte, 'Ett ansikte som spelar som rollen kräver ger 10/10 för ansiktet');
const stillFace = rateTake({ measures: measuresFor(DEMANDS.sarbar), face: face(0.05), demand: DEMANDS.sarbar });
check(stillFace.ansikte <= 3 && stillFace.betyg < withFace.betyg && stillFace.tips.some((t) => t.key === 'ansikte' && t.mer),
  `Ett stilla ansikte i en sårbar roll drar ned och ger tipset om ett mer levande ansikte (${stillFace.betyg})`);
const reading = rateTake({ measures: measuresFor(DEMANDS.sarbar), face: face(DEMANDS.sarbar.ansikte, 0.8), demand: DEMANDS.sarbar });
check(reading.betyg === 9 && reading.tips.some((t) => t.key === 'blick'), `Blicken nere i texten större delen av tiden drar ned ett steg och ger ett tips (${reading.betyg})`);
const noFace = rateTake({ measures: measuresFor(DEMANDS.sarbar), face: { enough: false }, demand: DEMANDS.sarbar });
check(noFace.ansikte === null && noFace.blickNere === null && noFace.betyg === 10, 'Ett ansikte som inte syntes ger inget avdrag, bara inget ansiktsbetyg');

// ---- Resultatet efter en nivå ----
const roles = ['kraft', 'kontroll', 'komisk', 'sarbar', 'gatfull'];
const entry = (kraver, betyg, p = DEMANDS[kraver], extra = {}) => ({ betyg, krav: DEMANDS[kraver], profil: p, tips: [], blickNere: null, ...extra });
check(levelResult(roles.slice(0, 4).map((r) => entry(r, 8))) === null && LEVEL_SIZE === 5, 'Resultatet kommer först efter 5 scener');

const strong = levelResult(roles.map((r) => entry(r, 8)));
check(strong.total === 8 && strong.range === 'hog' && strong.roles === 'storre' && strong.band === 4,
  `Höga och jämna betyg med tydliga skillnader mellan rollerna ger större roller (${strong.roles}, ${strong.range})`);

const same = DEMANDS.vardag;
const narrow = levelResult(roles.map((r) => entry(r, 7, same)));
check(narrow.range === 'lag' && narrow.roles === 'mindre', `Samma röst i alla roller ger smal bredd och mindre roller, trots bra betyg (${narrow.range}, ${narrow.roles})`);

const uneven = levelResult(roles.map((r, i) => entry(r, [10, 9, 4, 8, 9][i])));
check(uneven.total === 8 && uneven.roles === 'mindre' && uneven.best.betyg === 10 && uneven.worst.betyg === 4,
  `Ojämna betyg ger mindre roller, med starkaste och svagaste rollen (${uneven.total})`);

const low = levelResult(roles.map((r) => entry(r, 3)));
check(low.roles === 'grund' && low.band === 1, 'Låga betyg ger rådet att börja med grunden');

const tempoTip = { key: 'tempo', mer: true };
const repeated = levelResult(roles.map((r, i) => entry(r, 6, DEMANDS[r], { tips: i < 3 ? [tempoTip] : [{ key: 'pauser', mer: false }] })));
check(repeated.repeat && repeated.repeat.key === 'tempo' && repeated.repeat.mer && repeated.repeat.n === 3, 'Ett tips som återkommer i tre roller lyfts fram');

const eyes = levelResult(roles.map((r, i) => entry(r, 6, DEMANDS[r], { blickNere: i < 2 ? 0.6 : null })));
check(Math.abs(eyes.lookDown - 0.6) < 1e-9, 'Blicken räknas bara på de tagningar där ansiktet mättes');

// ---- Sparade betyg ----
let results = readResults('inte json');
check(results.v === 1 && Object.keys(results.scener).length === 0 && readResults(null).v === 1, 'Trasig eller tom lagring ger tomma resultat');
let step = addResult(results, 'scen-006', { betyg: 6 });
check(step.improved && step.best.betyg === 6, 'Första betyget sparas');
step = addResult(step.results, 'scen-006', { betyg: 4 });
check(!step.improved && step.best.betyg === 6, 'Ett sämre betyg ersätter inte det bästa');
step = addResult(step.results, 'scen-006', { betyg: 6, datum: 2 });
check(step.improved && step.best.datum === 2, 'Vid lika betyg gäller det senaste');
check(readResults(JSON.stringify(step.results)).scener['scen-006'].betyg === 6, 'Resultaten går att spara och läsa igen');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för betyget gick igenom.');
