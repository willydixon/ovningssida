// Bilderna till scenerna: egna SVG-illustrationer, utan riktiga personer.
// Används av tools/render-pages.mjs, som skriver dem till public/img/. Varje bild tar en palett.

let counter = 0;
const uid = (name) => `${name}${++counter}`;
// Varje bild är en egen fil, så id:n behöver bara vara unika i bilden. Nollställs per bild.
export const resetIds = () => { counter = 0; };

// En person i profil, sedd från sidan: huvud och axlar. facing 1 tittar åt höger, -1 åt vänster.
export function profile(x, y, scale, facing, fill, extra = '') {
  return `<g transform="translate(${x} ${y}) scale(${facing * scale} ${scale})" fill="${fill}" ${extra}>
    <path d="M-40 0 C-40 -36 -24 -52 0 -54 C24 -52 40 -36 40 0 Z"/>
    <rect x="-9" y="-68" width="18" height="18" rx="4"/>
    <ellipse cx="0" cy="-88" rx="19" ry="22"/>
    <path d="M16 -94 L25 -84 L17 -80 Z"/>
    <path d="M-18 -98 C-16 -114 10 -116 16 -100 C6 -108 -8 -106 -18 -98 Z"/>
  </g>`;
}

// En person rakt framifrån, som i kameran.
export function front(x, y, scale, fill) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${fill}">
    <path d="M-120 0 C-120 -70 -78 -112 0 -118 C78 -112 120 -70 120 0 Z"/>
    <rect x="-26" y="-150" width="52" height="44" rx="12"/>
    <ellipse cx="0" cy="-210" rx="62" ry="76"/>
  </g>`;
}

const glow = (id, color, opacity = 0.6) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

// Nyckeln: kök sent på kvällen, fönster mot staden, en lampa och två personer.
export function kitchen(p) {
  const g = uid('k');
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.wall1}"/><stop offset="1" stop-color="${p.wall2}"/></linearGradient>
    <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient>
    ${glow(`${g}l`, p.light, 0.75)}
  </defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="148" y="28" width="104" height="96" rx="3" fill="url(#${g}s)"/>
  <circle cx="226" cy="50" r="9" fill="${p.moon}"/>
  ${[160, 172, 184, 196, 208, 220, 232].map((x, i) => `<rect x="${x}" y="${96 - (i % 3) * 10}" width="8" height="${28 + (i % 3) * 10}" fill="${p.city}"/>`).join('')}
  ${[163, 175, 187, 199, 211, 223, 235].map((x, i) => `<rect x="${x}" y="${104 - (i % 3) * 8}" width="2" height="2" fill="${p.light}" opacity=".9"/>`).join('')}
  <path d="M148 76 H252 M200 28 V124" stroke="${p.frame}" stroke-width="3"/>
  <rect x="148" y="28" width="104" height="96" rx="3" fill="none" stroke="${p.frame}" stroke-width="5"/>
  <circle cx="200" cy="58" r="120" fill="url(#${g}l)"/>
  <path d="M200 0 V40" stroke="${p.frame}" stroke-width="2"/>
  <path d="M184 52 L190 40 H210 L216 52 Z" fill="${p.lamp}"/>
  <rect x="0" y="196" width="400" height="44" fill="${p.table}"/>
  <path d="M190 192 a5 5 0 1 1 10 0 a5 5 0 1 1 -10 0 M200 192 h14 v4 h-3 v3 h-3 v-3 h-8" fill="none" stroke="${p.key}" stroke-width="2.5"/>
  ${profile(98, 240, 1.05, 1, p.person)}
  ${profile(306, 240, 1.05, -1, p.person)}
</svg>`;
}

// Intervjun: kafé på dagen, disk och kaffemaskin.
export function cafe(p) {
  const g = uid('c');
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${g}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.wall1}"/><stop offset="1" stop-color="${p.wall2}"/></linearGradient>
    ${glow(`${g}l`, p.light, 0.55)}
  </defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="20" y="20" width="150" height="120" rx="4" fill="${p.sky1}" opacity=".9"/>
  <path d="M20 80 H170 M95 20 V140" stroke="${p.frame}" stroke-width="4"/>
  <circle cx="95" cy="70" r="140" fill="url(#${g}l)"/>
  <rect x="236" y="70" width="70" height="56" rx="8" fill="${p.machine}"/>
  <rect x="248" y="82" width="46" height="10" rx="3" fill="${p.light}" opacity=".7"/>
  <path d="M262 126 v10 M280 126 v10" stroke="${p.machine}" stroke-width="5"/>
  <path d="M266 58 c-6 -10 6 -14 0 -24 M282 58 c-6 -10 6 -14 0 -24" stroke="${p.steam}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="0" y="150" width="400" height="10" fill="${p.frame}"/>
  <rect x="0" y="160" width="400" height="80" fill="${p.table}"/>
  <rect x="186" y="176" width="16" height="14" rx="3" fill="${p.cup}"/>
  <rect x="212" y="176" width="16" height="14" rx="3" fill="${p.cup}"/>
  ${profile(104, 240, 1.0, 1, p.person)}
  ${profile(300, 240, 1.0, -1, p.person)}
