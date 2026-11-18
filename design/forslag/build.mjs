// Bygger tre förslag på hur den riktiga versionen kan se ut: a.html, b.html och c.html.
// Samma innehåll och samma funktioner i alla tre, bara utseendet skiljer.
// Körs med: node design/forslag/build.mjs
//
// Texterna är utkast. Scenerna Samtalet klockan tre och Sista tåget är påhittade
// exempel på nya genrer och inte skrivna än. Bilderna är egna SVG-illustrationer.
// Ikonerna kommer från Lucide (ISC-licens). Typsnitten har SIL Open Font License.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART, camera } from './art.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const iconDir = process.env.LUCIDE_DIR;

const icon = (name, size = 22) => {
  const svg = readFileSync(path.join(iconDir, `${name}.svg`), 'utf8').replace(/<!--.*?-->/s, '').trim();
  return svg.replace('width="24"', `width="${size}"`).replace('height="24"', `height="${size}"`).replace('class="', 'aria-hidden="true" class="ic ');
};

// ---- Innehållet, samma i alla förslag ----
const ACTIVITIES = [
  ['clapperboard', 'Spela en scen', 'Manus och AI-motspelare'],
  ['messages-square', 'Improvisera med AI', 'Ingen text. Bara du och en karaktär.'],
  ['drama', 'En replik, fem sätt', 'Ironiskt, argt, förälskat …'],
  ['audio-lines', 'Uppvärmning', 'Röst, andning och diktion'],
  ['lamp-desk', 'Monolog', 'Din stund i ljuset'],
  ['film', 'Mina tagningar', '12 tagningar, 3 i veckan']
];

const SCENES = [
  ['kitchen', 'Nyckeln', 'Drama', '90 sek', 'Sam och Robin delar lägenhet. Det är sent, och nyckeln till cykelförrådet är borta.', false],
  ['cafe', 'Intervjun', 'Komedi', '75 sek', 'Noor söker jobb på ett kafé. Kim intervjuar och har bråttom.', false],
  ['dinner', 'Beskedet', 'Drama', '90 sek', 'Syskonen dukar inför mammas födelsedag. Mika har något att berätta.', false],
  ['phone', 'Samtalet klockan tre', 'Thriller', '2 min', 'Någon ringer från ditt eget nummer.', true],
  ['train', 'Sista tåget', 'Romantik', '2 min', 'Två främlingar missar samma tåg.', true]
];

