// ActWith AI, testversion.
// Allt körs i mobilen. Inspelningen hålls i webbläsarens minne och skickas aldrig
// någonstans. Sidans säkerhetspolicy (connect-src) tillåter bara anrop till den
// egna sidan och till AI-motspelaren hos ElevenLabs, som bara får ljud och bara
// när användaren har valt AI som motspelare. Betyget och ansiktsanalysen räknas
// också i mobilen (rating.js och face.js), och inga bilder lämnar den. Bilden med
// resultatet att dela ritas i mobilen (sharecard.js) och lämnar den bara om användaren
// själv delar eller sparar den.

import { SCENES, LEVELS, scenesInLevel } from './scenes.js';
import { levelsFrom, lumaStats, percentile, rateSpeech, ratePeaks, rateNoise, rateLight } from './check.js';
import { ScenePlayer, createVoiceDetector, expectedMs } from './partner.js';
import { AiPartner, buildAiSetup } from './ai-partner.js';
import { challengeFor, WARMUP, fiveWaysScene, MONOLOGUES, monologueScene, IMPROVS, improvScene } from './content.js';
import { FRAME_MS, pitchHz, createStyleMeter, readStyle, styleById, band } from './style.js';
import { FREE_TAKES, canSaveMore, takeId, listTakes, getTake, addTake, deleteTake, countTakes, isQuotaError } from './takes.js';
import { rateTake, demandFor, levelResult, readResults, addResult as addRating, RESULTS_KEY, LEVEL_SIZE, LOOK_DOWN_LIMIT } from './rating.js';
import { FACE_MS, createFaceMeter, faceModelAvailable, loadFaceLandmarker, readFace } from './face.js';
import { makeCard } from './sharecard.js';
import { t, lang } from './texts.js'; // alla texter som visas ligger i texts.js, på sidans språk

// Längsta tagning och AI-minuter beror på planen. Se också netlify/lib/plus.mjs.
const PLANS = {
  gratis: { takeSeconds: 180, aiSeconds: 300 },
  plus: { takeSeconds: 600, aiSeconds: 3600 }
};
const maxTakeSeconds = () => PLANS[state.plan].takeSeconds;

// MP4 i första hand, WebM som reserv. Webbläsaren avgör vad den klarar.
const MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.42E01F,mp4a.40.2"',
  'video/mp4;codecs="avc1.42E01F,opus"',
  'video/mp4;codecs=avc1.42000a,opus',
  'video/mp4;codecs="avc1,mp4a.40.2"',
  'video/mp4',
  'video/webm;codecs="vp9,opus"',
  'video/webm;codecs="vp8,opus"',
  'video/webm'
];

const state = {
  adult: false,
  scene: null,
  role: null,
  stream: null,
  audioCtx: null,
  analyser: null,
  buf: null,
  meterRaf: 0,
  checking: false,
  recorder: null,
  chunks: [],
  mime: '',
  recStart: 0,
  recTimer: 0,
  stopReason: '',
  blob: null,
  blobUrl: null,
  file: null,
  takeSeconds: 0, // hur lång den senaste tagningen blev
  savedTakeId: null, // satt när tagningen finns i Mina tagningar
  takeView: null, // tagningen som visas från Mina tagningar: { id, url, file }
  // Din spelstil
  styleMeter: null,
  styleTimer: 0,
  styleReading: null, // det som visas efter tagningen
  partnerEndedAt: 0, // när motspelarens röst senast tystnade
  // Motspelaren
  voice: null,
  player: null,
  vad: null,
  levelTimer: 0,
  levelTicks: 0,
  listening: null,
  partnerSpeaking: false,
  utterance: null,
  // Plus
  plan: 'gratis',
  license: null,
  plusUsed: 0, // använda AI-sekunder den här månaden, för Plus
  plusInfo: null, // svaret från /api/plus/info
  // AI-motspelaren
  micSource: null,
  aiAvailable: null, // null tills funktionen har svarat
  ai: null,
  partnerChosen: false, // sant när användaren själv har valt motspelare
  // Nivåer och betyg
  level: 1, // nivån som visas bland scenerna
  rating: null, // betyget för den senaste tagningen
  ratingBest: null, // det bästa betyget för scenen, efter den senaste tagningen
  ratingImproved: false,
  share: null, // bilden med resultatet att dela: { url, file }
  shareRun: 0, // räknas upp för varje ny bild, så att en gammal inte visas
  // Ansiktet
  faceModel: null, // null tills det är kollat om modellen finns på sidan
  faceLandmarker: null,
  faceMeter: null,
  faceTimer: 0,
  faceReading: null
};

const $ = (sel) => document.querySelector(sel);

// Skärmarna där menyn längst ned syns, och vilken flik som då är vald.
const TABS = { start: 'start', pick: 'start', plus: 'start', angra: 'start', takes: 'start', take: 'start', scenes: 'scenes', result: 'scenes', warmup: 'warmup', 'warmup-done': 'warmup' };

function show(name) {
  for (const el of document.querySelectorAll('[data-screen]')) {
    el.hidden = el.dataset.screen !== name;
  }
  if (name !== 'check') cancelAnimationFrame(state.meterRaf);
  if (name !== 'warmup') stopWarmupTimer();
  if (name !== 'take') releaseTakeView();
  const tab = TABS[name];
  $('#tabbar').hidden = !tab;
  document.body.classList.toggle('with-tabs', !!tab);
  for (const b of document.querySelectorAll('#tabbar [data-tab]')) {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
  const heading = document.querySelector(`[data-screen="${name}"] h1`);
  if (heading) heading.focus({ preventScroll: true });
}

// ---------- Hemskärmen ----------

function greeting(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 10) return t('greet_morning');
  if (hour >= 10 && hour < 17) return t('greet_day');
  if (hour >= 17 && hour < 23) return t('greet_evening');
  return t('greet_night');
}

function renderHome() {
  $('#h-start').textContent = greeting();
  $('#daily-text').textContent = challengeFor();
}

// Kameran används bara av den som har bekräftat 18 år. Svaret gäller tills sidan stängs.
function requireAdult(next) {
  if (state.adult) {
    next();
    return;
  }
  state.afterAge = next;
  $('#age-ok').checked = false;
  $('#age-continue').disabled = true;
  show('age');
}

function goScenes() {
  stopCamera();
  clearTake();
  resetScenePicker();
  show('scenes');
}

// Dagens utmaning spelas in som en scen med en enda roll och utan motspelare.
function startDaily() {
  stopCamera();
  clearTake();
  state.scene = {
    id: 'dagens-utmaning',
    titel: t('daily_kicker'),
    situation: challengeFor(),
    langd_sekunder: 120,
    roller: [{ id: 'A', namn: t('daily_you') }],
    repliker: []
  };
  chooseRole('A');
}

// ---------- En replik fem sätt, monologer och improvisation ----------

const youTexts = () => ({ you: t('daily_you'), title: t('fiveways_title'), situation: t('fiveways_situation') });

function startExercise(scene) {
  stopCamera();
  clearTake();
  state.scene = scene;
  chooseRole('A');
}

// Listan att välja ur, för monologer och situationer att improvisera.
function showPick({ title, text, notice = '', items, onChoose, disabled = false, plusLink = false }) {
  $('#h-pick').textContent = title;
  $('#pick-text').textContent = text;
  const box = $('#pick-notice');
  box.textContent = notice;
  if (plusLink) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'primary';
    b.dataset.action = 'to-plus';
    b.textContent = t('plus_read_more');
    box.append(document.createElement('br'), b);
  }
  box.hidden = !notice;
  const list = $('#pick-list');
  list.textContent = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene';
    button.disabled = disabled;
    const tags = document.createElement('span');
    tags.className = 'tags';
    const genre = document.createElement('span');
    genre.className = 'tag';
    genre.textContent = item.genre;
    const badge = document.createElement('span');
    badge.className = 'tag badge';
    badge.textContent = t('scene_draft_badge');
    tags.append(genre, badge);
    const title2 = document.createElement('strong');
    title2.textContent = item.titel;
    const desc = document.createElement('span');
    desc.textContent = item.text || item.situation;
    button.append(tags, title2, desc);
    button.addEventListener('click', () => onChoose(item));
    list.append(button);
  }
  show('pick');
}

function pickMonologue() {
  showPick({
    title: t('monologue_title'),
    text: t('monologue_text'),
    items: MONOLOGUES,
    onChoose: (m) => startExercise(monologueScene(m, youTexts()))
  });
}

async function pickImprov() {
  await refreshAiAvailability();
  const ok = !!state.aiAvailable && !!window.AudioWorkletNode;
  const left = aiSecondsLeft() >= 15;
  showPick({
    title: t('improv_title'),
    text: t('improv_text'),
    notice: !ok ? t('improv_unavailable') : (left ? '' : t(state.plan === 'plus' ? 'ai_paywall_plus' : 'ai_paywall_free')),
    plusLink: ok && !left && state.plan !== 'plus',
    items: IMPROVS,
    disabled: !ok || !left,
    onChoose: (s) => startExercise(improvScene(s, youTexts()))
  });
}

// ---------- Uppvärmning ----------

const warm = { step: 0, timer: 0, twister: 0 };

function stopWarmupTimer() {
  clearInterval(warm.timer);
  warm.timer = 0;
}

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function renderWarmup() {
  stopWarmupTimer();
  const ex = WARMUP[warm.step];
  $('#warmup-step').textContent = t('warmup_step', { n: warm.step + 1, total: WARMUP.length });
  $('#h-warmup').textContent = ex.titel;
  $('#warmup-text').textContent = ex.text;
  $('#breath').hidden = !ex.andning;
  $('#breath-label').textContent = '';
  $('#breath-circle').className = 'breath-circle';
  $('#twister').hidden = !ex.lista;
  if (ex.lista) $('#twister-text').textContent = ex.lista[warm.twister % ex.lista.length];
  $('#warmup-timer').hidden = true;
  $('#warmup-start').hidden = !ex.sekunder;
  $('#warmup-next').textContent = warm.step === WARMUP.length - 1 ? t('warmup_finish') : t('warmup_next');
}

function startWarmup() {
  warm.step = 0;
  renderWarmup();
  show('warmup');
}