</svg>`;
}

// Beskedet: dukat bord med tårta och ljus.
export function dinner(p) {
  const g = uid('d');
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.wall1}"/><stop offset="1" stop-color="${p.wall2}"/></linearGradient>
    ${glow(`${g}l`, p.light, 0.7)}
  </defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <path d="M0 26 Q50 46 100 26 T200 26 T300 26 T400 26" stroke="${p.frame}" stroke-width="2" fill="none"/>
  ${[30, 70, 130, 170, 230, 270, 330, 370].map((x, i) => `<path d="M${x} ${32 + (i % 2) * 2} l8 14 l8 -14 Z" fill="${i % 2 ? p.light : p.key}" opacity=".85"/>`).join('')}
  <circle cx="200" cy="150" r="110" fill="url(#${g}l)"/>
  <rect x="0" y="186" width="400" height="54" fill="${p.table}"/>
  <rect x="166" y="154" width="68" height="34" rx="6" fill="${p.cup}"/>
  <rect x="166" y="154" width="68" height="9" rx="4" fill="${p.light}" opacity=".6"/>
  ${[180, 194, 208, 222].map((x) => `<rect x="${x - 1}" y="138" width="3" height="16" fill="${p.frame}"/><ellipse cx="${x}" cy="134" rx="3" ry="5" fill="${p.light}"/>`).join('')}
  ${profile(92, 240, 1.0, 1, p.person)}
  ${profile(312, 240, 1.0, -1, p.person)}
</svg>`;
}

// Samtalet klockan tre: mörkt rum, en mobil lyser upp ett ansikte.
export function phone(p) {
  const g = uid('p');
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.dark1}"/><stop offset="1" stop-color="${p.dark2}"/></linearGradient>
    ${glow(`${g}l`, p.screen, 0.8)}
  </defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="290" y="34" width="78" height="30" rx="6" fill="${p.dark1}" stroke="${p.screen}" stroke-opacity=".4"/>
  <text x="329" y="56" text-anchor="middle" font-family="monospace" font-size="18" fill="${p.screen}" opacity=".9">03:00</text>
  <circle cx="232" cy="160" r="110" fill="url(#${g}l)"/>
  ${profile(196, 240, 1.25, 1, p.person)}
  <rect x="226" y="146" width="14" height="24" rx="3" fill="${p.screen}" transform="rotate(-12 233 158)"/>
</svg>`;
}

// Sista tåget: perron på natten, tågfönster som lyser.
export function train(p) {
  const g = uid('t');
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient>
    ${glow(`${g}l`, p.light, 0.6)}
  </defs>
  <rect width="400" height="240" fill="url(#${g}s)"/>
  <rect x="0" y="92" width="400" height="88" fill="${p.train}"/>
  ${[14, 84, 154, 224, 294, 364].map((x) => `<rect x="${x}" y="108" width="52" height="34" rx="4" fill="${p.light}" opacity=".85"/>`).join('')}
  <circle cx="200" cy="130" r="150" fill="url(#${g}l)"/>
  <rect x="0" y="180" width="400" height="60" fill="${p.platform}"/>
  <path d="M0 184 H400" stroke="${p.light}" stroke-width="3" stroke-dasharray="14 10" opacity=".7"/>
  <circle cx="330" cy="40" r="16" fill="${p.wall1}" stroke="${p.light}" stroke-width="2"/>
  <path d="M330 30 V40 L337 44" stroke="${p.light}" stroke-width="2" fill="none"/>
  ${[40, 120, 250, 360, 80, 300].map((x, i) => `<circle cx="${x}" cy="${20 + i * 11}" r="1.6" fill="#fff" opacity=".7"/>`).join('')}
  ${profile(172, 240, 1.0, 1, p.person)}
  ${profile(234, 240, 1.0, -1, p.person)}
</svg>`;
}