// ---- De tre utseendena ----
const THEMES = {
  a: {
    name: 'Förslag A: Premiär',
    tagline: 'Mörkt och filmiskt, som en biosalong när ljuset släcks.',
    fonts: ['fraunces-latin-600-normal', 'fraunces-latin-700-normal', 'fraunces-latin-600-italic', 'inter-latin-400-normal', 'inter-latin-500-normal', 'inter-latin-600-normal', 'inter-latin-700-normal'],
    art: { wall1: '#2a1f17', wall2: '#120d0a', sky1: '#0c2630', sky2: '#14404a', moon: '#f6e6c4', city: '#071318', light: '#f2b544', frame: '#0a0705', lamp: '#2e2118', table: '#0d0907', key: '#f2b544', person: '#050403', machine: '#0d0907', steam: '#f6e6c4', cup: '#3a2a1e', dark1: '#07090c', dark2: '#020304', screen: '#9fd9ff', train: '#0e1418', platform: '#08090a' },
    cam: { bg1: '#1a120c', bg2: '#060403', key: '#f2b544', rim: '#3b7c8c', face: '#2c1f17', faceLit: '#6b4a32', faceDark: '#120c08' },
    css: `
      :root { --bg:#0d0b09; --surface:#1a1612; --surface2:#241e19; --line:rgba(255,236,210,.12); --text:#f6efe6; --muted:#b4a696; --accent:#f2b544; --accent-ink:#1b1306; --accent2:#c8453a; --display:'Fraunces',Georgia,serif; --body:'Inter',system-ui,sans-serif; --radius:18px; }
      .page { background:#050403; }
      .screen { background: radial-gradient(120% 60% at 50% -10%, #2a1d12 0%, var(--bg) 60%); }
      .screen::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.08; background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }
      h1, h2, .display { font-family: var(--display); font-weight: 700; letter-spacing: -.01em; }
      .hero { background: radial-gradient(90% 120% at 85% 0%, rgba(242,181,68,.35), transparent 60%), linear-gradient(160deg, #2b2016, #16110d); border:1px solid rgba(242,181,68,.35); }
      .hero .kicker { color: var(--accent); }
      .tile { background: linear-gradient(180deg, var(--surface2), var(--surface)); border:1px solid var(--line); }
      .tile .ic { color: var(--accent); }
      .btn-primary { background: var(--accent); color: var(--accent-ink); box-shadow: 0 0 30px rgba(242,181,68,.35); }
      .chip.on { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
      .scene-card .img { border-radius: 14px; box-shadow: inset 0 0 0 1px var(--line); }
      .scene-card .img::before, .scene-card .img::after { content:''; position:absolute; left:0; right:0; height:10%; background:#000; z-index:1; }
      .scene-card .img::before { top:0 } .scene-card .img::after { bottom:0 }
      .tag { color: var(--accent); border-color: rgba(242,181,68,.4); }
      .subtitle-line { font-family: var(--body); background: rgba(0,0,0,.55); color:#fff; text-shadow:0 1px 2px #000; }
      .rec { background: rgba(0,0,0,.5); }
      .bar i { background: linear-gradient(90deg, #f2b544, #c8453a); }
      .big-pct { color: var(--accent); font-family: var(--display); }
      .nav { background: #0d0b09; border-top: 1px solid var(--line); }
      .nav .on { color: var(--accent); }
    `
  },
  b: {
    name: 'Förslag B: Studio',
    tagline: 'Ljust, kaxigt och tydligt, med stora rubriker och starka färger.',
    fonts: ['bricolage-grotesque-latin-700-normal', 'bricolage-grotesque-latin-800-normal', 'inter-latin-400-normal', 'inter-latin-500-normal', 'inter-latin-600-normal', 'inter-latin-700-normal'],
    art: { wall1: '#ffd9c7', wall2: '#ffc4ab', sky1: '#fff4e0', sky2: '#ffe2b8', moon: '#ffffff', city: '#ff9b80', light: '#ff4d2e', frame: '#121110', lamp: '#121110', table: '#121110', key: '#ffffff', person: '#121110', machine: '#121110', steam: '#121110', cup: '#ff4d2e', dark1: '#c9c2ff', dark2: '#a99fff', screen: '#ffffff', train: '#121110', platform: '#1f4bff' },
    cam: { bg1: '#e9e4dc', bg2: '#cfc7bb', key: '#ffffff', rim: '#ff4d2e', face: '#8d8073', faceLit: '#b9aa9a', faceDark: '#5f554b' },
    sceneBg: ['#ffd9c7', '#d9d1ff', '#c8f0dc', '#ffeaa0', '#cfe4ff'],
    css: `
      :root { --bg:#f4efe7; --surface:#ffffff; --surface2:#ffffff; --line:#121110; --text:#121110; --muted:#4f4a44; --accent:#ff4d2e; --accent-ink:#ffffff; --accent2:#1f4bff; --display:'Bricolage Grotesque',system-ui,sans-serif; --body:'Inter',system-ui,sans-serif; --radius:22px; }
      .page { background:#e6dfd3; }
      .page > header, .page > header p { color:#121110; }
      .cap { color:#4f4a44; }
      .scene-name, .close, .subtitle small { color:#121110; text-shadow:none; }
      .screen { background: var(--bg); }
      h1, h2, .display { font-family: var(--display); font-weight: 800; letter-spacing: -.035em; }
      .hero { background: var(--accent); color:#fff; border:2.5px solid var(--line); box-shadow: 5px 5px 0 var(--line); }
      .hero .kicker, .hero p, .hero .meta { color:#fff; }
      .hero .btn-primary { background:#121110; color:#fff; box-shadow:none; }
      .tile { background: var(--surface); border:2.5px solid var(--line); box-shadow: 4px 4px 0 var(--line); }
      .tile:nth-child(1) { background:#ffd9c7 } .tile:nth-child(2) { background:#d9d1ff } .tile:nth-child(3) { background:#c8f0dc }
      .tile:nth-child(4) { background:#ffeaa0 } .tile:nth-child(5) { background:#cfe4ff } .tile:nth-child(6) { background:#fff }
      .tile p { color:#2e2a26 }
      .btn-primary { background: var(--accent); color:#fff; border:2.5px solid var(--line); box-shadow: 4px 4px 0 var(--line); }
      .btn-secondary { background:#fff; border:2.5px solid var(--line); box-shadow: 4px 4px 0 var(--line); }
      .chip { border:2px solid var(--line); background:#fff; }
      .chip.on { background:#121110; color:#fff; }
      .scene-card { border:2.5px solid var(--line); box-shadow: 4px 4px 0 var(--line); background:#fff; }
      .scene-card .img { border-radius: 14px; border:2px solid var(--line); }
      .tag { background:#121110; color:#fff; border-color:#121110; }
      .tag.draft { background:#fff; color:#121110; }
      .ai-card, .goal, .listening { background:#fff; color:#121110; border:2.5px solid var(--line); box-shadow: 3px 3px 0 var(--line); }
      .subtitle-line { background:#121110; color:#fff; border-radius: 18px 18px 18px 4px; }
      .rec { background:#fff; color:#121110; border:2px solid var(--line); }
      .stop { border:2.5px solid var(--line); box-shadow: 4px 4px 0 var(--line); }
      .bar { background:#fff; border:2px solid var(--line); }
      .bar i { background: var(--accent); }
      .bar.b2 i { background: var(--accent2); } .bar.b3 i { background:#18b26b; }
      .big-pct { color: var(--accent); font-family: var(--display); }
      .card { background:#fff; border:2.5px solid var(--line); box-shadow: 4px 4px 0 var(--line); }
      .nav { background:#fff; border-top:2.5px solid var(--line); }
      .nav .on { color: var(--accent); }
    `
  },
  c: {
    name: 'Förslag C: Neon',
    tagline: 'Energiskt och färgstarkt, med neonljus som på TikTok.',
    fonts: ['sora-latin-400-normal', 'sora-latin-600-normal', 'sora-latin-700-normal', 'sora-latin-800-normal'],
    art: { wall1: '#2b0f5c', wall2: '#140a35', sky1: '#ff3ea5', sky2: '#6a2bd6', moon: '#fff1fa', city: '#14092e', light: '#3ef0ff', frame: '#0b0820', lamp: '#ff3ea5', table: '#0b0820', key: '#c6ff3e', person: '#07061a', machine: '#0b0820', steam: '#3ef0ff', cup: '#ff3ea5', dark1: '#120a33', dark2: '#05041a', screen: '#3ef0ff', train: '#1a0f45', platform: '#0b0820' },
    cam: { bg1: '#1d0b45', bg2: '#05041a', key: '#ff3ea5', rim: '#3ef0ff', face: '#2a1650', faceLit: '#7a2c86', faceDark: '#0e0828' },
    css: `
      :root { --bg:#0a0820; --surface:rgba(255,255,255,.07); --surface2:rgba(255,255,255,.1); --line:rgba(255,255,255,.14); --text:#f4f2ff; --muted:#aaa4d8; --accent:#ff3ea5; --accent-ink:#fff; --accent2:#3ef0ff; --display:'Sora',system-ui,sans-serif; --body:'Sora',system-ui,sans-serif; --radius:26px; }
      .page { background:#040312; }
      .screen { background:
        radial-gradient(60% 35% at 100% 0%, rgba(255,62,165,.45), transparent 70%),
        radial-gradient(55% 30% at 0% 35%, rgba(62,240,255,.25), transparent 70%),
        radial-gradient(70% 40% at 60% 100%, rgba(122,60,255,.4), transparent 70%), var(--bg); }
      h1, h2, .display { font-family: var(--display); font-weight: 800; letter-spacing: -.03em; }
      .hero { background: linear-gradient(135deg, rgba(255,62,165,.9), rgba(122,60,255,.9)); border:1px solid rgba(255,255,255,.25); box-shadow: 0 12px 40px rgba(255,62,165,.35); }
      .hero .kicker, .hero .meta { color:#fff; opacity:.9 }
      .hero .btn-primary { background:#fff; color:#2a0b52; }
      .tile { background: var(--surface); border:1px solid var(--line); backdrop-filter: blur(10px); }
      .tile .ic { color: var(--accent2); }
      .tile:nth-child(2n) .ic { color: var(--accent); }
      .tile:nth-child(3n) .ic { color: #c6ff3e; }
      .btn-primary { background: linear-gradient(135deg, #ff3ea5, #7a3cff); color:#fff; box-shadow: 0 8px 30px rgba(255,62,165,.45); }
      .btn-secondary { background: rgba(255,255,255,.1); border:1px solid var(--line); }
      .chip { background: rgba(255,255,255,.08); border:1px solid var(--line); }
      .chip.on { background: linear-gradient(135deg, #ff3ea5, #7a3cff); border-color: transparent; }
      .scene-card { background: var(--surface); border:1px solid var(--line); }
      .scene-card .img { border-radius: 18px; box-shadow: 0 0 0 1px rgba(62,240,255,.35), 0 0 24px rgba(62,240,255,.18); }
      .tag { color:#c6ff3e; border-color: rgba(198,255,62,.45); }
      .ai-card, .goal, .listening { background: rgba(10,8,32,.55); border:1px solid rgba(255,255,255,.18); backdrop-filter: blur(14px); }
      .subtitle-line { background: rgba(10,8,32,.6); border:1px solid rgba(62,240,255,.45); box-shadow: 0 0 24px rgba(62,240,255,.25); }
      .rec { background: rgba(10,8,32,.6); border:1px solid rgba(255,255,255,.2); }
      .bar { background: rgba(255,255,255,.08); }
      .bar i { background: linear-gradient(90deg, #ff3ea5, #7a3cff); }
      .bar.b2 i { background: linear-gradient(90deg, #3ef0ff, #3e7bff); } .bar.b3 i { background: linear-gradient(90deg, #c6ff3e, #3ef0a0); }
      .big-pct { background: linear-gradient(90deg, #ff3ea5, #3ef0ff); -webkit-background-clip:text; background-clip:text; color:transparent; font-family: var(--display); }
      .card { background: var(--surface); border:1px solid var(--line); }
      .nav { background: rgba(10,8,32,.75); backdrop-filter: blur(16px); border-top:1px solid var(--line); }
      .nav .on { color: var(--accent); }
    `
  }
};

