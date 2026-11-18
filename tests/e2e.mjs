// Automatiska tester för testversionen. Körs med: node tests/e2e.mjs
// Startar en lokal server för public/ och går igenom flödet i Chromium med
// falsk kamera och mikrofon. Kontrollerar också att inget skickas över nätet.

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES } from '../public/scenes.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = 8123;
const BASE = `http://localhost:${PORT}`;

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
await sleep(800);

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']
});

try {
  // ---- 1. Flödet från start till sparad video ----
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await context.route('**/api/ai-start**', (route) => route.fulfill({ json: { available: false } })); // som utan nyckel i Netlify
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  let bytes = 0;
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('response', async (r) => { try { bytes += (await r.body()).length; } catch { /* omdirigering */ } });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  // Räkna anrop till kameran för att visa att 18-årsspärren håller.
  await page.addInitScript(() => {
    window.__gum = 0;
    const md = navigator.mediaDevices;
    if (md && md.getUserMedia) {
      const orig = md.getUserMedia.bind(md);
      md.getUserMedia = (c) => { window.__gum += 1; return orig(c); };
    }
  });

  await page.goto(`${BASE}/index.html`);
  check(bytes < 500 * 1024, `Sidvikt vid första besöket: ${Math.round(bytes / 1024)} kB (gräns 500 kB)`);
  await page.locator('.tile[data-action="play-scenes"]').click();
  check(await page.locator('#age-continue').isDisabled(), '18 år: Fortsätt är spärrad innan rutan är ikryssad');
  check((await page.evaluate(() => window.__gum)) === 0, '18 år: kameran har inte startats före bekräftelsen');
  await page.locator('#age-ok').check();
  await page.locator('#age-continue').click();

  await page.locator('.scene').first().click();
  check(await page.locator('#role-pick').isVisible(), 'Scen: rollvalet visas');
  check((await page.locator('.scene .badge').count()) === SCENES.length, `Scen: alla ${SCENES.length} scener är märkta som utkast`);
  await page.locator('#role-buttons button').first().click();
  await page.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  check((await page.evaluate(() => window.__gum)) === 1, 'Kameran startade först efter rollvalet');

  await page.locator('#run-check').click();
  await page.locator('#check-results').waitFor({ state: 'visible', timeout: 15000 });
  const results = await page.locator('#check-results li').allInnerTexts();
  check(results.length === 5, `Teknikkoll: ${results.length} resultat visas`);
  console.log('     ' + results.map((r) => r.replace(/\n/g, ' – ')).join('\n     '));

  await page.getByRole('button', { name: 'Till inspelningen' }).click();
  await page.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check((await page.locator('#script .mine').count()) > 0, 'Inspelning: dina repliker är markerade');
  await page.locator('#start-rec').click();
  await page.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  await sleep(3000);
  await page.locator('#stop-rec').click();
  await page.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  const src = await page.locator('#playback').getAttribute('src');
  check(!!src && src.startsWith('blob:'), 'Titta: tagningen spelas upp från mobilens minne (blob)');

  await page.getByRole('button', { name: 'Spara' }).click();
  await page.locator('[data-screen="save"]').waitFor({ state: 'visible' });
  const download = await page.locator('#download-link').getAttribute('download');
  check(/^tagning-\d{8}-\d{4}\.(mp4|webm)$/.test(download || ''), `Spara: filnamn ${download}`);
  const size = await page.evaluate(async () => {
    const href = document.querySelector('#download-link').href;
    const r = await fetch(href).catch(() => null); // blockeras av säkerhetspolicyn, vilket är rätt
    return r ? (await r.blob()).size : -1;
  });
  check(size === -1, 'Säkerhetspolicyn stoppar fetch även mot blob-adresser');

  // Ingen video lämnar mobilen: bara GET mot den egna servern, inga andra domäner.
  const foreign = requests.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'));
  const nonGet = requests.filter((r) => r.method !== 'GET');
  check(foreign.length === 0, `Inga anrop till andra adresser (${foreign.length})`);
  check(nonGet.length === 0, `Inga anrop som skickar data (${nonGet.length})`);
  const cookies = await context.cookies();
  check(cookies.length === 0, 'Inga kakor sätts');
  const cspErrors = consoleErrors.filter((e) => /Content Security Policy/i.test(e) && !/connect-src|Refused to connect/i.test(e));
  check(cspErrors.length === 0, `Inga andra blockeringar av säkerhetspolicyn (${cspErrors.join(" | ") || "inga"})`);
  const otherErrors = consoleErrors.filter((e) => !/Content Security Policy|connect-src|Failed to fetch/i.test(e));
  check(otherErrors.length === 0, `Inga skriptfel (${otherErrors.join(' | ') || 'inga'})`);
  await context.close();

  // ---- 2. Nekad kamera ger hjälp ----
  const denied = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await denied.newPage();
  await p2.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('nej', 'NotAllowedError'));
  });
  await p2.goto(`${BASE}/index.html`);
  await p2.locator('.tile[data-action="play-scenes"]').click();
  await p2.locator('#age-ok').check();
  await p2.locator('#age-continue').click();
  await p2.locator('.scene').first().click();
  await p2.locator('#role-buttons button').first().click();
  await p2.locator('[data-screen="help"]').waitFor({ state: 'visible', timeout: 8000 });
  check((await p2.locator('#h-help').innerText()).includes('blockerad'), 'Nekad behörighet visar steg för att tillåta kameran');
  await denied.close();

  // ---- 3. Informationssidorna finns och har ikonen ----
  const info = await browser.newPage();
  const infoErrors = [];
  info.on('console', (m) => { if (m.type() === 'error') infoErrors.push(m.text()); });
  for (const dir of ['', 'en/']) {
    for (const f of ['om', 'ai', 'integritet', 'villkor', 'kontakt', 'kopvillkor']) {
      const r = await info.goto(`${BASE}/${dir}${f}.html`);
      check(r && r.ok(), `Informationssidan ${dir}${f}.html laddas`);
      check((await info.locator('link[rel="manifest"]').count()) === 1, `${dir}${f}.html länkar till app-filen`);
      check((await info.getAttribute('html', 'lang')) === (dir ? 'en' : 'sv') && await info.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Inter')),
        `${dir}${f}.html har rätt språk och sidans utseende`);
      const hrefs = await info.$$eval('a[href]', (as) => as.map((a) => a.href));
      const broken = [];
      for (const href of new Set(hrefs.map((h) => h.split('?')[0].split('#')[0]))) {
        if (!href.startsWith(BASE)) continue;
        const res = await info.request.get(href);
        if (!res.ok()) broken.push(href.replace(BASE, ''));
      }
      check(broken.length === 0, `Alla länkar på ${dir}${f}.html fungerar (${broken.join(', ') || 'inga trasiga'})`);
      check((await info.locator('footer a[href="index.html?angra=1"]').count()) === 1, `${dir}${f}.html har ångerknappen i sidfoten`);
    }
  }
  check(infoErrors.length === 0, `Inga fel på informationssidorna (${infoErrors.join(' | ') || 'inga'})`);
  await info.close();

  // ---- 4. Ikon och hemskärm ----
  // Chrome läser app-filen (manifestet) och avgör om sidan kan installeras.
  const app = await browser.newPage();
  const appErrors = [];
  app.on('console', (m) => { if (m.type() === 'error') appErrors.push(m.text()); });
  await app.goto(`${BASE}/index.html`);
  const cdp = await app.context().newCDPSession(app);
  const am = await cdp.send('Page.getAppManifest');
  check(am.errors.length === 0 && !!am.data, `App-filen läses utan fel (${am.errors.map((e) => e.message).join(' | ') || 'inga fel'})`);
  const manifest = JSON.parse(am.data || '{}');
  check(manifest.display === 'standalone' && manifest.start_url === '/' && !!manifest.short_name,
    'Från hemskärmen öppnas sidan utan adressfält, på startsidan');
  const pngSize = (buf) => `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
  for (const icon of manifest.icons || []) {
    const r = await app.request.get(new URL(icon.src, am.url).href);
    check(r.ok() && pngSize(await r.body()) === icon.sizes, `Ikonen ${icon.src} finns och är ${icon.sizes}`);
  }
  check((manifest.icons || []).some((i) => i.purpose === 'maskable'), 'Det finns en ikon som Android kan runda av');
  const touchHref = await app.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  const touch = await app.request.get(new URL(touchHref, `${BASE}/`).href);
  check(touch.ok() && pngSize(await touch.body()) === '180x180', 'iPhone-ikonen finns och är 180x180');
  const inst = await cdp.send('Page.getInstallabilityErrors');
  const instErrors = inst.installabilityErrors.map((e) => e.errorId);
  check(instErrors.length === 0, `Chrome kan installera sidan som app (${instErrors.join(', ') || 'inga hinder'})`);
  await app.goto(`${BASE}/en/index.html`);
  const amEn = await cdp.send('Page.getAppManifest');
  const manifestEn = JSON.parse(amEn.data || '{}');
  check(amEn.errors.length === 0 && manifestEn.start_url === '/en/' && manifestEn.lang === 'en', 'Den engelska appen öppnas på den engelska startsidan');
  for (const icon of manifestEn.icons || []) {
    const r = await app.request.get(new URL(icon.src, amEn.url).href);
    check(r.ok() && pngSize(await r.body()) === icon.sizes, `Den engelska appens ikon ${icon.src} finns`);
  }
  const instEn = await cdp.send('Page.getInstallabilityErrors');
  check(instEn.installabilityErrors.length === 0, `Chrome kan installera den engelska appen (${instEn.installabilityErrors.map((e) => e.errorId).join(', ') || 'inga hinder'})`);
  check(appErrors.length === 0, `Inga fel när app-filen läses (${appErrors.join(' | ') || 'inga'})`);
  await app.close();

  // ---- 5. Anmälan och frågor ----
  const p5ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p5 = await p5ctx.newPage();
  const p5errors = [];
  const p5requests = [];
  p5.on('console', (m) => { if (m.type() === 'error') p5errors.push(m.text()); });
  p5.on('pageerror', (e) => p5errors.push(String(e)));
  p5.on('request', (r) => p5requests.push({ url: r.url(), method: r.method() }));

  const missing = await p5.request.get(`${BASE}/pris.html`);
  check(missing.status() === 404, 'Appen är gratis: sidan om scenpaket finns inte längre');
  await p5.goto(`${BASE}/index.html`);
  check((await p5.locator('footer a[href="pris.html"]').count()) === 0, 'Appen är gratis: ingen länk till scenpaket i sidfoten');
  await p5.goto(`${BASE}/anmalan.html?fran=tiktok-video-1`);
  check((await p5.locator('#fran').inputValue()) === 'tiktok-video-1', 'Anmälan: källan från länken fylls i');

  const form = p5.locator('form[name="anmalan"]');
  const attrs = await form.evaluate((f) => [f.getAttribute('method'), f.getAttribute('action'), f.getAttribute('data-netlify'), f.getAttribute('netlify-honeypot')]);
  check(attrs.join(' ') === 'POST /tack.html true bot-field', `Anmälan: formuläret går till Netlify Forms med honungsfälla (${attrs.join(' ')})`);
  check(await form.evaluate((f) => !f.checkValidity()), 'Anmälan: går inte att skicka utan e-post, 18 år och samtycke');
  await p5.fill('input[name="epost"]', 'test@example.com');
  await p5.check('input[name="vuxen"]');
  check(await form.evaluate((f) => !f.checkValidity()), 'Anmälan: samtycket krävs');
  await p5.check('input[name="samtycke"]');
  check(await form.evaluate((f) => f.checkValidity()), 'Anmälan: går att skicka med e-post, 18 år och samtycke');
  check(await p5.locator('.honeypot').isHidden(), 'Anmälan: honungsfällan syns inte');

  await p5.goto(`${BASE}/anmalan.html?fran=%3Cscript%3E`);
  check((await p5.locator('#fran').inputValue()) === '', 'Anmälan: en konstig källa i länken ignoreras');
  await p5.goto(`${BASE}/anmalan.html?fran=tiktok`);
  check((await p5.locator('select[name="kalla"]').inputValue()) === 'tiktok', 'Anmälan: TikTok väljs i förväg när länken kommer därifrån');

  await p5.goto(`${BASE}/fragor.html`);
  const qform = p5.locator('form[name="fragor"]');
  const qattrs = await qform.evaluate((f) => [f.getAttribute('action'), f.getAttribute('data-netlify')]);
  check(qattrs.join(' ') === '/fragor-tack.html true', 'Frågorna: formuläret går till Netlify Forms');
  check((await p5.locator('form[name="fragor"] textarea').count()) === 5, 'Frågorna: fem frågor att svara på i text');
  check(!(await p5.locator('form[name="fragor"]').innerText()).match(/betala|kr\b|köp/i), 'Frågorna: inga frågor om att betala');
  check(await qform.evaluate((f) => !f.checkValidity()), 'Frågorna: går inte att skicka utan 18 år och samtycke');

  check((await p5.locator('form[name="fragor"] input[name="sprak"]').inputValue()) === 'sv', 'Frågorna: språket skickas med');
  for (const f of ['tack', 'fragor-tack']) {
    const r = await p5.goto(`${BASE}/${f}.html`);
    check(r && r.ok(), `${f}.html laddas`);
  }
  // Samma formulär på engelska, till samma ställe hos Netlify.
  await p5.goto(`${BASE}/en/anmalan.html?fran=tiktok`);
  const enAttrs = await p5.locator('form[name="anmalan"]').evaluate((f) => [f.getAttribute('action'), f.querySelector('[name="sprak"]').value, f.querySelector('[name="form-name"]').value]);
  check(enAttrs.join(' ') === '/en/tack.html en anmalan' && (await p5.locator('#fran').inputValue()) === 'tiktok' && (await p5.locator('h1').innerText()).startsWith('Get an email'),
    `Anmälan på engelska: samma formulär, med språket, och tacksidan på engelska (${enAttrs.join(' ')})`);
  await p5.goto(`${BASE}/en/fragor.html`);
  check((await p5.locator('form[name="fragor"]').getAttribute('action')) === '/en/fragor-tack.html' && (await p5.locator('form[name="fragor"] textarea').count()) === 5, 'Frågorna på engelska');
  for (const f of ['tack', 'fragor-tack']) {
    const r = await p5.goto(`${BASE}/en/${f}.html`);
    check(r && r.ok() && (await p5.getAttribute('html', 'lang')) === 'en', `en/${f}.html laddas på engelska`);
  }
  check(p5errors.length === 0, `Inga fel på de nya sidorna (${p5errors.join(' | ') || 'inga'})`);
  check(p5requests.every((r) => r.method === 'GET' && r.url.startsWith(BASE)), 'De nya sidorna skickar inget och anropar inga andra adresser');
  check((await p5ctx.cookies()).length === 0, 'De nya sidorna sätter inga kakor');
  await p5ctx.close();

  // ---- 6. Motspelaren läser repliker ----
  // Talsyntesen byts mot en falsk med en svensk röst som "läser" i 1,2 s, och
  // mikrofonen mot en ton som testet slår på och av, som om användaren pratar.
  const lines = SCENES[0].repliker;
  const p6ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await p6ctx.route('**/api/ai-start**', (route) => route.fulfill({ json: { available: false } }));
  const p6 = await p6ctx.newPage();
  const p6errors = [];
  const p6requests = [];
  p6.on('console', (m) => { if (m.type() === 'error') p6errors.push(m.text()); });
  p6.on('pageerror', (e) => p6errors.push(String(e)));
  p6.on('request', (r) => p6requests.push({ url: r.url(), method: r.method() }));
  await p6.addInitScript(() => {
    window.__spoken = [];
    window.__speakMs = 1200;
    window.__voices = [
      { name: 'Nätröst', lang: 'sv-SE', localService: false, default: true, voiceURI: 'nat' },
      { name: 'Engelska', lang: 'en-US', localService: true, default: false, voiceURI: 'en' },
      { name: 'Alva', lang: 'sv-SE', localService: true, default: false, voiceURI: 'alva' }
    ];
    let timer = 0;
    let current = null;
    const synth = {
      speaking: false,
      pending: false,
      paused: false,
      getVoices: () => window.__voices,
      speak(u) {
        if (!u.text) return; // den tysta upplåsningen för iPhone
        window.__spoken.push({ text: u.text, voice: u.voice && u.voice.name, lang: u.lang });
        current = u;
        this.speaking = true;
        timer = setTimeout(() => {
          this.speaking = false;
          current = null;
          if (u.onend) u.onend({});
        }, window.__speakMs);
      },
      cancel() {
        clearTimeout(timer);
        this.speaking = false;
        if (current) {
          const u = current;
          current = null;
          if (u.onerror) u.onerror({ error: 'interrupted' });
        }
      },
      pause() {},
      resume() {},
      addEventListener() {},
      removeEventListener() {}
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = class {
      constructor(text) { Object.assign(this, { text, voice: null, lang: '', volume: 1, rate: 1, pitch: 1 }); }
    };
    const md = navigator.mediaDevices;
    const orig = md.getUserMedia.bind(md);
    md.getUserMedia = async (constraints) => {
      const stream = await orig(constraints);
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // tyst rum, cirka -63 dB
      const dest = ctx.createMediaStreamDestination();
      osc.connect(gain).connect(dest);
      osc.start();
      window.__talk = (on) => { gain.gain.value = on ? 0.2 : 0.001; }; // tal, cirka -17 dB
      for (const track of stream.getAudioTracks()) { stream.removeTrack(track); track.stop(); }
      stream.addTrack(dest.stream.getAudioTracks()[0]);
      return stream;
    };
  });
  const currentLine = () => p6.evaluate(() => {
    const el = document.querySelector('#script .current');
    return el ? Number(el.dataset.line) : -1;
  });
  const waitForLine = async (n, ms) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if ((await currentLine()) === n) return Date.now() - t0;
      await sleep(25);
    }
    return -1;
  };
  const talk = (on) => p6.evaluate((v) => window.__talk(v), on);

  await p6.goto(`${BASE}/index.html`);
  await p6.locator('.tile[data-action="play-scenes"]').click();
  await p6.locator('#age-ok').check();
  await p6.locator('#age-continue').click();
  await p6.locator('.scene').first().click();
  await p6.locator('#role-buttons button').first().click(); // första rollen, som har första repliken
  await p6.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p6.getByRole('button', { name: 'Till inspelningen' }).click();
  await p6.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p6.locator('#partner-toggle').isVisible() && await p6.locator('#partner-on').isChecked(),
    'Motspelaren: valet syns och är påslaget när mobilen har en svensk röst');
  check(await p6.locator('#partner-no-voice').isHidden(), 'Motspelaren: ingen varning om saknad röst');

  await p6.locator('#start-rec').click();
  await p6.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  check(await p6.locator('#partner-box').isHidden(), 'Motspelaren: valet göms under tagningen');
  check(await p6.locator('#next-line').isVisible(), 'Motspelaren: knappen Nästa replik syns under tagningen');
  check((await currentLine()) === 0, 'Motspelaren: din första replik är markerad när tagningen börjar');

  // Första repliken: användaren pratar i 2,5 s och tystnar.
  await talk(true);
  await sleep(2500);
  await talk(false);
  const gap = await waitForLine(1, 4000);
  check(gap >= 700 && gap <= 1600, `Motspelaren svarar ${gap} ms efter att du har tystnat`);
  const first = (await p6.evaluate(() => window.__spoken))[0] || {};
  check(first.text === lines[1].text && first.voice === 'Alva' && first.lang === 'sv-SE',
    `Motspelarens replik läses med mobilens svenska röst, inte en röst via nätet (${first.voice})`);
  check((await waitForLine(2, 3000)) >= 0, 'Motspelaren: din nästa replik markeras när rösten har läst klart');

  // Tredje repliken: en paus i spelet efter några ord, sedan resten.
  await talk(true);
  await sleep(600);
  await talk(false);
  await sleep(1800);
  check((await currentLine()) === 2, 'Motspelaren: en paus på knappt 2 s mitt i din replik släpper inte fram motspelaren');
  await p6.evaluate(() => { window.__speakMs = 30000; }); // nästa replik läses länge, så att Nästa replik kan testas
  await talk(true);
  await sleep(2000);
  await talk(false);
  check((await waitForLine(3, 3000)) >= 0, 'Motspelaren: när resten av repliken är sagd kommer motspelaren');

  await sleep(300);
  await p6.locator('#next-line').click();
  check((await waitForLine(4, 1000)) >= 0, 'Nästa replik avbryter rösten och går till din replik');
  check(!(await p6.evaluate(() => window.speechSynthesis.speaking)), 'Rösten tystnar när du trycker på Nästa replik');
  for (let i = 4; i < lines.length; i++) {
    await p6.locator('#next-line').click();
    if (i + 1 < lines.length) await waitForLine(i + 1, 1000);
  }
  await p6.locator('#partner-done').waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  check(await p6.locator('#partner-done').isVisible(), 'När scenen är slut står det att du kan trycka på Stoppa');
  check(await p6.locator('#next-line').isHidden() && (await currentLine()) === -1, 'När scenen är slut finns ingen markering och ingen Nästa replik');
  const spokenTexts = (await p6.evaluate(() => window.__spoken)).map((s) => s.text);
  const theirs = lines.filter((l) => l.roll !== lines[0].roll).map((l) => l.text);
  check(JSON.stringify(spokenTexts) === JSON.stringify(theirs), 'Rösten läste bara motspelarens repliker, i rätt ordning');
  check(await p6.locator('#stop-rec').isVisible(), 'Inspelningen pågår tills du själv trycker på Stoppa');
  await p6.locator('#stop-rec').click();
  await p6.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  check(((await p6.locator('#playback').getAttribute('src')) || '').startsWith('blob:'), 'Tagningen med motspelaren går att titta på');

  // Ta om utan motspelare: som förut, ingen röst och ingen markering.
  await p6.getByRole('button', { name: 'Ta om' }).click();
  await p6.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p6.locator('#partner-box').isVisible() && await p6.locator('#partner-done').isHidden() && (await currentLine()) === -1,
    'Ta om: valet syns igen och scenen börjar om');
  await p6.locator('#mode-none').check();
  await p6.locator('#start-rec').click();
  await p6.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  await sleep(1500);
  check((await currentLine()) === -1 && (await p6.evaluate(() => window.__spoken.length)) === theirs.length && await p6.locator('#next-line').isHidden(),
    'Avstängd motspelare: ingen röst och ingen markering');
  await p6.locator('#stop-rec').click();
  await p6.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });

  // Utan svensk röst i mobilen.
  await p6.evaluate(() => { window.__voices = window.__voices.filter((v) => v.name !== 'Alva'); });
  await p6.getByRole('button', { name: 'Ta om' }).click();
  await p6.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p6.locator('#partner-toggle').isHidden() && await p6.locator('#partner-no-voice').isVisible(),
    'Utan svensk röst i mobilen står det att motspelarens repliker bara visas som text');
  check(p6errors.length === 0, `Inga fel med motspelaren (${p6errors.join(' | ') || 'inga'})`);
  const p6odd = p6requests.filter((r) => r.method !== 'GET' || !(r.url.startsWith(BASE) || r.url.startsWith('blob:')));
  check(p6odd.length === 0, `Motspelaren skickar inget över nätet (${p6odd.map((r) => r.method + ' ' + r.url.slice(0, 60)).join(' | ') || 'inga andra anrop'})`);
  check(await p6.locator('#mode-ai-row').isHidden(), 'Utan nyckel i Netlify syns inget val för AI-motspelaren');
  await p6ctx.close();

  // ---- 7. AI-motspelaren ----
  // Netlify-funktionen och ElevenLabs byts mot falska. Testet spelar ElevenLabs: tar
  // emot ljudet, skickar AI:ns röst och text och kontrollerar att mikrofonen tystas
  // medan AI:n pratar, så att AI:n inte hör sig själv.
  const p7ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  let aiStartFails = false;
  await p7ctx.route('**/api/ai-start**', (route) => {
    if (new URL(route.request().url()).searchParams.has('check')) return route.fulfill({ json: { available: true } });
    if (aiStartFails) return route.fulfill({ status: 502, json: { available: true, error: 'start_failed' } });
    return route.fulfill({ json: { available: true, signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_test&token=engang' } });
  });
  const p7 = await p7ctx.newPage();
  const p7errors = [];
  const p7requests = [];
  p7.on('console', (m) => { if (m.type() === 'error') p7errors.push(m.text()); });
  p7.on('pageerror', (e) => p7errors.push(String(e)));
  p7.on('request', (r) => p7requests.push({ url: r.url(), method: r.method() }));
  const peakOf = (b64) => {
    const buf = Buffer.from(b64, 'base64');
    const pcm = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1);
    let max = 0;
    for (const v of pcm) max = Math.max(max, Math.abs(v));
    return max / 32768;
  };
  const el = { url: '', init: null, chunks: [], pongs: [], closed: false, socket: null };
  await p7.routeWebSocket(/elevenlabs\.io/, (ws) => {
    el.url = ws.url();
    el.socket = ws;
    ws.onMessage((message) => {
      const msg = JSON.parse(String(message));
      if (msg.type === 'conversation_initiation_client_data') {
        el.init = msg;
        ws.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'conv_test', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000' } }));
        ws.send(JSON.stringify({ type: 'ping', ping_event: { event_id: 7, ping_ms: 0 } }));
      } else if (msg.user_audio_chunk) {
        el.chunks.push({ t: Date.now(), peak: peakOf(msg.user_audio_chunk) });
      } else if (msg.type === 'pong') {
        el.pongs.push(msg.event_id);
      }
    });
    ws.onClose(() => { el.closed = true; });
  });
  await p7.addInitScript(() => {
    // Mikrofonen byts mot en ton vars styrka testet styr: tyst rum eller tal.
    const md = navigator.mediaDevices;
    const orig = md.getUserMedia.bind(md);
    md.getUserMedia = async (constraints) => {
      const stream = await orig(constraints);
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      const dest = ctx.createMediaStreamDestination();
      osc.connect(gain).connect(dest);
      osc.start();
      window.__talk = (on) => { gain.gain.value = on ? 0.2 : 0.001; };
      for (const track of stream.getAudioTracks()) { stream.removeTrack(track); track.stop(); }
      stream.addTrack(dest.stream.getAudioTracks()[0]);
      return stream;
    };
  });
  const waitUntil = async (test, ms) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await test()) return true;
      await sleep(25);
    }
    return false;
  };
  const aiTalk = (on) => p7.evaluate((v) => window.__talk(v), on);
  const aiStatus = () => p7.locator('#ai-status').innerText();

  await p7.goto(`${BASE}/index.html`);
  await p7.locator('.tile[data-action="play-scenes"]').click();
  await p7.locator('#age-ok').check();
  await p7.locator('#age-continue').click();
  await p7.locator('.scene').first().click();
  await p7.locator('#role-buttons button').first().click(); // första rollen, som har första repliken
  await p7.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p7.getByRole('button', { name: 'Till inspelningen' }).click();
  await p7.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p7.locator('#mode-ai-row').isVisible() && await p7.locator('#mode-ai').isChecked(), 'AI-motspelaren: valet syns och är förvalt när den finns');
  check(await p7.locator('#ai-note').isVisible() && /Du pratar med en AI/.test(await p7.locator('#ai-note').innerText()),
    'AI-motspelaren: det står tydligt att man pratar med en AI');

  await p7.locator('#start-rec').click();
  await p7.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  await waitUntil(async () => el.init !== null, 4000);
  check(el.url.includes('token=engang'), 'AI-motspelaren: webbläsaren använder länken från funktionen');
  const agentOverride = (el.init && el.init.conversation_config_override && el.init.conversation_config_override.agent) || {};
  check(agentOverride.language === 'sv' && (agentOverride.prompt || {}).prompt.includes(SCENES[0].situation) && !('first_message' in agentOverride),
    'AI-motspelaren får scenen på svenska och väntar på din första replik');
  check(await p7.locator('#next-line').isHidden(), 'AI-motspelaren: ingen knapp för Nästa replik behövs');

  await aiTalk(true);
  await sleep(1200);
  check(el.chunks.length > 5 && el.chunks.slice(-3).every((c) => c.peak > 0.1), `Ljudet från mikrofonen skickas när du pratar (${el.chunks.length} block)`);
  check(el.pongs.includes(7), 'AI-motspelaren svarar när ElevenLabs kontrollerar att den är kvar');

  // AI:n svarar med 1 s ljud i fyra delar och texten till repliken.
  const tone16k = Int16Array.from({ length: 16000 }, (_, i) => Math.round(0.3 * 32767 * Math.sin((2 * Math.PI * 300 * i) / 16000)));
  for (let i = 0; i < 4; i++) {
    const part = Buffer.from(tone16k.buffer, i * 8000, 8000).toString('base64');
    el.socket.send(JSON.stringify({ type: 'audio', audio_event: { audio_base_64: part, event_id: i + 1 } }));
  }
  el.socket.send(JSON.stringify({ type: 'agent_response', agent_response_event: { agent_response: 'Jag har inte rört den.' } }));
  await sleep(400);
  check((await aiStatus()) === 'AI:n pratar', 'Det syns när AI:n pratar');
  const during = el.chunks.length;
  await sleep(400);
  const whileAiTalks = el.chunks.slice(during);
  check(whileAiTalks.length > 0 && whileAiTalks.every((c) => c.peak === 0), 'Medan AI:n pratar skickas tystnad, så att AI:n inte hör sig själv');
  const aiLine = await p7.locator('#ai-log p').last().innerText();
  check(aiLine.includes('Jag har inte rört den.') && aiLine.includes('(AI)'), 'AI:ns replik visas som text, märkt med AI');
  await sleep(1200);
  check(el.chunks.slice(-3).every((c) => c.peak > 0.1), 'När AI:n har pratat klart skickas mikrofonen igen');
  check((await aiStatus()) === 'AI:n lyssnar', 'Det syns när AI:n lyssnar');
  el.socket.send(JSON.stringify({ type: 'user_transcript', user_transcription_event: { user_transcript: 'Har du sett nyckeln?' } }));
  el.socket.send(JSON.stringify({ type: 'interruption', interruption_event: { reason: 'test' } }));
  await sleep(200);
  const myLine = await p7.locator('#ai-log p').last().innerText();
  check(myLine.includes('Har du sett nyckeln?') && /^du, /i.test(myLine), 'Det du sa visas också som text');
  await aiTalk(false);

  await p7.locator('#stop-rec').click();
  await p7.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  check(await waitUntil(async () => el.closed, 3000), 'Stoppa avslutar samtalet med AI:n');

  // Om AI-motspelaren inte kan starta fortsätter inspelningen ändå.
  aiStartFails = true;
  await p7.getByRole('button', { name: 'Ta om' }).click();
  await p7.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  await p7.locator('#start-rec').click();
  await p7.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  await waitUntil(async () => (await p7.locator('#ai-status').getAttribute('data-status')) === 'error', 3000);
  check((await aiStatus()).includes('kunde inte starta') && await p7.locator('#stop-rec').isVisible(),
    'Om AI-motspelaren inte startar står det så, och inspelningen fortsätter');
  await p7.locator('#stop-rec').click();
  await p7.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });

  const p7realErrors = p7errors.filter((e) => !/502/.test(e)); // det falska felet i sista testet
  check(p7realErrors.length === 0, `Inga fel med AI-motspelaren (${p7realErrors.join(' | ') || 'inga'})`);
  const p7odd = p7requests.filter((r) => r.method !== 'GET' || !(r.url.startsWith(BASE) || r.url.startsWith('blob:')));
  check(p7odd.length === 0, `Bara ljud går till ElevenLabs, inget annat lämnar sidan (${p7odd.map((r) => r.method + ' ' + r.url.slice(0, 60)).join(' | ') || 'inga andra anrop'})`);
  await p7ctx.close();

  // ---- 8. Hemskärmen, dagens utmaning och uppvärmningen ----
  const { challengeFor } = await import('../public/content.js');
  const p8ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await p8ctx.route('**/api/ai-start**', (route) => route.fulfill({ json: { available: false } }));
  const p8 = await p8ctx.newPage();
  const p8errors = [];
  p8.on('console', (m) => { if (m.type() === 'error') p8errors.push(m.text()); });
  p8.on('pageerror', (e) => p8errors.push(String(e)));
  await p8.addInitScript(() => {
    window.__gum = 0;
    const md = navigator.mediaDevices;
    const orig = md.getUserMedia.bind(md);
    md.getUserMedia = (c) => { window.__gum += 1; return orig(c); };
  });
  await p8.goto(`${BASE}/index.html`);
  await p8.evaluate(() => document.fonts.ready);
  check(['God morgon.', 'Hej.', 'God kväll.', 'God natt.'].includes(await p8.locator('#h-start').innerText()), 'Hemskärmen hälsar efter tiden på dygnet');
  check((await p8.locator('#daily-text').innerText()) === challengeFor(new Date()), 'Hemskärmen visar dagens utmaning');
  check(await p8.evaluate(() => document.fonts.check('700 20px Fraunces') && document.fonts.check('400 16px Inter')), 'Typsnitten Fraunces och Inter laddas från den egna sidan');
  check(await p8.locator('#tabbar').isVisible() && (await p8.locator('#tabbar [aria-current="page"]').innerText()).includes('Hem'), 'Menyn längst ned syns och Hem är vald');
  check((await p8.locator('.tile.soon').count()) === 0 && (await p8.locator('button.tile').count()) === 6, 'Hemskärmen: fem övningar och Mina tagningar fungerar');

  // Uppvärmningen behöver ingen kamera.
  await p8.locator('.tile[data-action="warmup"]').click();
  check((await p8.locator('#h-warmup').innerText()) === 'Andas' && await p8.locator('#breath').isVisible(), 'Uppvärmning: första steget är andning med en cirkel');
  await p8.locator('#warmup-start').click();
  await sleep(600);
  check((await p8.locator('#breath-label').innerText()) === 'Andas in' && /kvar$/.test(await p8.locator('#warmup-timer').innerText()), 'Uppvärmning: klockan går och säger när du ska andas in');
  await p8.locator('#warmup-next').click();
  check((await p8.locator('#h-warmup').innerText()) === 'Läppar och tunga' && !(await p8.locator('#warmup-timer').isVisible()), 'Uppvärmning: nästa steg börjar utan klocka');
  await p8.locator('#warmup-next').click();
  const twister = await p8.locator('#twister-text').innerText();
  await p8.getByRole('button', { name: 'En annan tungvrickare' }).click();
  check(await p8.locator('#twister').isVisible() && (await p8.locator('#twister-text').innerText()) !== twister, 'Uppvärmning: man kan byta tungvrickare');
  await p8.locator('#warmup-next').click();
  check((await p8.locator('#warmup-next').innerText()) === 'Klar', 'Uppvärmning: sista steget avslutas med Klar');
  await p8.locator('#warmup-next').click();
  check(await p8.locator('[data-screen="warmup-done"]').isVisible() && (await p8.evaluate(() => window.__gum)) === 0, 'Uppvärmning: klar utan att kameran startades');

  // Dagens utmaning spelas in utan motspelare.
  await p8.locator('[data-screen="warmup-done"] [data-action="daily"]').click();
  check(await p8.locator('[data-screen="age"]').isVisible() && await p8.locator('#tabbar').isHidden(), 'Dagens utmaning: 18-årsfrågan kommer först, utan menyn');
  await p8.locator('#age-ok').check();
  await p8.locator('#age-continue').click();
  await p8.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p8.getByRole('button', { name: 'Till inspelningen' }).click();
  await p8.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p8.locator('#partner-box').isHidden() && (await p8.locator('#script').innerText()).includes(challengeFor(new Date())), 'Dagens utmaning: uppgiften står på skärmen och ingen motspelare behövs');
  await p8.locator('#start-rec').click();
  await p8.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  await sleep(1500);
  await p8.locator('#stop-rec').click();
  await p8.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  check(((await p8.locator('#playback').getAttribute('src')) || '').startsWith('blob:'), 'Dagens utmaning: tagningen går att titta på');

  // Tillbaka till scenerna: bilder och genrer, och partnervalet kommer tillbaka.
  await p8.getByRole('button', { name: 'Spara' }).click();
  await p8.locator('[data-screen="save"] [data-action="to-scenes"]').click();
  await p8.locator('[data-screen="scenes"]').waitFor({ state: 'visible' });
  const images = await p8.$$eval('.scene-img', (imgs) => imgs.map((i) => i.complete && i.naturalWidth > 0));
  check(images.length === SCENES.length && images.every(Boolean), `Scenerna har bilder som laddas (${images.length})`);
  const chips = await p8.locator('#genre-chips .chip').allInnerTexts();
  check(chips.join(',') === 'Alla,Drama,Komedi,Thriller,Romantik' && (await p8.locator('#genre-chips [aria-pressed="true"]').innerText()) === 'Alla', `Scenerna kan väljas efter genre (${chips.join(', ')})`);
  await p8.locator('#genre-chips .chip', { hasText: 'Thriller' }).click();
  const thrillers = await p8.locator('.scene strong').allInnerTexts();
  check(thrillers.length === SCENES.filter((x) => x.genre === 'Thriller').length && thrillers.includes('Samtalet klockan tre') && (await p8.locator('#genre-chips [aria-pressed="true"]').innerText()) === 'Thriller',
    'Genren Thriller visar bara thrillrarna');
  await p8.locator('#genre-chips .chip', { hasText: 'Alla' }).click();
  check((await p8.locator('.scene .tag').first().innerText()).toLowerCase() === 'drama', 'Scenerna visar genre');
  await p8.locator('.scene').first().click();
  await p8.locator('#role-buttons button').first().click();
  await p8.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p8.getByRole('button', { name: 'Till inspelningen' }).click();
  await p8.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p8.locator('#partner-box').isVisible(), 'En scen med två roller visar valet av motspelare igen');
  check(p8errors.length === 0, `Inga fel på hemskärmen och i övningarna (${p8errors.join(' | ') || 'inga'})`);
  await p8ctx.close();

  // ---- 9. En replik fem sätt, monolog och improvisation med AI ----
  const { MONOLOGUES, IMPROVS } = await import('../public/content.js');
  const p9ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  let aiOn = false;
  await p9ctx.route('**/api/ai-start**', (route) => {
    if (new URL(route.request().url()).searchParams.has('check')) return route.fulfill({ json: { available: aiOn } });
    return route.fulfill({ json: { available: true, signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=a&token=improv' } });
  });
  const p9 = await p9ctx.newPage();
  const p9errors = [];
  p9.on('console', (m) => { if (m.type() === 'error') p9errors.push(m.text()); });
  p9.on('pageerror', (e) => p9errors.push(String(e)));
  let improvInit = null;
  await p9.routeWebSocket(/elevenlabs\.io/, (ws) => {
    ws.onMessage((message) => {
      const msg = JSON.parse(String(message));
      if (msg.type === 'conversation_initiation_client_data') {
        improvInit = msg;
        ws.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'c9', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000' } }));
      }
    });
  });
  const toRecordFromCheck = async () => {
    await p9.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
    await p9.getByRole('button', { name: 'Till inspelningen' }).click();
    await p9.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  };
  const current9 = () => p9.evaluate(() => { const el = document.querySelector('#script .current'); return el ? Number(el.dataset.line) : -1; });

  await p9.goto(`${BASE}/index.html`);
  await p9.locator('.tile[data-action="fiveways"]').click();
  await p9.locator('#age-ok').check();
  await p9.locator('#age-continue').click();
  await toRecordFromCheck();
  const labels = await p9.locator('#script .who').allInnerTexts();
  const lines5 = await p9.$$eval('#script .mine', (ps) => ps.map((el) => el.lastChild.textContent));
  check(labels.length === 5 && new Set(labels).size === 5 && labels.every((l, i) => l.startsWith(`${i + 1}.`)) && new Set(lines5).size === 1,
    'En replik, fem sätt: samma replik fem gånger med fem olika sätt');
  check(await p9.locator('#partner-box').isHidden(), 'En replik, fem sätt: inget val av motspelare');
  await p9.locator('#start-rec').click();
  await p9.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  check((await current9()) === 0 && await p9.locator('#next-line').isVisible(), 'En replik, fem sätt: första sättet är markerat och Nästa finns');
  for (let i = 0; i < 5; i++) await p9.locator('#next-line').click();
  await p9.locator('#partner-done').waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  check((await p9.locator('#partner-done').innerText()).startsWith('Klart.'), 'En replik, fem sätt: efter femte sättet står det Klart');
  await p9.locator('#stop-rec').click();
  await p9.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });

  await p9.locator('[data-screen="review"] [data-action="retake"]').waitFor();
  await p9.goto(`${BASE}/index.html`);
  await p9.locator('.tile[data-action="monologue"]').click();
  await p9.locator('#age-ok').check();
  await p9.locator('#age-continue').click();
  check(await p9.locator('[data-screen="pick"]').isVisible() && (await p9.locator('#pick-list .scene').count()) === MONOLOGUES.length, `Monolog: ${MONOLOGUES.length} monologer att välja bland`);
  await p9.locator('#pick-list .scene').first().click();
  await toRecordFromCheck();
  check((await p9.locator('#script .mine').count()) === MONOLOGUES[0].stycken.length && (await p9.locator('#script .who').count()) === 0, 'Monolog: texten är delad i stycken utan rollnamn');
  await p9.locator('#start-rec').click();
  await p9.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  check((await current9()) === 0, 'Monolog: första stycket är markerat när tagningen börjar');
  await p9.locator('#next-line').click();
  check((await current9()) === 1, 'Monolog: Nästa går till nästa stycke');
  await p9.locator('#stop-rec').click();
  await p9.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });

  await p9.goto(`${BASE}/index.html`);
  await p9.locator('.tile[data-action="improv"]').click();
  await p9.locator('#age-ok').check();
  await p9.locator('#age-continue').click();
  await p9.locator('[data-screen="pick"]').waitFor({ state: 'visible' });
  check(await p9.locator('#pick-notice').isVisible() && await p9.locator('#pick-list .scene').first().isDisabled(), 'Improvisera: utan AI-motspelaren står det så, och situationerna går inte att välja');

  aiOn = true;
  await p9.goto(`${BASE}/index.html`);
  await p9.locator('.tile[data-action="improv"]').click();
  await p9.locator('#age-ok').check();
  await p9.locator('#age-continue').click();
  await p9.locator('[data-screen="pick"]').waitFor({ state: 'visible' });
  check((await p9.locator('#pick-list .scene').count()) === IMPROVS.length && await p9.locator('#pick-notice').isHidden(), `Improvisera: ${IMPROVS.length} situationer att välja bland`);
  await p9.locator('#pick-list .scene').first().click();
  await toRecordFromCheck();
  check(await p9.locator('#partner-box').isHidden() && await p9.locator('#ai-note').isVisible(), 'Improvisera: alltid mot AI:n, och det står att det är en AI');
  check((await p9.locator('#script').innerText()).includes(IMPROVS[0].du.vill), 'Improvisera: det står vad du vill i situationen');
  await p9.locator('#start-rec').click();
  await p9.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  for (let i = 0; i < 80 && !improvInit; i++) await sleep(50);
  const improvAgent = (improvInit && improvInit.conversation_config_override.agent) || {};
  check(improvAgent.first_message === IMPROVS[0].ai.forsta && /inget manus/.test((improvAgent.prompt || {}).prompt || ''), 'Improvisera: AI:n börjar med karaktärens första replik och vet att det inte finns något manus');
  await p9.locator('#stop-rec').click();
  await p9.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  check(p9errors.length === 0, `Inga fel i övningarna (${p9errors.join(' | ') || 'inga'})`);
  await p9ctx.close();

  // ---- 10. Plus: köp, AI-minuter, längre tagningar, kundsidan och ångerknappen ----
  // Stripe och Netlify-funktionerna byts mot falska. Köpet hoppar direkt tillbaka från
  // "Stripe" till sidan, som Stripe gör efter en betalning.
  const nowSec = Math.floor(Date.now() / 1000);
  const plusPayload = { plan: 'plus', sub: 'sub_test1', cus: 'cus_test1', start: nowSec - 86400, exp: nowSec + 3600 };
  const plusToken = `v1.${Buffer.from(JSON.stringify(plusPayload)).toString('base64url')}.underskrift`;
  const api = { calls: [], info: { available: true, test: true, price: 99 }, used: 0 };
  const p10ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await p10ctx.route('**/api/**', async (route) => {
    const r = route.request();
    const u = new URL(r.url());
    const call = { path: u.pathname, method: r.method(), query: u.search, auth: r.headers().authorization || '', body: r.postData() || '' };
    api.calls.push(call);
    switch (u.pathname) {
      case '/api/ai-start':
        if (u.searchParams.has('check')) return route.fulfill({ json: { available: true } });
        return route.fulfill({ json: { available: true, plan: call.auth ? 'plus' : 'gratis', signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=p&token=plus', max_seconds: call.auth ? 600 : 240, reservation: '11111111-2222-3333-4444-555555555555' } });
      case '/api/ai-end':
        return route.fulfill({ json: { used_seconds: 120, plan: 'plus' } });
      case '/api/plus/info':
        return route.fulfill({ json: api.info });
      case '/api/plus/checkout':
        return route.fulfill({ json: { url: `${BASE}/index.html?plus=klar&session_id=cs_test_abc123` } });
      case '/api/plus/activate':
        return route.fulfill({ json: { plan: 'plus', token: plusToken, code: 'K7Q2-M9XD-4RTA-B3CE', usedSeconds: 0, limitSeconds: 3600 } });
      case '/api/plus/kod':
        return route.fulfill({ json: { code: 'N8WS-2HJF-6PZE-Y1AV' } });
      case '/api/plus/aterstall': {
        const kod = JSON.parse(call.body || '{}').kod;
        if (kod === 'N8WS-2HJF-6PZE-Y1AV') return route.fulfill({ json: { plan: 'plus', token: plusToken, usedSeconds: 600, limitSeconds: 3600 } });
        return route.fulfill({ status: 404, json: { error: 'not_found' } });
      }
      case '/api/plus/status':
        return route.fulfill({ json: { plan: 'plus', token: plusToken, usedSeconds: api.used, limitSeconds: 3600 } });
      case '/api/plus/portal':
        return route.fulfill({ json: { url: `${BASE}/index.html?plus=hantera` } });
      case '/api/plus/angra':
        return route.fulfill({ json: { status: 'angrat', received: new Date().toISOString(), refunded: 99 } });
      default:
        return route.fulfill({ status: 404, json: { error: 'not_found' } });
    }
  });
  const p10 = await p10ctx.newPage();
  const p10errors = [];
  const p10requests = [];
  p10.on('console', (m) => { if (m.type() === 'error') p10errors.push(m.text()); });
  p10.on('pageerror', (e) => p10errors.push(String(e)));
  p10.on('request', (r) => p10requests.push({ url: r.url(), method: r.method() }));
  // En fel återställningskod ska ge 404, och det loggar webbläsaren som ett fel. Det felet är väntat.
  let expected404 = 0;
  p10.on('response', (r) => { if (r.status() === 404 && r.url().endsWith('/api/plus/aterstall')) expected404 += 1; });
  let plusInit = null;
  let plusSocket = null;
  await p10.routeWebSocket(/elevenlabs\.io/, (ws) => {
    plusSocket = ws;
    ws.onMessage((message) => {
      const msg = JSON.parse(String(message));
      if (msg.type === 'conversation_initiation_client_data') {
        plusInit = msg;
        ws.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'conv_plus1', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000' } }));
      }
    });
  });
  const callsTo = (path) => api.calls.filter((c) => c.path === path);
  const storage = (key) => p10.evaluate((k) => localStorage.getItem(k), key);

  await p10.goto(`${BASE}/index.html`);
  check((await p10.locator('#plus-banner').innerText()).includes('60 AI-minuter i månaden'), 'Plus: hemskärmen visar vad Plus ger');
  await p10.locator('#plus-banner').click();
  await p10.locator('[data-screen="plus"]').waitFor({ state: 'visible' });
  await p10.locator('#plus-test').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  check((await p10.locator('.plan').count()) === 2 && (await p10.locator('.plan-plus .price').innerText()) === '99 kr i månaden', 'Plus: gratis och Plus jämförs, Plus kostar 99 kr i månaden');
  check(await p10.locator('#plus-test').isVisible() && (await p10.locator('#plus-test').innerText()).includes('4242'), 'Plus: i testläge står det att inga riktiga pengar dras, och vilket testkort som gäller');
  check(await p10.locator('#plus-buy-btn').isEnabled() && (await p10.locator('#plus-buy a').getAttribute('href')) === 'kopvillkor.html', 'Plus: köpknappen fungerar och köpvillkoren finns bredvid');
  check(/14 dagars ångerrätt/.test(await p10.locator('#plus-buy').innerText()) && /inklusive moms/.test(await p10.locator('#plus-buy').innerText()), 'Plus: ångerrätt och moms står före köpet');
  check(await p10.evaluate(() => getComputedStyle(document.querySelector('.plan-plus')).borderTopColor !== getComputedStyle(document.querySelector('.plan:not(.plan-plus)')).borderTopColor), 'Plus: Plus-kortet är framhävt');

  await Promise.all([p10.waitForURL(/plus=klar/), p10.locator('#plus-buy-btn').click()]);
  await p10.locator('#plus-message').waitFor({ state: 'visible', timeout: 5000 });
  check(callsTo('/api/plus/checkout')[0]?.method === 'POST', 'Plus: köpet startas hos Stripe');
  check(callsTo('/api/plus/activate')[0]?.query === '?session_id=cs_test_abc123', 'Plus: efter betalningen kontrolleras köpet med köpnumret');
  check((await p10.locator('#plus-message').innerText()).startsWith('Välkommen till Plus') && await p10.locator('#plus-have').isVisible() && await p10.locator('#plus-buy').isHidden(),
    'Plus: efter köpet välkomnas man och köpknappen byts mot hantering');
  check((await p10.locator('#plus-minutes').innerText()) === 'Du har 60 av 60 AI-minuter kvar den här månaden.', 'Plus: 60 AI-minuter finns');
  check((await storage('plus-licens')) === plusToken && !p10.url().includes('session_id'), 'Plus: licenskoden sparas i mobilen och köpnumret tas bort ur adressen');
  check((await p10.locator('#plus-code-value').innerText()) === 'K7Q2-M9XD-4RTA-B3CE' && (await storage('plus-kod')) === 'K7Q2-M9XD-4RTA-B3CE' && await p10.locator('#plus-code-copy').isVisible(),
    'Återställning: efter köpet visas återställningskoden, och den sparas i mobilen');
  await p10ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await p10.locator('#plus-code-copy').click();
  await p10.locator('#plus-code-status').filter({ hasText: 'kopierad' }).waitFor({ timeout: 3000 }).catch(() => {});
  check((await p10.evaluate(() => navigator.clipboard.readText())) === 'K7Q2-M9XD-4RTA-B3CE' && (await p10.locator('#plus-code-status').innerText()).startsWith('Koden är kopierad'), 'Återställning: koden kan kopieras');
  await p10.locator('#plus-code-new').click();
  await p10.locator('#plus-code-value').filter({ hasText: 'N8WS' }).waitFor({ timeout: 3000 }).catch(() => {});
  const newCodeCall = callsTo('/api/plus/kod')[0];
  check(newCodeCall && newCodeCall.method === 'POST' && newCodeCall.auth === `Bearer ${plusToken}` && (await p10.locator('#plus-code-value').innerText()) === 'N8WS-2HJF-6PZE-Y1AV' &&
    (await storage('plus-kod')) === 'N8WS-2HJF-6PZE-Y1AV' && (await p10.locator('#plus-code-status').innerText()).includes('gamla fungerar inte'), 'Återställning: man kan skapa en ny kod, och då sägs det att den gamla slutar fungera');

  // Plus ger längre tagningar och den bättre AI-motspelaren.
  check(await p10.locator('#tabbar').isVisible(), 'Plus: menyn längst ned finns kvar på Plus-sidan');
  await p10.locator('#tabbar [data-tab="start"]').click();
  check((await p10.locator('#plus-banner-text').innerText()) === 'Du har Plus. 60 AI-minuter kvar den här månaden.', 'Plus: hemskärmen visar minuterna som är kvar');
  await p10.locator('.tile[data-action="play-scenes"]').click();
  await p10.locator('#age-ok').check();
  await p10.locator('#age-continue').click();
  await p10.locator('.scene').first().click();
  await p10.locator('#role-buttons button').first().click();
  await p10.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p10.getByRole('button', { name: 'Till inspelningen' }).click();
  await p10.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check((await p10.locator('#rec-max').innerText()) === '10:00' && (await p10.locator('#record-max-note').innerText()).includes('10 minuter'), 'Plus: en tagning kan vara upp till 10 minuter');
  check((await p10.locator('#ai-minutes').innerText()) === 'Plus: 60 minuter kvar' && await p10.locator('#mode-ai').isChecked(), 'Plus: AI-motspelaren är förvald och visar Plus-minuterna');
  await p10.locator('#start-rec').click();
  await p10.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  for (let i = 0; i < 80 && !plusInit; i++) await sleep(50);
  const aiStartCall = callsTo('/api/ai-start').find((c) => !c.query.includes('check'));
  check(aiStartCall && aiStartCall.auth === `Bearer ${plusToken}`, 'Plus: AI-motspelaren startas med licenskoden');
  await sleep(500);
  await p10.locator('#stop-rec').click();
  await p10.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  for (let i = 0; i < 40 && !callsTo('/api/ai-end').length; i++) await sleep(50);
  const endCall = callsTo('/api/ai-end')[0];
  check(endCall && endCall.method === 'POST' && JSON.parse(endCall.body).reservation === '11111111-2222-3333-4444-555555555555' && JSON.parse(endCall.body).conversation_id === 'conv_plus1',
    'Plus: när samtalet slutar räknas tiden med samtalets nummer');
  await p10.waitForFunction(() => document.querySelector('#plus-banner-text').textContent.includes('58'), null, { timeout: 3000 }).catch(() => {});
  check((await p10.evaluate(() => document.querySelector('#plus-banner-text').textContent)).includes('58 AI-minuter kvar'), 'Plus: använd tid dras från minuterna direkt efter samtalet');
  api.used = 120;
  await p10.goto(`${BASE}/index.html`);
  await p10.waitForFunction(() => document.querySelector('#plus-banner-text').textContent.includes('58'), null, { timeout: 5000 }).catch(() => {});
  check((await p10.locator('#plus-banner-text').innerText()).includes('58 AI-minuter kvar'), 'Plus: minuterna som servern har räknat visas när sidan öppnas igen');
  check(callsTo('/api/plus/status').length >= 1 && callsTo('/api/plus/status').every((c) => c.auth === `Bearer ${plusToken}`), 'Plus: licenskoden kontrolleras när sidan öppnas');

  // Kundsidan hos Stripe och tillbaka.
  await p10.locator('#plus-banner').click();
  await p10.locator('#plus-have').waitFor({ state: 'visible' });
  await Promise.all([p10.waitForURL(/plus=hantera/), p10.getByRole('button', { name: 'Ändra kort eller säg upp' }).click()]);
  await p10.locator('[data-screen="plus"]').waitFor({ state: 'visible', timeout: 5000 });
  check(callsTo('/api/plus/portal')[0]?.method === 'POST' && callsTo('/api/plus/portal')[0]?.auth === `Bearer ${plusToken}`, 'Plus: Ändra kort eller säg upp öppnar Stripes kundsida');

  // Ångerknappen längst ned på sidan.
  await p10.locator('footer a[href="?angra=1"]').click();
  await p10.locator('[data-screen="angra"]').waitFor({ state: 'visible', timeout: 5000 });
  const contract = await p10.locator('#angra-contract').innerText();
  check(contract.includes('sub_test1') && contract.includes(new Date((nowSec - 86400) * 1000).toLocaleDateString('sv-SE')), 'Ånger: det står vilket köp som ångras och när det gjordes');
  check(await p10.locator('#angra-send').isDisabled(), 'Ånger: knappen fungerar inte förrän namn och bekräftelse finns');
  await p10.locator('#angra-name').fill('Kim Test');
  check(await p10.locator('#angra-send').isDisabled(), 'Ånger: bara namnet räcker inte');
  await p10.locator('#angra-ok').check();
  check(await p10.locator('#angra-send').isEnabled() && (await p10.locator('#angra-send').innerText()) === 'Ångra köpet', 'Ånger: med namn och bekräftelse går det att ångra');
  await p10.locator('#angra-send').click();
  await p10.locator('#angra-result').waitFor({ state: 'visible', timeout: 5000 });
  const withdrawCall = callsTo('/api/plus/angra')[0];
  check(withdrawCall && withdrawCall.auth === `Bearer ${plusToken}` && JSON.parse(withdrawCall.body).namn === 'Kim Test' && JSON.parse(withdrawCall.body).bekraftat === true,
    'Ånger: namnet och bekräftelsen skickas med licenskoden');
  check((await p10.locator('#angra-result').innerText()).startsWith('Köpet är ångrat. Vi tog emot din ånger') && await p10.locator('#angra-form').isHidden(), 'Ånger: bekräftelsen visar när ångern togs emot');
  check((await storage('plus-licens')) === null && (await storage('plus-kod')) === null, 'Ånger: Plus och återställningskoden tas bort från mobilen');
  await p10.locator('[data-screen="angra"] [data-action="to-start"]').click();
  check((await p10.locator('#plus-banner-text').innerText()).includes('60 AI-minuter i månaden'), 'Ånger: hemskärmen visar gratis igen');

  // Återställ Plus på en "ny mobil": ingen licenskod och ingen kod i mobilen.
  await p10.evaluate(() => localStorage.clear());
  await p10.goto(`${BASE}/index.html?angra=1`);
  await p10.locator('#angra-none').waitFor({ state: 'visible', timeout: 5000 });
  check(/återställningskod/.test(await p10.locator('#angra-none').innerText()), 'Återställning: ångerknappen hänvisar till koden när mobilen saknar Plus');
  await p10.locator('#angra-none [data-action="plus-restore-open"]').click();
  await p10.locator('#plus-restore').waitFor({ state: 'visible', timeout: 3000 });
  check(await p10.locator('#plus-restore-code').evaluate((el) => document.activeElement === el), 'Återställning: fältet för koden får fokus');
  await p10.locator('#plus-restore-code').fill('abcd');
  await p10.locator('#plus-restore-send').click();
  check((await p10.locator('#plus-restore-status').innerText()).startsWith('Koden har 16 tecken') && !callsTo('/api/plus/aterstall').length, 'Återställning: en för kort kod avvisas direkt i mobilen');
  await p10.locator('#plus-restore-code').fill('k7q2 m9xd 4rta b3ce');
  await p10.locator('#plus-restore-send').click();
  await p10.locator('#plus-restore-status').filter({ hasText: 'Ingen aktiv' }).waitFor({ timeout: 3000 }).catch(() => {});
  check((await p10.locator('#plus-restore-status').innerText()).startsWith('Ingen aktiv Plus har den koden') && JSON.parse(callsTo('/api/plus/aterstall')[0].body).kod === 'K7Q2-M9XD-4RTA-B3CE',
    'Återställning: en gammal kod fungerar inte, och koden skickas skriven på samma sätt hur den än skrevs in');
  await p10.locator('#plus-restore-code').fill('N8WS-2HJF-6PZE-Y1AV');
  await p10.locator('#plus-restore-code').press('Enter');
  await p10.locator('#plus-message').filter({ hasText: 'tillbaka' }).waitFor({ timeout: 5000 }).catch(() => {});
  check((await p10.locator('#plus-message').innerText()) === 'Plus är tillbaka på den här mobilen.' && await p10.locator('#plus-have').isVisible() &&
    (await storage('plus-licens')) === plusToken && (await storage('plus-kod')) === 'N8WS-2HJF-6PZE-Y1AV', 'Återställning: med rätt kod är Plus tillbaka, med koden sparad igen');
  check((await p10.locator('#plus-minutes').innerText()) === 'Du har 50 av 60 AI-minuter kvar den här månaden.', 'Återställning: minuterna som redan har använts följer med');
  await p10.evaluate(() => localStorage.clear());

  // Avbrutet köp och köp som inte är igång.
  await p10.goto(`${BASE}/index.html?plus=avbrutet`);
  await p10.locator('#plus-message').waitFor({ state: 'visible', timeout: 5000 });
  check((await p10.locator('#plus-message').innerText()) === 'Köpet avbröts. Inget har dragits.', 'Plus: ett avbrutet köp säger att inget har dragits');
  api.info = { available: false };
  await p10.goto(`${BASE}/index.html`);
  await p10.locator('#plus-banner').click();
  await p10.locator('#plus-unavailable').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  check(await p10.locator('#plus-unavailable').isVisible() && await p10.locator('#plus-buy-btn').isDisabled(), 'Plus: utan Stripe-nyckel går det inte att köpa, och det står varför');

  // Gratis: tiden med AI-motspelaren räknas i mobilen, 5 minuter, sedan en väg till Plus.
  api.info = { available: true, test: true, price: 99 };
  await p10.goto(`${BASE}/index.html`);
  plusInit = null;
  await p10.locator('.tile[data-action="play-scenes"]').click();
  await p10.locator('#age-ok').check();
  await p10.locator('#age-continue').click();
  await p10.locator('.scene').first().click();
  await p10.locator('#role-buttons button').first().click();
  await p10.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p10.getByRole('button', { name: 'Till inspelningen' }).click();
  await p10.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check((await p10.locator('#ai-minutes').innerText()) === '5 gratisminuter kvar', 'Gratis: 5 minuter med AI-motspelaren att prova');
  const startsBefore = callsTo('/api/ai-start').length;
  await p10.locator('#start-rec').click();
  await p10.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  for (let i = 0; i < 80 && !plusInit; i++) await sleep(50);
  check(callsTo('/api/ai-start').slice(startsBefore).every((c) => c.auth === ''), 'Gratis: AI-motspelaren startas utan licenskod');
  await sleep(300);
  await p10.locator('#stop-rec').click();
  await p10.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  await p10.waitForFunction(() => localStorage.getItem('ai-gratis-sekunder') === '120', null, { timeout: 3000 }).catch(() => {});
  check((await storage('ai-gratis-sekunder')) === '120', 'Gratis: använd tid räknas i mobilen');

  await p10.evaluate(() => localStorage.setItem('ai-gratis-sekunder', '300'));
  await p10.goto(`${BASE}/index.html`);
  await p10.locator('.tile[data-action="improv"]').click();
  await p10.locator('#age-ok').check();
  await p10.locator('#age-continue').click();
  await p10.locator('[data-screen="pick"]').waitFor({ state: 'visible' });
  check((await p10.locator('#pick-notice').innerText()).includes('5 gratisminuter') && await p10.locator('#pick-list .scene').first().isDisabled() &&
    await p10.locator('#pick-notice [data-action="to-plus"]').isVisible(), 'Gratis: när de 5 AI-minuterna är slut går improvisation inte att starta, och Plus erbjuds');
  await p10.goto(`${BASE}/index.html`);
  await p10.locator('.tile[data-action="play-scenes"]').click();
  await p10.locator('#age-ok').check();
  await p10.locator('#age-continue').click();
  await p10.locator('.scene').first().click();
  await p10.locator('#role-buttons button').first().click();
  await p10.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p10.getByRole('button', { name: 'Till inspelningen' }).click();
  await p10.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p10.locator('#mode-ai').isDisabled() && !(await p10.locator('#mode-ai').isChecked()) && await p10.locator('#ai-paywall').isVisible(),
    'Gratis: när minuterna är slut går AI inte att välja i scener, och det står varför');
  check((await p10.locator('#rec-max').innerText()) === '3:00', 'Gratis: en tagning kan vara upp till 3 minuter');

  const p10odd = p10requests.filter((r) => !(r.url.startsWith(BASE) || r.url.startsWith('blob:')) ||
    (r.method !== 'GET' && !/\/api\/(ai-end|plus\/(checkout|portal|angra|kod|aterstall))$/.test(new URL(r.url).pathname)));
  check(p10odd.length === 0, `Plus: bara köpet, kundsidan, ångern och AI-tiden skickas (${p10odd.map((r) => r.method + ' ' + r.url.slice(0, 60)).join(' | ') || 'inga andra anrop'})`);
  const p10unexpected = p10errors.filter((e) => {
    if (expected404 > 0 && /status of 404/.test(e)) { expected404 -= 1; return false; }
    return true;
  });
  check(p10unexpected.length === 0, `Inga fel med Plus (${p10unexpected.join(' | ') || 'inga'})`);
  await p10ctx.close();

  // ---- 11. Mina tagningar ----
  const p11ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await p11ctx.route('**/api/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/api/ai-start') return route.fulfill({ json: { available: false } });
    if (u.pathname === '/api/plus/info') return route.fulfill({ json: { available: true, test: true, price: 99 } });
    return route.fulfill({ status: 404, json: { error: 'not_found' } });
  });
  const p11 = await p11ctx.newPage();
  const p11errors = [];
  const p11requests = [];
  p11.on('console', (m) => { if (m.type() === 'error') p11errors.push(m.text()); });
  p11.on('pageerror', (e) => p11errors.push(String(e)));
  p11.on('request', (r) => p11requests.push({ url: r.url(), method: r.method() }));
  const recordScene = async (seconds = 2) => {
    await p11.goto(`${BASE}/index.html`);
    await p11.locator('.tile[data-action="play-scenes"]').click();
    await p11.locator('#age-ok').check();
    await p11.locator('#age-continue').click();
    await p11.locator('.scene').first().click();
    await p11.locator('#role-buttons button').first().click();
    await p11.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
    await p11.getByRole('button', { name: 'Till inspelningen' }).click();
    await p11.locator('[data-screen="record"]').waitFor({ state: 'visible' });
    await p11.locator('#start-rec').click();
    await p11.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
    await sleep(seconds * 1000);
    await p11.locator('#stop-rec').click();
    await p11.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
    await p11.getByRole('button', { name: 'Spara' }).click();
    await p11.locator('[data-screen="save"]').waitFor({ state: 'visible' });
  };

  await p11.goto(`${BASE}/index.html`);
  await p11.locator('.tile[data-action="takes"]').click();
  await p11.locator('[data-screen="takes"]').waitFor({ state: 'visible' });
  await p11.locator('#takes-empty').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  check(await p11.locator('#takes-empty').isVisible() && (await p11.locator('#takes-count').innerText()) === '0 av 3 gratisplatser används.', 'Mina tagningar: tomt från början, med 3 gratisplatser');

  await recordScene(2);
  check(await p11.locator('#save-take-btn').isEnabled() && (await p11.locator('#h-save').innerText()) === 'Spara tagningen', 'Mina tagningar: tagningen kan sparas i appen');
  await p11.locator('#save-take-btn').click();
  await p11.locator('#save-take-status').waitFor({ state: 'visible', timeout: 5000 });
  check((await p11.locator('#save-take-text').innerText()) === 'Sparad i Mina tagningar.' && await p11.locator('#save-take-btn').isDisabled(), 'Mina tagningar: tagningen sparas och kan inte sparas två gånger');
  await p11.locator('#save-take-open').click();
  await p11.locator('.take').first().waitFor({ timeout: 5000 });
  const sceneTitle = SCENES[0].titel;
  const firstRole = SCENES[0].roller[0].namn;
  const meta = await p11.locator('.take .take-text span').first().innerText();
  check((await p11.locator('.take').count()) === 1 && (await p11.locator('.take strong').first().innerText()) === sceneTitle && meta.startsWith(`Som ${firstRole} · `) && / · 0:0[1-4]$/.test(meta),
    `Mina tagningar: tagningen visas med scen, roll, tid och längd (${meta})`);
  check((await p11.locator('#takes-count').innerText()) === '1 av 3 gratisplatser används.' && await p11.locator('#takes-unsaved').isHidden(), 'Mina tagningar: en av tre platser används');

  // Tagningen finns kvar när sidan öppnas igen.
  await p11.goto(`${BASE}/index.html`);
  await p11.locator('.tile[data-action="takes"]').click();
  await p11.locator('.take').first().waitFor({ timeout: 5000 });
  await p11.locator('.take').first().click();
  await p11.locator('[data-screen="take"]').waitFor({ state: 'visible' });
  check((await p11.locator('#h-take').innerText()) === sceneTitle && ((await p11.locator('#take-video').getAttribute('src')) || '').startsWith('blob:'), 'Mina tagningar: tagningen finns kvar och spelas upp från mobilen');
  const duration = await p11.evaluate(() => new Promise((resolve) => {
    const v = document.querySelector('#take-video');
    if (v.readyState >= 1) resolve(v.duration);
    v.onloadedmetadata = () => resolve(v.duration);
    setTimeout(() => resolve(-1), 4000);
  }));
  check(duration !== -1, `Mina tagningar: videon går att spela (${duration})`);
  check(/^tagning-\d{8}-\d{4}\.(mp4|webm)$/.test((await p11.locator('#take-download').getAttribute('download')) || ''), 'Mina tagningar: tagningen kan sparas i mobilen');

  // Ta bort kräver en bekräftelse.
  await p11.locator('#take-delete').click();
  check(await p11.locator('#take-confirm').isVisible(), 'Mina tagningar: Ta bort frågar först');
  await p11.getByRole('button', { name: 'Avbryt' }).click();
  check(await p11.locator('#take-confirm').isHidden() && await p11.locator('#take-delete').isVisible(), 'Mina tagningar: Avbryt tar inte bort något');
  await p11.locator('#take-delete').click();
  await p11.locator('#take-delete-yes').click();
  await p11.locator('[data-screen="takes"]').waitFor({ state: 'visible', timeout: 5000 });
  await p11.locator('#takes-empty').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  check((await p11.locator('#takes-message').innerText()) === 'Tagningen är borttagen.' && (await p11.locator('.take').count()) === 0, 'Mina tagningar: tagningen tas bort');

  // Gratis får plats med 3. Den fjärde får man göra plats för, eller skaffa Plus.
  await p11.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('ovningssida', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const tx = db.transaction('tagningar', 'readwrite');
    for (let i = 0; i < 3; i++) {
      tx.objectStore('tagningar').add({ id: `gammal${i}`, skapad: Date.now() - (i + 1) * 3600000, titel: `Gammal ${i}`, roll: '', sekunder: 30 + i, typ: 'video/webm', storlek: 4, video: new Blob(['test'], { type: 'video/webm' }) });
    }
    await new Promise((resolve) => { tx.oncomplete = resolve; });
  });
  await recordScene(1);
  await p11.locator('#save-take-btn').click();
  await p11.locator('#save-take-status').waitFor({ state: 'visible', timeout: 5000 });
  check((await p11.locator('#save-take-text').innerText()).startsWith('Mina tagningar har plats för 3 tagningar gratis') && await p11.locator('#save-take-plus').isVisible() && await p11.locator('#save-take-btn').isEnabled(),
    'Mina tagningar: när 3 är sparade erbjuds Plus, och ingen tagning tas bort av sig själv');
  await p11.locator('#save-take-open').click();
  await p11.locator('.take').first().waitFor({ timeout: 5000 });
  check((await p11.locator('.take').count()) === 3 && await p11.locator('#takes-unsaved').isVisible() && (await p11.locator('.take strong').first().innerText()) === 'Gammal 0',
    'Mina tagningar: listan visar de 3 sparade, nyast först, och att den nya inte är sparad än');
  await p11.locator('.take').last().click();
  await p11.locator('#take-delete').click();
  await p11.locator('#take-delete-yes').click();
  await p11.locator('[data-screen="takes"]').waitFor({ state: 'visible', timeout: 5000 });
  await p11.locator('#takes-unsaved [data-action="to-save"]').click();
  await p11.locator('[data-screen="save"]').waitFor({ state: 'visible' });
  await p11.locator('#save-take-btn').click();
  await p11.locator('#save-take-text').filter({ hasText: 'Sparad' }).waitFor({ timeout: 5000 }).catch(() => {});
  check((await p11.locator('#save-take-text').innerText()) === 'Sparad i Mina tagningar.', 'Mina tagningar: efter att en gammal tagning tagits bort får den nya plats');

  // Med Plus finns ingen gräns.
  const plusPayload11 = { plan: 'plus', sub: 'sub_t', cus: 'cus_t', start: nowSec, exp: nowSec + 3600 };
  const plusToken11 = `v1.${Buffer.from(JSON.stringify(plusPayload11)).toString('base64url')}.x`;
  await p11ctx.route('**/api/plus/status', (route) => route.fulfill({ json: { plan: 'plus', token: plusToken11, usedSeconds: 0, limitSeconds: 3600 } }));
  await p11.evaluate((tok) => localStorage.setItem('plus-licens', tok), plusToken11);
  await recordScene(1);
  await p11.locator('#save-take-btn').click();
  await p11.locator('#save-take-status').waitFor({ state: 'visible', timeout: 5000 });
  check((await p11.locator('#save-take-text').innerText()) === 'Sparad i Mina tagningar.', 'Mina tagningar: med Plus går det att spara en fjärde tagning');
  await p11.locator('#save-take-open').click();
  await p11.locator('.take').first().waitFor({ timeout: 5000 });
  check((await p11.locator('.take').count()) === 4 && (await p11.locator('#takes-count').innerText()).startsWith('Med Plus kan du spara hur många'), 'Mina tagningar: med Plus syns ingen gräns');

  const p11odd = p11requests.filter((r) => r.method !== 'GET' || !(r.url.startsWith(BASE) || r.url.startsWith('blob:')));
  check(p11odd.length === 0, `Mina tagningar skickar inget över nätet (${p11odd.map((r) => r.method + ' ' + r.url.slice(0, 60)).join(' | ') || 'inga andra anrop'})`);
  const p11real = p11errors.filter((e) => !/404/.test(e));
  check(p11real.length === 0, `Inga fel i Mina tagningar (${p11real.join(' | ') || 'inga'})`);
  await p11ctx.close();

  // ---- 12. Din spelstil ----
  // Mikrofonen byts mot en ton på 180 Hz som testet slår av och på, som tal med pauser.
  const p12ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await p12ctx.route('**/api/**', (route) => route.fulfill({ json: { available: false } }));
  const p12 = await p12ctx.newPage();
  const p12errors = [];
  const p12requests = [];
  p12.on('console', (m) => { if (m.type() === 'error') p12errors.push(m.text()); });
  p12.on('pageerror', (e) => p12errors.push(String(e)));
  p12.on('request', (r) => p12requests.push({ url: r.url(), method: r.method() }));
  await p12.addInitScript(() => {
    const md = navigator.mediaDevices;
    const orig = md.getUserMedia.bind(md);
    md.getUserMedia = async (constraints) => {
      const stream = await orig(constraints);
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.frequency.value = 180;
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      const dest = ctx.createMediaStreamDestination();
      osc.connect(gain).connect(dest);
      osc.start();
      window.__talk = (on) => { gain.gain.value = on ? 0.2 : 0.001; };
      for (const track of stream.getAudioTracks()) { stream.removeTrack(track); track.stop(); }
      stream.addTrack(dest.stream.getAudioTracks()[0]);
      return stream;
    };
  });
  const dailyTake = async (talk) => {
    await p12.goto(`${BASE}/index.html`);
    await p12.locator('[data-screen="start"] [data-action="daily"]').click();
    await p12.locator('#age-ok').check();
    await p12.locator('#age-continue').click();
    await p12.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
    await p12.getByRole('button', { name: 'Till inspelningen' }).click();
    await p12.locator('[data-screen="record"]').waitFor({ state: 'visible' });
    await p12.locator('#start-rec').click();
    await p12.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
    await talk();
    await p12.locator('#stop-rec').click();
    await p12.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  };
  await dailyTake(async () => {
    for (let i = 0; i < 6; i++) {
      await p12.evaluate(() => window.__talk(true));
      await sleep(800);
      await p12.evaluate(() => window.__talk(false));
      await sleep(500);
    }
  });
  const card = p12.locator('#style-review');
  check(await card.isVisible() && (await card.locator('h2').innerText()) === 'Din spelstil', 'Din spelstil: kortet visas efter tagningen');
  const pcts = (await card.locator('.style-pct').allInnerTexts()).map((v) => parseInt(v, 10));
  const names = await card.locator('.style-name').allInnerTexts();
  check(pcts.length === 3 && new Set(names).size === 3 && pcts.every((v) => v >= 0 && v <= 100) && pcts[0] >= pcts[1] && pcts[1] >= pcts[2] && pcts.reduce((a, b) => a + b, 0) <= 100,
    `Din spelstil: de tre närmaste spelstilarna visas i procent (${names.map((n, i) => `${n} ${pcts[i]} %`).join(', ')})`);
  const notes = await card.locator('.style-obs li').allInnerTexts();
  check(notes.length >= 3 && notes.some((n) => /^Du tog \d+ pauser\./.test(n)), `Din spelstil: iakttagelser utan betyg (${notes.join(' ')})`);
  check(/^Utmaning till nästa tagning: spela som /.test(await card.locator('.style-challenge').innerText()), 'Din spelstil: en utmaning till nästa tagning');
  check(!/(betyg|poäng|bra|dålig)\b/i.test((await card.innerText()).replace('Det är ingen bedömning', '')), 'Din spelstil: inga betyg eller omdömen i kortet');

  // Spelstilen sparas med tagningen i Mina tagningar.
  await p12.getByRole('button', { name: 'Spara' }).click();
  await p12.locator('#save-take-btn').click();
  await p12.locator('#save-take-status').waitFor({ state: 'visible', timeout: 5000 });
  await p12.locator('#save-take-open').click();
  await p12.locator('.take').first().waitFor({ timeout: 5000 });
  check((await p12.locator('.take .take-style').first().innerText()) === names[0], 'Din spelstil: Mina tagningar visar spelstilen för varje tagning');
  await p12.locator('.take').first().click();
  await p12.locator('[data-screen="take"]').waitFor({ state: 'visible' });
  check(await p12.locator('#style-take').isVisible() && (await p12.locator('#style-take .style-name').first().innerText()) === names[0], 'Din spelstil: kortet finns kvar när tagningen öppnas igen');

  // Utan tal blir det ingen spelstil.
  await dailyTake(async () => { await sleep(2500); });
  check(await card.isVisible() && (await card.innerText()).includes('för lite tal') && (await card.locator('.style-bar').count()) === 0, 'Din spelstil: utan tal står det att det var för lite tal');

  const p12odd = p12requests.filter((r) => r.method !== 'GET' || !(r.url.startsWith(BASE) || r.url.startsWith('blob:')));
  check(p12odd.length === 0, `Din spelstil skickar inget över nätet (${p12odd.map((r) => r.method + ' ' + r.url.slice(0, 60)).join(' | ') || 'inga andra anrop'})`);
  check(p12errors.length === 0, `Inga fel i Din spelstil (${p12errors.join(' | ') || 'inga'})`);
  await p12ctx.close();

  // ---- 13. Appen på engelska ----
  const { SCENES_BY_LANG } = await import('../public/scenes.js');
  const p13ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  const p13calls = [];
  await p13ctx.route('**/api/**', (route) => {
    const r = route.request();
    const u = new URL(r.url());
    p13calls.push({ path: u.pathname, method: r.method(), body: r.postData() || '' });
    if (u.pathname === '/api/ai-start') {
      if (u.searchParams.has('check')) return route.fulfill({ json: { available: true } });
      return route.fulfill({ json: { available: true, plan: 'gratis', signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=a&token=en', max_seconds: 240 } });
    }
    if (u.pathname === '/api/plus/info') return route.fulfill({ json: { available: true, test: true, price: 99 } });
    if (u.pathname === '/api/plus/checkout') return route.fulfill({ json: { url: `${BASE}/en/index.html?plus=avbrutet` } });
    return route.fulfill({ status: 404, json: {} });
  });
  const p13 = await p13ctx.newPage();
  const p13errors = [];
  const p13requests = [];
  p13.on('console', (m) => { if (m.type() === 'error') p13errors.push(m.text()); });
  p13.on('pageerror', (e) => p13errors.push(String(e)));
  p13.on('request', (r) => p13requests.push({ url: r.url(), method: r.method() }));
  let enInit = null;
  await p13.routeWebSocket(/elevenlabs\.io/, (ws) => {
    ws.onMessage((message) => {
      const msg = JSON.parse(String(message));
      if (msg.type === 'conversation_initiation_client_data') {
        enInit = msg;
        ws.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'c13', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000' } }));
      }
    });
  });

  await p13.goto(`${BASE}/index.html`);
  check((await p13.locator('.lang-link').innerText()) === 'English' && (await p13.locator('.lang-link').getAttribute('href')) === 'en/', 'Språk: den svenska hemskärmen har en länk till engelska');
  await p13.locator('.lang-link').click();
  await p13.waitForURL(/\/en\/$/);
  await p13.evaluate(() => document.fonts.ready);
  check((await p13.getAttribute('html', 'lang')) === 'en' && ['Good morning.', 'Hi.', 'Good evening.', 'Good night.'].includes(await p13.locator('#h-start').innerText()), 'Språk: den engelska hemskärmen hälsar på engelska');
  const visible = (await p13.locator('body').innerText()).replace(/Övningssidan|Svenska/gi, ''); // appens namn visas med versaler
  check(!/[åäöÅÄÖ]/.test(visible), 'Språk: ingen svensk text syns på den engelska hemskärmen');
  check((await p13.locator('.lang-link').innerText()) === 'Svenska' && (await p13.locator('.lang-link').getAttribute('href')) === '../', 'Språk: den engelska hemskärmen har en länk tillbaka till svenska');

  await p13.locator('.tile[data-action="play-scenes"]').click();
  await p13.locator('#age-ok').check();
  await p13.locator('#age-continue').click();
  await p13.locator('.scene').first().waitFor();
  const enTitles = await p13.locator('.scene strong').allInnerTexts();
  const enChips = await p13.locator('#genre-chips .chip').allInnerTexts();
  check(enTitles.join('|') === SCENES_BY_LANG.en.map((x) => x.titel).join('|') && enChips.join(',') === 'All,Drama,Comedy,Thriller,Romance', `Språk: scenerna och genrerna är på engelska (${enChips.join(', ')})`);
  const enImages = await p13.$$eval('.scene-img', (imgs) => imgs.map((i) => i.complete && i.naturalWidth > 0 && new URL(i.src).pathname.startsWith('/img/')));
  check(enImages.length === SCENES_BY_LANG.en.length && enImages.every(Boolean), 'Språk: bilderna hämtas från samma mapp som på svenska');
  await p13.locator('.scene').first().click();
  await p13.locator('#role-buttons button').first().click();
  await p13.locator('[data-screen="check"]').waitFor({ state: 'visible', timeout: 10000 });
  await p13.getByRole('button', { name: 'To the recording' }).click();
  await p13.locator('[data-screen="record"]').waitFor({ state: 'visible' });
  check(await p13.locator('#mode-ai').isChecked() && /You are talking to an AI/.test(await p13.locator('#ai-note').innerText()), 'Språk: det står på engelska att man pratar med en AI');
  await p13.locator('#start-rec').click();
  await p13.locator('#stop-rec').waitFor({ state: 'visible', timeout: 8000 });
  for (let i = 0; i < 80 && !enInit; i++) await sleep(50);
  const enAgent = (enInit && enInit.conversation_config_override.agent) || {};
  check(enAgent.language === 'en' && /^You are the scene partner/.test(enAgent.prompt.prompt) && enAgent.prompt.prompt.includes(SCENES_BY_LANG.en[0].situation),
    'Språk: AI-motspelaren pratar engelska och får den engelska scenen');
  await sleep(300);
  await p13.locator('#stop-rec').click();
  await p13.locator('[data-screen="review"]').waitFor({ state: 'visible', timeout: 8000 });
  check((await p13.locator('#h-review').innerText()) === 'Watch the take' && (await p13.locator('#style-review h2').innerText()) === 'Your acting style', 'Språk: tagningen och spelstilen visas på engelska');
  await p13.getByRole('button', { name: 'Save', exact: true }).click();
  check(/^take-\d{8}-\d{4}\.(mp4|webm)$/.test((await p13.locator('#download-link').getAttribute('download')) || ''), 'Språk: filen får ett engelskt namn');
  await p13.locator('#save-take-btn').click();
  await p13.locator('#save-take-text').waitFor({ state: 'visible', timeout: 5000 });
  check((await p13.locator('#save-take-text').innerText()) === 'Saved in My takes.', 'Språk: Mina tagningar fungerar på engelska');

  // Plus på engelska: köpet säger till servern att Stripe ska visas på engelska.
  await p13.goto(`${BASE}/en/index.html`);
  await p13.locator('#plus-banner').click();
  await p13.locator('#plus-test').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  check((await p13.locator('.plan-plus .price').innerText()) === '99 SEK a month' && (await p13.locator('#plus-buy a').getAttribute('href')) === 'kopvillkor.html', 'Språk: Plus på engelska, med köpvillkoren på engelska');
  await Promise.all([p13.waitForURL(/plus=avbrutet/), p13.locator('#plus-buy-btn').click()]);
  const enCheckout = p13calls.find((c) => c.path === '/api/plus/checkout');
  check(enCheckout && JSON.parse(enCheckout.body).lang === 'en', 'Språk: köpet startas på engelska');
  await p13.locator('#plus-message').waitFor({ state: 'visible', timeout: 5000 });
  check((await p13.locator('#plus-message').innerText()) === 'The purchase was cancelled. Nothing has been charged.' && /\/en\//.test(p13.url()), 'Språk: efter Stripe kommer man tillbaka till den engelska sidan');
  await p13.locator('footer a[href="?angra=1"]').click();
  await p13.locator('[data-screen="angra"]').waitFor({ state: 'visible' });
  check((await p13.locator('#h-angra').innerText()) === 'Withdraw from your purchase', 'Språk: ångerknappen finns på engelska');

  const p13odd = p13requests.filter((r) => !(r.url.startsWith(BASE) || r.url.startsWith('blob:')) || (r.method !== 'GET' && !/\/api\/(ai-end|plus\/checkout)$/.test(new URL(r.url).pathname)));
  check(p13odd.length === 0, `Språk: inget annat skickas från de engelska sidorna (${p13odd.map((r) => r.method + ' ' + r.url.slice(0, 60)).join(' | ') || 'inga andra anrop'})`);
  check(p13errors.length === 0, `Inga fel på de engelska sidorna (${p13errors.join(' | ') || 'inga'})`);
  await p13ctx.close();
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla test gick igenom.');
