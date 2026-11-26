// Bilden med resultatet efter en nivå, att dela på TikTok, Instagram eller i ett meddelande.
// Den ritas i mobilen på en canvas i formatet 1080 × 1920 (9:16, som TikTok och Instagram
// Stories). Den visar bara nivån, betygen, rollerna och vad AI:n tycker: ingen bild på
// användaren och inget namn. Bilden lämnar mobilen bara om användaren själv delar eller
// sparar den.
//
// Bilden är en scen: en strålkastare uppifrån och betyget som står i ljuset på scengolvet.
// Under det kommer vad AI:n tycker, rollerna som i ett teaterprogram och en rad om att
// betyget är en fingervisning.

export const CARD_W = 1080;
export const CARD_H = 1920;

const BG = '#0d0b09';
const INK = '#f6efe6';
const QUIET = '#b4a696';
const GOLD = '#f2b544';
const DISPLAY = "Fraunces, Georgia, 'Times New Roman', serif";
const BODY = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Allt viktigt håller sig inom de här marginalerna, så att TikToks knappar till höger och
// texterna upptill och nedtill i TikTok och Instagram inte täcker det.
export const SIDE = 180;
export const SAFE_TOP = 230;
export const SAFE_BOTTOM = 1660;
const FLOOR_Y = 780; // scengolvet där betyget står, mitt i ljuset
const FLOOR_RX = 430;
const FLOOR_RY = 88;
const BEAM_TOP = -300;
const BEAM_TOP_HALF = 46;

// Typsnitten som bilden använder. De finns redan på sidan (app.css).
export const CARD_FONTS = ['700 100px Fraunces', '600 100px Fraunces', '500 40px Inter', '400 40px Inter'];

// Kortar texten med … tills den får plats i bredden.
export function fitText(measure, text, maxWidth) {
  const full = String(text);
  if (measure(full) <= maxWidth) return full;
  let cut = Array.from(full);
  while (cut.length > 1 && measure(`${cut.join('').trimEnd()}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.join('').trimEnd()}…`;
}

// Delar texten i rader som får plats i bredden. Blir det fler än maxLines rader kortas
// den sista med …
export function wrapText(measure, text, maxWidth, maxLines = Infinity) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || measure(next) <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(measure, lines.slice(maxLines - 1).join(' '), maxWidth);
    return kept;
  }
  return lines.map((l) => fitText(measure, l, maxWidth));
}

// En eller två rader. Behövs två delas texten där raderna blir så lika långa som möjligt.
export function balanceText(measure, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const whole = words.join(' ');
  if (measure(whole) <= maxWidth) return [whole];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const widths = lines.map(measure);
    if (widths.some((w) => w > maxWidth)) continue;
    const longest = Math.max(...widths);
    if (!best || longest < best.longest) best = { lines, longest };
  }
  return best ? best.lines : wrapText(measure, whole, maxWidth, 2);
}

// Samma slumptal varje gång, så att bilden blir likadan för samma resultat.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Strålkastarens kägla, från lampan ovanför bilden ner till ljuscirkeln på golvet.
function beamPath(ctx, cx, k) {
  const rx = FLOOR_RX * k;
  const ry = FLOOR_RY * k;
  ctx.beginPath();
  ctx.moveTo(cx - BEAM_TOP_HALF * k, BEAM_TOP);
  ctx.lineTo(cx + BEAM_TOP_HALF * k, BEAM_TOP);
  ctx.lineTo(cx + rx, FLOOR_Y);
  ctx.ellipse(cx, FLOOR_Y, rx, ry, 0, 0, Math.PI);
  ctx.closePath();
}

