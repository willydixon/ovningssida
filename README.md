# ActWith AI, övningssida för skådespelare

En statisk webbsida där man väljer en scen, kontrollerar ljud och ljus och spelar in sig själv. Videon stannar i mobilen och laddas aldrig upp.

Sidan byggs från 9 november 2026 enligt fliken Byggspecifikation i dokumentet "Övningstjänst för skådespelare: analys och plan". Netlify publicerar innehållet i mappen `public/`.

## Tester

Kör `npm install` en gång och sedan `tests/run.sh`. Testerna kontrollerar teknikkollens gränser, scenernas format, hela flödet i Chromium med falsk kamera, att inget skickas över nätet, att inga kakor sätts, att sidan kan installeras som app, formulären, räknaren och motspelaren. iPhone och Safari testas för hand, eftersom testmiljön saknar WebKit.

## Motspelaren

Under inspelningen kan mobilens inbyggda uppläsningsröst läsa motspelarens repliker (Web Speech API). Logiken finns i `public/partner.js` och kopplas in i `public/app.js`.

- Bara svenska röster som finns i mobilen används. En röst som går via nätet väljs aldrig, eftersom den skulle skicka replikerna iväg. Saknas en svensk röst står repliken bara i texten.
- Rösten låses upp i trycket på Starta inspelning, eftersom iPhone bara läser upp text som startas av ett tryck.
- Sidan mäter ljudstyrkan var 50:e ms för att höra när användaren har sagt sin replik. Bakgrunden mäts under nedräkningen. En kort tystnad (0,9 s) räcker när det mesta av repliken är sagt, annars krävs 2,5 s, så att en paus i spelet inte släpper fram motspelaren. Knappen Nästa replik går alltid vidare direkt.
- Gränserna är startvärden. De behöver provas på riktiga mobiler, särskilt om rösten hörs svagt på iPhone medan mikrofonen är på.
- Testerna i `tests/partner.mjs` och avsnitt 6 i `tests/e2e.mjs` använder en falsk röst och en falsk mikrofon som testet styr.

## Utseendet Premiär och den riktiga versionen

William valde 18 november 2026 utseendet Premiär bland tre förslag (`design/forslag/`), och bad om en större app med mer att göra, fler bilder och mer inlevelse.

- `public/app.css`: mörkt och filmiskt, med guld som accentfärg. Typsnitten Fraunces och Inter ligger i `public/fonts/` (SIL Open Font License). Säkerhetspolicyn tillåter `font-src 'self'`.
- Hemskärmen hälsar efter tiden på dygnet, visar dagens utmaning och övningarna. Menyn längst ned syns på hemskärmen, scenerna och uppvärmningen.
- Dagens utmaning (`public/content.js`) byts varje dag och spelas in som en scen med en roll, utan motspelare.
- Uppvärmningen har fyra steg utan kamera: andning med en cirkel i takt, läppar och tunga, tungvrickare och rösten i rummet.
- Scenerna har egna SVG-bilder i `public/img/`, som `tools/render-pages.mjs` ritar från `tools/scene-art.mjs`, och en genre. Det finns fem scener (utkast): två drama, en komedi, en thriller och en romantik, och de kan väljas efter genre.
- Ikonerna kommer från Lucide (ISC-licens) och ligger i `tools/icons/`. I mallarna skrivs de som `{{icon:namn}}`.
- Improvisera med AI, En replik fem sätt och Monolog finns.
- Appen finns på svenska och engelska (se Språk nedan). Spanska, tyska och franska läggs till på samma sätt.
- Din spelstil (`public/style.js`): under tagningen mäts rösten i mobilen var 50:e ms, styrka och tonhöjd (autokorrelation), men inte medan motspelaren eller AI:n pratar. Efter tagningen visas tempo, pauser, tonhöjd och styrka som iakttagelser utan betyg, hur mycket tagningen liknar fem påhittade spelstilar i procent, och en utmaning: spela nästa tagning som den stil som ligger längst bort. Spelstilarna är utkast, bygger bara på rösten och jämförs aldrig med riktiga skådespelare. Gränserna är startvärden som behöver provas på riktiga mobiler. Testerna finns i `tests/style.mjs` och avsnitt 12 i `tests/e2e.mjs`.
- Mina tagningar (`public/takes.js`) sparar tagningar som användaren väljer att spara i webbläsarens databas (IndexedDB) i mobilen. Inget laddas upp. Gratis får 3 tagningar plats, Plus obegränsat. Ingen tagning tas bort utan att användaren själv bekräftar det.

