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
