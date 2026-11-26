/* İlkokul · Robot görevleri (mBot) deneyleri ve çizgi görevi. Hesaplar robot-motoru/mbot.ts'te.
   Hareketi azaltta oynatma yok, son durum hemen çizilir. */
import { dugme, el, kaydirici, yildizlar } from "@sra/tasarim/v2";
import {
  CIZGI_ESIKLERI, cizgiYildizi, GOZ_DURUMLARI, GOZ_DURUMU_ADI, GOZ_ORNEK_TABLO, gozDurumu, hareketAdi, kartCalistir, MBOT, MBOT_HAMLE_ADI, MBOT_HAMLELERI,
  MBOT_PISTI, mbotKos, sensorOku, SENSOR_DUNYASI, tekerIzi, tekerYolu, ENERJI,
  type CizgiKosusu, type DurumTablosu, type Kart, type MbotHamle, type Poz
} from "@sra/robot-motoru";
import { azHareket, sehirKur } from "./kart-programi";

const NS = "http://www.w3.org/2000/svg";
const s = (ad: string, at: Record<string, string | number> = {}) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
const virgul = (n: number, b = 1) => n.toFixed(b).replace(".", ",");
/** mBot üstten (cm ölçeğinde): 13 cm geniş, 17 cm uzun; ön +x yönünde */
function mbotUstten(olcek = 1, ultrasonik = true): SVGGElement {
  const g = s("g", { class: "mb-robot" }) as SVGGElement;
  const k = olcek;
  g.append(
    s("rect", { x: -2 * k, y: -7.6 * k, width: 6.4 * k, height: 2.6 * k, rx: 0.8 * k, fill: "#17144A" }), s("rect", { x: -2 * k, y: 5 * k, width: 6.4 * k, height: 2.6 * k, rx: 0.8 * k, fill: "#17144A" }),
    s("rect", { x: -6 * k, y: -5.2 * k, width: 15 * k, height: 10.4 * k, rx: 1.6 * k, fill: "#1E88E5", stroke: "#fff", "stroke-width": 0.5 * k }),
    s("rect", { x: -3 * k, y: -3.4 * k, width: 7 * k, height: 6.8 * k, rx: 0.8 * k, fill: "#0D47A1", opacity: 0.6 }),
  );
  if (ultrasonik) g.append(s("circle", { cx: 9.6 * k, cy: -2.2 * k, r: 1.5 * k, fill: "#CFD8DC", stroke: "#37474F", "stroke-width": 0.4 * k }), s("circle", { cx: 9.6 * k, cy: 2.2 * k, r: 1.5 * k, fill: "#CFD8DC", stroke: "#37474F", "stroke-width": 0.4 * k }));
  return g;
}

