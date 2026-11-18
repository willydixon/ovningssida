// Innehåll till dagens utmaning, uppvärmningen och övningarna. Allt är utkast som William godkänner.
// Texterna till knappar och rubriker ligger i texts.js. Varje språk har sitt eget innehåll
// (SV och EN nedan), och sidans språk avgör vilket som används.

import { lang } from './texts.js';

// En utmaning per dag. Samma dag ger samma utmaning för alla.
const SV_CHALLENGES = [
  'Säg ”Jag har aldrig varit här förut” så att vi tror dig. Sedan så att vi inte gör det.',
  'Berätta vad du åt till frukost som om det var den bästa nyheten i ditt liv.',
  'Säg ”Det gör inget” tre gånger: när det inte gör något, när det gör ont och när du är arg.',
  'Be någon om förlåtelse utan att använda ordet förlåt.',
  'Hitta på väderleksrapporten för i morgon och läs den som om ni grälade.',
  'Säg ditt eget namn som på en fest, som på ett möte med polisen och som på en stor scen.',
  'Var tyst i tio sekunder och låt kameran se att du tänker på något du inte vill säga.',
  'Säg ”Har du ätit?” som en orolig förälder, som en stressad chef och som någon som är förälskad.',
  'Berätta om ett minne från skolan, men låt oss förstå mer än du säger.',
  'Säg ”Det här är inte mitt fel” och få oss att tvivla på dig.',
  'Läs en ingredienslista från något i köket som om den var en hemlighet.',
  'Säg ”Grattis” så att vi hör att du egentligen är avundsjuk.',
  'Få någon att ge dig den sista kakbiten, utan att be om den.',
  'Säg ”Vi ses i morgon” som om du vet att ni inte kommer att göra det.'
];

// Dagens utmaning utifrån datumet i mobilen.
export function challengeFor(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86400000);
  return CHALLENGES[day % CHALLENGES.length];
}

// Uppvärmningen: fyra korta steg utan kamera. sekunder ger en klocka att följa.
const SV_WARMUP = [
  {
    id: 'andas',
    titel: 'Andas',
    text: 'Andas in i fyra sekunder, håll andan i fyra och andas ut i sex. Gör det tre gånger.',
    sekunder: 42,
    andning: [['in', 4], ['hall', 4], ['ut', 6]]
  },
  {
    id: 'lappar',
    titel: 'Läppar och tunga',
    text: 'Låt läpparna fladdra som en motorbåt, brrr, i tio sekunder. Rulla sedan tungan runt tänderna, tio varv åt varje håll.',
    sekunder: 40
  },
  {
    id: 'tungvrickare',
    titel: 'Tungvrickare',
    text: 'Säg den tre gånger, lite snabbare varje gång. Tydligt går före snabbt.',
    lista: [
      'Sju sjösjuka sjömän sköttes av sju sköna sjuksköterskor på skeppet Shanghai.',
      'Packa pappas kappsäck.',
      'Barbros bror badar bara bastu.',
      'Sex laxar i en laxask.',
      'Kvistfritt kvastskaft.'
    ]
  },
  {
    id: 'rosten',
    titel: 'Rösten i rummet',
    text: 'Säg ”Hej, hur mår du?” först viskande, sedan till någon bredvid dig och sist till någon på andra sidan gatan. Låt rösten bära utan att skrika.',
    sekunder: 30
  }
];

// ---- En replik, fem sätt ----
// Samma replik fem gånger, på ett nytt sätt varje gång. Repliken och sätten slumpas.
const SV_FIVEWAYS_LINES = [
  'Jag visste att du skulle säga det.',
  'Var har du varit?',
  'Vi måste prata.',
  'Du kom.',
  'Det är okej.',
  'Ska vi gå?',
  'Det här är det bästa som har hänt mig.',
  'Jag har väntat på dig.'
];

