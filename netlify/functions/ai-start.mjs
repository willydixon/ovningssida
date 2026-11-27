// Ger webbläsaren en tillfällig länk till AI-motspelaren hos ElevenLabs.
// Adress: /api/ai-start?scene=<scenens id>&role=<din roll>&lang=<sv|en>.
// Med ?check svarar den bara om AI-motspelaren finns.
//
// Nyckeln finns bara här på servern, som den hemliga miljövariabeln
// ELEVENLABS_API_KEY i Netlify. Utan nyckel är AI-motspelaren avstängd och sidan
// visar bara mobilens röst. Webbläsaren får en länk som gäller ett samtal, aldrig nyckeln.
//
// Instruktionerna till AI:n byggs här från sidans egna scener (netlify/lib/setups.mjs).
// Varje scen, roll, språk och plan får en egen AI-motspelare hos ElevenLabs, med
// instruktionen, första repliken och språket inlagda, och ingenting får ändras från
// webbläsaren. AI-motspelaren skapas första gången den behövs och hittas sedan på namnet.
// Ändras scenen eller inställningarna får namnet en ny version, och den gamla tas bort.
//
// Minuterna: Plus har 60 minuter i månaden per prenumeration. Gratis har 5 minuter att
// prova, som räknas i mobilen, alla gratisanvändare delar på ett tak per dygn, och varje
// uppkoppling har ett eget tak per dygn (netlify/lib/limits.mjs). När ett samtal startar
// reserveras tid. /api/ai-end drar sedan det som användes.

import { getStore } from '@netlify/blobs';
import { randomUUID, createHash } from 'node:crypto';
import { PLAN, MAX_AI_CONVERSATION, json, readToken, bearer, readSeconds, addSeconds, monthKey, dayKey, freeDailySeconds, licenseSecret } from '../lib/plus.mjs';
import { setupFor } from '../lib/setups.mjs';
import { freeSecondsPerIp, clientIp, ipHash, ipDayKey, sweepLater } from '../lib/limits.mjs';

const API = 'https://api.elevenlabs.io/v1/convai';
export const AGENT_PREFIX = 'ovningssida-v2';

// Namnet utan version: samma för alla versioner av AI-motspelaren för en scen och roll.
export const agentStem = (plan, setup) => `${AGENT_PREFIX}-${plan}-${setup.language}-${setup.sceneId}-${setup.aiRole}`;

// AI-motspelaren för en scen och roll. Versionen i namnet räknas fram ur inställningarna.
export function agentConfig(plan, setup) {
  const config = {
    tags: ['ovningssida', plan, setup.language],
    conversation_config: {
      agent: {
        first_message: setup.firstMessage || '',
        language: setup.language,
        prompt: { prompt: setup.prompt, llm: 'gemini-2.5-flash' }
      },
      // Plus får ElevenLabs mest uttrycksfulla röst för samtal, gratis den billigare snabba.
      tts: { model_id: plan === 'plus' ? 'eleven_v4_turbo' : 'eleven_flash_v2_5' },
      turn: { turn_timeout: 10 },
      conversation: { max_duration_seconds: MAX_AI_CONVERSATION[plan] }
    },
    platform_settings: {
      auth: { enable_auth: true }, // samtal kräver en länk från den här funktionen
      // Inget får bytas ut från webbläsaren: instruktionen, första repliken, språket eller rösten.
      overrides: {
        conversation_config_override: {
          agent: { prompt: { prompt: false }, first_message: false, language: false },
          tts: { voice_id: false }
        }
      },
      privacy: { record_voice: false } // ElevenLabs sparar inte ljudet från samtalen
    }
  };
  const version = createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 10);
  return { name: `${agentStem(plan, setup)}-${version}`, ...config };
}

const cachedAgentIds = {};
export const resetCache = () => { for (const k of Object.keys(cachedAgentIds)) delete cachedAgentIds[k]; };

