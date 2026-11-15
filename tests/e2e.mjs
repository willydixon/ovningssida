// Automatiska tester för testversionen. Körs med: node tests/e2e.mjs
// Startar en lokal server för public/ och går igenom flödet i Chromium med
// falsk kamera och mikrofon. Kontrollerar också att inget skickas över nätet.

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  await page.getByRole('button', { name: 'Börja öva' }).click();
  check(await page.locator('#age-continue').isDisabled(), '18 år: Fortsätt är spärrad innan rutan är ikryssad');
  check((await page.evaluate(() => window.__gum)) === 0, '18 år: kameran har inte startats före bekräftelsen');
  await page.locator('#age-ok').check();
  await page.locator('#age-continue').click();

  await page.locator('.scene').first().click();
  check(await page.locator('#role-pick').isVisible(), 'Scen: rollvalet visas');
  check((await page.locator('.scene .badge').count()) === 3, 'Scen: alla tre scener är märkta som utkast');
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
  await p2.getByRole('button', { name: 'Börja öva' }).click();
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
  for (const f of ['om', 'ai', 'integritet', 'villkor', 'kontakt']) {
    const r = await info.goto(`${BASE}/${f}.html`);
    check(r && r.ok(), `Informationssidan ${f}.html laddas`);
    check((await info.locator('link[rel="manifest"]').count()) === 1, `${f}.html länkar till app-filen`);
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

  for (const f of ['tack', 'fragor-tack']) {
    const r = await p5.goto(`${BASE}/${f}.html`);
    check(r && r.ok(), `${f}.html laddas`);
  }
  check(p5errors.length === 0, `Inga fel på de nya sidorna (${p5errors.join(' | ') || 'inga'})`);
  check(p5requests.every((r) => r.method === 'GET' && r.url.startsWith(BASE)), 'De nya sidorna skickar inget och anropar inga andra adresser');
  check((await p5ctx.cookies()).length === 0, 'De nya sidorna sätter inga kakor');
  await p5ctx.close();

  // ---- 6. Motspelaren läser repliker ----
  // Talsyntesen byts mot en falsk med en svensk röst som "läser" i 1,2 s, och
  // mikrofonen mot en ton som testet slår på och av, som om användaren pratar.
  const { SCENES } = await import('../public/scenes.js');
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
  await p6.getByRole('button', { name: 'Börja öva' }).click();
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
  await p7.getByRole('button', { name: 'Börja öva' }).click();
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
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla test gick igenom.');
