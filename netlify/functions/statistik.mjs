// Visar räknarens antal per dag och händelse, som JSON.
// Adress: /statistik?nyckel=<hemlig nyckel>. Nyckeln sätts som miljövariabeln
// STATISTIK_NYCKEL i Netlify. Utan rätt nyckel svarar sidan som om den inte fanns.

import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

export async function summarize(store) {
  const { blobs } = await store.list();
  const counts = {};
  for (const { key } of blobs) {
    const [day, event] = key.split('/');
    if (!day || !event) continue;
    counts[day] ??= {};
    counts[day][event] = (counts[day][event] || 0) + 1;
  }
  return counts;
}

export function keyMatches(given, expected) {
  if (!expected || typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function handle(request, store, expected = process.env.STATISTIK_NYCKEL) {
  const given = new URL(request.url).searchParams.get('nyckel');
  if (!keyMatches(given, expected)) return new Response('Hittades inte', { status: 404 });
  return Response.json(await summarize(store), { headers: { 'cache-control': 'no-store' } });
}

export default (request) => handle(request, getStore('raknare'));

export const config = { path: '/statistik' };
