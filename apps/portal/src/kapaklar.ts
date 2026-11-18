/* Henüz yayında olmayan iki kursun kapakları: satır içi SVG (dosya yok, internetsiz çalışır). */
const NS = "http://www.w3.org/2000/svg";
const svg = (ic: string, etiket: string): SVGSVGElement => {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 800 500");
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", etiket);
  s.setAttribute("preserveAspectRatio", "xMidYMid slice");
  s.innerHTML = ic;
  return s;
};

/* Scratch benzeri blok: üstte girinti, altta çıkıntı */
function blok(x: number, y: number, g: number, renk: string, yazi: string, koyu: string): string {
  const h = 52;
  const yol = `M${x + 10} ${y}H${x + 28}l8 8h22l8-8H${x + g - 10}q10 0 10 10v${h - 20}q0 10-10 10H${x + 66}l-8 8H${x + 36}l-8-8H${x + 10}q-10 0-10-10v-${h - 20}q0-10 10-10Z`;
  return `<path d="${yol}" fill="${renk}" stroke="${koyu}" stroke-width="2"/>` +
    `<text x="${x + 20}" y="${y + 33}" font-family="Lexend, sans-serif" font-weight="700" font-size="20" fill="#fff">${yazi}</text>`;
}

export function blokKapagi(): SVGSVGElement {
  const izgara = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => {
    const yol = (r === 3 && c <= 3) || (c === 3 && r >= 1 && r <= 3);
    return `<rect x="${470 + c * 56}" y="${110 + r * 56}" width="50" height="50" rx="10" fill="${yol ? "#ffd27a" : "#fff"}" stroke="#f1d9a8" stroke-width="2"/>`;
  }).join("")).join("");
  const ic = `
    <defs><pattern id="bk-nokta" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#f3d9a6"/></pattern></defs>
    <rect width="800" height="500" fill="#fff4dd"/><rect width="800" height="500" fill="url(#bk-nokta)"/>
    ${blok(70, 92, 210, "#f0a020", "başla", "#c98210")}
    ${blok(70, 152, 270, "#3a8ff0", "ileri git 3", "#2a6fc4")}
    ${blok(70, 212, 250, "#7a5cf0", "sağa dön", "#5b3fd0")}
    ${blok(70, 272, 270, "#f0a020", "tekrarla 2", "#c98210")}
    ${blok(100, 332, 250, "#22a6a0", "ileri git 2", "#178680")}
    <rect x="70" y="332" width="30" height="64" rx="6" fill="#f0a020" stroke="#c98210" stroke-width="2"/>
    <rect x="70" y="392" width="130" height="24" rx="10" fill="#f0a020" stroke="#c98210" stroke-width="2"/>
    ${izgara}
    <path d="M498 306H666V138" fill="none" stroke="#f0a020" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>
    <g transform="translate(468 278)">
      <rect x="6" y="2" width="48" height="44" rx="14" fill="#22a6a0" stroke="#178680" stroke-width="3"/>
      <rect x="14" y="12" width="32" height="22" rx="8" fill="#e8fffd"/>
      <circle cx="24" cy="23" r="4" fill="#14303a"/><circle cx="36" cy="23" r="4" fill="#14303a"/>
      <line x1="30" y1="2" x2="30" y2="-8" stroke="#178680" stroke-width="3"/><circle cx="30" cy="-10" r="5" fill="#d7262e"/>
    </g>
    <g transform="translate(652 108)"><path d="M14 0l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#f0a020"/></g>
    <g fill="#3a8ff0" opacity=".9"><circle cx="700" cy="420" r="8"/><circle cx="730" cy="440" r="5"/></g>`;
  return svg(ic, "Sürükle-bırak bloklarla ızgarada yürüyen robot");
}

export function labKapagi(): SVGSVGElement {
  const evler = [
    [70, 60, "#c9d4f2"], [230, 60, "#f2c9c9"], [550, 60, "#c9e8e2"], [70, 290, "#f2e2c4"], [550, 300, "#d6cdf2"], [700, 160, "#c9d4f2"]
  ].map(([x, y, r]) => `<g transform="translate(${x} ${y})"><rect width="120" height="100" rx="14" fill="${r}"/><rect width="120" height="34" rx="14" fill="#fff" opacity=".85"/><rect x="18" y="52" width="26" height="26" rx="5" fill="#fff" opacity=".7"/><rect x="72" y="52" width="26" height="26" rx="5" fill="#fff" opacity=".7"/></g>`).join("");
  const kar = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 137) % 800, y = (i * 89) % 500, r = 1.5 + (i % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.55 + (i % 4) * 0.1}"/>`;
  }).join("");
  const ic = `
    <rect width="800" height="500" fill="#e9eefc"/>
    <path d="M0 220H800V280H0Z M380 0H440V500H380Z" fill="#f7f9ff"/>
    <path d="M0 220H800M0 280H800M380 0V500M440 0V500" stroke="#d5ddf3" stroke-width="3"/>
    ${evler}
    <path d="M40 250H380" stroke="#8b97b8" stroke-width="44" stroke-linecap="round" opacity=".55"/>
    <path d="M40 250H380" stroke="#fff" stroke-width="3" stroke-dasharray="16 14" opacity=".8"/>
    <path d="M410 250V130" stroke="#8b97b8" stroke-width="44" stroke-linecap="round" opacity=".18"/>
    <g transform="translate(410 250)">
      <path d="M26 -10L140 -60V60L26 10Z" fill="#3a62e0" opacity=".14"/>
      <path d="M26 -10L140 -60M26 10L140 60" stroke="#3a62e0" stroke-width="1.5" stroke-dasharray="4 5" opacity=".6"/>
      <rect x="-34" y="-30" width="58" height="60" rx="16" fill="#3a62e0" stroke="#2747b0" stroke-width="3"/>
      <rect x="22" y="-36" width="12" height="72" rx="5" fill="#ffc21a" stroke="#d29a00" stroke-width="2.5"/>
      <rect x="-24" y="-40" width="28" height="12" rx="4" fill="#26324f"/><rect x="-24" y="28" width="28" height="12" rx="4" fill="#26324f"/>
      <circle cx="-6" cy="0" r="11" fill="#e9eefc"/><circle cx="-6" cy="0" r="5" fill="#d7262e"/>
    </g>
    <g transform="translate(620 400)"><rect width="150" height="60" rx="14" fill="#fff" stroke="#d5ddf3" stroke-width="2"/>
      <rect x="16" y="16" width="70" height="10" rx="5" fill="#d5ddf3"/><rect x="16" y="16" width="48" height="10" rx="5" fill="#2bb673"/>
      <rect x="16" y="36" width="100" height="8" rx="4" fill="#e9eefc"/><text x="100" y="26" font-family="Lexend, sans-serif" font-weight="700" font-size="13" fill="#26324f">%68</text></g>
    ${kar}`;
  return svg(ic, "Karlı mahallede yol açan kar küreme robotu");
}
