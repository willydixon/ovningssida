// Övningssidan, testversion.
// Allt körs i mobilen. Inspelningen hålls i webbläsarens minne och skickas aldrig
// någonstans. Sidans säkerhetspolicy (connect-src 'none') stoppar dessutom alla
// nätverksanrop från skriptet.

import { SCENES } from './scenes.js';
import { levelsFrom, lumaStats, percentile, rateSpeech, ratePeaks, rateNoise, rateLight } from './check.js';

const MAX_SECONDS = 180;

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
  file: null
};

const $ = (sel) => document.querySelector(sel);

function show(name) {
  for (const el of document.querySelectorAll('[data-screen]')) {
    el.hidden = el.dataset.screen !== name;
  }
  if (name !== 'check') cancelAnimationFrame(state.meterRaf);
  window.scrollTo(0, 0);
  const heading = document.querySelector(`[data-screen="${name}"] h1`);
  if (heading) heading.focus({ preventScroll: true });
}

// ---------- Startsida ----------

const ua = navigator.userAgent || '';
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp/i.test(ua);
if (IN_APP) $('#inapp-notice').hidden = false;

async function copyLink() {
  const status = $('[data-copy-status]');
  try {
    await navigator.clipboard.writeText(location.href);
    status.textContent = 'Länken är kopierad. Klistra in den i Safari eller Chrome.';
  } catch {
    status.textContent = `Kopiera länken här: ${location.href}`;
  }
}

// ---------- 18 år ----------

$('#age-ok').addEventListener('change', (e) => {
  $('#age-continue').disabled = !e.target.checked;
});

// ---------- Scener ----------

function formatLength(seconds) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round((seconds / 60) * 2) / 2;
  return `${String(minutes).replace('.', ',')} min`;
}

function renderScenes() {
  const list = $('#scene-list');
  list.textContent = '';
  for (const scene of SCENES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene';

    const title = document.createElement('strong');
    title.textContent = scene.titel;
    if (scene.status !== 'godkand') {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Utkast';
      title.append(' ', badge);
    }

    const situation = document.createElement('span');
    situation.textContent = scene.situation;

    const meta = document.createElement('span');
    meta.className = 'meta';
    const approved = scene.godkand_av
      ? `Skriven med AI-stöd, godkänd av ${scene.godkand_av}`
      : 'Skriven med AI-stöd, inte granskad än';
    meta.textContent = `Cirka ${formatLength(scene.langd_sekunder)} · ${scene.roller.length} roller · ${approved}`;

    button.append(title, situation, meta);
    button.addEventListener('click', () => pickScene(scene));
    list.append(button);
  }
}

function pickScene(scene) {
  state.scene = scene;
  $('#scene-list').hidden = true;
  $('#role-pick').hidden = false;
  $('#role-situation').textContent = `${scene.titel}: ${scene.situation}`;
  const buttons = $('#role-buttons');
  buttons.textContent = '';
  for (const role of scene.roller) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'primary';
    b.textContent = `Spela ${role.namn}`;
    b.addEventListener('click', () => chooseRole(role.id));
    buttons.append(b);
  }
  $('#h-role').focus({ preventScroll: true });
}

function resetScenePicker() {
  $('#scene-list').hidden = false;
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
    state.buf = new Float32Array(analyser.fftSize);
  } catch {
    state.analyser = null;
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
  $('#run-check').textContent = 'Starta kontrollen';
  $('#run-check').disabled = false;
  $('#check-prompt').textContent = 'Tryck på Starta kontrollen. Var först tyst i två sekunder och säg sedan din första replik med vanlig röst.';
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
    prompt.textContent = 'Ljudet kunde inte mätas i den här webbläsaren. Kontrollera ljuset och bilden själv.';
  } else {
    prompt.textContent = 'Var tyst i två sekunder …';
    const noise = await sample(2000);
    prompt.textContent = 'Säg nu din första replik med vanlig röst …';
    const speech = await sample(4000);
    const speechDb = percentile(speech.rms, 0.9);
    const noiseDb = percentile(noise.rms, 0.5);
    const peakDb = Math.max(speech.peak, noise.peak);
    addResult(list, 'Ljud', rateSpeech(speechDb), `${Math.round(speechDb)} dB`);
    addResult(list, 'Toppar', ratePeaks(peakDb, speech.clipped || noise.clipped), `${Math.round(peakDb)} dB`);
    addResult(list, 'Bakgrund', rateNoise(noiseDb), `${Math.round(noiseDb)} dB`);
  }

  const light = measureLight($('#preview-check'));
  addResult(list, 'Ljus', rateLight(light), light ? `${Math.round(light.mean)} av 255` : '');

  const frame = document.createElement('li');
  frame.className = 'neutral';
  const head = document.createElement('span');
  head.className = 'label';
  head.textContent = 'Bildutsnitt: kontrollera själv';
  const advice = document.createElement('span');
  advice.className = 'advice';
  advice.textContent = 'Ansiktet och axlarna ska vara inom ramen, med lite luft ovanför huvudet.';
  frame.append(head, advice);
  list.append(frame);

  list.hidden = false;
  prompt.textContent = 'Klart. Rådet gäller bara tekniken, inte ditt spel.';
  button.textContent = 'Kör kontrollen igen';
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
  for (const line of scene.repliker) {
    const p = document.createElement('p');
    const mine = line.roll === state.role;
    p.className = mine ? 'mine' : 'theirs';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = mine ? `Du, ${names[line.roll]}` : names[line.roll];
    p.append(who, document.createTextNode(line.text));
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
  $('#start-rec').hidden = false;
  $('#start-rec').disabled = false;
  $('#stop-rec').hidden = true;
  $('#rec-badge').hidden = true;
  show('record');
}