const SV_FIVEWAYS_WAYS = [
  'Ironiskt', 'Argt', 'Förälskat', 'Rädd', 'Lycklig', 'Misstänksamt', 'Trött',
  'Avundsjukt', 'Som en hemlighet', 'Som en order', 'Sårat', 'Uttråkat', 'Förväntansfullt'
];

// Väljer n olika saker ur en lista. random kan bytas i testerna.
function pick(list, n, random) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

export function fiveWaysScene(texts, random = Math.random) {
  const [line] = pick(FIVEWAYS_LINES, 1, random);
  return {
    id: 'fem-satt',
    typ: 'guidad',
    titel: texts.title,
    situation: texts.situation,
    langd_sekunder: 90,
    roller: [{ id: 'A', namn: texts.you }],
    repliker: pick(FIVEWAYS_WAYS, 5, random).map((way, i) => ({ roll: 'A', text: line, etikett: `${i + 1}. ${way}` }))
  };
}

// ---- Monologer ----
// Varje monolog är delad i stycken. Den som spelar gör en kort paus mellan styckena,
// och då markeras nästa stycke. Alla är utkast.
const SV_MONOLOGUES = [
  {
    id: 'mon-brevet',
    titel: 'Brevet',
    genre: 'Drama',
    langd_sekunder: 75,
    text: 'Ett brev till en pappa som inte längre finns.',
    stycken: [
      'Pappa. Jag har skrivit det här brevet fyra gånger nu. Första gången var jag arg. Andra gången var jag ledsen. Tredje gången skrev jag bara om vädret, som vi alltid gjorde.',
      'Nu vet jag inte vad jag är. Jag vet bara att jag saknar att höra dig klaga på mina skor.',
      'Du sa alltid att jag skulle bli något stort. Jag blev inte det. Jag blev jag. Och jag tror att det hade räckt för dig, om jag hade frågat.',
      'Så nu frågar jag. Räcker det?'
    ]
  },
  {
    id: 'mon-uppkorningen',
    titel: 'Uppkörningen',
    genre: 'Komedi',
    langd_sekunder: 70,
    text: 'Fjärde uppkörningen. Det gick inte bra. Trafikinspektören har pennan i handen.',
    stycken: [
      'Nej, nej, vänta. Innan du skriver något. Jag vet att jag körde mot rött. Men det var gult när jag bestämde mig.',
      'Och rondellen, ja, jag åkte runt tre varv. Men det var för att visa att jag kan svänga. Åt båda hållen, om det behövs.',
      'Det här är fjärde gången. Min mamma har köpt en tårta. Det står ”Grattis till körkortet” på den. Med marsipan.',
      'Så jag föreslår så här: du ger mig körkortet, och jag lovar att aldrig köra. Aldrig. Jag ska bara ha det i plånboken och känna mig vuxen.'
    ]
  },
  {
    id: 'mon-nattskiftet',
    titel: 'Nattskiftet',
    genre: 'Drama',
    langd_sekunder: 75,
    text: 'En sjuksköterska pratar med en patient som sover.',
    stycken: [
      'Klockan är tre. Det är nu det är som tystast här. Bara du, jag och maskinen som piper när du drömmer.',
      'Jag vet inte om du hör mig. Doktorn säger att du inte gör det. Men doktorn går hem klockan fem.',
      'Din dotter ringde i kväll igen. Hon frågade om du hade ätit. Jag sa ja. Det var inte sant, men det var snällt.',
      'Så du får vakna nu. Inte för min skull. För att någon måste berätta för henne att jag ljög.'
    ]
  }
];

export function monologueScene(m, texts) {
  return {
    id: m.id,
    typ: 'guidad',
    titel: m.titel,
    situation: m.text,
    langd_sekunder: m.langd_sekunder,
    roller: [{ id: 'A', namn: texts.you }],
    repliker: m.stycken.map((text) => ({ roll: 'A', text, etikett: '' }))
  };
}

