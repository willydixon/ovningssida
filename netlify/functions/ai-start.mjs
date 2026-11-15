// Ger webbläsaren en tillfällig länk till AI-motspelaren hos ElevenLabs.
// Adress: /api/ai-start. Med ?check svarar den bara om AI-motspelaren finns.
//
// Nyckeln finns bara här på servern, som den hemliga miljövariabeln
// ELEVENLABS_API_KEY i Netlify. Utan nyckel är AI-motspelaren avstängd och sidan
// visar bara mobilens röst. Webbläsaren får en länk som gäller ett samtal, aldrig nyckeln.
//
// AI-motspelaren (en "agent" hos ElevenLabs) skapas första gången och hittas sedan
// på namnet. Ändras inställningarna nedan byts versionen i namnet, så skapas en ny.
// Scenen, rollen och första repliken skickar webbläsaren när samtalet startar.

const API = 'https://api.elevenlabs.io/v1/convai';
export const AGENT_NAME = 'ovningssida-motspelare-v1';

export function agentConfig() {
  return {
    name: AGENT_NAME,
    tags: ['ovningssida'],
    conversation_config: {
      agent: {
        first_message: '',
        language: 'sv',
        prompt: {
          prompt: 'Du är motspelare i en övningsapp för skådespelare. Scenen och din roll skickas när samtalet startar.',
          llm: 'gemini-2.5-flash'
        }
      },
      tts: { model_id: 'eleven_flash_v2_5' },
      turn: { turn_timeout: 10 },
      conversation: { max_duration_seconds: 240 } // en tagning är högst 3 minuter
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

let cachedAgentId = null;
export const resetCache = () => { cachedAgentId = null; };

async function call(fetchImpl, key, path, init = {}) {
  const res = await fetchImpl(`${API}${path}`, {
    ...init,
    headers: { 'xi-api-key': key, 'content-type': 'application/json' }
  });
  if (!res.ok) throw new Error(`ElevenLabs svarade ${res.status} på ${path.split('?')[0]}`);
  return res.json();
}

export async function findOrCreateAgent(fetchImpl, key) {
  if (cachedAgentId) return cachedAgentId;
  const list = await call(fetchImpl, key, `/agents?search=${encodeURIComponent(AGENT_NAME)}`);
  const found = (list.agents || []).find((agent) => agent.name === AGENT_NAME);
  if (found) {
    cachedAgentId = found.agent_id;
  } else {
    const created = await call(fetchImpl, key, '/agents/create', { method: 'POST', body: JSON.stringify(agentConfig()) });
    cachedAgentId = created.agent_id;
  }
  return cachedAgentId;
}

export async function handle(request, key = process.env.ELEVENLABS_API_KEY, fetchImpl = fetch) {
  const headers = { 'cache-control': 'no-store' };
  if (request.method !== 'GET') return new Response(null, { status: 405, headers });
  if (!key) return Response.json({ available: false }, { headers });
  if (new URL(request.url).searchParams.has('check')) return Response.json({ available: true }, { headers });
  try {
    const agentId = await findOrCreateAgent(fetchImpl, key);
    const data = await call(fetchImpl, key, `/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`);
    if (!data.signed_url) throw new Error('ElevenLabs gav ingen länk');
    return Response.json({ available: true, signed_url: data.signed_url }, { headers });
  } catch (err) {
    console.error(String(err && err.message ? err.message : err)); // aldrig nyckeln
    return Response.json({ available: true, error: 'start_failed' }, { status: 502, headers });
  }
}

export default (request) => handle(request);
export const config = { path: '/api/ai-start' };
