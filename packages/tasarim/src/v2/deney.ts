/* Deney bileşenleri: kaydırıcı ve canlı grafik. Ders sayfasının "Dene" bölümünde ve başka deneylerin içinde kullanılır. */
import { el } from "../dom";

/* ---------- kaydırıcı ---------- */
export interface KaydiriciAyari {
  etiket: string;
  en: number;
  ust: number;
  adim?: number;
  birim?: string;
  baslangic?: number;
  /** değerin yazılışı (ör. ondalık virgül); verilmezse olduğu gibi */
  bicim?: (d: number) => string;
  /** sürüklerken her değer */
  degisince?: (d: number) => void;
  /** bırakınca (ya da klavyeyle değiştirince) son değer: "denendi" */
  birakinca?: (d: number) => void;
}
/** Değeri sınırlara ve adıma oturtur */
export function adimaOturt(d: number, en: number, ust: number, adim = 1): number {
  const k = Math.round((Math.min(ust, Math.max(en, d)) - en) / adim) * adim + en;
  return Number(Math.min(ust, k).toFixed(6));
}
/** Büyük tutamaklı sürgü. Tarayıcının kendi range öğesi: klavye, dokunma ve ekran okuyucu desteği hazır gelir. */
export function kaydirici(a: KaydiriciAyari): HTMLElement {
  const adim = a.adim ?? 1, ilk = adimaOturt(a.baslangic ?? a.en, a.en, a.ust, adim);
  const kimlik = "s2k-" + Math.random().toString(36).slice(2, 8);
  const girdi = el("input", "s2-kaydirici__girdi", { type: "range", id: kimlik, min: String(a.en), max: String(a.ust), step: String(adim), value: String(ilk) }) as HTMLInputElement;
  const deger = el("output", "s2-kaydirici__deger", { for: kimlik }, "");
  const kap = el("div", "s2-kaydirici", {},
    el("div", "s2-kaydirici__ust", {}, el("label", "s2-kaydirici__etiket", { for: kimlik }, a.etiket), deger),
    girdi,
    el("div", "s2-kaydirici__sinirlar", { "aria-hidden": "true" }, el("span", "", {}, `${a.bicim ? a.bicim(a.en) : a.en}${a.birim ? " " + a.birim : ""}`), el("span", "", {}, `${a.bicim ? a.bicim(a.ust) : a.ust}${a.birim ? " " + a.birim : ""}`)));
  const yaz = () => {
    const d = Number(girdi.value), oran = (d - a.en) / (a.ust - a.en);
    deger.textContent = `${a.bicim ? a.bicim(d) : d}${a.birim ? " " + a.birim : ""}`;
    girdi.setAttribute("aria-valuetext", deger.textContent);
    kap.style.setProperty("--doluluk", `${oran * 100}%`);
    return d;
  };
  yaz();
  girdi.addEventListener("input", () => a.degisince?.(yaz()));
  girdi.addEventListener("change", () => a.birakinca?.(yaz()));
  return kap;
}

/* ---------- canlı grafik ---------- */
export interface CanliGrafikAyari {
  baslik: string;
  en: number;
  ust: number;
  /** pencere (sn), varsayılan 10 */
  pencere?: number;
  birim?: string;
  /** zaman kaynağı (test için); saniye */
  saat?: () => number;
}
export interface GrafikNoktasi { t: number; d: number }
/** Pencerenin dışına düşen noktaları atar; pencerenin başındaki çizgi kesilmesin diye pencereden önceki son nokta kalır */
export function pencereKirp(n: GrafikNoktasi[], simdi: number, pencere: number): GrafikNoktasi[] {
  const bas = simdi - pencere;
  let i = n.findIndex((p) => p.t >= bas);
  if (i === -1) i = n.length;
  return n.slice(Math.max(0, i - 1));
}
export interface CanliGrafik { kap: HTMLElement; ekle(d: number): void; noktalar(): GrafikNoktasi[] }
/** Bir değerin son birkaç saniyesini çizen tek serili çizgi grafik. Saniyede en çok 30 kez çizer; hareketi azaltta
    yalnız yeni değer gelince çizer (grafik kendiliğinden kaymaz). */
export function canliGrafik(a: CanliGrafikAyari): CanliGrafik {
  const pencere = a.pencere ?? 10, saat = a.saat ?? (() => performance.now() / 1000);
  const G = 400, Y = 120, SOL = 44, SAG = 56, UST = 10, ALT = 12;
  const NS = "http://www.w3.org/2000/svg";
  const s = (ad: string, at: Record<string, string | number>) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
  const svg = s("svg", { viewBox: `0 0 ${G} ${Y}`, class: "s2-grafik__svg", "aria-hidden": "true" });
  const yy = (d: number) => UST + (1 - (Math.min(a.ust, Math.max(a.en, d)) - a.en) / (a.ust - a.en)) * (Y - UST - ALT);
  for (const [d, yazi] of [[a.ust, String(a.ust)], [(a.en + a.ust) / 2, ""], [a.en, String(a.en)]] as [number, string][]) {
    svg.append(s("line", { x1: SOL, x2: G - SAG, y1: yy(d), y2: yy(d), class: "s2-grafik__izgara" }));
    if (yazi) { const t = s("text", { x: SOL - 6, y: yy(d) + 4, "text-anchor": "end", class: "s2-grafik__eksen" }); t.textContent = yazi; svg.append(t); }
  }
  const cizgi = s("polyline", { class: "s2-grafik__cizgi", points: "" });
  const uc = s("circle", { r: 4, class: "s2-grafik__uc", cx: G - SAG, cy: yy(a.en) });
  const ucYazi = s("text", { x: G - SAG + 8, y: yy(a.en) + 4, class: "s2-grafik__son" });
  svg.append(cizgi, uc, ucYazi);
  const son = el("p", "s2-gizli", { "aria-live": "off" }, "");
  const kap = el("figure", "s2-grafik", {}, el("figcaption", "s2-grafik__baslik", {}, a.baslik), svg, son);
  let noktalar: GrafikNoktasi[] = [];
  const azHareket = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ciz = () => {
    const simdi = saat();
    noktalar = pencereKirp(noktalar, simdi, pencere);
    if (!noktalar.length) return;
    const xx = (t: number) => SOL + Math.max(0, (t - (simdi - pencere)) / pencere) * (G - SOL - SAG);
    const p = noktalar.map((n) => `${xx(n.t).toFixed(1)},${yy(n.d).toFixed(1)}`);
    const sonD = noktalar[noktalar.length - 1].d;
    p.push(`${G - SAG},${yy(sonD).toFixed(1)}`);
    cizgi.setAttribute("points", p.join(" "));
    uc.setAttribute("cy", yy(sonD).toFixed(1));
    ucYazi.setAttribute("y", (yy(sonD) + 4).toFixed(1));
    ucYazi.textContent = String(Math.round(sonD));
    son.textContent = `${a.baslik}: ${Math.round(sonD)}${a.birim ? " " + a.birim : ""}`;
  };
  let sonCizim = 0, bagliydi = false;
  const dongu = (zaman: number) => {
    if (kap.isConnected) bagliydi = true; else if (bagliydi) return;
    if (zaman - sonCizim >= 33) { sonCizim = zaman; ciz(); }
    requestAnimationFrame(dongu);
  };
  if (!azHareket && typeof requestAnimationFrame === "function") requestAnimationFrame(dongu);
  return {
    kap,
    ekle(d) { noktalar.push({ t: saat(), d }); if (azHareket) ciz(); },
    noktalar: () => { noktalar = pencereKirp(noktalar, saat(), pencere); return noktalar; }
  };
}