// Klockan för steget. Andningen visar också in, håll och ut i takt.
function runWarmupTimer() {
  const ex = WARMUP[warm.step];
  stopWarmupTimer();
  const started = Date.now();
  const timer = $('#warmup-timer');
  timer.hidden = false;
  $('#warmup-start').hidden = true;
  const phases = ex.andning || [];
  const cycle = phases.reduce((sum, [, s]) => sum + s, 0);
  const tick = () => {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const left = Math.max(0, ex.sekunder - elapsed);
    timer.textContent = left > 0 ? t('warmup_time_left', { time: clock(left) }) : t('warmup_time_done');
    if (cycle && left > 0) {
      let at = elapsed % cycle;
      for (const [phase, seconds] of phases) {
        if (at < seconds) {
          const key = { in: 'breath_in', hall: 'breath_hold', ut: 'breath_out' }[phase];
          $('#breath-label').textContent = t(key);
          $('#breath-circle').className = `breath-circle ${phase}`;
          break;
        }
        at -= seconds;
      }
    }
    if (left === 0) {
      stopWarmupTimer();
      $('#breath-label').textContent = '';
      $('#breath-circle').className = 'breath-circle';
      $('#warmup-next').focus({ preventScroll: true });
    }
  };
  tick();
  warm.timer = setInterval(tick, 250);
}

function nextWarmup() {
  if (warm.step < WARMUP.length - 1) {
    warm.step += 1;
    renderWarmup();
    window.scrollTo(0, 0);
    $('#h-warmup').focus({ preventScroll: true });
  } else {
    stopWarmupTimer();
    show('warmup-done');
  }
}

// ---------- Startsida ----------

const ua = navigator.userAgent || '';
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp/i.test(ua);
if (IN_APP) $('#inapp-notice').hidden = false;

async function copyLink() {
  const status = $('[data-copy-status]');
  try {
    await navigator.clipboard.writeText(location.href);
    status.textContent = t('inapp_copied');
  } catch {
    status.textContent = t('inapp_copy_manual', { url: location.href });
  }
}

// ---------- 18 år ----------

$('#angra-name').addEventListener('input', () => {
  $('#angra-send').disabled = !$('#angra-ok').checked || !$('#angra-name').value.trim();
});

$('#age-ok').addEventListener('change', (e) => {
  $('#age-continue').disabled = !e.target.checked;
});

// ---------- Scener ----------

// Tal med en decimal på sidans språk: 1,5 på svenska och 1.5 på engelska.
const decimal = (n) => new Intl.NumberFormat(t('locale_code'), { maximumFractionDigits: 1 }).format(n);

function formatLength(seconds) {
  if (seconds < 60) return t('length_seconds', { n: seconds });
  const minutes = Math.round((seconds / 60) * 2) / 2;
  return t('length_minutes', { n: decimal(minutes) });
}

// ---------- Nivåer ----------
// Nivå 1 är gratis och nivå 2–5 ingår i Plus. Varje nivå har 5 scener, och när alla har
// ett betyg kommer resultatet. Betygen sparas bara i mobilen (rating.js).

const levelLocked = (level) => !!(level && level.plus) && state.plan !== 'plus';
const levelByNumber = (niva) => LEVELS.find((l) => l.niva === niva) || LEVELS[0];

function loadResults() {
  return readResults(storageGet(STORE.results));
}

function saveResults(results) {
  storageSet(STORE.results, JSON.stringify(results));
}

function renderLevelChips() {
  const box = $('#level-chips');
  box.textContent = '';
  for (const level of LEVELS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = t('level_chip', { n: level.niva });
    if (levelLocked(level)) chip.append(el('span', t('level_chip_plus'), 'chip-plus'));
    chip.setAttribute('aria-pressed', String(level.niva === state.level));
    chip.addEventListener('click', () => {
      state.level = level.niva;
      $('#level-status').hidden = true;
      renderLevelChips();
      renderScenes();
    });
    box.append(chip);
  }
}

function renderScenes() {
  const level = levelByNumber(state.level);
  const locked = levelLocked(level);
  const scenes = scenesInLevel(level.niva);
  const results = loadResults();
  const done = scenes.filter((s) => results.scener[s.id]).length;
  $('#level-name').textContent = t('level_title', { n: level.niva, name: level.namn });
  $('#level-text').textContent = level.text;
  $('#level-progress').textContent = t('level_progress', { done, total: scenes.length });
  $('#level-progress').hidden = locked;
  $('#level-result').hidden = done < scenes.length;
  $('#level-result').dataset.level = String(level.niva);
  $('#level-lock').hidden = !locked;

  const list = $('#scene-list');
  list.textContent = '';
  for (const scene of scenes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = locked ? 'scene locked' : 'scene';

    if (scene.bild) {
      const img = document.createElement('img');
      img.className = 'scene-img';
      img.src = new URL(`img/${scene.bild}.svg`, import.meta.url).href; // samma mapp som skriptet, även från public/en/
      img.alt = '';
      img.width = 400;
      img.height = 240;
      img.decoding = 'async';
      button.append(img);
    }

    const tags = document.createElement('span');
    tags.className = 'tags';
    if (scene.genre) tags.append(el('span', scene.genre, 'tag'));
    if (locked) tags.append(el('span', t('level_chip_plus'), 'tag plus-tag'));
    const best = results.scener[scene.id];
    if (best) tags.append(el('span', t('scene_best', { betyg: best.betyg }), 'tag score-tag'));
    if (scene.status !== 'godkand') tags.append(el('span', t('scene_draft_badge'), 'tag badge'));

    const title = document.createElement('strong');
    title.textContent = scene.titel;

    const situation = document.createElement('span');
    situation.textContent = scene.situation;

    const meta = document.createElement('span');
    meta.className = 'meta';
    const approval = scene.godkand_av
      ? t('scene_approved_by', { name: scene.godkand_av })
      : t('scene_not_reviewed');
    meta.textContent = t('scene_meta', { length: formatLength(scene.langd_sekunder), roles: scene.roller.length, approval });

    button.append(tags, title, situation, meta);
    button.addEventListener('click', () => (locked ? showPlus(t('level_locked_message')) : pickScene(scene)));
    list.append(button);
  }
}

function pickScene(scene) {
  state.scene = scene;
  if (scene.niva) state.level = scene.niva;
  $('#scene-list').hidden = true;
  $('#level-chips').hidden = true;
  $('#level-head').hidden = true;
  $('#role-pick').hidden = false;
  $('#role-situation').textContent = `${scene.titel}: ${scene.situation}`;
  const buttons = $('#role-buttons');
  buttons.textContent = '';
  for (const role of scene.roller) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'primary';
    b.textContent = t('role_button', { name: role.namn });
    b.addEventListener('click', () => chooseRole(role.id));
    buttons.append(b);
  }
  $('#h-role').focus({ preventScroll: true });
}

function resetScenePicker() {
  renderLevelChips();
  renderScenes();
  $('#scene-list').hidden = false;
  $('#level-chips').hidden = false;
  $('#level-head').hidden = false;
  $('#role-pick').hidden = true;
}

async function chooseRole(roleId) {
  state.role = roleId;
  ensureAudioContext(); // måste skapas i samma tryck för att fungera på iPhone
  const ok = await startCamera();
  if (!ok) return;
  attachPreview('#preview-check');
  resetCheck();
  show('check');
  startMeter();
}

// ---------- Kamera och mikrofon ----------

function ensureAudioContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!state.audioCtx) {
    try { state.audioCtx = new AC(); } catch { return null; }
  }
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(() => {});
  return state.audioCtx;
}

function streamIsLive() {
  return !!state.stream && state.stream.getTracks().every((t) => t.readyState === 'live');
}

async function startCamera() {
  if (streamIsLive()) return true;
  stopCamera();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    showHelp('unsupported');
    return false;
  }
  const video = { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
  const audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video, audio });
  } catch (err) {
    if (err && err.name === 'OverconstrainedError') {
      try {
        state.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err2) {
        showHelp(err2 && err2.name);
        return false;
      }
    } else {
      showHelp(err && err.name);
      return false;
    }
  }
  for (const track of state.stream.getTracks()) track.addEventListener('ended', onTrackEnded);
  connectAnalyser();
  return true;
}

function stopCamera() {
  cancelAnimationFrame(state.meterRaf);
  if (state.stream) {
    for (const track of state.stream.getTracks()) {
      track.removeEventListener('ended', onTrackEnded);
      track.stop();
    }
  }
  state.stream = null;
  state.analyser = null;
  state.micSource = null;
}

function attachPreview(selector) {
  const video = $(selector);
  if (video.srcObject !== state.stream) video.srcObject = state.stream;
  video.play().catch(() => {});
}

function onTrackEnded() {
  if (state.recorder && state.recorder.state === 'recording') {
    stopRecording('ended');
  }
}

function connectAnalyser() {
  const ctx = state.audioCtx;
  state.analyser = null;
  if (!ctx || !state.stream || !state.stream.getAudioTracks().length) return;
  try {
    const source = ctx.createMediaStreamSource(state.stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser); // kopplas inte till högtalaren, så inget eko
    state.analyser = analyser;
    state.micSource = source; // används också av AI-motspelaren
    state.buf = new Float32Array(analyser.fftSize);
  } catch {
    state.analyser = null;
    state.micSource = null;
  }
}

function readLevels() {
  const analyser = state.analyser;
  if (!analyser) return null;
  const buf = state.buf;
  if (analyser.getFloatTimeDomainData) {
    analyser.getFloatTimeDomainData(buf);
  } else {
    const bytes = new Uint8Array(buf.length);
    analyser.getByteTimeDomainData(bytes);
    for (let i = 0; i < bytes.length; i++) buf[i] = (bytes[i] - 128) / 128;
  }
  return levelsFrom(buf);
}

function startMeter() {
  cancelAnimationFrame(state.meterRaf);
  const fill = $('#meter-fill');
  const tick = () => {
    const levels = readLevels();
    if (levels) {
      const pct = Math.max(0, Math.min(100, ((levels.rmsDb + 60) / 60) * 100));
      fill.style.width = `${pct}%`;
    }
    state.meterRaf = requestAnimationFrame(tick);
  };
  tick();
}

// ---------- Teknikkoll ----------

