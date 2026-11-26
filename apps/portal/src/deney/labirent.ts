/* Labirent modülünün deneyleri ve kodsuz görevleri (RizBot). Hepsi üstten bakış SVG.
   Motor robot-motoru'da: kurallar (kuralKos) Lab'daki Python örnek çözümleriyle aynı izi verir, rota süresi Lab'daki
   labirent motorunun hesabıdır. Hareketi azaltta oynatma yapılmaz, son durum hemen çizilir. */
import { dugme, el, kaydirici, secici, yildizlar } from "@sra/tasarim/v2";
import {
  DERS_LABIRENTLERI, haritaOku, HAZIR_ROTALAR, hizProfili, KURAL_ADLARI, KURAL_DAL_SATIRLARI, KURAL_KODLARI, kuralKos, mebPuani, RIZBOT, ROTA_GOREVLERI,
  rotaHesapla, rotaYildizi, SIS_GOREVLERI, SisliLabirent, sisYildizi,
  type Hucre, type KuralAdi, type LabirentHaritasi, type Taraf, type Yon
} from "@sra/robot-motoru";

const NS = "http://www.w3.org/2000/svg";
const s = (ad: string, at: Record<string, string | number> = {}) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
const azHareket = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const virgul = (n: number, b = 2) => n.toFixed(b).replace(".", ",");
/** tam sayıysa ondalıksız */
const sayiYaz = (n: number) => (Number.isInteger(n) ? String(n) : virgul(n));
const H = 100;              // hücre: 100 çizim birimi = 20 cm
const D = 9;                // duvar kalınlığı: 18 mm
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const YON_ADI = ["yukarı", "sağa", "aşağı", "sola"];
const RENK = { yol1: "#F5A300", yol2: "#B9A6FF", iz: "rgba(185,166,255,.28)", isin: "#FFC531" };
const harita = (ad: unknown) => DERS_LABIRENTLERI[String(ad)] ?? DERS_LABIRENTLERI["sag-el"];

