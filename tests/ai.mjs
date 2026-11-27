// Tester för AI-motspelaren utan webbläsare och utan ElevenLabs: ljudomvandlingen,
// instruktionen till AI:n och Netlify-funktionen som hämtar länken.
// Körs med: node tests/ai.mjs

import { resample, floatToPcm16, pcm16ToFloat, bytesToBase64, base64ToBytes, rateFromFormat, buildAiSetup, AI_RATE } from '../public/ai-partner.js';
import { handle, agentConfig, agentStem, resetCache, config as startConfig } from '../netlify/functions/ai-start.mjs';
import { config as plusConfig } from '../netlify/functions/plus.mjs';
import { setupFor } from '../netlify/lib/setups.mjs';
import { sweep, resetSweep, ipHash, ipDayKey, allowHourly } from '../netlify/lib/limits.mjs';
import { SCENES, SCENES_BY_LANG } from '../public/scenes.js';
import { CONTENT } from '../public/content.js';

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
check(userFirst.sceneId === scene.id && userFirst.role === a.id, 'Webbläsaren vet vilken scen och roll den ska be servern om');

// ---- Instruktionerna byggs på servern ----
const serverSetup = setupFor(scene.id, a.id, 'sv');
check(serverSetup && serverSetup.prompt === userFirst.prompt && serverSetup.firstMessage === userFirst.firstMessage && serverSetup.aiRole === b.id && serverSetup.language === 'sv',
  'Servern bygger samma instruktion som sidan, från sidans egna scener');
const enScene = SCENES_BY_LANG.en[0];
const enSetup = setupFor(enScene.id, enScene.roller[1].id, 'en');
check(enSetup && enSetup.language === 'en' && /^You are the scene partner/.test(enSetup.prompt) && enSetup.prompt.includes(enScene.situation) && enSetup.firstMessage === enScene.repliker[0].text,
  'Servern bygger den engelska scenen på engelska');
const improv = CONTENT.en.improvs[0];
const improvSetup = setupFor(improv.id, 'A', 'en');
check(improvSetup && improvSetup.firstMessage === improv.ai.forsta && /There is no script/.test(improvSetup.prompt) && improvSetup.aiRole === 'B',
  'Servern bygger improvisationerna också, med karaktärens första replik');
check(setupFor('scen-finns-inte', 'A', 'sv') === null && setupFor(scene.id, 'C', 'sv') === null && setupFor(scene.id, 'A', 'de') === null && setupFor(improv.id, 'B', 'sv') === null,
  'Okänd scen, roll eller språk ger ingen instruktion');
const level5 = SCENES_BY_LANG.sv.filter((s) => s.niva === 5);
check(level5.every((s) => s.roller.every((r) => setupFor(s.id, r.id, 'sv') && setupFor(s.id, r.id, 'en'))), 'Alla roller i nivå 5 finns på servern på båda språken');