function resetCheck() {
  $('#check-results').hidden = true;
  $('#check-results').textContent = '';
  $('#run-check').textContent = t('check_button_start');
  $('#run-check').disabled = false;
  $('#check-prompt').textContent = t('check_prompt_start');
}

function sample(ms) {
  return new Promise((resolve) => {
    const rms = [];
    let peak = -120;
    let clipped = false;
    const t0 = performance.now();
    const step = () => {
      const levels = readLevels();
      if (levels) {
        rms.push(levels.rmsDb);
        if (levels.peakDb > peak) peak = levels.peakDb;
        if (levels.clipped) clipped = true;
      }
      if (performance.now() - t0 < ms) setTimeout(step, 50);
      else resolve({ rms, peak, clipped });
    };
    step();
  });
}

function measureLight(video) {
  if (!video || !video.videoWidth) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 48;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(video, 0, 0, canvas.width, canvas.height);
  return lumaStats(g.getImageData(0, 0, canvas.width, canvas.height).data);
}

function addResult(list, name, [level, label, advice], value) {
  const li = document.createElement('li');
  li.className = level;
  const head = document.createElement('span');
  head.className = 'label';
  head.textContent = `${name}: ${label}`;
  const extra = document.createElement('span');
  extra.className = 'advice';
  extra.textContent = value ? `${advice} (${value})` : advice;
  li.append(head, extra);
  list.append(li);
}

async function runCheck() {
  if (state.checking) return;
  state.checking = true;
  ensureAudioContext();
  const button = $('#run-check');
  const prompt = $('#check-prompt');
  const list = $('#check-results');
  button.disabled = true;
  list.hidden = true;
  list.textContent = '';

  if (!state.analyser) {
    prompt.textContent = t('check_prompt_no_audio');
  } else {
    prompt.textContent = t('check_prompt_silence');
    const noise = await sample(2000);
    prompt.textContent = t('check_prompt_speak');
    const speech = await sample(4000);
    const speechDb = percentile(speech.rms, 0.9);
    const noiseDb = percentile(noise.rms, 0.5);
    const peakDb = Math.max(speech.peak, noise.peak);
    const db = (value) => t('check_value_db', { n: Math.round(value) });
    addResult(list, t('check_name_speech'), rateSpeech(speechDb), db(speechDb));
    addResult(list, t('check_name_peaks'), ratePeaks(peakDb, speech.clipped || noise.clipped), db(peakDb));
    addResult(list, t('check_name_noise'), rateNoise(noiseDb), db(noiseDb));
  }

  const light = measureLight($('#preview-check'));
  addResult(list, t('check_name_light'), rateLight(light), light ? t('check_value_light', { n: Math.round(light.mean) }) : '');

  const frame = document.createElement('li');
  frame.className = 'neutral';
  const head = document.createElement('span');
  head.className = 'label';
  head.textContent = t('check_frame_label');
  const advice = document.createElement('span');
  advice.className = 'advice';
  advice.textContent = t('check_frame_advice');
  frame.append(head, advice);
  list.append(frame);

  list.hidden = false;
  prompt.textContent = t('check_prompt_done');
  button.textContent = t('check_button_again');
  button.disabled = false;
  state.checking = false;
}

// ---------- Inspelning ----------

function renderScript() {
  const box = $('#script');
  box.textContent = '';
  const scene = state.scene;
  if (!scene) return;
  const names = Object.fromEntries(scene.roller.map((r) => [r.id, r.namn]));
  const intro = document.createElement('p');
  intro.className = 'situation';
  intro.textContent = scene.situation;
  box.append(intro);
  const myRole = scene.roller.find((r) => r.id === state.role);
  if (myRole && myRole.vill) {
    const goal = document.createElement('p');
    goal.className = 'goal';
    goal.textContent = t('record_goal', { vill: myRole.vill });
    box.append(goal);
  }
  for (const [index, line] of scene.repliker.entries()) {
    const p = document.createElement('p');
    const mine = line.roll === state.role;
    p.className = mine ? 'mine' : 'theirs';
    p.dataset.line = String(index);
    // etikett ersätter rollnamnet, till exempel sättet i En replik, fem sätt. Tom etikett: inget namn.
    const label = typeof line.etikett === 'string' ? line.etikett : (mine ? t('record_you', { name: names[line.roll] }) : names[line.roll]);
    if (label) {
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = label;
      p.append(who);
    }
    p.append(document.createTextNode(line.text));
    box.append(p);
  }
}

function pickMime() {
  if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  return MIME_CANDIDATES.find((type) => {
    try { return MediaRecorder.isTypeSupported(type); } catch { return false; }
  }) || '';
}

function countdown(seconds) {
  return new Promise((resolve) => {
    const el = $('#countdown');
    let left = seconds;
    el.textContent = String(left);
    el.hidden = false;
    const timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        el.hidden = true;
        resolve();
      } else {
        el.textContent = String(left);
      }
    }, 1000);
  });
}

async function toRecord() {
  ensureAudioContext();
  const ok = await startCamera();
  if (!ok) return;
  attachPreview('#preview-record');
  renderScript();
  await refreshAiAvailability();
  renderPlanBits();
  resetPartner();
  setupFace();
  $('#start-rec').hidden = false;
  $('#start-rec').disabled = false;
  $('#stop-rec').hidden = true;
  $('#rec-badge').hidden = true;
  show('record');
}

async function startRecording() {
  const startButton = $('#start-rec');
  startButton.disabled = true;
  ensureAudioContext();
  const mode = partnerMode();
  const withPartner = mode === 'voice' || mode === 'guided'; // sidan följer repliken med ljudnivån
  if (mode === 'voice') unlockSpeech(); // måste ske i själva trycket, före allt som väntar
  if (!streamIsLive()) {
    const ok = await startCamera();
    if (!ok) return;
    attachPreview('#preview-record');
  }
  $('#partner-box').hidden = true;
  if (withPartner) startLevelLoop(); // mäter bakgrundsljudet under nedräkningen
  if (mode === 'ai') startAi(); // kopplar upp under nedräkningen
  await countdown(3);

  const mime = pickMime();
  const options = { videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 };
  if (mime) options.mimeType = mime;
  let recorder;
  try {
    recorder = new MediaRecorder(state.stream, options);
  } catch {
    try {
      recorder = new MediaRecorder(state.stream);
    } catch {
      stopPartner();
      stopAi();
      showHelp('recorder');
      return;
    }
  }

  state.recorder = recorder;
  state.mime = recorder.mimeType || mime || 'video/mp4';
  state.chunks = [];
  state.stopReason = '';
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) state.chunks.push(e.data); };
  recorder.onstop = onRecordingStopped;
  recorder.onerror = () => stopRecording('error');
  recorder.start(1000);

  state.recStart = Date.now();
  startButton.hidden = true;
  $('#stop-rec').hidden = false;
  $('#rec-badge').hidden = false;
  updateRecTime();
  state.recTimer = setInterval(updateRecTime, 250);
  if (withPartner) startPartner();
  if (state.ai) state.ai.begin();
  startStyle();
  startFace();
}