/* ---------- ortak labirent çizimi ---------- */
interface LabirentCizimi {
  svg: SVGSVGElement;
  robot(x: number, y: number, yon: Yon): void;
  iz(hucreler: Hucre[]): void;
  isaretler(sayilar: Map<string, number>): void;
  yollar(liste: { yol: Hucre[]; renk: string }[]): void;
  isinlar(x: number, y: number, yon: Yon, okumalar: { taraf: Taraf; duvar: boolean }[]): void;
  /** sisli labirent: yalnız görülen hücrelerin duvarları; diğer hücreler örtülü */
  sis(goruldu: (x: number, y: number) => boolean): void;
  h: LabirentHaritasi;
}
function labirentCizimi(m: readonly string[], etiket: string): LabirentCizimi {
  const h = haritaOku(m), pay = 10;
  const svg = s("svg", { viewBox: `${-pay} ${-pay} ${h.genislik * H + 2 * pay} ${h.yukseklik * H + 2 * pay}`, class: "lb-svg", role: "img", "aria-label": etiket }) as SVGSVGElement;
  svg.append(s("rect", { x: -pay, y: -pay, width: h.genislik * H + 2 * pay, height: h.yukseklik * H + 2 * pay, rx: 10, fill: "#1D1B19" }));
  const katman = () => { const g = s("g"); svg.append(g); return g; };
  const izK = katman(), yolK = katman(), sisK = katman();
  /* başlangıç ve bitiş: bitiş hücresinde beyaz alan (MEB) */
  const b = h.baslangic, f = h.bitis;
  svg.append(s("rect", { x: b.x * H + 10, y: b.y * H + 10, width: H - 20, height: H - 20, rx: 8, fill: "none", stroke: "#2FBF71", "stroke-width": 5, "stroke-dasharray": "10 8" }));
  svg.append(s("rect", { x: f.x * H + 14, y: f.y * H + 14, width: H - 28, height: H - 28, rx: 6, fill: "#F7F7F4" }));
  const ft = s("text", { x: f.x * H + H / 2, y: f.y * H + H / 2 + 8, "text-anchor": "middle", class: "lb-bitis" }); ft.textContent = "Bitiş"; svg.append(ft);
  const isaretK = katman();
  /* duvarlar: her hücrenin üst ve sol kenarı, en alt ve en sağ dış kenar */
  const duvarlar: { e: SVGElement; a: [number, number]; b?: [number, number] }[] = [];
  const duvar = (x1: number, y1: number, x2: number, y2: number, a: [number, number], bb?: [number, number]) => {
    const e = s("line", { x1, y1, x2, y2, stroke: "#F7F7F4", "stroke-width": D, "stroke-linecap": "square" });
    duvarlar.push({ e, a, b: bb }); svg.append(e);
  };
  const d = (x: number, y: number) => h.duvar[y * h.genislik + x];
  for (let y = 0; y < h.yukseklik; y++) for (let x = 0; x < h.genislik; x++) {
    if (d(x, y) & 1) duvar(x * H, y * H, (x + 1) * H, y * H, [x, y], y > 0 ? [x, y - 1] : undefined);
    if (d(x, y) & 8) duvar(x * H, y * H, x * H, (y + 1) * H, [x, y], x > 0 ? [x - 1, y] : undefined);
    if (y === h.yukseklik - 1 && d(x, y) & 4) duvar(x * H, (y + 1) * H, (x + 1) * H, (y + 1) * H, [x, y]);
    if (x === h.genislik - 1 && d(x, y) & 2) duvar((x + 1) * H, y * H, (x + 1) * H, (y + 1) * H, [x, y]);
  }
  const isinK = katman();
  const robotG = s("g", { class: "lb-robot" });
  robotG.append(s("rect", { x: -22, y: -25, width: 44, height: 50, rx: 12, fill: "#6A48F0", stroke: "#fff", "stroke-width": 4 }), s("path", { d: "M0 -16 L11 2 L-11 2 Z", fill: "#fff" }));
  svg.append(robotG);
  const merkez = (x: number, y: number) => [x * H + H / 2, y * H + H / 2];
  return {
    svg, h,
    robot(x, y, yon) { const [cx, cy] = merkez(x, y); robotG.setAttribute("transform", `translate(${cx} ${cy}) rotate(${yon * 90})`); },
    iz(hucreler) {
      izK.replaceChildren(...[...new Set(hucreler.map(([x, y]) => `${x},${y}`))].map((k) => { const [x, y] = k.split(",").map(Number); return s("rect", { x: x * H + 4, y: y * H + 4, width: H - 8, height: H - 8, fill: RENK.iz }); }));
    },
    isaretler(sayilar) {
      isaretK.replaceChildren(...[...sayilar].filter(([, n]) => n > 0).map(([k, n]) => {
        const [x, y] = k.split(",").map(Number), g = s("g", { class: "lb-isaret" });
        g.append(s("circle", { cx: x * H + 17, cy: y * H + 17, r: 12, fill: n >= 2 ? "#FFC531" : "#D8D5FA" }));
        const t = s("text", { x: x * H + 17, y: y * H + 22.5, "text-anchor": "middle" }); t.textContent = String(n); g.append(t);
        return g;
      }));
    },
    yollar(liste) {
      yolK.replaceChildren(...liste.map(({ yol, renk }, i) => {
        const kay = (i - (liste.length - 1) / 2) * 10;
        return s("polyline", { points: yol.map(([x, y]) => `${x * H + H / 2 + kay},${y * H + H / 2 + kay}`).join(" "), fill: "none", stroke: renk, "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.95 });
      }));
    },
    isinlar(x, y, yon, okumalar) {
      const [cx, cy] = merkez(x, y);
      isinK.replaceChildren(...okumalar.map(({ taraf, duvar: var_ }) => {
        const yn = (taraf === "on" ? yon : taraf === "sol" ? (yon + 3) % 4 : (yon + 1) % 4) as Yon;
        const uz = var_ ? H / 2 - D / 2 : H * 0.95;
        return s("line", { x1: cx, y1: cy, x2: cx + DX[yn] * uz, y2: cy + DY[yn] * uz, stroke: var_ ? RENK.isin : "rgba(255,255,255,.35)", "stroke-width": var_ ? 7 : 4, "stroke-dasharray": var_ ? "" : "8 8", "stroke-linecap": "round" });
      }));
    },
    sis(goruldu) {
      const ortu: SVGElement[] = [];
      for (let y = 0; y < h.yukseklik; y++) for (let x = 0; x < h.genislik; x++) if (!goruldu(x, y)) ortu.push(s("rect", { x: x * H + 1, y: y * H + 1, width: H - 2, height: H - 2, fill: "#3A365E" }));
      sisK.replaceChildren(...ortu);
      for (const w of duvarlar) w.e.style.display = goruldu(...w.a) || (w.b && goruldu(...w.b)) ? "" : "none";
    }
  };
}

/* ---------- 1 · duvar sensörü deneyi ---------- */
const TARAF_ADI: Record<Taraf, string> = { sol: "sol", on: "ön", sag: "sağ" };
export function duvarSensoru(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  let duvarlar = 0b1001, yon: Yon = 0; // başta: kuzey ve batı duvarı var, robot kuzeye bakıyor
  const pay = 12, B = 3 * H;
  const svg = s("svg", { viewBox: `${H - pay - 40} ${H - pay - 40} ${H + 2 * pay + 80} ${H + 2 * pay + 80}`, class: "lb-svg lb-svg--hucre", role: "group", "aria-label": "Bir labirent hücresi ve RizBot. Kenarlara dokunarak duvar koy ya da kaldır." });
  svg.append(s("rect", { x: 0, y: 0, width: B, height: B, fill: "#1D1B19" }));
  const kenarlar: SVGElement[] = [];
  const isinK = s("g"); svg.append(isinK);
  const robotG = s("g");
  robotG.append(s("rect", { x: -27, y: -30, width: 54, height: 62, rx: 14, fill: "#6A48F0", stroke: "#fff", "stroke-width": 4 }), s("path", { d: "M0 -20 L13 2 L-13 2 Z", fill: "#fff" }));
  const KENAR_ADI = ["Yukarıdaki", "Sağdaki", "Aşağıdaki", "Soldaki"];
  for (let k = 0; k < 4; k++) {
    const yatay = k % 2 === 0, x = k === 1 ? 2 * H : H, y = k === 2 ? 2 * H : H;
    const g = s("g", { class: "lb-kenar", tabindex: 0, role: "button", "data-kenar": k });
    /* geniş dokunma alanı + görünen duvar */
    g.append(s("rect", { x: yatay ? x : x - 22, y: yatay ? y - 22 : y, width: yatay ? H : 44, height: yatay ? 44 : H, fill: "transparent" }),
      s("line", { class: "lb-kenar-duvar", x1: x, y1: y, x2: yatay ? x + H : x, y2: yatay ? y : y + H, "stroke-width": D, "stroke-linecap": "square" }));
    const degis = () => { duvarlar ^= 1 << k; guncelle(true); };
    g.addEventListener("click", degis);
    g.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); degis(); } });
    kenarlar.push(g); svg.append(g);
  }
  svg.append(robotG);
  const okumaYeri = el("div", "lb-okumalar");
  const karar = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const donBtn = dugme({ metin: "Robotu sağa döndür", tur: "ikincil", id: "lb-don" });
  donBtn.addEventListener("click", () => { yon = ((yon + 1) % 4) as Yon; guncelle(true); });
  const kap = el("div", "rs-duzen lb", { "data-deney": "duvar-sensoru" }, el("div", "lb-sahne", {}, svg),
    el("div", "lb-yan", {}, el("p", "lb-baslik", {}, "RizBot'un duvar sensörleri"), okumaYeri, karar, el("div", "rs-kontrol", {}, donBtn),
      el("p", "lb-not", {}, "Kızılötesi ışık beyaz duvardan geri yansır: sensör yansımayı görürse duvar var demektir.")));
  const guncelle = (deneme: boolean) => {
    robotG.setAttribute("transform", `translate(${1.5 * H} ${1.5 * H}) rotate(${yon * 90})`);
    kenarlar.forEach((g, k) => {
      const var_ = !!(duvarlar & (1 << k));
      g.classList.toggle("var", var_);
      g.setAttribute("aria-pressed", String(var_));
      g.setAttribute("aria-label", `${KENAR_ADI[k]} duvar: ${var_ ? "var" : "yok"}`);
    });
    const oku = (t: Taraf) => { const yn = t === "on" ? yon : t === "sol" ? (yon + 3) % 4 : (yon + 1) % 4; return !!(duvarlar & (1 << yn)); };
    const okumalar = (["sol", "on", "sag"] as Taraf[]).map((t) => ({ taraf: t, duvar: oku(t) }));
    isinK.replaceChildren(...okumalar.map(({ taraf, duvar }) => {
      const yn = taraf === "on" ? yon : taraf === "sol" ? (yon + 3) % 4 : (yon + 1) % 4, uz = duvar ? H / 2 - D / 2 : H * 0.9;
      return s("line", { x1: 1.5 * H, y1: 1.5 * H, x2: 1.5 * H + DX[yn] * uz, y2: 1.5 * H + DY[yn] * uz, stroke: duvar ? RENK.isin : "rgba(255,255,255,.35)", "stroke-width": duvar ? 7 : 4, "stroke-dasharray": duvar ? "" : "8 8", "stroke-linecap": "round" });
    }));
    okumaYeri.replaceChildren(...okumalar.map(({ taraf, duvar }) => el("div", duvar ? "lb-okuma var" : "lb-okuma", { "data-taraf": taraf },
      el("i", "", {}), el("code", "", {}, `duvar_${taraf}()`), el("b", "", {}, duvar ? "True" : "False"), el("small", "", {}, duvar ? `${TARAF_ADI[taraf]}da duvar var` : `${TARAF_ADI[taraf]} açık`))));
    const [sol, on, sag] = okumalar.map((o) => o.duvar);
    karar.textContent = !sag ? "Sağ el kuralı: sağ açık, sağa dön ve ilerle." : !on ? "Sağ el kuralı: sağ kapalı, ön açık, düz ilerle." : !sol ? "Sağ el kuralı: sağ ve ön kapalı, sola dön." : "Üç taraf kapalı: çıkmaz! Sola dönmeye devam et, geri çık.";
    kap.dataset.okuma = `${+sol}${+on}${+sag}`;
    if (deneme) denendi(`${duvarlar}-${yon}`);
  };
  guncelle(false);
  return kap;
}

