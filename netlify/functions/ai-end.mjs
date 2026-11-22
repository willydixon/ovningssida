// Avslutar räkningen av ett samtal med AI-motspelaren. Adress: POST /api/ai-end
// med { reservation, conversation_id }.
//
// När samtalet startade reserverades tid. Här frågar funktionen ElevenLabs hur långt
// samtalet faktiskt blev och lämnar tillbaka resten. Precis när ett samtal har slutat kan
// ElevenLabs behöva några sekunder, så funktionen frågar upp till fyra gånger. Om ElevenLabs
// ändå inte svarar räknas hela den reserverade tiden, så att ingen kan få gratis minuter
// genom att skicka fel samtal.
//
// Samtalet måste höra till reservationen: samma AI-motspelare, startat efter att tiden
// reserverades och inom en kvart, och varje samtal kan bara räknas en gång. Annars skulle
// man kunna skicka ett gammalt kort samtal och få tillbaka tiden för ett långt.

import { getStore } from '@netlify/blobs';
import { json, addSeconds } from '../lib/plus.mjs';

const API = 'https://api.elevenlabs.io/v1/convai';

const RETRY_MS = [0, 1000, 2000, 3000];
const START_SKEW = 30; // sekunder som klockorna hos Netlify och ElevenLabs kan skilja
const START_WINDOW = 900; // länken till samtalet gäller i en kvart
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Samtalets längd och starttid hos ElevenLabs, eller null om det inte går att få.
async function conversationInfo(fetchImpl, key, conversation, agentId, wait) {
  for (const ms of RETRY_MS) {
    if (ms) await wait(ms);
    try {
      const res = await fetchImpl(`${API}/conversations/${conversation}`, { headers: { 'xi-api-key': key } });
      if (res.ok) {
        const data = await res.json();
        if (data.agent_id !== agentId) return null; // ett samtal med en annan AI-motspelare
        const meta = data.metadata || {};
        const secs = Number(meta.call_duration_secs);
        if (Number.isFinite(secs) && secs >= 0 && (secs > 0 || data.status === 'done')) {
          return { secs, start: Number(meta.start_time_unix_secs) };
        }
      } else if (res.status !== 404) {
        return null;
      }
    } catch (err) {
      console.error(String(err && err.message ? err.message : err));
    }
  }
  return null;
}

// Startade samtalet efter att tiden reserverades? Reservationer från före den här kontrollen saknar tid.
const startedInTime = (info, created) => !Number.isFinite(created) ||
  (Number.isFinite(info.start) && info.start >= created - START_SKEW && info.start <= created + START_WINDOW);

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
  if (env.ELEVENLABS_API_KEY && /^[A-Za-z0-9_-]{5,80}$/.test(conversation) && !(await blobs.get(`samtal/${conversation}`))) {
    const info = await conversationInfo(fetchImpl, env.ELEVENLABS_API_KEY, conversation, reservation.agentId, wait);
    if (info && startedInTime(info, Number(reservation.created))) {
      used = Math.min(reservation.seconds, Math.ceil(info.secs));
      await blobs.set(`samtal/${conversation}`, id); // samma samtal kan inte räknas igen
    }
  }
  await addSeconds(blobs, reservation.counterKey, used - reservation.seconds);
  return json({ used_seconds: used, plan: reservation.plan });
}

export default (request) => handle(request);
export const config = { path: '/api/ai-end' };
