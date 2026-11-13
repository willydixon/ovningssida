// Tester för motspelaren utan webbläsare: röstavkänningen och uppspelningen av scenen.
// Körs med: node tests/partner.mjs

import { createVoiceDetector, ScenePlayer, expectedMs, VOICE } from '../public/partner.js';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// Matar detektorn med samma nivå i ms. Ger det sista svaret och efter hur många ms 'done' kom.
function feed(detector, db, ms) {
  let last = 'waiting';
  for (let t = VOICE.frameMs; t <= ms; t += VOICE.frameMs) {
    last = detector.push(db);
    if (last === 'done') return { last, doneAfter: t };
  }
  return { last, doneAfter: -1 };
}

// Ett tyst rum: bakgrunden mäts under nedräkningen, tre sekunder.
function quietRoom() {
  const d = createVoiceDetector();
  for (let i = 0; i < 60; i++) d.observe(-65 + (i % 3));
  return d;
}

const SHORT = 'Inget.'; // kort replik
const LONG = 'Just det. Du har varit hemma hela dagen. Vem annars skulle ha flyttat den?'; // 74 tecken

// ---- Väntad tid ----
check(expectedMs('Ja.') === 600, 'En mycket kort replik väntas ta minst 0,6 s');
check(expectedMs(LONG) === LONG.length * 65, `En lång replik väntas ta cirka ${(expectedMs(LONG) / 1000).toFixed(1)} s`);

// ---- Gränsen för tal ----
check(createVoiceDetector().thresholdDb === VOICE.floorDb, 'Utan mätt bakgrund gäller den lägsta gränsen, -50 dB');
check(quietRoom().thresholdDb === VOICE.floorDb, 'I ett tyst rum gäller också den lägsta gränsen, -50 dB');
const noisy = createVoiceDetector();
for (let i = 0; i < 60; i++) noisy.observe(-45);
check(noisy.thresholdDb === -35, 'Med bakgrundsljud på -45 dB räknas bara ljud över -35 dB som tal');

// ---- Kort replik ----
let d = quietRoom();
d.startLine(SHORT);
check(feed(d, -65, 3000).last === 'waiting', 'Kort replik: tystnad innan användaren börjar prata räknas inte');
check(feed(d, -25, 400).last === 'speaking', 'Kort replik: tal märks');
let r = feed(d, -65, 3000);
check(r.doneAfter === VOICE.shortPauseMs, `Kort replik: klar efter ${r.doneAfter} ms tystnad (${VOICE.shortPauseMs} väntat)`);
check(d.push(-20) === 'waiting', 'Efter en klar replik lyssnar detektorn inte förrän nästa replik börjar');

// ---- Lång replik med paus i spelet ----
d = quietRoom();
d.startLine(LONG);
feed(d, -25, 600);
r = feed(d, -65, 2000);
check(r.last === 'speaking', 'Lång replik: en paus på 2 s efter några ord släpper inte fram motspelaren');
feed(d, -25, 2000);
r = feed(d, -65, 3000);
check(r.doneAfter === VOICE.shortPauseMs, `Lång replik: när det mesta är sagt räcker ${r.doneAfter} ms tystnad`);

d = quietRoom();
d.startLine(LONG);
feed(d, -25, 600);
r = feed(d, -65, 4000);
check(r.doneAfter === VOICE.longPauseMs, `Lång replik: en lång tystnad (${r.doneAfter} ms) avslutar ändå repliken`);

// ---- Tal som pendlar runt gränsen ----
d = quietRoom();
d.startLine(LONG);
let last = 'waiting';
for (let i = 0; i < 80; i++) last = d.push(i % 4 === 3 ? -60 : -30); // korta glapp mellan orden
check(last === 'speaking', 'Korta glapp mellan orden avslutar inte repliken');

// ---- Sådant som inte är tal ----
d = createVoiceDetector();
for (let i = 0; i < 60; i++) d.observe(-45);
d.startLine(SHORT);
check(feed(d, -44, 5000).last === 'waiting', 'Bakgrundsljud i ett bullrigt rum räknas inte som tal');

d = quietRoom();
d.startLine(SHORT);
feed(d, -20, 100);
check(feed(d, -65, 3000).last === 'waiting', 'Ett kort klick på 0,1 s räknas inte som tal');

d = quietRoom();
d.startLine(SHORT, 400);
feed(d, -20, 400);
check(feed(d, -65, 3000).last === 'waiting', 'Efterklangen från motspelarens röst räknas inte som tal');

// ---- Uppspelningen av scenen ----
const deferred = () => {
  let resolve;
  const promise = new Promise((r2) => { resolve = r2; });
  return { promise, resolve };
};
const tick = () => new Promise((r2) => setTimeout(r2, 0));

const lines = [
  { roll: 'A', text: 'Ett' },
  { roll: 'B', text: 'Två' },
  { roll: 'A', text: 'Tre' },
  { roll: 'B', text: 'Fyra' }
];

function makePlayer(log) {
  const pending = {};
  const player = new ScenePlayer(lines, 'A', {
    speak: (text, i) => { log.push(`säger ${text}`); pending[i] = deferred(); return pending[i].promise; },
    listen: (line, i) => { log.push(`lyssnar ${line.text}`); pending[i] = deferred(); return pending[i].promise; },
    cancelSpeech: () => log.push('avbryter rösten'),
    onLine: (i) => log.push(`replik ${i}`),
    onEnd: () => log.push('slut')
  });
  return { player, pending };
}

let log = [];
let p = makePlayer(log);
p.player.play();
await tick();
p.pending[0].resolve(); await tick();
p.pending[1].resolve(); await tick();
p.pending[2].resolve(); await tick();
p.pending[3].resolve(); await tick();
check(log.join(' | ') === 'replik 0 | lyssnar Ett | replik 1 | säger Två | replik 2 | lyssnar Tre | replik 3 | säger Fyra | slut',
  'Scenen går i ordning: lyssnar på dina repliker och läser motspelarens');

log = [];
p = makePlayer(log);
p.player.play();
await tick();
p.player.skip(); await tick(); // din replik
check(log.join(' | ') === 'replik 0 | lyssnar Ett | replik 1 | säger Två', 'Nästa replik under din replik går vidare utan att avbryta rösten');
p.player.skip(); await tick(); // motspelarens replik
check(log.slice(4).join(' | ') === 'avbryter rösten | replik 2 | lyssnar Tre', 'Nästa replik under motspelarens replik avbryter rösten och går vidare');
p.player.stop(); await tick();
p.pending[2].resolve(); await tick();
check(!log.includes('slut') && !log.includes('replik 3'), 'Stoppa avslutar scenen utan fler repliker');
check(log[log.length - 1] === 'avbryter rösten', 'Stoppa avbryter rösten');

log = [];
p = makePlayer(log);
p.player.skip();
check(log.length === 0, 'Nästa replik gör inget innan scenen har börjat');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för motspelaren gick igenom.');
