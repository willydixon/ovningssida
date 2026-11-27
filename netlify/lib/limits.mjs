// Gränser per uppkoppling, så att ingen ensam kan tömma gratisminuterna med AI-motspelaren
// eller skicka hur många anrop som helst till Stripe.
//
// IP-adressen sparas aldrig. I stället sparas ett kontrollvärde (HMAC med en hemlig nyckel):
// samma adress ger samma värde, men adressen går inte att räkna fram ur det. Räknarna
// gäller ett dygn (AI-minuterna) eller en timme (Plus-anropen) och tas sedan bort.
//
// Utöver det här har funktionerna en gräns hos Netlify för många anrop på kort tid
// (rateLimit i varje funktions config).

import { createHmac } from 'node:crypto';

// Gratisminuter med AI-motspelaren per uppkoppling och dygn. Taket för alla gratisanvändare
// tillsammans finns i plus.mjs (freeDailySeconds).
export const freeSecondsPerIp = () => {
  const n = Number(process.env.FREE_AI_SECONDS_PER_IP_DAY);
  return Number.isFinite(n) && n >= 0 ? n : 600;
};

// Hur många gånger i timmen samma uppkoppling får göra det som kostar ett anrop till Stripe.
export const HOURLY = { checkout: 10, activate: 20, aterstall: 10 };

export const hourKey = (now = new Date()) => now.toISOString().slice(0, 13); // 2026-11-27T12
const dayOf = (now = new Date()) => now.toISOString().slice(0, 10);

// Uppkopplingens IP-adress, som Netlify ger funktionen (context.ip, och samma adress i ett huvud).
// Saknas den räknas ingen gräns per uppkoppling, i stället för att alla delar på en.
export const clientIp = (request, meta = {}) => String(meta.ip || request.headers.get('x-nf-client-connection-ip') || '');

// Kontrollvärdet för IP-adressen. Nyckeln härleds från den hemliga nyckeln, så att samma
// nyckel inte används till två saker.
export function ipHash(ip, secret) {
  const key = createHmac('sha256', String(secret)).update('ip-kontroll-v1').digest();
  return createHmac('sha256', key).update(String(ip)).digest('base64url').slice(0, 22);
}

// Räknaren för gratisminuterna från uppkopplingen i dag.
export const ipDayKey = (hash, now = new Date()) => `ip/${dayOf(now)}/${hash}`;

// Räknar ett anrop den här timmen. Ger false, utan att räkna, om gränsen redan är nådd.
export async function allowHourly(store, name, hash, max, now = new Date()) {
  const key = `grans/${hourKey(now)}/${name}/${hash}`;
  const n = Number(await store.get(key)) || 0;
  if (n >= max) return false;
  await store.set(key, String(n + 1));
  return true;
}

// Tar bort räknare från tidigare dygn (ip/) och timmar (grans/). Körs högst en gång i
// timmen per funktion, efter att svaret har skickats. Ger hur många som togs bort.
let lastSweep = '';
export const resetSweep = () => { lastSweep = ''; };
export async function sweep(store, now = new Date()) {
  const hour = hourKey(now);
  if (lastSweep === hour) return 0;
  lastSweep = hour;
  const today = dayOf(now);
  let removed = 0;
  for (const [prefix, current] of [['ip/', today], ['grans/', hour]]) {
    const { blobs = [] } = await store.list({ prefix });
    for (const { key } of blobs) {
      const period = key.split('/')[1] || '';
      if (period < current) {
        await store.delete(key);
        removed += 1;
      }
    }
  }
  return removed;
}

// Kör städningen efter svaret om Netlify erbjuder det, annars direkt. Fel stoppar aldrig anropet.
export function sweepLater(store, waitUntil) {
  const job = sweep(store).catch((err) => console.error(`Städningen av gränserna misslyckades: ${err && err.message ? err.message : err}`));
  if (typeof waitUntil === 'function') waitUntil(job);
  return job;
}
