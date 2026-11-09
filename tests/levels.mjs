// Teknikkollen i webbläsaren med konstgjort ljud och konstgjord bild på kända nivåer.
// Körs med: node tests/levels.mjs

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = 8126;
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// amp: tonens styrka (0–1), gray: bildens gråton, white: andel vitt, speechOnlyAfterMs: tyst först
const cases = [
  { name: 'bra ljud och ljus', amp: 0.1, gray: 120, white: 0, expect: { Ljud: 'Bra ljudnivå', Ljus: 'Bra ljus', Bakgrund: 'Tyst bakgrund' } },
  { name: 'för svagt ljud', amp: 0.005, gray: 120, white: 0, expect: { Ljud: 'För lågt ljud' } },
  { name: 'klippt ljud', amp: 1.2, gray: 120, white: 0, expect: { Toppar: 'Ljudet klipper' } },
  { name: 'mörk bild', amp: 0.1, gray: 25, white: 0, expect: { Ljus: 'För mörkt' } },
  { name: 'motljus', amp: 0.1, gray: 120, white: 0.3, expect: { Ljus: 'Motljus eller för starkt ljus' } }
];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
await sleep(800);
const browser = await chromium.launch();

try {
  for (const c of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript((p) => {
      navigator.mediaDevices.getUserMedia = async () => {
        const ac = new AudioContext();
        const osc = ac.createOscillator();
        osc.frequency.value = 220;
        const gain = ac.createGain();
        // Tyst de första 2,5 sekunderna efter att kontrollen startar, sedan ton.
        gain.gain.value = 0;
        window.__startTone = () => { gain.gain.setValueAtTime(p.amp, ac.currentTime + 2.5); };
        const dest = ac.createMediaStreamDestination();
        osc.connect(gain).connect(dest);
        osc.start();
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const g = canvas.getContext('2d');
        const draw = () => {
          g.fillStyle = `rgb(${p.gray},${p.gray},${p.gray})`;
          g.fillRect(0, 0, 320, 240);
          if (p.white) { g.fillStyle = '#fff'; g.fillRect(0, 0, 320 * p.white, 240); }
          requestAnimationFrame(draw);
        };
        draw();
        const video = canvas.captureStream(30);
        return new MediaStream([...video.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      };
    }, c);
    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.getByRole('button', { name: 'Börja öva' }).click();
    await page.locator('#age-ok').check();
    await page.locator('#age-continue').click();
    await page.locator('.scene').first().click();
    await page.locator('#role-buttons button').first().click();
    await page.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
    await sleep(500);
    await page.evaluate(() => window.__startTone && window.__startTone());
    await page.locator('#run-check').click();
    await page.locator('#check-results').waitFor({ state: 'visible', timeout: 15000 });
    const items = await page.locator('#check-results li .label').allInnerTexts();
    const got = Object.fromEntries(items.map((t) => t.split(': ')));
    for (const [metric, label] of Object.entries(c.expect)) {
      check(got[metric] === label, `${c.name}: ${metric} = ${got[metric]} (väntat ${label})`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla nivåtester gick igenom.');
