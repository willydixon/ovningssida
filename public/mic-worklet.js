// Skickar mikrofonens ljud till sidan i block om 2048 prover, för AI-motspelaren.
// Körs i webbläsarens ljudtråd. Ljudet ändras inte här.
class MicChunks extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(2048);
    this.n = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.buf[this.n++] = channel[i];
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf.slice(0));
          this.n = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('mic-chunks', MicChunks);