/* ---------- 1 · teker deneyi ---------- */
export function tekerDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const d: { cap: number; tur: number } = { cap: MBOT.tekerCapi, tur: 2 };
  const svg = s("svg", { viewBox: "0 0 640 220", class: "mb-svg", role: "img", "aria-label": "Teker ve cetvel: teker döndükçe gittiği yol" });
  const sonuc = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-deney": "teker" });
  const X0 = 60, olcek = 3.5; // cetvel 0–160 cm, 1 cm = 3,5 birim
  const ciz = () => {
    const yol = tekerYolu(d.cap, d.tur), r = (d.cap / 2) * olcek * 3;
    const p: SVGElement[] = [s("rect", { x: 0, y: 0, width: 640, height: 220, rx: 14, fill: "#FFF8EC" })];
    /* cetvel */
    p.push(s("rect", { x: X0 - 8, y: 168, width: 160 * olcek + 16, height: 36, rx: 4, fill: "#FFD54A", stroke: "#B58A00" }));
    for (let c = 0; c <= 160; c += 10) {
      p.push(s("line", { x1: X0 + c * olcek, y1: 168, x2: X0 + c * olcek, y2: c % 50 === 0 ? 186 : 178, stroke: "#17144A", "stroke-width": 1.5 }));
      if (c % 50 === 0) { const t = s("text", { x: X0 + c * olcek, y: 200, "text-anchor": "middle", class: "mb-yazi" }); t.textContent = `${c} cm`; p.push(t); }
    }
    /* başlangıç ve varış tekeri (görsel için 3 kat büyük) */
    const teker = (x: number, soluk: boolean, aci: number) => {
      const g = s("g", { transform: `translate(${x} ${168 - r}) rotate(${aci})`, opacity: soluk ? 0.35 : 1 });
      g.append(s("circle", { r, fill: "#263238" }), s("circle", { r: r * 0.55, fill: "#B0BEC5" }), s("circle", { r: r * 0.12, fill: "#455A64" }), s("circle", { cx: 0, cy: -r * 0.8, r: Math.max(4, r * 0.1), fill: "#E5484D" }));
      return g;
    };
    const varis = X0 + Math.min(160, yol) * olcek;
    p.push(teker(X0, true, 0), s("line", { x1: X0, y1: 150 - 2 * r, x2: varis, y2: 150 - 2 * r, stroke: "#6A48F0", "stroke-width": 4, "marker-end": "url(#mb-ok)" }));
    const t = s("text", { x: (X0 + varis) / 2, y: 140 - 2 * r, "text-anchor": "middle", class: "mb-yazi mb-yazi--buyuk" }); t.textContent = `${virgul(yol)} cm`; p.push(t);
    p.push(teker(varis, false, d.tur * 360));
    const defs = s("defs"); const m = s("marker", { id: "mb-ok", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }); m.append(s("path", { d: "M0 0L10 5L0 10z", fill: "#6A48F0" })); defs.append(m);
    svg.replaceChildren(defs, ...p);
    sonuc.textContent = `Teker ${virgul(d.cap)} cm. Bir turda ${virgul(tekerYolu(d.cap, 1))} cm gider; ${d.tur} turda ${virgul(yol)} cm.${yol > 160 ? " (Cetvelden taştı!)" : ""}`;
    kap.dataset.yol = virgul(yol);
  };
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, svg), el("div", "lb-yan", {},
    kaydirici({ etiket: "Teker çapı", en: 4, ust: 10, adim: 0.2, birim: "cm", baslangic: d.cap, bicim: (v) => virgul(v), degisince: (v) => { d.cap = v; ciz(); }, birakinca: () => denendi(`${d.cap}-${d.tur}`) }),
    kaydirici({ etiket: "Tur sayısı", en: 1, ust: 5, adim: 1, baslangic: d.tur, degisince: (v) => { d.tur = v; ciz(); }, birakinca: () => denendi(`${d.cap}-${d.tur}`) }),
    sonuc, el("p", "lb-not", {}, "mBot'un tekeri yaklaşık 6,4 cm. Kırmızı nokta tekerin bir yerini gösteriyor: her turda en üste geri gelir."))));
  ciz();
  return kap;
}

/* ---------- 2 · iki teker deneyi ---------- */
export function ikiTekerDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const d = { sol: 20, sag: 20 };
  const svg = s("svg", { viewBox: "-80 -110 160 130", class: "mb-svg mb-svg--kare", role: "img", "aria-label": "Robotun 4 saniyelik izi" });
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-deney": "iki-teker" });
  const ciz = () => {
    const iz = tekerIzi(d.sol, d.sag, 4);
    const son = iz[iz.length - 1];
    const g = mbotUstten(0.9);
    g.setAttribute("transform", `translate(${son.x} ${son.y}) rotate(${(son.aci * 180) / Math.PI})`);
    const bas = mbotUstten(0.9); bas.setAttribute("transform", "rotate(-90)"); bas.setAttribute("opacity", "0.3");
    const izgara: SVGElement[] = [];
    for (let x = -80; x <= 80; x += 20) izgara.push(s("line", { x1: x, y1: -110, x2: x, y2: 20, stroke: "#E6DDCB", "stroke-width": 0.6 }));
    for (let y = -100; y <= 20; y += 20) izgara.push(s("line", { x1: -80, y1: y, x2: 80, y2: y, stroke: "#E6DDCB", "stroke-width": 0.6 }));
    svg.replaceChildren(s("rect", { x: -80, y: -110, width: 160, height: 130, fill: "#FFF8EC" }), ...izgara, bas,
      s("polyline", { points: iz.map((p) => `${p.x},${p.y}`).join(" "), fill: "none", stroke: "#6A48F0", "stroke-width": 1.6, "stroke-dasharray": "3 2" }), g);
    yazi.textContent = hareketAdi(d.sol, d.sag);
    kap.dataset.hareket = d.sol === d.sag ? "duz" : d.sol === -d.sag ? "yerinde" : Math.abs(d.sol) > Math.abs(d.sag) ? "saga" : "sola";
  };
  const bicim = (v: number) => (v > 0 ? `${v} ileri` : v < 0 ? `${-v} geri` : "dur");
  kap.append(el("div", "rs-duzen", {}, el("div", "lb-sahne", {}, svg), el("div", "lb-yan", {},
    kaydirici({ etiket: "Sol teker", en: -20, ust: 20, adim: 5, baslangic: d.sol, bicim, degisince: (v) => { d.sol = v; ciz(); }, birakinca: () => denendi(`${d.sol},${d.sag}`) }),
    kaydirici({ etiket: "Sağ teker", en: -20, ust: 20, adim: 5, baslangic: d.sag, bicim, degisince: (v) => { d.sag = v; ciz(); }, birakinca: () => denendi(`${d.sol},${d.sag}`) }),
    yazi, el("p", "lb-not", {}, "Soluk robot başladığı yer; kesik çizgi 4 saniyelik yolu."))));
  ciz();
  return kap;
}