// ---- Gemensam grund för alla förslag ----
const BASE = `
  * { box-sizing: border-box; margin: 0; }
  body { font-family: var(--body); color: var(--text); -webkit-font-smoothing: antialiased; }
  .page { padding: 28px 20px 40px; width: 430px; }
  .page > header { color: #fff; margin: 0 4px 22px; }
  .page > header h1 { font-size: 30px; line-height: 1.1; }
  .page > header p { margin-top: 8px; font: 500 15px/1.4 'Inter', system-ui, sans-serif; opacity: .8; }
  .cap { font: 600 13px/1 'Inter', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.7); margin: 26px 6px 12px; }
  .screen { position: relative; width: 390px; height: 844px; border-radius: 44px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,.45), 0 0 0 8px #111, 0 0 0 9px #333; }
  .inner { position: absolute; inset: 0; padding: 54px 20px 96px; overflow: hidden; }
  .status { position: absolute; top: 16px; left: 30px; right: 30px; display: flex; justify-content: space-between; font: 600 15px 'Inter', system-ui, sans-serif; z-index: 5; }
  .top { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .top img { width: 34px; height: 34px; border-radius: 9px; }
  .top .name { font: 600 14px var(--body); color: var(--muted); letter-spacing: .02em; }
  .lang { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font: 600 13px var(--body); padding: 7px 11px; border-radius: 999px; border: 1px solid var(--line); }
  h1 { font-size: 34px; line-height: 1.05; }
  .sub { color: var(--muted); margin-top: 6px; font-size: 15px; }
  .hero { border-radius: var(--radius); padding: 18px; margin: 18px 0 16px; position: relative; overflow: hidden; }
  .kicker { display: flex; align-items: center; gap: 6px; font: 700 12px var(--body); letter-spacing: .1em; text-transform: uppercase; }
  .hero p { font-size: 19px; line-height: 1.3; margin: 10px 0 14px; font-weight: 600; }
  .hero .row { display: flex; align-items: center; justify-content: space-between; }
  .meta { color: var(--muted); font-size: 13px; display: inline-flex; gap: 6px; align-items: center; }
  .btn-primary, .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font: 700 15px var(--body); border-radius: 999px; padding: 12px 18px; border: 0; }
  .btn-secondary { color: inherit; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .tile { border-radius: calc(var(--radius) - 4px); padding: 14px; min-height: 104px; display: flex; flex-direction: column; gap: 6px; }
  .tile h3 { font: 700 15px/1.2 var(--body); margin-top: 4px; }
  .tile p { color: var(--muted); font-size: 12.5px; line-height: 1.3; }
  .teaser { margin-top: 14px; display: flex; align-items: center; gap: 10px; border-radius: 16px; padding: 12px 14px; border: 1px solid var(--line); font-size: 13.5px; }
  .teaser b { font-weight: 700; }
  .nav { position: absolute; left: 0; right: 0; bottom: 0; height: 84px; display: flex; justify-content: space-around; padding-top: 12px; font: 600 11px var(--body); color: var(--muted); z-index: 6; }
  .nav span { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .chips { display: flex; gap: 8px; margin: 14px -20px 16px; padding: 0 20px; overflow: hidden; }
  .chip { padding: 8px 14px; border-radius: 999px; font: 600 13px var(--body); border: 1px solid var(--line); white-space: nowrap; }
  .feature .img { position: relative; height: 196px; overflow: hidden; }
  .scene-card { border-radius: var(--radius); padding: 10px; margin-bottom: 12px; }
  .img svg { width: 100%; height: 100%; display: block; }
  .img { position: relative; overflow: hidden; }
  .feature .info { padding: 12px 6px 4px; }
  .feature h2 { font-size: 26px; }
  .feature p { color: var(--muted); font-size: 13.5px; margin: 6px 0 12px; line-height: 1.35; }
  .tags { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .tag { font: 700 11px var(--body); letter-spacing: .06em; text-transform: uppercase; padding: 4px 8px; border-radius: 999px; border: 1px solid var(--line); }
  .row-card { display: flex; gap: 12px; align-items: center; }
  .row-card .img { width: 104px; height: 76px; flex: none; border-radius: 12px; }
  .row-card h3 { font: 700 16px var(--display); }
  .row-card p { color: var(--muted); font-size: 12.5px; margin-top: 3px; line-height: 1.3; }
  .cam { position: absolute; inset: 0; }
  .cam svg { width: 100%; height: 100%; }
  .scene-top { position: absolute; top: 54px; left: 16px; right: 16px; display: flex; align-items: center; gap: 8px; z-index: 3; }
  .rec { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 999px; font: 700 13px var(--body); color: #fff; }
  .rec i { width: 9px; height: 9px; border-radius: 50%; background: #ff3b30; box-shadow: 0 0 10px #ff3b30; }
  .scene-name { font: 600 13px var(--body); color: #fff; opacity: .9; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
  .close { margin-left: auto; color: #fff; }
  .ai-card { position: absolute; top: 104px; left: 16px; right: 16px; border-radius: 18px; padding: 12px; display: flex; gap: 12px; align-items: center; z-index: 3; color: #fff; background: rgba(0,0,0,.45); }
  .avatar { font-style: normal; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font: 800 20px var(--display); background: var(--accent); color: var(--accent-ink); flex: none; }
  .ai-card div b { display: block; font-size: 15px; }
  .ai-card div span { font-size: 12.5px; opacity: .85; line-height: 1.3; display: block; margin-top: 2px; }
  .subtitle { position: absolute; left: 16px; right: 16px; bottom: 214px; z-index: 3; }
  .subtitle small { display: block; font: 700 11px var(--body); letter-spacing: .1em; text-transform: uppercase; color: #fff; opacity: .85; margin: 0 0 6px 4px; text-shadow: 0 1px 2px #000; }
  .subtitle-line { display: inline-block; font-size: 19px; line-height: 1.35; font-weight: 600; padding: 10px 14px; border-radius: 14px; color: #fff; }
  .goal { position: absolute; left: 16px; right: 16px; bottom: 150px; border-radius: 14px; padding: 10px 12px; font-size: 13px; z-index: 3; color: #fff; background: rgba(0,0,0,.4); display: flex; gap: 8px; align-items: center; }
  .listening { position: absolute; left: 16px; bottom: 98px; border-radius: 999px; padding: 8px 14px; font: 600 13px var(--body); z-index: 3; color: #fff; background: rgba(0,0,0,.4); display: inline-flex; gap: 8px; align-items: center; }
  .wave { display: inline-flex; gap: 3px; align-items: center; height: 16px; }
  .wave i { width: 3px; border-radius: 2px; background: var(--accent2); }
  .scene-controls { position: absolute; left: 16px; right: 16px; bottom: 28px; display: flex; gap: 10px; z-index: 3; }
  .stop { flex: 1; display: inline-flex; justify-content: center; align-items: center; gap: 8px; border-radius: 999px; padding: 15px; font: 700 16px var(--body); background: #e5322d; color: #fff; }
  .script-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 15px 16px; font: 600 14px var(--body); color: #fff; background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.25); }
  .result-head { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; margin-bottom: 14px; }
  .big-pct { font-size: 76px; line-height: .9; font-weight: 800; letter-spacing: -.04em; margin-top: 16px; }
  .arche { font: 700 24px/1.1 var(--display); margin-top: 6px; }
  .arche-desc { color: var(--muted); font-size: 14px; margin: 6px 0 16px; line-height: 1.35; }
  .bars { display: grid; gap: 10px; margin-bottom: 18px; }
  .bar-row { display: grid; grid-template-columns: 1fr auto; gap: 6px; font: 600 13.5px var(--body); }
  .bar { grid-column: 1 / -1; height: 10px; border-radius: 999px; background: var(--surface2); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 999px; }
  .card { border-radius: 18px; padding: 14px; margin-bottom: 12px; background: var(--surface); border: 1px solid var(--line); }
  .card h3 { font: 700 13px var(--body); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .heard { display: grid; gap: 9px; font-size: 14px; line-height: 1.35; }
  .heard div { display: flex; gap: 10px; align-items: flex-start; }
  .heard .ic { flex: none; margin-top: 1px; color: var(--accent); }
  .fine { color: var(--muted); font-size: 11.5px; line-height: 1.4; margin: 4px 2px 12px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn-primary, .two .btn-secondary { white-space: nowrap; padding: 12px 10px; font-size: 14px; }
`;

