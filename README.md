# Övningssida för skådespelare

En statisk webbsida där man väljer en scen, kontrollerar ljud och ljus och spelar in sig själv. Videon stannar i mobilen och laddas aldrig upp.

Sidan byggs från 9 november 2026 enligt fliken Byggspecifikation i dokumentet "Övningstjänst för skådespelare: analys och plan". Netlify publicerar innehållet i mappen `public/`.

## Tester

Kör `npm install` en gång och sedan `tests/run.sh`. Testerna kontrollerar teknikkollens gränser, scenernas format, hela flödet i Chromium med falsk kamera, att inget skickas över nätet, att inga kakor sätts, att sidan kan installeras som app, formulären och räknaren. iPhone och Safari testas för hand, eftersom testmiljön saknar WebKit.

## Fas 2: prissida, anmälan, frågor och räknare

- `pris.html` visar scenpaketen för 99 kr. Knappen Meddela mig räknas och leder till anmälan. Det går inte att köpa än.
- `anmalan.html` och `fragor.html` skickas till Netlify Forms. Formulären fungerar först när formulärdetektering är påslagen i Netlify. Netlify sparar avsändarens IP-adress med varje inskick, och det står i `integritet.html`.
- `netlify/functions/raknare.mjs` räknar visningar och klick per dag i Netlify Blobs, utan kakor och utan IP-adress. Adressen är `/r`.
- `netlify/functions/statistik.mjs` visar antalen på `/statistik?nyckel=…`. Nyckeln sätts som miljövariabeln `STATISTIK_NYCKEL` i Netlify. Utan den är statistiken avstängd.

## Ikon och hemskärm

`public/manifest.json` gör att sidan kan läggas på hemskärmen och öppnas utan adressfält. Ikonen är filmklappan i `design/ikon-filmklappa.png`, som William valde 13 november 2026. Ikonerna i `public/icons/` görs av den bilden med `python3 tools/icons-from-image.py design/ikon-filmklappa.png public/icons`.

## Texter

Alla texter som visas i appen och på sidorna i `templates/` ligger i `public/texts.js`. Efter en ändring där körs `node tools/render-pages.mjs`, som skriver om sidorna i `public/` och `public/manifest.json` från mallarna. Testerna kontrollerar att det är gjort. Informationssidorna (om, ai, integritet, villkor och kontakt) är handskrivna.
