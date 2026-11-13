// Tester för räknaren och statistiken, utan Netlify. En lagring i minnet ersätter
// Netlify Blobs. Körs med: node tests/functions.mjs

import { handle as count, EVENTS } from '../netlify/functions/raknare.mjs';
import { handle as stats, summarize, keyMatches } from '../netlify/functions/statistik.mjs';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

function memoryStore() {
  const data = new Map();
  return {
    data,
    async set(key, value) { data.set(key, value); },
    async list() { return { blobs: [...data.keys()].map((key) => ({ key, etag: 'x' })), directories: [] }; }
  };
}

const store = memoryStore();
const day = new Date('2026-11-16T10:00:00Z');
const req = (q, method = 'GET') => new Request(`https://exempel.netlify.app/r${q}`, { method });

// ---- Räknaren ----
const pixel = await count(req('?e=pris_visning'), store, day, 'a');
check(pixel.status === 200 && pixel.headers.get('content-type') === 'image/gif', 'En visning svarar med en bild på 1 × 1 pixel');
check(pixel.headers.get('cache-control') === 'no-store', 'Svaret sparas inte i webbläsarens cache, så varje visning räknas');
check(!pixel.headers.has('set-cookie'), 'Räknaren sätter ingen kaka');
check(store.data.has('2026-11-16/pris_visning/a'), 'Visningen sparas per dag och händelse');

const click = await count(req('?e=pris_meddela&till=anmalan'), store, day, 'b');
check(click.status === 302 && click.headers.get('location') === '/anmalan.html?fran=pris', 'Klicket räknas och skickar vidare till anmälan');
check(store.data.has('2026-11-16/pris_meddela/b'), 'Klicket sparas');

await count(req('?e=hittepa'), store, day, 'c');
await count(req('?e=pris_visning', 'POST'), store, day, 'd');
check(store.data.size === 2, 'Okända händelser och andra metoder än GET räknas inte');

const elsewhere = await count(req('?e=pris_meddela&till=https://annan.example'), store, day, 'e');
check(elsewhere.status === 200, 'Räknaren skickar aldrig vidare till en adress utanför listan');

check([...store.data.keys()].every((k) => /^\d{4}-\d{2}-\d{2}\/[a-z_]+\/[\w-]+$/.test(k)) && [...store.data.values()].every((v) => v === '1'),
  'Varje post innehåller bara dag, händelse och ett slumpat id, ingen IP-adress');
check(EVENTS.size === 2, 'Bara två händelser kan räknas');

// ---- Statistiken ----
await count(req('?e=pris_visning'), store, new Date('2026-11-17T09:00:00Z'), 'f');
const summary = await summarize(store);
check(summary['2026-11-16'].pris_visning === 1 && summary['2026-11-16'].pris_meddela === 2 && summary['2026-11-17'].pris_visning === 1,
  'Statistiken räknar per dag och händelse');
const wrong = await stats(new Request('https://exempel.netlify.app/statistik?nyckel=fel'), store, 'ratt-nyckel-123');
check(wrong.status === 404, 'Fel nyckel ger 404');
const none = await stats(new Request('https://exempel.netlify.app/statistik?nyckel=x'), store, undefined);
check(none.status === 404, 'Utan nyckel i Netlify är statistiken avstängd');
const right = await stats(new Request('https://exempel.netlify.app/statistik?nyckel=ratt-nyckel-123'), store, 'ratt-nyckel-123');
check(right.status === 200 && (await right.json())['2026-11-17'].pris_visning === 1, 'Rätt nyckel ger antalen som JSON');
check(!keyMatches(undefined, 'abc') && !keyMatches('ab', 'abc') && keyMatches('abc', 'abc'), 'Nyckeln jämförs exakt');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla funktionstester gick igenom.');