function status(light) {
  return `<div class="status" style="color:${light ? '#fff' : 'var(--text)'}"><span>21:41</span><span>●●● 5G ▮</span></div>`;
}

function nav(active) {
  const items = [['house', 'Hem'], ['clapperboard', 'Scener'], ['sparkles', 'Träna'], ['film', 'Tagningar']];
  return `<nav class="nav">${items.map(([ic, label], i) => `<span class="${i === active ? 'on' : ''}">${icon(ic, 22)}${label}</span>`).join('')}</nav>`;
}

function home(theme) {
  return `<div class="screen">${status(theme !== 'b')}<div class="inner">
    <div class="top"><img src="icon.png" alt=""><span class="name">APPNAMN</span><span class="lang">${icon('globe', 15)}SV</span></div>
    <h1>God kväll.</h1>
    <p class="sub">Redo för en tagning?</p>
    <div class="hero">
      <div class="kicker">${icon('flame', 15)}Dagens utmaning</div>
      <p>Säg ”Jag har aldrig varit här förut” så att vi tror dig. Sedan så att vi inte gör det.</p>
      <div class="row"><span class="btn-primary">Anta utmaningen</span><span class="meta">${icon('timer', 14)}2 min</span></div>
    </div>
    <div class="grid">${ACTIVITIES.map(([ic, title, text]) => `<div class="tile">${icon(ic, 24)}<h3>${title}</h3><p>${text}</p></div>`).join('')}</div>
    <div class="teaser card">${icon('venetian-mask', 22)}<span>Senaste tagningen: <b>55 % Den lugna och farliga</b></span></div>
  </div>${nav(0)}</div>`;
}