## AI-motspelaren (test)

William valde 15 november 2026 att testa en AI-motspelare från ElevenLabs, som lyssnar och svarar med naturlig röst.

- `netlify/functions/ai-start.mjs` svarar på `/api/ai-start`. Den hämtar en länk som gäller ett samtal, med nyckeln i den hemliga miljövariabeln `ELEVENLABS_API_KEY` i Netlify. Utan nyckel syns inte valet på sidan.
- Första gången skapar funktionen två AI-motspelare hos ElevenLabs: `ovningssida-motspelare-v1` för gratis (rösten Eleven Flash v2.5, högst 240 sekunder per samtal) och `ovningssida-motspelare-plus-v1` för Plus (rösten Eleven v4 Turbo, högst 600 sekunder). Båda pratar svenska, använder Gemini 2.5 Flash som språkmodell och sparar inget ljud. Ändras inställningarna byts versionen i namnet.
- `public/ai-partner.js` skickar mikrofonens ljud som 16-bitars PCM med 16 000 prover per sekund och spelar upp AI:ns röst. Scenen, rollen och första repliken skickas när samtalet startar. Medan AI:n pratar skickas tystnad, eftersom inspelningen saknar ekoreducering och AI:n annars skulle höra sig själv. Därför går det inte att avbryta AI:n.
- Sidans säkerhetspolicy tillåter anrop till den egna sidan och `wss://*.elevenlabs.io`, men inget annat.
- Innan andra än William får använda den behövs svar i juristfrågan och en genomgång av ElevenLabs villkor och datahantering.

## Plus (testläge med Stripe)

William valde 18 november 2026 Plus för 99 kr i månaden, med köp i testläge hos Stripe först.

