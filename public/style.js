// Din spelstil: en spegel av rösten i en tagning, utan betyg.
//
// Under tagningen mäter mobilen mikrofonens ljud var 50:e ms: hur starkt det är och vilken
// tonhöjd rösten har. Medan motspelaren pratar mäts inget, så att bara din röst räknas.
// Inget skickas någonstans. Måtten sparas bara om du själv sparar tagningen i Mina tagningar.
//
// Spelstilarna nedan är påhittade (utkast) och bygger bara på rösten: tempo, pauser,
// tonhöjd, styrka och energi. Utseendet räknas aldrig, och ingen jämförs med riktiga
// skådespelare. Gränserna är startvärden som behöver provas på riktiga mobiler.

import { lang } from './texts.js';

export const FRAME_MS = 50;
export const MIN_SPEECH_SECONDS = 3;

// ---- Tonhöjd ----

// Grundtonen i Hz med normaliserad autokorrelation, eller 0 om ljudet inte är en röst
// som låter (tystnad, brus, väsljud). Ljudet halveras först för att spara ström.
export function pitchHz(buf, sampleRate, minHz = 70, maxHz = 450) {
  const n = Math.floor(buf.length / 2);
  if (n < 64) return 0;
  const x = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) {
    x[i] = (buf[2 * i] + buf[2 * i + 1]) / 2;
    mean += x[i];
  }
  mean /= n;
  let energy = 0;
  for (let i = 0; i < n; i++) {
    x[i] -= mean;
    energy += x[i] * x[i];
  }
  if (energy / n < 1e-6) return 0; // tystare än ungefär -60 dB
  const rate = sampleRate / 2;
  const minLag = Math.max(2, Math.floor(rate / maxHz));
  const maxLag = Math.min(n - 2, Math.ceil(rate / minHz));
  const r = new Float32Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    let e1 = 0;
    let e2 = 0;
    for (let i = 0; i + lag < n; i++) {
      const a = x[i];
      const b = x[i + lag];
      sum += a * b;
      e1 += a * a;
      e2 += b * b;
    }
    r[lag] = e1 > 0 && e2 > 0 ? sum / Math.sqrt(e1 * e2) : 0;
  }
  let best = -1;
  let bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (r[lag] > best) {
      best = r[lag];
      bestLag = lag;
    }
  }
  if (best < 0.6) return 0;
  // En topp vid kortare fördröjning som är nästan lika stark är den riktiga tonen (inte en oktav under).
  for (let lag = minLag; lag < bestLag; lag++) {
    if (r[lag] > r[lag - 1] && r[lag] >= r[lag + 1] && r[lag] > 0.9 * best) {
      bestLag = lag;
      break;
    }
  }
  const a = r[bestLag - 1];
  const b = r[bestLag];
  const c = r[bestLag + 1];
  const den = a - 2 * b + c;
  const shift = den ? Math.max(-1, Math.min(1, (0.5 * (a - c)) / den)) : 0;
  return rate / (bestLag + shift);
}

// ---- Mätningen under tagningen ----

// push({ db, hz }) för varje mätning, eller push(null) när motspelaren pratar.
export function createStyleMeter(frameMs = FRAME_MS) {
  const frames = [];
  return {
    push(frame) { frames.push(frame ? { db: frame.db, hz: frame.hz || 0 } : null); },
    get frames() { return frames; },
    summary() { return summarize(frames, frameMs); }
  };
}

const sortNum = (list) => [...list].sort((a, b) => a - b);
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))] : 0);

