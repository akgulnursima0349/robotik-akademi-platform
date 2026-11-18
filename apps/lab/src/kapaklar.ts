/* Etkinlik kapakları: satır içi SVG. Sahnedeki çizimlerle aynı stil (pastel binalar, karlı çatılar, mavi robot). */
const NS = "http://www.w3.org/2000/svg";
const svg = (ic: string, etiket: string) => {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 800 500"); s.setAttribute("role", "img"); s.setAttribute("aria-label", etiket);
  s.setAttribute("preserveAspectRatio", "xMidYMid slice");
  s.innerHTML = ic;
  return s;
};
/* izometrik yardımcılar (sahneyle aynı oran) */
const W = 76, H = 38, OX = 400, OY = 120;
const p = (x: number, y: number, z = 0) => `${OX + ((x - y) * W) / 2},${OY + ((x + y) * H) / 2 - z}`;
const kare = (x: number, y: number, renk: string) => `<polygon points="${p(x, y)} ${p(x + 1, y)} ${p(x + 1, y + 1)} ${p(x, y + 1)}" fill="${renk}"/>`;
const kutu = (x: number, y: number, h: number, renk: string, yan1: string, yan2: string) =>
  `<polygon points="${p(x, y + 1)} ${p(x + 1, y + 1)} ${p(x + 1, y + 1, h)} ${p(x, y + 1, h)}" fill="${yan1}"/>` +
  `<polygon points="${p(x + 1, y)} ${p(x + 1, y + 1)} ${p(x + 1, y + 1, h)} ${p(x + 1, y, h)}" fill="${yan2}"/>` +
  `<polygon points="${p(x, y, h)} ${p(x + 1, y, h)} ${p(x + 1, y + 1, h)} ${p(x, y + 1, h)}" fill="${renk}"/>` +
  `<polygon points="${p(x, y, h + 6)} ${p(x + 1, y, h + 6)} ${p(x + 1, y + 1, h + 6)} ${p(x, y + 1, h + 6)}" fill="#fff"/>`;
const kar = (x: number, y: number) => `<polygon points="${p(x + 0.1, y + 0.1, 9)} ${p(x + 0.9, y + 0.1, 9)} ${p(x + 0.9, y + 0.9, 9)} ${p(x + 0.1, y + 0.9, 9)}" fill="#fff"/>` +
  `<polygon points="${p(x + 0.1, y + 0.9)} ${p(x + 0.9, y + 0.9)} ${p(x + 0.9, y + 0.9, 9)} ${p(x + 0.1, y + 0.9, 9)}" fill="#dfe6f5"/>`;
const robotSvg = (x: number, y: number, renk: string, koyu: string) => {
  const c = p(x + 0.5, y + 0.5).split(",").map(Number);
  return `<g transform="translate(${c[0]} ${c[1]})"><ellipse cx="0" cy="4" rx="30" ry="13" fill="#1a2340" opacity=".16"/>
    <path d="M-26 -8 L0 -21 L26 -8 L26 -26 L0 -39 L-26 -26Z" fill="${koyu}"/><path d="M-26 -26 L0 -13 L26 -26 L0 -39Z" fill="${renk}"/>
    <path d="M0 -13 L26 -26 L26 -8 L0 5Z" fill="${koyu}" opacity=".8"/><path d="M-26 -26 L0 -13 L0 5 L-26 -8Z" fill="${koyu}"/>
    <path d="M10 -6 L38 -20 L38 -8 L10 6Z" fill="#ffc21a"/><ellipse cx="0" cy="-30" rx="7" ry="4" fill="#fff"/><ellipse cx="0" cy="-31" rx="4" ry="2.4" fill="#d7262e"/></g>`;
};
const yagis = Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 89) % 500}" r="${1.5 + (i % 3)}" fill="#fff" opacity=".8"/>`).join("");

export function karKapagi() {
  let ic = `<rect width="800" height="500" fill="#e9eefc"/>`;
  const harita = ["##..##", "#R...#", "##.#.#", "##...#"];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) ic += kare(x, y, harita[y][x] === "#" ? "#e1e7f7" : "#9aa5c0");
  const renk = [["#c9d4f2", "#adbbe2", "#97a6d2"], ["#f2c9c9", "#e0aeae", "#cf9a9a"], ["#c9e8e2", "#acd6cd", "#97c4bb"], ["#f2e2c4", "#e2cda6", "#d1bc94"]];
  let r = 0;
  for (let s = 0; s < 10; s++) for (let x = 0; x <= s; x++) {
    const y = s - x;
    if (y > 3 || x > 5) continue;
    const c = harita[y][x];
    if (c === "#") { const [a, b, d] = renk[r++ % renk.length]; ic += kutu(x, y, 40 + ((x + y) % 3) * 14, a, b, d); }
    else if (c === "." && !(y === 1 && x === 2)) ic += kar(x, y);
    if (x === 1 && y === 1) ic += robotSvg(1.3, 1, "#3a62e0", "#2747b0");
  }
  return svg(ic + yagis, "Karlı sokakta kar küreyen robot");
}

export function ligKapagi() {
  let ic = `<rect width="800" height="500" fill="#fdf1f1"/>`;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) ic += kare(x - 0.5, y - 0.3, (x + y) % 2 ? "#f3f6fd" : "#e9eefa");
  const top = (x: number, y: number) => { const c = p(x, y).split(",").map(Number); return `<ellipse cx="${c[0]}" cy="${c[1] + 2}" rx="13" ry="6" fill="#1a2340" opacity=".14"/><circle cx="${c[0]}" cy="${c[1] - 12}" r="12" fill="#f7f9ff"/><circle cx="${c[0] - 4}" cy="${c[1] - 17}" r="4" fill="#fff"/>`; };
  ic += top(2.2, 0.8) + top(1, 2.6) + top(3.4, 2.2) + top(2.6, 3.8);
  ic += robotSvg(0.2, 1.3, "#d7262e", "#a8141b") + robotSvg(3.6, 3, "#22a6a0", "#178680");
  ic += `<g transform="translate(560 410)"><rect width="200" height="54" rx="14" fill="#fff" stroke="#f1d3d3" stroke-width="2"/><text x="30" y="36" font-family="Lexend, sans-serif" font-weight="800" font-size="24" fill="#d7262e">4</text><text x="88" y="35" font-family="Lexend, sans-serif" font-size="16" fill="#8a93a6">tur 37</text><text x="160" y="36" font-family="Lexend, sans-serif" font-weight="800" font-size="24" fill="#22a6a0">3</text></g>`;
  return svg(ic + yagis, "Kar topu toplayan iki robot");
}