// Kameran i scenen: en person rakt framifrån med ljus från sidan.
export function camera(p) {
  const g = uid('cam');
  return `<svg viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>
    <radialGradient id="${g}k" cx=".22" cy=".38" r=".7"><stop offset="0" stop-color="${p.key}" stop-opacity=".55"/><stop offset="1" stop-color="${p.key}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${g}r" cx=".82" cy=".45" r=".5"><stop offset="0" stop-color="${p.rim}" stop-opacity=".45"/><stop offset="1" stop-color="${p.rim}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${g}f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.faceLit}"/><stop offset=".55" stop-color="${p.face}"/><stop offset="1" stop-color="${p.faceDark}"/></linearGradient>
  </defs>
  <rect width="390" height="844" fill="url(#${g}b)"/>
  <rect width="390" height="844" fill="url(#${g}k)"/>
  <rect width="390" height="844" fill="url(#${g}r)"/>
  ${front(195, 844, 1.55, `url(#${g}f)`)}
</svg>`;
}

// ---- Nivå 2–5 ----

const svgOpen = '<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">';
const vgrad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
// Stjärnor på fasta platser, så att bilden blir likadan varje gång.
const stars = (count, color, maxY = 140) => Array.from({ length: count }, (_, i) =>
  `<circle cx="${(i * 97 + 23) % 400}" cy="${(i * 53 + 11) % maxY}" r="${i % 3 ? 1.1 : 1.8}" fill="${color}" opacity="${i % 2 ? 0.5 : 0.85}"/>`).join('');
// En taklampa som hänger i en sladd.
const hangingLamp = (x, y, p) => `<path d="M${x} 0 V${y - 12}" stroke="${p.frame}" stroke-width="2"/><path d="M${x - 14} ${y} L${x - 8} ${y - 12} H${x + 8} L${x + 14} ${y} Z" fill="${p.lamp}"/>`;

// Förhöret: ett förhörsrum med en lampa över bordet och en spegelvägg.
export function interrogation(p) {
  const g = uid('i');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.dark1, p.dark2)}${vgrad(`${g}c`, p.light, p.dark2)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="248" y="36" width="124" height="74" fill="${p.sky1}" opacity=".55" stroke="${p.frame}" stroke-width="5"/>
  <path d="M266 46 L300 100 M296 46 L330 100" stroke="${p.screen}" stroke-opacity=".14" stroke-width="7"/>
  ${hangingLamp(200, 58, p)}
  <path d="M188 58 L116 196 H284 L212 58 Z" fill="url(#${g}c)" opacity=".5"/>
  <rect x="104" y="190" width="192" height="10" fill="${p.table}"/>
  <rect x="180" y="180" width="34" height="10" rx="1" fill="${p.moon}" opacity=".8"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.dark2}"/>
  ${profile(96, 240, 1.05, 1, p.person)}
  ${profile(306, 240, 1.05, -1, p.person)}
</svg>`;
}

// Huset vid sjön: ett mörkt rum, en igenspikad källardörr och en lykta.
export function cabin(p) {
  const g = uid('h');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.dark2)}${glow(`${g}l`, p.light, 0.7)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${i * 52} 0 V200" stroke="${p.frame}" stroke-width="2" opacity=".6"/>`).join('')}
  <rect x="164" y="56" width="72" height="144" fill="${p.dark2}" stroke="${p.frame}" stroke-width="5"/>
  <rect x="152" y="96" width="96" height="10" fill="${p.lamp}" transform="rotate(-14 200 101)"/>
  <rect x="152" y="146" width="96" height="10" fill="${p.lamp}" transform="rotate(12 200 151)"/>
  ${[[168, 92], [228, 108], [168, 158], [228, 142]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${p.moon}"/>`).join('')}
  <circle cx="300" cy="150" r="120" fill="url(#${g}l)"/>
  <rect x="294" y="150" width="14" height="20" rx="3" fill="${p.light}"/>
  <path d="M296 150 Q301 140 306 150" stroke="${p.frame}" stroke-width="2" fill="none"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(92, 240, 1.0, 1, p.person)}
  ${profile(352, 240, 0.95, -1, p.person)}
</svg>`;
}

// Kuppen: ett parkeringshus, en bil med tända lyktor och en väska.
export function garage(p) {
  const g = uid('g');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.train, p.dark2)}${glow(`${g}l`, p.light, 0.55)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="0" y="0" width="400" height="22" fill="${p.dark2}"/>
  ${[60, 200, 340].map((x) => `<rect x="${x - 12}" y="22" width="24" height="178" fill="${p.dark1}"/><rect x="${x - 12}" y="120" width="24" height="10" fill="${p.light}" opacity=".7"/>`).join('')}
  <path d="M120 186 Q126 150 160 146 L246 146 Q272 148 282 186 Z" fill="${p.machine}"/>
  <circle cx="286" cy="176" r="70" fill="url(#${g}l)"/>
  <circle cx="276" cy="176" r="5" fill="${p.moon}"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.platform}"/>
  <path d="M0 214 H400" stroke="${p.light}" stroke-width="2" stroke-dasharray="20 14" opacity=".5"/>
  <rect x="186" y="188" width="34" height="18" rx="4" fill="${p.cup}"/>
  <path d="M194 188 Q203 178 212 188" stroke="${p.cup}" stroke-width="3" fill="none"/>
  ${profile(104, 240, 1.0, 1, p.person)}
  ${profile(318, 240, 1.0, -1, p.person)}
</svg>`;
}

// Förhandlaren: en glasdörr in till ett serverrum med blinkande lampor.
export function glassdoor(p) {
  const g = uid('s');
  const leds = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) leds.push(`<circle cx="${236 + c * 30}" cy="${52 + r * 22}" r="2.2" fill="${(r + c) % 3 ? p.screen : p.light}" opacity=".85"/>`);
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${glow(`${g}l`, p.screen, 0.45)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="210" y="26" width="160" height="174" fill="${p.dark1}"/>
  ${[226, 256, 286, 316].map((x) => `<rect x="${x}" y="40" width="22" height="150" fill="${p.machine}"/>`).join('')}
  ${leds.join('')}
  <circle cx="290" cy="110" r="110" fill="url(#${g}l)"/>
  <rect x="210" y="26" width="160" height="174" fill="${p.sky2}" opacity=".18" stroke="${p.frame}" stroke-width="6"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(110, 240, 1.05, 1, p.person)}
  ${profile(300, 240, 0.9, -1, p.person, 'opacity=".85"')}
</svg>`;
}

// Alibit: gryning vid ett hus, en bil på uppfarten och en tänd lampa vid dörren.
export function carnight(p) {
  const g = uid('a');
  return `${svgOpen}
  <defs>${vgrad(`${g}s`, p.sky1, p.light)}${glow(`${g}l`, p.light, 0.6)}</defs>
  <rect width="400" height="240" fill="url(#${g}s)"/>
  <rect x="0" y="150" width="400" height="90" fill="${p.wall2}"/>
  <path d="M220 150 V70 L290 30 L360 70 V150 Z" fill="${p.wall1}"/>
  <rect x="270" y="96" width="34" height="54" fill="${p.dark2}"/>
  <circle cx="314" cy="104" r="40" fill="url(#${g}l)"/>
  <circle cx="314" cy="104" r="4" fill="${p.light}"/>
  <path d="M30 196 Q36 160 74 156 L150 156 Q176 158 186 196 Z" fill="${p.machine}"/>
  <path d="M168 170 l8 6 l-6 5" stroke="${p.moon}" stroke-width="2" fill="none" opacity=".8"/>
  ${profile(118, 240, 0.95, 1, p.person)}
  ${profile(214, 240, 0.95, -1, p.person)}
</svg>`;
}

// Brevet: ett tält på ett fältsjukhus, en lykta och en brits.
export function fieldtent(p) {
  const g = uid('f');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.cup, p.wall2)}${glow(`${g}l`, p.light, 0.75)}</defs>
  <rect width="400" height="240" fill="${p.wall2}"/>
  <path d="M0 200 L200 10 L400 200 Z" fill="url(#${g}w)"/>
  <path d="M200 10 V200 M100 105 L200 200 M300 105 L200 200" stroke="${p.frame}" stroke-width="2" opacity=".5"/>
  ${hangingLamp(200, 70, p)}
  <circle cx="200" cy="80" r="120" fill="url(#${g}l)"/>
  <rect x="40" y="172" width="170" height="12" rx="3" fill="${p.lamp}"/>
  <path d="M50 184 V200 M200 184 V200" stroke="${p.frame}" stroke-width="4"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  <rect x="236" y="182" width="20" height="14" fill="${p.moon}" opacity=".9" transform="rotate(-8 246 189)"/>
  ${profile(120, 240, 1.0, 1, p.person)}
  ${profile(300, 240, 1.0, -1, p.person)}
</svg>`;
}