/* ---------- 3 · sensör gezdirme ---------- */
export function sensorGezdirme(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const D = SENSOR_DUNYASI;
  const poz = { x: 14, y: 50 };
  const svg = s("svg", { viewBox: `0 0 ${D.genislik} ${D.yukseklik}`, class: "mb-svg", role: "application", tabindex: 0, "aria-label": "Masa: siyah bant, lamba ve duvar. mBot'u sürükle ya da ok tuşlarıyla gezdir." }) as SVGSVGElement;
  const isik = s("radialGradient", { id: "mb-lamba" }); isik.append(s("stop", { offset: "0", "stop-color": "#FFE066", "stop-opacity": 0.95 }), s("stop", { offset: "1", "stop-color": "#FFE066", "stop-opacity": 0 }));
  const defs = s("defs"); defs.append(isik);
  svg.append(defs, s("rect", { x: 0, y: 0, width: D.genislik, height: D.yukseklik, fill: "#5E5A78" }),
    s("rect", { x: 2, y: 2, width: D.duvar - 2, height: D.yukseklik - 4, rx: 2, fill: "#F7F5EF" }),
    s("circle", { cx: D.lamba.x, cy: D.lamba.y, r: D.lamba.r * 1.2, fill: "url(#mb-lamba)" }),
    s("rect", { x: D.bant.x1, y: 2, width: D.bant.x2 - D.bant.x1, height: D.yukseklik - 4, fill: "#1D1B19" }),
    s("rect", { x: D.duvar, y: 0, width: D.genislik - D.duvar, height: D.yukseklik, fill: "#8D6E63" }));
  const etiket = (x: number, y: number, m: string) => { const t = s("text", { x, y, "text-anchor": "middle", class: "mb-yazi mb-yazi--kucuk" + (m === "bant" ? " mb-yazi--koyu" : "") }); t.textContent = m; svg.append(t); };
  etiket(D.lamba.x, D.lamba.y + 2, "lamba"); etiket((D.bant.x1 + D.bant.x2) / 2 + 8, 66, "bant"); etiket((D.duvar + D.genislik) / 2, 36, "duvar");
  const robot = mbotUstten(1); svg.append(robot);
  const okuma = el("div", "lb-okumalar");
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs-duzen mb", { "data-deney": "sensor-gezdirme" });
  const ciz = (deneme: boolean) => {
    robot.setAttribute("transform", `translate(${poz.x} ${poz.y})`);
    const o = sensorOku(poz.x, poz.y);
    const isikAd = o.isik >= 60 ? "aydınlık" : o.isik >= 30 ? "loş" : "karanlık";
    okuma.replaceChildren(
      el("div", "lb-okuma" + (o.isik >= 60 ? " var" : ""), { "data-sensor": "isik" }, el("i"), el("b", "", {}, "Işık sensörü"), el("b", "", {}, String(o.isik)), el("small", "", {}, isikAd)),
      el("div", "lb-okuma" + (o.solGoz ? " var" : ""), { "data-sensor": "cizgi" }, el("i"), el("b", "", {}, "Çizgi sensörü"), el("b", "", {}, o.solGoz ? "siyah" : "beyaz"), el("small", "", {}, o.solGoz ? "bandın üstünde" : "beyaz masada")),
      el("div", "lb-okuma" + (o.mesafe !== null && o.mesafe < 15 ? " var" : ""), { "data-sensor": "mesafe" }, el("i"), el("b", "", {}, "Mesafe sensörü"), el("b", "", {}, o.mesafe === null ? "—" : `${o.mesafe} cm`), el("small", "", {}, o.mesafe !== null && o.mesafe < 15 ? "engel çok yakın!" : "engel uzakta")));
    yazi.textContent = o.mesafe !== null && o.mesafe < 15 ? "mBot duvarı görüyor: dur ya da dön!" : o.solGoz ? "Çizgi sensörü siyah bandı görüyor." : o.isik >= 60 ? "Işık sensörü lambanın ışığını görüyor." : "mBot'u gezdir: sensörler ne görüyor?";
    const durum = `${o.solGoz ? "siyah" : "beyaz"}-${o.isik >= 60 ? "aydinlik" : "karanlik"}-${o.mesafe !== null && o.mesafe < 15 ? "yakin" : "uzak"}`;
    kap.dataset.durum = durum;
    if (deneme) denendi(durum);
  };
  const tasi = (x: number, y: number, deneme = true) => { poz.x = Math.max(8, Math.min(D.duvar - 10, x)); poz.y = Math.max(8, Math.min(D.yukseklik - 8, y)); ciz(deneme); };
  let surukle = false;
  const nokta = (e: PointerEvent) => { const r = svg.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * D.genislik, ((e.clientY - r.top) / r.height) * D.yukseklik]; };
  svg.addEventListener("pointerdown", (e) => { surukle = true; svg.setPointerCapture(e.pointerId); const [x, y] = nokta(e); tasi(x, y); });
  svg.addEventListener("pointermove", (e) => { if (!surukle) return; const [x, y] = nokta(e); tasi(x, y); });
  svg.addEventListener("pointerup", () => { surukle = false; });
  svg.addEventListener("keydown", (e) => {
    const a = ({ ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] } as Record<string, [number, number]>)[e.key];
    if (!a) return; e.preventDefault(); tasi(poz.x + a[0], poz.y + a[1]);
  });
  kap.append(el("div", "lb-sahne", {}, svg), el("div", "lb-yan", {}, el("p", "lb-baslik", {}, "mBot'un sensörleri"), okuma, yazi,
    el("p", "lb-not", {}, "Klavyede: masaya tıkla, ok tuşlarıyla gezdir.")));
  ciz(false);
  return kap;
}

