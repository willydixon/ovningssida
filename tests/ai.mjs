// Tester för AI-motspelaren utan webbläsare och utan ElevenLabs: ljudomvandlingen,
// instruktionen till AI:n och Netlify-funktionen som hämtar länken.
// Körs med: node tests/ai.mjs

import { resample, floatToPcm16, pcm16ToFloat, bytesToBase64, base64ToBytes, rateFromFormat, buildAiSetup, AI_RATE } from '../public/ai-partner.js';
import { handle, agentConfig, resetCache, AGENT_NAME } from '../netlify/functions/ai-start.mjs';
import { SCENES } from '../public/scenes.js';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// ---- Ljudet ----
const tone = (rate, seconds, hz = 220, amp = 0.5) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));
check(resample(tone(48000, 0.1), 48000).length === 1600, '100 ms från 48 000 Hz blir 1 600 prover i 16 000 Hz');
check(resample(tone(44100, 0.1), 44100).length === 1600, '100 ms från 44 100 Hz blir 1 600 prover i 16 000 Hz');
const down = resample(tone(48000, 0.1), 48000);
const peak = Math.max(...down.map(Math.abs));
check(peak > 0.45 && peak <= 0.5, `En ton behåller sin styrka efter omvandlingen (${peak.toFixed(2)})`);
check(resample(tone(16000, 0.1, 220), 16000, 24000).length === 2400, 'Uppsampling till 24 000 Hz ger rätt längd');
const pcm = floatToPcm16(Float32Array.from([0, 0.5, -0.5, 1, -1, 2, -2]));
check(pcm[0] === 0 && pcm[3] === 32767 && pcm[4] === -32768 && pcm[5] === 32767 && pcm[6] === -32768, 'Ljud blir 16-bitars PCM och klipps vid full styrka');
const back = pcm16ToFloat(pcm);
check(Math.abs(back[1] - 0.5) < 0.001 && Math.abs(back[2] + 0.5) < 0.001, 'PCM blir samma ljud tillbaka');
const bytes = Uint8Array.from({ length: 70000 }, (_, i) => (i * 7) % 256);
const roundtrip = base64ToBytes(bytesToBase64(bytes));
check(roundtrip.length === bytes.length && roundtrip.every((b, i) => b === bytes[i]), 'Base64 fram och tillbaka ger samma bytes, även för stora block');
check(rateFromFormat('pcm_16000') === 16000 && rateFromFormat('pcm_24000') === 24000 && rateFromFormat('ulaw_8000') === null, 'Ljudformatet från ElevenLabs tolkas rätt');
check(AI_RATE === 16000, 'Mikrofonens ljud skickas med 16 000 prover per sekund');

// ---- Instruktionen till AI:n ----
const scene = SCENES[0];
const [a, b] = scene.roller;
const userFirst = buildAiSetup(scene, a.id);
check(userFirst.firstMessage === '', 'När din roll börjar scenen väntar AI:n på dig');
check(userFirst.prompt.includes(`Du spelar ${b.namn}`) && userFirst.prompt.includes(`Skådespelaren spelar ${a.namn}`), 'AI:n spelar den andra rollen');
check(userFirst.prompt.includes(scene.situation) && userFirst.prompt.includes(scene.repliker[1].text), 'AI:n får situationen och manuset');
check(/Bryt aldrig scenen/.test(userFirst.prompt) && /bedöma/.test(userFirst.prompt), 'AI:n bedömer inte skådespelaren och bryter inte scenen');
check(userFirst.prompt.includes(b.vill) && userFirst.prompt.includes(b.inre) && userFirst.prompt.includes(a.vill), 'AI:n får sin rolls vilja och inre liv, och vet vad din roll vill');
check(/undertext/.test(userFirst.prompt) && /energi/.test(userFirst.prompt), 'AI:n ska spela med undertext och möta din energi');
const aiFirst = buildAiSetup(scene, b.id);
check(aiFirst.firstMessage === scene.repliker[0].text && aiFirst.aiName === a.namn, 'När AI:ns roll börjar säger AI:n första repliken');

