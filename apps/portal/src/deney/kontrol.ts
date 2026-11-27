/* Lise · Kontrol (mBot2) deneyleri ve görevleri. Hesaplar robot-motoru/kontrol.ts'te; burada çizim ve etkileşim.
   Her formülün yanında o anki sayılarla örnek yazılır. Çizgi izleme deneyleri Çizgi İzleyen modülünün robot modeliyle koşar. */
import { dugme, el, kaydirici, secici, yildizlar } from "@sra/tasarim/v2";
import {
  AYAR_PISTLERI, bosDevir, calismaDevri, derece, donguKos, enkoderYolu, HEDEF_YAY, hedefYayDegerlendir, HIZ_ESIKLERI, HIZ_MODELI, hizKos, hizYildizi,
  kareHatasi, KARE, kareSur, kareYildizi, kilitTorku, KIT_AYARI, kinematik, kinematikIz, KONTROL_PISTI, MBOT2, MOTOR180, motorGucu, motorTork,
  ORNEKLEME_ARALIKLARI, ORNEKLEME_ESIKLERI, orneklemeYildizi, Pist, RAMPA, RAMPA_ESIKLERI, rampaDegerlendir, SAGLAM_ESIKLERI, saglamDegerlendir, SURUMLER,
  YAVAS_DONGU, type CizgiAyari, type CizgiSonucu, type Poz2
} from "@sra/robot-motoru";

const NS = "http://www.w3.org/2000/svg";
const s = (ad: string, at: Record<string, string | number> = {}) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
const sayi = (n: number, b = 2) => (Number.isFinite(n) ? n.toFixed(b).replace(".", ",").replace(/,0+$/, "").replace(/(,\d*?)0+$/, "$1") : "∞");
const RENK = ["#6A48F0", "#E07B00", "#18A058", "#C2185B"];