// ---- Netlify-funktionen ----
function memoryStore() {
  const data = new Map();
  return {
    data,
    async get(key) { return data.has(key) ? data.get(key) : null; },
    async set(key, value) { data.set(key, value); },
    async delete(key) { data.delete(key); },
    async list({ prefix = '' } = {}) { return { blobs: [...data.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })), directories: [] }; }
  };
}
// En låtsas-ElevenLabs. agents: AI-motspelare som redan finns. Samtalen säger att de gjordes
// med conversationAgent, som standard samma AI-motspelare som skapas för Plus.
function fakeElevenLabs({ agents = [], failSigned = false, duration = 42 } = {}) {
  const calls = [];
  const existing = [...agents];
  const fetchImpl = async (url, init = {}) => {
    const method = init.method || 'GET';
    calls.push({ url, method, headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : null });
    const u = new URL(url);
    const path = u.pathname;
    if (path.endsWith('/agents')) {
      const search = u.searchParams.get('search') || '';
      return Response.json({ agents: existing.filter((x) => x.name.includes(search)), has_more: false });
    }
    if (path.endsWith('/agents/create')) {
      const name = JSON.parse(init.body).name;
      const agent = { agent_id: `agent_${name.includes('-plus-') ? 'plus' : 'gratis'}`, name };
      existing.push(agent);
      return Response.json({ agent_id: agent.agent_id });
    }
    const one = path.match(/\/agents\/([\w-]+)$/);
    if (one && method === 'DELETE') {
      const i = existing.findIndex((x) => x.agent_id === one[1]);
      if (i >= 0) existing.splice(i, 1);
      return new Response(null, { status: 204 });
    }
    if (path.endsWith('/conversation/get-signed-url')) {
      if (failSigned) return new Response('nej', { status: 401 });
      return Response.json({ signed_url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${u.searchParams.get('agent_id')}&token=abc` });
    }
    const conv = path.match(/\/conversations\/([\w-]+)$/);
    if (conv) return Response.json({ agent_id: 'agent_plus', status: 'done', metadata: { call_duration_secs: duration, start_time_unix_secs: Math.floor(Date.now() / 1000) } });
    return new Response('okänd', { status: 404 });
  };
  return { fetchImpl, calls, existing };
}
const ENV = { ELEVENLABS_API_KEY: 'hemlig', LICENSE_SECRET: 'licens-hemlis' };
const SCENE_Q = `?scene=${scene.id}&role=${a.id}&lang=sv`;
const req = (q = SCENE_Q, method = 'GET', token) => new Request(`https://exempel.netlify.app/api/ai-start${q}`, { method, headers: token ? { authorization: `Bearer ${token}` } : {} });
const IP = { ip: '203.0.113.5' };
const today = new Date().toISOString().slice(0, 10);

let res = await handle(req('?check=1'), {}, fakeElevenLabs().fetchImpl, memoryStore());
check((await res.json()).available === false, 'Utan nyckel i Netlify är AI-motspelaren avstängd');
res = await handle(req('?check=1'), ENV, fakeElevenLabs().fetchImpl, memoryStore());
check((await res.json()).available === true && res.headers.get('cache-control') === 'no-store', 'Med nyckel svarar funktionen att AI-motspelaren finns');
res = await handle(req(SCENE_Q, 'POST'), ENV, fakeElevenLabs().fetchImpl, memoryStore());
check(res.status === 405, 'Funktionen tar bara emot GET');
for (const q of ['', '?scene=scen-finns-inte&role=A&lang=sv', `?scene=${scene.id}&role=Q&lang=sv`, `?scene=${scene.id}&role=A&lang=fr`]) {
  const elBad = fakeElevenLabs();
  res = await handle(req(q), ENV, elBad.fetchImpl, memoryStore(), IP);
  check(res.status === 400 && (await res.json()).error === 'bad_scene' && elBad.calls.length === 0, `Utan en riktig scen, roll och språk startar inget samtal (${q || 'inget'})`);
}

resetCache();
let store = memoryStore();
let el = fakeElevenLabs();
res = await handle(req(), ENV, el.fetchImpl, store, IP);
let data = await res.json();
const created = el.calls.find((c) => c.url.endsWith('/agents/create'));
check(res.status === 200 && data.signed_url.includes('agent_id=agent_gratis') && data.plan === 'gratis', 'Utan Plus får man gratisversionen av AI-motspelaren och en länk');
check(!JSON.stringify(data).includes('hemlig'), 'Webbläsaren får aldrig nyckeln');
check(el.calls.every((c) => c.headers['xi-api-key'] === 'hemlig'), 'Nyckeln skickas bara till ElevenLabs');
const stem = agentStem('gratis', serverSetup);
check(created && created.body.name.startsWith(`${stem}-`) && /^ovningssida-v2-gratis-sv-scen-001-B-[0-9a-f]{10}$/.test(created.body.name),
  `Varje scen och roll får en egen AI-motspelare med version i namnet (${created && created.body.name})`);
const agentBody = created ? created.body.conversation_config.agent : {};
check(agentBody.prompt.prompt === serverSetup.prompt && agentBody.first_message === serverSetup.firstMessage && agentBody.language === 'sv',
  'Instruktionen, första repliken och språket läggs in i AI-motspelaren av servern');
const overrides = created ? created.body.platform_settings.overrides.conversation_config_override : {};
check(overrides.agent.prompt.prompt === false && overrides.agent.first_message === false && overrides.agent.language === false && overrides.tts.voice_id === false,
  'Inget av det går att byta ut från webbläsaren');
check(created && created.body.conversation_config.tts.model_id === 'eleven_flash_v2_5', 'Gratis använder den snabba rösten');
check(created && created.body.platform_settings.auth.enable_auth === true, 'Samtal kräver en länk från funktionen');
check(created && created.body.platform_settings.privacy.record_voice === false, 'ElevenLabs ska inte spara ljudet från samtalen');
check(data.max_seconds === 240 && /^[0-9a-f-]{36}$/.test(data.reservation), 'Ett gratissamtal får högst 4 minuter, och tiden reserveras');
check(store.data.get(`gratis/${today}`) === '240', 'Gratistiden räknas mot taket för alla gratisanvändare i dag');
check(agentConfig('gratis', serverSetup).name === created.body.name && agentConfig('plus', serverSetup).name !== created.body.name, 'Samma inställningar ger samma namn, och Plus får en egen');
const changed = agentConfig('gratis', { ...serverSetup, prompt: `${serverSetup.prompt} Ny rad.` }).name;
check(changed.startsWith(`${stem}-`) && changed !== created.body.name, 'En ändrad scen ger en ny version av AI-motspelaren');

el = fakeElevenLabs();
await handle(req(), ENV, el.fetchImpl, store, IP);
check(el.calls.length === 1 && el.calls[0].url.includes('get-signed-url'), 'Nästa gång återanvänds AI-motspelaren');
resetCache();
el = fakeElevenLabs();
await handle(req(), ENV, el.fetchImpl, store, { ip: '198.51.100.7' });
check(el.calls.length === 1 && el.calls[0].url.includes('get-signed-url'), 'AI-motspelaren hittas i Netlify Blobs när funktionen har startat om');

resetCache();
el = fakeElevenLabs({ agents: [{ agent_id: 'agent_finns', name: created.body.name }, { agent_id: 'annan', name: 'något annat' }] });
res = await handle(req(), ENV, el.fetchImpl, memoryStore(), IP);
data = await res.json();
check(data.signed_url.includes('agent_id=agent_finns') && !el.calls.some((c) => c.url.endsWith('/agents/create')), 'En AI-motspelare som redan finns hittas på namnet');

// En ny version tar bort den gamla, men inte AI-motspelare för andra scener.
resetCache();
const otherStem = agentStem('gratis', setupFor(scene.id, b.id, 'sv'));
el = fakeElevenLabs({ agents: [{ agent_id: 'agent_gammal', name: `${stem}-0000000000` }, { agent_id: 'agent_annan_roll', name: `${otherStem}-1111111111` }, { agent_id: 'agent_annan_sak', name: 'mitt eget projekt' }] });
store = memoryStore();
await store.set(`agent/${stem}-0000000000`, 'agent_gammal');
res = await handle(req(), ENV, el.fetchImpl, store, IP);
const deleted = el.calls.filter((c) => c.method === 'DELETE').map((c) => c.url.split('/').pop());
check(res.status === 200 && deleted.length === 1 && deleted[0] === 'agent_gammal' && !store.data.has(`agent/${stem}-0000000000`),
  'När scenen ändras tas den gamla versionen bort hos ElevenLabs');
check(el.existing.some((x) => x.agent_id === 'agent_annan_roll') && el.existing.some((x) => x.agent_id === 'agent_annan_sak'), 'Andra scener och annat på kontot lämnas i fred');

// Improvisationerna på engelska.
resetCache();
el = fakeElevenLabs();
res = await handle(req(`?scene=${improv.id}&role=A&lang=en`), ENV, el.fetchImpl, memoryStore(), IP);
const improvCreated = el.calls.find((c) => c.url.endsWith('/agents/create'));
check(res.status === 200 && improvCreated.body.name.includes(`-gratis-en-${improv.id}-B-`) && improvCreated.body.conversation_config.agent.first_message === improv.ai.forsta &&
  improvCreated.body.conversation_config.agent.language === 'en', 'Improvisationen på engelska får en egen AI-motspelare som börjar med karaktärens replik');

const fullStore = memoryStore();
await fullStore.set(`gratis/${today}`, '1800');
res = await handle(req(), ENV, fakeElevenLabs().fetchImpl, fullStore, IP);
check(res.status === 503 && (await res.json()).error === 'free_full', 'När taket för gratisminuter är nått i dag startar inget nytt gratissamtal');

// Varje uppkoppling har ett eget tak per dygn för gratisminuter (600 sekunder om inget annat anges).
resetCache();
store = memoryStore();
el = fakeElevenLabs();
const ipKey = ipDayKey(ipHash(IP.ip, ENV.LICENSE_SECRET));
const reserved = [];
for (let i = 0; i < 4; i++) {
  res = await handle(req(), ENV, el.fetchImpl, store, IP);
  const d = await res.json();
  reserved.push(res.status === 200 ? d.max_seconds : d.error);
}
check(JSON.stringify(reserved) === JSON.stringify([240, 240, 120, 'ip_full']) && store.data.get(ipKey) === '600',
  `En uppkoppling får 10 gratisminuter per dygn, sedan inte fler (${reserved.join(', ')})`);
res = await handle(req(), ENV, el.fetchImpl, store, { ip: '192.0.2.44' });
check(res.status === 200, 'En annan uppkoppling kan fortfarande starta');
check(![...store.data.keys(), ...store.data.values()].some((x) => String(x).includes('203.0.113.5') || String(x).includes('192.0.2.44')), 'IP-adressen sparas aldrig, bara ett kontrollvärde');
check(ipHash('203.0.113.5', 'a') !== ipHash('203.0.113.5', 'b') && ipHash('203.0.113.5', 'a') === ipHash('203.0.113.5', 'a'), 'Kontrollvärdet beror på den hemliga nyckeln');

const noIpStore = memoryStore();
for (let i = 0; i < 4; i++) await handle(req(), ENV, el.fetchImpl, noIpStore);
check(![...noIpStore.data.keys()].some((k) => k.startsWith('ip/')) && noIpStore.data.get(`gratis/${today}`) === '960', 'Utan IP-adress räknas bara taket för alla, så att ingen delar gräns med alla andra');
const headerStore = memoryStore();
await handle(new Request(`https://exempel.netlify.app/api/ai-start${SCENE_Q}`, { headers: { 'x-nf-client-connection-ip': '203.0.113.5' } }), ENV, el.fetchImpl, headerStore);
check(headerStore.data.get(ipKey) === '240', 'IP-adressen tas från Netlifys huvud när den inte finns i context');

// Gränserna hos Netlify för många anrop på kort tid.
check(startConfig.path === '/api/ai-start' && startConfig.rateLimit.windowLimit === 10 && startConfig.rateLimit.windowSize <= 180 && startConfig.rateLimit.aggregateBy.includes('ip'),
  'Hos Netlify: högst 10 starter i minuten från samma uppkoppling');
check(plusConfig.rateLimit.windowLimit === 30 && plusConfig.rateLimit.windowSize <= 180 && plusConfig.rateLimit.aggregateBy.includes('ip'), 'Hos Netlify: högst 30 Plus-anrop i minuten från samma uppkoppling');

// Plus: en giltig licenskod ger den bättre rösten och 60 minuter i månaden.
const { signToken } = await import('../netlify/lib/plus.mjs');
const now = Math.floor(Date.now() / 1000);
const plusToken = signToken({ plan: 'plus', sub: 'sub_123', cus: 'cus_1', start: now - 86400, exp: now + 3600 }, ENV.LICENSE_SECRET);
resetCache();
store = memoryStore();
el = fakeElevenLabs();
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
const createdPlus = el.calls.find((c) => c.url.endsWith('/agents/create'));
const month = new Date().toISOString().slice(0, 7);
check(data.plan === 'plus' && data.signed_url.includes('agent_plus') && createdPlus.body.conversation_config.tts.model_id === 'eleven_v4_turbo' && createdPlus.body.name.includes('-plus-sv-'),
  'Med Plus får man AI-motspelaren med den mer levande rösten');
check(data.max_seconds === 600 && store.data.get(`plus/sub_123/${month}`) === '600' && !store.data.has(ipKey), 'Ett Plus-samtal får upp till 10 minuter, från månadens 60, och räknas inte mot uppkopplingens gratisminuter');
await store.set(`plus/sub_123/${month}`, '3590');
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
check(res.status === 402 && (await res.json()).error === 'no_minutes', 'När Plus-minuterna är slut startar inget nytt samtal');
// Utan LICENSE_SECRET används nyckeln som Plus-funktionen har sparat i Netlify Blobs.
const { resetSecretCache } = await import('../netlify/lib/plus.mjs');
resetSecretCache();
const savedStore = memoryStore();
await savedStore.set('hemlis/licens', 'sparad-hemlis');
const savedToken = signToken({ plan: 'plus', sub: 'sub_9', cus: 'cus_9', start: now, exp: now + 3600 }, 'sparad-hemlis');
res = await handle(req(SCENE_Q, 'GET', savedToken), { ELEVENLABS_API_KEY: 'hemlig' }, fakeElevenLabs().fetchImpl, savedStore, IP);
check((await res.json()).plan === 'plus', 'AI-motspelaren känner igen Plus med den sparade nyckeln');
resetSecretCache();
const fake = signToken({ plan: 'plus', sub: 'sub_123', exp: now + 3600 }, 'fel-hemlis');
res = await handle(req(SCENE_Q, 'GET', fake), ENV, fakeElevenLabs().fetchImpl, memoryStore(), IP);
check((await res.json()).plan === 'gratis', 'En licenskod med fel underskrift ger inte Plus');

// Efter samtalet dras bara den tid som användes.
const { handle: end } = await import('../netlify/functions/ai-end.mjs');
await store.set(`plus/sub_123/${month}`, '0');
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
const endReq = (body) => new Request('https://exempel.netlify.app/api/ai-end', { method: 'POST', body: JSON.stringify(body) });
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_abc123' }), ENV, fakeElevenLabs({ duration: 41.2 }).fetchImpl, store);
const ended = await res.json();
check(ended.used_seconds === 42 && store.data.get(`plus/sub_123/${month}`) === '42', 'Efter samtalet räknas bara de 42 sekunder som användes');
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_abc123' }), ENV, fakeElevenLabs().fetchImpl, store);
check(res.status === 404, 'Samma samtal kan inte avslutas två gånger');
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_x' }), {}, fakeElevenLabs().fetchImpl, store);
check((await res.json()).used_seconds === 600, 'Om samtalets längd inte går att få räknas hela den reserverade tiden');

// Gratis: det som inte användes går tillbaka både till taket för alla och till uppkopplingens tak.
resetCache();
const freeStore = memoryStore();
const freeEl = fakeElevenLabs();
res = await handle(req(), ENV, freeEl.fetchImpl, freeStore, IP);
data = await res.json();
const gratisAgent = (await freeStore.get(`agent/${created.body.name}`));
const freeConv = async () => Response.json({ agent_id: gratisAgent, status: 'done', metadata: { call_duration_secs: 30, start_time_unix_secs: Math.floor(Date.now() / 1000) } });
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_gratis1' }), ENV, freeConv, freeStore, async () => {});
check((await res.json()).used_seconds === 30 && freeStore.data.get(`gratis/${today}`) === '30' && freeStore.data.get(ipKey) === '30',
  'Ett gratissamtal på 30 sekunder räknas som 30 sekunder, både för alla och för uppkopplingen');

// Precis efter samtalet kan ElevenLabs svara 404 en stund. Då frågar funktionen igen.
const noWait = async () => {};
let asks = 0;
const slow = async () => {
  asks += 1;
  if (asks < 3) return new Response('finns inte än', { status: 404 });
  return Response.json({ agent_id: 'agent_plus', status: 'done', metadata: { call_duration_secs: 75, start_time_unix_secs: Math.floor(Date.now() / 1000) } });
};
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_sen' }), ENV, slow, store, noWait);
check((await res.json()).used_seconds === 75 && asks === 3, 'Om ElevenLabs inte har samtalet än frågar funktionen igen');
const other = async () => Response.json({ agent_id: 'annan_agent', status: 'done', metadata: { call_duration_secs: 5 } });
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_annan' }), ENV, other, store, noWait);
check((await res.json()).used_seconds === data.max_seconds, 'Ett samtal med en annan AI-motspelare räknas inte');

// Ett gammalt kort samtal ger inte tillbaka tiden för ett nytt, långt samtal.
const early = async () => Response.json({ agent_id: 'agent_plus', status: 'done', metadata: { call_duration_secs: 5, start_time_unix_secs: Math.floor(Date.now() / 1000) - 3600 } });
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_gammalt' }), ENV, early, store, noWait);
check((await res.json()).used_seconds === data.max_seconds, 'Ett samtal som startade före reservationen räknas inte');
res = await handle(req(SCENE_Q, 'GET', plusToken), ENV, el.fetchImpl, store, IP);
data = await res.json();
res = await end(endReq({ reservation: data.reservation, conversation_id: 'conv_abc123' }), ENV, fakeElevenLabs({ duration: 3 }).fetchImpl, store);
check((await res.json()).used_seconds === data.max_seconds, 'Samma samtal kan bara räknas en gång');
const reservedEntry = JSON.parse([...store.data.entries()].find(([k]) => k.startsWith('reservation/'))?.[1] || 'null');
check(!reservedEntry || Number.isInteger(reservedEntry.created), 'Reservationen sparar när tiden reserverades');

resetCache();
el = fakeElevenLabs({ failSigned: true });
const errors = [];
const origError = console.error;
console.error = (m) => errors.push(String(m));
res = await handle(req(), ENV, el.fetchImpl, memoryStore(), IP);
console.error = origError;
data = await res.json();
check(res.status === 502 && data.error === 'start_failed', 'Om ElevenLabs säger nej får webbläsaren ett fel att visa');
check(errors.length === 1 && !errors[0].includes('hemlig'), 'Felet loggas utan nyckeln');

// ---- Gränserna städas bort ----
const sweepStore = memoryStore();
const at = new Date('2026-11-27T12:30:00Z');
await sweepStore.set('ip/2026-11-26/aaa', '300');
await sweepStore.set('ip/2026-11-27/bbb', '120');
await sweepStore.set('grans/2026-11-27T11/checkout/ccc', '3');
await sweepStore.set('grans/2026-11-27T12/checkout/ddd', '1');
await sweepStore.set('gratis/2026-11-26', '900');
await sweepStore.set('reservation/eee', '{}');
resetSweep();
const removed = await sweep(sweepStore, at);
check(removed === 2 && !sweepStore.data.has('ip/2026-11-26/aaa') && !sweepStore.data.has('grans/2026-11-27T11/checkout/ccc') &&
  sweepStore.data.has('ip/2026-11-27/bbb') && sweepStore.data.has('grans/2026-11-27T12/checkout/ddd') && sweepStore.data.has('gratis/2026-11-26') && sweepStore.data.has('reservation/eee'),
  'Räknarna från tidigare dygn och timmar tas bort, men inget annat');
check((await sweep(sweepStore, at)) === 0, 'Städningen körs högst en gång i timmen');
const { run: nightly, config: nightlyConfig } = await import('../netlify/functions/stada.mjs');
const nightStore = memoryStore();
await nightStore.set('ip/2026-11-26/aaa', '300');
await nightStore.set('ip/2026-11-27/bbb', '120');
const nightRemoved = await nightly(nightStore, new Date('2026-11-28T03:17:00Z'));
check(nightRemoved === 2 && nightStore.data.size === 0 && nightlyConfig.schedule === '17 3 * * *' && !('path' in nightlyConfig),
  'Varje natt tas gårdagens räknare bort, även om ingen har använt sidan');
const hourStore = memoryStore();
const tries = [];
for (let i = 0; i < 4; i++) tries.push(await allowHourly(hourStore, 'aterstall', 'xyz', 3, at));
check(JSON.stringify(tries) === JSON.stringify([true, true, true, false]), 'Timgränsen släpper igenom så många anrop som är tillåtet, sedan inga fler');
check(await allowHourly(hourStore, 'aterstall', 'xyz', 3, new Date('2026-11-27T13:00:00Z')), 'Nästa timme börjar räkningen om');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för AI-motspelaren gick igenom.');