/* ---------- 4 · karar deneyi (eğer–değilse) ---------- */
export function kararDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  let engel = false;
  const yer = el("div", "lb-sahne");
  const kart = el("div", "mb-eger", {},
    el("div", "mb-eger__kol", { "data-kol": "eger" }, el("b", "", {}, "Eğer önü kapalıysa"), el("span", "", {}, "↱ Sağa dön")),
    el("div", "mb-eger__kol", { "data-kol": "degilse" }, el("b", "", {}, "Değilse"), el("span", "", {}, "↑ İleri git")));
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs-duzen mb", { "data-deney": "karar" });
  const ciz = () => {
    const harita = ["#####", "#R" + (engel ? "#" : " ") + " #", "#####"];
    const sh = sehirKur(harita, 1, engel ? "Robotun önünde bina var" : "Robotun önü açık");
    const k = kartCalistir(harita, 1, 10, [{ tur: "eger", kosul: "onu-kapali", ic: [{ tur: "sag" }], degilse: [{ tur: "ileri" }] }]);
    sh.kare(k, azHareket() ? k.sim.iz.length - 1 : 0);
    if (!azHareket()) setTimeout(() => sh.kare(k, k.sim.iz.length - 1), 450);
    yer.replaceChildren(sh.svg);
    kart.querySelectorAll<HTMLElement>(".mb-eger__kol").forEach((e) => e.classList.toggle("aktif", (e.dataset.kol === "eger") === engel));
    yazi.textContent = engel ? "Önü kapalı: \"eğer\" kolu çalıştı, robot sağa döndü." : "Önü açık: \"değilse\" kolu çalıştı, robot ileri gitti.";
    kap.dataset.kol = engel ? "eger" : "degilse";
  };
  const degistir = dugme({ metin: "Önüne bina koy / kaldır", tur: "ikincil", id: "mb-engel" });
  degistir.addEventListener("click", () => { engel = !engel; ciz(); denendi(engel ? "kapali" : "acik"); });
  kap.append(yer, el("div", "lb-yan", {}, kart, yazi, el("div", "rs-kontrol", {}, degistir)));
  ciz();
  return kap;
}

