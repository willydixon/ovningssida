// Innehåll till dagens utmaning och uppvärmningen. Allt är utkast som William godkänner.
// Texterna till knappar och rubriker ligger i texts.js.

// En utmaning per dag. Samma dag ger samma utmaning för alla.
export const CHALLENGES = [
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
export const WARMUP = [
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
export const FIVEWAYS_LINES = [
  'Jag visste att du skulle säga det.',
  'Var har du varit?',
  'Vi måste prata.',
  'Du kom.',
  'Det är okej.',
  'Ska vi gå?',
  'Det här är det bästa som har hänt mig.',
  'Jag har väntat på dig.'
];

export const FIVEWAYS_WAYS = [
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
export const MONOLOGUES = [
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
export const IMPROVS = [
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