/* ---------- 2 · kural adım adım ---------- */
const DAL_YAZISI = ["Sağ açık: sağa dön ve bir hücre ilerle.", "Sağ kapalı, ön açık: bir hücre ilerle.", "Sağ ve ön kapalı: sola dön."];
const DAL_YAZISI_SOL = ["Sol açık: sola dön ve bir hücre ilerle.", "Sol kapalı, ön açık: bir hücre ilerle.", "Sol ve ön kapalı: sağa dön."];
function kodSatirlari(kod: string): { kap: HTMLElement; vurgula(satirlar: number[]): void } {
  const satirlar = kod.replace(/\n$/, "").split("\n").map((l, i) => el("li", "", { "data-satir": String(i + 1) }, el("code", "", {}, l || " ")));
  return { kap: el("ol", "lb-kod", { "aria-label": "Kural" }, ...satirlar), vurgula(v) { satirlar.forEach((l, i) => l.classList.toggle("aktif", v.includes(i + 1))); } };
}
export function kuralAdim(ayar: Record<string, unknown>, denendi: (d: number) => void): HTMLElement {
  const kural = (ayar.kural === "sol-el" ? "sol-el" : "sag-el") as "sag-el" | "sol-el";
  const m = harita(ayar.harita), k = kuralKos(m, kural, { sureSiniri: 120 });
  const c = labirentCizimi(m, `${KURAL_ADLARI[kural]} labirentte adım adım`);
  const kod = kodSatirlari(KURAL_KODLARI[kural]);
  const durum = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const sayac = el("p", "lb-sayac", {}, "");
  let i = -1, zamanlayici = 0;
  const baslaBtn = dugme({ metin: "Baştan", id: "ka-bastan", kucuk: true }) as HTMLButtonElement;
  const geriBtn = dugme({ metin: "Geri", ikon: "geri", id: "ka-geri", kucuk: true }) as HTMLButtonElement;
  const adimBtn = dugme({ metin: "Bir adım", tur: "ana", ikon: "ileri", ikonSonda: true, id: "ka-adim" }) as HTMLButtonElement;
  const oynatBtn = dugme({ metin: "Oynat", tur: "mor", ikon: "oynat", id: "ka-oynat" }) as HTMLButtonElement;
  const kap = el("div", "rs-duzen lb", { "data-deney": "kural-adim" }, el("div", "lb-sahne", {}, c.svg),
    el("div", "lb-yan", {}, el("p", "lb-baslik", {}, KURAL_ADLARI[kural]), kod.kap, durum, sayac, el("div", "rs-kontrol", {}, baslaBtn, geriBtn, adimBtn, oynatBtn)));
  const ciz = () => {
    const a = k.adimlar[i];
    const izHucreleri: Hucre[] = [[c.h.baslangic.x, c.h.baslangic.y]];
    for (let j = 0; j <= i; j++) izHucreleri.push([k.adimlar[j].x, k.adimlar[j].y]);
    c.iz(izHucreleri);
    if (!a) { c.robot(c.h.baslangic.x, c.h.baslangic.y, 0); c.isinlar(0, 0, 0, []); kod.vurgula([1]); durum.textContent = "Robot başlangıçta, yukarı bakıyor. \"Bir adım\"a bas."; }
    else {
      /* adımın başındaki konumda okunan sensörler */
      const ilkKare = k.sim.iz[a.izBas - 1] ?? k.sim.iz[0];
      const okumalar = k.sim.iz.slice(a.izBas, a.izSon + 1).filter((z) => z.olay === "bak").map((z) => z.sensor!);
      c.robot(a.x, a.y, a.yon);
      c.isinlar(ilkKare.x, ilkKare.y, ilkKare.yon, okumalar);
      const dal = a.dal as number;
      kod.vurgula(KURAL_DAL_SATIRLARI[kural][dal]);
      durum.textContent = (kural === "sol-el" ? DAL_YAZISI_SOL : DAL_YAZISI)[dal];
    }
    const bitti = i === k.adimlar.length - 1 && k.sim.bittiMi();
    if (bitti) durum.textContent += " Bitişe vardı!";
    kap.dataset.adim = String(i + 1);
    kap.dataset.bitti = String(bitti);
    sayac.textContent = `Adım ${i + 1} / ${k.adimlar.length}`;
    geriBtn.disabled = baslaBtn.disabled = i < 0;
    adimBtn.disabled = i >= k.adimlar.length - 1;
  };
  const dur = () => { clearInterval(zamanlayici); zamanlayici = 0; oynatBtn.querySelector("span:not(.s2-ikon)")!.textContent = "Oynat"; };
  const git = (n: number) => { i = Math.max(-1, Math.min(k.adimlar.length - 1, n)); ciz(); if (i >= 0) denendi(i); };
  baslaBtn.addEventListener("click", () => { dur(); git(-1); });
  geriBtn.addEventListener("click", () => { dur(); git(i - 1); });
  adimBtn.addEventListener("click", () => { dur(); git(i + 1); });
  oynatBtn.addEventListener("click", () => {
    if (zamanlayici) return dur();
    if (i >= k.adimlar.length - 1) i = -1;
    if (azHareket()) { for (let j = i + 1; j < k.adimlar.length; j++) denendi(j); git(k.adimlar.length - 1); return; }
    oynatBtn.querySelector("span:not(.s2-ikon)")!.textContent = "Duraklat";
    zamanlayici = window.setInterval(() => { if (!document.body.contains(kap) || i >= k.adimlar.length - 1) { dur(); return; } git(i + 1); }, 450);
  });
  ciz();
  return kap;
}