- Gratis: alla övningar, nivå 1 med 5 scener, betyg och resultat, mobilens röst som motspelare, 5 AI-minuter att prova och tagningar upp till 3 minuter. Plus: nivå 2–5 med 20 scener till, 60 AI-minuter i månaden, den mer levande AI-rösten, samtal och tagningar upp till 10 minuter och obegränsat i Mina tagningar.
- `netlify/functions/plus.mjs` svarar på `/api/plus/*`: `info`, `checkout` (Stripes betalsida), `activate` (efter betalningen), `status`, `portal` (Stripes kundsida för kort och uppsägning), `aterstall` och `kod` (återställningskoden) och `angra` (ångerknappen). Gemensam kod finns i `netlify/lib/plus.mjs`.
- Priset och inställningarna för Stripes kundsida skapas av funktionen första gången och hittas sedan igen, så inget behöver ställas in för hand hos Stripe.
- Efter köpet får mobilen en licenskod, underskriven med `LICENSE_SECRET`. Den innehåller prenumerationens och kundens nummer hos Stripe, aldrig e-post, och kontrolleras mot Stripe minst en gång per dygn.
- AI-minuterna räknas i Netlify Blobs (`ai-minuter`): per prenumeration och kalendermånad för Plus, och för alla gratisanvändare tillsammans per dygn (`FREE_AI_SECONDS_PER_DAY`, 1 800 sekunder om inget annat anges). När ett samtal startar reserveras tid. `netlify/functions/ai-end.mjs` frågar sedan ElevenLabs hur långt samtalet blev och lämnar tillbaka resten. De 5 gratisminuterna per person räknas i mobilen.
- Återställ Plus: efter köpet får man en återställningskod (16 tecken i Crockfords base32, 80 slumpade bitar). Den visas på Plus-sidan och sparas i mobilen. Hos Stripe sparas bara ett kontrollvärde (sha-256) i prenumerationens metadata (`kod`). På en ny mobil skriver man in koden, och `aterstall` letar upp prenumerationen med Stripes sökning, som kan ta upp till en minut på sig efter ett köp. `kod` skapar en ny kod, och då slutar den gamla att fungera.
- Ångerknappen finns längst ned på varje sida (`?angra=1`) och på Plus-sidan. Inom 14 dagar avslutas Plus direkt och hela beloppet betalas tillbaka. Efter 14 dagar sägs Plus upp till periodens slut. Namnet och tiden sparas hos Stripe.
- Miljövariabel i Netlify: `STRIPE_SECRET_KEY` (börjar med `sk_test_` i testläge). Utan den går det inte att köpa, och Plus-sidan säger det. Nyckeln som licenskoderna skrivs under med skapas av funktionen första gången och sparas i Netlify Blobs (`hemlis/licens`), om inte `LICENSE_SECRET` är satt. Netlify sa nej när nyckeln skulle märkas som hemlig via API:t 18 november 2026, kanske för att det kräver en dyrare plan. Som vanlig miljövariabel syns den för den som har tillgång till Netlify-kontot, men aldrig på sidan.
- Innan något säljs på riktigt: säljarens namn, organisationsnummer, adress, e-post och telefon i `kopvillkor.html`, F-skatt och moms, en jurist som läser köpvillkoren, och en bekräftelse av ångern på e-post (ett varaktigt medium). I appar från App Store och Google Play måste köp i stället göras med deras egna betalsystem.
- Testerna i `tests/plus.mjs` använder en låtsas-Stripe, och avsnitt 10 i `tests/e2e.mjs` går igenom köpet, minuterna, kundsidan och ångern i webbläsaren.

## Betyg, nivåer och resultat

William bad 20 november 2026 om betyg för olika roller, häftigare roller på högre nivåer (som superhjälte och antagonist), minst 5 scener innan man får ett resultat med en sammanfattning, och svar på om man passar för mindre eller större roller. Han valde betyg 1–10, att nivå 2–5 ingår i Plus, och alla fyra sorters scener.

- Scenerna (`public/scenes.js`) ligger i fem nivåer med 5 scener var: 1 Vardag (gratis), 2 Thriller, deckare och skräck, 3 Stora dramer, 4 Sci-fi och fantasy, 5 Superhjältar och skurkar. Alla 20 nya scener är utkast skrivna med AI-stöd, med påhittade figurer, och ska godkännas av en kunnig person. Bilderna ritas i `tools/scene-art.mjs`.
- Varje roll har en typ (till exempel skurken) och ett krav (`kraver`), en av förinställningarna i `public/rating.js`: var tempo, pauser, dynamik, melodi, energi och ansiktets uttryck bör ligga för rollen, på skalan 0–1.
- Betyget (`rateTake`) jämför rösten från Din spelstil och ansiktet, om användaren har sagt ja, med rollens krav. Rösten väger 70 % och ansiktet 30 % när ansiktet har mätts. Blicken nere i texten mer än 40 % av tiden drar ned upp till ett steg. Två tips och en styrka visas efter tagningen.
- Det bästa betyget för varje scen sparas i mobilens `localStorage` (`provspelning`), bara som siffror. När alla fem scener i en nivå har betyg visar `levelResult` snittet, starkaste och svagaste rollen, bredden (hur mycket rösten ändrades mellan rollerna jämfört med hur olika rollerna är), det som återkommer, och större roller, mindre roller eller grunden först. Sammanfattningen skrivs av fasta regler i mobilen, inte av en språkmodell.
- Alla gränser är startvärden. De behöver provas på riktiga mobiler och av kunniga personer innan betyget kan sägas betyda något mer än en fingervisning, och det står på sidan.
- Plus-nivåerna låses i mobilen, som de andra Plus-sakerna. Scenernas text finns i `scenes.js` och går alltså att läsa för den som letar. Det räcker för testversionen. I apparna bör låsningen göras mot köpet hos App Store och Google Play.
- Testerna: `tests/rating.mjs` (betyget och resultatet), enhetstesterna (nivåerna och rollernas krav) och avsnitt 14–15 i `tests/e2e.mjs` (fem tagningar, resultatet, rensa, och nivåerna med Plus).