function updateRecTime() {
  const s = Math.floor((Date.now() - state.recStart) / 1000);
  $('#rec-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (s >= maxTakeSeconds()) stopRecording('max');
}

function stopRecording(reason) {
  clearInterval(state.recTimer);
  finishStyle();
  finishFace();
  stopPartner();
  stopAi();
  if (!state.stopReason) state.stopReason = reason || 'user';
  const recorder = state.recorder;
  if (recorder && recorder.state !== 'inactive') {
    state.takeSeconds = Math.max(1, Math.round((Date.now() - state.recStart) / 1000));
    try { recorder.stop(); } catch { /* redan stoppad */ }
  }
  $('#rec-badge').hidden = true;
  $('#stop-rec').hidden = true;
  $('#start-rec').hidden = false;
  $('#start-rec').disabled = false;
}

function onRecordingStopped() {
  const type = (state.mime || 'video/mp4').split(';')[0];
  const blob = new Blob(state.chunks, { type });
  state.chunks = [];
  state.recorder = null;
  if (!blob.size) {
    showHelp('empty');
    return;
  }
  clearTake();
  state.blob = blob;
  state.blobUrl = URL.createObjectURL(blob);

  const note = $('#review-note');
  const reasons = {
    hidden: 'stopped_hidden',
    ended: 'stopped_ended',
    error: 'stopped_error',
    max: 'stopped_max'
  };
  const reason = reasons[state.stopReason];
  note.textContent = reason ? t(reason, { n: maxTakeSeconds() / 60 }) : '';
  note.hidden = !reason;

  const playback = $('#playback');
  $('#playback-error').hidden = true;
  playback.onerror = () => { $('#playback-error').hidden = false; };
  playback.src = state.blobUrl;
  rateCurrentTake();
  renderRating($('#rating-review'));
  renderStyle($('#style-review'), state.styleReading);
  show('review');
}

function clearTake() {
  const playback = $('#playback');
  playback.removeAttribute('src');
  playback.load();
  if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
  state.blob = null;
  state.blobUrl = null;
  state.file = null;
  state.savedTakeId = null;
}

async function retake() {
  clearTake();
  await toRecord();
}

// ---------- Motspelaren ----------
// Mobilens egen uppläsningsröst läser motspelarens repliker. Ljudnivån från
// mikrofonen avgör när användaren har sagt sin replik. Logiken finns i partner.js.

const synth = window.speechSynthesis || null;
const LEVEL_MS = 50;
const AFTER_PARTNER_MS = 400; // efterklang från rösten som inte ska räknas som tal

// En uppläsningsröst på sidans språk, till exempel svenska på de svenska sidorna.
function findVoice() {
  if (!synth || typeof synth.getVoices !== 'function' || !window.SpeechSynthesisUtterance) return null;
  let voices = [];
  try { voices = synth.getVoices() || []; } catch { voices = []; }
  // Bara röster som finns i mobilen. En röst som går via nätet skulle skicka replikerna iväg.
  const code = new RegExp(`^${lang()}([-_]|$)`, 'i');
  const matching = voices.filter((v) => code.test(v.lang || '') && v.localService !== false);
  return matching.find((v) => v.default) || matching[0] || null;
}

function updateVoice() {
  state.voice = findVoice();
  const found = !!state.voice;
  $('#partner-toggle').hidden = !found;
  $('#partner-no-voice').hidden = found;
  updateModes();
}

// Vilken motspelare som gäller: 'ai', 'voice' (mobilens röst), 'guided' (en övning där
// sidan markerar nästa del när du pausar) eller 'none'.
function partnerMode() {
  const scene = state.scene;
  if (scene && scene.typ === 'improv') return 'ai';
  if (scene && scene.typ === 'guidad') return 'guided';
  if (!scene || scene.roller.length < 2) return 'none';
  const checked = document.querySelector('input[name="partner"]:checked');
  return checked ? checked.value : 'none';
}

// Visar bara de val som fungerar här, och texten som hör till det valda. Tills
// användaren själv har valt gäller ordningen på sidan: AI, mobilens röst, ingen röst.
function updateModes() {
  // Övningarna har ingen valfri motspelare: dagens utmaning, monologen och En replik
  // fem sätt spelas ensam, och improvisationen spelas alltid mot AI:n.
  const scene = state.scene;
  const fixed = !scene || scene.roller.length < 2 || scene.typ === 'improv' || scene.typ === 'guidad';
  $('#partner-box').hidden = fixed;
  if (fixed) {
    $('#ai-note').hidden = partnerMode() !== 'ai';
    if (scene && scene.typ === 'improv') updateAiMinutes();
    else $('#ai-paywall').hidden = true;
    return;
  }
  const aiOk = !!state.aiAvailable && !!state.micSource && !!window.AudioWorkletNode;
  $('#mode-ai-row').hidden = !aiOk;
  const radios = [...document.querySelectorAll('input[name="partner"]')];
  const visible = radios.filter((r) => !r.closest('label').hidden);
  const checked = radios.find((r) => r.checked);
  if ((!state.partnerChosen || !visible.includes(checked)) && visible[0]) visible[0].checked = true;
  const mode = partnerMode();
  $('#ai-note').hidden = mode !== 'ai';
  $('#partner-note').hidden = mode !== 'voice';
  updateAiMinutes();
}

// Visar hur många AI-minuter som finns kvar, och en väg till Plus när de är slut.
function updateAiMinutes() {
  const left = aiSecondsLeft();
  $('#ai-minutes').textContent = t(state.plan === 'plus' ? 'ai_minutes_plus' : 'ai_minutes_free', { min: minutesText(left) });
  const out = left < 15;
  $('#mode-ai').disabled = out;
  if (out && $('#mode-ai').checked) {
    const fallback = [...document.querySelectorAll('input[name="partner"]')].find((r) => r.value !== 'ai' && !r.closest('label').hidden);
    if (fallback) fallback.checked = true;
  }
  const improv = !!state.scene && state.scene.typ === 'improv';
  const wantsAi = partnerMode() === 'ai' || improv;
  const showWall = out && (improv || !$('#mode-ai-row').hidden);
  $('#ai-paywall').hidden = !showWall;
  $('#ai-paywall-text').textContent = t(state.plan === 'plus' ? 'ai_paywall_plus' : 'ai_paywall_free');
  $('#ai-paywall [data-action="to-plus"]').hidden = state.plan === 'plus';
  if (out && !wantsAi) $('#ai-note').hidden = true;
}

function cancelSpeech() {
  try { if (synth) synth.cancel(); } catch { /* inget att avbryta */ }
}

// iPhone läser bara upp text om uppläsningen startas av ett tryck. En tom
// replik i trycket på Starta inspelning låser upp rösten för resten av tagningen.
function unlockSpeech() {
  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    synth.speak(u);
  } catch { /* då står motspelarens repliker bara i texten */ }
}

function speakLine(text) {
  return new Promise((resolve) => {
    let done = false;
    let timer = 0;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      state.partnerSpeaking = false;
      state.partnerEndedAt = Date.now();
      resolve();
    };
    // Om rösten inte fungerar får användaren läsa repliken, ungefär så länge som den tar att säga.
    const readInstead = () => {
      clearTimeout(timer);
      timer = setTimeout(finish, expectedMs(text));
    };
    // Reserv om webbläsaren aldrig säger att uppläsningen är klar.
    timer = setTimeout(finish, text.length * 90 + 3000);
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = state.voice;
      u.lang = state.voice.lang;
      u.onend = finish;
      u.onerror = (e) => {
        if (e && (e.error === 'canceled' || e.error === 'interrupted')) finish(); // Nästa replik eller Stoppa
        else readInstead();
      };
      state.utterance = u; // Chrome tappar annars händelserna om objektet städas bort
      state.partnerSpeaking = true;
      synth.speak(u);
    } catch {
      readInstead();
    }
  });
}

function listenForLine(line, index) {
  const afterPartner = index > 0 && state.scene.repliker[index - 1].roll !== state.role;
  return new Promise((resolve) => {
    // Utan ljudnivå går scenen vidare när användaren trycker på Nästa replik.
    if (!state.vad) return;
    state.vad.startLine(line.text, afterPartner ? AFTER_PARTNER_MS : 0);
    state.listening = resolve;
  });
}

