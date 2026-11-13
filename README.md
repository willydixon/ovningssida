# Övningssida för skådespelare

En statisk webbsida där man väljer en scen, kontrollerar ljud och ljus och spelar in sig själv. Videon stannar i mobilen och laddas aldrig upp.

Sidan byggs från 9 november 2026 enligt fliken Byggspecifikation i dokumentet "Övningstjänst för skådespelare: analys och plan". Netlify publicerar innehållet i mappen `public/`.

## Tester

Kör `tests/run.sh`. Testerna kontrollerar teknikkollens gränser, scenernas format, hela flödet i Chromium med falsk kamera, att inget skickas över nätet, att inga kakor sätts och att sidan kan installeras som app. iPhone och Safari testas för hand, eftersom testmiljön saknar WebKit.

## Ikon och hemskärm

`public/manifest.json` gör att sidan kan läggas på hemskärmen och öppnas utan adressfält. Ikonerna i `public/icons/` ritas av `tools/make-icons.mjs` från en SVG. Kör `NODE_PATH=$(npm root -g) node tools/make-icons.mjs` om ikonen ska ändras.