/* ---------- 3 · sisli labirent (deney ve görev) ---------- */
interface SisOyunu { kap: HTMLElement; s: SisliLabirent; yeniden(): void }
function sisOyunu(m: readonly string[], olay: (s: SisliLabirent, sonuc: string) => void): SisOyunu {
  const c = labirentCizimi(m, "Sisli labirent: yalnız robotun geçtiği hücreleri görürsün. Ok tuşlarıyla sür.");
  c.svg.setAttribute("tabindex", "0"); c.svg.setAttribute("role", "application");
  const bilgi = el("p", "lb-karar", { "aria-live": "polite" }, "Ok tuşlarıyla ya da düğmelerle RizBot'u sür. Geçtiğin hücrelerin köşesinde kaç kez geçtiğin yazar.");
  const sayac = el("p", "lb-sayac", {}, "");
  const o: SisOyunu = { kap: el("div"), s: new SisliLabirent(m), yeniden() { o.s = new SisliLabirent(m); son = 0; ciz(); } };
  let son: Yon = 0;
  const ciz = () => {
    c.sis((x, y) => o.s.goruldu(x, y));
    c.isaretler(o.s.ziyaret);
    c.robot(o.s.x, o.s.y, son);
    sayac.textContent = `${o.s.adim} adım`;
    o.kap.dataset.adim = String(o.s.adim);
    o.kap.dataset.bitti = String(o.s.bitti);
  };
  const git = (yon: Yon) => {
    son = yon;
    const r = o.s.git(yon);
    bilgi.textContent = r === "duvar" ? `${YON_ADI[yon][0].toUpperCase() + YON_ADI[yon].slice(1)} duvar var, gidemezsin.` : r === "bitti" ? `Bitişe vardın: ${o.s.adim} adım.` : (o.s.ziyaret.get(`${o.s.x},${o.s.y}`) ?? 0) >= 2 ? "Burada daha önce bulundun." : "Yeni bir hücre.";
    ciz();
    olay(o.s, r);
  };
  const tus = (yon: Yon, ad: string, sembol: string) => {
    const b = el("button", "lb-ok", { type: "button", "aria-label": ad, "data-yon": String(yon) }, sembol);
    b.addEventListener("click", () => git(yon));
    return b;
  };
  c.svg.addEventListener("keydown", (e) => {
    const yon = ({ ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 } as Record<string, Yon>)[e.key];
    if (yon === undefined) return;
    e.preventDefault(); git(yon);
  });
  o.kap = el("div", "rs-duzen lb", {}, el("div", "lb-sahne", {}, c.svg),
    el("div", "lb-yan", {}, sayac, bilgi,
      el("div", "lb-oklar", { role: "group", "aria-label": "Robotu sür" }, el("span"), tus(0, "Yukarı", "↑"), el("span"), tus(3, "Sola", "←"), tus(2, "Aşağı", "↓"), tus(1, "Sağa", "→"))));
  ciz();
  return o;
}
export function sisliLabirent(ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const o = sisOyunu(harita(ayar.harita), (s, r) => { if (r !== "duvar") denendi(`${s.x},${s.y}`); });
  const yeniden = dugme({ metin: "Baştan başla", id: "sl-yeniden", kucuk: true });
  yeniden.addEventListener("click", () => o.yeniden());
  o.kap.querySelector(".lb-yan")!.append(el("div", "rs-kontrol", {}, yeniden));
  o.kap.dataset.deney = "sisli-labirent";
  return o.kap;
}
/** Sisli labirent görevi: iki labirent sırayla; ikisi de bitince toplam adıma göre yıldız */
export function sisGorevi(gorevAdi: string, yildiz: (n: number) => void): HTMLElement {
  const g = SIS_GOREVLERI[gorevAdi];
  const adimlar: (number | null)[] = g.haritalar.map(() => null);
  let sira = 0;
  const yer = el("div"), sonuc = el("p", "rs-sonuc", { "aria-live": "polite" }, "");
  const sekme = el("p", "lb-baslik", {}, "");
  const kap = el("div", "rs lb-gorev", { "data-gorev": "sis" }, el("p", "lb-not", {}, `Üç yıldız için iki labirentte toplam en çok ${g.esikler[1]} adım; iki yıldız için ${g.esikler[0]} adım.`), sekme, yer, sonuc);
  const yaz = () => {
    const n = sisYildizi(g, adimlar);
    kap.dataset.yildiz = String(n);
    const toplam = adimlar.reduce<number>((t, a) => t + (a ?? 0), 0);
    sonuc.replaceChildren(...(adimlar.every((a) => a !== null)
      ? [yildizlar(3, n), el("b", "", {}, ` ${n} / 3 yıldız · toplam ${toplam} adım`)]
      : [el("b", "", {}, adimlar.map((a, i) => `${i + 1}. labirent: ${a === null ? "bitmedi" : a + " adım"}`).join(" · "))]));
  };
  const ac = (i: number) => {
    sira = i;
    sekme.textContent = `${i + 1}. labirent / ${g.haritalar.length}`;
    const o = sisOyunu(DERS_LABIRENTLERI[g.haritalar[i]], (s, r) => {
      if (r !== "bitti") return;
      adimlar[sira] = s.adim; yaz();
      const sonraki = adimlar.findIndex((a) => a === null);
      if (sonraki >= 0) {
        const b = dugme({ metin: `${sonraki + 1}. labirente geç`, tur: "ana", ikon: "ileri", ikonSonda: true, id: "sg-sonraki" });
        b.addEventListener("click", () => ac(sonraki));
        o.kap.querySelector(".lb-yan")!.append(el("div", "rs-kontrol", {}, b));
      } else {
        yildiz(sisYildizi(g, adimlar));
        const b = dugme({ metin: "Yeniden dene", ikon: "geri", id: "sg-yeniden" });
        b.addEventListener("click", () => { adimlar.fill(null); yaz(); ac(0); });
        o.kap.querySelector(".lb-yan")!.append(el("div", "rs-kontrol", {}, b));
      }
    });
    yer.replaceChildren(o.kap);
  };
  ac(0); yaz();
  return kap;
}