// Översvämningen: ett tak i vattnet och ljuset från en helikopter.
export function flood(p) {
  const g = uid('o');
  return `${svgOpen}
  <defs>${vgrad(`${g}s`, p.dark1, p.sky2)}${vgrad(`${g}b`, p.moon, p.sky2)}</defs>
  <rect width="400" height="240" fill="url(#${g}s)"/>
  ${stars(10, p.moon, 60)}
  <path d="M300 0 L190 200 H360 L320 0 Z" fill="url(#${g}b)" opacity=".35"/>
  <rect x="296" y="4" width="34" height="10" rx="4" fill="${p.machine}"/>
  <path d="M276 4 H350" stroke="${p.machine}" stroke-width="3"/>
  <path d="M60 196 L150 140 L240 196 Z" fill="${p.wall1}"/>
  <rect x="0" y="196" width="400" height="44" fill="${p.water}"/>
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${i * 60 - 10} ${206 + (i % 2) * 10} q15 -6 30 0 t30 0" stroke="${p.wave}" stroke-width="3" fill="none"/>`).join('')}
  <path d="M300 4 V100" stroke="${p.moon}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/>
  ${profile(120, 214, 0.75, 1, p.person)}
  ${profile(184, 214, 0.75, -1, p.person)}
</svg>`;
}

// Bröllopet: en båge med blommor och stolar i rader.
export function wedding(p) {
  const g = uid('b');
  const flowers = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI * (i / 12);
    return `<circle cx="${(200 - 92 * Math.cos(a)).toFixed(1)}" cy="${(150 - 104 * Math.sin(a)).toFixed(1)}" r="${i % 2 ? 6 : 8}" fill="${i % 3 ? p.moon : p.light}" opacity=".9"/>`;
  }).join('');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${glow(`${g}l`, p.light, 0.6)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <circle cx="200" cy="110" r="140" fill="url(#${g}l)"/>
  <path d="M108 200 V150 A92 104 0 0 1 292 150 V200" stroke="${p.frame}" stroke-width="6" fill="none"/>
  ${flowers}
  ${[30, 70, 330, 370].map((x) => `<rect x="${x - 12}" y="168" width="24" height="6" fill="${p.lamp}"/><path d="M${x - 10} 174 V200 M${x + 10} 174 V200 M${x - 12} 168 V146" stroke="${p.lamp}" stroke-width="3"/>`).join('')}
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(160, 240, 0.95, 1, p.person)}
  ${profile(244, 240, 0.95, -1, p.person)}
</svg>`;
}