// ---- Improvisera med AI ----
// Ingen text. AI-motspelaren spelar karaktären och börjar med repliken forsta.
const SV_IMPROVS = [
  {
    id: 'imp-grannen',
    titel: 'Grannen',
    genre: 'Komedi',
    situation: 'Klockan är sju på morgonen. Du ringer på hos grannen för att klaga på oväsendet i natt. Grannen öppnar dörren.',
    du: { vill: 'Få grannen att lova att det blir tyst i natt.' },
    ai: { namn: 'Grannen', vill: 'Bli av med dig så fort som möjligt, utan att erkänna något.', inre: 'Hade fest i natt och har huvudvärk. Tycker att du är lite tråkig.', forsta: 'Ja? Vet du vad klockan är?' }
  },
  {
    id: 'imp-hissen',
    titel: 'Hissen',
    genre: 'Drama',
    situation: 'Hissen har fastnat mellan två våningar. Du och en främling väntar på hjälp.',
    du: { vill: 'Hålla dig lugn och få främlingen att prata.' },
    ai: { namn: 'Främlingen', vill: 'Komma ut innan ett viktigt möte om tjugo minuter.', inre: 'Är rädd för trånga utrymmen, men skäms över det.', forsta: 'Det här händer inte. Inte i dag.' }
  },
  {
    id: 'imp-bestallningen',
    titel: 'Fel beställning',
    genre: 'Komedi',
    situation: 'Du har fått fel mat för andra gången på samma restaurang. Servitören kommer tillbaka till bordet.',
    du: { vill: 'Få rätt mat, utan att bli den jobbiga gästen.' },
    ai: { namn: 'Servitören', vill: 'Få dig att äta det du har fått.', inre: 'Är ny på jobbet och har redan fått en varning i kväll.', forsta: 'Var allt till belåtenhet?' }
  },
  {
    id: 'imp-dejten',
    titel: 'Första dejten',
    genre: 'Romantik',
    situation: 'Ni ses för första gången efter att ha skrivit med varandra i en app. Ingen av er ser riktigt ut som på bilderna.',
    du: { vill: 'Ta reda på om det här är värt en andra dejt.' },
    ai: { namn: 'Dejten', vill: 'Göra ett gott intryck.', inre: 'Har ljugit om sitt jobb i appen och vet inte hur det ska komma fram.', forsta: 'Hej! Jag … känner du igen mig?' }
  },
  {
    id: 'imp-motet',
    titel: 'Mötet med chefen',
    genre: 'Thriller',
    situation: 'En kollega påstår att du har tagit pengar ur kassan. Chefen har kallat in dig till ett möte.',
    du: { vill: 'Visa att du är oskyldig.' },
    ai: { namn: 'Chefen', vill: 'Få ett erkännande innan dagen är slut.', inre: 'Har sett på kameran att det inte var du, men vill se hur du reagerar.', forsta: 'Stäng dörren efter dig. Sätt dig.' }
  }
];

export function improvScene(s, texts) {
  return {
    id: s.id,
    typ: 'improv',
    titel: s.titel,
    situation: s.situation,
    langd_sekunder: 120,
    roller: [
      { id: 'A', namn: texts.you, vill: s.du.vill },
      { id: 'B', namn: s.ai.namn, vill: s.ai.vill, inre: s.ai.inre, forsta: s.ai.forsta }
    ],
    repliker: []
  };
}

