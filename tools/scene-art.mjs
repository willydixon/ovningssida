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

export const ART = { kitchen, cafe, dinner, phone, train };