// Delägaren: en stängd restaurang med stolarna uppe på borden.
export function restaurant(p) {
  const g = uid('r');
  const tables = [70, 200, 330].map((x) => `<rect x="${x - 40}" y="150" width="80" height="6" fill="${p.lamp}"/>
    <path d="M${x - 34} 156 V200 M${x + 34} 156 V200" stroke="${p.lamp}" stroke-width="4"/>
    <path d="M${x - 30} 150 V122 H${x - 6} V150 M${x + 6} 150 V122 H${x + 30} V150" stroke="${p.frame}" stroke-width="3" fill="none"/>`).join('');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${glow(`${g}l`, p.light, 0.5)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  ${[110, 290].map((x) => `${hangingLamp(x, 48, p)}<circle cx="${x}" cy="56" r="70" fill="url(#${g}l)"/>`).join('')}
  <path d="M188 40 H212 L205 60 Q200 66 195 60 Z M200 64 V80 M190 80 H210" stroke="${p.light}" stroke-opacity=".4" stroke-width="2.5" fill="none"/>
  ${tables}
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(116, 240, 1.0, 1, p.person)}
  ${profile(290, 240, 1.0, -1, p.person)}
</svg>`;
}

// Vittnet: en rättssal med domarbord och träpaneler.
export function courtroom(p) {
  const g = uid('d');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.cup, p.wall2)}${glow(`${g}l`, p.light, 0.45)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${i * 50 + 6}" y="20" width="38" height="90" rx="2" fill="none" stroke="${p.frame}" stroke-width="2" opacity=".55"/>`).join('')}
  <circle cx="200" cy="60" r="110" fill="url(#${g}l)"/>
  <rect x="110" y="110" width="180" height="56" fill="${p.lamp}"/>
  <rect x="104" y="104" width="192" height="10" fill="${p.frame}"/>
  <path d="M200 40 V78 M178 50 H222 M178 50 L170 66 H186 Z M222 50 L214 66 H230 Z" stroke="${p.gold}" stroke-width="2.5" fill="none"/>
  <rect x="0" y="166" width="400" height="74" fill="${p.table}"/>
  ${profile(84, 240, 1.0, 1, p.person)}
  ${profile(318, 240, 1.0, -1, p.person)}
