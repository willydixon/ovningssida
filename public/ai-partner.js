// AI-motspelaren: ett samtal med en AI hos ElevenLabs som spelar den andra rollen
// och svarar på det användaren säger.
//
// Medan scenen pågår skickas ljudet från mikrofonen till ElevenLabs, och AI:ns röst
// spelas upp i mobilen. Videon skickas aldrig. Länken till samtalet kommer från
// Netlify-funktionen /api/ai-start, som har nyckeln (se netlify/functions/ai-start.mjs).
//
// Medan AI:n pratar skickas tystnad i stället för mikrofonens ljud. Annars hör AI:n
// sin egen röst i högtalaren, eftersom inspelningen är gjord utan ekoreducering.
// Det betyder att man inte kan avbryta AI:n mitt i en replik.

export const AI_RATE = 16000; // ElevenLabs tar emot och skickar PCM med 16 000 prover per sekund
const AFTER_AI_SECONDS = 0.35; // efterklang från AI:ns röst som inte ska skickas tillbaka

// ---- Ljud: rena funktioner som går att testa utan webbläsare ----

// Byter samplingsfrekvens. Vid nedsampling tas medelvärdet av proverna i varje
// steg, vilket tar bort det mesta av det som annars blir distorsion.
export function resample(input, fromRate, toRate = AI_RATE) {
  if (fromRate === toRate) return Float32Array.from(input);
  const ratio = fromRate / toRate;
  const length = Math.floor(input.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    if (ratio > 1) {
      const start = Math.floor(i * ratio);
      const end = Math.max(start + 1, Math.min(input.length, Math.floor((i + 1) * ratio)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j];
      out[i] = sum / (end - start);
    } else {
      const pos = i * ratio;
      const i0 = Math.floor(pos);
      const i1 = Math.min(i0 + 1, input.length - 1);
      out[i] = input[i0] + (input[i1] - input[i0]) * (pos - i0);
    }
  }
  return out;
}

export function floatToPcm16(samples) {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

export function pcm16ToFloat(pcm) {
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) out[i] = pcm[i] / 0x8000;
  return out;
}

export function bytesToBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function base64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// 'pcm_16000' ger 16000. Andra format än PCM stöds inte.
export function rateFromFormat(format) {
  const m = /^pcm_(\d+)$/.exec(format || '');
  return m ? Number(m[1]) : null;
}

// ---- Scenen som AI:n spelar ----

// Instruktionen till AI:n. Den är på svenska eftersom samtalet är på svenska.
export function buildAiSetup(scene, myRole) {
  const names = Object.fromEntries(scene.roller.map((r) => [r.id, r.namn]));
  const aiRole = scene.roller.find((r) => r.id !== myRole);
  const script = scene.repliker.map((l) => `${names[l.roll]}: ${l.text}`).join('\n');
  const prompt = [
    'Du är motspelare i en övningsapp för skådespelare. Ni spelar en kort scen på svenska, som vid en provfilmning.',
    `Du spelar ${aiRole.namn}. Skådespelaren spelar ${names[myRole]}.`,
    `Situation: ${scene.situation}`,
    'Manuset nedan är en utgångspunkt. Följ det så länge skådespelaren följer det. Säger skådespelaren något annat, improvisera och svara på det som faktiskt sägs.',
    'Så spelar du:',
    '- Stanna i rollen hela tiden. Bryt aldrig scenen för att förklara, ge råd eller bedöma skådespelaren.',
    '- Svara kort, oftast en eller två meningar, som i en riktig dialog.',
    '- Lyssna på exakt vad skådespelaren säger och reagera på det, även på ironi och undertext.',
    '- Ge skådespelaren något att spela mot: en vilja, motstånd och känsla. Var levande och engagerad, aldrig neutral.',
    '- Prata vardaglig svenska. Säg inga scenanvisningar och inga rollnamn före repliken.',
    '- Inget sexuellt innehåll.',
    '- När scenen har nått ett naturligt slut säger du en sista kort replik och är sedan tyst.',
    'Manus:',
    script
  ].join('\n');
  const first = scene.repliker[0];
  return {
    prompt,
    firstMessage: first.roll === aiRole.id ? first.text : '',
    aiName: aiRole.namn,
    myName: names[myRole]
  };
}

// ---- Samtalet ----

export class AiPartner {
  // ctx: sidans AudioContext. source: mikrofonens MediaStreamAudioSourceNode.
  // onLine(who, text): who är 'ai' eller 'me'. onStatus(status): 'connecting',
  // 'listening', 'speaking', 'error' eller 'ended'.
  constructor({ ctx, source, onLine = () => {}, onStatus = () => {}, fetchImpl, WebSocketImpl }) {
    this.ctx = ctx;
    this.source = source;
    this.onLine = onLine;
    this.onStatus = onStatus;
    this.fetchImpl = fetchImpl || ((...args) => fetch(...args));
    this.WebSocketImpl = WebSocketImpl || WebSocket;
    this.ws = null;
    this.node = null;
    this.out = null;
    this.live = false; // sant när inspelningen har börjat
    this.stopped = false;
    this.queue = []; // AI-ljud som kom före inspelningen
    this.sources = new Set();
    this.playhead = 0;
    this.speakingUntil = 0;
    this.outRate = AI_RATE;
    this.inRate = AI_RATE;
    this.acc = new Float32Array(0);
    this.status = '';
    this.conversationId = null;
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.onStatus(status);
  }

  async connect(setup) {
    this.setStatus('connecting');
    await this.ctx.audioWorklet.addModule('mic-worklet.js');
    const res = await this.fetchImpl('/api/ai-start', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.signed_url) throw new Error('AI-motspelaren kunde inte starta');
    if (this.stopped) return;

    this.node = new AudioWorkletNode(this.ctx, 'mic-chunks');
    this.node.port.onmessage = (event) => this.onMic(event.data);
    this.source.connect(this.node);
    this.mute = this.ctx.createGain();
    this.mute.gain.value = 0; // noden måste vara kopplad för att köras, men ska inte höras
    this.node.connect(this.mute).connect(this.ctx.destination);
    this.out = this.ctx.createGain();
    this.out.connect(this.ctx.destination);

    const agent = { prompt: { prompt: setup.prompt }, language: 'sv' };
    if (setup.firstMessage) agent.first_message = setup.firstMessage;
    const ws = new this.WebSocketImpl(data.signed_url);
    this.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'conversation_initiation_client_data', conversation_config_override: { agent } }));
    };
    ws.onmessage = (event) => this.onMessage(event.data);
    ws.onerror = () => { if (!this.stopped) this.setStatus('error'); };
    ws.onclose = () => {
      if (!this.stopped && this.status !== 'error') this.setStatus('ended');
      this.live = false;
    };
  }

  // Inspelningen har börjat: skicka mikrofonens ljud och spela upp AI:ns röst.
  begin() {
    this.live = true;
    for (const b64 of this.queue.splice(0)) this.play(b64);
    if (this.status === 'connecting' && this.ws && this.ws.readyState === 1) this.setStatus('listening');
  }

  aiTalking() {
    return this.ctx.currentTime < this.speakingUntil + AFTER_AI_SECONDS;
  }

  onMic(block) {
    if (!this.live || !this.ws || this.ws.readyState !== 1) return;
    this.inRate = this.ctx.sampleRate;
    const merged = new Float32Array(this.acc.length + block.length);
    merged.set(this.acc);
    merged.set(block, this.acc.length);
    this.acc = merged;
    const size = Math.round(this.inRate / 10); // 100 ms
    while (this.acc.length >= size) {
      const piece = this.acc.subarray(0, size);
      const pcm = this.aiTalking() ? new Int16Array(Math.round(size * AI_RATE / this.inRate)) : floatToPcm16(resample(piece, this.inRate));
      this.ws.send(JSON.stringify({ user_audio_chunk: bytesToBase64(new Uint8Array(pcm.buffer)) }));
      this.acc = this.acc.slice(size);
    }
    if (!this.aiTalking() && this.status === 'speaking') this.setStatus('listening');
  }

  onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    switch (msg.type) {
      case 'conversation_initiation_metadata': {
        const meta = msg.conversation_initiation_metadata_event || {};
        this.conversationId = meta.conversation_id || null;
        this.outRate = rateFromFormat(meta.agent_output_audio_format) || AI_RATE;
        if (this.live) this.setStatus('listening');
        break;
      }
      case 'audio': {
        const b64 = msg.audio_event && msg.audio_event.audio_base_64;
        if (!b64) break;
        if (this.live) this.play(b64);
        else this.queue.push(b64);
        break;
      }
      case 'agent_response':
        if (msg.agent_response_event) this.onLine('ai', msg.agent_response_event.agent_response);
        break;
      case 'user_transcript':
        if (msg.user_transcription_event) this.onLine('me', msg.user_transcription_event.user_transcript);
        break;
      case 'interruption':
        this.stopPlayback();
        break;
      case 'ping':
        if (msg.ping_event && this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event.event_id }));
        }
        break;
      default:
        break;
    }
  }

  play(b64) {
    const bytes = base64ToBytes(b64);
    const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
    if (!pcm.length || !this.out) return;
    const buffer = this.ctx.createBuffer(1, pcm.length, this.outRate);
    buffer.getChannelData(0).set(pcm16ToFloat(pcm));
    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(this.out);
    const start = Math.max(this.playhead, this.ctx.currentTime + 0.03);
    node.start(start);
    this.playhead = start + buffer.duration;
    this.speakingUntil = this.playhead;
    this.sources.add(node);
    node.onended = () => this.sources.delete(node);
    this.setStatus('speaking');
  }

  stopPlayback() {
    for (const node of this.sources) {
      try { node.stop(); } catch { /* redan stoppad */ }
    }
    this.sources.clear();
    this.playhead = 0;
    this.speakingUntil = 0;
  }

  stop() {
    this.stopped = true;
    this.live = false;
    this.stopPlayback();
    if (this.ws) {
      try { this.ws.close(); } catch { /* redan stängd */ }
    }
    if (this.node) {
      try { this.source.disconnect(this.node); } catch { /* redan bortkopplad */ }
      this.node.port.onmessage = null;
      this.node.disconnect();
    }
    if (this.out) this.out.disconnect();
  }
}