/* ---------- 5 · sokak uzunluğu deneyi (sürece) ---------- */
export function sokakDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  let uzunluk = 4;
  const yer = el("div", "lb-sahne");
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-deney": "sokak" });
  const program: Kart[] = [{ tur: "surece", kosul: "onu-acik", ic: [{ tur: "ileri" }] }];
  let zaman = 0;
  const ciz = () => {
    clearInterval(zaman);
    const harita = ["#".repeat(uzunluk + 3), "#R" + ".".repeat(uzunluk) + "#", "#".repeat(uzunluk + 3)];
    const sh = sehirKur(harita, 1, `${uzunluk} karelik sokak`);
    const k = kartCalistir(harita, 1, 40, program);
    yer.replaceChildren(sh.svg);
    const son = () => { sh.kare(k, k.sim.iz.length - 1); yazi.textContent = `Sokak ${uzunluk} kare: robot ${k.sim.iz.filter((z) => z.olay === "ileri").length} kez ileri gitti ve önü kapanınca durdu.`; kap.dataset.adim = String(k.sim.iz.length - 1); };
    if (azHareket()) return son();
    let f = 0; yazi.textContent = "Robot gidiyor…";
    zaman = window.setInterval(() => { if (!document.body.contains(yer) || f >= k.sim.iz.length) { clearInterval(zaman); son(); return; } sh.kare(k, f++); }, 220);
  };
  kap.append(el("div", "mb-tek-kart", {}, el("span", "kp-ikon", { "aria-hidden": "true" }, "∞"), el("b", "", {}, "Önü açık olduğu sürece tekrarla:"), el("span", "", {}, "↑ İleri git")), yer,
    el("div", "lb-yan", {}, kaydirici({ etiket: "Sokağın uzunluğu", en: 2, ust: 9, adim: 1, birim: "kare", baslangic: uzunluk, degisince: (v) => { uzunluk = v; }, birakinca: (v) => { uzunluk = v; ciz(); denendi(String(v)); } }), yazi));
  ciz();
  return kap;
}

/* ---------- 6 · batarya deneyi ---------- */
export function bataryaDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const hucreler = [".", ".", ".", ".", ".", ".", ".", "."];
  const PIL = 12;
  const yer = el("div", "lb-sahne");
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-deney": "batarya" });
  const ciz = (calis: boolean) => {
    const harita = ["#" + "#".repeat(hucreler.length + 1) + "#", "#R" + hucreler.join("") + "#", "#" + "#".repeat(hucreler.length + 1) + "#"];
    const sh = sehirKur(harita, 1, "Sokak: karelere dokunarak kar, temiz yol ya da şarj istasyonu yap.");
    hucreler.forEach((_, i) => {
      const r = sh.hucreler[1][i + 2];
      r.setAttribute("tabindex", "0"); r.setAttribute("role", "button"); r.setAttribute("aria-label", `${i + 1}. kare: ${hucreler[i] === "." ? "karlı" : hucreler[i] === "S" ? "şarj istasyonu" : "temiz"}`);
      r.style.cursor = "pointer";
      const degis = () => { hucreler[i] = hucreler[i] === "." ? " " : hucreler[i] === " " ? "S" : "."; ciz(false); };
      r.addEventListener("click", degis);
      r.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); degis(); } });
    });
    /* kar hücresine tıklanabilsin: kar katmanı tıklamayı hücreye geçirsin */
    sh.svg.querySelectorAll(".kp-kar").forEach((k) => ((k as SVGElement).style.pointerEvents = "none"));
    yer.replaceChildren(sh.svg);
    if (!calis) { yazi.textContent = `Batarya ${PIL}. Karlı kare ${ENERJI.karliKare}, temiz kare ${ENERJI.temizKare} enerji harcar. Sokağı düzenle ve robotu çalıştır.`; return; }
    const k = kartCalistir(harita, 1, PIL, [{ tur: "tekrarla", kez: hucreler.length, ic: [{ tur: "ileri" }] }]);
    sh.kare(k, k.sim.iz.length - 1);
    const gitti = k.sim.iz.filter((z) => z.olay === "ileri").length;
    yazi.textContent = k.durdu === "batarya" ? `Batarya bitti! Robot ${gitti}. karede kaldı.` : `Robot sokağın sonuna vardı. Kalan batarya: ${k.sim.batarya}.`;
    kap.dataset.sonuc = k.durdu ?? "vardi";
    denendi(`${k.durdu ?? "vardi"}-${k.sim.harcanan}`);
  };
  const calistir = dugme({ metin: "Robotu çalıştır", tur: "ana", ikon: "oynat", id: "mb-pil-calistir" });
  calistir.addEventListener("click", () => ciz(true));
  kap.append(yer, el("div", "lb-yan", {}, yazi, el("div", "rs-kontrol", {}, calistir), el("p", "lb-not", {}, "Karelere dokun: karlı → temiz → şarj istasyonu → karlı. İstasyon bataryayı doldurur.")));
  ciz(false);
  return kap;
}