/* ---------- 4 · ada deneyi ---------- */
export function adaDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const m = DERS_LABIRENTLERI.ada;
  const robotlar = (["sag-el", "hafiza"] as KuralAdi[]).map((kural) => {
    const k = kuralKos(m, kural, { sureSiniri: 60 });
    const c = labirentCizimi(m, kural === "hafiza" ? "Hafızalı robot ada labirentinde" : "Sağ el kuralı ada labirentinde");
    const hareketler = k.sim.iz.filter((z) => z.olay === "ileri");
    const sayac = el("p", "lb-sayac", {}, "");
    const kutu = el("div", "lb-ada", { "data-robot": kural }, el("p", "lb-baslik", {}, KURAL_ADLARI[kural]), c.svg, sayac);
    return { kural, k, c, hareketler, sayac, kutu };
  });
  const [sag, haf] = robotlar;
  /* sağ el kuralı üç kez başlangıca dönene kadar oynatılır */
  let donus = 0, sinir = sag.hareketler.length;
  sag.hareketler.forEach((z, i) => { if (z.x === sag.c.h.baslangic.x && z.y === sag.c.h.baslangic.y && ++donus === 3 && sinir === sag.hareketler.length) sinir = i + 1; });
  const son = Math.max(sinir, haf.hareketler.length);
  let n = 0, zamanlayici = 0;
  const ciz = () => {
    for (const r of robotlar) {
      const h = r.hareketler.slice(0, Math.min(n, r.kural === "sag-el" ? sinir : r.hareketler.length));
      const b = r.c.h.baslangic, sonK = h[h.length - 1];
      r.c.iz([[b.x, b.y], ...h.map((z) => [z.x, z.y] as Hucre)]);
      r.c.robot(sonK?.x ?? b.x, sonK?.y ?? b.y, sonK?.yon ?? 0);
      if (r.kural === "hafiza") {
        const say = new Map<string, number>([[`${b.x},${b.y}`, 1]]);
        for (const z of h) say.set(`${z.x},${z.y}`, (say.get(`${z.x},${z.y}`) ?? 0) + 1);
        r.c.isaretler(say);
        const bitti = n >= r.hareketler.length && r.k.sim.bittiMi();
        r.sayac.textContent = `${h.length} hücre${bitti ? " · adaya girdi, bitişe vardı!" : ""}`;
        r.kutu.dataset.bitti = String(bitti);
      } else {
        const tur = h.filter((z) => z.x === b.x && z.y === b.y).length;
        r.sayac.textContent = `${h.length} hücre · başlangıca ${tur} kez döndü`;
        r.kutu.dataset.tur = String(tur);
      }
    }
  };
  const oynat = dugme({ metin: "İkisini birlikte oynat", tur: "ana", ikon: "oynat", id: "ada-oynat" }) as HTMLButtonElement;
  const bitir = () => { clearInterval(zamanlayici); zamanlayici = 0; oynat.disabled = false; denendi("izlendi"); if (haf.k.sim.bittiMi()) denendi("hafiza-bitti"); };
  oynat.addEventListener("click", () => {
    n = 0; denendi("oynatildi");
    if (azHareket()) { n = son; ciz(); bitir(); return; }
    oynat.disabled = true;
    zamanlayici = window.setInterval(() => { if (!document.body.contains(oynat)) return clearInterval(zamanlayici); n++; ciz(); if (n >= son) bitir(); }, 220);
  });
  ciz();
  return el("div", "rs lb", { "data-deney": "ada-deneyi" }, el("div", "lb-ada-duzen", {}, sag.kutu, haf.kutu), el("div", "rs-kontrol", {}, oynat,
    el("p", "lb-not", {}, "Hafızalı robot her hücreye kaç kez geldiğini sayar ve en az gittiği yolu seçer. Sarı daireler: iki ya da daha çok kez gelinen hücreler.")));
}

