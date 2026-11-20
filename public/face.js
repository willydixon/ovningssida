// Ansiktets spel: mäts i mobilen med Googles MediaPipe, bara om användaren har sagt ja.
//
// Under tagningen tittar mobilen på kamerabilden ungefär fem gånger i sekunden och läser av
// mått på ansiktsuttrycket (blendshapes), till exempel hur mycket ögonbrynen höjs eller hur
// mycket munnen ler. Inga bilder sparas eller skickas någonstans. Bara två siffror blir kvar
// efter tagningen: hur mycket ansiktet spelade (uttryck) och hur stor del av tiden blicken var
// nere i texten (blickNere). Hur ansiktet ser ut räknas aldrig, och inga känslor gissas.
//
// MediaPipe (Apache-2.0) ligger i public/vendor/mediapipe/. Modellen face_landmarker.task läggs
// in där för hand (se README), och models.json säger om den finns. Utan modellen visas inte
// frågan om ansiktet, och betyget bygger bara på rösten.
// Gränserna är startvärden som behöver provas på riktiga mobiler.

export const FACE_MS = 200;
export const FACE_DIR = new URL('vendor/mediapipe/', import.meta.url).href;
export const FACE_MODEL = `${FACE_DIR}face_landmarker.task`;

// Uttryck som visar spel. Käken och munnens form när man pratar räknas inte, så att tal
// inte blir uttryck. Blinkningar och blickens riktning räknas inte heller som uttryck.
export const EXPRESSION = [
  'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
  'cheekSquintLeft', 'cheekSquintRight', 'eyeSquintLeft', 'eyeSquintRight', 'eyeWideLeft', 'eyeWideRight',
  'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight', 'mouthPressLeft', 'mouthPressRight',
  'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight', 'noseSneerLeft', 'noseSneerRight'
];
const LOOK_DOWN = ['eyeLookDownLeft', 'eyeLookDownRight'];
const LOOK_DOWN_AT = 0.35; // så långt ned blicken ska vara för att räknas som nere i texten
const TOP = 6; // så många uttryck som räknas: de som rörde sig mest
const MIN_FRAMES = 15; // ungefär tre sekunder
const MIN_SEEN = 0.5; // ansiktet måste synas minst halva tiden för att mätas

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const scale = (v, lo, hi) => clamp01((v - lo) / (hi - lo));
const sortNum = (list) => [...list].sort((a, b) => a - b);
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))] : 0);

// Måtten för en bild, från MediaPipes lista [{ categoryName, score }].
export function frameFrom(categories) {
  const byName = new Map(categories.map((c) => [c.categoryName, c.score]));
  return {
    expr: EXPRESSION.map((name) => byName.get(name) || 0),
    down: LOOK_DOWN.reduce((sum, name) => sum + (byName.get(name) || 0), 0) / LOOK_DOWN.length
  };
}

// push(categories) för varje bild där ett ansikte syns, push(null) när inget ansikte syns.
export function createFaceMeter() {
  const frames = [];
  return {
    push(categories) { frames.push(categories ? frameFrom(categories) : null); },
    get frames() { return frames; },
    summary() { return summarizeFace(frames); }
  };
}

// Ansiktets mått för en tagning. enough är falskt om ansiktet syntes för lite för att mätas,
// och då räknas ansiktet inte alls i betyget, varken upp eller ned.
export function summarizeFace(frames) {
  const seen = frames.filter(Boolean);
  const seenShare = frames.length ? seen.length / frames.length : 0;
  if (frames.length < MIN_FRAMES || seenShare < MIN_SEEN) return { enough: false, seenShare };
  const ranges = EXPRESSION.map((_, i) => {
    const values = sortNum(seen.map((f) => f.expr[i]));
    return pct(values, 0.9) - pct(values, 0.1);
  });
  const top = sortNum(ranges).slice(-TOP);
  const movement = top.reduce((a, b) => a + b, 0) / top.length;
  return {
    enough: true,
    seenShare,
    uttryck: scale(movement, 0.04, 0.4),
    blickNere: seen.filter((f) => f.down > LOOK_DOWN_AT).length / seen.length
  };
}

// ---- MediaPipe ----

let modelCheck = null;
// Finns modellen på sidan? models.json skrivs av tools/render-pages.mjs. Frågan om ansiktet
// visas bara om modellen finns.
export function faceModelAvailable() {
  if (!modelCheck) {
    modelCheck = fetch(`${FACE_DIR}models.json`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => data.ansikte === true)
      .catch(() => false);
  }
  return modelCheck;
}

let loading = null;
// Laddar MediaPipe och modellen, en gång. Grafikkortet i första hand, annars processorn.
export function loadFaceLandmarker() {
  if (!loading) {
    loading = (async () => {
      if (typeof WebAssembly !== 'object') throw new Error('Ingen WebAssembly');
      const vision = await import(`${FACE_DIR}vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${FACE_DIR}wasm`);
      const options = (delegate) => ({
        baseOptions: { modelAssetPath: FACE_MODEL, delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true
      });
      try {
        return await vision.FaceLandmarker.createFromOptions(files, options('GPU'));
      } catch {
        return vision.FaceLandmarker.createFromOptions(files, options('CPU'));
      }
    })();
    loading.catch(() => { loading = null; }); // ett nytt försök nästa gång
  }
  return loading;
}

// Läser av en bild från videon. Ger MediaPipes lista med uttryck, null när inget ansikte
// syns, och undefined när videon inte har någon bild än (då räknas bilden inte alls).
export function readFace(landmarker, video, now) {
  if (!landmarker || !video || video.readyState < 2 || !video.videoWidth) return undefined;
  const result = landmarker.detectForVideo(video, now);
  const first = result && result.faceBlendshapes && result.faceBlendshapes[0];
  return first && Array.isArray(first.categories) ? first.categories : null;
}