/* ---------- 7 · iki göz deneyi ve çizgi görevi ---------- */
export function ikiGozDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  let kayma = 0; // robotun çizgiye göre yana kayması (cm): + sağa
  const svg = s("svg", { viewBox: "-24 -14 48 28", class: "mb-svg", role: "img", "aria-label": "Siyah çizgi ve mBot'un iki gözü" });
  const yazi = el("p", "lb-karar", { "aria-live": "polite" }, "");
  const gozler = el("div", "mb-gozler");
  const kap = el("div", "rs-duzen mb", { "data-deney": "iki-goz" });
  const ciz = () => {
    const w = MBOT.cizgiGenisligi / 2, a = MBOT.gozArasi / 2;
    /* robot yukarı bakıyor; sol göz solda (x-), çizgi x=0'da; robot kayma kadar sağda */
    const solX = kayma - a, sagX = kayma + a;
    const sol = Math.abs(solX) <= w, sag = Math.abs(sagX) <= w;
    const r = mbotUstten(1, false); r.setAttribute("transform", `translate(${kayma} 6) rotate(-90)`); r.setAttribute("opacity", "0.9");
    svg.replaceChildren(s("rect", { x: -24, y: -14, width: 48, height: 28, fill: "#F7F5EF" }), s("rect", { x: -w, y: -14, width: 2 * w, height: 28, fill: "#1D1B19" }), r,
      s("rect", { x: kayma - 2.2, y: -1.1, width: 4.4, height: 2.2, rx: 0.4, fill: "#2167C9" }),
      s("circle", { cx: solX, cy: 0, r: 0.7, fill: sol ? "#FFC531" : "#E5484D", stroke: "#17144A", "stroke-width": 0.25 }), s("circle", { cx: sagX, cy: 0, r: 0.7, fill: sag ? "#FFC531" : "#E5484D", stroke: "#17144A", "stroke-width": 0.25 }));
    const d = gozDurumu(sol, sag);
    gozler.replaceChildren(
      el("div", "lb-okuma" + (sol ? " var" : ""), {}, el("i"), el("b", "", {}, "Sol göz"), el("b", "", {}, sol ? "siyah" : "beyaz")),
      el("div", "lb-okuma" + (sag ? " var" : ""), {}, el("i"), el("b", "", {}, "Sağ göz"), el("b", "", {}, sag ? "siyah" : "beyaz")));
    yazi.textContent = `${GOZ_DURUMU_ADI[d]}: ${MBOT_HAMLE_ADI[GOZ_ORNEK_TABLO[d]].toLowerCase()}${d === "ikisi-beyaz" ? " (çizgiyi kaybetti, geri dönüp arar)" : ""}.`;
    kap.dataset.durum = d;
    return d;
  };
  kap.append(el("div", "lb-sahne", {}, svg), el("div", "lb-yan", {}, gozler, yazi,
    kaydirici({ etiket: "Robotun yeri", en: -3, ust: 3, adim: 0.5, baslangic: 0, bicim: (v) => (v === 0 ? "ortada" : v < 0 ? `${virgul(-v)} cm sola` : `${virgul(v)} cm sağa`), degisince: (v) => { kayma = v; ciz(); }, birakinca: (v) => { kayma = v; denendi(ciz()); } })));
  ciz();
  return kap;
}