</svg>`;
}

// Skeppets röst: bryggan på ett rymdskepp, en planet i fönstret och AI:ns lysande öga.
export function spaceship(p) {
  const g = uid('rs');
  return `${svgOpen}
  <defs>${vgrad(`${g}s`, p.space1, p.space2)}${glow(`${g}e`, p.screen, 0.5)}${glow(`${g}p`, p.planet, 0.5)}</defs>
  <rect width="400" height="240" fill="${p.dark2}"/>
  <path d="M30 20 H370 L340 150 H60 Z" fill="url(#${g}s)"/>
  ${stars(26, p.moon, 140)}
  <circle cx="110" cy="128" r="70" fill="url(#${g}p)"/>
  <circle cx="110" cy="128" r="34" fill="${p.planet}" opacity=".85"/>
  <path d="M30 20 H370 L340 150 H60 Z" fill="none" stroke="${p.machine}" stroke-width="8"/>
  <rect x="0" y="150" width="400" height="90" fill="${p.machine}"/>
  ${[90, 130, 170, 230, 270, 310].map((x, i) => `<rect x="${x}" y="166" width="22" height="6" rx="2" fill="${i % 2 ? p.screen : p.light}" opacity=".8"/>`).join('')}
  <circle cx="300" cy="88" r="44" fill="url(#${g}e)"/>
  ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 2 * Math.PI; const r1 = 14; const r2 = 14 + (i % 4 === 0 ? 14 : i % 2 ? 6 : 10); return `<path d="M${(300 + r1 * Math.cos(a)).toFixed(1)} ${(88 + r1 * Math.sin(a)).toFixed(1)} L${(300 + r2 * Math.cos(a)).toFixed(1)} ${(88 + r2 * Math.sin(a)).toFixed(1)}" stroke="${p.screen}" stroke-width="3" stroke-linecap="round"/>`; }).join('')}
  ${profile(150, 240, 1.1, 1, p.person)}
</svg>`;
}

// Första kontakten: ett stort skepp över en åker, ljus ned mot marken.
export function contact(p) {
  const g = uid('fk');
  return `${svgOpen}
  <defs>${vgrad(`${g}s`, p.space1, p.sky2)}${vgrad(`${g}b`, p.alien, p.field)}</defs>
  <rect width="400" height="240" fill="url(#${g}s)"/>
  ${stars(22, p.moon, 70)}
  <path d="M170 64 L120 196 H280 L230 64 Z" fill="url(#${g}b)" opacity=".4"/>
  <ellipse cx="200" cy="56" rx="150" ry="22" fill="${p.machine}"/>
  <ellipse cx="200" cy="48" rx="70" ry="16" fill="${p.train}"/>
  ${[80, 120, 160, 200, 240, 280, 320].map((x) => `<circle cx="${x}" cy="62" r="3" fill="${p.alien}"/>`).join('')}
  <rect x="0" y="196" width="400" height="44" fill="${p.field}"/>
  ${profile(124, 240, 0.95, 1, p.person)}
  <g transform="translate(268 240) scale(-1.05 1.25)" fill="${p.person}">
    <path d="M-30 0 C-30 -40 -18 -54 0 -56 C18 -54 30 -40 30 0 Z"/>
    <rect x="-6" y="-74" width="12" height="20" rx="4"/>
    <ellipse cx="0" cy="-96" rx="15" ry="26"/>
  </g>
  <circle cx="262" cy="125" r="3" fill="${p.alien}"/>
</svg>`;
}

// Draken: en grotta, ett jättelikt huvud med ett glödande öga och guld som glimmar.
export function dragon(p) {
  const g = uid('dr');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.stone, p.dark2)}${glow(`${g}e`, p.light, 0.9)}${glow(`${g}m`, p.sky2, 0.6)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <path d="M0 0 H130 Q90 60 110 120 Q70 180 0 190 Z" fill="${p.dark2}"/>
  <circle cx="40" cy="70" r="80" fill="url(#${g}m)"/>
  <path d="M400 30 C320 30 250 70 230 120 C214 160 250 190 300 182 C340 176 360 150 400 150 Z" fill="${p.dark1}"/>
  <path d="M238 120 L214 128 L240 136 Z" fill="${p.dark1}"/>
  <path d="M330 52 L362 10 L356 60 Z M300 58 L316 18 L322 64 Z" fill="${p.dark1}"/>
  <circle cx="300" cy="104" r="40" fill="url(#${g}e)"/>
  <ellipse cx="300" cy="104" rx="11" ry="7" fill="${p.light}"/>
  <ellipse cx="300" cy="104" rx="2.5" ry="6" fill="${p.dark2}"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.stone}"/>
  ${[150, 168, 184, 330, 350].map((x, i) => `<circle cx="${x}" cy="${204 + (i % 2) * 4}" r="${3 + (i % 3)}" fill="${p.gold}" opacity=".85"/>`).join('')}
  ${profile(96, 240, 0.95, 1, p.person)}
</svg>`;
}