## Ansiktets spel

William svarade inte på frågan om ansiktet 20 november 2026. Det byggdes enligt rekommendationen: AI:n mäter hur ansiktet spelar, bara om användaren säger ja, och utseendet får aldrig något betyg. Ett betyg på utseendet går inte att lita på, blir ofta orättvist mot till exempel hudfärg, ålder och kön, och behöver en jurist först.

- `public/face.js` använder MediaPipe Face Landmarker från Google (`@mediapipe/tasks-vision` 1.2.3, Apache-2.0), som ligger oförändrad i `public/vendor/mediapipe/` med sin licens. Allt körs i mobilen. Inga bilder sparas eller skickas.
- Under tagningen läses ansiktets uttryck (blendshapes) av fem gånger i sekunden. Att prata, blinka och titta åt sidan räknas inte som uttryck. Efter tagningen finns bara två siffror kvar: `uttryck` (hur mycket ansiktet spelade) och `blickNere` (hur ofta blicken var nere i texten). Inga känslor gissas. EU:s AI-förordning har särskilda regler för system som tolkar känslor, och juristen bör bekräfta att det här inte räknas dit. Syns ansiktet mindre än halva tiden räknas det inte alls.
- Modellen `face_landmarker.task` (ungefär 3,6 MB) kunde inte hämtas härifrån och läggs in för hand i `public/vendor/mediapipe/`. Den finns hos Google: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task. Kör sedan `node tools/render-pages.mjs`, som skriver `models.json`. Utan modellen visas inte frågan om ansiktet, och betyget bygger bara på rösten.
- Läs Googles modellkort för Face Landmarker innan sidan öppnas för alla. Juristen bör också titta på ansiktsanalysen, även om den körs i mobilen.
- Sidans säkerhetspolicy tillåter `wasm-unsafe-eval`, som MediaPipe behöver. Första gången laddas upp till 19 MB: MediaPipe 15 MB och modellen 3,6 MB. Det laddas bara efter ett ja.

## Säkerhet och automatiska tester

En säkerhetsgranskning gjordes 23 november 2026, efter en video om Claude-tillägg som William skickade. Det som rättades:

- Säkerhetshuvudet i `netlify.toml` gäller tillsammans med varje sidas egen policy. Det saknade `'wasm-unsafe-eval'`, så ansiktsanalysen hade stoppats på den riktiga sidan. Ett enhetstest kontrollerar nu att huvudet tillåter allt som sidorna tillåter, och testservern (`tests/server.mjs`) sätter samma huvuden som Netlify, så att webbläsartesterna ser samma policy som den riktiga sidan.
- `/api/ai-end` gav tillbaka tid för vilket samtal som helst med samma AI-motspelare. Nu måste samtalet ha startat efter att tiden reserverades och inom en kvart, och varje samtal räknas bara en gång. Annars dras hela den reserverade tiden.
- Köpknappen och kundsidan följer bara länkar till Stripe eller den egna sidan.
- Nya huvuden: `Strict-Transport-Security` och `Cross-Origin-Opener-Policy`.

Det som kontrollerades och var i ordning: inga nycklar eller personuppgifter i repot eller dess historik, inga beroenden med kända sårbarheter (`npm audit`), licenskoden skrivs under med HMAC och jämförs på konstant tid, återställningskoden har 80 slumpade bitar och sparas bara som kontrollvärde, alla anrop som ändrar något kräver licenskoden i ett huvud (skyddar mot CSRF), ingen text sätts som HTML i sidan, och säkerhetspolicyn stoppar inline-skript, eval, inbäddning i andra sidor och anrop till andra adresser än ElevenLabs.

