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

- Gratis: alla övningar, mobilens röst som motspelare, 5 AI-minuter att prova och tagningar upp till 3 minuter. Plus: 60 AI-minuter i månaden, den mer levande AI-rösten, samtal och tagningar upp till 10 minuter och obegränsat i Mina tagningar.
- `netlify/functions/plus.mjs` svarar på `/api/plus/*`: `info`, `checkout` (Stripes betalsida), `activate` (efter betalningen), `status`, `portal` (Stripes kundsida för kort och uppsägning), `aterstall` och `kod` (återställningskoden) och `angra` (ångerknappen). Gemensam kod finns i `netlify/lib/plus.mjs`.
- Priset och inställningarna för Stripes kundsida skapas av funktionen första gången och hittas sedan igen, så inget behöver ställas in för hand hos Stripe.
- Efter köpet får mobilen en licenskod, underskriven med `LICENSE_SECRET`. Den innehåller prenumerationens och kundens nummer hos Stripe, aldrig e-post, och kontrolleras mot Stripe minst en gång per dygn.
- AI-minuterna räknas i Netlify Blobs (`ai-minuter`): per prenumeration och kalendermånad för Plus, och för alla gratisanvändare tillsammans per dygn (`FREE_AI_SECONDS_PER_DAY`, 1 800 sekunder om inget annat anges). När ett samtal startar reserveras tid. `netlify/functions/ai-end.mjs` frågar sedan ElevenLabs hur långt samtalet blev och lämnar tillbaka resten. De 5 gratisminuterna per person räknas i mobilen.
- Återställ Plus: efter köpet får man en återställningskod (16 tecken i Crockfords base32, 80 slumpade bitar). Den visas på Plus-sidan och sparas i mobilen. Hos Stripe sparas bara ett kontrollvärde (sha-256) i prenumerationens metadata (`kod`). På en ny mobil skriver man in koden, och `aterstall` letar upp prenumerationen med Stripes sökning, som kan ta upp till en minut på sig efter ett köp. `kod` skapar en ny kod, och då slutar den gamla att fungera.
- Ångerknappen finns längst ned på varje sida (`?angra=1`) och på Plus-sidan. Inom 14 dagar avslutas Plus direkt och hela beloppet betalas tillbaka. Efter 14 dagar sägs Plus upp till periodens slut. Namnet och tiden sparas hos Stripe.
- Miljövariabel i Netlify: `STRIPE_SECRET_KEY` (börjar med `sk_test_` i testläge). Utan den går det inte att köpa, och Plus-sidan säger det. Nyckeln som licenskoderna skrivs under med skapas av funktionen första gången och sparas i Netlify Blobs (`hemlis/licens`), om inte `LICENSE_SECRET` är satt. Netlify sa nej när nyckeln skulle märkas som hemlig via API:t 18 november 2026, kanske för att det kräver en dyrare plan. Som vanlig miljövariabel syns den för den som har tillgång till Netlify-kontot, men aldrig på sidan.
- Innan något säljs på riktigt: säljarens namn, organisationsnummer, adress, e-post och telefon i `kopvillkor.html`, F-skatt och moms, en jurist som läser köpvillkoren, och en bekräftelse av ångern på e-post (ett varaktigt medium). I appar från App Store och Google Play måste köp i stället göras med deras egna betalsystem.
- Testerna i `tests/plus.mjs` använder en låtsas-Stripe, och avsnitt 10 i `tests/e2e.mjs` går igenom köpet, minuterna, kundsidan och ångern i webbläsaren.

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