/* ---------- ortak: çizgi grafiği (tek eksen, lejant) ---------- */
interface Seri { ad: string; renk: string; noktalar: [number, number][]; kesik?: boolean }
interface GrafikAyari { xAd: string; yAd: string; seriler: Seri[]; xUst?: number; yUst?: number; yAlt?: number; isaretler?: { x?: number; y?: number; ad: string }[]; noktalar?: { x: number; y: number; ad: string }[] }
export function grafik(baslik: string): { kap: HTMLElement; ciz(a: GrafikAyari): void } {
  const G = 480, Y = 250, sol = 58, alt = 44, ust = 14, sag = 16;
  const svg = s("svg", { viewBox: `0 0 ${G} ${Y}`, class: "kn-grafik", role: "img", "aria-label": baslik });
  const lejant = el("div", "lb-lejant");
  const ozet = el("p", "s2-gizli", {});
  const adim = (ust: number) => { const h = ust / 5, b = 10 ** Math.floor(Math.log10(h)), m = h / b; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * b; };
  return {
    kap: el("figure", "lb-grafik-kap", {}, el("figcaption", "lb-baslik", {}, baslik), svg, lejant, ozet),
    ciz(a) {
      const xs = a.seriler.flatMap((x) => x.noktalar.map((n) => n[0])), ys = a.seriler.flatMap((x) => x.noktalar.map((n) => n[1]));
      const xUst = a.xUst ?? Math.max(1e-6, ...xs), yUst = a.yUst ?? Math.max(1e-6, ...ys), yAlt = a.yAlt ?? Math.min(0, ...ys);
      const dx = adim(xUst), dy = adim(yUst - yAlt);
      const xU = Math.ceil(xUst / dx) * dx, yU = Math.ceil(yUst / dy) * dy, yA = Math.floor(yAlt / dy) * dy;
      const X = (v: number) => sol + (v / xU) * (G - sol - sag), V = (v: number) => Y - alt - ((v - yA) / (yU - yA)) * (Y - alt - ust);
      const p: SVGElement[] = [];
      for (let v = yA; v <= yU + 1e-9; v += dy) { p.push(s("line", { x1: sol, x2: G - sag, y1: V(v), y2: V(v), stroke: Math.abs(v) < 1e-9 ? "#17144A" : "#E6DDCB", "stroke-width": Math.abs(v) < 1e-9 ? 1.5 : 1 })); const t = s("text", { x: sol - 8, y: V(v) + 6, "text-anchor": "end", class: "lb-eksen" }); t.textContent = sayi(v, 2); p.push(t); }
      for (let v = 0; v <= xU + 1e-9; v += dx) { const t = s("text", { x: X(v), y: Y - alt + 24, "text-anchor": "middle", class: "lb-eksen" }); t.textContent = sayi(v, 2); p.push(t); }
      const xa = s("text", { x: (sol + G - sag) / 2, y: Y - 4, "text-anchor": "middle", class: "lb-eksen kn-eksen-ad" }); xa.textContent = a.xAd; p.push(xa);
      const ya = s("text", { x: 14, y: (ust + Y - alt) / 2, "text-anchor": "middle", class: "lb-eksen kn-eksen-ad", transform: `rotate(-90 14 ${(ust + Y - alt) / 2})` }); ya.textContent = a.yAd; p.push(ya);
      for (const m of a.isaretler ?? []) {
        if (m.x !== undefined) p.push(s("line", { x1: X(m.x), x2: X(m.x), y1: ust, y2: Y - alt, stroke: "#8E89C0", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
        if (m.y !== undefined) p.push(s("line", { x1: sol, x2: G - sag, y1: V(m.y), y2: V(m.y), stroke: "#8E89C0", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
        const t = s("text", { x: m.x !== undefined ? X(m.x) + 4 : G - sag - 4, y: m.y !== undefined ? V(m.y) - 6 : ust + 14, "text-anchor": m.x !== undefined ? "start" : "end", class: "lb-eksen kn-isaret" }); t.textContent = m.ad; p.push(t);
      }
      for (const x of a.seriler) p.push(s("polyline", { points: x.noktalar.map(([u, v]) => `${X(Math.min(u, xU))},${V(Math.max(yA, Math.min(yU, v)))}`).join(" "), fill: "none", stroke: x.renk, "stroke-width": 3, "stroke-linejoin": "round", ...(x.kesik ? { "stroke-dasharray": "7 5" } : {}) }));
      for (const n of a.noktalar ?? []) { p.push(s("circle", { cx: X(n.x), cy: V(n.y), r: 6, fill: "#17144A", stroke: "#fff", "stroke-width": 2 })); const t = s("text", { x: X(n.x) + 9, y: V(n.y) - 8, class: "lb-eksen kn-isaret" }); t.textContent = n.ad; p.push(t); }
      svg.replaceChildren(...p);
      lejant.replaceChildren(...a.seriler.map((x) => el("span", "", {}, el("i", "", { style: `background:${x.renk}` }), x.ad)));
      ozet.textContent = a.seriler.map((x) => `${x.ad}: ${x.noktalar.length} nokta, son değer ${sayi(x.noktalar[x.noktalar.length - 1]?.[1] ?? 0)}`).join("; ");
    }
  };
}
/** Formül satırları: her satır bir formül ve o anki sayılarla örneği */
function formuller(): { kap: HTMLElement; yaz(satirlar: [string, string][]): void } {
  const kap = el("dl", "kn-formul", { "aria-live": "polite" });
  return { kap, yaz(satirlar) { kap.replaceChildren(...satirlar.flatMap(([f, o]) => [el("dt", "", {}, f), el("dd", "", {}, o)])); } };
}
/** Sayı kutusu: − / + düğmeleri ve elle yazılabilen alan */
function sayiKutusu(o: { etiket: string; en: number; ust: number; adim: number; baslangic: number; birim?: string; degisince: (v: number) => void }): HTMLElement {
  let v = o.baslangic;
  const gir = el("input", "kn-sayi", { type: "number", min: String(o.en), max: String(o.ust), step: String(o.adim), value: String(v), "aria-label": o.etiket }) as HTMLInputElement;
  const koy = (x: number) => { v = Math.max(o.en, Math.min(o.ust, Math.round(x / o.adim) * o.adim)); gir.value = String(v); o.degisince(v); };
  const eksi = el("button", "kp-mini", { type: "button", "aria-label": `${o.etiket}: bir azalt` }, "−"), arti = el("button", "kp-mini", { type: "button", "aria-label": `${o.etiket}: bir artır` }, "+");
  eksi.addEventListener("click", () => koy(v - o.adim)); arti.addEventListener("click", () => koy(v + o.adim));
  gir.addEventListener("change", () => koy(Number(gir.value) || o.en));
  return el("label", "kn-sayi-satir", {}, el("span", "rs-etiket", {}, o.etiket), el("span", "kn-sayi-grup", {}, eksi, gir, arti, o.birim ? el("span", "kn-birim", {}, o.birim) : ""));
}
const sonucYaz = (kap: HTMLElement, n: number, metin: string, olcutler: [boolean, string][]) => {
  kap.replaceChildren(yildizlar(3, n), el("b", "", {}, ` ${n} / 3 yıldız · ${metin}`), el("ul", "kp-olcut", {}, ...olcutler.map(([t, m]) => el("li", t ? "tamam" : "", {}, `${t ? "✓" : "✗"} ${m}`))));
};

/* ---------- üstten bakış: iz çizimi (cm, matematik ekseni) ---------- */
function izAlani(etiket: string, sinir: { x0: number; x1: number; y0: number; y1: number }) {
  const svg = s("svg", { viewBox: `${sinir.x0} ${-sinir.y1} ${sinir.x1 - sinir.x0} ${sinir.y1 - sinir.y0}`, class: "kn-alan", role: "img", "aria-label": etiket });
  const ciz = (ogeler: SVGElement[]) => {
    const p: SVGElement[] = [s("rect", { x: sinir.x0, y: -sinir.y1, width: sinir.x1 - sinir.x0, height: sinir.y1 - sinir.y0, fill: "#FFF8EC" })];
    for (let x = Math.ceil(sinir.x0 / 10) * 10; x <= sinir.x1; x += 10) p.push(s("line", { x1: x, x2: x, y1: -sinir.y1, y2: -sinir.y0, stroke: x === 0 ? "#B8B3D6" : "#EFE6D4", "stroke-width": 0.4 }));
    for (let y = Math.ceil(sinir.y0 / 10) * 10; y <= sinir.y1; y += 10) p.push(s("line", { x1: sinir.x0, x2: sinir.x1, y1: -y, y2: -y, stroke: y === 0 ? "#B8B3D6" : "#EFE6D4", "stroke-width": 0.4 }));
    svg.replaceChildren(...p, ...ogeler);
  };
  return { svg, ciz };
}
const izCizgisi = (iz: Poz2[], renk: string, kesik = false) => s("polyline", { points: iz.map((p) => `${p.x},${-p.y}`).join(" "), fill: "none", stroke: renk, "stroke-width": 1.4, ...(kesik ? { "stroke-dasharray": "3 2" } : {}) });
/** mBot2 üstten (yaklaşık 17 × 12 cm), poz: matematik ekseni */
function robot2(p: Poz2, renk = "#1E88E5", soluk = false): SVGElement {
  const g = s("g", { transform: `translate(${p.x} ${-p.y}) rotate(${-derece(p.aci)})`, opacity: soluk ? 0.35 : 1 });
  g.append(s("rect", { x: -3.2, y: -7, width: 6.4, height: 2, rx: 0.6, fill: "#17144A" }), s("rect", { x: -3.2, y: 5, width: 6.4, height: 2, rx: 0.6, fill: "#17144A" }),
    s("rect", { x: -5, y: -5, width: 14, height: 10, rx: 1.4, fill: renk, stroke: "#fff", "stroke-width": 0.4 }), s("rect", { x: -2, y: -3, width: 6, height: 6, rx: 0.8, fill: "#263238" }),
    s("path", { d: "M10 0 L7.5 -2 L7.5 2 Z", fill: "#fff" }));
  return g;
}

/* ---------- 1 · kinematik deneyi ve hedefe yay görevi ---------- */
function kinematikYazisi(sol: number, sag: number): [string, string][] {
  const k = kinematik(sol, sag), L = MBOT2.tekerArasi;
  return [
    ["v = (v_sol + v_sağ) / 2", `(${sol} + ${sag}) / 2 = ${sayi(k.v)} cm/sn`],
    ["ω = (v_sağ − v_sol) / L", `(${sag} − ${sol}) / ${sayi(L)} ≈ ${sayi(k.w)} rad/sn (${sayi(derece(k.w), 1)}°/sn)`],
    ["R = v / ω", k.w === 0 ? "ω = 0: robot düz gider (R sonsuz)" : `${sayi(k.v)} / ${sayi(k.w)} ≈ ${sayi(k.R, 1)} cm${k.v === 0 ? " (yerinde dönüş)" : ""}`]
  ];
}
export function kinematikDeneyi(_a: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const d = { sol: 10, sag: 20 };
  const alan = izAlani("Robotun 3 saniyelik izi ve dönme merkezi", { x0: -60, x1: 60, y0: -20, y1: 75 });
  const f = formuller();
  const kap = el("div", "rs mb", { "data-deney": "kinematik" });
  const ciz = () => {
    const iz = kinematikIz(d.sol, d.sag, 3), k = kinematik(d.sol, d.sag), son = iz[iz.length - 1];
    const og: SVGElement[] = [robot2(iz[0], "#1E88E5", true), izCizgisi(iz, "#6A48F0")];
    if (Number.isFinite(k.R) && Math.abs(k.R) < 200) {
      /* dönme merkezi: robotun solunda R kadar */
      og.push(s("line", { x1: 0, y1: 0, x2: -k.R, y2: 0, stroke: "#E07B00", "stroke-width": 0.6, "stroke-dasharray": "2 1.5" }), s("circle", { cx: -k.R, cy: 0, r: 1.6, fill: "#E07B00" }));
    }
    og.push(robot2(son));
    alan.ciz(og);
    f.yaz(kinematikYazisi(d.sol, d.sag));
    kap.dataset.r = Number.isFinite(k.R) ? sayi(k.R, 1) : "sonsuz";
  };
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, alan.svg), el("div", "lb-yan", {},
    kaydirici({ etiket: "Sol teker", en: -30, ust: 30, adim: 1, birim: "cm/sn", baslangic: d.sol, degisince: (v) => { d.sol = v; ciz(); }, birakinca: () => denendi(`${d.sol},${d.sag}`) }),
    kaydirici({ etiket: "Sağ teker", en: -30, ust: 30, adim: 1, birim: "cm/sn", baslangic: d.sag, degisince: (v) => { d.sag = v; ciz(); }, birakinca: () => denendi(`${d.sol},${d.sag}`) }),
    f.kap, el("p", "lb-not", {}, `L: iki teker arası (mBot2'de yaklaşık ${sayi(MBOT2.tekerArasi)} cm). Turuncu nokta dönme merkezi; soluk robot başlangıç.`))));
  ciz();
  return kap;
}
function hedefYayGorevi(yildiz: (n: number) => void): HTMLElement {
  const d = { sol: 20, sag: 20 };
  const alan = izAlani("Hedefe yay: robot ve hedef", { x0: -60, x1: 40, y0: -20, y1: 65 });
  const f = formuller(), sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-gorev": "kontrol", "data-kontrol": "hedef-yay" });
  const H = HEDEF_YAY.hedef;
  const ciz = (iz: Poz2[] | null) => {
    alan.ciz([robot2({ x: 0, y: 0, aci: Math.PI / 2 }, "#1E88E5", true), robot2(H, "#18A058", true), s("circle", { cx: H.x, cy: -H.y, r: 1.5, fill: "#18A058" }), ...(iz ? [izCizgisi(iz, "#6A48F0"), robot2(iz[iz.length - 1])] : [])]);
    f.yaz(kinematikYazisi(d.sol, d.sag));
  };
  const calistir = dugme({ metin: "Çalıştır", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", () => {
    const r = hedefYayDegerlendir(d.sol, d.sag);
    ciz(r.iz); kap.dataset.yildiz = String(r.yildiz);
    sonucYaz(sonuc, r.yildiz, `konum hatası ${sayi(r.mesafe, 1)} cm, yön hatası ${sayi(r.yonHatasi, 1)}°`, [[r.mesafe <= 12, "Konum hatası en çok 12 cm"], [r.mesafe <= 5 && r.yonHatasi <= 15, "Konum ≤ 5 cm ve yön ≤ 15°"], [r.mesafe <= 1.5 && r.yonHatasi <= 5, "Konum ≤ 1,5 cm ve yön ≤ 5°"]]);
    if (r.yildiz) yildiz(r.yildiz);
  });
  kap.append(el("p", "lb-not", {}, `Robot (0, 0) noktasından yukarı bakarak çıkıyor. ${HEDEF_YAY.sure} saniyede yeşil robotun yerine (${sayi(H.x, 1)}, ${sayi(H.y, 1)}) ve yönüne (${sayi(derece(H.aci), 0)}°) varmalı. İpucu: hedef çeyrek çember; R ve ω'yı hesapla.`),
    el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, alan.svg), el("div", "lb-yan", {},
      kaydirici({ etiket: "Sol teker", en: HEDEF_YAY.aralik.en, ust: HEDEF_YAY.aralik.ust, adim: 1, birim: "cm/sn", baslangic: d.sol, degisince: (v) => { d.sol = v; ciz(null); } }),
      kaydirici({ etiket: "Sağ teker", en: HEDEF_YAY.aralik.en, ust: HEDEF_YAY.aralik.ust, adim: 1, birim: "cm/sn", baslangic: d.sag, degisince: (v) => { d.sag = v; ciz(null); } }),
      f.kap, el("div", "rs-kontrol", {}, calistir))), sonuc);
  ciz(null);
  return kap;
}

/* ---------- 2 · hız kontrolü deneyi ve görevi ---------- */
function hizPaneli(o: { calistirli: boolean; baslangic: { kp: number; ki: number; kd: number; sinirlama: boolean }; denendi?: (d: string) => void; bitince?: (y: number) => void }) {
  const a = { ...o.baslangic };
  const g1 = grafik("Motor devri (dev/dk) – zaman (sn)"), g2 = grafik("Motor gücü (%) – zaman (sn)");
  const olcut = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const f = formuller();
  const kap = el("div", "rs mb");
  const ciz = () => {
    const k = hizKos(a), o2 = k.olcut;
    g1.ciz({ xAd: "zaman (sn)", yAd: "devir (dev/dk)", yUst: 200, seriler: [{ ad: "Motor devri", renk: RENK[0], noktalar: k.t.map((t, i) => [t, k.devir[i]]) }], isaretler: [{ y: HIZ_MODELI.hedef, ad: `hedef ${HIZ_MODELI.hedef}` }, { x: HIZ_MODELI.yukAni, ad: "yük geldi" }] });
    g2.ciz({ xAd: "zaman (sn)", yAd: "güç (%)", yUst: 100, seriler: [{ ad: "Motor gücü", renk: RENK[1], noktalar: k.t.map((t, i) => [t, k.guc[i]]) }] });
    olcut.textContent = `Aşma %${sayi(o2.asma, 1)} · oturma ${sayi(o2.oturma)} sn · yükten toparlanma ${sayi(o2.toparlanma)} sn · kalıcı hata ${sayi(o2.kalici, 1)} dev/dk`;
    const e = 60;
    f.yaz([["güç = Kp·e + Ki·Σe·Δt + Kd·Δe/Δt", `hata e = 60 dev/dk iken P katkısı ${sayi(a.kp)} × ${e} = %${sayi(a.kp * e, 1)}${a.kp * e > 100 ? " (güç en çok %100)" : ""}`], ["I terimi", a.ki ? `0,5 sn boyunca e = 10 kalırsa ${sayi(a.ki)} × 10 × 0,5 = %${sayi(a.ki * 5, 1)} eklenir` : "Ki = 0: hata ne kadar sürerse sürsün birikmez"]]);
    kap.dataset.yildiz = String(hizYildizi(o2));
    return o2;
  };
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const bitir = () => {
    const o2 = ciz(), n = hizYildizi(o2);
    if (o.calistirli) {
      sonucYaz(sonuc, n, `kalıcı hata ${sayi(o2.kalici, 1)} dev/dk`, [[o2.kalici <= HIZ_ESIKLERI.kalici, `Kalıcı hata ≤ ${HIZ_ESIKLERI.kalici} dev/dk`], [n >= 2, `Aşma ≤ %${HIZ_ESIKLERI.asma}`], [n >= 3, `Oturma ≤ ${sayi(HIZ_ESIKLERI.oturma)} sn ve yükten toparlanma ≤ ${sayi(HIZ_ESIKLERI.toparlanma)} sn`]]);
      if (n) o.bitince?.(n);
    } else o.denendi?.(`${a.kp},${a.ki},${a.kd},${a.sinirlama}`);
  };
  const kaydir = (etiket: string, k: "kp" | "ki" | "kd", en: number, ust: number, adim: number) =>
    kaydirici({ etiket, en, ust, adim, baslangic: a[k], bicim: (v) => sayi(v, 3), degisince: (v) => { a[k] = v; if (!o.calistirli) ciz(); }, birakinca: () => { if (!o.calistirli) bitir(); } });
  const sinir = el("div", "", {}, el("span", "rs-etiket", {}, "Sınırlama (anti-windup)"), secici("Sınırlama", [["acik", "Açık"], ["kapali", "Kapalı"]], a.sinirlama ? "acik" : "kapali", (v) => { a.sinirlama = v === "acik"; if (!o.calistirli) bitir(); }));
  const calistir = dugme({ metin: "Çalıştır", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", bitir);
  kap.append(el("div", "rs-duzen", {}, el("div", "kn-grafikler", {}, g1.kap, g2.kap), el("div", "lb-yan", {},
    kaydir("Kp", "kp", 0, 3, 0.1), kaydir("Ki", "ki", 0, 30, 0.5), kaydir("Kd", "kd", 0, 0.05, 0.005), sinir, olcut, f.kap,
    o.calistirli ? el("div", "rs-kontrol", {}, calistir) : "")), sonuc);
  ciz();
  return kap;
}
export function hizKontroluDeneyi(_a: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const k = hizPaneli({ calistirli: false, baslangic: { kp: 1, ki: 0, kd: 0, sinirlama: true }, denendi });
  k.dataset.deney = "hiz-kontrolu";
  return k;
}
function yukteHizGorevi(yildiz: (n: number) => void): HTMLElement {
  const k = hizPaneli({ calistirli: true, baslangic: { kp: 1, ki: 0, kd: 0, sinirlama: true }, bitince: yildiz });
  k.dataset.gorev = "kontrol"; k.dataset.kontrol = "yukte-hiz"; delete k.dataset.yildiz;
  k.prepend(el("p", "lb-not", {}, `Hedef ${HIZ_MODELI.hedef} dev/dk. ${sayi(HIZ_MODELI.yukAni, 1)}. saniyede tekere yük biniyor. Motor hızını tutsun: kalıcı hata yok, aşma az, çabuk otursun.`));
  return k;
}

/* ---------- 3 ve 6 · çizgi izleme: pist ve iz ---------- */
function pistCizimi(etiket: string) {
  const ap = AYAR_PISTLERI[KONTROL_PISTI], pist = new Pist(ap.pist, ap.zemin);
  const { x0, y0, x1, y1 } = pist.sinir;
  const svg = s("svg", { viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`, class: "kn-pist", role: "img", "aria-label": etiket });
  const yol = pist.yol.filter((_, i) => i % 3 === 0).map(([x, y]) => `${x},${y}`).join(" ");
  const ciz = (sonuclar: CizgiSonucu[]) => {
    svg.replaceChildren(s("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: "#F7F5EF" }), s("polygon", { points: yol, fill: "none", stroke: "#1D1B19", "stroke-width": 19 }),
      ...sonuclar.map((r, i) => s("polyline", { points: r.kareler.filter((_, j) => j % 2 === 0).map((k) => `${k.x},${k.y}`).join(" "), fill: "none", stroke: RENK[i % RENK.length], "stroke-width": 14, opacity: 0.85 })));
  };
  ciz([]);
  return { svg, ciz };
}
const turYazisi = (r: CizgiSonucu) => (r.durum === "bitti" ? `tur ${sayi(r.sure)} sn, ortalama sapma ${sayi(r.ortSapma, 0)} mm` : r.durum === "cikti" ? `pistten çıktı (yolun %${Math.round(r.ilerleme * 100)}'i)` : `süre doldu (yolun %${Math.round(r.ilerleme * 100)}'i)`);
export function orneklemeDeneyi(_a: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const d = { ornekleme: 10, gecikme: 0 };
  const ayar: CizgiAyari = { taban: 140, kp: 0.02, kd: 0.2 };
  const p = pistCizimi("S virajlı pist ve robotun izi");
  const g = grafik("Sapma (mm) – zaman (sn)");
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-deney": "ornekleme" });
  const calis = () => {
    const r = donguKos(ayar, d);
    p.ciz([r]);
    g.ciz({ xAd: "zaman (sn)", yAd: "sapma (mm)", yAlt: -60, yUst: 60, seriler: [{ ad: "Çizgiden sapma", renk: RENK[0], noktalar: r.kareler.filter((_, i) => i % 2 === 0).map((k) => [k.t, Math.max(-60, Math.min(60, k.sapma))]) }] });
    yazi.textContent = `Döngü ${d.ornekleme} ms, gecikme ${d.gecikme} ms: ${turYazisi(r)}.`;
    kap.dataset.durum = r.durum;
    denendi(`${d.ornekleme},${d.gecikme}`);
  };
  const calistir = dugme({ metin: "Pistte dene", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", calis);
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, p.svg), el("div", "lb-yan", {},
    kaydirici({ etiket: "Döngü aralığı (örnekleme)", en: 10, ust: 60, adim: 10, birim: "ms", baslangic: d.ornekleme, degisince: (v) => { d.ornekleme = v; } }),
    kaydirici({ etiket: "Gecikme", en: 0, ust: 60, adim: 10, birim: "ms", baslangic: d.gecikme, degisince: (v) => { d.gecikme = v; } }),
    el("div", "rs-kontrol", {}, calistir), yazi,
    el("p", "lb-not", {}, `Ayar sabit: Taban Hız ${ayar.taban}, Kp ${sayi(ayar.kp, 3)}, Kd ${sayi(ayar.kd)}. Robot 1,5 m/sn'den hızlı: 40 ms'de 6 cm yol alır. Simülasyon Çizgi İzleyen modülündeki robotun modeli.`))), g.kap);
  return kap;
}
function cizgiAyarlari(a: CizgiAyari, degisti: () => void): HTMLElement[] {
  const R = ORNEKLEME_ARALIKLARI;
  return [
    kaydirici({ etiket: "Taban Hız", en: R.taban.en, ust: R.taban.ust, adim: R.taban.adim, baslangic: a.taban, degisince: (v) => { a.taban = v; degisti(); } }),
    kaydirici({ etiket: "Kp", en: R.kp.en, ust: R.kp.ust, adim: R.kp.adim, baslangic: a.kp, bicim: (v) => sayi(v, 3), degisince: (v) => { a.kp = v; degisti(); } }),
    kaydirici({ etiket: "Kd", en: R.kd.en, ust: R.kd.ust, adim: R.kd.adim, baslangic: a.kd, bicim: (v) => sayi(v, 2), degisince: (v) => { a.kd = v; degisti(); } })
  ];
}
function yavasDonguGorevi(yildiz: (n: number) => void): HTMLElement {
  const a: CizgiAyari = { ...KIT_AYARI };
  const p = pistCizimi("S virajlı pist ve robotun izi");
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-gorev": "kontrol", "data-kontrol": "yavas-dongu" });
  const calistir = dugme({ metin: "Pistte dene", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", () => {
    const r = donguKos(a, YAVAS_DONGU), n = orneklemeYildizi(r);
    p.ciz([r]); kap.dataset.yildiz = String(n);
    sonucYaz(sonuc, n, turYazisi(r), [[r.durum === "bitti", "Pisti bitir"], [n >= 2, `En çok ${sayi(ORNEKLEME_ESIKLERI[0])} sn`], [n >= 3, `En çok ${sayi(ORNEKLEME_ESIKLERI[1])} sn`]]);
    if (n) yildiz(n);
  });
  kap.append(el("p", "lb-not", {}, `Kart yavaş: kontrol döngüsü ${YAVAS_DONGU.ornekleme} ms'de bir çalışıyor. Başlangıçtaki kit ayarı bu döngüde pisti bitiremiyor. Yeni bir ayar bul.`),
    el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, p.svg), el("div", "lb-yan", {}, ...cizgiAyarlari(a, () => { }), el("div", "rs-kontrol", {}, calistir))), sonuc);
  return kap;
}

/* ---------- 4 · motor deneyi ve rampa görevi ---------- */
export function motorDeneyi(_a: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const d: { V: number; n: number; yuk: number } = { V: MOTOR180.gerilim, n: 1, yuk: 1.5 };
  const g1 = grafik("Tork (kg·cm) – devir (dev/dk)"), g2 = grafik("Güç (W) – devir (dev/dk)");
  const f = formuller();
  const kap = el("div", "rs mb", { "data-deney": "motor" });
  const ciz = () => {
    const w0 = bosDevir(d.V, d.n), ts = kilitTorku(d.V, d.n), w = calismaDevri(d.yuk, d.V, d.n);
    const nokta = (u: number): [number, number] => [u, motorTork(u, d.V, d.n)];
    const n = 40, xUst = Math.max(400, w0);
    g1.ciz({ xAd: "devir (dev/dk)", yAd: "tork (kg·cm)", xUst, yUst: Math.max(5, ts), seriler: [{ ad: "Motorun torku", renk: RENK[0], noktalar: Array.from({ length: n + 1 }, (_, i) => nokta((w0 * i) / n)) }], isaretler: [{ y: d.yuk, ad: `yük ${sayi(d.yuk, 1)}` }], noktalar: [{ x: w, y: Math.min(d.yuk, ts), ad: "çalışma noktası" }] });
    g2.ciz({ xAd: "devir (dev/dk)", yAd: "güç (W)", xUst, seriler: [{ ad: "Mekanik güç", renk: RENK[1], noktalar: Array.from({ length: n + 1 }, (_, i) => [(w0 * i) / n, motorGucu((w0 * i) / n, d.V, d.n)]) }] });
    f.yaz([
      ["τ = τ_kilit · (1 − devir / devir_boşta)", `${sayi(ts)} · (1 − devir / ${sayi(w0, 0)}) kg·cm`],
      ["dişli oranı n: tork × n, devir ÷ n", `n = ${sayi(d.n)}: kilit torku ${sayi(MOTOR180.kilitTork * d.V / MOTOR180.gerilim)} × ${sayi(d.n)} = ${sayi(ts)} kg·cm, boşta devir ${sayi(MOTOR180.bosDevir * d.V / MOTOR180.gerilim, 0)} ÷ ${sayi(d.n)} = ${sayi(w0, 0)} dev/dk`],
      ["P = τ · ω", `yük ${sayi(d.yuk, 1)} kg·cm iken devir ${sayi(w, 0)} dev/dk, güç ${sayi(motorGucu(w, d.V, d.n))} W`]
    ]);
    kap.dataset.devir = sayi(w, 0);
  };
  const dene = () => denendi(`${d.V},${d.n},${d.yuk}`);
  kap.append(el("div", "rs-duzen", {}, el("div", "kn-grafikler", {}, g1.kap, g2.kap), el("div", "lb-yan", {},
    kaydirici({ etiket: "Gerilim", en: 3.7, ust: 7.4, adim: 0.1, birim: "V", baslangic: d.V, bicim: (v) => sayi(v, 1), degisince: (v) => { d.V = v; ciz(); }, birakinca: dene }),
    kaydirici({ etiket: "Ek dişli oranı", en: 0.5, ust: 4, adim: 0.25, baslangic: d.n, bicim: (v) => sayi(v), degisince: (v) => { d.n = v; ciz(); }, birakinca: dene }),
    kaydirici({ etiket: "Yük torku", en: 0, ust: 10, adim: 0.5, birim: "kg·cm", baslangic: d.yuk, bicim: (v) => sayi(v, 1), degisince: (v) => { d.yuk = v; ciz(); }, birakinca: dene }),
    f.kap, el("p", "lb-not", {}, `Model: mBot2'deki 180 enkoderli motor, ${MOTOR180.gerilim} V'ta boşta ${MOTOR180.bosDevir} dev/dk ve ${MOTOR180.kilitTork} kg·cm başlangıç torku (Makeblock ürün bilgisi). Kayıpsız doğrusal model.`))));
  ciz();
  return kap;
}
function rampaGorevi(yildiz: (n: number) => void): HTMLElement {
  let n = 2;
  const g = grafik("Rampada gidilen yol (m) – zaman (sn)");
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-gorev": "kontrol", "data-kontrol": "rampa" });
  const calistir = dugme({ metin: "Rampalarda dene", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", () => {
    const r = rampaDegerlendir(n);
    g.ciz({ xAd: "zaman (sn)", yAd: "yol (m)", seriler: r.kosular.map((k, i) => ({ ad: `${RAMPA.rampalar[i].ad} (${RAMPA.rampalar[i].aci}°)`, renk: RENK[i], noktalar: k.iz.map((z) => [z.t, z.x] as [number, number]) })) });
    kap.dataset.yildiz = String(r.yildiz);
    sonucYaz(sonuc, r.yildiz, r.kosular.map((k, i) => `${RAMPA.rampalar[i].ad}: ${k.cikti ? `${sayi(k.sure)} sn` : "çıkamadı"}`).join(" · "), [[r.toplam < Infinity, "İki rampayı da çık"], [r.yildiz >= 2, `Toplam en çok ${sayi(RAMPA_ESIKLERI[0])} sn`], [r.yildiz >= 3, `Toplam en çok ${sayi(RAMPA_ESIKLERI[1])} sn`]]);
    if (r.yildiz) yildiz(r.yildiz);
  });
  kap.append(el("p", "lb-not", {}, `Yük taşıyan mBot2 (toplam ${sayi(RAMPA.kutle, 1)} kg) iki rampayı aynı dişliyle çıkacak: ${RAMPA.rampalar.map((r) => `${r.ad.toLowerCase()} ${sayi(r.uzunluk, 1)} m, ${r.aci}°`).join("; ")}. Teker yarıçapı ${sayi(RAMPA.tekerYaricap * 100, 1)} cm. Hangi ek dişli oranı iki rampada toplam en kısa sürede çıkarır?`),
    el("div", "rs-duzen", {}, g.kap, el("div", "lb-yan", {},
      kaydirici({ etiket: "Ek dişli oranı", en: RAMPA.aralik.en, ust: RAMPA.aralik.ust, adim: RAMPA.aralik.adim, baslangic: n, bicim: (v) => sayi(v), degisince: (v) => { n = v; } }),
      el("p", "lb-not", {}, "Oran 1'den küçükse dişli hızlandırır (tork azalır), büyükse yavaşlatır (tork artar)."), el("div", "rs-kontrol", {}, calistir))), sonuc);
  g.ciz({ xAd: "zaman (sn)", yAd: "yol (m)", xUst: 2, yUst: 1.2, seriler: [] });
  return kap;
}

/* ---------- 5 · odometri deneyi ve kare görevi ---------- */
export function odometriDeneyi(_a: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const d: { capSag: number; kayma: number } = { capSag: MBOT2.tekerCapi, kayma: 0 };
  const alan = izAlani("Robotun sandığı kare ve gerçek iz", { x0: -45, x1: 15, y0: -15, y1: 45 });
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const f = formuller();
  const kap = el("div", "rs mb", { "data-deney": "odometri" });
  const N1 = 537, N2 = 162;
  const ciz = () => {
    const sandigi = kareSur(N1, N2), gercek = kareSur(N1, N2, { capSol: MBOT2.tekerCapi, capSag: d.capSag, tekerArasi: MBOT2.tekerArasi * (1 + d.kayma / 100) });
    const h = kareHatasi(gercek.son);
    alan.ciz([izCizgisi(sandigi.iz, "#8E89C0", true), izCizgisi(gercek.iz, "#6A48F0"), robot2(gercek.son)]);
    yazi.textContent = h.mesafe < 0.5 && h.yon < 1 ? "Teker çapı doğru, kayma yok: robot kareyi kapattı." : `Robot kareyi kapattığını sanıyor; gerçekte başlangıçtan ${sayi(h.mesafe, 1)} cm uzakta ve ${sayi(h.yon, 1)}° yanlış yöne bakıyor.`;
    f.yaz([["yol = (enkoder açısı / 360) · π · d", `(${N1} / 360) · π · ${sayi(MBOT2.tekerCapi, 1)} = ${sayi(enkoderYolu(N1), 1)} cm`], ["sağ teker gerçekte", `(${N1} / 360) · π · ${sayi(d.capSag)} = ${sayi(enkoderYolu(N1, d.capSag), 1)} cm`]]);
    kap.dataset.hata = sayi(h.mesafe, 1);
  };
  const dene = () => denendi(`${d.capSag},${d.kayma}`);
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, alan.svg), el("div", "lb-yan", {},
    kaydirici({ etiket: "Sağ tekerin gerçek çapı", en: 6.2, ust: 6.6, adim: 0.02, birim: "cm", baslangic: d.capSag, bicim: (v) => sayi(v), degisince: (v) => { d.capSag = v; ciz(); }, birakinca: dene }),
    kaydirici({ etiket: "Dönüşte kayma", en: 0, ust: 10, adim: 1, birim: "%", baslangic: d.kayma, degisince: (v) => { d.kayma = v; ciz(); }, birakinca: dene }),
    yazi, f.kap, el("p", "lb-not", {}, `Program: 30 cm kenarlı kare; dört kez "iki teker ${N1}° düz, sonra sola 90° dön". Kesik çizgi robotun enkoderle hesapladığı iz, mor çizgi gerçek iz.`))));
  ciz();
  return kap;
}
function kareGorevi(yildiz: (n: number) => void): HTMLElement {
  const d = { N1: 720, N2: 180 };
  const alan = izAlani("Kare: robotun izi", { x0: -70, x1: 20, y0: -20, y1: 70 });
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-gorev": "kontrol", "data-kontrol": "kare" });
  const ciz = (iz: Poz2[] | null) => alan.ciz([s("rect", { x: -KARE.kenar, y: -KARE.kenar, width: KARE.kenar, height: KARE.kenar, fill: "none", stroke: "#18A058", "stroke-width": 0.8, "stroke-dasharray": "3 2" }), ...(iz ? [izCizgisi(iz, "#6A48F0"), robot2(iz[iz.length - 1])] : [robot2({ x: 0, y: 0, aci: Math.PI / 2 }, "#1E88E5", true)])]);
  const calistir = dugme({ metin: "Çalıştır", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", () => {
    const { iz } = kareSur(d.N1, d.N2), r = kareYildizi(d.N1, d.N2);
    ciz(iz); kap.dataset.yildiz = String(r.yildiz);
    sonucYaz(sonuc, r.yildiz, `kenar ${sayi(r.kenar, 1)} cm, başlangıca uzaklık ${sayi(r.mesafe, 1)} cm, yön hatası ${sayi(r.yon, 1)}°`, [[r.yildiz >= 1, "Kenar ±5 cm, dönüş hatası ≤ 6 cm ve ≤ 15°"], [r.yildiz >= 2, "Kenar ±2 cm, ≤ 2 cm ve ≤ 6°"], [r.yildiz >= 3, "Kenar ±0,5 cm, ≤ 0,5 cm ve ≤ 2°"]]);
    if (r.yildiz) yildiz(r.yildiz);
  });
  kap.append(el("p", "lb-not", {}, `mBot2 ${KARE.kenar} cm kenarlı kare çizecek: dört kez "iki teker N1° düz, sonra sol teker −N2°, sağ teker +N2° (sola dön)". Teker çapı ${sayi(MBOT2.tekerCapi, 1)} cm, iki teker arası ${sayi(MBOT2.tekerArasi, 1)} cm. N1 ve N2'yi hesapla; enkoder tam derece sayar.`),
    el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, alan.svg), el("div", "lb-yan", {},
      sayiKutusu({ etiket: "N1 (düz, derece)", en: KARE.N1.en, ust: KARE.N1.ust, adim: 1, baslangic: d.N1, birim: "°", degisince: (v) => { d.N1 = v; } }),
      sayiKutusu({ etiket: "N2 (dönüş, derece)", en: KARE.N2.en, ust: KARE.N2.ust, adim: 1, baslangic: d.N2, birim: "°", degisince: (v) => { d.N2 = v; } }),
      el("p", "lb-not", {}, "İpucu: yerinde 90° dönerken her teker, yarıçapı L/2 olan çemberin dörtte birini gider."),
      el("div", "rs-kontrol", {}, calistir))), sonuc);
  ciz(null);
  return kap;
}

