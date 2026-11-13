// Teknikkollens mått och gränser. Rena funktioner utan sidoeffekter, så att de
// kan testas utan kamera. Gränserna är startvärden som kalibreras på riktiga
// mobiler. Toppgränsen kommer från ACX krav på ljudböcker, resten är mina val.
// Rubrikerna och råden ligger i texts.js.

import { t } from './texts.js';

export const LIMITS = {
  speech: { greenLow: -28, greenHigh: -12, yellowLow: -36 },
  peak: { yellow: -3, red: -1 },
  noise: { green: -50, red: -40 },
  light: { redLow: 50, greenLow: 70, greenHigh: 200, whiteShare: 0.10 }
};

export const toDb = (x) => (x > 0 ? 20 * Math.log10(x) : -120);

// RMS och topp i dBFS för ett block med ljudprover mellan -1 och 1.
export function levelsFrom(samples) {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    sum += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = samples.length ? Math.sqrt(sum / samples.length) : 0;
  return { rmsDb: toDb(rms), peakDb: toDb(peak), clipped: peak >= 0.999 };
}

export function percentile(values, p) {
  if (!values.length) return -120;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
}

// Medelljus (luma 0–255) och andel nästan vita pixlar i RGBA-data.
export function lumaStats(rgba) {
  const n = rgba.length / 4;
  if (!n) return null;
  let sum = 0;
  let white = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const y = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    sum += y;
    if (y > 245) white++;
  }
  return { mean: sum / n, whiteShare: white / n };
}

// Varje bedömning ger [nivå, rubrik, råd]. Nivån är good, warn eller bad.

const rating = (level, label, advice) => [level, t(label), t(advice)];

export function rateSpeech(db) {
  if (db < LIMITS.speech.yellowLow) return rating('bad', 'speech_bad_label', 'speech_bad_advice');
  if (db < LIMITS.speech.greenLow) return rating('warn', 'speech_low_label', 'speech_low_advice');
  if (db > LIMITS.speech.greenHigh) return rating('warn', 'speech_high_label', 'speech_high_advice');
  return rating('good', 'speech_good_label', 'speech_good_advice');
}

export function ratePeaks(db, clipped) {
  if (clipped || db >= LIMITS.peak.red) return rating('bad', 'peaks_bad_label', 'peaks_bad_advice');
  if (db >= LIMITS.peak.yellow) return rating('warn', 'peaks_warn_label', 'peaks_warn_advice');
  return rating('good', 'peaks_good_label', 'peaks_good_advice');
}

export function rateNoise(db) {
  if (db > LIMITS.noise.red) return rating('bad', 'noise_bad_label', 'noise_bad_advice');
  if (db > LIMITS.noise.green) return rating('warn', 'noise_warn_label', 'noise_warn_advice');
  return rating('good', 'noise_good_label', 'noise_good_advice');
}

export function rateLight(light) {
  if (!light) return rating('warn', 'light_none_label', 'light_none_advice');
  if (light.whiteShare > LIMITS.light.whiteShare) return rating('bad', 'light_backlit_label', 'light_backlit_advice');
  if (light.mean < LIMITS.light.redLow) return rating('bad', 'light_dark_label', 'light_dark_advice');
  if (light.mean < LIMITS.light.greenLow) return rating('warn', 'light_dim_label', 'light_dim_advice');
  if (light.mean > LIMITS.light.greenHigh) return rating('warn', 'light_bright_label', 'light_bright_advice');
  return rating('good', 'light_good_label', 'light_good_advice');
}
