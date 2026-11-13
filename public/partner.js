// Motspelaren: går igenom scenens repliker i ordning. Motspelarens repliker läses
// upp med mobilens egen talsyntes, och för användarens repliker väntar den tills
// personen har pratat klart eller trycker på Nästa replik.
//
// Här finns bara logiken, utan kopplingar till sidan, så att den kan testas utan
// mobil. app.js kopplar in talsyntesen och ljudnivån från mikrofonen.

import { percentile } from './check.js';

// Ungefär hur lång tid det tar att säga en text, räknat på cirka 15 tecken per sekund.
export const expectedMs = (text) => Math.max(600, text.trim().length * 65);

// Avgör när användaren har sagt sin replik, utifrån ljudnivån i dBFS var 50:e ms.
// Bakgrundsnivån mäts när ingen ska prata, till exempel under nedräkningen.
// Tal är det som ligger tydligt över bakgrunden. En kort tystnad avslutar
// repliken när det mesta är sagt. Innan dess krävs en längre tystnad, så att
// en paus i spelet inte släpper fram motspelaren för tidigt.
export const VOICE = {
  frameMs: 50,
  margin: 10, // tal ligger minst så här många dB över bakgrunden
  floorDb: -50, // och aldrig under den här nivån
  minSpeechMs: 200, // så här mycket ljud över gränsen räknas som tal
  maxGapMs: 150, // korta glapp mellan ljuden, till exempel mellan ord, bryter inte talet
  shortPauseMs: 900, // tystnad som avslutar repliken när det mesta är sagt
  longPauseMs: 2500, // tystnad som avslutar repliken innan det mesta är sagt
  saidShare: 0.45, // andel av den väntade tiden med tal som räknas som det mesta
  shortLineMs: 2000, // korta repliker avslutas alltid med den korta tystnaden
  windowFrames: 100 // bakgrunden räknas på de senaste fem sekunderna
};

export function createVoiceDetector(options = {}) {
  const o = { ...VOICE, ...options };
  const background = [];
  let line = null;

  const thresholdDb = () => {
    if (background.length < 10) return o.floorDb;
    return Math.max(percentile(background, 0.2) + o.margin, o.floorDb);
  };

  return {
    // En nivå när varken användaren eller motspelaren pratar.
    observe(db) {
      background.push(db);
      if (background.length > o.windowFrames) background.shift();
    },

    // Börjar lyssna efter användarens replik. graceMs är en kort stund efter
    // motspelarens röst då nivåerna inte räknas, så att efterklangen inte blir tal.
    startLine(text, graceMs = 0) {
      line = { expected: expectedMs(text), grace: graceMs, run: 0, speech: 0, silence: 0, heard: false };
    },

    // En nivå medan användaren säger sin replik. Ger 'waiting' innan talet har
    // börjat, 'speaking' under talet och 'done' när personen har pratat klart.
    push(db) {
      if (!line) return 'waiting';
      if (line.grace > 0) {
        line.grace -= o.frameMs;
        return 'waiting';
      }
      if (db > thresholdDb()) {
        line.silence = 0;
        if (line.heard) line.speech += o.frameMs;
        else {
          line.run += o.frameMs;
          if (line.run >= o.minSpeechMs) {
            line.heard = true;
            line.speech = line.run;
          }
        }
      } else {
        line.silence += o.frameMs;
        if (!line.heard) {
          if (line.silence > o.maxGapMs) line.run = 0; // bara ett klick eller ett kort ljud
        } else {
          const mostSaid = line.expected <= o.shortLineMs || line.speech >= line.expected * o.saidShare;
          if (line.silence >= (mostSaid ? o.shortPauseMs : o.longPauseMs)) {
            line = null;
            return 'done';
          }
        }
      }
      return line.heard ? 'speaking' : 'waiting';
    },

    get thresholdDb() { return thresholdDb(); }
  };
}

// Spelar upp scenen. speak(text) och listen(line, index) ger löften som app.js
// håller i. onLine(index) anropas när en replik börjar och onEnd() när scenen är slut.
export class ScenePlayer {
  constructor(lines, myRole, { speak, listen, cancelSpeech = () => {}, onLine = () => {}, onEnd = () => {} }) {
    this.lines = lines;
    this.myRole = myRole;
    this.speak = speak;
    this.listen = listen;
    this.cancelSpeech = cancelSpeech;
    this.onLine = onLine;
    this.onEnd = onEnd;
    this.stopped = false;
    this.current = -1;
    this.skipCurrent = null;
  }

  isMine(index) {
    return this.lines[index].roll === this.myRole;
  }

  async play() {
    for (let i = 0; i < this.lines.length; i++) {
      if (this.stopped) return;
      this.current = i;
      this.onLine(i);
      const skipped = new Promise((resolve) => { this.skipCurrent = resolve; });
      const line = this.lines[i];
      const work = this.isMine(i) ? this.listen(line, i) : this.speak(line.text, i);
      await Promise.race([work, skipped]);
      this.skipCurrent = null;
    }
    this.current = -1;
    if (!this.stopped) this.onEnd();
  }

  // Går vidare till nästa replik direkt, till exempel när användaren trycker på Nästa replik.
  skip() {
    if (this.current < 0 || !this.skipCurrent) return;
    if (!this.isMine(this.current)) this.cancelSpeech();
    this.skipCurrent();
  }

  stop() {
    this.stopped = true;
    this.cancelSpeech();
    if (this.skipCurrent) this.skipCurrent();
  }
}
