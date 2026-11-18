// Mina tagningar: tagningar som användaren själv sparar i appen. De ligger i webbläsarens
// databas (IndexedDB) i mobilen och skickas aldrig någonstans. Gratis får 3 tagningar plats,
// med Plus finns ingen gräns utom utrymmet i mobilen.

export const FREE_TAKES = 3;
const DB_NAME = 'ovningssida';
const STORE = 'tagningar';

// Får en till tagning plats? Den som har fler sedan tidigare (till exempel efter Plus) får
// behålla dem, men kan inte spara fler gratis förrän det finns plats.
export const canSaveMore = (count, plan) => plan === 'plus' || count < FREE_TAKES;

export const takeId = (now = Date.now(), random = Math.random) => `t${now.toString(36)}${Math.floor(random() * 1e6).toString(36)}`;

let opening = null;

function openDb() {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, 1);
    } catch (err) {
      reject(err);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Databasen gick inte att öppna'));
    request.onblocked = () => reject(new Error('Databasen är upptagen'));
  });
}

function db() {
  if (!opening) opening = openDb().catch((err) => { opening = null; throw err; });
  return opening;
}

// Kör en del av databasen i en transaktion och ger svaret när transaktionen är klar,
// så att en sparad tagning verkligen finns på disken innan appen säger att den är sparad.
async function run(mode, work) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    let result;
    const request = work(tx.objectStore(STORE));
    if (request) request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('Fel i databasen'));
    tx.onabort = () => reject(tx.error || new Error('Avbrutet'));
  });
}

// Tagningarna utan själva videon, nyast först.
export async function listTakes() {
  const all = await run('readonly', (store) => store.getAll());
  return (all || []).map(({ video, ...meta }) => meta).sort((a, b) => b.skapad - a.skapad);
}

export const getTake = (id) => run('readonly', (store) => store.get(id));
export const addTake = (take) => run('readwrite', (store) => store.add(take));
export const deleteTake = (id) => run('readwrite', (store) => store.delete(id));
export const countTakes = () => run('readonly', (store) => store.count());

export const isQuotaError = (err) => !!err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err.message || '')));
