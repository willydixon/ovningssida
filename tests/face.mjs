// Tester för ansiktets spel: måtten från MediaPipes uttryck, med påhittade värden.
// Körs med: node tests/face.mjs

import { EXPRESSION, frameFrom, createFaceMeter, summarizeFace, readFace } from '../public/face.js';

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FEL '} ${message}`);
  if (!ok) failures.push(message);
};

// En bild som MediaPipe hade lämnat: alla 52 uttryck, med de värden vi anger och resten noll.
const ALL = [...EXPRESSION, 'jawOpen', 'mouthClose', 'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookUpLeft'];
const categories = (values) => ALL.map((name, index) => ({ index, categoryName: name, score: values[name] || 0 }));

const f = frameFrom(categories({ mouthSmileLeft: 0.4, eyeLookDownLeft: 0.6, eyeLookDownRight: 0.2, jawOpen: 0.9 }));
check(f.expr.length === EXPRESSION.length && f.expr[EXPRESSION.indexOf('mouthSmileLeft')] === 0.4, 'Uttrycken läses av med namn');
check(Math.abs(f.down - 0.4) < 1e-9, 'Blicken nedåt är snittet av båda ögonen');
check(!EXPRESSION.includes('jawOpen') && !EXPRESSION.some((n) => n.startsWith('eyeBlink') || n.startsWith('eyeLook')), 'Att prata, blinka och titta åt sidan räknas inte som uttryck');

const run = (count, valuesAt) => {
  const meter = createFaceMeter();
  for (let i = 0; i < count; i++) {
    const values = valuesAt(i);
    meter.push(values ? categories(values) : null);
  }
  return meter.summary();
};

check(run(10, () => ({ browInnerUp: 0.5 })).enough === false, 'För kort tagning ger inget ansiktsmått');
check(run(40, (i) => (i % 3 ? null : { browInnerUp: 0.5 })).enough === false, 'Ett ansikte som syns för lite ger inget ansiktsmått');

const still = run(40, () => ({ browInnerUp: 0.05, mouthSmileLeft: 0.05 }));
check(still.enough && still.uttryck === 0 && still.blickNere === 0, `Ett helt stilla ansikte ger uttryck 0 (${still.uttryck})`);

const names = EXPRESSION.slice(0, 10);
const lively = run(60, (i) => Object.fromEntries(names.map((n, k) => [n, ((i + k) % 6) / 10])));
check(lively.enough && lively.uttryck >= 0.8, `Ett ansikte där tio uttryck rör sig mycket ger högt uttryck (${lively.uttryck.toFixed(2)})`);

const some = run(60, (i) => ({ browInnerUp: (i % 4) / 20, mouthSmileLeft: (i % 5) / 25, eyeSquintLeft: (i % 3) / 20 }));
check(some.enough && some.uttryck > still.uttryck && some.uttryck < lively.uttryck, `Lite rörelse hamnar mellan stilla och levande (${some.uttryck.toFixed(2)})`);

const reading = run(40, (i) => ({ eyeLookDownLeft: i % 2 ? 0.6 : 0.1, eyeLookDownRight: i % 2 ? 0.6 : 0.1 }));
check(Math.abs(reading.blickNere - 0.5) < 1e-9, 'Blicken nere halva tiden ger blickNere 0,5');

const gaps = run(40, (i) => (i % 4 === 0 ? null : { browInnerUp: 0.3 }));
check(gaps.enough && Math.abs(gaps.seenShare - 0.75) < 1e-9, 'Bilder utan ansikte räknas bort, så länge ansiktet syns för det mesta');

check(readFace(null, null, 0) === undefined && readFace({}, { readyState: 1 }, 0) === undefined, 'Utan bild i videon räknas inget');
const fake = { detectForVideo: () => ({ faceBlendshapes: [] }) };
check(readFace(fake, { readyState: 4, videoWidth: 640 }, 1) === null, 'Utan ansikte i bilden blir det null');
const one = { detectForVideo: () => ({ faceBlendshapes: [{ categories: categories({ browInnerUp: 0.2 }) }] }) };
check(Array.isArray(readFace(one, { readyState: 4, videoWidth: 640 }, 2)), 'Med ett ansikte kommer uttrycken tillbaka');

if (failures.length) {
  console.log(`\n${failures.length} test misslyckades.`);
  process.exit(1);
}
console.log('\nAlla tester för ansiktet gick igenom.');
