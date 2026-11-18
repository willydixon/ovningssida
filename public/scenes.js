// Scenerna i testversionen. Alla är utkast som AI har hjälpt till att skriva.
// En kunnig person ska godkänna varje scen innan sidan öppnas för alla.
// Format: se fliken Byggspecifikation, avsnittet Scenformat. genre visas på kortet, och
// bild är namnet på bilden i public/img/, som tools/render-pages.mjs skapar.

export const SCENES = [
  {
    id: 'scen-001',
    titel: 'Nyckeln',
    genre: 'Drama',
    bild: 'kitchen',
    situation: 'Sam och Robin delar lägenhet. Det är sent på kvällen, och nyckeln till cykelförrådet är borta.',
    langd_sekunder: 90,
    // vill: vad rollen vill i scenen, visas för den som spelar rollen.
    // inre: rollens hemlighet och känsla, används när AI-motspelaren spelar rollen.
    roller: [
      { id: 'A', namn: 'Sam', vill: 'Få nyckeln och komma iväg, utan att behöva prata om Alex.', inre: 'Har inte sagt hela sanningen om Alex och skäms lite för det.' },
      { id: 'B', namn: 'Robin', vill: 'Få Sam att berätta sanningen om Alex innan nyckeln kommer fram.', inre: 'Har nyckeln i jackfickan hela tiden. Är sårad över att Sam ljuger, men vill inte visa det direkt.' }
    ],
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
    genre: 'Komedi',
    bild: 'cafe',
    situation: 'Noor söker jobb på ett kafé. Kim intervjuar och har bråttom.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Kim', vill: 'Hitta någon som klarar stress, på tio minuter.', inre: 'Har två sjuka i personalen och behöver någon desperat, men vill inte visa det.' },
      { id: 'B', namn: 'Noor', vill: 'Få jobbet, utan att låtsas vara någon annan.', inre: 'Behöver jobbet för att klara hyran. Nervös, men ärlig och lite rolig när hon slappnar av.' }
    ],
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
    genre: 'Drama',
    bild: 'dinner',
    situation: 'Syskonen Mika och Jo dukar inför mammas födelsedag. Mika har något att berätta.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Mika', vill: 'Berätta om Oslo för Jo innan mamma kommer, utan att förstöra kvällen.', inre: 'Har redan skrivit på kontraktet och är rädd att Jo ska känna sig lämnad.' },
      { id: 'B', namn: 'Jo', vill: 'Få reda på vad Mika döljer, och att kvällen blir fin för mamma.', inre: 'Har tagit hand om mamma mest och blir rädd att bli ensam med ansvaret.' }
    ],
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
  },
  {
    id: 'scen-004',
    titel: 'Samtalet klockan tre',
    genre: 'Thriller',
    bild: 'phone',
    situation: 'Klockan är tre på natten. Charlies mobil ringer, och på skärmen står Charlies eget nummer.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Charlie', vill: 'Ta reda på vem som ringer, utan att visa hur rädd du är.', inre: 'Är ensam hemma och har inte sovit ordentligt sedan syskonet Eli försvann efter ett bråk för ett år sedan. Har letat varje dag.' },
      { id: 'B', namn: 'Rösten', vill: 'Få Charlie att gå till fönstret innan samtalet tar slut.', inre: 'Är Charlies syskon Eli, som försvann för ett år sedan efter ett bråk. Ringer med ett nummer som ser ut som Charlies eget, så att Charlie inte ska lägga på. Är rädd att Charlie fortfarande är arg, och leker därför med mystiken lite för länge.' }
    ],
    repliker: [
      { roll: 'A', text: 'Hallå? Vem är det här?' },
      { roll: 'B', text: 'Du låter trött, Charlie. Har du inte sovit i natt heller?' },
      { roll: 'A', text: 'Hur vet du vad jag heter? Det står mitt eget nummer på skärmen.' },
      { roll: 'B', text: 'Jag vet. Annars hade du aldrig svarat.' },
      { roll: 'A', text: 'Det här är inte roligt. Säg vem du är, annars lägger jag på.' },
      { roll: 'B', text: 'Du står i köket. Lampan över spisen är tänd, och du har inte druckit ur teet.' },
      { roll: 'A', text: 'Du kan inte se mig. Gardinerna är fördragna.' },
      { roll: 'B', text: 'Inte den i köket. Den har du aldrig kunnat stänga ordentligt.' },
      { roll: 'A', text: 'Hur vet du det? Det vet bara…' },
      { roll: 'B', text: 'Bara en person till. Gå till fönstret, Charlie.' },
      { roll: 'A', text: 'Eli? Du har varit borta i ett år.' },
      { roll: 'B', text: 'Jag vet. Jag står under gatlampan. Får jag komma upp?' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-005',
    titel: 'Sista tåget',
    genre: 'Romantik',
    bild: 'train',
    situation: 'Sista tåget har precis gått. Juno och Billie står kvar på perrongen, och nästa tåg går om fem timmar.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Juno', vill: 'Få Billie att stanna och prata, utan att verka desperat.', inre: 'Missade tåget med flit för att slippa komma hem till en tom lägenhet. Blir rolig när hen är nervös.' },
      { id: 'B', namn: 'Billie', vill: 'Komma därifrån, fast något får dig att stanna kvar.', inre: 'Friade i kväll och fick nej. Har fortfarande ringen i handen och vill inte gråta inför en främling.' }
    ],
    repliker: [
      { roll: 'A', text: 'Var det där ditt tåg också?' },
      { roll: 'B', text: 'Det var mitt enda tåg. Nästa går halv sex.' },
      { roll: 'A', text: 'Då har vi fem timmar. Det är nästan två filmer.' },
      { roll: 'B', text: 'Jag tänkte mer på att leta efter en taxi.' },
      { roll: 'A', text: 'En taxi härifrån kostar mer än en månadshyra. Jag har kollat.' },
      { roll: 'B', text: 'Du låter som någon som missar det här tåget ofta.' },
      { roll: 'A', text: 'Bara när jag inte vill komma hem.' },
      { roll: 'B', text: 'Och i kväll ville du inte det?' },
      { roll: 'A', text: 'Nej. Vad har du i handen? Du har knutit näven sedan tåget gick.' },
      { roll: 'B', text: 'En ring. Den skulle ha suttit på någon annans finger nu.' },
      { roll: 'A', text: 'Då har vi båda något att inte åka hem till.' },
      { roll: 'B', text: 'Fem timmar, sa du? Okej. Berätta om den första filmen.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  }
];