/* ---------- 6 · model farkı deneyi ve sağlam ayar görevi ---------- */
const HAZIR_AYARLAR: [string, string, CizgiAyari][] = [["kit", "Kit ayarı", { ...KIT_AYARI }], ["hizli", "Hızlı ve sert", { taban: 200, kp: 0.04, kd: 0.6 }], ["yumusak", "Yavaş ve yumuşak", { taban: 100, kp: 0.01, kd: 0.2 }]];
function surumSonuclari(r: CizgiSonucu[]): HTMLElement {
  return el("ul", "kn-surumler", {}, ...SURUMLER.map((x, i) => el("li", r[i].durum === "bitti" ? "tamam" : "", { "data-surum": String(i) }, el("i", "", { style: `background:${RENK[i]}` }), el("b", "", {}, x.ad), ` · ${turYazisi(r[i])}`)));
}
export function modelFarkiDeneyi(_a: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const p = pistCizimi("Aynı ayar üç robot sürümünde");
  const liste = el("div", "", { "aria-live": "polite" });
  const kap = el("div", "rs mb", { "data-deney": "model-farki" });
  const calis = (k: string, bildir = true) => {
    const a = HAZIR_AYARLAR.find((x) => x[0] === k)![2];
    const r = SURUMLER.map((x) => donguKos(a, x.dongu));
    p.ciz(r); liste.replaceChildren(surumSonuclari(r));
    kap.dataset.biten = String(r.filter((x) => x.durum === "bitti").length);
    if (bildir) denendi(k);
  };
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, p.svg), el("div", "lb-yan", {},
    el("div", "", {}, el("span", "rs-etiket", {}, "Ayar"), secici("Ayar", HAZIR_AYARLAR.map(([k, ad]) => [k, ad]), "kit", (k) => calis(k))), liste,
    el("ul", "kn-surum-aciklama", {}, ...SURUMLER.map((x, i) => el("li", "", {}, el("i", "", { style: `background:${RENK[i]}` }), el("b", "", {}, x.ad), `: ${x.aciklama}`))))));
  calis("kit", false);
  return kap;
}
function saglamAyarGorevi(yildiz: (n: number) => void): HTMLElement {
  const a: CizgiAyari = { ...KIT_AYARI };
  const p = pistCizimi("Üç robot sürümünün izi");
  const liste = el("div", "", { "aria-live": "polite" }), sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-gorev": "kontrol", "data-kontrol": "saglam-ayar" });
  const calistir = dugme({ metin: "Üç robotta dene", tur: "ana", ikon: "oynat", id: "kn-calistir" });
  calistir.addEventListener("click", () => {
    const r = saglamDegerlendir(a);
    p.ciz(r.sonuclar); liste.replaceChildren(surumSonuclari(r.sonuclar)); kap.dataset.yildiz = String(r.yildiz);
    sonucYaz(sonuc, r.yildiz, Number.isFinite(r.enKotu) ? `en yavaş tur ${sayi(r.enKotu)} sn` : "bir sürüm bitiremedi", [[r.yildiz >= 1, "Üç sürüm de pisti bitirsin"], [r.yildiz >= 2, `En yavaş tur ≤ ${sayi(SAGLAM_ESIKLERI[0])} sn`], [r.yildiz >= 3, `En yavaş tur ≤ ${sayi(SAGLAM_ESIKLERI[1])} sn`]]);
    if (r.yildiz) yildiz(r.yildiz);
  });
  kap.append(el("p", "lb-not", {}, "Tek bir ayar bul: simülasyondaki robotta, ağır robotta ve zayıf pilli, yavaş kartlı robotta pisti bitirsin. Gerçek robot modelden farklıdır; ayar sağlam olmalı."),
    el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, p.svg), el("div", "lb-yan", {}, ...cizgiAyarlari(a, () => { }), el("div", "rs-kontrol", {}, calistir), liste)), sonuc);
  return kap;
}