// ---- Netlify-funktionen ----
function memoryStore() {
  const data = new Map();
  return {
    data,
    async get(key) { return data.has(key) ? data.get(key) : null; },
    async set(key, value) { data.set(key, value); },
    async delete(key) { data.delete(key); }
  };
}
function fakeElevenLabs({ agents = [], failSigned = false, duration = 42 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : null });
    const path = new URL(url).pathname;
    if (path.endsWith('/agents')) return Response.json({ agents, has_more: false });
    if (path.endsWith('/agents/create')) {
      const plan = JSON.parse(init.body).name.includes('plus') ? 'plus' : 'gratis';
      return Response.json({ agent_id: `agent_${plan}` });
    }
    if (path.endsWith('/conversation/get-signed-url')) {
      if (failSigned) return new Response('nej', { status: 401 });
      return Response.json({ signed_url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${new URL(url).searchParams.get('agent_id')}&token=abc` });
    }
    const conv = path.match(/\/conversations\/([\w-]+)$/);
    if (conv) return Response.json({ agent_id: 'agent_plus', status: 'done', metadata: { call_duration_secs: duration } });
    return new Response('okänd', { status: 404 });
  };
  return { fetchImpl, calls };
}
const ENV = { ELEVENLABS_API_KEY: 'hemlig', LICENSE_SECRET: 'licens-hemlis' };
const req = (q = '', method = 'GET', token) => new Request(`https://exempel.netlify.app/api/ai-start${q}`, { method, headers: token ? { authorization: `Bearer ${token}` } : {} });

let res = await handle(req('?check=1'), {}, fakeElevenLabs().fetchImpl, memoryStore());
check((await res.json()).available === false, 'Utan nyckel i Netlify är AI-motspelaren avstängd');
res = await handle(req('?check=1'), ENV, fakeElevenLabs().fetchImpl, memoryStore());
check((await res.json()).available === true && res.headers.get('cache-control') === 'no-store', 'Med nyckel svarar funktionen att AI-motspelaren finns');
res = await handle(req('', 'POST'), ENV, fakeElevenLabs().fetchImpl, memoryStore());
check(res.status === 405, 'Funktionen tar bara emot GET');

resetCache();
let store = memoryStore();
let el = fakeElevenLabs();
res = await handle(req(), ENV, el.fetchImpl, store);
let data = await res.json();
const created = el.calls.find((c) => c.url.endsWith('/agents/create'));
check(res.status === 200 && data.signed_url.includes('agent_id=agent_gratis') && data.plan === 'gratis', 'Utan Plus får man gratisversionen av AI-motspelaren och en länk');
check(!JSON.stringify(data).includes('hemlig'), 'Webbläsaren får aldrig nyckeln');
check(el.calls.every((c) => c.headers['xi-api-key'] === 'hemlig'), 'Nyckeln skickas bara till ElevenLabs');
check(created && created.body.name === AGENT_NAME && created.body.conversation_config.agent.language === 'sv', 'AI-motspelaren pratar svenska');
check(created && created.body.conversation_config.tts.model_id === 'eleven_flash_v2_5', 'Gratis använder den snabba rösten');
check(created && created.body.platform_settings.auth.enable_auth === true, 'Samtal kräver en länk från funktionen');
check(created && created.body.platform_settings.privacy.record_voice === false, 'ElevenLabs ska inte spara ljudet från samtalen');
check(data.max_seconds === 240 && /^[0-9a-f-]{36}$/.test(data.reservation), 'Ett gratissamtal får högst 4 minuter, och tiden reserveras');
check(store.data.get(`gratis/${new Date().toISOString().slice(0, 10)}`) === '240', 'Gratistiden räknas mot taket för alla gratisanvändare i dag');
const overrides = agentConfig().platform_settings.overrides.conversation_config_override.agent;
check(overrides.prompt.prompt && overrides.first_message && overrides.language, 'Scenen, första repliken och språket kan skickas med varje samtal');

el = fakeElevenLabs();
await handle(req(), ENV, el.fetchImpl, store);
check(el.calls.length === 1 && el.calls[0].url.includes('get-signed-url'), 'Nästa gång återanvänds AI-motspelaren');

resetCache();
el = fakeElevenLabs({ agents: [{ agent_id: 'agent_finns', name: AGENT_NAME }, { agent_id: 'annan', name: 'något annat' }] });
res = await handle(req(), ENV, el.fetchImpl, memoryStore());
data = await res.json();
check(data.signed_url.includes('agent_id=agent_finns') && !el.calls.some((c) => c.url.endsWith('/agents/create')), 'En AI-motspelare som redan finns hittas på namnet');

const fullStore = memoryStore();
await fullStore.set(`gratis/${new Date().toISOString().slice(0, 10)}`, '1800');
res = await handle(req(), ENV, fakeElevenLabs().fetchImpl, fullStore);
check(res.status === 503 && (await res.json()).error === 'free_full', 'När taket för gratisminuter är nått i dag startar inget nytt gratissamtal');

// Plus: en giltig licenskod ger den bättre rösten och 60 minuter i månaden.
const { signToken } = await import('../netlify/lib/plus.mjs');
const now = Math.floor(Date.now() / 1000);
const plusToken = signToken({ plan: 'plus', sub: 'sub_123', cus: 'cus_1', start: now - 86400, exp: now + 3600 }, ENV.LICENSE_SECRET);
resetCache();
store = memoryStore();
el = fakeElevenLabs();
res = await handle(req('', 'GET', plusToken), ENV, el.fetchImpl, store);
data = await res.json();
const createdPlus = el.calls.find((c) => c.url.endsWith('/agents/create'));
const month = new Date().toISOString().slice(0, 7);
check(data.plan === 'plus' && data.signed_url.includes('agent_plus') && createdPlus.body.conversation_config.tts.model_id === 'eleven_v4_turbo',
  'Med Plus får man AI-motspelaren med den mer levande rösten');
check(data.max_seconds === 600 && store.data.get(`plus/sub_123/${month}`) === '600', 'Ett Plus-samtal får upp till 10 minuter, som reserveras från månadens 60');
await store.set(`plus/sub_123/${month}`, '3590');
res = await handle(req('', 'GET', plusToken), ENV, el.fetchImpl, store);
check(res.status === 402 && (await res.json()).error === 'no_minutes', 'När Plus-minuterna är slut startar inget nytt samtal');
// Utan LICENSE_SECRET används nyckeln som Plus-funktionen har sparat i Netlify Blobs.
const { resetSecretCache } = await import('../netlify/lib/plus.mjs');
resetSecretCache();
const savedStore = memoryStore();
await savedStore.set('hemlis/licens', 'sparad-hemlis');
const savedToken = signToken({ plan: 'plus', sub: 'sub_9', cus: 'cus_9', start: now, exp: now + 3600 }, 'sparad-hemlis');
res = await handle(req('', 'GET', savedToken), { ELEVENLABS_API_KEY: 'hemlig' }, fakeElevenLabs().fetchImpl, savedStore);
check((await res.json()).plan === 'plus', 'AI-motspelaren känner igen Plus med den sparade nyckeln');
resetSecretCache();
const fake = signToken({ plan: 'plus', sub: 'sub_123', exp: now + 3600 }, 'fel-hemlis');
res = await handle(req('', 'GET', fake), ENV, fakeElevenLabs().fetchImpl, memoryStore());
check((await res.json()).plan === 'gratis', 'En licenskod med fel underskrift ger inte Plus');

// Efter samtalet dras bara den tid som användes.
const { handle: end } = await import('../netlify/functions/ai-end.mjs');
await store.set(`plus/sub_123/${month}`, '0');
res = await handle(req('', 'GET', plusToken), ENV, el.fetchImpl, store);
data = await res.json();
const endReq = (body) => new Request('https://exempel.netlify.app/api/ai-end', { method: 'POST', body: JSON.stringify(body) });
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_abc123' }), ENV, fakeElevenLabs({ duration: 41.2 }).fetchImpl, store);
const ended = await res.json();
check(ended.used_seconds === 42 && store.data.get(`plus/sub_123/${month}`) === '42', 'Efter samtalet räknas bara de 42 sekunder som användes');
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_abc123' }), ENV, fakeElevenLabs().fetchImpl, store);
check(res.status === 404, 'Samma samtal kan inte avslutas två gånger');
res = await handle(req('', 'GET', plusToken), ENV, el.fetchImpl, store);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_x' }), {}, fakeElevenLabs().fetchImpl, store);
check((await res.json()).used_seconds === 600, 'Om samtalets längd inte går att få räknas hela den reserverade tiden');

// Precis efter samtalet kan ElevenLabs svara 404 en stund. Då frågar funktionen igen.
const noWait = async () => {};
let asks = 0;
const slow = async (url) => {
  asks += 1;
  if (asks < 3) return new Response('finns inte än', { status: 404 });
  return Response.json({ agent_id: 'agent_plus', status: 'done', metadata: { call_duration_secs: 75 } });
};
res = await handle(req('', 'GET', plusToken), ENV, el.fetchImpl, store);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_sen' }), ENV, slow, store, noWait);
check((await res.json()).used_seconds === 75 && asks === 3, 'Om ElevenLabs inte har samtalet än frågar funktionen igen');
const other = async () => Response.json({ agent_id: 'annan_agent', status: 'done', metadata: { call_duration_secs: 5 } });
res = await handle(req('', 'GET', plusToken), ENV, el.fetchImpl, store);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_annan' }), ENV, other, store, noWait);
check((await res.json()).used_seconds === data.max_seconds, 'Ett samtal med en annan AI-motspelare räknas inte');

resetCache();
el = fakeElevenLabs({ failSigned: true });
const errors = [];
const origError = console.error;
console.error = (m) => errors.push(String(m));
res = await handle(req(), ENV, el.fetchImpl, memoryStore());
console.error = origError;
data = await res.json();
check(res.status === 502 && data.error === 'start_failed', 'Om ElevenLabs säger nej får webbläsaren ett fel att visa');
check(errors.length === 1 && !errors[0].includes('hemlig'), 'Felet loggas utan nyckeln');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för AI-motspelaren gick igenom.');