// ---- Engelska ----
// Samma innehåll på engelska. Tungvrickarna är engelska klassiker, eftersom svenska inte går att översätta.
const EN_CHALLENGES = [
  'Say “I have never been here before” so that we believe you. Then so that we don’t.',
  'Tell us what you had for breakfast as if it were the best news of your life.',
  'Say “It doesn’t matter” three times: when it doesn’t matter, when it hurts and when you are angry.',
  'Ask someone for forgiveness without using the word sorry.',
  'Make up tomorrow’s weather forecast and read it as if you were having an argument.',
  'Say your own name as at a party, as in an interview with the police and as on a big stage.',
  'Stay silent for ten seconds and let the camera see that you are thinking of something you don’t want to say.',
  'Say “Have you eaten?” as a worried parent, as a stressed boss and as someone in love.',
  'Tell us about a memory from school, but let us understand more than you say.',
  'Say “This is not my fault” and make us doubt you.',
  'Read the ingredients of something in the kitchen as if they were a secret.',
  'Say “Congratulations” so that we hear that you are actually jealous.',
  'Get someone to give you the last piece of cake, without asking for it.',
  'Say “See you tomorrow” as if you know that you won’t.'
];

const EN_WARMUP = [
  {
    id: 'andas',
    titel: 'Breathe',
    text: 'Breathe in for four seconds, hold your breath for four and breathe out for six. Do it three times.',
    sekunder: 42,
    andning: [['in', 4], ['hall', 4], ['ut', 6]]
  },
  {
    id: 'lappar',
    titel: 'Lips and tongue',
    text: 'Let your lips flutter like a motorboat, brrr, for ten seconds. Then roll your tongue around your teeth, ten times in each direction.',
    sekunder: 40
  },
  {
    id: 'tungvrickare',
    titel: 'Tongue twisters',
    text: 'Say it three times, a little faster each time. Clear comes before fast.',
    lista: [
      'Red lorry, yellow lorry.',
      'She sells seashells by the seashore.',
      'Unique New York, you know you need unique New York.',
      'Peter Piper picked a peck of pickled peppers.',
      'Six slick slim sycamore saplings.'
    ]
  },
  {
    id: 'rosten',
    titel: 'The voice in the room',
    text: 'Say “Hi, how are you?” first in a whisper, then to someone next to you and last to someone across the street. Let your voice carry without shouting.',
    sekunder: 30
  }
];

const EN_FIVEWAYS_LINES = [
  'I knew you would say that.',
  'Where have you been?',
  'We need to talk.',
  'You came.',
  'It’s okay.',
  'Shall we go?',
  'This is the best thing that has ever happened to me.',
  'I have been waiting for you.'
];

const EN_FIVEWAYS_WAYS = [
  'Ironically', 'Angrily', 'In love', 'Scared', 'Happily', 'Suspiciously', 'Tired',
  'Jealously', 'As a secret', 'As an order', 'Hurt', 'Bored', 'Expectantly'
];

const EN_MONOLOGUES = [
  {
    id: 'mon-brevet',
    titel: 'The Letter',
    genre: 'Drama',
    langd_sekunder: 75,
    text: 'A letter to a father who is no longer here.',
    stycken: [
      'Dad. I have written this letter four times now. The first time I was angry. The second time I was sad. The third time I only wrote about the weather, like we always did.',
      'Now I don’t know what I am. I only know that I miss hearing you complain about my shoes.',
      'You always said I would become something big. I didn’t. I became me. And I think that would have been enough for you, if I had asked.',
      'So now I’m asking. Is it enough?'
    ]
  },
  {
    id: 'mon-uppkorningen',
    titel: 'The Driving Test',
    genre: 'Comedy',
    langd_sekunder: 70,
    text: 'The fourth driving test. It did not go well. The examiner has the pen in hand.',
    stycken: [
      'No, no, wait. Before you write anything. I know I drove through a red light. But it was amber when I made up my mind.',
      'And the roundabout, yes, I went round three times. But that was to show that I can turn. Both ways, if needed.',
      'This is the fourth time. My mum has bought a cake. It says “Congratulations on your licence” on it. With marzipan.',
      'So here is my suggestion: you give me the licence, and I promise never to drive. Never. I’ll just keep it in my wallet and feel like a grown-up.'
    ]
  },
  {
    id: 'mon-nattskiftet',
    titel: 'The Night Shift',
    genre: 'Drama',
    langd_sekunder: 75,
    text: 'A nurse talks to a patient who is asleep.',
    stycken: [
      'It’s three o’clock. This is when it’s at its quietest here. Just you, me and the machine that beeps when you dream.',
      'I don’t know if you can hear me. The doctor says you can’t. But the doctor goes home at five.',
      'Your daughter called again tonight. She asked if you had eaten. I said yes. It wasn’t true, but it was kind.',
      'So you have to wake up now. Not for my sake. Because someone has to tell her that I lied.'
    ]
  }
];

