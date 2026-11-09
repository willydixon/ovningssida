// Teknikkollens mått och gränser. Rena funktioner utan sidoeffekter, så att de
// kan testas utan kamera. Gränserna är startvärden som kalibreras på riktiga
// mobiler. Toppgränsen kommer från ACX krav på ljudböcker, resten är mina val.

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

export function rateSpeech(db) {
  if (db < LIMITS.speech.yellowLow) return ['bad', 'För lågt ljud', 'Gå närmare mobilen, tala med vanlig röst och kontrollera att inget täcker mikrofonen.'];
  if (db < LIMITS.speech.greenLow) return ['warn', 'Lite lågt ljud', 'Gå lite närmare mobilen eller tala lite högre.'];
  if (db > LIMITS.speech.greenHigh) return ['warn', 'Högt ljud', 'Håll mobilen lite längre bort.'];
  return ['good', 'Bra ljudnivå', 'Rösten hörs tydligt.'];
}

export function ratePeaks(db, clipped) {
  if (clipped || db >= LIMITS.peak.red) return ['bad', 'Ljudet klipper', 'Håll mobilen längre bort eller tala lite lägre.'];
  if (db >= LIMITS.peak.yellow) return ['warn', 'Nära gränsen', 'Tala lite lägre eller håll mobilen längre bort.'];
  return ['good', 'Inga toppar som klipper', 'Starka ljud hörs utan att förvrängas.'];
}

export function rateNoise(db) {
  if (db > LIMITS.noise.red) return ['bad', 'Mycket bakgrundsljud', 'Byt rum, eller stäng dörrar, fönster och fläktar.'];
  if (db > LIMITS.noise.green) return ['warn', 'Lite bakgrundsljud', 'Stäng av musik och fläktar om det går.'];
  return ['good', 'Tyst bakgrund', 'Inget stör rösten.'];
}

export function rateLight(light) {
  if (!light) return ['warn', 'Ljuset kunde inte mätas', 'Kontrollera själv att ansiktet syns tydligt.'];
  if (light.whiteShare > LIMITS.light.whiteShare) return ['bad', 'Motljus eller för starkt ljus', 'Ställ dig så att ljuset kommer framifrån, inte bakifrån.'];
  if (light.mean < LIMITS.light.redLow) return ['bad', 'För mörkt', 'Vänd dig mot ett fönster eller tänd en lampa framför dig.'];
  if (light.mean < LIMITS.light.greenLow) return ['warn', 'Lite mörkt', 'Mer ljus framifrån gör bilden tydligare.'];
  if (light.mean > LIMITS.light.greenHigh) return ['warn', 'Mycket ljust', 'Flytta dig lite från det starkaste ljuset.'];
  return ['good', 'Bra ljus', 'Ansiktet syns tydligt.'];
}
