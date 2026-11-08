// Scenerna i testversionen. Alla är utkast som AI har hjälpt till att skriva.
// En kunnig person ska godkänna varje scen innan sidan öppnas för alla.
// Format: se fliken Byggspecifikation, avsnittet Scenformat.

export const SCENES = [
  {
    id: 'scen-001',
    titel: 'Nyckeln',
    situation: 'Sam och Robin delar lägenhet. Det är sent på kvällen, och nyckeln till cykelförrådet är borta.',
    langd_sekunder: 90,
    roller: [{ id: 'A', namn: 'Sam' }, { id: 'B', namn: 'Robin' }],
    repliker: [
      { roll: 'A', text: 'Har du sett nyckeln till förrådet? Den låg här i skålen.' },
      { roll: 'B', text: 'Jag har inte rört den. Jag har varit hemma hela dagen.' },
      { roll: 'A', text: 'Just det. Du har varit hemma hela dagen. Vem annars skulle ha flyttat den?' },
      { roll: 'B', text: 'Kanske du själv? Du tömde fickorna här i går.' },
      { roll: 'A', text: 'Jag tömmer alltid fickorna här. Det är därför skålen finns.' },
      { roll: 'B', text: 'Okej. Men varför behöver du cykeln nu? Klockan är elva.' },
      { roll: 'A', text: 'Jag lovade att hämta Alex vid stationen.' },
      { roll: 'B', text: 'Alex? Du sa att ni inte pratade längre.' },
      { roll: 'A', text: 'Vi gör inte det. Det är därför jag måste cykla dit.' },
      { roll: 'B', text: 'Nyckeln ligger i min jacka. Jag lånade den i morse.' },
      { roll: 'A', text: 'Och när tänkte du säga det?' },
      { roll: 'B', text: 'När du berättade sanningen om Alex.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-002',
    titel: 'Intervjun',
    situation: 'Noor söker jobb på ett kafé. Kim intervjuar och har bråttom.',
    langd_sekunder: 75,
    roller: [{ id: 'A', namn: 'Kim' }, { id: 'B', namn: 'Noor' }],
    repliker: [
      { roll: 'A', text: 'Noor? Sätt dig. Jag har tio minuter, så vi kör.' },
      { roll: 'B', text: 'Tack. Jag har mitt cv med mig, om du vill ha det.' },
      { roll: 'A', text: 'Jag har läst det. Varför vill du jobba här?' },
      { roll: 'B', text: 'Jag gillar att ha mycket att göra. Och jag gillar folk.' },
      { roll: 'A', text: 'Alla säger att de gillar folk. Berätta om en gång när du inte gjorde det.' },
      { roll: 'B', text: 'På mitt förra jobb skrek en kund åt mig för att kaffet var kallt.' },
      { roll: 'A', text: 'Och vad gjorde du?' },
      { roll: 'B', text: 'Jag gjorde ett nytt. Sedan gick jag ut och grät i fem minuter.' },
      { roll: 'A', text: 'Fem minuter. Inte sex?' },
      { roll: 'B', text: 'Jag tog tid. Rasten var slut.' },
      { roll: 'A', text: 'Kan du börja på måndag?' },
      { roll: 'B', text: 'Menar du allvar?' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-003',
    titel: 'Beskedet',
    situation: 'Syskonen Mika och Jo dukar inför mammas födelsedag. Mika har något att berätta.',
    langd_sekunder: 90,
    roller: [{ id: 'A', namn: 'Mika' }, { id: 'B', namn: 'Jo' }],
    repliker: [
      { roll: 'A', text: 'Kan du lägga servetterna? Mamma kommer om en kvart.' },
      { roll: 'B', text: 'Du har varit tyst hela dagen. Vad är det?' },
      { roll: 'A', text: 'Inget. Jag är bara trött.' },
      { roll: 'B', text: 'Du lägger gafflarna på fel sida. Det gör du bara när något är fel.' },
      { roll: 'A', text: 'Jag har fått jobbet i Oslo.' },
      { roll: 'B', text: 'Jobbet som du sa att du inte skulle söka?' },
      { roll: 'A', text: 'Jag sökte det ändå. Jag börjar i januari.' },
      { roll: 'B', text: 'Och du tänkte berätta det i kväll? På mammas födelsedag?' },
      { roll: 'A', text: 'Jag ville berätta det för dig först. Det är därför jag kom tidigt.' },
      { roll: 'B', text: 'Oslo är inte så långt bort.' },
      { roll: 'A', text: 'Fem timmar med tåg.' },
      { roll: 'B', text: 'Då får du ta tåget hem till nästa födelsedag också.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  }
];