// Måtten för en tagning. enough är falskt om det var för lite tal för att säga något.
export function summarize(frames, frameMs = FRAME_MS) {
  const valid = frames.filter(Boolean);
  const sec = (count) => (count * frameMs) / 1000;
  if (valid.length < 20) return { enough: false, speechSeconds: 0 };
  const noise = Math.max(-90, pct(sortNum(valid.map((f) => f.db)), 0.1));
  const threshold = Math.max(noise + 10, -55);
  const speech = frames.map((f) => (f ? f.db > threshold : null));
  const speechCount = speech.filter((s) => s === true).length;
  const speechSeconds = sec(speechCount);
  if (speechSeconds < MIN_SPEECH_SECONDS) return { enough: false, speechSeconds };

  // Pauser: tystnad på minst 0,3 s mellan två stycken av ditt tal. Tystnad intill motspelarens
  // repliker räknas inte, eftersom den hör till motspelaren.
  const first = speech.indexOf(true);
  const last = speech.lastIndexOf(true);
  const pauses = [];
  let run = 0;
  let nearPartner = false;
  let ownFrames = 0;
  for (let i = first; i <= last; i++) {
    if (speech[i] === null) {
      nearPartner = true;
      run = 0;
      continue;
    }
    ownFrames += 1;
    if (speech[i]) {
      if (run && !nearPartner && sec(run) >= 0.3) pauses.push(sec(run));
      run = 0;
      nearPartner = false;
    } else {
      run += 1;
    }
  }
  const pauseSeconds = pauses.reduce((s, p) => s + p, 0);

  // Tempo: toppar i ljudstyrkan medan du pratar, ungefär en per stavelse.
  const smooth = frames.map((f, i) => {
    if (!f) return null;
    const near = [frames[i - 1], f, frames[i + 1]].filter(Boolean);
    return near.reduce((s, x) => s + x.db, 0) / near.length;
  });
  let peaks = 0;
  let lastPeak = -10;
  for (let i = 1; i < smooth.length - 1; i++) {
    if (speech[i] !== true || smooth[i] === null || smooth[i - 1] === null || smooth[i + 1] === null) continue;
    if (!(smooth[i] >= smooth[i - 1] && smooth[i] > smooth[i + 1])) continue;
    const around = smooth.slice(Math.max(0, i - 3), i + 4).filter((v) => v !== null);
    if (smooth[i] - Math.min(...around) >= 3 && i - lastPeak >= 3) {
      peaks += 1;
      lastPeak = i;
    }
  }

  const speechDb = sortNum(frames.filter((f, i) => speech[i] === true).map((f) => f.db));
  const voiced = frames.filter((f, i) => speech[i] === true && f.hz > 0).map((f) => f.hz);
  let melody = null;
  if (voiced.length >= 20) {
    const median = pct(sortNum(voiced), 0.5);
    const semitones = sortNum(voiced.map((hz) => 12 * Math.log2(hz / median)).filter((st) => Math.abs(st) <= 12));
    melody = pct(semitones, 0.9) - pct(semitones, 0.1);
  }

  return {
    enough: true,
    speechSeconds,
    talkShare: speechCount / valid.length,
    pauses: pauses.length,
    longestPause: pauses.length ? Math.max(...pauses) : 0,
    pauseShare: ownFrames ? pauseSeconds / sec(ownFrames) : 0,
    tempo: peaks / speechSeconds,
    dynamics: pct(speechDb, 0.9) - pct(speechDb, 0.1),
    melody,
    energy: pct(speechDb, 0.5) - noise
  };
}

// ---- Spelstilarna (utkast) ----

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const scale = (v, lo, hi) => clamp01((v - lo) / (hi - lo));

// Måtten på en skala från 0 till 1.
export function profile(m) {
  return {
    tempo: scale(m.tempo, 1.5, 4.5),
    pauser: scale(m.pauseShare, 0.05, 0.45),
    dynamik: scale(m.dynamics, 6, 24),
    melodi: m.melody === null || m.melody === undefined ? 0.5 : scale(m.melody, 2, 12),
    energi: scale(m.energy, 12, 40)
  };
}

// Målen för varje spelstil på skalan 0 till 1. Namnen och texterna finns på varje språk nedan.
const TARGETS = [
  { id: 'berattaren', mal: { tempo: 0.35, pauser: 0.65, dynamik: 0.5, melodi: 0.7, energi: 0.5 } },
  { id: 'gnistan', mal: { tempo: 0.85, pauser: 0.15, dynamik: 0.75, melodi: 0.65, energi: 0.85 } },
  { id: 'lagmald', mal: { tempo: 0.3, pauser: 0.5, dynamik: 0.2, melodi: 0.25, energi: 0.15 } },
  { id: 'komikern', mal: { tempo: 0.75, pauser: 0.3, dynamik: 0.55, melodi: 0.9, energi: 0.6 } },
  { id: 'ledaren', mal: { tempo: 0.45, pauser: 0.35, dynamik: 0.3, melodi: 0.3, energi: 0.75 } }
];

