// Räknaren för grindarna: hur många som öppnar prissidan och trycker på Meddela mig.
// Adress: /r?e=<händelse>, och &till=anmalan för att skicka vidare efter klicket.
//
// Inga kakor och ingen IP-adress sparas. Varje träff blir en egen tom post i
// Netlify Blobs med nyckeln dag/händelse/slumpat-id, så att två samtidiga träffar
// aldrig skriver över varandra. Statistiken räknar posterna (se statistik.mjs).

import { getStore } from '@netlify/blobs';

export const EVENTS = new Set(['pris_visning', 'pris_meddela']);
export const TARGETS = { anmalan: '/anmalan.html?fran=pris' };

// En genomskinlig gif på 1 × 1 pixel, för träffar via <img>.
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0));
const NO_CACHE = { 'cache-control': 'no-store' };

export async function handle(request, store, now = new Date(), id = crypto.randomUUID()) {
  const url = new URL(request.url);
  const event = url.searchParams.get('e');
  if (request.method === 'GET' && EVENTS.has(event)) {
    const day = now.toISOString().slice(0, 10);
    await store.set(`${day}/${event}/${id}`, '1');
  }
  const target = TARGETS[url.searchParams.get('till')];
  if (target) return new Response(null, { status: 302, headers: { ...NO_CACHE, location: target } });
  return new Response(PIXEL, { headers: { ...NO_CACHE, 'content-type': 'image/gif' } });
}

export default (request) => handle(request, getStore('raknare'));

export const config = { path: '/r' };