// Tidsresenären: ett kafé med en stor klocka och ljusstrimmor genom fönstret.
export function timetravel(p) {
  const g = uid('tr');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${glow(`${g}l`, p.screen, 0.5)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="24" y="24" width="190" height="120" fill="${p.sky1}" opacity=".9"/>
  ${[0, 1, 2, 3].map((i) => `<path d="M${10 + i * 50} ${120 - i * 12} L${120 + i * 50} ${40 - i * 6}" stroke="${i % 2 ? p.screen : p.light}" stroke-width="3" opacity=".55" stroke-linecap="round"/>`).join('')}
  <path d="M24 84 H214 M119 24 V144" stroke="${p.frame}" stroke-width="4"/>
  <circle cx="300" cy="74" r="44" fill="${p.wall2}" stroke="${p.gold}" stroke-width="4"/>
  <circle cx="300" cy="74" r="90" fill="url(#${g}l)"/>
  ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 2 * Math.PI; return `<circle cx="${(300 + 34 * Math.sin(a)).toFixed(1)}" cy="${(74 - 34 * Math.cos(a)).toFixed(1)}" r="2" fill="${p.gold}"/>`; }).join('')}
  <path d="M300 74 V48 M300 74 L318 84" stroke="${p.moon}" stroke-width="3" stroke-linecap="round"/>
  <rect x="0" y="160" width="400" height="80" fill="${p.table}"/>
  <rect x="190" y="148" width="16" height="12" rx="3" fill="${p.cup}"/>
  ${profile(110, 240, 1.0, 1, p.person)}
  ${profile(296, 240, 1.0, -1, p.person)}
</svg>`;
}

// Kröningen: en tronsal med tron, fanor och ljus.
export function throne(p) {
  const g = uid('k');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.stone, p.dark2)}${glow(`${g}l`, p.light, 0.6)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  ${[60, 340].map((x) => `<path d="M${x - 22} 10 H${x + 22} V110 L${x} 96 L${x - 22} 110 Z" fill="${p.fire}" opacity=".55"/>`).join('')}
  <circle cx="200" cy="120" r="130" fill="url(#${g}l)"/>
  <path d="M164 200 V96 L176 70 L188 92 L200 64 L212 92 L224 70 L236 96 V200 Z" fill="${p.machine}" stroke="${p.gold}" stroke-width="3"/>
  ${[120, 140, 260, 280].map((x) => `<rect x="${x - 3}" y="150" width="6" height="30" fill="${p.moon}"/><ellipse cx="${x}" cy="145" rx="3" ry="6" fill="${p.light}"/>`).join('')}
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(84, 240, 1.0, 1, p.person)}
  ${profile(318, 240, 1.0, -1, p.person)}
</svg>`;
}

// Ursprunget: en hall med en dörr som hänger snett och staden utanför fönstret.
export function citynight(p) {
  const g = uid('u');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${vgrad(`${g}s`, p.sky1, p.sky2)}${glow(`${g}l`, p.light, 0.55)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="230" y="30" width="140" height="110" fill="url(#${g}s)"/>
  ${[236, 252, 268, 284, 300, 316, 332, 348].map((x, i) => `<rect x="${x}" y="${80 - (i % 4) * 12}" width="14" height="${60 + (i % 4) * 12}" fill="${p.city}"/><rect x="${x + 4}" y="${88 - (i % 4) * 10}" width="3" height="3" fill="${p.light}" opacity=".9"/>`).join('')}
  <rect x="230" y="30" width="140" height="110" fill="none" stroke="${p.frame}" stroke-width="5"/>
  <rect x="60" y="40" width="80" height="160" fill="${p.dark2}"/>
  <rect x="64" y="44" width="76" height="156" fill="${p.lamp}" transform="rotate(9 64 44)"/>
  <circle cx="100" cy="40" r="70" fill="url(#${g}l)"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(150, 240, 1.0, 1, p.person)}
  ${profile(268, 240, 1.05, -1, p.person)}
</svg>`;
}

// Skurkens erbjudande: ett gömställe under staden med skärmar i en båge.
export function lair(p) {
  const g = uid('v');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.dark1, p.dark2)}${glow(`${g}l`, p.fire, 0.45)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <path d="M0 40 Q200 -10 400 40" stroke="${p.machine}" stroke-width="16" fill="none"/>
  ${[60, 130, 200, 270, 340].map((x, i) => `<rect x="${x - 28}" y="${50 + Math.abs(2 - i) * 8}" width="56" height="36" rx="3" fill="${i === 2 ? p.fire : p.screen}" opacity="${i === 2 ? 0.6 : 0.35}" stroke="${p.machine}" stroke-width="3"/>`).join('')}
  <circle cx="200" cy="70" r="120" fill="url(#${g}l)"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.platform}"/>
  <path d="M232 200 V150 H262 V120 M232 172 H262" stroke="${p.machine}" stroke-width="6" fill="none"/>
  ${profile(116, 240, 1.05, 1, p.person)}
  ${profile(300, 240, 1.0, -1, p.person)}
</svg>`;
}

