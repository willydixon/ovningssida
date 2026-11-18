// Plus: köp, kontroll, hantering och ånger. Adresser:
//   GET  /api/plus/info               om köp är igång och om det är testläge
//   POST /api/plus/checkout           startar ett köp hos Stripe och ger länken dit
//   GET  /api/plus/activate?session_id=…  efter köpet: kontrollerar betalningen och ger licenskoden
//   GET  /api/plus/status             kontrollerar licenskoden och ger AI-minuterna som är kvar
//   POST /api/plus/portal             länk till Stripes sida där man ändrar kort eller säger upp
//   POST /api/plus/angra              ångerknappen: ångrar köpet inom 14 dagar, annars sägs Plus upp
//
// Licenskoden skickas som Authorization: Bearer <kod>. Se netlify/lib/plus.mjs.

import { getStore } from '@netlify/blobs';
import {
  PLAN, PRICE, WITHDRAWAL_DAYS, json, stripe, isTestKey, readToken, bearer, tokenFor, activeStatus,
  readSeconds, monthKey, licenseSecret
} from '../lib/plus.mjs';

// Sidan som köpet och Stripes kundsida går tillbaka till, och texten vid köpknappen, per språk.
const HOME = { sv: '/', en: '/en/' };
const SUBMIT_TEXT = {
  sv: 'Du kan ångra köpet inom 14 dagar och säga upp Plus när du vill.',
  en: 'You can withdraw from the purchase within 14 days and cancel Plus whenever you like.'
};
async function pageLanguage(request) {
  const body = await request.clone().json().catch(() => ({}));
  return body && body.lang === 'en' ? 'en' : 'sv';
}

let cachedPrice = null;
let cachedPortal = null;
export const resetCache = () => { cachedPrice = null; cachedPortal = null; };

// Priset skapas hos Stripe första gången, så att inget behöver ställas in för hand.
async function plusPrice(f, key) {
  if (process.env.STRIPE_PRICE_PLUS) return process.env.STRIPE_PRICE_PLUS;
  if (cachedPrice) return cachedPrice;
  const found = await stripe(f, key, 'GET', '/prices', { lookup_keys: [PRICE.lookupKey], active: true, limit: 1 });
  if (found.data && found.data[0]) {
    cachedPrice = found.data[0].id;
    return cachedPrice;
  }
  const product = await stripe(f, key, 'POST', '/products', {
    name: 'Plus',
    description: '60 AI-minuter i månaden, en mer levande AI-röst, tagningar upp till 10 minuter och obegränsat i Mina tagningar.'
  });
  const price = await stripe(f, key, 'POST', '/prices', {
    product: product.id,
    currency: PRICE.currency,
    unit_amount: PRICE.amount,
    recurring: { interval: 'month' },
    lookup_key: PRICE.lookupKey,
    tax_behavior: 'inclusive',
    nickname: 'Plus per månad'
  });
  cachedPrice = price.id;
  return cachedPrice;
}

// Inställningarna för Stripes kundsida skapas också första gången och hittas sedan
// på sin märkning, så att det inte blir en ny varje gång funktionen startar.
async function portalConfig(f, key) {
  if (cachedPortal) return cachedPortal;
  const list = await stripe(f, key, 'GET', '/billing_portal/configurations', { active: true, limit: 100 });
  const found = (list.data || []).find((c) => c.metadata && c.metadata.app === 'ovningssida');
  if (found) {
    cachedPortal = found.id;
    return cachedPortal;
  }
  const config = await stripe(f, key, 'POST', '/billing_portal/configurations', {
    business_profile: { headline: 'Hantera Plus' },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' }
    },
    metadata: { app: 'ovningssida' }
  });
  cachedPortal = config.id;
  return cachedPortal;
}

