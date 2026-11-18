// Ger webbläsaren en tillfällig länk till AI-motspelaren hos ElevenLabs.
// Adress: /api/ai-start. Med ?check svarar den bara om AI-motspelaren finns.
//
// Nyckeln finns bara här på servern, som den hemliga miljövariabeln
// ELEVENLABS_API_KEY i Netlify. Utan nyckel är AI-motspelaren avstängd och sidan
// visar bara mobilens röst. Webbläsaren får en länk som gäller ett samtal, aldrig nyckeln.
//
// Två AI-motspelare skapas hos ElevenLabs första gången och hittas sedan på namnet:
// en för gratis (snabb röst) och en för Plus (mer levande röst, längre samtal).
// Ändras inställningarna byts versionen i namnet, så skapas nya.
//
// Minuterna: Plus har 60 minuter i månaden per prenumeration. Gratis har 5 minuter att
// prova, som räknas i mobilen, och alla gratisanvändare delar på ett tak per dygn.
// När ett samtal startar reserveras tid. /api/ai-end drar sedan det som användes.

import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { PLAN, MAX_AI_CONVERSATION, json, readToken, bearer, readSeconds, addSeconds, monthKey, dayKey, freeDailySeconds } from '../lib/plus.mjs';

const API = 'https://api.elevenlabs.io/v1/convai';
export const AGENT_NAMES = { gratis: 'ovningssida-motspelare-v1', plus: 'ovningssida-motspelare-plus-v1' };
export const AGENT_NAME = AGENT_NAMES.gratis;

export function agentConfig(plan = 'gratis') {
  return {
    name: AGENT_NAMES[plan],
    tags: ['ovningssida', plan],
    conversation_config: {
      agent: {
        first_message: '',
        language: 'sv',
        prompt: {
          prompt: 'Du är motspelare i en övningsapp för skådespelare. Scenen och din roll skickas när samtalet startar.',
          llm: 'gemini-2.5-flash'
        }
      },
      // Plus får ElevenLabs mest uttrycksfulla röst för samtal, gratis den billigare snabba.
      tts: { model_id: plan === 'plus' ? 'eleven_v4_turbo' : 'eleven_flash_v2_5' },
      turn: { turn_timeout: 10 },
      conversation: { max_duration_seconds: MAX_AI_CONVERSATION[plan] }
    },
    platform_settings: {
      auth: { enable_auth: true }, // samtal kräver en länk från den här funktionen
      overrides: {
        conversation_config_override: {
          agent: { prompt: { prompt: true }, first_message: true, language: true },
          tts: { voice_id: true }
        }
      },
      privacy: { record_voice: false } // ElevenLabs sparar inte ljudet från samtalen
    }
  };
}

const cachedAgentIds = {};
export const resetCache = () => { for (const k of Object.keys(cachedAgentIds)) delete cachedAgentIds[k]; };

async function call(fetchImpl, key, path, init = {}) {
  const res = await fetchImpl(`${API}${path}`, {
    ...init,
    headers: { 'xi-api-key': key, 'content-type': 'application/json' }
  });
  if (!res.ok) throw new Error(`ElevenLabs svarade ${res.status} på ${path.split('?')[0]}`);
  return res.json();
}

export async function findOrCreateAgent(fetchImpl, key, plan = 'gratis') {
  if (cachedAgentIds[plan]) return cachedAgentIds[plan];
  const name = AGENT_NAMES[plan];
  const list = await call(fetchImpl, key, `/agents?search=${encodeURIComponent(name)}`);
  const found = (list.agents || []).find((agent) => agent.name === name);
  if (found) {
    cachedAgentIds[plan] = found.agent_id;
  } else {
    const created = await call(fetchImpl, key, '/agents/create', { method: 'POST', body: JSON.stringify(agentConfig(plan)) });
    cachedAgentIds[plan] = created.agent_id;
  }
  return cachedAgentIds[plan];
}

export async function handle(request, env = process.env, fetchImpl = fetch, store = null) {
  const key = env.ELEVENLABS_API_KEY;
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  if (!key) return json({ available: false });
  if (new URL(request.url).searchParams.has('check')) return json({ available: true });

  const blobs = store || getStore('ai-minuter');
  const license = readToken(bearer(request), env.LICENSE_SECRET);
  const plan = license && license.exp > Math.floor(Date.now() / 1000) ? 'plus' : 'gratis';

  // Hur mycket tid som får reserveras för samtalet.
  let counterKey;
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
    seconds = Math.min(MAX_AI_CONVERSATION.gratis, left);
  }

  try {
    const agentId = await findOrCreateAgent(fetchImpl, key, plan);
    const data = await call(fetchImpl, key, `/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`);
    if (!data.signed_url) throw new Error('ElevenLabs gav ingen länk');
    const reservation = randomUUID();
    await addSeconds(blobs, counterKey, seconds);
    await blobs.set(`reservation/${reservation}`, JSON.stringify({ counterKey, seconds, agentId, plan }));
    return json({ available: true, plan, signed_url: data.signed_url, max_seconds: seconds, reservation });
  } catch (err) {
    console.error(String(err && err.message ? err.message : err)); // aldrig nyckeln
    return json({ available: true, error: 'start_failed' }, 502);
  }
}

export default (request) => handle(request);
export const config = { path: '/api/ai-start' };