async function startRecording() {
  const startButton = $('#start-rec');
  startButton.disabled = true;
  if (!streamIsLive()) {
    const ok = await startCamera();
    if (!ok) return;
    attachPreview('#preview-record');
  }
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
}

function updateRecTime() {
  const s = Math.floor((Date.now() - state.recStart) / 1000);
  $('#rec-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (s >= MAX_SECONDS) stopRecording('max');
}

function stopRecording(reason) {
  clearInterval(state.recTimer);
  if (!state.stopReason) state.stopReason = reason || 'user';
  const recorder = state.recorder;
  if (recorder && recorder.state !== 'inactive') {
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
    hidden: 'Inspelningen stoppades när du lämnade sidan. Du kan titta på det som hann spelas in, eller ta om.',
    ended: 'Kameran eller mikrofonen stängdes av, till exempel av ett samtal. Du kan titta på det som hann spelas in, eller ta om.',
    error: 'Något gick fel under inspelningen. Du kan titta på det som hann spelas in, eller ta om.',
    max: 'Tagningen stoppades efter 3 minuter, som är maxlängden.'
  };
  note.textContent = reasons[state.stopReason] || '';
  note.hidden = !reasons[state.stopReason];

  const playback = $('#playback');
  $('#playback-error').hidden = true;
  playback.onerror = () => { $('#playback-error').hidden = false; };
  playback.src = state.blobUrl;
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
}

async function retake() {
  clearTake();
  await toRecord();
}

// ---------- Spara ----------

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function toSave() {
  if (!state.blob) return;
  const ext = state.blob.type.includes('webm') ? 'webm' : 'mp4';
  const name = `tagning-${stamp()}.${ext}`;
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
  show('save');
}

async function share() {
  const status = $('#save-status');
  try {
    await navigator.share({ files: [state.file] });
    status.textContent = 'Klart. Kontrollera att videon finns där du sparade den.';
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    status.textContent = 'Delningen fungerade inte. Tryck på Ladda ned videon i stället.';
  }
}

// ---------- Hjälp vid fel ----------

const HELP = {
  NotAllowedError: {
    title: 'Kameran eller mikrofonen är blockerad',
    lines: [
      'Sidan behöver tillåtelse att använda kameran och mikrofonen. Inget spelas in förrän du själv startar.',
      'iPhone med Safari: tryck på aA i adressfältet, välj Webbplatsinställningar och tillåt Kamera och Mikrofon.',
      'Android med Chrome: tryck på ikonen till vänster om adressen, välj Behörigheter och tillåt Kamera och Mikrofon.',
      'Tryck sedan på Försök igen.'
    ]
  },
  NotFoundError: {
    title: 'Ingen kamera hittades',
    lines: ['Enheten verkar sakna kamera eller mikrofon. Prova med en mobil.']
  },
  NotReadableError: {
    title: 'Kameran används av något annat',
    lines: ['Stäng andra appar som använder kameran, till exempel ett videosamtal, och tryck på Försök igen.']
  },
  unsupported: {
    title: 'Webbläsaren kan inte spela in',
    lines: [
      'Öppna sidan i Safari på iPhone eller i Chrome på Android.',
      'Inbyggda webbläsare i appar som TikTok och Instagram stöder ofta inte inspelning. Tryck på menyn i appen och välj att öppna i webbläsaren.'
    ]
  },
  recorder: {
    title: 'Inspelningen kunde inte starta',
    lines: ['Webbläsaren stöder inte inspelning av video. Prova Safari på iPhone eller Chrome på Android.']
  },
  empty: {
    title: 'Tagningen blev tom',
    lines: ['Inget hann spelas in. Tryck på Försök igen. Om det händer igen, öppna sidan i Safari eller Chrome.']
  },
  default: {
    title: 'Kameran kunde inte starta',
    lines: ['Något stoppade kameran. Stäng andra appar som använder kameran och tryck på Försök igen.']
  }
};

function showHelp(key) {
  const help = HELP[key] || (key === 'SecurityError' || key === 'TypeError' ? HELP.unsupported : HELP.default);
  $('#h-help').textContent = help.title;
  const box = $('#help-text');
  box.textContent = '';
  for (const line of help.lines) {
    const p = document.createElement('p');
    p.textContent = line;
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

// ---------- Händelser ----------

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  switch (target.dataset.action) {
    case 'copy-link': copyLink(); break;
    case 'to-age': show('age'); break;
    case 'to-start': stopCamera(); clearTake(); show('start'); break;
    case 'to-scenes':
      if (!$('#age-ok').checked && !state.adult) return;
      state.adult = true;
      stopCamera();
      clearTake();
      resetScenePicker();
      show('scenes');
      break;
    case 'pick-other-scene': resetScenePicker(); $('#h-scenes').focus({ preventScroll: true }); break;
    case 'run-check': runCheck(); break;
    case 'to-record': toRecord(); break;
    case 'start-rec': startRecording(); break;
    case 'stop-rec': stopRecording('user'); break;
    case 'retake': retake(); break;
    case 'to-save': toSave(); break;
    case 'share': share(); break;
    case 'retry-camera': retryCamera(); break;
    default: break;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.recorder && state.recorder.state === 'recording') {
    stopRecording('hidden');
  }
});

window.addEventListener('pagehide', () => {
  stopCamera();
  if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
});

renderScenes();
show('start');
