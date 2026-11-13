# Övningssida för skådespelare

En statisk webbsida där man väljer en scen, kontrollerar ljud och ljus och spelar in sig själv. Videon stannar i mobilen och laddas aldrig upp.

Sidan byggs från 9 november 2026 enligt fliken Byggspecifikation i dokumentet "Övningstjänst för skådespelare: analys och plan". Netlify publicerar innehållet i mappen `public/`.

## Tester

Kör `tests/run.sh`. Testerna kontrollerar teknikkollens gränser, scenernas format, hela flödet i Chromium med falsk kamera, att inget skickas över nätet, att inga kakor sätts och att sidan kan installeras som app. iPhone och Safari testas för hand, eftersom testmiljön saknar WebKit.

## Ikon och hemskärm

`public/manifest.json` gör att sidan kan läggas på hemskärmen och öppnas utan adressfält. Ikonen är filmklappan i `design/ikon-filmklappa.png`, som William valde 13 november 2026. Ikonerna i `public/icons/` görs av den bilden med `python3 tools/icons-from-image.py design/ikon-filmklappa.png public/icons`.

## Texter

Alla texter som visas i appen ligger i `public/texts.js`. Efter en ändring där körs `node tools/render-pages.mjs`, som skriver om `public/index.html` och `public/manifest.json` från mallen i `templates/`. Testerna kontrollerar att det är gjort.