// En prenumeration som inte finns hos Stripe (till exempel efter att testdata rensats) räknas som ingen.
async function subscription(f, key, id) {
  try {
    return await stripe(f, key, 'GET', `/subscriptions/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function minutes(store, sub) {
  const used = await readSeconds(store, `plus/${sub}/${monthKey()}`);
  return { usedSeconds: used, limitSeconds: PLAN.plus.aiSeconds };
}

export async function handle(request, env = process.env, f = fetch, store = null) {
  const key = env.STRIPE_SECRET_KEY;
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/plus\/?/, '');
  const ready = !!key;
  const blobs = () => store || getStore('ai-minuter');

  if (route === 'info') return json({ available: ready, test: ready && isTestKey(key), price: PRICE.amount / 100 });
  if (!ready) return json({ available: false }, 503);

  try {
    const secret = await licenseSecret(env, blobs());
    if (route === 'checkout' && request.method === 'POST') {
      const language = await pageLanguage(request);
      const home = `${url.origin}${HOME[language]}`;
      const price = await plusPrice(f, key);
      const session = await stripe(f, key, 'POST', '/checkout/sessions', {
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        success_url: `${home}?plus=klar&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${home}?plus=avbrutet`,
        locale: language,
        subscription_data: { metadata: { app: 'ovningssida', sprak: language } },
        custom_text: { submit: { message: SUBMIT_TEXT[language] } }
      });
      return json({ url: session.url });
    }

    if (route === 'activate' && request.method === 'GET') {
      const id = url.searchParams.get('session_id') || '';
      if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ error: 'bad_session' }, 400);
      const session = await stripe(f, key, 'GET', `/checkout/sessions/${id}`, { expand: ['subscription'] });
      const sub = session.subscription;
      if (session.status !== 'complete' || !sub || typeof sub !== 'object' || !activeStatus(sub)) return json({ error: 'not_paid' }, 402);
      return json({ plan: 'plus', token: tokenFor(sub, secret), ...(await minutes(blobs(), sub.id)) });
    }

    const payload = readToken(bearer(request), secret);
    if (!payload) return json({ plan: 'gratis' }, 401);

    if (route === 'status' && request.method === 'GET') {
      let token = bearer(request);
      if (payload.exp <= Math.floor(Date.now() / 1000)) {
        const sub = await subscription(f, key, payload.sub);
        if (!activeStatus(sub)) return json({ plan: 'gratis' });
        token = tokenFor(sub, secret);
      }
      return json({ plan: 'plus', token, ...(await minutes(blobs(), payload.sub)) });
    }

    if (route === 'portal' && request.method === 'POST') {
      const language = await pageLanguage(request);
      const portal = await stripe(f, key, 'POST', '/billing_portal/sessions', {
        customer: payload.cus,
        locale: language,
        return_url: `${url.origin}${HOME[language]}?plus=hantera`,
        configuration: await portalConfig(f, key)
      });
      return json({ url: portal.url });
    }

    // Ångerknappen. Inom 14 dagar från köpet avslutas Plus direkt och hela beloppet betalas
    // tillbaka. Efter det sägs Plus upp till slutet av den betalda perioden.
    if (route === 'angra' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = typeof body.namn === 'string' ? body.namn.trim().slice(0, 100) : '';
      if (!name || body.bekraftat !== true) return json({ error: 'confirm_needed' }, 400);
      const now = new Date();
      const sub = await subscription(f, key, payload.sub);
      if (!sub || sub.status === 'canceled') return json({ status: 'redan_avslutad', received: now.toISOString() });
      const days = (now.getTime() / 1000 - (sub.start_date || payload.start)) / 86400;
      const note = { metadata: { angrat_av: name, angrat_tid: now.toISOString() } };
      if (days <= WITHDRAWAL_DAYS) {
        await stripe(f, key, 'POST', `/subscriptions/${encodeURIComponent(sub.id)}`, note);
        await stripe(f, key, 'DELETE', `/subscriptions/${encodeURIComponent(sub.id)}`);
        // Alla betalda fakturor för prenumerationen betalas tillbaka (inom 14 dagar är det en).
        const invoices = await stripe(f, key, 'GET', '/invoices', { subscription: sub.id, status: 'paid', limit: 10 });
        let refunded = 0;
        for (const invoice of invoices.data || []) {
          if (!invoice.payment_intent || !(invoice.amount_paid > 0)) continue;
          await stripe(f, key, 'POST', '/refunds', { payment_intent: invoice.payment_intent, reason: 'requested_by_customer' });
          refunded += invoice.amount_paid;
        }
        return json({ status: 'angrat', received: now.toISOString(), refunded: refunded / 100 });
      }
      await stripe(f, key, 'POST', `/subscriptions/${encodeURIComponent(sub.id)}`, { cancel_at_period_end: true, ...note });
      return json({ status: 'uppsagd', received: now.toISOString(), ends: sub.current_period_end });
    }

    return json({ error: 'not_found' }, 404);
  } catch (err) {
    console.error(String(err && err.message ? err.message : err)); // aldrig nycklar
    return json({ error: 'stripe_failed' }, 502);
  }
}

export default (request) => handle(request);
export const config = { path: '/api/plus/*' };
