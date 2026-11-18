// Tester för Plus: licenskoden, Stripe-anropen, köpet, kontrollen, kundsidan och ångerknappen.
// Stripe ersätts av en låtsas-Stripe, så inga riktiga anrop görs. Körs med: node tests/plus.mjs

import { formParams, signToken, readToken, tokenFor, bearer, PRICE } from '../netlify/lib/plus.mjs';
import { handle, resetCache } from '../netlify/functions/plus.mjs';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// ---- Formulärdata till Stripe ----
const form = formParams({ mode: 'subscription', line_items: [{ price: 'price_1', quantity: 1 }], expand: ['subscription'], a: { b: { c: 1 } }, tom: null });
check(decodeURIComponent(form.toString()) === 'mode=subscription&line_items[0][price]=price_1&line_items[0][quantity]=1&expand[]=subscription&a[b][c]=1',
  'Listor och objekt blir Stripes formulärdata');

// ---- Licenskoden ----
const SECRET = 'licens-hemlis';
const now = Math.floor(Date.now() / 1000);
const token = signToken({ plan: 'plus', sub: 'sub_1', cus: 'cus_1', start: now, exp: now + 60 }, SECRET);
check(readToken(token, SECRET)?.sub === 'sub_1', 'En licenskod med rätt underskrift godkänns');
check(readToken(token, 'annan-hemlis') === null, 'En licenskod med fel underskrift godkänns inte');
const [v, body, sig] = token.split('.');
const changed = Buffer.from(JSON.stringify({ plan: 'plus', sub: 'sub_annan', exp: now + 60 })).toString('base64url');
check(readToken(`${v}.${changed}.${sig}`, SECRET) === null, 'Ändrat innehåll i licenskoden godkänns inte');
check(readToken(signToken({ plan: 'gratis', sub: 'sub_1' }, SECRET), SECRET) === null, 'Bara licenskoder för Plus godkänns');
check(readToken('skräp', SECRET) === null && readToken(null, SECRET) === null && readToken(token, '') === null, 'Trasiga koder och saknad hemlis godkänns inte');
check(body.length > 0 && !Buffer.from(body, 'base64url').toString().includes('@'), 'Licenskoden har ingen e-post');
const periodEnd = now + 20 * 86400;
const fresh = readToken(tokenFor({ id: 'sub_1', customer: { id: 'cus_1' }, start_date: now, current_period_end: periodEnd }, SECRET), SECRET);
check(fresh.cus === 'cus_1' && fresh.exp <= now + 86400 + 1 && fresh.exp >= now + 86400 - 1, 'Licenskoden måste kontrolleras mot Stripe igen inom ett dygn');
const ending = readToken(tokenFor({ id: 'sub_1', customer: 'cus_1', start_date: now, current_period_end: now + 600 }, SECRET), SECRET);
check(ending.exp === now + 600, 'Licenskoden gäller aldrig längre än den betalda perioden');
check(bearer(new Request('https://x.se', { headers: { authorization: 'Bearer abc' } })) === 'abc', 'Licenskoden läses från Authorization');

