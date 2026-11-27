// Dagar i rad: hur många dagar i följd användaren har övat. En dag räknas när man har gjort
// en tagning på minst MIN_TAKE_SECONDS sekunder eller hela uppvärmningen.
//
// Allt sparas bara i mobilens localStorage (STREAK_KEY), som datum utan klockslag:
// { v: 1, dagar: ['2026-11-26', '2026-11-27'], rad: { till: '2026-11-27', langd: 2 }, rekord: 2 }.
// dagar är de senaste dagarna man övade (för veckan på hemskärmen), rad är den senaste raden
// hur lång den än är, och rekord den längsta. Inget skickas någonstans. Datumen är mobilens
// egna, så en dag börjar och slutar vid midnatt där användaren är.

export const STREAK_KEY = 'ovningsdagar';
export const MIN_TAKE_SECONDS = 10;
const KEEP_DAYS = 70; // så många dagar bakåt som sparas i listan

const pad = (n) => String(n).padStart(2, '0');

// Datumet i mobilens tidszon, som 2026-11-27.
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Ett datum som Date mitt på dagen i mobilens tidszon, så att sommartid inte flyttar det.
function dateOf(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(day, n) {
  const date = dateOf(day);
  date.setDate(date.getDate() + n);
  return localDay(date);
}

const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isCount = (x) => Number.isInteger(x) && x > 0;

// Hur många dagar i rad i listan som slutar med dagen end.
function runEndingAt(days, end) {
  const set = new Set(days);
  let n = 0;
  let day = end;
  while (set.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

export function readDays(raw) {
  let data = null;
  try { data = JSON.parse(raw || 'null'); } catch { data = null; }
  if (!data || data.v !== 1 || !Array.isArray(data.dagar)) return { v: 1, dagar: [], rad: null, rekord: 0 };
  const dagar = [...new Set(data.dagar.filter(isDay))].sort();
  const last = dagar[dagar.length - 1];
  let rad = data.rad && isDay(data.rad.till) && isCount(data.rad.langd) ? { till: data.rad.till, langd: data.rad.langd } : null;
  if (last && (!rad || rad.till < last)) rad = { till: last, langd: runEndingAt(dagar, last) }; // listan är nyare än raden
  const rekord = Math.max(isCount(data.rekord) ? data.rekord : 0, rad ? rad.langd : 0);
  return { v: 1, dagar, rad, rekord };
}

// Lägger till en dag. Ger { data, added }, där added säger om dagen var ny.
export function addDay(data, day) {
  if (!isDay(day) || data.dagar.includes(day)) return { data, added: false };
  const dagar = [...data.dagar, day].sort().filter((d) => d > addDays(day, -KEEP_DAYS));
  let rad = data.rad;
  if (!rad || day > rad.till) rad = { till: day, langd: rad && rad.till === addDays(day, -1) ? rad.langd + 1 : 1 };
  return { data: { v: 1, dagar, rad, rekord: Math.max(data.rekord, rad.langd) }, added: true };
}

// Läget i dag: { current, best, practicedToday, week: veckans sju dagar från måndag }.
// Raden lever hela dagen efter den senaste dagen man övade, och bryts först vid midnatt.
export function streakInfo(data, today) {
  const practicedToday = data.dagar.includes(today);
  const alive = data.rad && (data.rad.till === today || data.rad.till === addDays(today, -1));
  const current = alive ? data.rad.langd : 0;
  const best = Math.max(data.rekord, current);
  const weekday = (dateOf(today).getDay() + 6) % 7; // måndag = 0
  const monday = addDays(today, -weekday);
  const set = new Set(data.dagar);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    return { day, done: set.has(day), today: day === today, future: day > today };
  });
  return { current, best, practicedToday, week };
}