/* ---------- 5 · hız profili deneyi ve rota görevi ---------- */
/** Hız-zaman grafiği: tek eksen, en çok iki seri, lejant; dönüşte hız sıfıra iner */
function hizGrafigi(): { kap: HTMLElement; ciz(seriler: { ad: string; renk: string; noktalar: { t: number; v: number }[] }[], ustHiz: number): void } {
  const G = 480, Y = 230, sol = 50, alt = 40, ust = 14, sag = 14;
  const svg = s("svg", { viewBox: `0 0 ${G} ${Y}`, class: "lb-grafik", role: "img", "aria-label": "Hız-zaman grafiği" });
  const lejant = el("div", "lb-lejant");
  const tablo = el("p", "s2-gizli", {});
  return {
    kap: el("figure", "lb-grafik-kap", {}, el("figcaption", "lb-baslik", {}, "Hız (m/sn) – zaman (sn)"), svg, lejant, tablo),
    ciz(seriler, ustHiz) {
      const tEn = Math.max(1, ...seriler.flatMap((x) => x.noktalar.map((n) => n.t)));
      const tUst = Math.ceil(tEn), vUst = Math.max(0.5, Math.ceil(ustHiz * 2) / 2);
      const X = (t: number) => sol + (t / tUst) * (G - sol - sag), V = (v: number) => Y - alt - (v / vUst) * (Y - alt - ust);
      const parcalar: SVGElement[] = [];
      for (let v = 0; v <= vUst + 1e-9; v += 0.5) {
        parcalar.push(s("line", { x1: sol, x2: G - sag, y1: V(v), y2: V(v), stroke: v === 0 ? "#17144A" : "#E6DDCB", "stroke-width": v === 0 ? 1.5 : 1 }));
        const t = s("text", { x: sol - 8, y: V(v) + 6, "text-anchor": "end", class: "lb-eksen" }); t.textContent = virgul(v, 1); parcalar.push(t);
      }
      const adim = tUst > 8 ? 2 : 1;
      for (let t = 0; t <= tUst; t += adim) { const e = s("text", { x: X(t), y: Y - alt + 26, "text-anchor": "middle", class: "lb-eksen" }); e.textContent = String(t); parcalar.push(e); }
      for (const x of seriler) parcalar.push(s("polyline", { points: x.noktalar.map((n) => `${X(n.t)},${V(n.v)}`).join(" "), fill: "none", stroke: x.renk, "stroke-width": 3, "stroke-linejoin": "round" }));
      svg.replaceChildren(...parcalar);
      lejant.replaceChildren(...seriler.map((x) => el("span", "", {}, el("i", "", { style: `background:${x.renk}` }), x.ad)));
      tablo.textContent = seriler.map((x) => `${x.ad}: ${virgul(x.noktalar[x.noktalar.length - 1]?.t ?? 0)} saniye`).join("; ");
    }
  };
}
export function hizProfiliDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const m = DERS_LABIRENTLERI.hiz;
  const p = { ...RIZBOT };
  const c = labirentCizimi(m, "Labirentte iki yol: turuncu kısa ama çok dönüşlü, mor uzun ama az dönüşlü.");
  const rotalar = [{ ...HAZIR_ROTALAR.merdiven, renk: RENK.yol1 }, { ...HAZIR_ROTALAR.kenar, renk: RENK.yol2 }];
  c.yollar(rotalar);
  c.robot(c.h.baslangic.x, c.h.baslangic.y, 0);
  const grafik = hizGrafigi();
  const sonuclar = el("div", "lb-sonuclar", { "aria-live": "polite" });
  const kap = el("div", "rs lb", { "data-deney": "hiz-profili" });
  const yaz = () => {
    grafik.ciz(rotalar.map((r) => ({ ad: r.ad, renk: r.renk, noktalar: hizProfili(m, r.yol, p) })), p.azamiHiz);
    const sn = rotalar.map((r) => rotaHesapla(m, r.yol, p));
    sonuclar.replaceChildren(...rotalar.map((r, i) => el("p", "lb-sonuc", {}, el("i", "", { style: `background:${r.renk}` }), el("b", "", {}, r.ad), ` · ${sn[i].hucre} hücre, ${sn[i].donus} dönüş: `, el("b", "", {}, `${virgul(sn[i].sure)} sn`))));
    kap.dataset.hizli = sn[0].sure < sn[1].sure ? "merdiven" : "kenar";
  };
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, c.svg), el("div", "lb-yan", {}, sonuclar,
    kaydirici({ etiket: "En yüksek hız", en: 0.4, ust: 1.6, adim: 0.1, birim: "m/sn", baslangic: p.azamiHiz, bicim: (v) => virgul(v, 1), degisince: (v) => { p.azamiHiz = v; yaz(); }, birakinca: (v) => denendi("hiz" + v) }),
    kaydirici({ etiket: "Hızlanma", en: 1, ust: 4, adim: 0.5, birim: "m/sn²", baslangic: p.ivme, bicim: (v) => virgul(v, 1), degisince: (v) => { p.ivme = v; yaz(); }, birakinca: (v) => denendi("ivme" + v) }),
    el("p", "lb-not", {}, `Her dönüşte robot durur ve yerinde döner (90° dönüş ${virgul(RIZBOT.donus90)} sn). Bu deneydeki ayarlar yalnız burada geçerli.`))), grafik.kap);
  yaz();
  return kap;
}
/** Rota görevi: hücrelere tıklayarak (ya da ok tuşlarıyla) başlangıçtan bitişe yol çiz */
export function rotaGorevi(gorevAdi: string, yildiz: (n: number) => void): HTMLElement {
  const g = ROTA_GOREVLERI[gorevAdi], m = DERS_LABIRENTLERI[g.harita];
  const c = labirentCizimi(m, "Rota çiz: başlangıçtan bitişe hücrelere dokun ya da ok tuşlarını kullan.");
  c.svg.setAttribute("tabindex", "0"); c.svg.setAttribute("role", "application");
  let yol: Hucre[] = [[c.h.baslangic.x, c.h.baslangic.y]];
  const grafik = hizGrafigi();
  const bilgi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const sonuc = el("p", "rs-sonuc", { "aria-live": "polite" }, "");
  const geri = dugme({ metin: "Geri al", ikon: "geri", id: "rg-geri", kucuk: true }) as HTMLButtonElement;
  const temizle = dugme({ metin: "Temizle", id: "rg-temizle", kucuk: true }) as HTMLButtonElement;
  const kap = el("div", "rs lb lb-gorev", { "data-gorev": "rota" });
  const duvarVar = (x: number, y: number, yon: number) => (c.h.duvar[y * c.h.genislik + x] & (1 << yon)) !== 0;
  const ciz = () => {
    c.yollar([{ yol, renk: RENK.yol1 }]);
    const [x, y] = yol[yol.length - 1], onceki = yol[yol.length - 2];
    const yon = onceki ? ([0, 1, 2, 3] as Yon[]).find((d) => DX[d] === x - onceki[0] && DY[d] === y - onceki[1])! : 0;
    c.robot(x, y, yon);
    const r = rotaHesapla(m, yol);
    grafik.ciz([{ ad: "Senin rotan", renk: RENK.yol1, noktalar: hizProfili(m, yol) }], RIZBOT.azamiHiz);
    bilgi.textContent = `${r.hucre} hücre, ${r.donus} dönüş, ${virgul(r.sure)} sn`;
    geri.disabled = temizle.disabled = yol.length < 2;
    kap.dataset.hucre = String(r.hucre);
    if (r.tamam) {
      const n = rotaYildizi(g, r);
      kap.dataset.yildiz = String(n);
      sonuc.replaceChildren(yildizlar(3, n), el("b", "", {}, ` ${n} / 3 yıldız · ${virgul(r.sure)} sn`), el("span", "lb-not", {}, n < 3 ? ` Üç yıldız için en çok ${virgul(g.esikler[2])} sn.` : " En hızlı rota!"));
      yildiz(n);
    } else { delete kap.dataset.yildiz; sonuc.textContent = `Bitişe kadar çiz. İki yıldız için en çok ${virgul(g.esikler[1])} sn, üç yıldız için ${virgul(g.esikler[2])} sn.`; }
  };
  /** hücreye git: yolda varsa oraya kadar geri sar; yanındaysa ve arada duvar yoksa ekle */
  const hucreSec = (x: number, y: number) => {
    const i = yol.findIndex(([a, b]) => a === x && b === y);
    if (i >= 0) { yol = yol.slice(0, i + 1); ciz(); return; }
    const [sx, sy] = yol[yol.length - 1];
    if (sx === c.h.bitis.x && sy === c.h.bitis.y) { bilgi.textContent = "Rota bitişte. Değiştirmek için yoldaki bir hücreye dokun."; return; }
    const d = [0, 1, 2, 3].find((k) => sx + DX[k] === x && sy + DY[k] === y);
    if (d === undefined) { bilgi.textContent = "Yalnız rotanın son hücresinin yanındaki hücreye gidebilirsin."; return; }
    if (duvarVar(sx, sy, d)) { bilgi.textContent = "Arada duvar var."; return; }
    yol = [...yol, [x, y]]; ciz();
  };
  c.svg.addEventListener("click", (e) => {
    const p = (c.svg as SVGSVGElement).getBoundingClientRect(), vb = c.svg.viewBox.baseVal;
    const x = Math.floor(((e.clientX - p.left) / p.width * vb.width + vb.x) / H), y = Math.floor(((e.clientY - p.top) / p.height * vb.height + vb.y) / H);
    if (x >= 0 && y >= 0 && x < c.h.genislik && y < c.h.yukseklik) hucreSec(x, y);
  });
  c.svg.addEventListener("keydown", (e) => {
    const d = ({ ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 } as Record<string, number>)[e.key];
    if (e.key === "Backspace") { e.preventDefault(); if (yol.length > 1) { yol = yol.slice(0, -1); ciz(); } return; }
    if (d === undefined) return;
    e.preventDefault();
    const [x, y] = yol[yol.length - 1];
    hucreSec(x + DX[d], y + DY[d]);
  });
  geri.addEventListener("click", () => { if (yol.length > 1) { yol = yol.slice(0, -1); ciz(); } });
  temizle.addEventListener("click", () => { yol = yol.slice(0, 1); ciz(); });
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, c.svg),
    el("div", "lb-yan", {}, bilgi, el("div", "rs-kontrol", {}, geri, temizle), sonuc,
      el("p", "lb-not", {}, "Klavyede: labirente tıkla, ok tuşlarıyla rotayı uzat, silme tuşuyla geri al."))), grafik.kap);
  ciz();
  return kap;
}

