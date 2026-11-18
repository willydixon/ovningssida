// Tester för Din spelstil: tonhöjd, pauser, tempo och spelstilarna, med kända signaler.
// Körs med: node tests/style.mjs

import { pitchHz, summarize, profile, matchStyles, readStyle, STYLES, band, createStyleMeter, FRAME_MS } from '../public/style.js';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// ---- Tonhöjd ----
const SR = 48000;
const N = 2048;
const tone = (harmonics, f0, amp = 0.2) => Float32Array.from({ length: N }, (_, i) =>
  harmonics.reduce((s, [h, a]) => s + amp * a * Math.sin((2 * Math.PI * f0 * h * i) / SR), 0));
let hz = pitchHz(tone([[1, 1]], 220), SR);
check(Math.abs(hz - 220) < 3, `En ren ton på 220 Hz mäts som ${hz.toFixed(1)} Hz`);
hz = pitchHz(tone([[1, 1], [2, 0.6], [3, 0.4], [4, 0.3], [5, 0.2], [6, 0.15]], 130), SR);
check(Math.abs(hz - 130) < 3, `En mansröst med övertoner på 130 Hz mäts som ${hz.toFixed(1)} Hz, inte en oktav fel`);
hz = pitchHz(tone([[1, 0.3], [2, 1], [3, 0.7], [4, 0.4]], 240), SR);
check(Math.abs(hz - 240) < 4, `En röst med svag grundton på 240 Hz mäts som ${hz.toFixed(1)} Hz`);
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
check(pitchHz(Float32Array.from({ length: N }, () => 0.3 * rand()), SR) === 0, 'Brus har ingen tonhöjd');
check(pitchHz(new Float32Array(N), SR) === 0, 'Tystnad har ingen tonhöjd');

// ---- Måtten för en tagning ----
// Tal i 1,2 s med fyra stavelser per sekund och en tonhöjd som rör sig, sedan 0,6 s tystnad.
const frames = [];
const speak = (seconds, { base = -24, swing = 8, f0 = 150, glide = 0 } = {}) => {
  const n = Math.round((seconds * 1000) / FRAME_MS);
  for (let i = 0; i < n; i++) {
    const t = (i * FRAME_MS) / 1000;
    frames.push({ db: base + (swing / 2) * Math.sin(2 * Math.PI * 4 * t), hz: f0 * 2 ** ((glide * Math.sin(2 * Math.PI * 0.5 * t)) / 12) });
  }
};
const quiet = (seconds) => { for (let i = 0; i < Math.round((seconds * 1000) / FRAME_MS); i++) frames.push({ db: -70, hz: 0 }); };
const partner = (seconds) => { for (let i = 0; i < Math.round((seconds * 1000) / FRAME_MS); i++) frames.push(null); };

quiet(1);
for (let k = 0; k < 8; k++) {
  speak(1.2, { glide: 4 });
  quiet(0.6);
}
let m = summarize(frames);
check(m.enough && Math.abs(m.speechSeconds - 9.6) < 1.2, `Tal räknas: ${m.speechSeconds.toFixed(1)} s av ungefär 9,6 s`);
check(m.pauses === 7 && Math.abs(m.longestPause - 0.6) < 0.2, `Pauserna räknas: ${m.pauses} pauser, längsta ${m.longestPause.toFixed(2)} s`);
check(m.tempo > 2.5 && m.tempo < 5, `Tempot blir ungefär fyra stavelser per sekund (${m.tempo.toFixed(1)})`);
check(m.melody > 3 && m.melody < 9, `Tonhöjden rör sig flera halvtoner (${m.melody.toFixed(1)})`);
check(m.dynamics > 4 && m.energy > 30, `Styrkan varierar (${m.dynamics.toFixed(1)} dB) och rösten hörs över bakgrunden (${m.energy.toFixed(0)} dB)`);

// Tystnad intill motspelarens repliker är inte din paus.
frames.length = 0;
quiet(1);
for (let k = 0; k < 4; k++) {
  speak(1.5);
  quiet(0.4);
  partner(2);
  quiet(0.8);
}
speak(1.5);
m = summarize(frames);
check(m.enough && m.pauses === 0, `Tystnad före och efter motspelaren räknas inte som pauser (${m.pauses})`);

frames.length = 0;
quiet(3);
speak(2);
quiet(3);
check(summarize(frames).enough === false, 'För lite tal ger ingen spelstil');
check(summarize([]).enough === false, 'Ingen mätning ger ingen spelstil');

const meter = createStyleMeter();
meter.push({ db: -20, hz: 150 });
meter.push(null);
check(meter.frames.length === 2 && meter.frames[1] === null, 'Mätaren sparar när motspelaren pratar som en lucka');

// ---- Spelstilarna ----
check(STYLES.length === 5 && STYLES.every((s) => s.id && s.namn && s.text && s.hur && Object.keys(s.mal).length === 5), 'Fem spelstilar med namn, text, hur man spelar dem och mål');
for (const s of STYLES) {
  const result = matchStyles(s.mal);
  check(result[0].id === s.id, `En tagning som låter precis som ${s.namn} liknar ${s.namn} mest (${result[0].procent} %)`);
}
const mixed = matchStyles({ tempo: 0.5, pauser: 0.5, dynamik: 0.5, melodi: 0.5, energi: 0.5 });
check(mixed.reduce((s, r) => s + r.procent, 0) === 100 && mixed.every((r) => Number.isInteger(r.procent)), 'Procenten är hela tal som blir 100 tillsammans');
const fast = profile({ tempo: 6, pauseShare: 0.6, dynamics: 30, melody: 14, energy: 50 });
check(Object.values(fast).every((v) => v === 1) && profile({ tempo: 0, pauseShare: 0, dynamics: 0, melody: null, energy: 0 }).melodi === 0.5, 'Måtten hamnar mellan 0 och 1, och okänd tonhöjd räknas som mitten');
const read = readStyle({ enough: true, tempo: 4.2, pauseShare: 0.08, dynamics: 20, melody: 9, energy: 38 });
check(read.enough && read.matches[0].id === 'gnistan' && read.challenge === read.matches[read.matches.length - 1].id, `Snabbt och starkt liknar Gnistan, och utmaningen är den stil som är längst bort (${read.challenge})`);
check(readStyle({ enough: false }).enough === false && readStyle(null).enough === false, 'Utan nog med tal blir det ingen läsning');
check(band(0.1) === 'low' && band(0.5) === 'mid' && band(0.9) === 'high', 'Måtten delas in i låg, mitt och hög');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för Din spelstil gick igenom.');