/** Ders sayfasındaki kontrol görevleri */


export function kontrolGorevi(ad: string, yildiz: (n: number) => void): HTMLElement {
  switch (ad) {
    case "hedef-yay": return hedefYayGorevi(yildiz);
    case "yukte-hiz": return yukteHizGorevi(yildiz);
    case "yavas-dongu": return yavasDonguGorevi(yildiz);
    case "rampa": return rampaGorevi(yildiz);
    case "kare": return kareGorevi(yildiz);
    default: return saglamAyarGorevi(yildiz);
  }
}


export const KONTROL_STILI = `
.kn-alan{display:block;width:100%;max-width:460px;height:auto;border-radius:var(--sra2-kose-2)}
.kn-pist{display:block;width:100%;max-width:520px;height:auto;border-radius:var(--sra2-kose-2)}
.kn-grafik{width:100%;height:auto;background:#fff;border-radius:var(--sra2-kose-2)}
.kn-grafikler{display:grid;gap:12px;min-width:0}
.kn-eksen-ad{font-weight:800}
.kn-isaret{fill:#4E4A7A;font-weight:800}
.kn-formul{display:grid;grid-template-columns:auto;gap:2px 0;margin:0;padding:10px 12px;border-radius:12px;background:var(--sra2-lavanta)}
.kn-formul dt{font:800 var(--sra2-boy-1) var(--sra2-yazi-kod);color:var(--sra2-mor-taban);margin-top:6px}
.kn-formul dt:first-child{margin-top:0}
.kn-formul dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.kn-sayi-satir{display:grid;gap:6px}
.kn-sayi-grup{display:flex;align-items:center;gap:8px;--kp:#6A48F0}
.kn-sayi{width:9ch;-moz-appearance:textfield;appearance:textfield;font:800 var(--sra2-boy-2) var(--sra2-yazi-kod);border:2px solid var(--sra2-murekkep);border-radius:10px;padding:8px 10px;text-align:center}
.kn-birim{font-weight:800}
.kn-sayi::-webkit-inner-spin-button,.kn-sayi::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.kn-surumler,.kn-surum-aciklama{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-weight:700}
.kn-surumler li,.kn-surum-aciklama li{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.kn-surumler i,.kn-surum-aciklama i{width:18px;height:6px;border-radius:3px;flex:none}
.kn-surumler li:not(.tamam){color:#C0262D}
.kn-surum-aciklama{color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1)}
`;