function levelTick() {
  state.levelTicks += 1;
  const ctx = state.audioCtx;
  if (state.levelTicks % 20 === 0 && ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  const levels = readLevels();
  if (!levels || !state.vad) return;
  if (state.listening) {
    if (state.vad.push(levels.rmsDb) === 'done') {
      const resolve = state.listening;
      state.listening = null;
      resolve();
    }
  } else if (!state.partnerSpeaking) {
    state.vad.observe(levels.rmsDb);
  }
}

function startLevelLoop() {
  clearInterval(state.levelTimer);
  state.vad = createVoiceDetector();
  state.listening = null;
  state.levelTicks = 0;
  state.levelTimer = setInterval(levelTick, LEVEL_MS);
}

function markLine(index) {
  for (const p of document.querySelectorAll('#script [data-line]')) {
    const current = Number(p.dataset.line) === index;
    p.classList.toggle('current', current);
    if (current) {
      p.setAttribute('aria-current', 'true');
      p.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else {
      p.removeAttribute('aria-current');
    }
  }
}

function startPartner() {
  $('#next-line').hidden = false;
  state.player = new ScenePlayer(state.scene.repliker, state.role, {
    speak: speakLine,
    listen: listenForLine,
    cancelSpeech,
    onLine: (index) => {
      state.listening = null;
      markLine(index);
    },
    onEnd: () => {
      markLine(-1);
      $('#next-line').hidden = true;
      $('#partner-done').textContent = t(state.scene.typ === 'guidad' ? 'guided_done' : 'partner_done');
      $('#partner-done').hidden = false;
    }
  });
  state.player.play();
}

function stopPartner() {
  clearInterval(state.levelTimer);
  if (state.player) state.player.stop();
  else cancelSpeech();
  state.player = null;
  state.vad = null;
  state.listening = null;
  state.partnerSpeaking = false;
  state.utterance = null;
  $('#next-line').hidden = true;
  markLine(-1);
}

function resetPartner() {
  stopPartner();
  stopAi();
  $('#partner-box').hidden = false;
  updateVoice(); // gömmer valet igen om scenen bara har en roll
  $('#partner-done').hidden = true;
  $('#ai-status').hidden = true;
  $('#ai-log').hidden = true;
  $('#ai-log').textContent = '';
}

// ---------- AI-motspelaren ----------
// En AI hos ElevenLabs spelar den andra rollen och svarar på det användaren säger.
// Logiken finns i ai-partner.js och nyckeln i Netlify-funktionen /api/ai-start.

// Frågar funktionen om AI-motspelaren finns, en gång per besök.
async function refreshAiAvailability() {
  if (state.aiAvailable !== null) return;
  try {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    const res = await Promise.race([fetch('/api/ai-start?check=1', { cache: 'no-store' }), timeout]);
    const data = res && res.ok ? await res.json() : null;
    state.aiAvailable = !!(data && data.available);
  } catch {
    state.aiAvailable = false;
  }
}

function setAiStatus(status) {
  const keys = {
    connecting: 'ai_status_connecting',
    listening: 'ai_status_listening',
    speaking: 'ai_status_speaking',
    error: 'ai_status_error',
    ended: 'ai_status_ended',
    minutes_out: 'ai_status_minutes_out',
    no_minutes: state.plan === 'plus' ? 'ai_paywall_plus' : 'ai_paywall_free',
    full: 'ai_paywall_full'
  };
  const el = $('#ai-status');
  if (!keys[status]) return;
  el.textContent = t(keys[status]);
  el.dataset.status = status;
  el.hidden = false;
}

function addAiLine(who, text, setup) {
  if (!text) return;
  const p = document.createElement('p');
  p.className = who === 'ai' ? 'theirs' : 'mine';
  const name = document.createElement('span');
  name.className = 'who';
  name.textContent = who === 'ai' ? t('ai_them', { name: setup.aiName }) : t('ai_you', { name: setup.myName });
  p.append(name, document.createTextNode(text));
  $('#ai-log').append(p);
  p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function startAi() {
  const setup = buildAiSetup(state.scene, state.role, lang());
  const log = $('#ai-log');
  log.textContent = '';
  log.hidden = false;
  const plus = state.plan === 'plus';
  const ai = new AiPartner({
    ctx: state.audioCtx,
    source: state.micSource,
    authToken: plus ? state.license : null,
    limitSeconds: aiSecondsLeft(),
    onLine: (who, text) => addAiLine(who, text, setup),
    onStatus: setAiStatus,
    onUsage: (seconds) => {
      if (plus) state.plusUsed += seconds;
      else storageSet(STORE.freeUsed, String(freeUsed() + seconds));
      renderPlanBits();
    }
  });
  state.ai = ai;
  ai.connect(setup).catch((err) => {
    if (state.ai !== ai) return;
    setAiStatus(err && err.code ? (err.code === 'free_full' ? 'full' : 'no_minutes') : 'error');
    ai.stop();
    state.ai = null;
  });
}

function stopAi() {
  if (state.ai) state.ai.stop();
  state.ai = null;
}

if (synth && typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', updateVoice);

// ---------- Spara ----------

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function toSave() {
  if (!state.blob) return;
  const ext = state.blob.type.includes('webm') ? 'webm' : 'mp4';
  const name = `${t('file_prefix')}-${stamp()}.${ext}`;
  try {
    state.file = new File([state.blob], name, { type: state.blob.type });
  } catch {
    state.file = null;
  }
  let canShare = false;
  try {
    canShare = !!(state.file && navigator.canShare && navigator.canShare({ files: [state.file] }));
  } catch {
    canShare = false;
  }
  $('#share-btn').hidden = !canShare;
  const link = $('#download-link');
  link.href = state.blobUrl;
  link.download = name;
  $('#save-status').textContent = '';
  $('#save-take-btn').disabled = !!state.savedTakeId;
  if (state.savedTakeId) saveTakeStatus(t('save_take_already'));
  else $('#save-take-status').hidden = true;
  show('save');
}

// ---------- Din spelstil ----------
// Under tagningen mäts rösten var 50:e ms i mobilen (style.js): styrka och tonhöjd.
// Medan motspelaren eller AI:n pratar mäts inget. Inget skickas någonstans.

function startStyle() {
  clearInterval(state.styleTimer);
  state.styleReading = null;
  state.styleMeter = null;
  const analyser = state.analyser;
  if (!analyser || !state.audioCtx) return;
  const meter = createStyleMeter();
  const buf = new Float32Array(analyser.fftSize);
  state.styleMeter = meter;
  state.styleTimer = setInterval(() => {
    const aiTalking = !!(state.ai && state.ai.live && state.ai.aiTalking());
    if (state.partnerSpeaking || aiTalking || Date.now() - state.partnerEndedAt < AFTER_PARTNER_MS) {
      meter.push(null);
      return;
    }
    if (analyser.getFloatTimeDomainData) {
      analyser.getFloatTimeDomainData(buf);
    } else {
      const bytes = new Uint8Array(buf.length);
      analyser.getByteTimeDomainData(bytes);
      for (let i = 0; i < bytes.length; i++) buf[i] = (bytes[i] - 128) / 128;
    }
    const { rmsDb } = levelsFrom(buf);
    meter.push({ db: rmsDb, hz: rmsDb > -50 ? pitchHz(buf, state.audioCtx.sampleRate) : 0 });
  }, FRAME_MS);
}

function finishStyle() {
  clearInterval(state.styleTimer);
  state.styleTimer = 0;
  if (!state.styleMeter) return;
  state.styleReading = readStyle(state.styleMeter.summary());
  state.styleMeter = null;
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const TEMPO_TEXT = { low: 'style_obs_tempo_low', mid: 'style_obs_tempo_mid', high: 'style_obs_tempo_high' };
const MELODY_TEXT = { low: 'style_obs_melody_low', mid: 'style_obs_melody_mid', high: 'style_obs_melody_high' };
const DYNAMICS_TEXT = { low: 'style_obs_dynamics_low', mid: 'style_obs_dynamics_mid', high: 'style_obs_dynamics_high' };

// Kortet med spelstilarna, iakttagelser utan betyg och en utmaning till nästa tagning.
function renderStyle(box, reading) {
  box.textContent = '';
  box.hidden = !reading;
  if (!reading) return;
  box.append(el('h2', t('style_title')));
  if (!reading.enough) {
    box.append(el('p', t('style_too_little'), 'small'));
    return;
  }
  box.append(el('p', t('style_lead'), 'small'));
  const bars = el('div', '', 'style-bars');
  for (const match of reading.matches.slice(0, 3)) {
    const row = el('div', '', 'style-bar');
    const track = el('span', '', 'style-track');
    const fill = el('span', '', 'style-fill');
    fill.style.width = `${match.procent}%`;
    track.append(fill);
    const name = (styleById(match.id) || match).namn; // namnet på sidans språk
    row.append(el('span', name, 'style-name'), el('span', `${match.procent} %`, 'style-pct'), track);
    bars.append(row);
  }
  box.append(bars);
  const top = styleById(reading.matches[0].id);
  if (top) box.append(el('p', t('style_most', { name: top.namn, text: top.text }), 'style-top'));
  const m = reading.measures;
  const p = reading.profile;
  const notes = [t(TEMPO_TEXT[band(p.tempo)])];
  if (m.pauses === 0) notes.push(t('style_obs_pauses_none'));
  else if (m.pauses === 1) notes.push(t('style_obs_pause_one', { s: decimal(m.longestPause) }));
  else notes.push(t('style_obs_pauses', { n: m.pauses, s: decimal(m.longestPause) }));
  if (m.melody !== null && m.melody !== undefined) notes.push(t(MELODY_TEXT[band(p.melodi)]));
  notes.push(t(DYNAMICS_TEXT[band(p.dynamik)]));
  const list = el('ul', '', 'style-obs');
  for (const note of notes) list.append(el('li', note));
  box.append(list);
  const other = styleById(reading.challenge);
  if (other) box.append(el('p', t('style_challenge', { name: other.namn, how: other.hur }), 'style-challenge'));
  box.append(el('p', t('style_note'), 'small'));
}

// ---------- Ansiktet ----------
// Bara om användaren har sagt ja, och bara för scenerna, som får betyg. Mobilen läser av
// uttrycken i kamerabilden ungefär fem gånger i sekunden (face.js). Inga bilder sparas
// eller skickas, och bara två siffror blir kvar efter tagningen.

const rated = () => !!(state.scene && state.scene.niva);
const faceAnswer = () => storageGet(STORE.face); // 'ja', 'nej' eller null om frågan inte är ställd

async function setupFace() {
  $('#face-ask').hidden = true;
  $('#face-row').hidden = true;
  if (!rated()) return;
  if (state.faceModel === null) state.faceModel = await faceModelAvailable();
  if (!state.faceModel) return;
  const answer = faceAnswer();
  if (answer === null) {
    $('#face-ask').hidden = false;
    return;
  }
  $('#face-row').hidden = false;
  $('#face-on').checked = answer === 'ja';
  $('#face-status').textContent = '';
  if (answer === 'ja') prepareFace();
}

function setFaceAnswer(yes) {
  storageSet(STORE.face, yes ? 'ja' : 'nej');
  $('#face-ask').hidden = true;
  $('#face-row').hidden = false;
  $('#face-on').checked = yes;
  $('#face-status').textContent = '';
  if (yes) prepareFace();
}

async function prepareFace() {
  if (state.faceLandmarker) return;
  const status = $('#face-status');
  status.textContent = t('face_loading');
  try {
    state.faceLandmarker = await loadFaceLandmarker();
    status.textContent = t('face_ready');
  } catch {
    status.textContent = t('face_failed');
  }
}

function startFace() {
  clearInterval(state.faceTimer);
  state.faceReading = null;
  state.faceMeter = null;
  if (!rated() || faceAnswer() !== 'ja' || !state.faceLandmarker) return;
  const meter = createFaceMeter();
  const video = $('#preview-record');
  state.faceMeter = meter;
  state.faceTimer = setInterval(() => {
    try {
      const categories = readFace(state.faceLandmarker, video, performance.now());
      if (categories !== undefined) meter.push(categories);
    } catch {
      // Fungerar inte i den här mobilen: då räknas bara rösten.
      clearInterval(state.faceTimer);
      state.faceMeter = null;
    }
  }, FACE_MS);
}

function finishFace() {
  clearInterval(state.faceTimer);
  state.faceTimer = 0;
  state.faceReading = state.faceMeter ? state.faceMeter.summary() : null;
  state.faceMeter = null;
}

// ---------- Betyget ----------
// Hur väl tagningen passade det rollen kräver, från 1 till 10 (rating.js). Det bästa
// betyget för varje scen sparas i mobilen, och efter 5 scener i en nivå kommer resultatet.

const TIP_TEXT = {
  'tempo:mer': 'tip_tempo_more', 'tempo:mindre': 'tip_tempo_less',
  'pauser:mer': 'tip_pauser_more', 'pauser:mindre': 'tip_pauser_less',
  'dynamik:mer': 'tip_dynamik_more', 'dynamik:mindre': 'tip_dynamik_less',
  'melodi:mer': 'tip_melodi_more', 'melodi:mindre': 'tip_melodi_less',
  'energi:mer': 'tip_energi_more', 'energi:mindre': 'tip_energi_less',
  'ansikte:mer': 'tip_ansikte_more', 'ansikte:mindre': 'tip_ansikte_less',
  'blick:mindre': 'tip_eyes'
};
const NEED_TEXT = {
  'tempo:mer': 'need_tempo_more', 'tempo:mindre': 'need_tempo_less',
  'pauser:mer': 'need_pauser_more', 'pauser:mindre': 'need_pauser_less',
  'dynamik:mer': 'need_dynamik_more', 'dynamik:mindre': 'need_dynamik_less',
  'melodi:mer': 'need_melodi_more', 'melodi:mindre': 'need_melodi_less',
  'energi:mer': 'need_energi_more', 'energi:mindre': 'need_energi_less',
  'ansikte:mer': 'need_ansikte_more', 'ansikte:mindre': 'need_ansikte_less'
};
const STRENGTH_TEXT = { tempo: 'strength_tempo', pauser: 'strength_pauser', dynamik: 'strength_dynamik', melodi: 'strength_melodi', ansikte: 'strength_ansikte' };
const tipId = (tip) => `${tip.key}:${tip.mer ? 'mer' : 'mindre'}`;
const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text);

function currentRole() {
  return state.scene && state.scene.roller ? state.scene.roller.find((r) => r.id === state.role) || null : null;
}

function rateCurrentTake() {
  state.rating = null;
  state.ratingBest = null;
  state.ratingImproved = false;
  if (!rated()) return;
  const demand = demandFor(currentRole());
  const reading = state.styleReading;
  const rating = rateTake({ measures: reading && reading.enough ? reading.measures : { enough: false }, face: state.faceReading, demand });
  state.rating = rating;
  if (!rating.enough) return;
  const entry = { betyg: rating.betyg, roll: state.role, profil: rating.profil, tips: rating.tips, blickNere: rating.blickNere, datum: Date.now() };
  const { results, best, improved } = addRating(loadResults(), state.scene.id, entry);
  saveResults(results);
  state.ratingBest = best;
  state.ratingImproved = improved;
}

// Kortet med betyget efter tagningen: siffran, rösten och ansiktet, en styrka, tips och var i nivån man är.
function renderRating(box) {
  box.textContent = '';
  const rating = state.rating;
  const role = currentRole();
  box.hidden = !rating || !role;
  if (box.hidden) return;
  box.append(el('h2', t('rating_title')));
  if (!rating.enough) {
    box.append(el('p', t('rating_too_little'), 'small'));
    return;
  }
  const score = el('p', '', 'rating-score');
  score.append(el('span', String(rating.betyg), 'score'), el('span', t('rating_of'), 'of'));
  box.append(score, el('p', t('rating_role', { name: role.namn, typ: role.typ }), 'rating-role'));
  const parts = [t('rating_voice', { n: rating.rost })];
  if (rating.ansikte !== null) parts.push(t('rating_face', { n: rating.ansikte }));
  box.append(el('p', parts.join(' · '), 'rating-parts'));
  if (state.faceReading && !state.faceReading.enough) box.append(el('p', t('rating_face_unseen'), 'small'));
  if (rating.styrka && STRENGTH_TEXT[rating.styrka]) box.append(el('p', t(STRENGTH_TEXT[rating.styrka]), 'rating-strength'));
  if (rating.tips.length) {
    const list = el('ul', '', 'style-obs');
    for (const tip of rating.tips) if (TIP_TEXT[tipId(tip)]) list.append(el('li', t(TIP_TEXT[tipId(tip)])));
    box.append(list);
  }
  if (!state.ratingImproved && state.ratingBest) box.append(el('p', t('rating_best_kept', { betyg: state.ratingBest.betyg }), 'small'));

  const niva = state.scene.niva;
  const scenes = scenesInLevel(niva);
  const results = loadResults();
  const done = scenes.filter((s) => results.scener[s.id]).length;
  if (done >= scenes.length) {
    box.append(el('p', t('rating_level_done', { n: niva }), 'rating-level'));
    const button = el('button', t('level_result_button'), 'primary');
    button.type = 'button';
    button.dataset.action = 'show-result';
    button.dataset.level = String(niva);
    box.append(button);
  } else {
    box.append(el('p', t('rating_level_progress', { done, total: scenes.length, n: niva, left: scenes.length - done }), 'rating-level'));
  }
  box.append(el('p', t('rating_note'), 'small'));
}

// ---------- Resultatet efter en nivå ----------

const OPEN_TEXT = { 1: 'result_open_1', 2: 'result_open_2', 3: 'result_open_3', 4: 'result_open_4' };
const RANGE_TEXT = { hog: 'result_range_high', mellan: 'result_range_mid', lag: 'result_range_low' };
const ROLES_TITLE = { storre: 'result_roles_bigger_title', mindre: 'result_roles_smaller_title', grund: 'result_roles_basics_title' };
const ROLES_TEXT = { storre: 'result_roles_bigger', mindre: 'result_roles_smaller', grund: 'result_roles_basics' };

// Det bästa betyget för varje scen i nivån, med scenen, rollen och rollens krav.
function levelEntries(niva, results = loadResults()) {
  return scenesInLevel(niva).map((scene) => {
    const saved = results.scener[scene.id];
    if (!saved) return null;
    const role = scene.roller.find((r) => r.id === saved.roll) || scene.roller[0];
    return { ...saved, krav: demandFor(role), scene, role };
  }).filter(Boolean);
}

// Sammanfattningen i två stycken: hur det gick, med starkaste och svagaste rollen, och sedan
// bredden, det som återkommer och blicken.
function summaryText(result) {
  const parts = [t(OPEN_TEXT[result.band])];
  const { best, worst } = result;
  parts.push(t('result_best', { typ: best.role.typ, titel: best.scene.titel, betyg: best.betyg }));
  if (worst !== best && worst.betyg < best.betyg) {
    const tip = (worst.tips || []).find((x) => NEED_TEXT[tipId(x)]);
    const values = { typ: worst.role.typ, titel: worst.scene.titel, betyg: worst.betyg };
    parts.push(tip ? t('result_worst', { ...values, what: t(NEED_TEXT[tipId(tip)]) }) : t('result_worst_plain', values));
  }
  const patterns = [t(RANGE_TEXT[result.range])];
  if (result.repeat && NEED_TEXT[tipId(result.repeat)]) {
    patterns.push(t('result_repeat', { n: result.repeat.n, total: LEVEL_SIZE, what: t(NEED_TEXT[tipId(result.repeat)]) }));
  }
  if (result.lookDown !== null) patterns.push(t(result.lookDown > LOOK_DOWN_LIMIT ? 'result_eyes_down' : 'result_eyes_up'));
  return [parts.join(' '), patterns.join(' ')];
}

function showResult(niva) {
  const level = levelByNumber(niva);
  const entries = levelEntries(level.niva);
  const result = levelResult(entries);
  if (!result) {
    goScenes();
    return;
  }
  stopCamera();
  $('#result-level').textContent = t('level_title', { n: level.niva, name: level.namn });
  $('#result-total').textContent = decimal(result.total);
  $('#result-verdict-title').textContent = t(ROLES_TITLE[result.roles]);
  $('#result-verdict').textContent = t(ROLES_TEXT[result.roles]);
  const summary = $('#result-summary');
  summary.textContent = '';
  for (const text of summaryText(result)) summary.append(el('p', text));
  const list = $('#result-list');
  list.textContent = '';
  for (const entry of entries) {
    const item = el('li');
    item.append(el('span', t('result_role_line', { typ: capitalize(entry.role.typ), titel: entry.scene.titel })), el('strong', `${entry.betyg}${t('rating_of')}`));
    list.append(item);
  }
  $('#results-clear-ask').hidden = true;
  $('#results-clear').hidden = false;
  show('result');
  prepareShare(level, result, entries);
}

// ---------- Dela resultatet ----------
// Bilden ritas i mobilen när resultatet visas (sharecard.js), så att den är klar när man
// trycker på Dela bilden. Mobilens delningsmeny måste öppnas direkt vid trycket.

function shareModel(level, result, entries) {
  return {
    brand: t('app_name'),
    level: t('level_title', { n: level.niva, name: level.namn }),
    score: decimal(result.total),
    of: t('rating_of'),
    title: t(ROLES_TITLE[result.roles]),
    rows: entries.map((entry) => ({ role: capitalize(entry.role.typ), scene: entry.scene.titel, score: String(entry.betyg) })),
    note: t('result_share_note')
  };
}

function releaseShare() {
  state.shareRun += 1;
  if (state.share) URL.revokeObjectURL(state.share.url);
  state.share = null;
  const img = $('#result-share-img');
  img.removeAttribute('src');
  img.alt = '';
  $('#result-share-save').href = '#';
  $('#result-share-status').textContent = '';
  $('#result-share').hidden = true;
}

async function prepareShare(level, result, entries) {
  releaseShare();
  const run = state.shareRun;
  let blob;
  try {
    ({ blob } = await makeCard(shareModel(level, result, entries)));
  } catch {
    return; // utan bild visas ingen delning
  }
  if (run !== state.shareRun) return; // ett nyare resultat har visats under tiden
  const name = `${t('result_share_file', { n: level.niva })}.png`;
  let file = null;
  try { file = new File([blob], name, { type: 'image/png' }); } catch { file = null; }
  const url = URL.createObjectURL(blob);
  state.share = { url, file };
  const img = $('#result-share-img');
  img.src = url;
  img.alt = t('result_share_alt', { betyg: decimal(result.total), n: level.niva, titel: t(ROLES_TITLE[result.roles]) });
  let canShare = false;
  try { canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch { canShare = false; }
  $('#result-share-btn').hidden = !canShare;
  const link = $('#result-share-save');
  link.href = url;
  link.download = name;
  $('#result-share').hidden = false;
}

async function shareResult() {
  const status = $('#result-share-status');
  if (!state.share || !state.share.file) return;
  status.textContent = '';
  try {
    await navigator.share({ files: [state.share.file] });
    status.textContent = t('result_share_done');
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    status.textContent = t('result_share_failed');
  }
}

function clearResults() {
  releaseShare();
  storageSet(STORE.results, null);
  goScenes();
  const status = $('#level-status');
  status.textContent = t('results_cleared');
  status.hidden = false;
}

// ---------- Mina tagningar ----------
// Tagningarna sparas i webbläsarens databas i mobilen (takes.js) och skickas aldrig någonstans.

// Rollen skrivs bara ut för scener med två roller, inte för övningar där man spelar sig själv.
function roleName() {
  const scene = state.scene;
  if (!scene || scene.typ || !scene.roller || scene.roller.length < 2) return '';
  const role = scene.roller.find((r) => r.id === state.role);
  return role ? role.namn : '';
}

function saveTakeStatus(message, { open = true, plus = false } = {}) {
  $('#save-take-text').textContent = message;
  $('#save-take-open').hidden = !open;
  $('#save-take-plus').hidden = !plus;
  $('#save-take-status').hidden = false;
}

async function saveToTakes() {
  if (!state.blob) return;
  if (state.savedTakeId) {
    saveTakeStatus(t('save_take_already'));
    return;
  }
  const button = $('#save-take-btn');
  button.disabled = true;
  try {
    const count = await countTakes();
    if (!canSaveMore(count, state.plan)) {
      saveTakeStatus(t('takes_full', { max: FREE_TAKES }), { plus: state.plan !== 'plus' });
      button.disabled = false;
      return;
    }
    const id = takeId();
    await addTake({
      id,
      skapad: Date.now(),
      titel: state.scene ? state.scene.titel : '',
      roll: roleName(),
      sekunder: state.takeSeconds,
      typ: state.blob.type,
      storlek: state.blob.size,
      stil: state.styleReading,
      betyg: state.rating && state.rating.enough ? state.rating.betyg : null,
      video: state.blob
    });
    state.savedTakeId = id;
    saveTakeStatus(t('save_take_done'));
  } catch (err) {
    saveTakeStatus(t(isQuotaError(err) ? 'takes_no_space' : 'takes_failed'), { open: false });
    button.disabled = false;
  }
}

const takeDate = (ms) => new Date(ms).toLocaleString(t('locale_code'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function takeMeta(take) {
  const values = { role: take.roll, date: takeDate(take.skapad), length: clock(take.sekunder || 0) };
  const meta = t(take.roll ? 'take_meta_role' : 'take_meta', values);
  return Number.isInteger(take.betyg) ? `${meta} · ${take.betyg}${t('rating_of')}` : meta;
}

async function showTakes(message = '') {
  stopCamera();
  const msg = $('#takes-message');
  msg.textContent = message;
  msg.hidden = !message;
  $('#takes-unsaved').hidden = !(state.blob && !state.savedTakeId);
  const list = $('#takes-list');
  list.textContent = '';
  $('#takes-empty').hidden = true;
  $('#takes-count').textContent = '';
  show('takes');
  let takes;
  try {
    takes = await listTakes();
  } catch {
    $('#takes-count').textContent = t('takes_failed');
    return;
  }
  const n = takes.length;
  if (state.plan === 'plus') $('#takes-count').textContent = t('takes_count_plus', { n });
  else $('#takes-count').textContent = t(n > FREE_TAKES ? 'takes_count_over' : 'takes_count_free', { n, max: FREE_TAKES });
  $('#takes-empty').hidden = n > 0;
  const play = $('#tpl-play');
  for (const take of takes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'take';
    button.dataset.action = 'open-take';
    button.dataset.id = take.id;
    const icon = document.createElement('span');
    icon.className = 'take-play';
    icon.append(play.content.cloneNode(true));
    const text = document.createElement('span');
    text.className = 'take-text';
    const title = document.createElement('strong');
    title.textContent = take.titel || t('take_untitled');
    const meta = document.createElement('span');
    meta.textContent = takeMeta(take);
    text.append(title, meta);
    if (take.stil && take.stil.enough) {
      const tag = document.createElement('span');
      tag.className = 'take-style';
      tag.textContent = (styleById(take.stil.matches[0].id) || take.stil.matches[0]).namn;
      text.append(tag);
    }
    button.append(icon, text);
    list.append(button);
  }
}

function releaseTakeView() {
  if (!state.takeView) return;
  const video = $('#take-video');
  video.pause();
  video.removeAttribute('src');
  video.load();
  URL.revokeObjectURL(state.takeView.url);
  state.takeView = null;
}

async function openTake(id) {
  let take = null;
  try { take = await getTake(id); } catch { take = null; }
  if (!take || !take.video) {
    showTakes(t('take_missing'));
    return;
  }
  releaseTakeView();
  const url = URL.createObjectURL(take.video);
  const ext = (take.typ || '').includes('webm') ? 'webm' : 'mp4';
  const stampOf = (ms) => {
    const d = new Date(ms);
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  };
  const name = `${t('file_prefix')}-${stampOf(take.skapad)}.${ext}`;
  let file = null;
  try { file = new File([take.video], name, { type: take.typ || take.video.type }); } catch { file = null; }
  state.takeView = { id, url, file };
  $('#h-take').textContent = take.titel || t('take_untitled');
  $('#take-meta').textContent = takeMeta(take);
  const video = $('#take-video');
  $('#take-error').hidden = true;
  video.onerror = () => { $('#take-error').hidden = false; };
  video.src = url;
  let canShare = false;
  try { canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch { canShare = false; }
  $('#take-share').hidden = !canShare;
  const link = $('#take-download');
  link.href = url;
  link.download = name;
  $('#take-status').textContent = '';
  renderStyle($('#style-take'), take.stil || null);
  $('#take-confirm').hidden = true;
  $('#take-delete').hidden = false;
  show('take');
}

async function shareTake() {
  if (!state.takeView || !state.takeView.file) return;
  try {
    await navigator.share({ files: [state.takeView.file] });
    $('#take-status').textContent = t('save_shared');
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    $('#take-status').textContent = t('save_share_failed');
  }
}

async function deleteShownTake() {
  if (!state.takeView) return;
  const { id } = state.takeView;
  $('#take-delete-yes').disabled = true;
  try {
    await deleteTake(id);
    if (state.savedTakeId === id) state.savedTakeId = null;
    await showTakes(t('takes_deleted'));
  } catch {
    $('#take-status').textContent = t('takes_failed');
  } finally {
    $('#take-delete-yes').disabled = false;
  }
}

async function share() {
  const status = $('#save-status');
  try {
    await navigator.share({ files: [state.file] });
    status.textContent = t('save_shared');
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    status.textContent = t('save_share_failed');
  }
}

// ---------- Hjälp vid fel ----------

// Rubrik först, sedan stycken. Texterna ligger i texts.js.
const HELP = {
  NotAllowedError: ['help_blocked_title', 'help_blocked_1', 'help_blocked_2', 'help_blocked_3', 'help_blocked_4'],
  NotFoundError: ['help_no_camera_title', 'help_no_camera_1'],
  NotReadableError: ['help_busy_title', 'help_busy_1'],
  unsupported: ['help_unsupported_title', 'help_unsupported_1', 'help_unsupported_2'],
  recorder: ['help_recorder_title', 'help_recorder_1'],
  empty: ['help_empty_title', 'help_empty_1'],
  default: ['help_default_title', 'help_default_1']
};

function showHelp(key) {
  const [title, ...lines] = HELP[key] || (key === 'SecurityError' || key === 'TypeError' ? HELP.unsupported : HELP.default);
  $('#h-help').textContent = t(title);
  const box = $('#help-text');
  box.textContent = '';
  for (const line of lines) {
    const p = document.createElement('p');
    p.textContent = t(line);
    box.append(p);
  }
  show('help');
}

async function retryCamera() {
  stopCamera();
  ensureAudioContext();
  const ok = await startCamera();
  if (!ok) return;
  if (state.scene && state.role) {
    attachPreview('#preview-check');
    resetCheck();
    show('check');
    startMeter();
  } else {
    show('scenes');
  }
}

// ---------- Plus ----------
// Köpet sker hos Stripe. Efteråt får mobilen en licenskod som visar att man har Plus.
// Koden och gratisminuterna sparas i mobilens lagring, och inget annat.

const STORE = { license: 'plus-licens', freeUsed: 'ai-gratis-sekunder', code: 'plus-kod', face: 'ansikte-ok', results: RESULTS_KEY };

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* privat läge: gäller bara tills sidan stängs */ }
}

// Innehållet i licenskoden: prenumerationens nummer, när den köptes och när koden måste kontrolleras igen.
function licensePayload(token) {
  try {
    return token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
  } catch {
    return null;
  }
}

const freeUsed = () => Math.max(0, Number(storageGet(STORE.freeUsed)) || 0);
const freeLeft = () => Math.max(0, PLANS.gratis.aiSeconds - freeUsed());
const plusLeft = () => Math.max(0, PLANS.plus.aiSeconds - state.plusUsed);
const aiSecondsLeft = () => (state.plan === 'plus' ? plusLeft() : freeLeft());
const minutesText = (seconds) => String(Math.floor(seconds / 60));

function setPlan(data) {
  if (data && data.plan === 'plus' && data.token) {
    state.plan = 'plus';
    state.license = data.token;
    state.plusUsed = Number(data.usedSeconds) || 0;
    storageSet(STORE.license, data.token);
    if (data.code) storageSet(STORE.code, data.code); // återställningskoden, som bara visas efter köpet
  } else {
    state.plan = 'gratis';
    state.license = null;
    state.plusUsed = 0;
    storageSet(STORE.license, null);
  }
  renderPlanBits();
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (state.license) headers.authorization = `Bearer ${state.license}`;
  if (body) headers['content-type'] = 'application/json';
  const res = await fetch(path, { method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Kontrollerar en sparad licenskod när sidan öppnas.
async function loadPlan() {
  const token = storageGet(STORE.license);
  if (!token) {
    renderPlanBits();
    return;
  }
  state.license = token;
  state.plan = 'plus'; // tills servern har svarat
  try {
    const { ok, status, data } = await api('/api/plus/status');
    if (ok) setPlan(data);
    else if (status === 401 || data.plan === 'gratis') setPlan(null);
  } catch {
    // Nätet svarar inte: behåll Plus tills vidare.
  }
  renderPlanBits();
}

// Det som visar planen på hemskärmen och vid inspelningen.
function renderPlanBits() {
  const plus = state.plan === 'plus';
  $('#plus-banner-title').textContent = t('plus_banner_title');
  $('#plus-banner-text').textContent = plus ? t('plus_banner_have', { min: minutesText(plusLeft()) }) : t('plus_banner_text');
  $('#plus-banner').classList.toggle('have', plus);
  const max = maxTakeSeconds();
  $('#rec-max').textContent = `${max / 60}:00`;
  $('#record-max-note').textContent = t('record_max_note', { n: max / 60 });
  renderLevelChips(); // låsta nivåer beror på planen
  renderScenes();
}

// Återställningskoden som användaren skriver, på samma sätt som servern läser den:
// utan mellanslag och streck, I och L som 1 och O som 0. Annat än 16 tecken ger null.
function cleanCode(input) {
  const s = String(input || '').toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  return /^[0-9A-HJKMNP-TV-Z]{16}$/.test(s) ? s.match(/.{4}/g).join('-') : null;
}

function renderRestoreCode(status = '') {
  const code = storageGet(STORE.code);
  $('#plus-code-value').textContent = code || '';
  $('#plus-code-value').hidden = !code;
  $('#plus-code-copy').hidden = !code;
  $('#plus-code-missing').hidden = !!code;
  $('#plus-code-status').textContent = status || t('plus_code_new_note');
}

async function showPlus(message = '', { restore = false } = {}) {
  const msg = $('#plus-message');
  msg.textContent = message;
  msg.hidden = !message;
  const plus = state.plan === 'plus';
  $('#plus-have').hidden = !plus;
  $('#plus-buy').hidden = plus;
  // En tagning som inte är sparad försvinner när Stripes betalsida öppnas.
  $('#plus-unsaved').hidden = plus || !(state.blob && !state.savedTakeId);
  renderRestoreCode();
  // En sparad kod på mobilen men inget Plus (till exempel om licenskoden slutat gälla): fyll i den.
  const saved = storageGet(STORE.code);
  const openRestore = !plus && (restore || !!saved);
  $('#plus-restore').hidden = !openRestore;
  $('#plus-restore-open').hidden = openRestore;
  if (openRestore && saved && !$('#plus-restore-code').value) $('#plus-restore-code').value = saved;
  $('#plus-restore-status').textContent = '';
  $('#plus-minutes').textContent = t('plus_minutes', { left: minutesText(plusLeft()), limit: PLANS.plus.aiSeconds / 60 });
  show('plus');
  if (!state.plusInfo) {
    try {
      const { data } = await api('/api/plus/info');
      state.plusInfo = data;
    } catch {
      state.plusInfo = { available: false };
    }
  }
  const available = !!state.plusInfo.available;
  $('#plus-test').hidden = !(available && state.plusInfo.test);
  $('#plus-unavailable').hidden = available || plus;
  $('#plus-buy-btn').disabled = !available;
}

async function copyRestoreCode() {
  const code = storageGet(STORE.code);
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    renderRestoreCode(t('plus_code_copied'));
  } catch {
    renderRestoreCode(t('plus_code_copy_failed'));
  }
}

async function newRestoreCode() {
  const button = $('#plus-code-new');
  button.disabled = true;
  try {
    const { ok, data } = await api('/api/plus/kod', { method: 'POST' });
    if (ok && data.code) {
      storageSet(STORE.code, data.code);
      renderRestoreCode(t('plus_code_made'));
      return;
    }
  } catch { /* visas nedan */ } finally {
    button.disabled = false;
  }
  renderRestoreCode(t('plus_code_failed'));
}

async function restorePlus() {
  const status = $('#plus-restore-status');
  const code = cleanCode($('#plus-restore-code').value);
  if (!code) {
    status.textContent = t('plus_restore_bad');
    return;
  }
  const button = $('#plus-restore-send');
  button.disabled = true;
  try {
    const res = await api('/api/plus/aterstall', { method: 'POST', body: { kod: code } });
    if (res.ok && res.data.plan === 'plus') {
      setPlan({ ...res.data, code });
      $('#plus-restore-code').value = '';
      await showPlus(t('plus_restored'));
      return;
    }
    status.textContent = t(res.status === 404 ? 'plus_restore_not_found' : res.status === 400 ? 'plus_restore_bad' : 'plus_restore_failed');
  } catch {
    status.textContent = t('plus_restore_failed');
  } finally {
    button.disabled = false;
  }
}

// Köpet och kundsidan öppnas bara hos Stripe (eller på den egna sidan), aldrig någon annanstans,
// även om svaret från servern skulle vara fel.
function safeRedirect(href) {
  try {
    const target = new URL(href, location.href);
    return target.origin === location.origin || (target.protocol === 'https:' && (target.hostname === 'stripe.com' || target.hostname.endsWith('.stripe.com')));
  } catch {
    return false;
  }
}

async function buyPlus() {
  const button = $('#plus-buy-btn');
  button.disabled = true;
  try {
    const { ok, data } = await api('/api/plus/checkout', { method: 'POST', body: { lang: lang() } }); // Stripe på sidans språk, och tillbaka hit
    if (ok && data.url && safeRedirect(data.url)) {
      location.href = data.url; // Stripes betalsida
      return;
    }
  } catch { /* visas nedan */ }
  button.disabled = false;
  showPlus(t('plus_failed'));
}

async function openPortal() {
  try {
    const { ok, data } = await api('/api/plus/portal', { method: 'POST', body: { lang: lang() } });
    if (ok && data.url && safeRedirect(data.url)) {
      location.href = data.url; // Stripes sida för kort och uppsägning
      return;
    }
  } catch { /* visas nedan */ }
  showPlus(t('plus_failed'));
}

// Efter Stripe kommer man tillbaka hit med ?plus=klar, ?plus=avbrutet eller ?plus=hantera.
async function handleReturn() {
  const params = new URLSearchParams(location.search);
  const plus = params.get('plus');
  const withdraw = params.has('angra');
  if (!plus && !withdraw) return false;
  history.replaceState(null, '', location.pathname);
  if (withdraw) {
    await loadPlan(); // licenskoden behövs för att ångra
    showWithdraw();
    return true;
  }
  if (plus === 'klar') {
    try {
      const id = encodeURIComponent(params.get('session_id') || '');
      const { ok, data } = await api(`/api/plus/activate?session_id=${id}`);
      if (ok) {
        setPlan(data);
        await showPlus(t('plus_welcome'));
        return true;
      }
    } catch { /* visas nedan */ }
    await showPlus(t('plus_failed'));
    return true;
  }
  if (plus === 'avbrutet') {
    await showPlus(t('plus_canceled'));
    return true;
  }
  await loadPlan();
  await showPlus();
  return true;
}

// ---------- Ångerknappen ----------

function showWithdraw() {
  const payload = licensePayload(state.license || storageGet(STORE.license));
  $('#angra-form').hidden = !payload;
  $('#angra-none').hidden = !!payload;
  $('#angra-result').hidden = true;
  $('#angra-ok').checked = false;
  $('#angra-send').disabled = true;
  if (payload) {
    const date = new Date(payload.start * 1000).toLocaleDateString(t('locale_code'));
    $('#angra-contract').textContent = t('angra_contract', { id: payload.sub, date });
  }
  show('angra');
}

async function sendWithdraw() {
  const name = $('#angra-name').value.trim();
  if (!name || !$('#angra-ok').checked) return;
  $('#angra-send').disabled = true;
  const result = $('#angra-result');
  try {
    const { ok, data } = await api('/api/plus/angra', { method: 'POST', body: { namn: name, bekraftat: true } });
    if (ok) {
      const time = new Date(data.received).toLocaleString(t('locale_code'));
      if (data.status === 'angrat') {
        result.textContent = t('angra_done', { time });
        setPlan(null);
        storageSet(STORE.code, null); // köpet finns inte längre, så koden behövs inte
      } else if (data.status === 'redan_avslutad') {
        result.textContent = t('angra_already');
        setPlan(null);
        storageSet(STORE.code, null);
      } else {
        result.textContent = t('angra_cancelled', { time, date: new Date(data.ends * 1000).toLocaleDateString(t('locale_code')) });
      }
      result.hidden = false;
      $('#angra-form').hidden = true;
      return;
    }
  } catch { /* visas nedan */ }
  result.textContent = t('angra_failed');
  result.hidden = false;
  $('#angra-send').disabled = false;
}

// ---------- Händelser ----------

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  switch (target.dataset.action) {
    case 'copy-link': copyLink(); break;
    case 'to-start': stopCamera(); clearTake(); renderHome(); show('start'); break;
    case 'play-scenes':
    case 'to-scenes': requireAdult(goScenes); break;
    case 'daily': requireAdult(startDaily); break;
    case 'age-continue': {
      if (!$('#age-ok').checked) return;
      state.adult = true;
      const next = state.afterAge || goScenes;
      state.afterAge = null;
      next();
      break;
    }
    case 'warmup': startWarmup(); break;
    case 'fiveways': requireAdult(() => startExercise(fiveWaysScene(youTexts()))); break;
    case 'monologue': requireAdult(pickMonologue); break;
    case 'improv': requireAdult(pickImprov); break;
    case 'to-plus': stopCamera(); showPlus(); break; // en tagning som inte är sparad finns kvar
    case 'plus-code-copy': copyRestoreCode(); break;
    case 'plus-code-new': newRestoreCode(); break;
    case 'plus-restore-open':
      stopCamera();
      showPlus('', { restore: true }).then(() => $('#plus-restore-code').focus());
      break;
    case 'plus-buy': buyPlus(); break;
    case 'plus-portal': openPortal(); break;
    case 'to-angra': showWithdraw(); break;
    case 'angra-send': sendWithdraw(); break;
    case 'warmup-start': runWarmupTimer(); break;
    case 'warmup-next': nextWarmup(); break;
    case 'next-twister': {
      const list = WARMUP[warm.step].lista;
      warm.twister += 1;
      if (list) $('#twister-text').textContent = list[warm.twister % list.length];
      break;
    }
    case 'pick-other-scene': resetScenePicker(); $('#h-scenes').focus({ preventScroll: true }); break;
    case 'run-check': runCheck(); break;
    case 'to-record': toRecord(); break;
    case 'start-rec': startRecording(); break;
    case 'next-line': if (state.player) state.player.skip(); break;
    case 'stop-rec': stopRecording('user'); break;
    case 'retake': retake(); break;
    case 'to-save': toSave(); break;
    case 'share': share(); break;
    case 'save-take': saveToTakes(); break;
    case 'takes': showTakes(); break;
    case 'open-take': openTake(target.dataset.id); break;
    case 'take-share': shareTake(); break;
    case 'take-delete': $('#take-confirm').hidden = false; $('#take-delete').hidden = true; break;
    case 'take-delete-no': $('#take-confirm').hidden = true; $('#take-delete').hidden = false; break;
    case 'take-delete-yes': deleteShownTake(); break;
    case 'retry-camera': retryCamera(); break;
    case 'face-yes': setFaceAnswer(true); break;
    case 'face-no': setFaceAnswer(false); break;
    case 'show-result': showResult(Number(target.dataset.level) || state.level); break;
    case 'share-result': shareResult(); break;
    case 'results-clear': $('#results-clear-ask').hidden = false; $('#results-clear').hidden = true; break;
    case 'results-clear-no': $('#results-clear-ask').hidden = true; $('#results-clear').hidden = false; break;
    case 'results-clear-yes': clearResults(); break;
    default: break;
  }
});

$('#plus-restore').addEventListener('submit', (event) => {
  event.preventDefault();
  restorePlus();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.recorder && state.recorder.state === 'recording') {
    stopRecording('hidden');
  }
  // Licenskoden kontrolleras igen minst en gång per dygn, även om sidan är öppen länge.
  if (!document.hidden && state.plan === 'plus') {
    const payload = licensePayload(state.license);
    if (payload && payload.exp <= Date.now() / 1000) loadPlan();
  }
});

window.addEventListener('pagehide', () => {
  stopAi();
  stopCamera();
  cancelSpeech();
  if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
});

// Byte av motspelare visar texten som hör till valet.
document.addEventListener('change', (event) => {
  if (event.target.id === 'angra-ok') {
    $('#angra-send').disabled = !event.target.checked || !$('#angra-name').value.trim();
    return;
  }
  if (event.target.id === 'face-on') {
    setFaceAnswer(event.target.checked);
    return;
  }
  if (event.target.name !== 'partner') return;
  state.partnerChosen = true;
  updateModes();
});

renderLevelChips();
renderScenes();
renderHome();
updateVoice();
renderPlanBits();
show('start');
handleReturn().then((handled) => { if (!handled) loadPlan(); });
