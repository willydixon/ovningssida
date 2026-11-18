// Gemensamt för Plus och AI-minuterna: anrop till Stripe, licenskoden som visar att
// någon har Plus, och räkningen av AI-minuter.
//
// Miljövariabler i Netlify:
// - STRIPE_SECRET_KEY: Stripes hemliga nyckel. sk_test_ betyder testläge, utan riktiga pengar.
// - LICENSE_SECRET (valfri): nyckeln som licenskoderna skrivs under med. Saknas den skapar
//   funktionen en slumpad nyckel första gången och sparar den i Netlify Blobs.
// - FREE_AI_SECONDS_PER_DAY: hur många AI-sekunder alla gratisanvändare får tillsammans per dygn.
//
// Ingen video eller ljud passerar här. Hos Stripe finns kundens betaluppgifter, och här
// sparas bara prenumerationens nummer och hur många AI-sekunder som har använts.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const PLAN = {
  plus: { aiSeconds: 3600, takeSeconds: 600 }, // 60 AI-minuter i månaden, tagningar upp till 10 minuter
  gratis: { aiSeconds: 300, takeSeconds: 180 } // 5 AI-minuter att prova, tagningar upp till 3 minuter
};
export const PRICE = { amount: 9900, currency: 'sek', lookupKey: 'plus-manad' }; // 99 kr i månaden inklusive moms
export const STRIPE_VERSION = '2024-06-20'; // låst, så att svaren från Stripe ser likadana ut
export const WITHDRAWAL_DAYS = 14;
export const MAX_AI_CONVERSATION = { plus: 600, gratis: 240 };
const TOKEN_DAYS = 1; // licenskoden kontrolleras mot Stripe minst en gång per dygn

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export const monthKey = (now = new Date()) => now.toISOString().slice(0, 7);
export const dayKey = (now = new Date()) => now.toISOString().slice(0, 10);
const unix = (now = new Date()) => Math.floor(now.getTime() / 1000);

// ---- Stripe ----

// Stripe vill ha formulärdata: line_items[0][price]=…, expand[]=….
export function formParams(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') formParams(item, `${key}[${i}]`, out);
        else out.append(`${key}[]`, String(item));
      });
    } else if (typeof v === 'object') {
      formParams(v, key, out);
    } else {
      out.append(key, String(v));
    }
  }
  return out;
}

export async function stripe(fetchImpl, key, method, path, params) {
  const url = new URL(`https://api.stripe.com/v1${path}`);
  const init = { method, headers: { authorization: `Bearer ${key}`, 'stripe-version': STRIPE_VERSION } };
  if (params) {
    const body = formParams(params);
    if (method === 'GET' || method === 'DELETE') {
      for (const [k, v] of body) url.searchParams.append(k, v);
    } else {
      init.body = body.toString();
      init.headers['content-type'] = 'application/x-www-form-urlencoded';
    }
  }
  const res = await fetchImpl(url.href, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Stripe svarade ${res.status} på ${path.split('?')[0]} (${(data.error && data.error.code) || 'okänt'})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const isTestKey = (key) => typeof key === 'string' && key.startsWith('sk_test_');

// ---- Licenskoden ----
// v1.<innehåll>.<underskrift>. Innehållet är prenumerationens och kundens nummer, planen,
// när prenumerationen startade och när koden måste kontrolleras igen.

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data, secret) => createHmac('sha256', secret).update(data).digest('base64url');

export function signToken(payload, secret) {
  const body = b64(JSON.stringify(payload));
  return `v1.${body}.${sign(body, secret)}`;
}

// Ger innehållet om underskriften stämmer, annars null. Gamla koder godkänns här,
// men exp avgör om de måste kontrolleras mot Stripe.
export function readToken(token, secret) {
  if (typeof token !== 'string' || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const expected = Buffer.from(sign(parts[1], secret));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload && payload.plan === 'plus' && typeof payload.sub === 'string' ? payload : null;
  } catch {
    return null;
  }
}

// Nyckeln som licenskoderna skrivs under med. Om två funktioner startar samtidigt första
// gången vinner den som sparar först (onlyIfNew), och båda använder den nyckeln.
const SECRET_KEY = 'hemlis/licens';
let cachedSecret = null;
export const resetSecretCache = () => { cachedSecret = null; };
export async function licenseSecret(env, store) {
  if (env.LICENSE_SECRET) return env.LICENSE_SECRET;
  if (cachedSecret) return cachedSecret;
  let secret = await store.get(SECRET_KEY);
  if (!secret) {
    await store.set(SECRET_KEY, randomBytes(48).toString('base64url'), { onlyIfNew: true });
    secret = await store.get(SECRET_KEY);
  }
  if (!secret) throw new Error('Licensnyckeln gick inte att skapa');
  cachedSecret = secret;
  return secret;
}

export const bearer = (request) => {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
};

// Licenskod för en aktiv prenumeration.
export function tokenFor(sub, secret, now = new Date()) {
  const periodEnd = sub.current_period_end || unix(now) + 3600;
  return signToken({
    plan: 'plus',
    sub: sub.id,
    cus: typeof sub.customer === 'string' ? sub.customer : sub.customer && sub.customer.id,
    start: sub.start_date || sub.created || unix(now),
    exp: Math.min(periodEnd, unix(now) + TOKEN_DAYS * 86400)
  }, secret);
}

export const activeStatus = (sub) => !!sub && ['active', 'trialing'].includes(sub.status);

// ---- AI-minuterna ----
// Räknas i Netlify Blobs: plus/<prenumeration>/<månad> och gratis/<dygn> har använda sekunder.
// När ett samtal startar reserveras tid. När det slutar dras det som faktiskt användes.

export async function readSeconds(store, key) {
  const value = await store.get(key);
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function addSeconds(store, key, delta) {
  const next = Math.max(0, (await readSeconds(store, key)) + delta);
  await store.set(key, String(next));
  return next;
}

export const freeDailySeconds = () => {
  const n = Number(process.env.FREE_AI_SECONDS_PER_DAY);
  return Number.isFinite(n) && n >= 0 ? n : 1800;
};
