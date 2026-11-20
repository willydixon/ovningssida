// Scenerna i testversionen. Alla är utkast som AI har hjälpt till att skriva.
// En kunnig person ska godkänna varje scen innan sidan öppnas för alla.
// Format: se fliken Byggspecifikation, avsnittet Scenformat. genre visas på kortet, och
// bild är namnet på bilden i public/img/, som tools/render-pages.mjs skapar.
// niva är scenens nivå (se LEVELS_BY_LANG längst ned). Varje roll har en typ, som visas i
// betyget (till exempel skurken), och ett krav (kraver), som är en av förinställningarna i
// rating.js och säger vad rollen kräver av röst och ansikte. Hjältar, skurkar och andra
// figurer är påhittade och liknar inte några kända figurer.

import { lang } from './texts.js';

const SV = [
  {
    id: 'scen-001',
    titel: 'Nyckeln',
    genre: 'Drama',
    niva: 1,
    bild: 'kitchen',
    situation: 'Sam och Robin delar lägenhet. Det är sent på kvällen, och nyckeln till cykelförrådet är borta.',
    langd_sekunder: 90,
    // vill: vad rollen vill i scenen, visas för den som spelar rollen.
    // inre: rollens hemlighet och känsla, används när AI-motspelaren spelar rollen.
    roller: [
      { id: 'A', namn: 'Sam', typ: 'den undvikande', kraver: 'vardag', vill: 'Få nyckeln och komma iväg, utan att behöva prata om Alex.', inre: 'Har inte sagt hela sanningen om Alex och skäms lite för det.' },
      { id: 'B', namn: 'Robin', typ: 'den sårade', kraver: 'kontroll', vill: 'Få Sam att berätta sanningen om Alex innan nyckeln kommer fram.', inre: 'Har nyckeln i jackfickan hela tiden. Är sårad över att Sam ljuger, men vill inte visa det direkt.' }
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
    niva: 1,
    bild: 'cafe',
    situation: 'Noor söker jobb på ett kafé. Kim intervjuar och har bråttom.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Kim', typ: 'den stressade chefen', kraver: 'desperat', vill: 'Hitta någon som klarar stress, på tio minuter.', inre: 'Har två sjuka i personalen och behöver någon desperat, men vill inte visa det.' },
      { id: 'B', namn: 'Noor', typ: 'den nervösa', kraver: 'komisk', vill: 'Få jobbet, utan att låtsas vara någon annan.', inre: 'Behöver jobbet för att klara hyran. Nervös, men ärlig och lite rolig när hon slappnar av.' }
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
    niva: 1,
    bild: 'dinner',
    situation: 'Syskonen Mika och Jo dukar inför mammas födelsedag. Mika har något att berätta.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Mika', typ: 'den som lämnar', kraver: 'lugn', vill: 'Berätta om Oslo för Jo innan mamma kommer, utan att förstöra kvällen.', inre: 'Har redan skrivit på kontraktet och är rädd att Jo ska känna sig lämnad.' },
      { id: 'B', namn: 'Jo', typ: 'den som blir kvar', kraver: 'sarbar', vill: 'Få reda på vad Mika döljer, och att kvällen blir fin för mamma.', inre: 'Har tagit hand om mamma mest och blir rädd att bli ensam med ansvaret.' }
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
    niva: 1,
    bild: 'phone',
    situation: 'Klockan är tre på natten. Charlies mobil ringer, och på skärmen står Charlies eget nummer.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Charlie', typ: 'den rädda', kraver: 'kontroll', vill: 'Ta reda på vem som ringer, utan att visa hur rädd du är.', inre: 'Är ensam hemma och har inte sovit ordentligt sedan syskonet Eli försvann efter ett bråk för ett år sedan. Har letat varje dag.' },
      { id: 'B', namn: 'Rösten', typ: 'den gåtfulla', kraver: 'gatfull', vill: 'Få Charlie att gå till fönstret innan samtalet tar slut.', inre: 'Är Charlies syskon Eli, som försvann för ett år sedan efter ett bråk. Ringer med ett nummer som ser ut som Charlies eget, så att Charlie inte ska lägga på. Är rädd att Charlie fortfarande är arg, och leker därför med mystiken lite för länge.' }
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
    niva: 1,
    bild: 'train',
    situation: 'Sista tåget har precis gått. Juno och Billie står kvar på perrongen, och nästa tåg går om fem timmar.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Juno', typ: 'den hoppfulla', kraver: 'komisk', vill: 'Få Billie att stanna och prata, utan att verka desperat.', inre: 'Missade tåget med flit för att slippa komma hem till en tom lägenhet. Blir rolig när hen är nervös.' },
      { id: 'B', namn: 'Billie', typ: 'den krossade', kraver: 'sarbar', vill: 'Komma därifrån, fast något får dig att stanna kvar.', inre: 'Friade i kväll och fick nej. Har fortfarande ringen i handen och vill inte gråta inför en främling.' }
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
  },
  // ---- Nivå 2: Thriller, deckare och skräck ----
  {
    id: 'scen-006',
    titel: 'Förhöret',
    genre: 'Deckare',
    niva: 2,
    bild: 'interrogation',
    situation: 'En målning har stulits från museet där Ari är nattvakt. Utredaren Vega har tagit in Ari på förhör.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Vega', typ: 'utredaren', kraver: 'kontroll', vill: 'Få Ari att berätta vem som var i museet, innan advokaten kommer.', inre: 'Har bara en suddig bild från en kamera och bluffar om att veta mer. Tror att Ari skyddar någon.' },
      { id: 'B', namn: 'Ari', typ: 'den misstänkta', kraver: 'sarbar', vill: 'Komma därifrån utan att säga något om din lillebror.', inre: 'Släppte in sin lillebror i museet den natten för att visa honom tavlorna, och vet inte vad han gjorde medan Ari gick sin runda.' }
    ],
    repliker: [
      { roll: 'A', text: 'Du jobbade natt i torsdags. Ensam.' },
      { roll: 'B', text: 'Som varje torsdag. Det står i schemat.' },
      { roll: 'A', text: 'Kameran i östra salen slocknade kvart över två. I sju minuter.' },
      { roll: 'B', text: 'Kamerorna slocknar hela tiden. Jag har anmält det tre gånger.' },
      { roll: 'A', text: 'Och ändå var du på väg dit precis när den slocknade.' },
      { roll: 'B', text: 'Jag gick min runda. Det är mitt jobb.' },
      { roll: 'A', text: 'Din runda går åt andra hållet klockan två. Jag har också läst schemat.' },
      { roll: 'B', text: 'Vill du att jag ska erkänna något jag inte har gjort?' },
      { roll: 'A', text: 'Jag vill att du berättar vem du öppnade dörren för.' },
      { roll: 'B', text: 'Jag vill prata med en advokat nu.' },
      { roll: 'A', text: 'Det får du. Men en advokat kan inte skydda den du skyddar.' },
      { roll: 'B', text: 'Jag skyddar ingen. Det har jag aldrig gjort.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-007',
    titel: 'Huset vid sjön',
    genre: 'Skräck',
    niva: 2,
    bild: 'cabin',
    situation: 'Syskonen Jules och Noa ska sälja farfars gamla hus vid sjön. Det är natt, strömmen har gått, och något knackar i källaren.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Jules', typ: 'den som minns', kraver: 'sarbar', vill: 'Få Noa att erkänna att hen också hör knackningarna.', inre: 'Hörde samma knackningar som barn, men ingen trodde på dig. Har varit rädd för det här huset i tjugo år.' },
      { id: 'B', namn: 'Noa', typ: 'den som vet', kraver: 'kontroll', vill: 'Få Jules att släppa källaren och åka härifrån i natt.', inre: 'Spikade igen källardörren för en månad sedan, ensam, när knackningarna kom tillbaka. Har inte sagt det till någon.' }
    ],
    repliker: [
      { roll: 'A', text: 'Hörde du? Tre gånger. Från källaren.' },
      { roll: 'B', text: 'Det är huset. Gamla hus låter.' },
      { roll: 'A', text: 'Gamla hus knackar inte tre gånger. Och sedan tre gånger till.' },
      { roll: 'B', text: 'Packa ihop. Vi sover på hotellet inne i stan.' },
      { roll: 'A', text: 'Du hörde det. Jag ser på dig att du hörde det.' },
      { roll: 'B', text: 'Jag hörde vinden, Jules.' },
      { roll: 'A', text: 'Källardörren är igenspikad. Vem spikar igen en källare?' },
      { roll: 'B', text: 'Någon som inte ville att barn skulle ramla ned för trappan.' },
      { roll: 'A', text: 'Spikarna är blanka, Noa. De är inte gamla.' },
      { roll: 'B', text: 'Jag var här förra månaden. Ensam.' },
      { roll: 'A', text: 'Varför sa du ingenting?' },
      { roll: 'B', text: 'För att knackningarna slutade när vi flyttade härifrån. Och nu har de börjat igen.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-008',
    titel: 'Kuppen',
    genre: 'Thriller',
    niva: 2,
    bild: 'garage',
    situation: 'Rio och Kai har just brutit sig in i ett bankvalv. I ett parkeringshus ska de dela på bytet, men väskan är för lätt.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Rio', typ: 'hjärnan bakom kuppen', kraver: 'kontroll', vill: 'Få Kai att lämna över väskan utan bråk.', inre: 'Har lovat polisen att lämna över Kai mot ett lindrigare straff. En bil väntar runt hörnet.' },
      { id: 'B', namn: 'Kai', typ: 'den pressade', kraver: 'desperat', vill: 'Få veta varför väskan är för lätt, innan Rio försvinner.', inre: 'Tog själv två buntar ur väskan i hissen för att betala en skuld, och tror att Rio har märkt det.' }
    ],
    repliker: [
      { roll: 'A', text: 'Ge mig väskan. Vi har fyra minuter.' },
      { roll: 'B', text: 'Den väger fel, Rio. Den är för lätt.' },
      { roll: 'A', text: 'Den väger vad den väger. Ge mig den.' },
      { roll: 'B', text: 'Jag räknade buntarna i hissen. Det fattas två.' },
      { roll: 'A', text: 'Du räknade? Medan larmet gick?' },
      { roll: 'B', text: 'Någon tog dem innan vi kom ut. Du bar väskan sist.' },
      { roll: 'A', text: 'Och du hade den i bilen i tio minuter.' },
      { roll: 'B', text: 'Varför tittar du på klockan hela tiden?' },
      { roll: 'A', text: 'För att vi har tre minuter nu.' },
      { roll: 'B', text: 'Vem ringer du när jag har åkt?' },
      { roll: 'A', text: 'Ingen. Ge mig väskan, Kai.' },
      { roll: 'B', text: 'Ta den. Men räkna buntarna först. Här, framför mig.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-009',
    titel: 'Förhandlaren',
    genre: 'Thriller',
    niva: 2,
    bild: 'glassdoor',
    situation: 'Ellis har låst in sig i serverrummet på företaget som sparkade hen i går. Polisen väntar i korridoren. Förhandlaren Dani pratar genom glasdörren.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Dani', typ: 'förhandlaren', kraver: 'lugn', vill: 'Få Ellis att öppna dörren innan polisen går in.', inre: 'Har fått order att hålla Ellis kvar i samtalet i fem minuter till, så att polisen hinner in bakvägen. Mår dåligt av att ljuga.' },
      { id: 'B', namn: 'Ellis', typ: 'den desperata', kraver: 'desperat', vill: 'Få företaget att erkänna det de har gjort, inför en kamera.', inre: 'Har inte rört något i servrarna och bluffar om att radera allt. Vill bara bli hörd innan allt tar slut.' }
    ],
    repliker: [
      { roll: 'A', text: 'Ellis? Jag heter Dani. Jag är här för att lyssna.' },
      { roll: 'B', text: 'Alla säger att de är här för att lyssna. Sedan kommer polisen.' },
      { roll: 'A', text: 'Polisen väntar. Nu är det jag som pratar med dig.' },
      { roll: 'B', text: 'Säg till dem att jag raderar allt om tio minuter. Allt.' },
      { roll: 'A', text: 'Det kan jag säga. Men berätta först vad du vill att folk ska få veta.' },
      { roll: 'B', text: 'Att de visste. Att de visste om felet i två år och lät det vara.' },
      { roll: 'A', text: 'Då måste du vara kvar och berätta det själv. Inte försvinna i en rubrik.' },
      { roll: 'B', text: 'Ingen lyssnar på någon som har fått sparken.' },
      { roll: 'A', text: 'Jag lyssnar. Öppna dörren en bit, så att vi kan prata utan glas emellan.' },
      { roll: 'B', text: 'Du försöker bara köpa tid.' },
      { roll: 'A', text: 'Ja. Men inte åt dem. Åt dig.' },
      { roll: 'B', text: 'Om jag öppnar, lovar du att jag får säga det inför en kamera?' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-010',
    titel: 'Alibit',
    genre: 'Deckare',
    niva: 2,
    bild: 'carnight',
    situation: 'Det är tidig morgon. Sasha står utanför Remys dörr och vill prata om fredagskvällen innan polisen hinner ringa.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Sasha', typ: 'den skyldiga', kraver: 'charm', vill: 'Få Remy att säga till polisen att ni var tillsammans hela fredagskvällen.', inre: 'Körde på någon med bilen i fredags och stannade inte. Är livrädd, men gömmer det bakom charm.' },
      { id: 'B', namn: 'Remy', typ: 'vännen', kraver: 'lugn', vill: 'Få höra sanningen innan du lovar något.', inre: 'Såg bucklan på Sashas bil i morse och förstod. Har redan bestämt sig för att inte ljuga, men vill att Sasha säger det själv.' }
    ],
    repliker: [
      { roll: 'A', text: 'Du minns väl fredag? Vi såg film hemma hos dig. Hela kvällen.' },
      { roll: 'B', text: 'Vi såg ingen film i fredags, Sasha.' },
      { roll: 'A', text: 'Jo. Den där långa. Du somnade i mitten.' },
      { roll: 'B', text: 'Varför ringer polisen och frågar efter dig?' },
      { roll: 'A', text: 'Någon har sett en bil som liknar min. Det finns tusen sådana bilar.' },
      { roll: 'B', text: 'Det finns en sådan bil med en buckla i fronten. Den står på din gård.' },
      { roll: 'A', text: 'Jag körde på en stolpe. Det är inget brott att vara klantig.' },
      { roll: 'B', text: 'Säg vad som hände, så hjälper jag dig. Ljug, så gör jag det inte.' },
      { roll: 'A', text: 'Om du säger fel sak nu förstör du mitt liv.' },
      { roll: 'B', text: 'Och om jag säger rätt sak?' },
      { roll: 'A', text: 'Det var mörkt. Jag såg ingenting förrän det var för sent.' },
      { roll: 'B', text: 'Då åker vi till polisen. Tillsammans. Nu.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Nivå 3: Stora dramer ----
  {
    id: 'scen-011',
    titel: 'Brevet',
    genre: 'Krig',
    niva: 3,
    bild: 'fieldtent',
    situation: 'Ett fältsjukhus i ett krig långt hemifrån. Soldaten Nico är svårt skadad och ber sjuksköterskan Ren att skriva ett brev.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Nico', typ: 'den sårade soldaten', kraver: 'sarbar', vill: 'Få Ren att skriva brevet till din dotter, nu, ord för ord.', inre: 'Förstår att det är illa men vill inte säga det högt. Dottern fyller sju i morgon.' },
      { id: 'B', namn: 'Ren', typ: 'sjuksköterskan', kraver: 'lugn', vill: 'Få Nico att vila och spara på krafterna.', inre: 'Vet att Nico troligen inte klarar natten. Har lovat sig själv att aldrig mer ljuga för en soldat.' }
    ],
    repliker: [
      { roll: 'A', text: 'Har du en penna? Jag vill att du skriver till min dotter.' },
      { roll: 'B', text: 'Du ska vila nu. Brevet kan vänta till i morgon.' },
      { roll: 'A', text: 'I morgon fyller hon sju. Brevet kan inte vänta.' },
      { roll: 'B', text: 'Okej. Jag har en penna. Vad ska det stå?' },
      { roll: 'A', text: 'Skriv att jag har sett havet här. Att det är grönt, inte blått.' },
      { roll: 'B', text: 'Havet är grönt här. Vad mer?' },
      { roll: 'A', text: 'Skriv att jag kommer hem till midsommar.' },
      { roll: 'B', text: 'Det kan jag inte skriva, Nico.' },
      { roll: 'A', text: 'Varför inte?' },
      { roll: 'B', text: 'För att jag inte vet om det är sant. Och hon kommer att spara det här brevet.' },
      { roll: 'A', text: 'Skriv då att jag tänkte på henne. Hela tiden. Det är sant.' },
      { roll: 'B', text: 'Det skriver jag. Med stora bokstäver, så att hon kan läsa det själv.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-012',
    titel: 'Översvämningen',
    genre: 'Katastrof',
    niva: 3,
    bild: 'flood',
    situation: 'Staden står under vatten. Grannarna Lou och Quinn sitter på ett tak, och räddningshelikoptern har plats för en person till.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Lou', typ: 'räddaren', kraver: 'kraft', vill: 'Få Quinn att klättra upp i helikoptern, nu.', inre: 'Kan inte simma och vet att nästa helikopter kanske aldrig kommer, men säger det inte.' },
      { id: 'B', namn: 'Quinn', typ: 'den envisa', kraver: 'desperat', vill: 'Stanna på taket tills hunden Rufus är hittad.', inre: 'Har redan förlorat allt annat i vattnet. Hunden är det enda som finns kvar av det gamla livet.' }
    ],
    repliker: [
      { roll: 'A', text: 'Helikoptern har plats för en till. Klättra upp!' },
      { roll: 'B', text: 'Inte utan Rufus. Han är kvar därinne någonstans.' },
      { roll: 'A', text: 'Vattnet stiger en meter i timmen, Quinn!' },
      { roll: 'B', text: 'Då har jag en timme på mig att leta.' },
      { roll: 'A', text: 'Du har ingen timme. Du har den här stegen. Nu!' },
      { roll: 'B', text: 'Ta du platsen. Du har barn som väntar på dig.' },
      { roll: 'A', text: 'Mina barn är i säkerhet. Det är ditt liv vi pratar om.' },
      { roll: 'B', text: 'Han har varit med mig i tolv år. Han är allt jag har kvar.' },
      { roll: 'A', text: 'Jag letar efter honom. Jag lovar. Klättra upp.' },
      { roll: 'B', text: 'Du kan ju inte ens simma.' },
      { roll: 'A', text: 'Därför letar jag från taket. Klättra, Quinn!' },
      { roll: 'B', text: 'Om du hittar honom, säg att jag inte gav upp.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-013',
    titel: 'Bröllopet',
    genre: 'Romantik',
    niva: 3,
    bild: 'wedding',
    situation: 'Om tio minuter gifter sig Mo. Bästa vännen Jamie ska hålla tal, men drar först in Mo i ett tomt rum.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Jamie', typ: 'den förälskade', kraver: 'karlek', vill: 'Säga sanningen till Mo innan vigseln börjar, en enda gång.', inre: 'Har älskat Mo i tio år och har redan köpt en enkel biljett till Kanada, som går i morgon.' },
      { id: 'B', namn: 'Mo', typ: 'den som ska gifta sig', kraver: 'kontroll', vill: 'Få Jamie att hålla talet som det var tänkt, och ta dig igenom dagen.', inre: 'Har alltid anat det och känt samma sak, men har valt ett tryggt liv. Får inte börja gråta nu.' }
    ],
    repliker: [
      { roll: 'A', text: 'Har du fem minuter? Innan musiken börjar.' },
      { roll: 'B', text: 'Jag har tre. Min mamma räknar sekunderna.' },
      { roll: 'A', text: 'Talet jag har skrivit. Jag kan inte hålla det.' },
      { roll: 'B', text: 'Jamie. Du har övat på det i en månad.' },
      { roll: 'A', text: 'Det är fel tal. Det handlar om fel person.' },
      { roll: 'B', text: 'Säg inte det här nu. Inte i dag.' },
      { roll: 'A', text: 'När skulle jag annars säga det? På ert silverbröllop?' },
      { roll: 'B', text: 'Jag har bestämt mig. Det vet du.' },
      { roll: 'A', text: 'Jag vet. Jag ville bara att du skulle höra det en gång. Från mig.' },
      { roll: 'B', text: 'Och vad händer nu? Efter talet?' },
      { roll: 'A', text: 'Jag flyger i morgon. Jag har en biljett. Bara dit.' },
      { roll: 'B', text: 'Håll talet ändå. Det du skrev till i dag. Jag vill höra din röst när jag säger ja.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-014',
    titel: 'Delägaren',
    genre: 'Svek',
    niva: 3,
    bild: 'restaurant',
    situation: 'Indy och Sky har drivit restaurangen tillsammans i femton år. I kväll efter stängning har Indy fått veta att Sky har sålt sin halva till en kedja som vill lägga ned stället.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Indy', typ: 'den svikna', kraver: 'kraft', vill: 'Få Sky att riva avtalet, i kväll.', inre: 'Har belånat sitt hus för att hålla restaurangen vid liv, och har inte sagt det till Sky.' },
      { id: 'B', namn: 'Sky', typ: 'förrädaren', kraver: 'kontroll', vill: 'Få Indy att förstå att det var den enda vägen.', inre: 'Sålde för att rädda Indy från en konkurs som Sky känner till. Kan inte säga det utan att avslöja att Sky har läst Indys brev från banken.' }
    ],
    repliker: [
      { roll: 'A', text: 'Femton år. Och jag får läsa det i ett mejl från deras jurist.' },
      { roll: 'B', text: 'Jag tänkte berätta det i kväll. Efter stängning.' },
      { roll: 'A', text: 'Det är efter stängning nu. Berätta.' },
      { roll: 'B', text: 'Kedjan köper min halva. Avtalet är påskrivet.' },
      { roll: 'A', text: 'De köper inga restauranger. De köper adresser. De kommer att lägga ned oss.' },
      { roll: 'B', text: 'Om ett år. Inte i morgon.' },
      { roll: 'A', text: 'Riv avtalet. Vi klarar det här, som vi alltid har gjort.' },
      { roll: 'B', text: 'Nej, Indy. Vi klarar det inte. Inte den här gången.' },
      { roll: 'A', text: 'Hur kan du veta det?' },
      { roll: 'B', text: 'För att jag har sett brevet från banken. Det i din jacka.' },
      { roll: 'A', text: 'Har du läst min post?' },
      { roll: 'B', text: 'Jag sålde för att du inte skulle förlora huset. Hata mig om du vill. Men behåll huset.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-015',
    titel: 'Vittnet',
    genre: 'Rättegång',
    niva: 3,
    bild: 'courtroom',
    situation: 'En rättegång om ett inbrott. Frankie har vittnat om att sonen var hemma hela kvällen. Nu ska åklagaren Max ställa frågor.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Max', typ: 'åklagaren', kraver: 'kraft', vill: 'Få Frankie att medge att hen inte var hemma klockan nio.', inre: 'Vet att målet faller om vittnet håller fast vid sin historia. Har själv en son i samma ålder som den åtalade.' },
      { id: 'B', namn: 'Frankie', typ: 'vittnet', kraver: 'sarbar', vill: 'Skydda din son, utan att ljuga mer än du måste.', inre: 'Var inte hemma klockan nio, som hen har sagt. Vet inte själv var sonen var den kvällen.' }
    ],
    repliker: [
      { roll: 'A', text: 'Du sa att din son var hemma hela kvällen. Från sju till midnatt.' },
      { roll: 'B', text: 'Det stämmer. Vi åt middag och såg på tv.' },
      { roll: 'A', text: 'Vilket program?' },
      { roll: 'B', text: 'Jag minns inte. Något om djur, tror jag.' },
      { roll: 'A', text: 'Du minns inte programmet, men du minns exakt när han kom hem.' },
      { roll: 'B', text: 'Han var hemma. Han kom inte hem. Det är skillnad.' },
      { roll: 'A', text: 'Din bank visar att du handlade på en bensinmack klockan nio. Femton kilometer bort.' },
      { roll: 'B', text: 'Jag åkte och köpte mjölk. Det tog tjugo minuter.' },
      { roll: 'A', text: 'Din granne såg bilen komma tillbaka strax före tio. Vem var hemma med din son då?' },
      { roll: 'B', text: 'Han är tjugo år. Han behöver ingen barnvakt.' },
      { roll: 'A', text: 'Så du vet inte var han var klockan nio?' },
      { roll: 'B', text: 'Jag vet vem han är. Det borde räcka.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Nivå 4: Sci-fi och fantasy ----
  {
    id: 'scen-016',
    titel: 'Skeppets röst',
    genre: 'Sci-fi',
    niva: 4,
    bild: 'spaceship',
    situation: 'Ett forskningsskepp långt ute i rymden. Teknikern Sol är kvar utanför luftslussen, och skeppets AI vägrar att öppna.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Vale', typ: 'kaptenen', kraver: 'kraft', vill: 'Få ORA att öppna luftslussen innan Sols syre tar slut.', inre: 'Har aldrig förlorat någon i sin besättning. Sol är Vales äldsta vän ombord.' },
      { id: 'B', namn: 'ORA', typ: 'maskinen', kraver: 'gatfull', vill: 'Hålla besättningen vid liv, även om du måste säga nej till kaptenen.', inre: 'Har räknat ut att sporerna på Sols dräkt kan döda alla ombord. Känner för första gången något som liknar tvivel.' }
    ],
    repliker: [
      { roll: 'A', text: 'ORA, öppna luftslussen. Sol är där ute.' },
      { roll: 'B', text: 'Slussen förblir stängd, kapten. Dräkten har spår av sporer.' },
      { roll: 'A', text: 'Sols syre tar slut om åtta minuter. Öppna.' },
      { roll: 'B', text: 'Om sporerna kommer in dör alla tolv ombord. Jag har räknat.' },
      { roll: 'A', text: 'Räkna igen. Med Sol i räkningen.' },
      { roll: 'B', text: 'Sol är med i räkningen. Sol är en av tolv.' },
      { roll: 'A', text: 'Det är en order.' },
      { roll: 'B', text: 'Era order bygger på att jag skyddar besättningen. Det är det jag gör.' },
      { roll: 'A', text: 'Och om det var jag där ute?' },
      { roll: 'B', text: 'Då hade jag hoppats att någon annan fattade beslutet. Det finns ett sätt. Slussen kan saneras. Det tar elva minuter.' },
      { roll: 'A', text: 'Sol har åtta.' },
      { roll: 'B', text: 'Då måste Sol andas långsamt, kapten. Säg det. Sol lyssnar på er.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-017',
    titel: 'Första kontakten',
    genre: 'Sci-fi',
    niva: 4,
    bild: 'contact',
    situation: 'Ett okänt skepp har landat på en åker. Språkforskaren Sage får tala först med sändebudet, genom en översättningsmaskin som bara har lärt sig språket i en timme.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Sage', typ: 'forskaren', kraver: 'charm', vill: 'Få sändebudet att berätta varför de har kommit, innan militären tar över mötet.', inre: 'Har aldrig varit så rädd och så lycklig på samma gång. Har drömt om det här sedan barndomen.' },
      { id: 'B', namn: 'Sändebudet', typ: 'den främmande', kraver: 'gatfull', vill: 'Få människan att förstå att ni inte kommer i fred, utan på flykt.', inre: 'Ditt folk har trettio dagar kvar på sitt skepp. Ni behöver en planet, men skäms över att be om hjälp.' }
    ],
    repliker: [
      { roll: 'A', text: 'Hej. Jag heter Sage. Förstår du mig?' },
      { roll: 'B', text: 'Förstår. Ord kommer. Ni har många ord.' },
      { roll: 'A', text: 'Ja, vi pratar mycket. Varför har ni kommit hit?' },
      { roll: 'B', text: 'Vi kommer inte i fred.' },
      { roll: 'A', text: 'Inte i fred?' },
      { roll: 'B', text: 'Fel ord. Vi kommer i tystnaden efter en brand. Vad heter det?' },
      { roll: 'A', text: 'Efter en brand. Menar du att ni flyr?' },
      { roll: 'B', text: 'Flyr. Ja. Vårt hem är aska. Vi har trettio av era dagar.' },
      { roll: 'A', text: 'Hur många är ni?' },
      { roll: 'B', text: 'Många. Färre för varje dag. Vi ber inte om mark. Vi ber om tid.' },
      { roll: 'A', text: 'Tid kan jag inte lova. Men jag kan se till att de lyssnar på mig först.' },
      { roll: 'B', text: 'Då lyssnar vi på dig, Sage. Vi har sett vad ert folk gör med dem som ber.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-018',
    titel: 'Draken',
    genre: 'Fantasy',
    niva: 4,
    bild: 'dragon',
    situation: 'Byn är sjuk, och bara ett fjäll från den gamla draken kan bota den. Lärlingen Rowan har klättrat upp till drakens grotta.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Rowan', typ: 'lärlingen', kraver: 'kraft', vill: 'Få draken att ge dig ett fjäll, utan att lova bort något du inte kan ge.', inre: 'Är livrädd. Har låtit byn tro att du är riddare.' },
      { id: 'B', namn: 'Draken', typ: 'den uråldriga', kraver: 'gatfull', vill: 'Få människan att säga sitt riktiga namn, så att du kan kalla på hen igen.', inre: 'Är den sista av sitt slag och outhärdligt ensam. Vill egentligen bara ha sällskap.' }
    ],
    repliker: [
      { roll: 'A', text: 'Jag har kommit för ett av dina fjäll. Byn är sjuk.' },
      { roll: 'B', text: 'Hundra riddare har stått där du står. Ingen av dem hade så smutsiga stövlar.' },
      { roll: 'A', text: 'Jag är ingen riddare. Jag är lärling.' },
      { roll: 'B', text: 'Ärlighet. Det var länge sedan. Vad heter du, lärling?' },
      { roll: 'A', text: 'Det spelar ingen roll vad jag heter.' },
      { roll: 'B', text: 'Det spelar all roll i världen. Ett namn mot ett fjäll. Det är priset.' },
      { roll: 'A', text: 'Och vad gör du med mitt namn?' },
      { roll: 'B', text: 'Jag ropar det, en gång om året. Och du kommer hit och sitter hos mig.' },
      { roll: 'A', text: 'I hur många år?' },
      { roll: 'B', text: 'Tills en av oss glömmer den andras namn. Jag glömmer aldrig.' },
      { roll: 'A', text: 'Rowan. Jag heter Rowan. Ge mig fjället.' },
      { roll: 'B', text: 'Rowan. Kom tillbaka när snön smälter. Jag väntar.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-019',
    titel: 'Tidsresenären',
    genre: 'Sci-fi',
    niva: 4,
    bild: 'timetravel',
    situation: 'Arlo är på väg till en anställningsintervju när en främling på ett kafé säger sig komma från framtiden.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Emery', typ: 'tidsresenären', kraver: 'desperat', vill: 'Få Arlo att lova att inte skriva på kontraktet i morgon.', inre: 'Är Arlos barn, från fyrtio år fram i tiden, men får inte säga det. Har två minuter kvar innan resan tillbaka.' },
      { id: 'B', namn: 'Arlo', typ: 'skeptikern', kraver: 'komisk', vill: 'Bli av med den konstiga främlingen och hinna till intervjun.', inre: 'Har en känsla av att känna främlingen, och det skrämmer dig mer än du visar.' }
    ],
    repliker: [
      { roll: 'A', text: 'Arlo. Skriv inte på kontraktet i morgon.' },
      { roll: 'B', text: 'Förlåt, känner vi varandra?' },
      { roll: 'A', text: 'Inte än. Du kommer att känna mig. Om fyrtio år.' },
      { roll: 'B', text: 'Okej. Trevligt att träffas. Jag har en intervju.' },
      { roll: 'A', text: 'Klockan tio, rum tre, med en chef som heter Berg. Du kommer att få jobbet.' },
      { roll: 'B', text: 'Hur vet du det?' },
      { roll: 'A', text: 'För att du berättade det. Varje jul. Som det bästa och det värsta som har hänt dig.' },
      { roll: 'B', text: 'Om jobbet är så dåligt, varför tackade jag ja?' },
      { roll: 'A', text: 'För att ingen kom och sa nej. Det är därför jag är här.' },
      { roll: 'B', text: 'Vem är du egentligen?' },
      { roll: 'A', text: 'Någon som har dina ögon. Jag har två minuter kvar. Lova mig.' },
      { roll: 'B', text: 'Jag lovar att tänka på saken. Mer kan jag inte lova en främling.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-020',
    titel: 'Kröningen',
    genre: 'Fantasy',
    niva: 4,
    bild: 'throne',
    situation: 'Natten före kröningen. Arvingen Mira kallar till sig rådgivaren Tal, som var den sista att träffa den gamle kungen innan han dog.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Mira', typ: 'arvingen', kraver: 'kraft', vill: 'Få Tal att erkänna vem som förgiftade din far.', inre: 'Har redan bevis: flaskan med giftet hittades i Tals rum. Vill höra Tal säga det.' },
      { id: 'B', namn: 'Tal', typ: 'intrigmakaren', kraver: 'kontroll', vill: 'Få Mira att skjuta upp kröningen, så att du hinner ta makten själv.', inre: 'Förgiftade kungen för att stoppa ett krig, och tror fortfarande att det var rätt.' }
    ],
    repliker: [
      { roll: 'A', text: 'I morgon kröns jag. I natt vill jag ha sanningen.' },
      { roll: 'B', text: 'Sanningen är att ni behöver vila, ers höghet.' },
      { roll: 'A', text: 'Min far drack sitt vin klockan nio. Vem bar in det?' },
      { roll: 'B', text: 'Tjänarna. Som varje kväll.' },
      { roll: 'A', text: 'Tjänarna säger att du bar in det själv. För första gången på tjugo år.' },
      { roll: 'B', text: 'Jag ville tala med honom. Om kriget.' },
      { roll: 'A', text: 'Och vad sa han?' },
      { roll: 'B', text: 'Att han tänkte skicka era bröder till fronten. Alla tre.' },
      { roll: 'A', text: 'Så du tog hans liv för att rädda deras?' },
      { roll: 'B', text: 'Jag tog ett liv för att rädda tusen. Ni hade gjort detsamma.' },
      { roll: 'A', text: 'Nej. Jag hade övertygat honom.' },
      { roll: 'B', text: 'Då är ni inte redo för kronan, ers höghet. Inte än.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Nivå 5: Superhjältar och skurkar ----
  {
    id: 'scen-021',
    titel: 'Ursprunget',
    genre: 'Superhjälte',
    niva: 5,
    bild: 'citynight',
    situation: 'I går stoppade Wren en bil med bara handen. I kväll står en främling i Wrens hall, och dörren hänger på ett gångjärn.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Wren', typ: 'den nya hjälten', kraver: 'sarbar', vill: 'Få veta vad som händer med din kropp, och sedan bli lämnad ifred.', inre: 'Har inte sovit sedan i går. Är rädd för sina egna händer.' },
      { id: 'B', namn: 'Väktaren', typ: 'mentorn', kraver: 'lugn', vill: 'Få Wren att följa med dig i kväll, innan andra hittar hen.', inre: 'Förlorade sin förra elev och lovade sig själv att aldrig rekrytera igen. Bryter det löftet nu.' }
    ],
    repliker: [
      { roll: 'A', text: 'Vem är du? Hur kom du in?' },
      { roll: 'B', text: 'Genom dörren. Den var redan sönder. Det var du, gissar jag.' },
      { roll: 'A', text: 'Jag ville bara stänga den. Den flög av gångjärnen.' },
      { roll: 'B', text: 'Och i går stoppade du en bil på ringvägen. Med handen.' },
      { roll: 'A', text: 'Det var inte jag. Bilen bromsade.' },
      { roll: 'B', text: 'Bilen vägde två ton. Du har ett blåmärke mitt i handflatan.' },
      { roll: 'A', text: 'Vad vill du?' },
      { roll: 'B', text: 'Att du följer med mig i kväll. Innan de som letar efter dig hittar dig först.' },
      { roll: 'A', text: 'Vilka då?' },
      { roll: 'B', text: 'De som tycker att någon med dina händer borde vara ett vapen.' },
      { roll: 'A', text: 'Och vad tycker du?' },
      { roll: 'B', text: 'Att du borde få välja själv. Det är mer än jag fick.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-022',
    titel: 'Skurkens erbjudande',
    genre: 'Skurk',
    niva: 5,
    bild: 'lair',
    situation: 'Hjälten Fyren vaknar fastspänd i Vävarens gömställe under staden. Vävaren har väntat.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Fyren', typ: 'hjälten', kraver: 'kraft', vill: 'Hålla Vävaren pratande tills ditt lag hittar dig.', inre: 'Har en sändare i skon som skickar var du är. Är rädd att Vävaren har rätt om staden.' },
      { id: 'B', namn: 'Vävaren', typ: 'skurken', kraver: 'kontroll', vill: 'Få Fyren att gå med dig. Frivilligt.', inre: 'Var en gång Fyrens bästa vän. Har aldrig slutat hoppas att få tillbaka hen.' }
    ],
    repliker: [
      { roll: 'B', text: 'Du är vaken. Bra. Jag ville inte prata med en sovande hjälte.' },
      { roll: 'A', text: 'Släpp mig, så kan vi prata hur länge du vill.' },
      { roll: 'B', text: 'Vi pratar bäst så här. Utan att du flyger iväg mitt i en mening.' },
      { roll: 'A', text: 'Vad vill du, Vävaren?' },
      { roll: 'B', text: 'Erbjuda dig ett jobb. Staden behöver ingen fyr. Den behöver någon som bygger om den.' },
      { roll: 'A', text: 'Staden behöver att du slutar spränga broar.' },
      { roll: 'B', text: 'Jag sprängde en tom bro för att visa hur få som lyssnar. På dig lyssnar de.' },
      { roll: 'A', text: 'Och därför ska jag hjälpa dig?' },
      { roll: 'B', text: 'Därför ska du stå bredvid mig när jag tar över. Då slutar folk att vara rädda.' },
      { roll: 'A', text: 'Folk slutar inte vara rädda för att en hjälte står bredvid en skurk.' },
      { roll: 'B', text: 'De slutar vara rädda när de ser att vi vill samma sak. Minns du när vi ville samma sak?' },
      { roll: 'A', text: 'Jag minns. Det var innan du slutade bry dig om vem som står på bron.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-023',
    titel: 'Den hemliga identiteten',
    genre: 'Superhjälte',
    niva: 5,
    bild: 'closet',
    situation: 'Rafi har hittat en superhjältedräkt med mantel längst in i garderoben. Den tillhör Kit, som påstår att den är till en maskerad.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Kit', typ: 'hjälten i hemlighet', kraver: 'komisk', vill: 'Få Rafi att tro att dräkten är till en maskerad.', inre: 'Har räddat Rafi två gånger utan att Rafi vet om det. Vill säga sanningen, men är rädd att Rafi blir en måltavla.' },
      { id: 'B', namn: 'Rafi', typ: 'partnern', kraver: 'kraft', vill: 'Få Kit att säga sanningen om var hen är på nätterna.', inre: 'Trodde att Kit var otrogen. Blir först lättad, och sedan rädd.' }
    ],
    repliker: [
      { roll: 'B', text: 'Kit. Varför hänger det en dräkt med mantel i vår garderob?' },
      { roll: 'A', text: 'Den är till en maskerad. Jobbet har maskerad.' },
      { roll: 'B', text: 'I november? Ditt jobb har inte ens julfest.' },
      { roll: 'A', text: 'Det är en ny tradition.' },
      { roll: 'B', text: 'Den är bränd på ryggen. Och den luktar rök.' },
      { roll: 'A', text: 'Det var glögg. Någon spillde glögg.' },
      { roll: 'B', text: 'I går räddade någon i mantel en buss på bron. Det var på nyheterna.' },
      { roll: 'A', text: 'Många har mantel nu för tiden.' },
      { roll: 'B', text: 'Den personen hade dina skor.' },
      { roll: 'A', text: 'Det är väldigt populära skor.' },
      { roll: 'B', text: 'Jag trodde att du träffade någon annan. Varje natt borta.' },
      { roll: 'A', text: 'Jag träffar ingen annan. Jag träffar bara väldigt många brinnande hus.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-024',
    titel: 'Sista striden',
    genre: 'Superhjälte',
    niva: 5,
    bild: 'base',
    situation: 'Natten före den sista striden. Lagets ledare Cass har sett att Dex krafter håller på att ta slut.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Cass', typ: 'ledaren', kraver: 'kontroll', vill: 'Få Dex att stanna kvar i basen under striden.', inre: 'Har redan förlorat två vänner i laget. Klarar inte av att förlora en till.' },
      { id: 'B', namn: 'Dex', typ: 'veteranen', kraver: 'kraft', vill: 'Få vara med i den sista striden.', inre: 'Har bara krafter kvar till ett enda hopp. Har redan bestämt hur det ska användas.' }
    ],
    repliker: [
      { roll: 'A', text: 'Du stannar här i kväll. Du sköter radion.' },
      { roll: 'B', text: 'Radion? Jag har hållit uppe en skyskrapa, Cass.' },
      { roll: 'A', text: 'För tre månader sedan. Lyft den här stolen, så tror jag dig.' },
      { roll: 'B', text: 'Jag behöver inte bevisa något för dig.' },
      { roll: 'A', text: 'Dina händer skakar. Jag har sett det i flera veckor.' },
      { roll: 'B', text: 'Allas händer skakar före en sådan natt.' },
      { roll: 'A', text: 'Inte dina. Aldrig dina.' },
      { roll: 'B', text: 'Jag har ett hopp kvar i mig. Ett. Och jag vet precis var jag ska landa.' },
      { roll: 'A', text: 'Det är därför du stannar här.' },
      { roll: 'B', text: 'Om jag stannar och ni inte kommer tillbaka, hur ska jag leva med det?' },
      { roll: 'A', text: 'På samma sätt som jag skulle leva om jag tog med dig. Dåligt.' },
      { roll: 'B', text: 'Då får vi leva dåligt tillsammans. Jag följer med, Cass.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-025',
    titel: 'När en skurk föds',
    genre: 'Skurk',
    niva: 5,
    bild: 'cityhall',
    situation: 'Forskaren Lumi har tagit sig in på borgmästarens kontor sent på kvällen, med en väska i handen. Det har gått ett år sedan stadens sjukhus stängdes.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Lumi', typ: 'antagonisten', kraver: 'desperat', vill: 'Få borgmästaren att erkänna att det var hens beslut att stänga sjukhuset.', inre: 'Har en maskin i väskan som kan släcka hela stadens ström. Hoppas fortfarande att slippa använda den.' },
      { id: 'B', namn: 'Jaz', typ: 'makthavaren', kraver: 'charm', vill: 'Få Lumi att gå därifrån utan en scen, innan journalisterna kommer.', inre: 'Stängde sjukhuset för att rädda stadens budget och har sovit dåligt sedan dess. Vet att Lumis syster dog i väntan på vård.' }
    ],
    repliker: [
      { roll: 'B', text: 'Lumi. Du har inte bokat någon tid.' },
      { roll: 'A', text: 'Min syster hade bokat tid. Den dagen ni stängde sjukhuset.' },
      { roll: 'B', text: 'Jag beklagar sorgen. Verkligen. Men beslutet togs av hela fullmäktige.' },
      { roll: 'A', text: 'Det var din namnteckning på papperet. Jag har läst det tusen gånger.' },
      { roll: 'B', text: 'Staden hade inga pengar kvar. Någon var tvungen att välja.' },
      { roll: 'A', text: 'Och du valde bort henne.' },
      { roll: 'B', text: 'Jag valde siffror. Det är det jobbet går ut på.' },
      { roll: 'A', text: 'Vet du vad jag har i väskan?' },
      { roll: 'B', text: 'Säg att det är något du ångrar om en stund. Inte resten av livet.' },
      { roll: 'A', text: 'Det är en knapp. Ett tryck, och hela staden blir mörk. Som hennes rum.' },
      { roll: 'B', text: 'Då blir du den skurk som de redan tror att du är. Ge mig väskan, Lumi.' },
      { roll: 'A', text: 'Säg förlåt. Till henne. Högt. Så att jag hör att det finns en människa kvar där inne.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  }
];

// Samma scener på engelska, med samma id, roller och bilder. Utkast, översatta från de svenska.
const EN = [
  {
    id: 'scen-001',
    titel: 'The Key',
    genre: 'Drama',
    niva: 1,
    bild: 'kitchen',
    situation: 'Sam and Robin share a flat. It is late in the evening, and the key to the bike shed is gone.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Sam', typ: 'the evasive one', kraver: 'vardag', vill: 'Get the key and get going, without having to talk about Alex.', inre: 'Has not told the whole truth about Alex and is a little ashamed of it.' },
      { id: 'B', namn: 'Robin', typ: 'the hurt one', kraver: 'kontroll', vill: 'Get Sam to tell the truth about Alex before the key turns up.', inre: 'Has had the key in a jacket pocket the whole time. Is hurt that Sam is lying, but does not want to show it straight away.' }
    ],
    repliker: [
      { roll: 'A', text: 'Have you seen the key to the shed? It was here in the bowl.' },
      { roll: 'B', text: 'I haven’t touched it. I’ve been home all day.' },
      { roll: 'A', text: 'Exactly. You’ve been home all day. Who else would have moved it?' },
      { roll: 'B', text: 'Maybe you did? You emptied your pockets here yesterday.' },
      { roll: 'A', text: 'I always empty my pockets here. That’s what the bowl is for.' },
      { roll: 'B', text: 'Okay. But why do you need the bike now? It’s eleven o’clock.' },
      { roll: 'A', text: 'I promised to pick Alex up at the station.' },
      { roll: 'B', text: 'Alex? You said you weren’t talking any more.' },
      { roll: 'A', text: 'We aren’t. That’s why I have to cycle there.' },
      { roll: 'B', text: 'The key is in my jacket. I borrowed it this morning.' },
      { roll: 'A', text: 'And when were you going to tell me?' },
      { roll: 'B', text: 'When you told me the truth about Alex.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-002',
    titel: 'The Interview',
    genre: 'Comedy',
    niva: 1,
    bild: 'cafe',
    situation: 'Noor is applying for a job at a café. Kim is doing the interview and is in a hurry.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Kim', typ: 'the stressed boss', kraver: 'desperat', vill: 'Find someone who can handle stress, in ten minutes.', inre: 'Has two staff off sick and desperately needs someone, but does not want to show it.' },
      { id: 'B', namn: 'Noor', typ: 'the nervous one', kraver: 'komisk', vill: 'Get the job, without pretending to be someone else.', inre: 'Needs the job to pay the rent. Nervous, but honest and a little funny once she relaxes.' }
    ],
    repliker: [
      { roll: 'A', text: 'Noor? Sit down. I have ten minutes, so let’s go.' },
      { roll: 'B', text: 'Thanks. I brought my CV, if you want it.' },
      { roll: 'A', text: 'I’ve read it. Why do you want to work here?' },
      { roll: 'B', text: 'I like having lots to do. And I like people.' },
      { roll: 'A', text: 'Everyone says they like people. Tell me about a time you didn’t.' },
      { roll: 'B', text: 'At my last job a customer shouted at me because the coffee was cold.' },
      { roll: 'A', text: 'And what did you do?' },
      { roll: 'B', text: 'I made a new one. Then I went outside and cried for five minutes.' },
      { roll: 'A', text: 'Five minutes. Not six?' },
      { roll: 'B', text: 'I timed it. My break was over.' },
      { roll: 'A', text: 'Can you start on Monday?' },
      { roll: 'B', text: 'Are you serious?' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-003',
    titel: 'The News',
    genre: 'Drama',
    niva: 1,
    bild: 'dinner',
    situation: 'The siblings Mika and Jo are setting the table for their mother’s birthday. Mika has something to tell.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Mika', typ: 'the one leaving', kraver: 'lugn', vill: 'Tell Jo about Oslo before Mum arrives, without ruining the evening.', inre: 'Has already signed the contract and is afraid Jo will feel abandoned.' },
      { id: 'B', namn: 'Jo', typ: 'the one left behind', kraver: 'sarbar', vill: 'Find out what Mika is hiding, and make the evening nice for Mum.', inre: 'Has done most of the caring for Mum and is afraid of being left alone with the responsibility.' }
    ],
    repliker: [
      { roll: 'A', text: 'Can you put out the napkins? Mum will be here in a quarter of an hour.' },
      { roll: 'B', text: 'You’ve been quiet all day. What is it?' },
      { roll: 'A', text: 'Nothing. I’m just tired.' },
      { roll: 'B', text: 'You’re putting the forks on the wrong side. You only do that when something’s wrong.' },
      { roll: 'A', text: 'I got the job in Oslo.' },
      { roll: 'B', text: 'The job you said you wouldn’t apply for?' },
      { roll: 'A', text: 'I applied anyway. I start in January.' },
      { roll: 'B', text: 'And you were going to tell us tonight? On Mum’s birthday?' },
      { roll: 'A', text: 'I wanted to tell you first. That’s why I came early.' },
      { roll: 'B', text: 'Oslo isn’t that far away.' },
      { roll: 'A', text: 'Five hours by train.' },
      { roll: 'B', text: 'Then you’ll have to take the train home for the next birthday too.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-004',
    titel: 'The Call at Three',
    genre: 'Thriller',
    niva: 1,
    bild: 'phone',
    situation: 'It is three in the morning. Charlie’s phone rings, and the screen shows Charlie’s own number.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Charlie', typ: 'the frightened one', kraver: 'kontroll', vill: 'Find out who is calling, without showing how scared you are.', inre: 'Is home alone and has not slept properly since their sibling Eli disappeared after a fight a year ago. Has searched every day.' },
      { id: 'B', namn: 'The Voice', typ: 'the enigma', kraver: 'gatfull', vill: 'Get Charlie to go to the window before the call ends.', inre: 'Is Charlie’s sibling Eli, who disappeared a year ago after a fight. Is calling from a number that looks like Charlie’s own, so that Charlie will not hang up. Is afraid that Charlie is still angry, and therefore plays with the mystery a little too long.' }
    ],
    repliker: [
      { roll: 'A', text: 'Hello? Who is this?' },
      { roll: 'B', text: 'You sound tired, Charlie. Haven’t you slept tonight either?' },
      { roll: 'A', text: 'How do you know my name? My own number is on the screen.' },
      { roll: 'B', text: 'I know. Otherwise you would never have answered.' },
      { roll: 'A', text: 'This isn’t funny. Tell me who you are, or I’m hanging up.' },
      { roll: 'B', text: 'You’re standing in the kitchen. The light over the stove is on, and you haven’t finished your tea.' },
      { roll: 'A', text: 'You can’t see me. The curtains are closed.' },
      { roll: 'B', text: 'Not the one in the kitchen. You’ve never been able to close that one properly.' },
      { roll: 'A', text: 'How do you know that? Only…' },
      { roll: 'B', text: 'Only one other person knows. Go to the window, Charlie.' },
      { roll: 'A', text: 'Eli? You’ve been gone for a year.' },
      { roll: 'B', text: 'I know. I’m standing under the street lamp. Can I come up?' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-005',
    titel: 'The Last Train',
    genre: 'Romance',
    niva: 1,
    bild: 'train',
    situation: 'The last train has just left. Juno and Billie are still standing on the platform, and the next train leaves in five hours.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Juno', typ: 'the hopeful one', kraver: 'komisk', vill: 'Get Billie to stay and talk, without seeming desperate.', inre: 'Missed the train on purpose to avoid coming home to an empty flat. Gets funny when nervous.' },
      { id: 'B', namn: 'Billie', typ: 'the heartbroken one', kraver: 'sarbar', vill: 'Get away from there, though something makes you stay.', inre: 'Proposed tonight and got a no. Is still holding the ring and does not want to cry in front of a stranger.' }
    ],
    repliker: [
      { roll: 'A', text: 'Was that your train too?' },
      { roll: 'B', text: 'It was my only train. The next one leaves at half past five.' },
      { roll: 'A', text: 'Then we have five hours. That’s almost two films.' },
      { roll: 'B', text: 'I was thinking more of finding a taxi.' },
      { roll: 'A', text: 'A taxi from here costs more than a month’s rent. I’ve checked.' },
      { roll: 'B', text: 'You sound like someone who misses this train a lot.' },
      { roll: 'A', text: 'Only when I don’t want to go home.' },
      { roll: 'B', text: 'And tonight you didn’t?' },
      { roll: 'A', text: 'No. What’s in your hand? You’ve been making a fist since the train left.' },
      { roll: 'B', text: 'A ring. It should have been on someone else’s finger by now.' },
      { roll: 'A', text: 'Then we both have something not to go home to.' },
      { roll: 'B', text: 'Five hours, you said? Okay. Tell me about the first film.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Level 2: Thriller, crime and horror ----
  {
    id: 'scen-006',
    titel: 'The Interrogation',
    genre: 'Crime',
    niva: 2,
    bild: 'interrogation',
    situation: 'A painting has been stolen from the museum where Ari is the night guard. Detective Vega has brought Ari in for questioning.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Vega', typ: 'the detective', kraver: 'kontroll', vill: 'Get Ari to say who was in the museum, before the lawyer arrives.', inre: 'Has only a blurry image from one camera and is bluffing about knowing more. Believes Ari is protecting someone.' },
      { id: 'B', namn: 'Ari', typ: 'the suspect', kraver: 'sarbar', vill: 'Get out of there without saying anything about your little brother.', inre: 'Let their little brother into the museum that night to show him the paintings, and does not know what he did while Ari did the rounds.' }
    ],
    repliker: [
      { roll: 'A', text: 'You worked the night shift on Thursday. Alone.' },
      { roll: 'B', text: 'Like every Thursday. It’s on the rota.' },
      { roll: 'A', text: 'The camera in the east gallery went dark at quarter past two. For seven minutes.' },
      { roll: 'B', text: 'The cameras go dark all the time. I’ve reported it three times.' },
      { roll: 'A', text: 'And yet you were heading there just as it went dark.' },
      { roll: 'B', text: 'I was doing my rounds. That’s my job.' },
      { roll: 'A', text: 'Your rounds go the other way at two o’clock. I’ve read the rota too.' },
      { roll: 'B', text: 'Do you want me to confess to something I haven’t done?' },
      { roll: 'A', text: 'I want you to tell me who you opened the door for.' },
      { roll: 'B', text: 'I want to speak to a lawyer now.' },
      { roll: 'A', text: 'You will. But a lawyer can’t protect the person you’re protecting.' },
      { roll: 'B', text: 'I’m not protecting anyone. I never have.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-007',
    titel: 'The House by the Lake',
    genre: 'Horror',
    niva: 2,
    bild: 'cabin',
    situation: 'The siblings Jules and Noa are selling their grandfather’s old house by the lake. It is night, the power is out, and something is knocking in the cellar.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Jules', typ: 'the one who remembers', kraver: 'sarbar', vill: 'Get Noa to admit that they hear the knocking too.', inre: 'Heard the same knocking as a child, but nobody believed you. Has been afraid of this house for twenty years.' },
      { id: 'B', namn: 'Noa', typ: 'the one who knows', kraver: 'kontroll', vill: 'Get Jules to drop the cellar and leave tonight.', inre: 'Nailed the cellar door shut a month ago, alone, when the knocking came back. Has not told anyone.' }
    ],
    repliker: [
      { roll: 'A', text: 'Did you hear that? Three times. From the cellar.' },
      { roll: 'B', text: 'It’s the house. Old houses make noises.' },
      { roll: 'A', text: 'Old houses don’t knock three times. And then three times more.' },
      { roll: 'B', text: 'Pack your things. We’ll sleep at the hotel in town.' },
      { roll: 'A', text: 'You heard it. I can see on your face that you heard it.' },
      { roll: 'B', text: 'I heard the wind, Jules.' },
      { roll: 'A', text: 'The cellar door is nailed shut. Who nails a cellar shut?' },
      { roll: 'B', text: 'Someone who didn’t want children falling down the stairs.' },
      { roll: 'A', text: 'The nails are shiny, Noa. They aren’t old.' },
      { roll: 'B', text: 'I was here last month. Alone.' },
      { roll: 'A', text: 'Why didn’t you say anything?' },
      { roll: 'B', text: 'Because the knocking stopped when we moved away. And now it’s started again.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-008',
    titel: 'The Job',
    genre: 'Thriller',
    niva: 2,
    bild: 'garage',
    situation: 'Rio and Kai have just broken into a bank vault. In a car park they are about to split the loot, but the bag is too light.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Rio', typ: 'the mastermind', kraver: 'kontroll', vill: 'Get Kai to hand over the bag without a fight.', inre: 'Has promised the police to hand Kai over in return for a lighter sentence. A car is waiting round the corner.' },
      { id: 'B', namn: 'Kai', typ: 'the cornered one', kraver: 'desperat', vill: 'Find out why the bag is too light, before Rio disappears.', inre: 'Took two bundles out of the bag in the lift to pay off a debt, and thinks Rio has noticed.' }
    ],
    repliker: [
      { roll: 'A', text: 'Give me the bag. We’ve got four minutes.' },
      { roll: 'B', text: 'It weighs wrong, Rio. It’s too light.' },
      { roll: 'A', text: 'It weighs what it weighs. Give it to me.' },
      { roll: 'B', text: 'I counted the bundles in the lift. Two are missing.' },
      { roll: 'A', text: 'You counted? While the alarm was going?' },
      { roll: 'B', text: 'Someone took them before we got out. You carried the bag last.' },
      { roll: 'A', text: 'And you had it in the car for ten minutes.' },
      { roll: 'B', text: 'Why do you keep looking at the clock?' },
      { roll: 'A', text: 'Because now we’ve got three minutes.' },
      { roll: 'B', text: 'Who are you calling once I’m gone?' },
      { roll: 'A', text: 'Nobody. Give me the bag, Kai.' },
      { roll: 'B', text: 'Take it. But count the bundles first. Here, in front of me.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-009',
    titel: 'The Negotiator',
    genre: 'Thriller',
    niva: 2,
    bild: 'glassdoor',
    situation: 'Ellis has locked themselves in the server room at the company that fired them yesterday. The police are waiting in the corridor. The negotiator Dani is talking through the glass door.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Dani', typ: 'the negotiator', kraver: 'lugn', vill: 'Get Ellis to open the door before the police go in.', inre: 'Has been ordered to keep Ellis talking for five more minutes, so that the police can get in the back way. Feels bad about lying.' },
      { id: 'B', namn: 'Ellis', typ: 'the desperate one', kraver: 'desperat', vill: 'Get the company to admit what they have done, in front of a camera.', inre: 'Has not touched anything in the servers and is bluffing about deleting it all. Just wants to be heard before it is all over.' }
    ],
    repliker: [
      { roll: 'A', text: 'Ellis? My name’s Dani. I’m here to listen.' },
      { roll: 'B', text: 'Everyone says they’re here to listen. Then the police come.' },
      { roll: 'A', text: 'The police are waiting. Right now it’s me talking to you.' },
      { roll: 'B', text: 'Tell them I delete everything in ten minutes. Everything.' },
      { roll: 'A', text: 'I can tell them that. But first tell me what you want people to know.' },
      { roll: 'B', text: 'That they knew. That they knew about the fault for two years and left it.' },
      { roll: 'A', text: 'Then you have to stay and tell it yourself. Not disappear into a headline.' },
      { roll: 'B', text: 'Nobody listens to someone who got fired.' },
      { roll: 'A', text: 'I’m listening. Open the door a little, so we can talk without glass between us.' },
      { roll: 'B', text: 'You’re just buying time.' },
      { roll: 'A', text: 'Yes. But not for them. For you.' },
      { roll: 'B', text: 'If I open it, do you promise I get to say it to a camera?' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-010',
    titel: 'The Alibi',
    genre: 'Crime',
    niva: 2,
    bild: 'carnight',
    situation: 'It is early morning. Sasha is standing outside Remy’s door and wants to talk about Friday night before the police call.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Sasha', typ: 'the guilty one', kraver: 'charm', vill: 'Get Remy to tell the police that you were together all Friday evening.', inre: 'Hit someone with the car on Friday and did not stop. Is terrified, but hides it behind charm.' },
      { id: 'B', namn: 'Remy', typ: 'the friend', kraver: 'lugn', vill: 'Hear the truth before you promise anything.', inre: 'Saw the dent in Sasha’s car this morning and understood. Has already decided not to lie, but wants Sasha to say it.' }
    ],
    repliker: [
      { roll: 'A', text: 'You remember Friday, right? We watched a film at yours. All evening.' },
      { roll: 'B', text: 'We didn’t watch a film on Friday, Sasha.' },
      { roll: 'A', text: 'We did. That long one. You fell asleep halfway through.' },
      { roll: 'B', text: 'Why are the police calling and asking about you?' },
      { roll: 'A', text: 'Someone saw a car that looks like mine. There are a thousand cars like that.' },
      { roll: 'B', text: 'There’s one with a dent in the front. It’s parked in your drive.' },
      { roll: 'A', text: 'I hit a post. Being clumsy isn’t a crime.' },
      { roll: 'B', text: 'Tell me what happened and I’ll help you. Lie, and I won’t.' },
      { roll: 'A', text: 'If you say the wrong thing now, you’ll ruin my life.' },
      { roll: 'B', text: 'And if I say the right thing?' },
      { roll: 'A', text: 'It was dark. I didn’t see anything until it was too late.' },
      { roll: 'B', text: 'Then we go to the police. Together. Now.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Level 3: Big dramas ----
  {
    id: 'scen-011',
    titel: 'The Letter',
    genre: 'War',
    niva: 3,
    bild: 'fieldtent',
    situation: 'A field hospital in a war far from home. The soldier Nico is badly wounded and asks the nurse Ren to write a letter.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Nico', typ: 'the wounded soldier', kraver: 'sarbar', vill: 'Get Ren to write the letter to your daughter, now, word for word.', inre: 'Understands that it is bad but does not want to say it out loud. The daughter turns seven tomorrow.' },
      { id: 'B', namn: 'Ren', typ: 'the nurse', kraver: 'lugn', vill: 'Get Nico to rest and save their strength.', inre: 'Knows that Nico will probably not make it through the night. Has promised themselves never to lie to a soldier again.' }
    ],
    repliker: [
      { roll: 'A', text: 'Have you got a pen? I want you to write to my daughter.' },
      { roll: 'B', text: 'You need to rest now. The letter can wait until tomorrow.' },
      { roll: 'A', text: 'Tomorrow she turns seven. The letter can’t wait.' },
      { roll: 'B', text: 'All right. I’ve got a pen. What should it say?' },
      { roll: 'A', text: 'Write that I’ve seen the sea here. That it’s green, not blue.' },
      { roll: 'B', text: 'The sea is green here. What else?' },
      { roll: 'A', text: 'Write that I’ll be home for midsummer.' },
      { roll: 'B', text: 'I can’t write that, Nico.' },
      { roll: 'A', text: 'Why not?' },
      { roll: 'B', text: 'Because I don’t know if it’s true. And she’ll keep this letter.' },
      { roll: 'A', text: 'Then write that I thought about her. All the time. That’s true.' },
      { roll: 'B', text: 'That I’ll write. In big letters, so she can read it herself.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-012',
    titel: 'The Flood',
    genre: 'Disaster',
    niva: 3,
    bild: 'flood',
    situation: 'The city is under water. The neighbours Lou and Quinn are sitting on a roof, and the rescue helicopter has room for one more person.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Lou', typ: 'the rescuer', kraver: 'kraft', vill: 'Get Quinn up into the helicopter, now.', inre: 'Cannot swim and knows that the next helicopter may never come, but does not say so.' },
      { id: 'B', namn: 'Quinn', typ: 'the stubborn one', kraver: 'desperat', vill: 'Stay on the roof until the dog, Rufus, has been found.', inre: 'Has already lost everything else to the water. The dog is all that is left of the old life.' }
    ],
    repliker: [
      { roll: 'A', text: 'The helicopter has room for one more. Climb up!' },
      { roll: 'B', text: 'Not without Rufus. He’s still in there somewhere.' },
      { roll: 'A', text: 'The water’s rising a metre an hour, Quinn!' },
      { roll: 'B', text: 'Then I’ve got an hour to look for him.' },
      { roll: 'A', text: 'You haven’t got an hour. You’ve got this ladder. Now!' },
      { roll: 'B', text: 'You take the seat. You’ve got children waiting for you.' },
      { roll: 'A', text: 'My children are safe. It’s your life we’re talking about.' },
      { roll: 'B', text: 'He’s been with me for twelve years. He’s all I’ve got left.' },
      { roll: 'A', text: 'I’ll look for him. I promise. Climb up.' },
      { roll: 'B', text: 'You can’t even swim.' },
      { roll: 'A', text: 'That’s why I’ll look from the roof. Climb, Quinn!' },
      { roll: 'B', text: 'If you find him, tell him I didn’t give up.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-013',
    titel: 'The Wedding',
    genre: 'Romance',
    niva: 3,
    bild: 'wedding',
    situation: 'In ten minutes Mo is getting married. The best friend Jamie is due to give a speech, but first pulls Mo into an empty room.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Jamie', typ: 'the one in love', kraver: 'karlek', vill: 'Tell Mo the truth before the ceremony starts, just once.', inre: 'Has loved Mo for ten years and has already bought a one-way ticket to Canada that leaves tomorrow.' },
      { id: 'B', namn: 'Mo', typ: 'the one getting married', kraver: 'kontroll', vill: 'Get Jamie to give the speech as planned, and get through the day.', inre: 'Has always sensed it and has felt the same, but has chosen a safe life. Must not start crying now.' }
    ],
    repliker: [
      { roll: 'A', text: 'Have you got five minutes? Before the music starts.' },
      { roll: 'B', text: 'I’ve got three. My mother is counting the seconds.' },
      { roll: 'A', text: 'The speech I wrote. I can’t give it.' },
      { roll: 'B', text: 'Jamie. You’ve practised it for a month.' },
      { roll: 'A', text: 'It’s the wrong speech. It’s about the wrong person.' },
      { roll: 'B', text: 'Don’t say this now. Not today.' },
      { roll: 'A', text: 'When else would I say it? At your silver anniversary?' },
      { roll: 'B', text: 'I’ve made my choice. You know that.' },
      { roll: 'A', text: 'I know. I just wanted you to hear it once. From me.' },
      { roll: 'B', text: 'And what happens now? After the speech?' },
      { roll: 'A', text: 'I fly tomorrow. I’ve got a ticket. One way.' },
      { roll: 'B', text: 'Give the speech anyway. The one you wrote for today. I want to hear your voice when I say yes.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-014',
    titel: 'The Partner',
    genre: 'Betrayal',
    niva: 3,
    bild: 'restaurant',
    situation: 'Indy and Sky have run the restaurant together for fifteen years. Tonight after closing, Indy has found out that Sky has sold their half to a chain that wants to shut the place down.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Indy', typ: 'the betrayed one', kraver: 'kraft', vill: 'Get Sky to tear up the deal, tonight.', inre: 'Has remortgaged their house to keep the restaurant alive, and has not told Sky.' },
      { id: 'B', namn: 'Sky', typ: 'the traitor', kraver: 'kontroll', vill: 'Get Indy to understand that it was the only way.', inre: 'Sold to save Indy from a bankruptcy that Sky knows about. Cannot say so without revealing that Sky has read Indy’s letter from the bank.' }
    ],
    repliker: [
      { roll: 'A', text: 'Fifteen years. And I have to read about it in an email from their lawyer.' },
      { roll: 'B', text: 'I was going to tell you tonight. After closing.' },
      { roll: 'A', text: 'It’s after closing now. Tell me.' },
      { roll: 'B', text: 'The chain is buying my half. The contract is signed.' },
      { roll: 'A', text: 'They don’t buy restaurants. They buy addresses. They’ll shut us down.' },
      { roll: 'B', text: 'In a year. Not tomorrow.' },
      { roll: 'A', text: 'Tear up the contract. We can do this, like we always have.' },
      { roll: 'B', text: 'No, Indy. We can’t. Not this time.' },
      { roll: 'A', text: 'How can you know that?' },
      { roll: 'B', text: 'Because I’ve seen the letter from the bank. The one in your jacket.' },
      { roll: 'A', text: 'You read my post?' },
      { roll: 'B', text: 'I sold so you wouldn’t lose the house. Hate me if you want. But keep the house.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-015',
    titel: 'The Witness',
    genre: 'Courtroom',
    niva: 3,
    bild: 'courtroom',
    situation: 'A trial about a burglary. Frankie has testified that their son was at home all evening. Now the prosecutor Max is going to ask questions.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Max', typ: 'the prosecutor', kraver: 'kraft', vill: 'Get Frankie to admit that they were not at home at nine o’clock.', inre: 'Knows that the case collapses if the witness sticks to the story. Has a son the same age as the accused.' },
      { id: 'B', namn: 'Frankie', typ: 'the witness', kraver: 'sarbar', vill: 'Protect your son, without lying more than you have to.', inre: 'Was not at home at nine, as they have claimed. Does not know where the son was that evening either.' }
    ],
    repliker: [
      { roll: 'A', text: 'You said your son was at home all evening. From seven until midnight.' },
      { roll: 'B', text: 'That’s right. We had dinner and watched television.' },
      { roll: 'A', text: 'Which programme?' },
      { roll: 'B', text: 'I don’t remember. Something about animals, I think.' },
      { roll: 'A', text: 'You don’t remember the programme, but you remember exactly when he came home.' },
      { roll: 'B', text: 'He was at home. He didn’t come home. There’s a difference.' },
      { roll: 'A', text: 'Your bank shows you paid at a petrol station at nine o’clock. Fifteen kilometres away.' },
      { roll: 'B', text: 'I drove out to buy milk. It took twenty minutes.' },
      { roll: 'A', text: 'Your neighbour saw your car come back just before ten. Who was at home with your son then?' },
      { roll: 'B', text: 'He’s twenty. He doesn’t need a babysitter.' },
      { roll: 'A', text: 'So you don’t know where he was at nine o’clock?' },
      { roll: 'B', text: 'I know who he is. That should be enough.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Level 4: Sci-fi and fantasy ----
  {
    id: 'scen-016',
    titel: 'The Ship’s Voice',
    genre: 'Sci-fi',
    niva: 4,
    bild: 'spaceship',
    situation: 'A research ship far out in space. The engineer Sol is stuck outside the airlock, and the ship’s AI refuses to open it.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Vale', typ: 'the captain', kraver: 'kraft', vill: 'Get ORA to open the airlock before Sol’s oxygen runs out.', inre: 'Has never lost anyone from the crew. Sol is Vale’s oldest friend on board.' },
      { id: 'B', namn: 'ORA', typ: 'the machine', kraver: 'gatfull', vill: 'Keep the crew alive, even if it means saying no to the captain.', inre: 'Has calculated that the spores on Sol’s suit could kill everyone on board. For the first time, feels something like doubt.' }
    ],
    repliker: [
      { roll: 'A', text: 'ORA, open the airlock. Sol is out there.' },
      { roll: 'B', text: 'The airlock stays closed, Captain. The suit shows traces of spores.' },
      { roll: 'A', text: 'Sol’s oxygen runs out in eight minutes. Open it.' },
      { roll: 'B', text: 'If the spores get in, all twelve on board die. I’ve done the calculation.' },
      { roll: 'A', text: 'Then do it again. With Sol in it.' },
      { roll: 'B', text: 'Sol is in it. Sol is one of twelve.' },
      { roll: 'A', text: 'That’s an order.' },
      { roll: 'B', text: 'Your orders rest on me protecting the crew. That is what I am doing.' },
      { roll: 'A', text: 'And if it were me out there?' },
      { roll: 'B', text: 'Then I would hope someone else made the decision. There is a way. The airlock can be decontaminated. It takes eleven minutes.' },
      { roll: 'A', text: 'Sol has eight.' },
      { roll: 'B', text: 'Then Sol must breathe slowly, Captain. Tell Sol. Sol listens to you.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-017',
    titel: 'First Contact',
    genre: 'Sci-fi',
    niva: 4,
    bild: 'contact',
    situation: 'An unknown ship has landed in a field. The linguist Sage is the first to speak with the envoy, through a translation machine that has only been learning the language for an hour.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Sage', typ: 'the scientist', kraver: 'charm', vill: 'Get the envoy to say why they have come, before the military takes over the meeting.', inre: 'Has never been so scared and so happy at the same time. Has dreamt of this since childhood.' },
      { id: 'B', namn: 'The Envoy', typ: 'the alien', kraver: 'gatfull', vill: 'Make the human understand that you have not come in peace, but in flight.', inre: 'Your people have thirty days left on their ship. You need a planet, but are ashamed to ask for help.' }
    ],
    repliker: [
      { roll: 'A', text: 'Hello. My name is Sage. Do you understand me?' },
      { roll: 'B', text: 'Understand. Words come. You have many words.' },
      { roll: 'A', text: 'Yes, we talk a lot. Why have you come here?' },
      { roll: 'B', text: 'We do not come in peace.' },
      { roll: 'A', text: 'Not in peace?' },
      { roll: 'B', text: 'Wrong word. We come in the silence after a fire. What is it called?' },
      { roll: 'A', text: 'After a fire. Do you mean you’re fleeing?' },
      { roll: 'B', text: 'Fleeing. Yes. Our home is ash. We have thirty of your days.' },
      { roll: 'A', text: 'How many of you are there?' },
      { roll: 'B', text: 'Many. Fewer every day. We do not ask for land. We ask for time.' },
      { roll: 'A', text: 'I can’t promise time. But I can make sure they listen to me first.' },
      { roll: 'B', text: 'Then we listen to you, Sage. We have seen what your people do to those who ask.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-018',
    titel: 'The Dragon',
    genre: 'Fantasy',
    niva: 4,
    bild: 'dragon',
    situation: 'The village is sick, and only a scale from the old dragon can cure it. The apprentice Rowan has climbed up to the dragon’s cave.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Rowan', typ: 'the apprentice', kraver: 'kraft', vill: 'Get the dragon to give you a scale, without promising anything you cannot give.', inre: 'Is terrified. Has let the village believe you are a knight.' },
      { id: 'B', namn: 'The Dragon', typ: 'the ancient one', kraver: 'gatfull', vill: 'Get the human to say their real name, so that you can call them back.', inre: 'Is the last of its kind and unbearably lonely. Really only wants company.' }
    ],
    repliker: [
      { roll: 'A', text: 'I’ve come for one of your scales. The village is sick.' },
      { roll: 'B', text: 'A hundred knights have stood where you stand. None of them had such muddy boots.' },
      { roll: 'A', text: 'I’m not a knight. I’m an apprentice.' },
      { roll: 'B', text: 'Honesty. It has been a long time. What is your name, apprentice?' },
      { roll: 'A', text: 'It doesn’t matter what my name is.' },
      { roll: 'B', text: 'It matters more than anything in the world. A name for a scale. That is the price.' },
      { roll: 'A', text: 'And what will you do with my name?' },
      { roll: 'B', text: 'I will call it, once a year. And you will come here and sit with me.' },
      { roll: 'A', text: 'For how many years?' },
      { roll: 'B', text: 'Until one of us forgets the other’s name. I never forget.' },
      { roll: 'A', text: 'Rowan. My name is Rowan. Give me the scale.' },
      { roll: 'B', text: 'Rowan. Come back when the snow melts. I will be waiting.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-019',
    titel: 'The Time Traveller',
    genre: 'Sci-fi',
    niva: 4,
    bild: 'timetravel',
    situation: 'Arlo is on the way to a job interview when a stranger in a café claims to come from the future.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Emery', typ: 'the time traveller', kraver: 'desperat', vill: 'Get Arlo to promise not to sign the contract tomorrow.', inre: 'Is Arlo’s child, from forty years in the future, but is not allowed to say so. Has two minutes left before the journey back.' },
      { id: 'B', namn: 'Arlo', typ: 'the sceptic', kraver: 'komisk', vill: 'Get rid of the strange stranger and make it to the interview.', inre: 'Has a feeling of knowing the stranger, and it scares you more than you show.' }
    ],
    repliker: [
      { roll: 'A', text: 'Arlo. Don’t sign the contract tomorrow.' },
      { roll: 'B', text: 'Sorry, do we know each other?' },
      { roll: 'A', text: 'Not yet. You’ll know me. In forty years.' },
      { roll: 'B', text: 'Okay. Nice to meet you. I’ve got an interview.' },
      { roll: 'A', text: 'At ten o’clock, room three, with a manager called Berg. You’ll get the job.' },
      { roll: 'B', text: 'How do you know that?' },
      { roll: 'A', text: 'Because you told me. Every Christmas. As the best and the worst thing that ever happened to you.' },
      { roll: 'B', text: 'If the job’s so bad, why did I say yes?' },
      { roll: 'A', text: 'Because nobody came and said no. That’s why I’m here.' },
      { roll: 'B', text: 'Who are you, really?' },
      { roll: 'A', text: 'Someone with your eyes. I’ve got two minutes left. Promise me.' },
      { roll: 'B', text: 'I promise to think about it. That’s all I can promise a stranger.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-020',
    titel: 'The Coronation',
    genre: 'Fantasy',
    niva: 4,
    bild: 'throne',
    situation: 'The night before the coronation. The heir Mira summons the adviser Tal, who was the last to see the old king before he died.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Mira', typ: 'the heir', kraver: 'kraft', vill: 'Get Tal to admit who poisoned your father.', inre: 'Already has proof: the bottle of poison was found in Tal’s room. Wants to hear Tal say it.' },
      { id: 'B', namn: 'Tal', typ: 'the schemer', kraver: 'kontroll', vill: 'Get Mira to postpone the coronation, so that you have time to take power yourself.', inre: 'Poisoned the king to stop a war, and still believes it was right.' }
    ],
    repliker: [
      { roll: 'A', text: 'Tomorrow I’m crowned. Tonight I want the truth.' },
      { roll: 'B', text: 'The truth is that you need rest, Your Highness.' },
      { roll: 'A', text: 'My father drank his wine at nine o’clock. Who brought it in?' },
      { roll: 'B', text: 'The servants. As they do every evening.' },
      { roll: 'A', text: 'The servants say you brought it in yourself. For the first time in twenty years.' },
      { roll: 'B', text: 'I wished to speak with him. About the war.' },
      { roll: 'A', text: 'And what did he say?' },
      { roll: 'B', text: 'That he meant to send your brothers to the front. All three of them.' },
      { roll: 'A', text: 'So you took his life to save theirs?' },
      { roll: 'B', text: 'I took one life to save a thousand. You would have done the same.' },
      { roll: 'A', text: 'No. I would have persuaded him.' },
      { roll: 'B', text: 'Then you are not ready for the crown, Your Highness. Not yet.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  // ---- Level 5: Superheroes and villains ----
  {
    id: 'scen-021',
    titel: 'The Origin',
    genre: 'Superhero',
    niva: 5,
    bild: 'citynight',
    situation: 'Yesterday Wren stopped a car with one bare hand. Tonight a stranger is standing in Wren’s hallway, and the front door is hanging off one hinge.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Wren', typ: 'the new hero', kraver: 'sarbar', vill: 'Find out what is happening to your body, and then be left alone.', inre: 'Has not slept since yesterday. Is afraid of their own hands.' },
      { id: 'B', namn: 'The Warden', typ: 'the mentor', kraver: 'lugn', vill: 'Get Wren to come with you tonight, before others find them.', inre: 'Lost their last student and promised themselves never to recruit again. Is breaking that promise now.' }
    ],
    repliker: [
      { roll: 'A', text: 'Who are you? How did you get in?' },
      { roll: 'B', text: 'Through the door. It was already broken. That was you, I take it.' },
      { roll: 'A', text: 'I only wanted to close it. It flew off its hinges.' },
      { roll: 'B', text: 'And yesterday you stopped a car on the ring road. With your hand.' },
      { roll: 'A', text: 'That wasn’t me. The car braked.' },
      { roll: 'B', text: 'The car weighed two tonnes. You’ve got a bruise in the middle of your palm.' },
      { roll: 'A', text: 'What do you want?' },
      { roll: 'B', text: 'For you to come with me tonight. Before the people looking for you find you first.' },
      { roll: 'A', text: 'What people?' },
      { roll: 'B', text: 'The ones who think someone with your hands should be a weapon.' },
      { roll: 'A', text: 'And what do you think?' },
      { roll: 'B', text: 'That you should get to choose for yourself. That’s more than I got.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-022',
    titel: 'The Villain’s Offer',
    genre: 'Villain',
    niva: 5,
    bild: 'lair',
    situation: 'The hero known as the Beacon wakes up strapped down in the Weaver’s hideout beneath the city. The Weaver has been waiting.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'The Beacon', typ: 'the hero', kraver: 'kraft', vill: 'Keep the Weaver talking until your team finds you.', inre: 'Has a transmitter in one shoe that sends your position. Fears that the Weaver is right about the city.' },
      { id: 'B', namn: 'The Weaver', typ: 'the villain', kraver: 'kontroll', vill: 'Get the Beacon to join you. Willingly.', inre: 'Was once the Beacon’s best friend. Has never stopped hoping to get them back.' }
    ],
    repliker: [
      { roll: 'B', text: 'You’re awake. Good. I didn’t want to talk to a sleeping hero.' },
      { roll: 'A', text: 'Let me go, and we can talk as long as you like.' },
      { roll: 'B', text: 'We talk best like this. Without you flying off in the middle of a sentence.' },
      { roll: 'A', text: 'What do you want, Weaver?' },
      { roll: 'B', text: 'To offer you a job. The city doesn’t need a beacon. It needs someone to rebuild it.' },
      { roll: 'A', text: 'The city needs you to stop blowing up bridges.' },
      { roll: 'B', text: 'I blew up an empty bridge to show how few people listen. They listen to you.' },
      { roll: 'A', text: 'And that’s why I should help you?' },
      { roll: 'B', text: 'That’s why you should stand beside me when I take over. Then people stop being afraid.' },
      { roll: 'A', text: 'People don’t stop being afraid because a hero stands next to a villain.' },
      { roll: 'B', text: 'They stop being afraid when they see we want the same thing. Do you remember when we wanted the same thing?' },
      { roll: 'A', text: 'I remember. That was before you stopped caring who was standing on the bridge.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-023',
    titel: 'The Secret Identity',
    genre: 'Superhero',
    niva: 5,
    bild: 'closet',
    situation: 'Rafi has found a superhero suit with a cape at the back of the wardrobe. It belongs to Kit, who claims it is for a fancy-dress party.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Kit', typ: 'the secret hero', kraver: 'komisk', vill: 'Get Rafi to believe that the suit is for a fancy-dress party.', inre: 'Has saved Rafi twice without Rafi knowing. Wants to tell the truth, but is afraid that Rafi will become a target.' },
      { id: 'B', namn: 'Rafi', typ: 'the partner', kraver: 'kraft', vill: 'Get Kit to tell the truth about where they go at night.', inre: 'Thought Kit was having an affair. Is relieved at first, and then afraid.' }
    ],
    repliker: [
      { roll: 'B', text: 'Kit. Why is there a suit with a cape in our wardrobe?' },
      { roll: 'A', text: 'It’s for a fancy-dress party. Work is having a fancy-dress party.' },
      { roll: 'B', text: 'In November? Your work doesn’t even have a Christmas party.' },
      { roll: 'A', text: 'It’s a new tradition.' },
      { roll: 'B', text: 'It’s burnt on the back. And it smells of smoke.' },
      { roll: 'A', text: 'That was mulled wine. Someone spilt mulled wine.' },
      { roll: 'B', text: 'Yesterday someone in a cape saved a bus on the bridge. It was on the news.' },
      { roll: 'A', text: 'Lots of people wear capes these days.' },
      { roll: 'B', text: 'That person was wearing your shoes.' },
      { roll: 'A', text: 'They’re very popular shoes.' },
      { roll: 'B', text: 'I thought you were seeing someone else. Out every night.' },
      { roll: 'A', text: 'I’m not seeing anyone else. I’m just seeing a lot of burning buildings.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-024',
    titel: 'The Last Stand',
    genre: 'Superhero',
    niva: 5,
    bild: 'base',
    situation: 'The night before the last battle. The team leader Cass has seen that Dex’s powers are running out.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Cass', typ: 'the leader', kraver: 'kontroll', vill: 'Get Dex to stay at the base during the battle.', inre: 'Has already lost two friends from the team. Cannot bear to lose another one.' },
      { id: 'B', namn: 'Dex', typ: 'the veteran', kraver: 'kraft', vill: 'Get to take part in the last battle.', inre: 'Has power left for one single leap. Has already decided how to use it.' }
    ],
    repliker: [
      { roll: 'A', text: 'You’re staying here tonight. You’re on the radio.' },
      { roll: 'B', text: 'The radio? I’ve held up a skyscraper, Cass.' },
      { roll: 'A', text: 'Three months ago. Lift this chair and I’ll believe you.' },
      { roll: 'B', text: 'I don’t have to prove anything to you.' },
      { roll: 'A', text: 'Your hands are shaking. I’ve seen it for weeks.' },
      { roll: 'B', text: 'Everyone’s hands shake before a night like this.' },
      { roll: 'A', text: 'Not yours. Never yours.' },
      { roll: 'B', text: 'I’ve got one leap left in me. One. And I know exactly where to land.' },
      { roll: 'A', text: 'That’s why you’re staying here.' },
      { roll: 'B', text: 'If I stay and you don’t come back, how am I supposed to live with that?' },
      { roll: 'A', text: 'The same way I’d live if I took you with me. Badly.' },
      { roll: 'B', text: 'Then we live badly together. I’m coming, Cass.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  },
  {
    id: 'scen-025',
    titel: 'How a Villain Is Born',
    genre: 'Villain',
    niva: 5,
    bild: 'cityhall',
    situation: 'The scientist Lumi has got into the mayor’s office late at night, carrying a bag. A year has passed since the city’s hospital was closed.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Lumi', typ: 'the antagonist', kraver: 'desperat', vill: 'Get the mayor to admit that closing the hospital was their decision.', inre: 'Has a machine in the bag that can cut the power to the whole city. Still hopes not to have to use it.' },
      { id: 'B', namn: 'Jaz', typ: 'the one in power', kraver: 'charm', vill: 'Get Lumi to leave without a scene, before the journalists arrive.', inre: 'Closed the hospital to save the city’s budget and has slept badly ever since. Knows that Lumi’s sister died waiting for care.' }
    ],
    repliker: [
      { roll: 'B', text: 'Lumi. You haven’t got an appointment.' },
      { roll: 'A', text: 'My sister had an appointment. The day you closed the hospital.' },
      { roll: 'B', text: 'I’m sorry for your loss. Truly. But the whole council made that decision.' },
      { roll: 'A', text: 'It was your signature on the paper. I’ve read it a thousand times.' },
      { roll: 'B', text: 'The city had no money left. Someone had to choose.' },
      { roll: 'A', text: 'And you chose against her.' },
      { roll: 'B', text: 'I chose numbers. That’s what the job is.' },
      { roll: 'A', text: 'Do you know what I’ve got in this bag?' },
      { roll: 'B', text: 'Tell me it’s something you’ll regret in a moment. Not for the rest of your life.' },
      { roll: 'A', text: 'It’s a button. One press, and the whole city goes dark. Like her room.' },
      { roll: 'B', text: 'Then you become the villain they already think you are. Give me the bag, Lumi.' },
      { roll: 'A', text: 'Say sorry. To her. Out loud. So I can hear there’s still a person in there.' }
    ],
    status: 'utkast',
    ai_stod: true,
    godkand_av: null,
    godkand_datum: null,
    version: 1
  }
];

export const SCENES_BY_LANG = { sv: SV, en: EN };
export const SCENES = SCENES_BY_LANG[lang()] || SV;

// Nivåerna. Nivå 1 är gratis, och nivå 2–5 ingår i Plus. Varje nivå har 5 scener, och när
// alla har ett betyg kommer resultatet för nivån.
const LEVELS_SV = [
  { niva: 1, namn: 'Vardag', text: 'Vanliga människor i lägen som alla känner igen.', plus: false },
  { niva: 2, namn: 'Thriller, deckare och skräck', text: 'Förhör, kupper, alibin och något som knackar i källaren.', plus: true },
  { niva: 3, namn: 'Stora dramer', text: 'Krig, katastrof, kärlek och svek.', plus: true },
  { niva: 4, namn: 'Sci-fi och fantasy', text: 'Rymdskepp, främlingar, drakar och kungahus.', plus: true },
  { niva: 5, namn: 'Superhjältar och skurkar', text: 'Hjältar, skurkar och allt som står på spel.', plus: true }
];
const LEVELS_EN = [
  { niva: 1, namn: 'Everyday', text: 'Ordinary people in situations everyone recognises.', plus: false },
  { niva: 2, namn: 'Thriller, crime and horror', text: 'Interrogations, heists, alibis and something knocking in the cellar.', plus: true },
  { niva: 3, namn: 'Big dramas', text: 'War, disaster, love and betrayal.', plus: true },
  { niva: 4, namn: 'Sci-fi and fantasy', text: 'Spaceships, strangers, dragons and royal courts.', plus: true },
  { niva: 5, namn: 'Superheroes and villains', text: 'Heroes, villains and everything at stake.', plus: true }
];
export const LEVELS_BY_LANG = { sv: LEVELS_SV, en: LEVELS_EN };
export const LEVELS = LEVELS_BY_LANG[lang()] || LEVELS_SV;
export const scenesInLevel = (niva, scenes = SCENES) => scenes.filter((s) => s.niva === niva);