const NAMES = {
  sv: {
    berattaren: { namn: 'Berättaren', text: 'Tar tid på sig, låter pauserna arbeta och målar med rösten.', hur: 'ta god tid, pausa före det viktiga och låt rösten gå upp och ned' },
    gnistan: { namn: 'Gnistan', text: 'Högt tempo och mycket energi. Det händer något i varje replik.', hur: 'högre tempo, mer energi och inga pauser att gömma sig i' },
    lagmald: { namn: 'Den lågmälda', text: 'Nära och återhållen. Säger mycket med lite.', hur: 'lågt och nära, som om bara en person får höra' },
    komikern: { namn: 'Komikern', text: 'Lekfull melodi och snabba vändningar.', hur: 'lekfullt, med stora skiften i tonen och snabba vändningar' },
    ledaren: { namn: 'Ledaren', text: 'Stadig och tydlig. Rösten bär utan att brås.', hur: 'stadigt och tydligt, med jämn styrka och få ord som rusar' }
  },
  en: {
    berattaren: { namn: 'The Storyteller', text: 'Takes their time, lets the pauses work and paints with the voice.', hur: 'take your time, pause before what matters and let your voice rise and fall' },
    gnistan: { namn: 'The Spark', text: 'High tempo and lots of energy. Something happens in every line.', hur: 'faster, with more energy and no pauses to hide in' },
    lagmald: { namn: 'The Quiet One', text: 'Close and restrained. Says a lot with little.', hur: 'low and close, as if only one person may hear' },
    komikern: { namn: 'The Comedian', text: 'Playful melody and quick turns.', hur: 'playfully, with big shifts in tone and quick turns' },
    ledaren: { namn: 'The Leader', text: 'Steady and clear. The voice carries without rushing.', hur: 'steadily and clearly, with even volume and few rushed words' }
  }
};

export const STYLES_BY_LANG = Object.fromEntries(Object.entries(NAMES).map(([l, names]) => [l, TARGETS.map((s) => ({ ...s, ...names[s.id] }))]));
export const STYLES = STYLES_BY_LANG[lang()] || STYLES_BY_LANG.sv;

const WEIGHTS = { tempo: 1, pauser: 1, dynamik: 1, melodi: 1, energi: 0.6 }; // energin beror också på avståndet till mobilen

// Hur mycket tagningen liknar varje spelstil, i hela procent som blir 100 tillsammans.
export function matchStyles(p, styles = STYLES) {
  const sigma = 0.35; // större värde ger en mjukare blandning av spelstilar
  const scores = styles.map((s) => {
    let d2 = 0;
    for (const [k, w] of Object.entries(WEIGHTS)) d2 += w * (p[k] - s.mal[k]) ** 2;
    return Math.exp(-d2 / (2 * sigma * sigma));
  });
  const total = scores.reduce((a, b) => a + b, 0) || 1;
  const raw = scores.map((s) => (100 * s) / total);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - floors[i], i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return styles.map((s, i) => ({ id: s.id, namn: s.namn, procent: floors[i] })).sort((a, b) => b.procent - a.procent);
}

export const styleById = (id) => STYLES.find((s) => s.id === id) || null;

// Ett ord för var på skalan ett mått ligger: låg, mitt eller hög.
export const band = (v) => (v < 0.34 ? 'low' : v > 0.66 ? 'high' : 'mid');

// Allt som visas om en tagning: spelstilarna, iakttagelserna och utmaningen till nästa gång.
export function readStyle(m) {
  if (!m || !m.enough) return { enough: false };
  const p = profile(m);
  const matches = matchStyles(p);
  const challenge = matches[matches.length - 1].id; // den spelstil som är längst från tagningen
  return { enough: true, profile: p, matches, challenge, measures: m };
}