Kvar att bestämma eller göra:

- Repot på GitHub är publikt. Alla kan läsa koden, README och scenerna, även de som ingår i Plus. Det bör bli privat innan sidan öppnas, om Netlify kan fortsätta hämta det.
- Funktionerna har ingen gräns för hur ofta de anropas. Gratispotten med AI-minuter (30 minuter per dygn för alla tillsammans) kan tömmas av någon som rensar sin mobil gång på gång.
- Webbläsaren skickar AI-motspelarens instruktioner (scenen och rollen) till ElevenLabs. Någon som vet hur kan byta ut dem i sitt eget samtal. Det kostar bara den personens minuter.

Testerna körs på GitHub vid varje ändring (`.github/workflows/tester.yml`), med åtgärderna låsta till exakta versioner. Innan något läggs ut: alla tester gröna, skärmbilder av det som ändrats, och ett ja från William.

## Anmälan och frågor

Appen var helt gratis från 15 november 2026, enligt Williams beslut, och fick Plus som tillval 18 november 2026. Det som är gratis finns kvar för alla.

- `anmalan.html` och `fragor.html` skickas till Netlify Forms. Formulärdetekteringen slogs på i Netlify 15 november 2026, och formulären fungerar från första publiceringen efter det. Netlify sparar avsändarens IP-adress med varje inskick, och det står i `integritet.html`.
- `?fran=` i länken till anmälan sparas med anmälan, till exempel `?fran=tiktok`, så att vi ser var folk kommer ifrån.

## Ikon och hemskärm

`public/manifest.json` gör att sidan kan läggas på hemskärmen och öppnas utan adressfält. Ikonen är filmklappan i `design/ikon-filmklappa.png`, som William valde 13 november 2026. Ikonerna i `public/icons/` görs av den bilden med `python3 tools/icons-from-image.py design/ikon-filmklappa.png public/icons`.

## Texter

Alla texter som visas i appen och på sidorna i `templates/` ligger i `public/texts.js`. Efter en ändring där körs `node tools/render-pages.mjs`, som skriver om sidorna i `public/` och `public/en/` och deras `manifest.json` från mallarna. Testerna kontrollerar att det är gjort. Informationssidorna (om, ai, integritet, villkor, kopvillkor och kontakt) är handskrivna, en gång per språk.

## Språk

William bestämde 18 november 2026 att appen ska finnas på alla språk, med svenska och engelska först och sedan spanska, tyska och franska.

- De svenska sidorna ligger i `public/` och de engelska i `public/en/`. Skript, stil, ikoner, typsnitt och bilder är gemensamma och ligger i `public/`. I mallarna skrivs vägen till dem som `{{@root}}`, sidans mapp som `{{@base}}` och sidan på det andra språket som `{{@other}}`.
- Sidans språk står i `<html lang>`, och `t()` i `texts.js` använder det. Scenerna (`scenes.js`), övningarna (`content.js`) och spelstilarna (`style.js`) finns på varje språk med samma id och samma uppbyggnad, och testerna kontrollerar det.
- På engelska pratar AI-motspelaren engelska, mobilens röst är en engelsk röst i mobilen, och Stripes betalsida och kundsida är på engelska och går tillbaka till de engelska sidorna.
- Hemskärmen har en länk till det andra språket. Formulären skickar med vilket språk sidan var på.
- De engelska texterna är utkast, översatta från de svenska. Tungvrickarna är engelska klassiker.
- Appen heter ActWith AI på båda språken, i rubriken, flikens namn och namnet under ikonen. Varumärke (PRV och EU) och domän är inte kollade än. Interna namn som Stripes `app: ovningssida`, AI-agenternas namn och återställningskodernas salt ändras inte, eftersom köpta Plus och sparade koder annars slutar fungera.