// ---- Låtsas-Stripe ----
function fakeStripe({ prices = [], sessionStatus = 'complete', subStatus = 'active', startDaysAgo = 2, portalConfigs = [], fail = false, missingSub = false } = {}) {
  const calls = [];
  const sub = () => ({
    id: 'sub_1', object: 'subscription', customer: 'cus_1', status: subStatus,
    start_date: now - startDaysAgo * 86400, current_period_end: now + 20 * 86400
  });
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const params = init.body ? new URLSearchParams(init.body) : u.searchParams;
    const call = { method: init.method || 'GET', path: u.pathname.replace('/v1', ''), params, headers: init.headers || {}, host: u.host };
    calls.push(call);
    if (fail) return Response.json({ error: { code: 'api_key_expired' } }, { status: 401 });
    const route = `${call.method} ${call.path}`;
    switch (route) {
      case 'GET /prices': return Response.json({ data: prices });
      case 'POST /products': return Response.json({ id: 'prod_1' });
      case 'POST /prices': prices = [{ id: 'price_ny' }]; return Response.json({ id: 'price_ny' });
      case 'POST /checkout/sessions': return Response.json({ id: 'cs_test_abc', url: 'https://checkout.stripe.com/c/pay/cs_test_abc' });
      case 'GET /checkout/sessions/cs_test_abc': return Response.json({ id: 'cs_test_abc', status: sessionStatus, subscription: sub() });
      case 'GET /subscriptions/sub_1': return missingSub ? Response.json({ error: { code: 'resource_missing' } }, { status: 404 }) : Response.json(sub());
      case 'POST /subscriptions/sub_1': return Response.json(sub());
      case 'DELETE /subscriptions/sub_1': return Response.json({ ...sub(), status: 'canceled' });
      case 'GET /invoices': return Response.json({ data: [{ id: 'in_1', status: 'paid', amount_paid: 9900, payment_intent: 'pi_1' }] });
      case 'POST /refunds': return Response.json({ id: 're_1', status: 'succeeded' });
      case 'GET /billing_portal/configurations': return Response.json({ data: portalConfigs });
      case 'POST /billing_portal/configurations': portalConfigs = [{ id: 'bpc_ny', metadata: { app: 'ovningssida' } }]; return Response.json({ id: 'bpc_ny' });
      case 'POST /billing_portal/sessions': return Response.json({ url: 'https://billing.stripe.com/p/session/test_1' });
      default: return Response.json({ error: { code: 'okand' } }, { status: 404 });
    }
  };
  return { fetchImpl, calls, find: (method, path) => calls.filter((c) => c.method === method && c.path === path) };
}
function memoryStore() {
  const data = new Map();
  return { data, async get(k) { return data.has(k) ? data.get(k) : null; }, async set(k, v) { data.set(k, v); }, async delete(k) { data.delete(k); } };
}
const ENV = { STRIPE_SECRET_KEY: 'sk_test_hemlig', LICENSE_SECRET: SECRET };
const req = (route, { method = 'GET', token: tok, body } = {}) => new Request(`https://exempel.netlify.app/api/plus/${route}`, {
  method,
  headers: { ...(tok ? { authorization: `Bearer ${tok}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
  body: body ? JSON.stringify(body) : undefined
});

// ---- Info ----
let res = await handle(req('info'), {}, fakeStripe().fetchImpl, memoryStore());
let data = await res.json();
check(data.available === false, 'Utan nycklar i Netlify är köp avstängt');
res = await handle(req('checkout', { method: 'POST' }), {}, fakeStripe().fetchImpl, memoryStore());
check(res.status === 503, 'Utan nycklar går det inte att starta ett köp');
res = await handle(req('info'), ENV, fakeStripe().fetchImpl, memoryStore());
data = await res.json();
check(data.available === true && data.test === true && data.price === 99, 'Med en testnyckel är köp igång i testläge för 99 kr');
res = await handle(req('info'), { ...ENV, STRIPE_SECRET_KEY: 'sk_live_x' }, fakeStripe().fetchImpl, memoryStore());
check((await res.json()).test === false, 'En riktig nyckel är inte testläge');

// ---- Köpet ----
resetCache();
let stripe = fakeStripe();
res = await handle(req('checkout', { method: 'POST' }), ENV, stripe.fetchImpl, memoryStore());
data = await res.json();
const checkout = stripe.find('POST', '/checkout/sessions')[0];
const newPrice = stripe.find('POST', '/prices')[0];
check(res.status === 200 && data.url === 'https://checkout.stripe.com/c/pay/cs_test_abc', 'Köpet ger länken till Stripes betalsida');
check(newPrice && newPrice.params.get('unit_amount') === String(PRICE.amount) && newPrice.params.get('currency') === 'sek' &&
  newPrice.params.get('recurring[interval]') === 'month' && newPrice.params.get('tax_behavior') === 'inclusive',
  'Priset skapas första gången: 99 kr i månaden inklusive moms');
check(checkout.params.get('mode') === 'subscription' && checkout.params.get('line_items[0][price]') === 'price_ny' && checkout.params.get('line_items[0][quantity]') === '1',
  'Köpet är en prenumeration på priset');
check(checkout.params.get('success_url') === 'https://exempel.netlify.app/?plus=klar&session_id={CHECKOUT_SESSION_ID}' &&
  checkout.params.get('cancel_url') === 'https://exempel.netlify.app/?plus=avbrutet' && checkout.params.get('locale') === 'sv',
  'Efter köpet kommer man tillbaka till sidan, och betalsidan är på svenska');
check(!checkout.params.has('customer_email'), 'Ingen e-post skickas till Stripe från oss');
check(stripe.calls.every((c) => c.host === 'api.stripe.com' && c.headers.authorization === 'Bearer sk_test_hemlig' && c.headers['stripe-version'] === '2024-06-20'),
  'Nyckeln skickas bara till Stripe, med en låst version av Stripes svar');
check(!JSON.stringify(data).includes('sk_test'), 'Webbläsaren får aldrig nyckeln');
const before = stripe.calls.length;
await handle(req('checkout', { method: 'POST' }), ENV, stripe.fetchImpl, memoryStore());
check(stripe.calls.length === before + 1, 'Nästa köp återanvänder priset');
resetCache();
stripe = fakeStripe({ prices: [{ id: 'price_finns' }] });
await handle(req('checkout', { method: 'POST' }), ENV, stripe.fetchImpl, memoryStore());
check(stripe.find('POST', '/products').length === 0 && stripe.find('POST', '/checkout/sessions')[0].params.get('line_items[0][price]') === 'price_finns',
  'Ett pris som redan finns hittas på sin nyckel');
check(stripe.find('GET', '/prices')[0].params.get('lookup_keys[]') === 'plus-manad', 'Priset letas upp med nyckeln plus-manad');
stripe = fakeStripe({ prices: [{ id: 'price_finns' }] });
await handle(req('checkout', { method: 'POST', body: { lang: 'en' } }), ENV, stripe.fetchImpl, memoryStore());
const english = stripe.find('POST', '/checkout/sessions')[0];
check(english.params.get('locale') === 'en' && english.params.get('success_url') === 'https://exempel.netlify.app/en/?plus=klar&session_id={CHECKOUT_SESSION_ID}' &&
  english.params.get('cancel_url') === 'https://exempel.netlify.app/en/?plus=avbrutet' && english.params.get('custom_text[submit][message]').startsWith('You can withdraw'),
  'Från de engelska sidorna är betalsidan på engelska och går tillbaka till de engelska sidorna');
stripe = fakeStripe({ prices: [{ id: 'price_finns' }] });
await handle(req('checkout', { method: 'POST', body: { lang: 'xx' } }), ENV, stripe.fetchImpl, memoryStore());
check(stripe.find('POST', '/checkout/sessions')[0].params.get('locale') === 'sv', 'Ett okänt språk ger svenska');

// ---- Efter köpet ----
const store = memoryStore();
res = await handle(req('activate?session_id=fel'), ENV, fakeStripe().fetchImpl, store);
check(res.status === 400, 'Ett felaktigt köpnummer avvisas utan att fråga Stripe');
res = await handle(req('activate?session_id=cs_test_abc'), ENV, fakeStripe({ sessionStatus: 'open' }).fetchImpl, store);
check(res.status === 402, 'Ett köp som inte är betalt ger inte Plus');
res = await handle(req('activate?session_id=cs_test_abc'), ENV, fakeStripe({ subStatus: 'incomplete' }).fetchImpl, store);
check(res.status === 402, 'En prenumeration som inte är aktiv ger inte Plus');
stripe = fakeStripe();
res = await handle(req('activate?session_id=cs_test_abc'), ENV, stripe.fetchImpl, store);
data = await res.json();
const license = readToken(data.token, SECRET);
check(res.status === 200 && data.plan === 'plus' && license && license.sub === 'sub_1' && license.cus === 'cus_1', 'Ett betalt köp ger en licenskod för prenumerationen');
check(data.usedSeconds === 0 && data.limitSeconds === 3600, 'Plus börjar med 60 AI-minuter');
check(stripe.find('GET', '/checkout/sessions/cs_test_abc')[0].params.get('expand[]') === 'subscription', 'Prenumerationen hämtas med köpet');

// ---- Kontrollen ----
res = await handle(req('status'), ENV, fakeStripe().fetchImpl, store);
check(res.status === 401 && (await res.json()).plan === 'gratis', 'Utan licenskod är man gratis');
const month = new Date().toISOString().slice(0, 7);
await store.set(`plus/sub_1/${month}`, '900');
stripe = fakeStripe();
res = await handle(req('status', { token: data.token }), ENV, stripe.fetchImpl, store);
let status = await res.json();
check(status.plan === 'plus' && status.token === data.token && stripe.calls.length === 0, 'En färsk licenskod godkänns utan att fråga Stripe');
check(status.usedSeconds === 900, 'Kontrollen visar hur många AI-sekunder som har använts den här månaden');
const old = signToken({ plan: 'plus', sub: 'sub_1', cus: 'cus_1', start: now - 5 * 86400, exp: now - 10 }, SECRET);
stripe = fakeStripe();
res = await handle(req('status', { token: old }), ENV, stripe.fetchImpl, store);
status = await res.json();
check(status.plan === 'plus' && status.token !== old && readToken(status.token, SECRET).exp > now && stripe.find('GET', '/subscriptions/sub_1').length === 1,
  'En gammal licenskod kontrolleras mot Stripe och byts mot en ny');
res = await handle(req('status', { token: old }), ENV, fakeStripe({ subStatus: 'canceled' }).fetchImpl, store);
check((await res.json()).plan === 'gratis', 'När Plus har sagts upp och perioden är slut blir man gratis');
res = await handle(req('status', { token: old }), ENV, fakeStripe({ missingSub: true }).fetchImpl, store);
check((await res.json()).plan === 'gratis', 'En prenumeration som inte finns hos Stripe ger gratis');

// ---- Kundsidan hos Stripe ----
resetCache();
stripe = fakeStripe();
res = await handle(req('portal', { method: 'POST', token: data.token }), ENV, stripe.fetchImpl, store);
const portal = await res.json();
const portalSession = stripe.find('POST', '/billing_portal/sessions')[0];
const createdConfig = stripe.find('POST', '/billing_portal/configurations')[0];
check(portal.url === 'https://billing.stripe.com/p/session/test_1' && portalSession.params.get('customer') === 'cus_1', 'Licenskoden ger en länk till kundens sida hos Stripe');
check(createdConfig && createdConfig.params.get('features[subscription_cancel][mode]') === 'at_period_end' && createdConfig.params.get('metadata[app]') === 'ovningssida',
  'På Stripes sida kan man säga upp Plus till periodens slut');
check(portalSession.params.get('return_url') === 'https://exempel.netlify.app/?plus=hantera' && portalSession.params.get('locale') === 'sv', 'Från Stripes sida kommer man tillbaka hit');
stripe = fakeStripe({ portalConfigs: [{ id: 'bpc_finns', metadata: { app: 'ovningssida' } }] });
await handle(req('portal', { method: 'POST', token: data.token, body: { lang: 'en' } }), ENV, stripe.fetchImpl, store);
check(stripe.find('POST', '/billing_portal/sessions')[0].params.get('return_url') === 'https://exempel.netlify.app/en/?plus=hantera' &&
  stripe.find('POST', '/billing_portal/sessions')[0].params.get('locale') === 'en', 'Från de engelska sidorna är kundsidan på engelska');
resetCache();
stripe = fakeStripe({ portalConfigs: [{ id: 'bpc_annan', metadata: {} }, { id: 'bpc_finns', metadata: { app: 'ovningssida' } }] });
await handle(req('portal', { method: 'POST', token: data.token }), ENV, stripe.fetchImpl, store);
check(stripe.find('POST', '/billing_portal/configurations').length === 0 && stripe.find('POST', '/billing_portal/sessions')[0].params.get('configuration') === 'bpc_finns',
  'Inställningarna för kundsidan skapas bara en gång');
res = await handle(req('portal', { method: 'POST' }), ENV, fakeStripe().fetchImpl, store);
check(res.status === 401, 'Utan licenskod får man ingen länk till kundsidan');

// ---- Ångerknappen ----
res = await handle(req('angra', { method: 'POST', token: data.token, body: { namn: 'Kim', bekraftat: false } }), ENV, fakeStripe().fetchImpl, store);
check(res.status === 400, 'Ångern kräver att man har bekräftat');
res = await handle(req('angra', { method: 'POST', token: data.token, body: { namn: '  ', bekraftat: true } }), ENV, fakeStripe().fetchImpl, store);
check(res.status === 400, 'Ångern kräver ett namn');
res = await handle(req('angra', { method: 'POST', body: { namn: 'Kim', bekraftat: true } }), ENV, fakeStripe().fetchImpl, store);
check(res.status === 401, 'Ångern kräver licenskoden');

stripe = fakeStripe({ startDaysAgo: 3 });
res = await handle(req('angra', { method: 'POST', token: data.token, body: { namn: 'Kim Test', bekraftat: true } }), ENV, stripe.fetchImpl, store);
let withdraw = await res.json();
const marked = stripe.find('POST', '/subscriptions/sub_1')[0];
check(withdraw.status === 'angrat' && stripe.find('DELETE', '/subscriptions/sub_1').length === 1, 'Inom 14 dagar avslutas Plus direkt');
check(withdraw.refunded === 99 && stripe.find('POST', '/refunds')[0].params.get('payment_intent') === 'pi_1', 'Inom 14 dagar betalas hela beloppet tillbaka');
check(marked.params.get('metadata[angrat_av]') === 'Kim Test' && !!marked.params.get('metadata[angrat_tid]'), 'Hos Stripe sparas vem som ångrade och när');
check(!Number.isNaN(Date.parse(withdraw.received)), 'Svaret har tiden då ångern togs emot');
check(stripe.find('GET', '/invoices')[0].params.get('status') === 'paid', 'Bara betalda fakturor betalas tillbaka');

stripe = fakeStripe({ startDaysAgo: 20 });
res = await handle(req('angra', { method: 'POST', token: data.token, body: { namn: 'Kim', bekraftat: true } }), ENV, stripe.fetchImpl, store);
withdraw = await res.json();
check(withdraw.status === 'uppsagd' && stripe.find('POST', '/subscriptions/sub_1')[0].params.get('cancel_at_period_end') === 'true' &&
  stripe.find('DELETE', '/subscriptions/sub_1').length === 0 && stripe.find('POST', '/refunds').length === 0,
  'Efter 14 dagar sägs Plus upp till periodens slut, utan återbetalning');
check(withdraw.ends === now + 20 * 86400, 'Svaret säger när Plus slutar');
stripe = fakeStripe({ subStatus: 'canceled' });
res = await handle(req('angra', { method: 'POST', token: data.token, body: { namn: 'Kim', bekraftat: true } }), ENV, stripe.fetchImpl, store);
check((await res.json()).status === 'redan_avslutad' && stripe.calls.length === 1, 'Ett avslutat Plus kan inte avslutas igen');

// ---- Fel hos Stripe ----
resetCache();
const errors = [];
const origError = console.error;
console.error = (m) => errors.push(String(m));
res = await handle(req('checkout', { method: 'POST' }), ENV, fakeStripe({ fail: true }).fetchImpl, store);
console.error = origError;
check(res.status === 502 && (await res.json()).error === 'stripe_failed', 'Om Stripe säger nej får webbläsaren ett fel att visa');
check(errors.length === 1 && !errors[0].includes('sk_test'), 'Felet loggas utan nyckeln');
res = await handle(req('okand', { token: data.token }), ENV, fakeStripe().fetchImpl, store);
check(res.status === 404, 'Okända adresser ger 404');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för Plus gick igenom.');
