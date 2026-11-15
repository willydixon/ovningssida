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
const aiFirst = buildAiSetup(scene, b.id);
check(aiFirst.firstMessage === scene.repliker[0].text && aiFirst.aiName === a.namn, 'När AI:ns roll börjar säger AI:n första repliken');

// ---- Netlify-funktionen ----
function fakeElevenLabs({ agents = [], failSigned = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : null });
    const path = new URL(url).pathname;
    if (path.endsWith('/agents') ) return Response.json({ agents, has_more: false });
    if (path.endsWith('/agents/create')) return Response.json({ agent_id: 'agent_ny' });
    if (path.endsWith('/conversation/get-signed-url')) {
      if (failSigned) return new Response('nej', { status: 401 });
      return Response.json({ signed_url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${new URL(url).searchParams.get('agent_id')}&token=abc` });
    }
    return new Response('okänd', { status: 404 });
  };
  return { fetchImpl, calls };
}
const req = (q = '', method = 'GET') => new Request(`https://exempel.netlify.app/api/ai-start${q}`, { method });

let res = await handle(req('?check=1'), undefined, fakeElevenLabs().fetchImpl);
check((await res.json()).available === false, 'Utan nyckel i Netlify är AI-motspelaren avstängd');
res = await handle(req('?check=1'), 'hemlig', fakeElevenLabs().fetchImpl);
check((await res.json()).available === true && res.headers.get('cache-control') === 'no-store', 'Med nyckel svarar funktionen att AI-motspelaren finns');
res = await handle(req('', 'POST'), 'hemlig', fakeElevenLabs().fetchImpl);
check(res.status === 405, 'Funktionen tar bara emot GET');

resetCache();
let el = fakeElevenLabs();
res = await handle(req(), 'hemlig', el.fetchImpl);
let data = await res.json();
const created = el.calls.find((c) => c.url.endsWith('/agents/create'));
check(res.status === 200 && data.signed_url.includes('agent_id=agent_ny'), 'Första gången skapas AI-motspelaren och webbläsaren får en länk');
check(!JSON.stringify(data).includes('hemlig'), 'Webbläsaren får aldrig nyckeln');
check(el.calls.every((c) => c.headers['xi-api-key'] === 'hemlig'), 'Nyckeln skickas bara till ElevenLabs');
check(created && created.body.name === AGENT_NAME && created.body.conversation_config.agent.language === 'sv', 'AI-motspelaren pratar svenska');
check(created && created.body.platform_settings.auth.enable_auth === true, 'Samtal kräver en länk från funktionen');
check(created && created.body.platform_settings.privacy.record_voice === false, 'ElevenLabs ska inte spara ljudet från samtalen');
check(created && created.body.conversation_config.conversation.max_duration_seconds <= 240, 'Ett samtal är högst 4 minuter');
const overrides = agentConfig().platform_settings.overrides.conversation_config_override.agent;
check(overrides.prompt.prompt && overrides.first_message && overrides.language, 'Scenen, första repliken och språket kan skickas med varje samtal');

el = fakeElevenLabs();
await handle(req(), 'hemlig', el.fetchImpl);
check(el.calls.length === 1 && el.calls[0].url.includes('get-signed-url'), 'Nästa gång återanvänds AI-motspelaren');

resetCache();
el = fakeElevenLabs({ agents: [{ agent_id: 'agent_finns', name: AGENT_NAME }, { agent_id: 'annan', name: 'något annat' }] });
res = await handle(req(), 'hemlig', el.fetchImpl);
data = await res.json();
check(data.signed_url.includes('agent_id=agent_finns') && !el.calls.some((c) => c.url.endsWith('/agents/create')), 'En AI-motspelare som redan finns hittas på namnet');

resetCache();
el = fakeElevenLabs({ failSigned: true });
const errors = [];
const origError = console.error;
console.error = (m) => errors.push(String(m));
res = await handle(req(), 'hemlig', el.fetchImpl);
console.error = origError;
data = await res.json();
check(res.status === 502 && data.error === 'start_failed', 'Om ElevenLabs säger nej får webbläsaren ett fel att visa');
check(errors.length === 1 && !errors[0].includes('hemlig'), 'Felet loggas utan nyckeln');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för AI-motspelaren gick igenom.');