// Mörkret, strålkastaren, ljuset på golvet och golvets brädor.
function drawStage(ctx, W, H) {
  const cx = W / 2;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Ett svagt rött sken nedifrån, som ridån i salongen.
  const red = ctx.createRadialGradient(cx, H + 320, 0, cx, H + 320, 1100);
  red.addColorStop(0, 'rgba(200, 69, 58, 0.17)');
  red.addColorStop(1, 'rgba(200, 69, 58, 0)');
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, W, H);

  // Strålkastaren: flera käglor ovanpå varandra ger mjuka kanter.
  for (let i = 0; i < 16; i++) {
    beamPath(ctx, cx, 1 + i * 0.018);
    const beam = ctx.createLinearGradient(0, BEAM_TOP, 0, FLOOR_Y + FLOOR_RY);
    beam.addColorStop(0, 'rgba(255, 228, 176, 0.034)');
    beam.addColorStop(0.6, 'rgba(250, 205, 120, 0.021)');
    beam.addColorStop(1, 'rgba(242, 181, 68, 0.014)');
    ctx.fillStyle = beam;
    ctx.fill();
  }

  // Damm som svävar i ljuset, men inte där texten står upptill.
  const random = seeded(20261126);
  for (let i = 0; i < 110; i++) {
    const y = 40 + random() * (FLOOR_Y - 120);
    const x = cx + (random() * 2 - 1) * (BEAM_TOP_HALF + (FLOOR_RX - BEAM_TOP_HALF) * ((y - BEAM_TOP) / (FLOOR_Y - BEAM_TOP))) * 0.9;
    const r = 0.8 + random() * 2.2;
    const alpha = 0.05 + random() * 0.22;
    if (y > SAFE_TOP && y < 360) continue;
    ctx.fillStyle = `rgba(255, 236, 200, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ljuset på golvet, med springorna mellan golvbrädorna.
  ctx.save();
  ctx.translate(cx, FLOOR_Y);
  ctx.scale(1, FLOOR_RY / FLOOR_RX);
  const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, FLOOR_RX);
  pool.addColorStop(0, 'rgba(255, 216, 146, 0.46)');
  pool.addColorStop(0.5, 'rgba(242, 181, 68, 0.2)');
  pool.addColorStop(1, 'rgba(242, 181, 68, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(0, 0, FLOOR_RX, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, FLOOR_Y, FLOOR_RX, FLOOR_RY, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(13, 11, 9, 0.38)';
  ctx.lineWidth = 3;
  for (let x = -1400; x <= W + 1400; x += 92) {
    ctx.beginPath();
    ctx.moveTo(cx, FLOOR_Y - 620);
    ctx.lineTo(x, FLOOR_Y + FLOOR_RY + 40);
    ctx.stroke();
  }
  ctx.restore();
}

// Betyget, stort och i ljuset, med /10 bredvid. Baslinjen ligger på golvet.
function drawScore(ctx, model, W) {
  const ofFont = `600 88px ${DISPLAY}`;
  ctx.font = ofFont;
  const ofWidth = ctx.measureText(model.of).width;
  const gap = 12;
  let size = 310;
  let scoreWidth;
  for (;;) {
    ctx.font = `700 ${size}px ${DISPLAY}`;
    scoreWidth = ctx.measureText(model.score).width;
    if (scoreWidth + gap + ofWidth <= W - 2 * SIDE || size <= 120) break;
    size -= 10;
  }
  const x = (W - (scoreWidth + gap + ofWidth)) / 2;
  ctx.textAlign = 'left';
  ctx.save();
  ctx.shadowColor = 'rgba(242, 181, 68, 0.5)';
  ctx.shadowBlur = 54;
  ctx.fillStyle = GOLD;
  ctx.fillText(model.score, x, FLOOR_Y);
  ctx.restore();
  ctx.font = ofFont;
  ctx.fillStyle = QUIET;
  ctx.fillText(model.of, x + scoreWidth + gap, FLOOR_Y);
}

// Vad AI:n tycker, på en rad om det går och annars på två lika långa.
function drawTitle(ctx, title, top, W) {
  const width = W - 2 * SIDE;
  const measure = (s) => ctx.measureText(s).width;
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  for (let size = 70; size >= 60; size -= 2) {
    ctx.font = `600 ${size}px ${DISPLAY}`;
    if (measure(title) <= width) {
      ctx.fillText(title, W / 2, top);
      return top;
    }
  }
  ctx.font = `600 70px ${DISPLAY}`;
  const lines = balanceText(measure, title, width);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, top + i * 80));
  return top + (lines.length - 1) * 80;
}

// Rollerna som i ett teaterprogram: rollen med prickar fram till betyget, och scenen under.
const ROW = 86;
function drawRoles(ctx, rows, top, W) {
  const left = SIDE;
  const right = W - SIDE;
  const scoreFont = `700 46px ${DISPLAY}`;
  const roleFont = `500 34px ${BODY}`;
  const sceneFont = `400 26px ${BODY}`;
  const measure = (s) => ctx.measureText(s).width;
  ctx.font = scoreFont;
  const column = Math.max(0, ...rows.map((row) => measure(row.score)));
  let y = top;
  for (const row of rows) {
    ctx.font = scoreFont;
    ctx.textAlign = 'right';
    ctx.fillStyle = GOLD;
    ctx.fillText(row.score, right, y);

    ctx.textAlign = 'left';
    ctx.font = roleFont;
    ctx.fillStyle = INK;
    const role = fitText(measure, row.role, right - left - column - 64);
    ctx.fillText(role, left, y);
    const from = left + measure(role) + 20;

    ctx.font = sceneFont;
    ctx.fillStyle = QUIET;
    ctx.fillText(fitText(measure, row.scene, right - left - column - 24), left, y + 36);

    ctx.fillStyle = 'rgba(180, 166, 150, 0.55)';
    for (let x = right - column - 22; x >= from; x -= 14) {
      ctx.beginPath();
      ctx.arc(x, y - 9, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    y += ROW;
  }
  return y - ROW + 36;
}

// Ritar hela bilden. model: { brand, level, score, of, title, rows: [{ role, scene, score }], note }.
// Ger var texten slutar, så att testerna kan se att allt får plats.
export function drawCard(ctx, model) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const width = W - 2 * SIDE;
  const measure = (s) => ctx.measureText(s).width;
  drawStage(ctx, W, H);
  ctx.textBaseline = 'alphabetic';

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `600 50px ${DISPLAY}`;
  ctx.fillText(fitText(measure, model.brand, width), W / 2, 286);
  ctx.fillStyle = QUIET;
  ctx.font = `500 34px ${BODY}`;
  ctx.fillText(fitText(measure, model.level, width), W / 2, 342);

  drawScore(ctx, model, W);

  let y = drawTitle(ctx, model.title, FLOOR_Y + FLOOR_RY + 96, W);
  y = drawRoles(ctx, model.rows, y + 100, W);

  ctx.textAlign = 'center';
  ctx.fillStyle = QUIET;
  ctx.font = `400 27px ${BODY}`;
  y += 68;
  const note = wrapText(measure, model.note, width, 3);
  note.forEach((line, i) => ctx.fillText(line, W / 2, y + i * 38));
  return y + (note.length - 1) * 38;
}

// Gör bilden som PNG. Väntar först på typsnitten, så att canvasen inte ritar med reservtypsnitt.
export async function makeCard(model, doc = document) {
  try {
    await Promise.all(CARD_FONTS.map((font) => doc.fonts.load(font)));
  } catch { /* då används reservtypsnitten */ }
  const canvas = doc.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Ingen canvas');
  const bottom = drawCard(ctx, model);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  canvas.width = 0; // lämnar tillbaka minnet direkt, viktigt i iPhone
  canvas.height = 0;
  if (!blob) throw new Error('Bilden gick inte att göra');
  return { blob, bottom };
}