export function cizgiGorevi(yildiz: (n: number) => void): HTMLElement {
  const anahtar = "sra-mbot-tablo";
  let tablo: DurumTablosu = { "ikisi-siyah": "dur", "sol-beyaz": "dur", "sag-beyaz": "dur", "ikisi-beyaz": "dur" };
  try { const v = JSON.parse(localStorage.getItem(anahtar) ?? "null"); if (v && GOZ_DURUMLARI.every((d) => MBOT_HAMLELERI.includes(v[d]))) tablo = v; } catch { /* yok */ }
  const P = MBOT_PISTI;
  const svg = s("svg", { viewBox: `0 0 ${P.genislik} ${P.yukseklik}`, class: "mb-svg mb-pist", role: "img", "aria-label": "Çizgi pisti" });
  svg.append(s("rect", { x: 0, y: 0, width: P.genislik, height: P.yukseklik, rx: 4, fill: "#F7F5EF" }),
    s("polygon", { points: P.noktalar.map(([x, y]) => `${x},${y}`).join(" "), fill: "none", stroke: "#1D1B19", "stroke-width": MBOT.cizgiGenisligi, "stroke-linejoin": "round" }),
    s("line", { x1: P.bas.x - 6, y1: P.bas.y - 5, x2: P.bas.x - 6, y2: P.bas.y + 5, stroke: "#2FBF71", "stroke-width": 1.2 }));
  const izYolu = s("polyline", { fill: "none", stroke: "#6A48F0", "stroke-width": 0.8, opacity: 0.7 });
  const robot = mbotUstten(1);
  svg.append(izYolu, robot);
  const yerlestir = (p: Poz) => robot.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${(p.aci * 180) / Math.PI})`);
  yerlestir(P.bas);
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const kap = el("div", "rs mb", { "data-gorev": "cizgi" });
  const satirlar = el("div", "mb-tablo", { role: "group", "aria-label": "Durum tablosu" }, ...GOZ_DURUMLARI.map((d) => {
    const sec = el("select", "kp-kosul", { "aria-label": `${GOZ_DURUMU_ADI[d]}: ne yapsın?`, "data-durum": d }, ...MBOT_HAMLELERI.map((h) => el("option", "", { value: h }, MBOT_HAMLE_ADI[h]))) as HTMLSelectElement;
    sec.value = tablo[d];
    sec.addEventListener("change", () => { tablo = { ...tablo, [d]: sec.value as MbotHamle }; try { localStorage.setItem(anahtar, JSON.stringify(tablo)); } catch { /* yok */ } });
    return el("label", "mb-tablo__satir", {}, el("span", "mb-goz-ikon", { "data-durum": d, "aria-hidden": "true" }, el("i"), el("i")), el("b", "", {}, `Eğer ${GOZ_DURUMU_ADI[d].toLowerCase()}`), sec);
  }));
  let zaman = 0;
  const calistir = dugme({ metin: "Pistte dene", tur: "ana", ikon: "oynat", id: "mb-cizgi-calistir" }) as HTMLButtonElement;
  const goster = (k: CizgiKosusu) => {
    const n = cizgiYildizi(k);
    kap.dataset.yildiz = String(n);
    sonuc.replaceChildren(...(k.bitti
      ? [yildizlar(3, n), el("b", "", {}, ` ${n} / 3 yıldız · bir tur ${virgul(k.sure)} sn`), el("span", "lb-not", {}, n < 3 ? ` Üç yıldız için en çok ${virgul(CIZGI_ESIKLERI[1])} sn.` : " Çok iyi!")]
      : [el("b", "", {}, k.sebep === "cikti" ? "mBot çizgiden çıktı." : k.sebep === "durdu" ? "mBot durdu ve kımıldamadı." : "Süre doldu: bir tur bitmedi."), el("span", "lb-not", {}, ` Yolun %${Math.round(k.ilerleme * 100)}'i gidildi. Hangi durumda ne yaptığını bir daha düşün.`)]));
    if (n) yildiz(n);
  };
  calistir.addEventListener("click", () => {
    clearInterval(zaman);
    const k = mbotKos(tablo);
    calistir.disabled = true; sonuc.textContent = "mBot pistte…";
    const bitir = () => { clearInterval(zaman); zaman = 0; calistir.disabled = false; izYolu.setAttribute("points", k.iz.map((p) => `${p.x},${p.y}`).join(" ")); yerlestir(k.iz[k.iz.length - 1]); goster(k); };
    if (azHareket()) return bitir();
    let i = 0;
    /* 4 kat hızlı oynatma */
    zaman = window.setInterval(() => {
      if (!document.body.contains(calistir)) return clearInterval(zaman);
      i = Math.min(k.iz.length - 1, i + 2);
      izYolu.setAttribute("points", k.iz.slice(0, i + 1).map((p) => `${p.x},${p.y}`).join(" "));
      yerlestir(k.iz[i]);
      if (i >= k.iz.length - 1) bitir();
    }, 50);
  });
  kap.append(el("div", "kp-izgara", {}, el("div", "kp-sol", {}, svg), el("div", "kp-sag", {}, el("p", "lb-baslik", {}, "mBot her an iki gözüne bakar ve tablodaki hamleyi yapar:"), satirlar, el("div", "rs-kontrol", {}, calistir))), sonuc);
  return kap;
}

