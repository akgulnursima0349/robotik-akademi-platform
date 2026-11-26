/* Adım adım çizim: katalogdaki çizimi (mufredat/gorseller) SVG olarak kurar. Katmanlar sırayla belirir: konuşma balonu
   okurken kelimeye göre, ses yoksa saniyede bir. Çizgiler çizilerek, etiketler solarak gelir. Hareketi azaltta hepsi hemen. */
import { el } from "@sra/tasarim/v2";
import { gorunenKatmanlar, type Cizim, type CizimRengi, type Sekil } from "@sra/mufredat";

const RENK: Record<CizimRengi, string> = {
  murekkep: "#17144A", kirmizi: "#E3262F", mor: "#6A48F0", yesil: "#0A7A71", sari: "#F5A300", gri: "#D9D1C2", beyaz: "#FFFFFF", siyah: "#1D1B19", kahve: "#8B5A2B"
};
const NS = "http://www.w3.org/2000/svg";
const svgEl = (ad: string, a: Record<string, string | number>) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v)); return e; };

/** dalgalı ışın: iki nokta arasında küçük dalgalarla ilerleyen yol ve ucunda ok */
function isinYolu(b: [number, number], s: [number, number]): string {
  const [x0, y0] = b, [x1, y1] = s, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(3, Math.round(L / 22));
  let d = `M${x0} ${y0}`;
  for (let i = 1; i <= n; i++) {
    const t0 = (i - 0.5) / n, t = i / n, a = (i % 2 ? 1 : -1) * 6;
    d += ` Q${x0 + dx * t0 + nx * a} ${y0 + dy * t0 + ny * a} ${x0 + dx * t} ${y0 + dy * t}`;
  }
  return d;
}
function sekilKur(s: Sekil, renk: string): SVGElement {
  const g = svgEl("g", {});
  const cizgi = { stroke: renk, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" };
  if (s.tur === "kutu") g.append(svgEl("rect", { x: s.x, y: s.y, width: s.g, height: s.y2, rx: s.kose ?? 6, fill: s.dolgu ? RENK[s.dolgu] : "none", stroke: renk, "stroke-width": 3 }));
  else if (s.tur === "daire") g.append(svgEl("circle", { cx: s.x, cy: s.y, r: s.r, fill: s.dolgu ? RENK[s.dolgu] : "none", stroke: renk, "stroke-width": 3 }));
  else if (s.tur === "cizgi" || s.tur === "ok") {
    g.append(svgEl("polyline", { points: s.noktalar.map((p) => p.join(",")).join(" "), ...cizgi, class: "cz-cizgi" }));
    if (s.tur === "ok") { const [a, b] = s.noktalar.slice(-2); g.append(okUcu(a, b, renk)); }
  } else if (s.tur === "isin") {
    g.append(svgEl("path", { d: isinYolu(s.bas, s.son), ...cizgi, "stroke-width": s.soluk ? 2 : 4, "stroke-dasharray": s.soluk ? "4 6" : "none", opacity: s.soluk ? 0.55 : 1, class: "cz-cizgi" }));
    g.append(okUcu(s.bas, s.son, renk, s.soluk ? 0.55 : 1));
  } else {
    const t = svgEl("text", { x: s.x, y: s.y, "text-anchor": s.hiza === "sol" ? "start" : s.hiza === "sag" ? "end" : "middle", fill: renk, "font-family": "Baloo 2, Nunito, sans-serif", "font-weight": 800, "font-size": 17 });
    t.textContent = s.metin; g.append(t);
  }
  return g;
}
function okUcu(a: [number, number], b: [number, number], renk: string, op = 1) {
  const aci = Math.atan2(b[1] - a[1], b[0] - a[0]), u = 11;
  const p = (d: number) => `${b[0] - u * Math.cos(aci + d)},${b[1] - u * Math.sin(aci + d)}`;
  return svgEl("polygon", { points: `${b[0]},${b[1]} ${p(0.45)} ${p(-0.45)}`, fill: renk, opacity: op });
}

export interface CizimOynatici { kap: HTMLElement; kelime(i: number): void; basladi(): void; bitti(): void; yeniden(): void; kapat(): void }

export function cizimKur(ad: string, c: Cizim): CizimOynatici {
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = svgEl("svg", { viewBox: "0 0 400 260", role: "img", "aria-label": c.aciklama, class: "cz-svg" }) as SVGSVGElement;
  svg.append(svgEl("rect", { x: 0, y: 0, width: 400, height: 260, rx: 18, fill: "#FFF8EC" }));
  const katmanlar = c.katmanlar.map((k) => { const g = sekilKur(k.sekil, RENK[k.renk]); g.classList.add("cz-katman"); svg.append(g); return g; });
  const tekrar = el("button", "s2-dugme s2-dugme--kucuk cz-tekrar", { type: "button" }, "Tekrar oynat");
  const kap = el("figure", "cz", { style: "margin:0", "data-cizim": ad }, el("div", "cz-alan", {}, svg), el("figcaption", "s2-gizli", {}, c.aciklama), el("div", "cz-alt", {}, tekrar));
  let zaman: ReturnType<typeof setInterval> | null = null, saniye = 0, okunuyor = false;
  const uygula = (gorunen: number[]) => {
    const s = new Set(gorunen);
    katmanlar.forEach((g, i) => g.classList.toggle("gorunur", s.has(i)));
    kap.dataset.gorunen = String(s.size);
  };
  const durdurZaman = () => { if (zaman) clearInterval(zaman); zaman = null; };
  const zamanla = () => {
    durdurZaman(); saniye = 0;
    uygula(gorunenKatmanlar(c, { saniye, azHareket }));
    zaman = setInterval(() => {
      saniye++;
      const g = gorunenKatmanlar(c, { saniye, azHareket });
      uygula(g);
      if (g.length === katmanlar.length) durdurZaman();
    }, 1000);
  };
  tekrar.addEventListener("click", () => { katmanlar.forEach((g) => g.classList.remove("gorunur")); requestAnimationFrame(zamanla); });
  zamanla();
  return {
    kap,
    basladi() { okunuyor = true; durdurZaman(); uygula(gorunenKatmanlar(c, { kelime: 0, azHareket })); },
    kelime(i) { if (okunuyor) uygula(gorunenKatmanlar(c, { kelime: i, azHareket })); },
    bitti() { okunuyor = false; durdurZaman(); uygula(gorunenKatmanlar(c, { bitti: true })); },
    yeniden: zamanla,
    kapat: durdurZaman
  };
}

export const CIZIM_STILI = `
.cz{width:100%;display:flex;flex-direction:column;padding:10px 10px 12px;box-sizing:border-box}
.cz-svg{width:100%;height:auto;display:block}
.cz-alt{display:flex;justify-content:flex-end}
.cz-katman{opacity:0;transition:opacity var(--sra2-orta) var(--sra2-yumusak)}
.cz-katman.gorunur{opacity:1}
.cz-katman .cz-cizgi{stroke-dasharray:600;stroke-dashoffset:600;transition:stroke-dashoffset 700ms var(--sra2-yumusak)}
.cz-katman.gorunur .cz-cizgi{stroke-dashoffset:0}
.cz-katman .cz-cizgi[stroke-dasharray="4 6"]{stroke-dasharray:4 6;stroke-dashoffset:0}
@media (prefers-reduced-motion: reduce){.cz-katman,.cz-katman .cz-cizgi{transition:none}}
`;
