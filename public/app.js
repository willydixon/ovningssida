// Övningssidan, testversion.
// Allt körs i mobilen. Inspelningen hålls i webbläsarens minne och skickas aldrig
// någonstans. Sidans säkerhetspolicy (connect-src 'none') stoppar dessutom alla
// nätverksanrop från skriptet.

import { SCENES } from './scenes.js';
import { levelsFrom, lumaStats, percentile, rateSpeech, ratePeaks, rateNoise, rateLight } from './check.js';
import { ScenePlayer, createVoiceDetector, expectedMs } from './partner.js';
import { t } from './texts.js'; // alla texter som visas ligger i texts.js

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
  file: null,
  // Motspelaren
  voice: null,
  player: null,
  vad: null,
  levelTimer: 0,
  levelTicks: 0,
  listening: null,
  partnerSpeaking: false,
  utterance: null
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
    status.textContent = t('inapp_copied');
  } catch {
    status.textContent = t('inapp_copy_manual', { url: location.href });
  }
}

// ---------- 18 år ----------

$('#age-ok').addEventListener('change', (e) => {
  $('#age-continue').disabled = !e.target.checked;
});

// ---------- Scener ----------

function formatLength(seconds) {
  if (seconds < 60) return t('length_seconds', { n: seconds });
  const minutes = Math.round((seconds / 60) * 2) / 2;
  return t('length_minutes', { n: String(minutes).replace('.', ',') });
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
      badge.textContent = t('scene_draft_badge');
      title.append(' ', badge);
    }

    const situation = document.createElement('span');
    situation.textContent = scene.situation;

    const meta = document.createElement('span');
    meta.className = 'meta';
    const approval = scene.godkand_av
      ? t('scene_approved_by', { name: scene.godkand_av })
      : t('scene_not_reviewed');
    meta.textContent = t('scene_meta', { length: formatLength(scene.langd_sekunder), roles: scene.roller.length, approval });

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
    b.textContent = t('role_button', { name: role.namn });
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
  for (const [index, line] of scene.repliker.entries()) {
    const p = document.createElement('p');
    const mine = line.roll === state.role;
    p.className = mine ? 'mine' : 'theirs';
    p.dataset.line = String(index);
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = mine ? t('record_you', { name: names[line.roll] }) : names[line.roll];
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
  resetPartner();
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
  const withPartner = partnerWanted();
  if (withPartner) unlockSpeech(); // måste ske i själva trycket, före allt som väntar
  if (!streamIsLive()) {
    const ok = await startCamera();
    if (!ok) return;
    attachPreview('#preview-record');
  }
  $('#partner-box').hidden = true;
  if (withPartner) startLevelLoop(); // mäter bakgrundsljudet under nedräkningen
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
}

function updateRecTime() {
  const s = Math.floor((Date.now() - state.recStart) / 1000);
  $('#rec-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (s >= MAX_SECONDS) stopRecording('max');
}

function stopRecording(reason) {
  clearInterval(state.recTimer);
  stopPartner();
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
    hidden: 'stopped_hidden',
    ended: 'stopped_ended',
    error: 'stopped_error',
    max: 'stopped_max'
  };
  const reason = reasons[state.stopReason];
  note.textContent = reason ? t(reason) : '';
  note.hidden = !reason;

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

// ---------- Motspelaren ----------
// Mobilens egen uppläsningsröst läser motspelarens repliker. Ljudnivån från
// mikrofonen avgör när användaren har sagt sin replik. Logiken finns i partner.js.

const synth = window.speechSynthesis || null;
const LEVEL_MS = 50;
const AFTER_PARTNER_MS = 400; // efterklang från rösten som inte ska räknas som tal

function findSwedishVoice() {
  if (!synth || typeof synth.getVoices !== 'function' || !window.SpeechSynthesisUtterance) return null;
  let voices = [];
  try { voices = synth.getVoices() || []; } catch { voices = []; }
  // Bara röster som finns i mobilen. En röst som går via nätet skulle skicka replikerna iväg.
  const swedish = voices.filter((v) => /^sv([-_]|$)/i.test(v.lang || '') && v.localService !== false);
  return swedish.find((v) => v.default) || swedish[0] || null;
}

function updateVoice() {
  state.voice = findSwedishVoice();
  const found = !!state.voice;
  $('#partner-toggle').hidden = !found;
  $('#partner-note').hidden = !found;
  $('#partner-no-voice').hidden = found;
}

const partnerWanted = () => !!state.voice && $('#partner-on').checked;

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
  updateVoice();
  $('#partner-box').hidden = false;
  $('#partner-done').hidden = true;
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
  show('save');
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
    case 'next-line': if (state.player) state.player.skip(); break;
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
  cancelSpeech();
  if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
});

renderScenes();
updateVoice();
show('start');