/* ---------- 6 · MEB puan hesaplayıcı ---------- */
export function puanHesaplayici(_ayar: Record<string, unknown>, denendi: (d: number) => void): HTMLElement {
  const d = { bitti: true, sure: 58, satir: 9, mudahale: 0 };
  const puan = el("output", "lb-puan", { "aria-live": "polite" }, "");
  const hesap = el("p", "lb-hesap", {}, "");
  const bittiAyar = el("div", "lb-ayarlar", {}), bitmediAyar = el("div", "lb-ayarlar", {});
  const kap = el("div", "rs lb", { "data-deney": "puan-hesaplayici" });
  const yaz = (deneme = true) => {
    const p = mebPuani({ bitti: d.bitti, sure: d.sure, enUzakSatir: d.satir, mudahale: d.mudahale });
    puan.textContent = `${sayiYaz(p)} puan`;
    hesap.textContent = d.bitti
      ? `Bitirdi: süre ${d.sure} sn${d.mudahale ? ` + ${d.mudahale} müdahale × 10 sn` : ""} = ${sayiYaz(p)}. Düşük puan daha iyidir.`
      : `Bitiremedi: 200 + (16 − ${d.satir}. satır) × 10 = ${p}. Bitiren her robot, bitiremeyenlerin önündedir.`;
    bittiAyar.hidden = !d.bitti; bitmediAyar.hidden = d.bitti;
    kap.dataset.puan = String(p);
    if (deneme) denendi(p);
  };
  bittiAyar.append(
    kaydirici({ etiket: "Süre", en: 20, ust: 90, adim: 1, birim: "sn", baslangic: d.sure, degisince: (v) => { d.sure = v; yaz(false); }, birakinca: () => yaz() }),
    kaydirici({ etiket: "Müdahale", en: 0, ust: 5, adim: 1, baslangic: 0, degisince: (v) => { d.mudahale = v; yaz(false); }, birakinca: () => yaz() }));
  bitmediAyar.append(kaydirici({ etiket: "Ulaşılan satır", en: 1, ust: 15, adim: 1, baslangic: d.satir, degisince: (v) => { d.satir = v; yaz(false); }, birakinca: () => yaz() }));
  kap.append(el("div", "rs-duzen", {},
    el("div", "lb-yan", {}, el("div", "", {}, el("span", "rs-etiket", {}, "Robot bitişe vardı mı?"), secici("Bitiş", [["evet", "Bitirdi"], ["hayir", "Bitiremedi"]], "evet", (v) => { d.bitti = v === "evet"; yaz(); })), bittiAyar, bitmediAyar),
    el("div", "lb-puan-kutu", {}, el("span", "rs-etiket", {}, "MEB Labirent Ustası puanı"), puan, hesap)));
  yaz(false);
  return kap;
}

