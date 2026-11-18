// Scenerna i testversionen. Alla är utkast som AI har hjälpt till att skriva.
// En kunnig person ska godkänna varje scen innan sidan öppnas för alla.
// Format: se fliken Byggspecifikation, avsnittet Scenformat. genre visas på kortet, och
// bild är namnet på bilden i public/img/, som tools/render-pages.mjs skapar.

import { lang } from './texts.js';

const SV = [
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

// Samma scener på engelska, med samma id, roller och bilder. Utkast, översatta från de svenska.
const EN = [
  {
    id: 'scen-001',
    titel: 'The Key',
    genre: 'Drama',
    bild: 'kitchen',
    situation: 'Sam and Robin share a flat. It is late in the evening, and the key to the bike shed is gone.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Sam', vill: 'Get the key and get going, without having to talk about Alex.', inre: 'Has not told the whole truth about Alex and is a little ashamed of it.' },
      { id: 'B', namn: 'Robin', vill: 'Get Sam to tell the truth about Alex before the key turns up.', inre: 'Has had the key in a jacket pocket the whole time. Is hurt that Sam is lying, but does not want to show it straight away.' }
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
    bild: 'cafe',
    situation: 'Noor is applying for a job at a café. Kim is doing the interview and is in a hurry.',
    langd_sekunder: 75,
    roller: [
      { id: 'A', namn: 'Kim', vill: 'Find someone who can handle stress, in ten minutes.', inre: 'Has two staff off sick and desperately needs someone, but does not want to show it.' },
      { id: 'B', namn: 'Noor', vill: 'Get the job, without pretending to be someone else.', inre: 'Needs the job to pay the rent. Nervous, but honest and a little funny once she relaxes.' }
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
    bild: 'dinner',
    situation: 'The siblings Mika and Jo are setting the table for their mother’s birthday. Mika has something to tell.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Mika', vill: 'Tell Jo about Oslo before Mum arrives, without ruining the evening.', inre: 'Has already signed the contract and is afraid Jo will feel abandoned.' },
      { id: 'B', namn: 'Jo', vill: 'Find out what Mika is hiding, and make the evening nice for Mum.', inre: 'Has done most of the caring for Mum and is afraid of being left alone with the responsibility.' }
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
    bild: 'phone',
    situation: 'It is three in the morning. Charlie’s phone rings, and the screen shows Charlie’s own number.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Charlie', vill: 'Find out who is calling, without showing how scared you are.', inre: 'Is home alone and has not slept properly since their sibling Eli disappeared after a fight a year ago. Has searched every day.' },
      { id: 'B', namn: 'The Voice', vill: 'Get Charlie to go to the window before the call ends.', inre: 'Is Charlie’s sibling Eli, who disappeared a year ago after a fight. Is calling from a number that looks like Charlie’s own, so that Charlie will not hang up. Is afraid that Charlie is still angry, and therefore plays with the mystery a little too long.' }
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
    bild: 'train',
    situation: 'The last train has just left. Juno and Billie are still standing on the platform, and the next train leaves in five hours.',
    langd_sekunder: 90,
    roller: [
      { id: 'A', namn: 'Juno', vill: 'Get Billie to stay and talk, without seeming desperate.', inre: 'Missed the train on purpose to avoid coming home to an empty flat. Gets funny when nervous.' },
      { id: 'B', namn: 'Billie', vill: 'Get away from there, though something makes you stay.', inre: 'Proposed tonight and got a no. Is still holding the ring and does not want to cry in front of a stranger.' }
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
  }
];

export const SCENES_BY_LANG = { sv: SV, en: EN };
export const SCENES = SCENES_BY_LANG[lang()] || SV;
