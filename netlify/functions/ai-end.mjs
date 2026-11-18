// Avslutar räkningen av ett samtal med AI-motspelaren. Adress: POST /api/ai-end
// med { reservation, conversation_id }.
//
// När samtalet startade reserverades tid. Här frågar funktionen ElevenLabs hur långt
// samtalet faktiskt blev och lämnar tillbaka resten. Precis när ett samtal har slutat kan
// ElevenLabs behöva några sekunder, så funktionen frågar upp till fyra gånger. Om ElevenLabs
// ändå inte svarar räknas hela den reserverade tiden, så att ingen kan få gratis minuter
// genom att skicka fel samtal.

import { getStore } from '@netlify/blobs';
import { json, addSeconds } from '../lib/plus.mjs';

const API = 'https://api.elevenlabs.io/v1/convai';

const RETRY_MS = [0, 1000, 2000, 3000];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function duration(fetchImpl, key, conversation, agentId, wait) {
  for (const ms of RETRY_MS) {
    if (ms) await wait(ms);
    try {
      const res = await fetchImpl(`${API}/conversations/${conversation}`, { headers: { 'xi-api-key': key } });
      if (res.ok) {
        const data = await res.json();
        if (data.agent_id !== agentId) return NaN; // ett annat samtal än det som startades
        const secs = data.metadata ? Number(data.metadata.call_duration_secs) : NaN;
        if (Number.isFinite(secs) && secs >= 0 && (secs > 0 || data.status === 'done')) return secs;
      } else if (res.status !== 404) {
        return NaN;
      }
    } catch (err) {
      console.error(String(err && err.message ? err.message : err));
    }
  }
  return NaN;
}

export async function handle(request, env = process.env, fetchImpl = fetch, store = null, wait = sleep) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await request.json().catch(() => ({}));
  const id = typeof body.reservation === 'string' ? body.reservation : '';
  const conversation = typeof body.conversation_id === 'string' ? body.conversation_id : '';
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_reservation' }, 400);

  const blobs = store || getStore('ai-minuter');
  const raw = await blobs.get(`reservation/${id}`);
  if (!raw) return json({ error: 'unknown_reservation' }, 404);
  const reservation = JSON.parse(raw);
  await blobs.delete(`reservation/${id}`);

  let used = reservation.seconds;
  if (env.ELEVENLABS_API_KEY && /^[A-Za-z0-9_-]{5,80}$/.test(conversation)) {
    const secs = await duration(fetchImpl, env.ELEVENLABS_API_KEY, conversation, reservation.agentId, wait);
    if (Number.isFinite(secs)) used = Math.min(reservation.seconds, Math.ceil(secs));
  }
  await addSeconds(blobs, reservation.counterKey, used - reservation.seconds);
  return json({ used_seconds: used, plan: reservation.plan });
}

export default (request) => handle(request);
export const config = { path: '/api/ai-end' };