function scenes(theme, art) {
  const bgs = THEMES[theme].sceneBg;
  const [first, ...rest] = SCENES;
  const pic = (kind, i) => {
    const svg = ART[kind](art);
    return bgs ? svg.replace(/<rect width="400" height="240" fill="url\(#[^)]+\)"\/>/, `<rect width="400" height="240" fill="${bgs[i % bgs.length]}"/>`) : svg;
  };
  return `<div class="screen">${status(theme !== 'b')}<div class="inner">
    <div class="top"><h1 style="font-size:32px">Scener</h1><span class="lang">${icon('globe', 15)}SV</span></div>
    <div class="chips"><span class="chip on">Alla</span><span class="chip">Drama</span><span class="chip">Komedi</span><span class="chip">Thriller</span><span class="chip">Romantik</span></div>
    <div class="scene-card feature">
      <div class="img">${pic(first[0], 0)}</div>
      <div class="info">
        <div class="tags"><span class="tag">${first[2]}</span><span class="meta">${icon('timer', 13)}${first[3]}</span><span class="meta">${icon('users', 13)}2 roller</span></div>
        <h2 style="margin-top:8px">${first[1]}</h2>
        <p>${first[4]}</p>
        <div class="two"><span class="btn-primary">${icon('messages-square', 17)}Spela med AI</span><span class="btn-secondary">${icon('clapperboard', 17)}Med manus</span></div>
      </div>
    </div>
    ${rest.map(([kind, title, genre, len, text, draft], i) => `<div class="scene-card row-card">
      <div class="img">${pic(kind, i + 1)}</div>
      <div><div class="tags"><span class="tag ${draft ? 'draft' : ''}">${genre}${draft ? ' · Utkast' : ''}</span><span class="meta">${len}</span></div>
      <h3 style="margin-top:6px">${title}</h3><p>${text}</p></div>
    </div>`).join('')}
  </div>${nav(1)}</div>`;
}