async function call(fetchImpl, key, path, init = {}) {
  const res = await fetchImpl(`${API}${path}`, {
    ...init,
    headers: { 'xi-api-key': key, 'content-type': 'application/json' }
  });
  if (!res.ok) throw new Error(`ElevenLabs svarade ${res.status} på ${path.split('?')[0]}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

// Tar bort äldre versioner av samma AI-motspelare, så att de inte blir liggande hos ElevenLabs.
async function removeOldVersions(fetchImpl, key, store, stem, keep) {
  const list = await call(fetchImpl, key, `/agents?search=${encodeURIComponent(stem)}`);
  for (const agent of (list && list.agents) || []) {
    if (typeof agent.name !== 'string' || !agent.name.startsWith(`${stem}-`) || agent.name === keep) continue;
    await call(fetchImpl, key, `/agents/${encodeURIComponent(agent.agent_id)}`, { method: 'DELETE' });
    await store.delete(`agent/${agent.name}`);
  }
}

// Ger AI-motspelaren för scenen och rollen: från minnet, från Netlify Blobs, från ElevenLabs
// på namnet, eller nyskapad.
export async function agentFor(fetchImpl, key, store, plan, setup) {
  const config = agentConfig(plan, setup);
  const { name } = config;
  if (cachedAgentIds[name]) return cachedAgentIds[name];
  let id = await store.get(`agent/${name}`);
  if (!id) {
    const list = await call(fetchImpl, key, `/agents?search=${encodeURIComponent(name)}`);
    const found = ((list && list.agents) || []).find((agent) => agent.name === name);
    if (found) {
      id = found.agent_id;
    } else {
      const created = await call(fetchImpl, key, '/agents/create', { method: 'POST', body: JSON.stringify(config) });
      if (!created || !created.agent_id) throw new Error('ElevenLabs gav ingen AI-motspelare');
      id = created.agent_id;
      await removeOldVersions(fetchImpl, key, store, agentStem(plan, setup), name)
        .catch((err) => console.error(`Gamla versioner togs inte bort: ${err && err.message ? err.message : err}`));
    }
    await store.set(`agent/${name}`, id);
  }
  cachedAgentIds[name] = id;
  return id;
}

// meta: { ip, waitUntil } från Netlify (context.ip och context.waitUntil).
export async function handle(request, env = process.env, fetchImpl = fetch, store = null, meta = {}) {
  const key = env.ELEVENLABS_API_KEY;
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  if (!key) return json({ available: false });
  const params = new URL(request.url).searchParams;
  if (params.has('check')) return json({ available: true });

  const setup = setupFor(params.get('scene') || '', params.get('role') || '', params.get('lang') || 'sv');
  if (!setup) return json({ available: true, error: 'bad_scene' }, 400);

  const blobs = store || getStore({ name: 'ai-minuter', consistency: 'strong' });
  const secret = await licenseSecret(env, blobs);
  const token = bearer(request);
  const license = token ? readToken(token, secret) : null;
  const plan = license && license.exp > Math.floor(Date.now() / 1000) ? 'plus' : 'gratis';

  // Hur mycket tid som får reserveras för samtalet.
  let counterKey;
  let ipKey = null;
  let seconds;
  if (plan === 'plus') {
    counterKey = `plus/${license.sub}/${monthKey()}`;
    const left = PLAN.plus.aiSeconds - (await readSeconds(blobs, counterKey));
    if (left < 15) return json({ available: true, plan, error: 'no_minutes' }, 402);
    seconds = Math.min(MAX_AI_CONVERSATION.plus, left);
  } else {
    counterKey = `gratis/${dayKey()}`;
    const left = freeDailySeconds() - (await readSeconds(blobs, counterKey));
    if (left < 15) return json({ available: true, plan, error: 'free_full' }, 503);
    let ipLeft = Infinity;
    const ip = clientIp(request, meta);
    if (ip) {
      ipKey = ipDayKey(ipHash(ip, secret));
      ipLeft = freeSecondsPerIp() - (await readSeconds(blobs, ipKey));
      if (ipLeft < 15) return json({ available: true, plan, error: 'ip_full' }, 429);
    }
    seconds = Math.min(MAX_AI_CONVERSATION.gratis, left, ipLeft);
  }

  try {
    const agentId = await agentFor(fetchImpl, key, blobs, plan, setup);
    const data = await call(fetchImpl, key, `/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`);
    if (!data || !data.signed_url) throw new Error('ElevenLabs gav ingen länk');
    const reservation = randomUUID();
    await addSeconds(blobs, counterKey, seconds);
    if (ipKey) await addSeconds(blobs, ipKey, seconds);
    await blobs.set(`reservation/${reservation}`, JSON.stringify({ counterKey, ipKey, seconds, agentId, plan, created: Math.floor(Date.now() / 1000) }));
    sweepLater(blobs, meta.waitUntil);
    return json({ available: true, plan, signed_url: data.signed_url, max_seconds: seconds, reservation });
  } catch (err) {
    console.error(String(err && err.message ? err.message : err)); // aldrig nyckeln
    return json({ available: true, error: 'start_failed' }, 502);
  }
}

export default (request, context = {}) =>
  handle(request, process.env, fetch, null, { ip: context.ip, waitUntil: context.waitUntil ? (p) => context.waitUntil(p) : null });

// Hos Netlify: högst 10 anrop per minut från samma uppkoppling.
export const config = {
  path: '/api/ai-start',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