export const LABIRENT_STILI = `
.lb{margin-top:6px}
.lb-sahne{display:grid;place-items:center}
.lb-svg{display:block;width:100%;max-width:440px;height:auto;border-radius:var(--sra2-kose-2);touch-action:manipulation}
.lb-svg--hucre{max-width:360px}
.lb-svg[tabindex]:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:4px}
.lb-svg[role=application]{cursor:pointer}
.lb-bitis{font:900 20px var(--sra2-yazi);fill:#17144A}
.lb-isaret text{font:900 15px var(--sra2-yazi);fill:#17144A}
.lb-robot{transition:transform .18s var(--sra2-yumusak)}
.lb-yan{display:grid;gap:12px;align-content:start}
.lb-yan p{margin:0}
.lb-baslik{font-weight:800;margin:0}
.lb-not{color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1);font-weight:600;margin:0}
.lb-karar{font-weight:800;color:var(--sra2-murekkep);min-height:2.6em}
.lb-sayac{font-weight:800;color:var(--sra2-mor-taban)}
.lb-kenar{cursor:pointer;outline:none}
.lb-kenar .lb-kenar-duvar{stroke:rgba(255,255,255,.3);stroke-width:3px;stroke-dasharray:8 8}
.lb-kenar.var .lb-kenar-duvar{stroke:#F7F7F4;stroke-width:9px;stroke-dasharray:none}
.lb-kenar:hover .lb-kenar-duvar,.lb-kenar:focus-visible .lb-kenar-duvar{stroke:#B9A6FF}
.lb-kenar.var:hover .lb-kenar-duvar,.lb-kenar.var:focus-visible .lb-kenar-duvar{stroke:#FFE7A3}
.lb-okumalar{display:grid;gap:8px}
.lb-okuma{display:grid;grid-template-columns:14px auto auto 1fr;gap:10px;align-items:center;padding:8px 12px;border-radius:12px;background:var(--sra2-lavanta)}
.lb-okuma i{width:14px;height:14px;border-radius:50%;background:#3A365E}
.lb-okuma.var{background:#FFF1C9}
.lb-okuma.var i{background:#F5A300;box-shadow:0 0 6px #F5A300}
.lb-okuma code{font-family:var(--sra2-yazi-kod);font-weight:700}
.lb-okuma small{color:var(--sra2-murekkep-2);font-weight:700}
@media (max-width:480px){.lb-okuma{grid-template-columns:14px 1fr auto}.lb-okuma small{grid-column:2/4}}
.lb-kod{margin:0;padding:10px 0;list-style:none;background:var(--sra2-gece);border-radius:var(--sra2-kose-2);counter-reset:s;overflow:auto}
.lb-kod li{counter-increment:s;padding:2px 14px 2px 0;display:flex;gap:12px;white-space:pre}
.lb-kod li::before{content:counter(s);width:28px;text-align:right;color:#8E89C0;font:600 var(--sra2-boy-1) var(--sra2-yazi-kod);flex:none}
.lb-kod code{font:600 var(--sra2-boy-1) var(--sra2-yazi-kod);color:#E8E6FF}
.lb-kod li.aktif{background:rgba(245,163,0,.28)}
.lb-kod li.aktif::before{color:#FFC531}
.lb-oklar{display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:start}
.lb-ok{min-height:56px;border:0;border-radius:14px;background:var(--sra2-mor);color:#fff;font:900 26px var(--sra2-yazi);cursor:pointer;box-shadow:0 var(--sra2-taban-1) 0 var(--sra2-mor-taban)}
.lb-ok:active{transform:translateY(2px);box-shadow:none}
.lb-ok:focus-visible{outline:3px solid var(--sra2-sari-koyu);outline-offset:2px}
.lb-ada-duzen{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media (max-width:620px){.lb-ada-duzen{grid-template-columns:1fr}}
.lb-ada{display:grid;gap:8px;justify-items:center;min-width:0}
.lb-ada .lb-svg{max-width:340px}
.lb-grafik-kap{margin:0;display:grid;gap:6px;max-width:620px}
.lb-grafik{width:100%;height:auto;background:#fff;border-radius:var(--sra2-kose-2)}
.lb-eksen{font:700 17px var(--sra2-yazi);fill:#3D3966}
.lb-lejant{display:flex;flex-wrap:wrap;gap:6px 16px;font-weight:700;font-size:var(--sra2-boy-1)}
.lb-lejant span,.lb-sonuc{display:inline-flex;align-items:center;gap:8px}
.lb-lejant i,.lb-sonuc i{width:18px;height:6px;border-radius:3px;flex:none}
.lb-sonuclar{display:grid;gap:6px}
.lb-sonuc{display:flex;flex-wrap:wrap;gap:4px 8px}
.lb-puan-kutu{display:grid;gap:8px;padding:18px;border-radius:var(--sra2-kose-3);background:var(--sra2-lavanta);align-content:start}
.lb-puan{font:900 var(--sra2-boy-6) var(--sra2-yazi-baslik);color:var(--sra2-mor-taban)}
.lb-hesap{margin:0;font-weight:700}
.lb-ayarlar{display:grid;gap:14px}
.lb-ayarlar[hidden]{display:none}
@media (prefers-reduced-motion: reduce){.lb-robot{transition:none}}
`;