function inScene(theme) {
  const bars = [6, 12, 9, 15, 7, 11, 5];
  return `<div class="screen">${status(theme !== 'b')}
    <div class="cam">${camera(THEMES[theme].cam)}</div>
    <div class="scene-top"><span class="rec"><i></i>REC 0:42</span><span class="scene-name">Nyckeln · Tagning 3</span><span class="close">${icon('x', 22)}</span></div>
    <div class="ai-card"><i class="avatar">R</i><div><b>Robin (AI)</b><span>Din rumskamrat. Vill att du berättar sanningen om Alex.</span></div></div>
    <div class="subtitle"><small>Robin (AI)</small><span class="subtitle-line">Nej. Och varför tittar du på mig när du frågar?</span></div>
    <div class="goal">${icon('flame', 16)}<span><b>Du, Sam.</b> Du vill få nyckeln och komma iväg, utan att prata om Alex.</span></div>
    <div class="listening"><span class="wave">${bars.map((h) => `<i style="height:${h}px"></i>`).join('')}</span>Din tur. Robin lyssnar.</div>
    <div class="scene-controls"><span class="script-btn">${icon('clapperboard', 16)}Manus</span><span class="stop">${icon('circle-stop', 18)}Stoppa</span></div>
  </div>`;
}

function style(theme) {
  return `<div class="screen">${status(theme !== 'b')}<div class="inner" style="padding-bottom:20px">
    <div class="result-head">${icon('film', 16)}Nyckeln · Tagning 3<span style="margin-left:auto">${icon('x', 20)}</span></div>
    <h1>Din spelstil</h1>
    <p class="sub">i den här tagningen</p>
    <div class="big-pct">55 %</div>
    <div class="arche">Den lugna och farliga</div>
    <p class="arche-desc">Låg röst och långa pauser. Man vet aldrig vad du ska göra härnäst.</p>
    <div class="bars">
      <div class="bar-row"><span>Den lugna och farliga</span><span>55 %</span><div class="bar"><i style="width:55%"></i></div></div>
      <div class="bar-row"><span>Komikern</span><span>30 %</span><div class="bar b2"><i style="width:30%"></i></div></div>
      <div class="bar-row"><span>Hjälten</span><span>15 %</span><div class="bar b3"><i style="width:15%"></i></div></div>
    </div>
    <div class="card"><h3>Det här hörde vi</h3><div class="heard">
      <div>${icon('timer', 18)}<span>Du pausade 6 gånger. Den längsta pausen var 2,1 sekunder.</span></div>
      <div>${icon('audio-lines', 18)}<span>Lugnt tempo, cirka 2,4 ord i sekunden.</span></div>
      <div>${icon('mic-vocal', 18)}<span>Rösten varierade mest i slutet av scenen.</span></div>
    </div></div>
    <div class="card"><h3>Prova nästa gång</h3><p style="font-size:15px;line-height:1.4">Låt Robin vänta längre innan du svarar om nyckeln.</p></div>
    <p class="fine">Rolltyperna är påhittade och bygger bara på hur du använde rösten. Det är inget betyg.</p>
    <div class="two"><span class="btn-primary">Ta om</span><span class="btn-secondary">Spara tagningen</span></div>
  </div></div>`;
}

function page(theme) {
  const t = THEMES[theme];
  const faces = t.fonts.map((f) => {
    const m = f.match(/^(.*)-latin-(\d+)-(normal|italic)$/);
    const name = m[1].split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    return `@font-face { font-family: '${name}'; font-weight: ${m[2]}; font-style: ${m[3]}; src: url('fonts/${f}.woff2') format('woff2'); }`;
  }).join('\n');
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${t.name}</title>
<style>${faces}\n${BASE}\n${t.css}</style></head>
<body class="page">
  <header><h1>${t.name}</h1><p>${t.tagline}</p></header>
  <p class="cap">1 · Hem</p>${home(theme)}
  <p class="cap">2 · Scener</p>${scenes(theme, t.art)}
  <p class="cap">3 · I scenen med AI-motspelaren</p>${inScene(theme)}
  <p class="cap">4 · Efter tagningen: Din spelstil</p>${style(theme)}
</body></html>`;
}

for (const theme of Object.keys(THEMES)) {
  writeFileSync(path.join(here, `${theme}.html`), page(theme));
}
console.log('Skrev a.html, b.html och c.html.');