const EN_IMPROVS = [
  {
    id: 'imp-grannen',
    titel: 'The Neighbour',
    genre: 'Comedy',
    situation: 'It is seven in the morning. You ring your neighbour’s doorbell to complain about last night’s noise. The neighbour opens the door.',
    du: { vill: 'Get the neighbour to promise that it will be quiet tonight.' },
    ai: { namn: 'The Neighbour', vill: 'Get rid of you as fast as possible, without admitting anything.', inre: 'Had a party last night and has a headache. Thinks you are a bit boring.', forsta: 'Yes? Do you know what time it is?' }
  },
  {
    id: 'imp-hissen',
    titel: 'The Lift',
    genre: 'Drama',
    situation: 'The lift is stuck between two floors. You and a stranger are waiting for help.',
    du: { vill: 'Stay calm and get the stranger to talk.' },
    ai: { namn: 'The Stranger', vill: 'Get out before an important meeting in twenty minutes.', inre: 'Is afraid of small spaces, but ashamed of it.', forsta: 'This isn’t happening. Not today.' }
  },
  {
    id: 'imp-bestallningen',
    titel: 'Wrong Order',
    genre: 'Comedy',
    situation: 'You have been given the wrong food for the second time at the same restaurant. The waiter comes back to the table.',
    du: { vill: 'Get the right food, without becoming the difficult guest.' },
    ai: { namn: 'The Waiter', vill: 'Get you to eat what you have been given.', inre: 'Is new at the job and has already had one warning tonight.', forsta: 'Was everything to your satisfaction?' }
  },
  {
    id: 'imp-dejten',
    titel: 'First Date',
    genre: 'Romance',
    situation: 'You are meeting for the first time after chatting in an app. Neither of you looks quite like the pictures.',
    du: { vill: 'Find out if this is worth a second date.' },
    ai: { namn: 'The Date', vill: 'Make a good impression.', inre: 'Lied about their job in the app and does not know how it will come out.', forsta: 'Hi! I… do you recognise me?' }
  },
  {
    id: 'imp-motet',
    titel: 'Meeting the Boss',
    genre: 'Thriller',
    situation: 'A colleague claims that you have taken money from the till. The boss has called you in to a meeting.',
    du: { vill: 'Show that you are innocent.' },
    ai: { namn: 'The Boss', vill: 'Get a confession before the end of the day.', inre: 'Has seen on camera that it was not you, but wants to see how you react.', forsta: 'Close the door behind you. Sit down.' }
  }
];

export const CONTENT = {
  sv: { challenges: SV_CHALLENGES, warmup: SV_WARMUP, fivewaysLines: SV_FIVEWAYS_LINES, fivewaysWays: SV_FIVEWAYS_WAYS, monologues: SV_MONOLOGUES, improvs: SV_IMPROVS },
  en: { challenges: EN_CHALLENGES, warmup: EN_WARMUP, fivewaysLines: EN_FIVEWAYS_LINES, fivewaysWays: EN_FIVEWAYS_WAYS, monologues: EN_MONOLOGUES, improvs: EN_IMPROVS }
};

const current = CONTENT[lang()] || CONTENT.sv;
export const CHALLENGES = current.challenges;
export const WARMUP = current.warmup;
export const FIVEWAYS_LINES = current.fivewaysLines;
export const FIVEWAYS_WAYS = current.fivewaysWays;
export const MONOLOGUES = current.monologues;
export const IMPROVS = current.improvs;