/* ---------- 3 · bilmece görevi: sensör ne görür? ---------- */
export interface Bilmece { soru: string; secenekler: string[]; dogru: number; aciklama: string }
export function bilmeceGorevi(sorular: Bilmece[], yildiz: (n: number) => void): HTMLElement {
  let i = 0, ilkDogru = 0, denendi = false;
  const yer = el("div", "mb-bilmece");
  const kap = el("div", "rs mb", { "data-gorev": "bilmece" }, yer);
  const ciz = () => {
    if (i >= sorular.length) {
      const n = ilkDogru >= sorular.length ? 3 : ilkDogru >= sorular.length - 1 ? 2 : ilkDogru >= Math.ceil(sorular.length / 2) ? 1 : 0;
      kap.dataset.yildiz = String(n);
      const yeniden = dugme({ metin: "Baştan çöz", ikon: "geri", id: "mb-bilmece-yeniden" });
      yeniden.addEventListener("click", () => { i = 0; ilkDogru = 0; denendi = false; ciz(); });
      yer.replaceChildren(el("p", "rs-sonuc", {}, yildizlar(3, n), el("b", "", {}, ` ${sorular.length} sorudan ${ilkDogru} tanesini ilk denemede bildin.`)), el("div", "rs-kontrol", {}, yeniden));
      if (n) yildiz(n);
      return;
    }
    const q = sorular[i];
    const geri = el("p", "lb-karar", { "aria-live": "polite" }, "");
    const sec = el("div", "dr-secenekler", { role: "group", "aria-label": "Seçenekler" }, ...q.secenekler.map((m, j) => {
      const b = el("button", "s2-dugme s2-dugme--ikincil", { type: "button", "data-secenek": String(j) }, m);
      b.addEventListener("click", () => {
        if (j === q.dogru) {
          if (!denendi) ilkDogru++;
          sec.querySelectorAll("button").forEach((x) => ((x as HTMLButtonElement).disabled = true));
          geri.textContent = "Doğru! " + q.aciklama;
          const ileri = dugme({ metin: i + 1 < sorular.length ? "Sonraki bilmece" : "Sonucu gör", tur: "ana", ikon: "ileri", ikonSonda: true, id: "mb-bilmece-ileri" });
          ileri.addEventListener("click", () => { i++; denendi = false; ciz(); });
          yer.append(el("div", "rs-kontrol", {}, ileri));
        } else { denendi = true; b.setAttribute("aria-disabled", "true"); b.classList.add("mb-yanlis"); geri.textContent = "Tam değil, bir daha düşün."; }
      });
      return b;
    }));
    yer.replaceChildren(el("p", "lb-baslik", {}, `Bilmece ${i + 1} / ${sorular.length}`), el("p", "mb-soru", {}, q.soru), sec, geri);
  };
  ciz();
  return kap;
}

export const MBOT_STILI = `
.mb{margin-top:6px}
.mb-svg{display:block;width:100%;max-width:560px;height:auto;border-radius:var(--sra2-kose-2);touch-action:none}
.mb-svg--kare{max-width:380px}
.mb-svg[tabindex]:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:4px}
.mb-pist{max-width:640px}
.mb-yazi{font:700 12px var(--sra2-yazi);fill:#17144A}
.mb-yazi--buyuk{font-size:18px;font-weight:900;fill:#6A48F0}
.mb-yazi--kucuk{font-size:3.4px;fill:#fff;font-weight:800}
.mb-yazi--koyu{fill:#17144A}
.mb-eger{display:grid;gap:8px}
.mb-eger__kol{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:10px 14px;border-radius:12px;border:2px solid #18A058;background:#fff;font-weight:700}
.mb-eger__kol.aktif{background:#FFF3C4;box-shadow:0 0 0 4px #FFC531}
.mb-tek-kart{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;border:2px solid #C2185B;background:#FCE4EC;font-weight:700;--kp:#C2185B}
.mb-tek-kart .kp-ikon{background:#C2185B;color:#fff}
.mb-gozler{display:grid;gap:8px}
.mb-tablo{display:grid;gap:8px}
.mb-tablo__satir{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:var(--sra2-lavanta);--kp:#18A058}
@media (max-width:480px){.mb-tablo__satir{grid-template-columns:auto 1fr}.mb-tablo__satir select{grid-column:1/3}}
.mb-goz-ikon{display:inline-flex;gap:3px;padding:4px;border-radius:8px;background:#fff;border:1px solid #CFCBE6}
.mb-goz-ikon i{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #17144A}
.mb-goz-ikon[data-durum=ikisi-siyah] i,.mb-goz-ikon[data-durum=sol-beyaz] i:last-child,.mb-goz-ikon[data-durum=sag-beyaz] i:first-child{background:#17144A}
.mb-bilmece{display:grid;gap:12px}
.mb-soru{font-weight:800;font-size:var(--sra2-boy-3);margin:0}
.mb-yanlis{opacity:.5;text-decoration:line-through}
.mb-robot{transition:transform .2s var(--sra2-yumusak)}
@media (prefers-reduced-motion: reduce){.mb-robot{transition:none}}
`;
