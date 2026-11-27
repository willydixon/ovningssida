// Tester för dagar i rad (public/streak.js): datumen, raden, rekordet och veckan.
// Körs i svensk tid, så att sommartiden också prövas.
// Körs med: node tests/streak.mjs

process.env.TZ = 'Europe/Stockholm';
const { STREAK_KEY, MIN_TAKE_SECONDS, localDay, addDays, readDays, addDay, streakInfo } = await import('../public/streak.js');

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

check(STREAK_KEY === 'ovningsdagar' && MIN_TAKE_SECONDS === 10, 'Dagarna sparas under ovningsdagar, och en tagning räknas från 10 sekunder');

// ---- Datumen ----
check(localDay(new Date(2026, 10, 27, 23, 59)) === '2026-11-27' && localDay(new Date(2026, 10, 28, 0, 1)) === '2026-11-28', 'Dagen byts vid midnatt i mobilens tid');
check(addDays('2026-11-30', 1) === '2026-12-01' && addDays('2026-12-31', 1) === '2027-01-01' && addDays('2026-03-01', -1) === '2026-02-28', 'Dagar räknas rätt över månader och år');
check(addDays('2026-03-28', 1) === '2026-03-29' && addDays('2026-03-29', 1) === '2026-03-30' && addDays('2026-10-25', -1) === '2026-10-24' && addDays('2026-10-24', 2) === '2026-10-26',
  'Sommartiden flyttar inga dagar, varken i mars eller i oktober');

// ---- Det sparade ----
const EMPTY = { v: 1, dagar: [], rad: null, rekord: 0 };
check(same(readDays(null), EMPTY) && same(readDays('inte json'), EMPTY) && same(readDays('{"v":2,"dagar":[]}'), EMPTY), 'Inget eller trasigt sparat ger en tom lista');
check(same(readDays(JSON.stringify({ v: 1, dagar: ['2026-11-27', 'fel', '2026-11-25', '2026-11-27', 7], rekord: 3 })),
  { v: 1, dagar: ['2026-11-25', '2026-11-27'], rad: { till: '2026-11-27', langd: 1 }, rekord: 3 }), 'Felaktiga och dubbla datum tas bort, datumen sorteras och raden räknas fram');
check(same(readDays(JSON.stringify({ v: 1, dagar: ['2026-11-26', '2026-11-27'], rad: { till: '2026-11-27', langd: 9 }, rekord: 4 })).rad, { till: '2026-11-27', langd: 9 }) &&
  readDays(JSON.stringify({ v: 1, dagar: ['2026-11-26', '2026-11-27'], rad: { till: '2026-11-27', langd: 9 }, rekord: 4 })).rekord === 9, 'En sparad rad gäller, och rekordet är minst lika långt');
check(readDays(JSON.stringify({ v: 1, dagar: [], rekord: -4 })).rekord === 0 && readDays(JSON.stringify({ v: 1, dagar: [], rekord: 2.5 })).rekord === 0, 'Ett konstigt rekord blir 0');

// ---- Lägga till en dag ----
let data = readDays(null);
let r = addDay(data, '2026-11-25');
check(r.added && same(r.data.dagar, ['2026-11-25']) && r.data.rekord === 1, 'En första dag ger rekordet 1');
r = addDay(r.data, '2026-11-25');
check(!r.added && same(r.data.dagar, ['2026-11-25']), 'Samma dag räknas bara en gång');
r = addDay(r.data, '2026-11-26');
r = addDay(r.data, '2026-11-27');
check(same(r.data.dagar, ['2026-11-25', '2026-11-26', '2026-11-27']) && r.data.rekord === 3, 'Tre dagar i följd ger rekordet 3');
r = addDay(r.data, '2026-11-29');
check(r.data.rekord === 3, 'En ny rad efter ett uppehåll ändrar inte rekordet');
check(!addDay(r.data, 'i dag').added, 'Bara riktiga datum läggs till');
let long = readDays(null);
for (let i = 0; i < 100; i++) long = addDay(long, addDays('2026-08-01', i)).data;
const lastLong = addDays('2026-08-01', 99);
check(long.dagar.length === 70 && long.dagar[0] === addDays('2026-08-01', 30) && long.rekord === 100 && streakInfo(long, lastLong).current === 100,
  'Bara de senaste 70 datumen sparas, men raden och rekordet räknas hela vägen (100 dagar)');
const reread = readDays(JSON.stringify(long));
check(streakInfo(reread, addDays(lastLong, 1)).current === 100 && reread.rekord === 100, 'Efter att mobilen har läst in det igen är det fortfarande 100 dagar i rad');

// ---- Läget i dag ----
const today = '2026-11-26'; // en torsdag
let info = streakInfo(readDays(null), today);
check(info.current === 0 && info.best === 0 && !info.practicedToday, 'Utan övning är det 0 dagar i rad');
const days = (...list) => readDays(JSON.stringify({ v: 1, dagar: list }));
info = streakInfo(days('2026-11-24', '2026-11-25'), today);
check(info.current === 2 && !info.practicedToday, 'Övat i förrgår och i går: 2 dagar i rad, och raden lever hela dagen i dag');
info = streakInfo(days('2026-11-24', '2026-11-25', '2026-11-26'), today);
check(info.current === 3 && info.practicedToday, 'Övat i dag också: 3 dagar i rad');
info = streakInfo(days('2026-11-23', '2026-11-24'), today);
check(info.current === 0, 'Inget i går och inget i dag: raden är bruten');
info = streakInfo(days('2026-11-26'), today);
check(info.current === 1 && info.practicedToday, 'Bara i dag: 1 dag i rad');
info = streakInfo(readDays(JSON.stringify({ v: 1, dagar: ['2026-11-25'], rekord: 6 })), today);
check(info.current === 1 && info.best === 6, 'Rekordet finns kvar när den nya raden är kortare');

info = streakInfo(days('2026-11-22', '2026-11-23', '2026-11-25'), today);
check(same(info.week.map((d) => d.day), ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']), 'Veckan går från måndag till söndag');
check(same(info.week.map((d) => d.done), [true, false, true, false, false, false, false]) && info.week[3].today && info.week.slice(4).every((d) => d.future) && !info.week[2].future,
  'Veckan visar vilka dagar man har övat, vilken dag det är i dag och vilka som kommer');
check(streakInfo(days(), '2026-11-29').week[0].day === '2026-11-23' && streakInfo(days(), '2026-11-30').week[0].day === '2026-11-30', 'En söndag hör till veckan som började i måndags, och en måndag börjar en ny');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för dagar i rad gick igenom.');