// Den hemliga identiteten: en öppen garderob med en dräkt och en mantel.
export function closet(p) {
  const g = uid('c');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${glow(`${g}l`, p.light, 0.5)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="140" y="20" width="120" height="180" fill="${p.dark2}" stroke="${p.frame}" stroke-width="6"/>
  <path d="M140 20 L104 32 V188 L140 200 Z" fill="${p.lamp}"/>
  <path d="M146 44 H254" stroke="${p.moon}" stroke-width="3"/>
  <path d="M200 44 V54 M184 60 Q200 50 216 60" stroke="${p.moon}" stroke-width="2.5" fill="none"/>
  <path d="M176 62 Q200 56 224 62 L240 180 Q200 196 160 180 Z" fill="${p.fire}" opacity=".9"/>
  <path d="M186 64 H214 L218 132 H182 Z" fill="${p.machine}"/>
  <circle cx="200" cy="86" r="8" fill="none" stroke="${p.gold}" stroke-width="3.5"/>
  <circle cx="200" cy="100" r="120" fill="url(#${g}l)"/>
  <rect x="0" y="200" width="400" height="40" fill="${p.table}"/>
  ${profile(84, 240, 1.0, 1, p.person)}
  ${profile(322, 240, 1.0, -1, p.person)}
</svg>`;
}

// Sista striden: hjältarnas bas, en radio och en brinnande stad genom fönstret.
export function base(p) {
  const g = uid('sb');
  return `${svgOpen}
  <defs>${vgrad(`${g}s`, p.dark1, p.fire)}${vgrad(`${g}w`, p.wall2, p.dark2)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="40" y="24" width="320" height="120" fill="url(#${g}s)"/>
  ${[50, 76, 98, 130, 160, 186, 220, 250, 280, 312, 336].map((x, i) => `<rect x="${x}" y="${84 - (i % 4) * 14}" width="${18 + (i % 3) * 4}" height="${60 + (i % 4) * 14}" fill="${p.dark2}"/>`).join('')}
  ${[90, 210, 300].map((x) => `<path d="M${x} 70 c-8 -14 6 -18 0 -34 c10 10 14 22 6 34 Z" fill="${p.light}" opacity=".7"/>`).join('')}
  <path d="M40 24 H360 V144 H40 Z M200 24 V144" fill="none" stroke="${p.machine}" stroke-width="6"/>
  <rect x="0" y="160" width="400" height="80" fill="${p.machine}"/>
  <rect x="170" y="166" width="60" height="22" rx="3" fill="${p.train}"/>
  ${[180, 192, 204, 216].map((x, i) => `<circle cx="${x}" cy="177" r="2.5" fill="${i % 2 ? p.screen : p.light}"/>`).join('')}
  <path d="M222 166 V146" stroke="${p.moon}" stroke-width="2"/>
  ${profile(100, 240, 1.05, 1, p.person)}
  ${profile(306, 240, 1.05, -1, p.person)}
</svg>`;
}

// När en skurk föds: borgmästarens kontor på natten, en flagga, ett skrivbord och en väska.
export function cityhall(p) {
  const g = uid('n');
  return `${svgOpen}
  <defs>${vgrad(`${g}w`, p.wall1, p.wall2)}${vgrad(`${g}s`, p.sky1, p.sky2)}${glow(`${g}l`, p.light, 0.55)}</defs>
  <rect width="400" height="240" fill="url(#${g}w)"/>
  <rect x="150" y="24" width="100" height="110" fill="url(#${g}s)"/>
  <path d="M150 79 H250 M200 24 V134" stroke="${p.frame}" stroke-width="4"/>
  <rect x="150" y="24" width="100" height="110" fill="none" stroke="${p.frame}" stroke-width="5"/>
  <path d="M300 30 V170" stroke="${p.gold}" stroke-width="3"/>
  <path d="M302 34 H344 V82 L323 70 L302 82 Z" fill="${p.fire}" opacity=".75"/>
  <circle cx="323" cy="52" r="8" fill="none" stroke="${p.gold}" stroke-width="3"/>
  <circle cx="110" cy="120" r="60" fill="url(#${g}l)"/>
  ${hangingLamp(110, 112, p)}
  <rect x="60" y="150" width="280" height="12" fill="${p.lamp}"/>
  <rect x="0" y="162" width="400" height="78" fill="${p.table}"/>
  <rect x="186" y="128" width="42" height="24" rx="4" fill="${p.cup}"/>
  <path d="M198 128 Q207 118 216 128" stroke="${p.cup}" stroke-width="3" fill="none"/>
  ${profile(96, 240, 1.0, 1, p.person)}
  ${profile(310, 240, 1.0, -1, p.person)}
</svg>`;
}

export const ART = {
  kitchen, cafe, dinner, phone, train,
  interrogation, cabin, garage, glassdoor, carnight,
  fieldtent, flood, wedding, restaurant, courtroom,
  spaceship, contact, dragon, timetravel, throne,
  citynight, lair, closet, base, cityhall
};
