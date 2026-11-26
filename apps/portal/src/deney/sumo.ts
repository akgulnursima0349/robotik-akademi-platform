/* Mini Sumo deneyleri ve strateji görevi: ring simülasyonu, sensör görüş göstergesi, itme deneyi, kartlardan kod.
   Fizik Lab'daki ligin aynısıdır (robot-motoru: rauntOyna). Strateji kartları robot-motoru/sumo-strateji'de: aynı kartlar
   ders sayfasında beyne, Lab'da Python koduna çevrilir. Hareketi azaltta raunt oynatılmaz; son kare hemen çizilir. */
import { dugme, el, kaydirici, kodCercevesi, secici, yildizlar } from "@sra/tasarim/v2";
import {
  BASLANGIC_KARTLARI, baslangic, DIZILISLER, DURUMLAR, HAMLELER, HAZIR_RAKIPLER, KENSHIN, RING, kartBeyni, kartlardanPython, rauntOyna,
  stratejiDegerlendir, sumoSensorIsini, sumoSensorOkumasi,
  type Dizilis, type Durum, type Hamle, type HazirRakip, type RauntSonucu, type StratejiDegerlendirme, type StratejiKartlari, type SumoKaresi
} from "@sra/robot-motoru";

const DIZILIS_ADI: Record<Dizilis, string> = { karsi: "Karşı karşıya", yan: "Yan yana", sirt: "Sırt sırta" };
const RENK = { ben: "#6A48F0", rakip: "#E3262F" };
/** Öğrencinin son kartları: dersler arasında taşınır (strateji görevi ve kod dersi aynı kartlardan başlar) */
const KART_ANAHTARI = "sra-sumo-kartlar";
export const LIG_TASLAK_ANAHTARI = "sra-lig-taslak";
function kayitliKartlar(): StratejiKartlari {
  try {
    const k = JSON.parse(localStorage.getItem(KART_ANAHTARI) ?? "null");
    if (k && typeof k === "object") {
      const r = { ...BASLANGIC_KARTLARI };
      for (const d of DURUMLAR) if (typeof k[d.k] === "string" && k[d.k] in HAMLELER) r[d.k] = k[d.k];
      return r;
    }
  } catch { /* yok ya da bozuk */ }
  return { ...BASLANGIC_KARTLARI };
}
const kartlariKaydet = (k: StratejiKartlari) => { try { localStorage.setItem(KART_ANAHTARI, JSON.stringify(k)); } catch { /* depolama yok */ } };

/* ---------- strateji kartları tablosu ---------- */
export function kartTablosu(kartlar: StratejiKartlari, acik: readonly Durum[], sabit: Partial<StratejiKartlari>, degisince: () => void): HTMLElement {
  for (const [d, h] of Object.entries(sabit) as [Durum, Hamle][]) kartlar[d] = h;
  const satirlar = DURUMLAR.map((d) => {
    const kimlik = `sk-${d.k}-${Math.random().toString(36).slice(2, 6)}`;
    const ac = acik.includes(d.k);
    const sec = el("select", "sk-sec", { id: kimlik, "data-durum": d.k, ...(ac ? {} : { disabled: "" }) }, ...Object.entries(HAMLELER).map(([k, h]) => el("option", "", { value: k }, h.ad))) as HTMLSelectElement;
    sec.value = kartlar[d.k];
    sec.addEventListener("change", () => { kartlar[d.k] = sec.value as Hamle; if (ac) kartlariKaydet(kartlar); degisince(); });
    return el("div", ac ? "sk-satir" : "sk-satir sk-satir--sabit", {},
      el("label", "", { for: kimlik }, el("b", "", {}, d.ad), el("small", "", {}, ac ? d.aciklama : "Bu derste sabit")), sec);
  });
  return el("div", "sk", { role: "group", "aria-label": "Strateji kartları: her duruma bir hamle" }, ...satirlar);
}

/* ---------- ring çizimi ---------- */
function ringCizici(tuval: HTMLCanvasElement) {
  return (kare: SumoKaresi | null, baslangic?: [[number, number, number], [number, number, number]]) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = tuval.clientWidth || 360;
    if (tuval.width !== Math.round(w * dpr)) { tuval.width = tuval.height = Math.round(w * dpr); }
    const c = tuval.getContext("2d");
    if (!c) return;
    const o = w / 900; // 90 cm görüş alanı
    c.setTransform(dpr * o, 0, 0, -dpr * o, dpr * w / 2, dpr * w / 2);
    c.fillStyle = "#EDE9F7"; c.fillRect(-460, -460, 920, 920);
    c.fillStyle = "#F7F7F4"; c.beginPath(); c.arc(0, 0, RING.yaricap, 0, 7); c.fill();
    c.fillStyle = "#1D1B19"; c.beginPath(); c.arc(0, 0, RING.kenarIc, 0, 7); c.fill();
    c.fillStyle = "#8B5A2B"; c.fillRect(-55, -50, 10, 100); c.fillRect(45, -50, 10, 100); // başlangıç çizgileri
    const robotlar = kare ? kare.robotlar.map((r) => [r.x, r.y, r.yon] as const) : baslangic ?? [];
    robotlar.forEach(([x, y, yon], i) => {
      const r = kare?.robotlar[i];
      /* sensör ışınları: rakibi gören sensör */
      if (r) r.rakip.forEach((v, j) => {
        if (!v) return;
        const s = sumoSensorIsini([x, y, yon], j);
        c.strokeStyle = i === 0 ? "rgba(106,72,240,.8)" : "rgba(227,38,47,.7)"; c.lineWidth = 6;
        c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + Math.cos(s.aci) * 220, s.y + Math.sin(s.aci) * 220); c.stroke();
      });
      c.save(); c.translate(x, y); c.rotate(yon);
      c.globalAlpha = r?.dustu ? 0.5 : 1;
      c.fillStyle = i === 0 ? RENK.ben : RENK.rakip; c.strokeStyle = "#17144A"; c.lineWidth = 6;
      c.beginPath(); c.roundRect(-50, -50, 100, 100, 12); c.fill(); c.stroke();
      c.fillStyle = "#C9C6D6"; c.fillRect(44, -50, 10, 100); // bıçak
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(30, 0); c.lineTo(5, 18); c.lineTo(5, -18); c.fill(); // yön oku
      if (r) KENSHIN.zeminSensorleri.forEach((z, j) => { c.fillStyle = r.kenar[j] ? "#F5A300" : "#3A365E"; c.beginPath(); c.arc(z.x, z.y, 9, 0, 7); c.fill(); });
      c.restore();
    });
  };
}
/** Raundu oynatır: gerçek zamanlı (20 ms kareler) ya da hareketi azaltta son kare */
function oynatici(tuval: HTMLCanvasElement, kap: HTMLElement) {
  const ciz = ringCizici(tuval);
  let dongu = 0;
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    ciz,
    oynat(r: RauntSonucu, bitti: () => void) {
      cancelAnimationFrame(dongu);
      const k = r.kareler;
      if (azHareket) { ciz(k[k.length - 1]); bitti(); return; }
      const bas = performance.now();
      const adim = (z: number) => {
        const t = (z - bas) / 1000, i = Math.min(k.length - 1, Math.floor(t / 0.02));
        ciz(k[i]);
        if (i >= k.length - 1 || !kap.isConnected) { bitti(); return; }
        dongu = requestAnimationFrame(adim);
      };
      dongu = requestAnimationFrame(adim);
    },
    atla(r: RauntSonucu) { cancelAnimationFrame(dongu); ciz(r.kareler[r.kareler.length - 1]); }
  };
}
const sonucYazisi = (r: RauntSonucu, rakipAdi = "Rakip") =>
  r.kazanan === 0 ? `Kazandın: ${rakipAdi.toLowerCase() === "rakip" ? "rakip" : rakipAdi} ${String(r.sure).replace(".", ",")}. saniyede ringden düştü.`
  : r.kazanan === 1 ? `Kaybettin: ${String(r.sure).replace(".", ",")}. saniyede ringden düştün.`
  : r.sebep === "ikisi_dustu" ? "Berabere: ikiniz birden düştünüz." : "Berabere: süre doldu, ikiniz de ringdesiniz.";

/* ---------- ring simülasyonu (deney) ---------- */
export interface RingAyari { acik: Durum[]; sabit?: Partial<StratejiKartlari>; rakip?: HazirRakip; rakipSecilir?: boolean }
export function ringSimulasyonu(a: RingAyari, denendi: (d: string) => void): HTMLElement {
  const kartlar = kayitliKartlar();
  let rakip: HazirRakip = a.rakip ?? "bekleyen", dizilis: Dizilis = "karsi";
  const tuval = el("canvas", "rs-tuval", { role: "img", "aria-label": "Üstten bakışla 77 cm'lik ring: mor robot sensin, kırmızı robot rakip." }) as HTMLCanvasElement;
  const sonuc = el("p", "rs-sonuc", { "aria-live": "polite" }, "Kartları seç ve raundu oynat.");
  const oyna = dugme({ metin: "Raundu oynat", tur: "ana", ikon: "oynat", id: "rs-oyna" }) as HTMLButtonElement;
  const kap = el("div", "rs", { "data-deney": "ring-simulasyonu" });
  const o = oynatici(tuval, kap);
  const rakipAciklama = el("p", "rs-rakip-aciklama", {}, HAZIR_RAKIPLER[rakip].aciklama);
  const baslangicCiz = () => o.ciz(null, baslangic(dizilis, 3));
  const secimler = el("div", "rs-secimler", {},
    el("div", "", {}, el("span", "rs-etiket", {}, "Başlangıç"), secici("Başlangıç dizilişi", DIZILISLER.map((d) => [d, DIZILIS_ADI[d]] as [Dizilis, string]), dizilis, (d) => { dizilis = d; baslangicCiz(); })),
    ...(a.rakipSecilir ? [el("div", "", {}, el("span", "rs-etiket", {}, "Rakip"), secici("Rakip", (Object.keys(HAZIR_RAKIPLER) as HazirRakip[]).map((r) => [r, HAZIR_RAKIPLER[r].ad] as [HazirRakip, string]), rakip, (r) => { rakip = r; rakipAciklama.textContent = HAZIR_RAKIPLER[r].aciklama; }))] : []),
    rakipAciklama);
  kap.append(el("div", "rs-duzen", {}, el("div", "", {}, kartTablosu(kartlar, a.acik, a.sabit ?? {}, () => {})), el("div", "rs-sahne", {}, tuval, el("div", "rs-kontrol", {}, oyna, sonuc))), secimler);
  oyna.addEventListener("click", () => {
    const r = rauntOyna([kartBeyni(kartlar), kartBeyni(HAZIR_RAKIPLER[rakip].kartlar)], dizilis, 3);
    oyna.disabled = true; sonuc.textContent = "Raunt sürüyor…";
    kap.dataset.raunt = String(Number(kap.dataset.raunt ?? 0) + 1);
    o.oynat(r, () => {
      oyna.disabled = false;
      sonuc.textContent = sonucYazisi(r, HAZIR_RAKIPLER[rakip].ad);
      kap.dataset.sonuc = r.kazanan === 0 ? "kazandi" : r.kazanan === 1 ? "kaybetti" : "berabere";
      denendi(`${a.acik.map((d) => kartlar[d]).join(",")}|${rakip}|${dizilis}`);
    });
  });
  requestAnimationFrame(baslangicCiz);
  if (typeof ResizeObserver === "function") new ResizeObserver(() => baslangicCiz()).observe(tuval);
  return kap;
}

/* ---------- strateji görevi ---------- */
export function stratejiGorevi(acik: Durum[], sabit: Partial<StratejiKartlari>, d: StratejiDegerlendirme, yildiz: (n: number) => void): HTMLElement {
  const kartlar = kayitliKartlar();
  const tuval = el("canvas", "rs-tuval", { role: "img", "aria-label": "Üstten bakışla ring: mor robot sensin, kırmızı robot rakip." }) as HTMLCanvasElement;
  const oyna = dugme({ metin: "Görevi oyna", tur: "ana", ikon: "oynat", id: "sg-oyna" }) as HTMLButtonElement;
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "Kartlarını seç ve görevi oyna.");
  const liste = el("ol", "rs-rauntlar", { "aria-label": "Oynanan rauntlar" });
  const kap = el("div", "rs", { "data-deney": "strateji-gorevi" });
  const o = oynatici(tuval, kap);
  kap.append(el("div", "rs-duzen", {}, el("div", "", {}, kartTablosu(kartlar, acik, sabit, () => {})), el("div", "rs-sahne", {}, tuval, el("div", "rs-kontrol", {}, oyna, sonuc), liste)));
  oyna.addEventListener("click", () => {
    const s = stratejiDegerlendir(kartlar, d);
    kap.dataset.yildiz = String(s.yildiz);
    sonuc.replaceChildren(yildizlar(3, s.yildiz), el("b", "", {}, s.yildiz ? ` ${s.yildiz} / 3 yıldız` : " Yıldız yok: kartlarını değiştirip yeniden dene."));
    const izle = (i: number) => {
      liste.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
      o.oynat(s.rauntlar[i].sonuc, () => {});
    };
    liste.replaceChildren(...s.rauntlar.map((r, i) => {
      const b = el("button", r.iyi ? "iyi" : "", { type: "button", "aria-pressed": "false" },
        el("span", "", {}, r.iyi ? "✓" : "✗"), ` ${HAZIR_RAKIPLER[r.rakip].ad} · ${DIZILIS_ADI[r.dizilis]}: `, el("span", "", {}, sonucYazisi(r.sonuc, HAZIR_RAKIPLER[r.rakip].ad)));
      b.addEventListener("click", () => izle(i));
      return el("li", "", {}, b);
    }));
    izle(0);
    yildiz(s.yildiz);
  });
  requestAnimationFrame(() => o.ciz(null, baslangic("karsi", 1)));
  return kap;
}

/* ---------- sensör görüş göstergesi ---------- */
const SENSOR_ADLARI = ["sol yan", "sol ön", "orta", "sağ ön", "sağ yan"];
export function sensorGorusu(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const NS = "http://www.w3.org/2000/svg";
  const s = (ad: string, at: Record<string, string | number>) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
  const ben: [number, number, number] = [-120, 0, 0];
  let rakip: [number, number, number] = [180, 60, Math.PI];
  /* SVG'de y aşağı: dünya y'si ters çevrilir */
  const svg = s("svg", { viewBox: "-450 -450 900 900", class: "sgo-svg", tabindex: 0, role: "application", "aria-label": "Ring üstünde rakibi sürükle; ok tuşlarıyla da kaydırabilirsin." });
  svg.append(s("circle", { cx: 0, cy: 0, r: RING.yaricap, fill: "#F7F7F4" }), s("circle", { cx: 0, cy: 0, r: RING.kenarIc, fill: "#1D1B19" }));
  const isinlar = KENSHIN.sensorler.map(() => { const l = s("line", { class: "sgo-isin", "stroke-width": 8, "stroke-linecap": "round" }); svg.append(l); return l; });
  const kutu = (renk: string) => { const g = s("g", {}); g.append(s("rect", { x: -50, y: -50, width: 100, height: 100, rx: 12, fill: renk, stroke: "#17144A", "stroke-width": 6 }), s("rect", { x: 44, y: -50, width: 10, height: 100, fill: "#C9C6D6" }), s("path", { d: "M30 0 L5 18 L5 -18 Z", fill: "#fff" })); return g; };
  const benG = kutu(RENK.ben), rakipG = kutu(RENK.rakip);
  benG.setAttribute("transform", `translate(${ben[0]} ${-ben[1]}) rotate(${-ben[2] * 180 / Math.PI})`);
  rakipG.classList.add("sgo-rakip");
  svg.append(benG, rakipG);
  const kutular = SENSOR_ADLARI.map((ad) => el("span", "sgo-sensor", {}, el("i", "", {}), ad));
  const dizi = el("code", "sgo-dizi", {}, "");
  const durum = el("p", "s2-gizli", { "aria-live": "polite" }, "");
  const kap = el("div", "sgo", { "data-deney": "sensor-gorusu" }, svg,
    el("div", "sgo-yan", {}, el("p", "sgo-baslik", {}, "Kenshin'in rakip sensörleri"), el("div", "sgo-sensorler", {}, ...kutular),
      el("p", "sgo-kod", {}, "Lab'da: ", el("code", "", {}, 'robot["rakip"]'), " = ", dizi), el("p", "sgo-not", {}, "Menzil 60 cm. Sensörün dar bir görüş çizgisi var: arada kalan yerler kör noktadır.")), durum);
  let ilk = true;
  const guncelle = () => {
    rakipG.setAttribute("transform", `translate(${rakip[0]} ${-rakip[1]}) rotate(${-rakip[2] * 180 / Math.PI})`);
    const g = sumoSensorOkumasi(ben, rakip);
    g.rakip.forEach((v, i) => {
      const r = sumoSensorIsini(ben, i);
      isinlar[i].setAttribute("x1", String(r.x)); isinlar[i].setAttribute("y1", String(-r.y));
      isinlar[i].setAttribute("x2", String(r.x + Math.cos(r.aci) * KENSHIN.menzil)); isinlar[i].setAttribute("y2", String(-(r.y + Math.sin(r.aci) * KENSHIN.menzil)));
      isinlar[i].classList.toggle("goruyor", !!v);
      kutular[i].classList.toggle("goruyor", !!v);
    });
    dizi.textContent = `[${g.rakip.join(", ")}]`;
    kap.dataset.rakip = g.rakip.join("");
    const gorenler = SENSOR_ADLARI.filter((_, i) => g.rakip[i]);
    durum.textContent = gorenler.length ? `Rakibi gören: ${gorenler.join(", ")}` : "Hiçbir sensör rakibi görmüyor";
    if (!ilk) denendi(g.rakip.join(""));
  };
  /* sürükleme: svg koordinatına çevir; rakip ringin içinde kalır ve robotun üstüne binmez */
  const yerlestir = (x: number, y: number) => {
    const d = Math.hypot(x, y), sinir = RING.kenarIc - 70;
    if (d > sinir) { x *= sinir / d; y *= sinir / d; }
    if (Math.hypot(x - ben[0], y - ben[1]) < 130) return;
    rakip = [x, y, Math.atan2(ben[1] - y, ben[0] - x)];
    guncelle();
  };
  let surukle = false;
  const nokta = (e: PointerEvent) => { const p = svg.getBoundingClientRect(); return [(e.clientX - p.left) / p.width * 900 - 450, -((e.clientY - p.top) / p.height * 900 - 450)] as const; };
  svg.addEventListener("pointerdown", (e) => { surukle = true; svg.setPointerCapture?.(e.pointerId); ilk = false; yerlestir(...nokta(e)); });
  svg.addEventListener("pointermove", (e) => { if (surukle) yerlestir(...nokta(e)); });
  svg.addEventListener("pointerup", () => { surukle = false; });
  svg.addEventListener("keydown", (e) => {
    const a = e.shiftKey ? 60 : 20, [x, y] = rakip;
    const yeni = e.key === "ArrowLeft" ? [x - a, y] : e.key === "ArrowRight" ? [x + a, y] : e.key === "ArrowUp" ? [x, y + a] : e.key === "ArrowDown" ? [x, y - a] : null;
    if (!yeni) return;
    e.preventDefault(); ilk = false; yerlestir(yeni[0], yeni[1]);
  });
  guncelle();
  return kap;
}

/* ---------- itme deneyi ---------- */
export function itmeDeneyi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  const oz = { kutle: 470, tutunma: 1.0, bicak: true };
  const tuval = el("canvas", "rs-tuval", { role: "img", "aria-label": "Ringin ortasında iki Kenshin burun buruna: mor robot senin ayarların, kırmızı robot standart Kenshin." }) as HTMLCanvasElement;
  const sonuc = el("p", "rs-sonuc", { "aria-live": "polite" }, "Ayarları seç ve iki robotu birbirine sür.");
  const oyna = dugme({ metin: "İtişmeyi başlat", tur: "ana", ikon: "oynat", id: "it-oyna" }) as HTMLButtonElement;
  const kap = el("div", "rs", { "data-deney": "itme-deneyi" });
  const o = oynatici(tuval, kap);
  const konum: [[number, number, number], [number, number, number]] = [[-80, 0, 0], [80, 0, Math.PI]];
  kap.append(el("div", "rs-duzen", {},
    el("div", "it-ayarlar", {},
      kaydirici({ etiket: "Ağırlık", en: 300, ust: 500, adim: 10, birim: "g", baslangic: oz.kutle, degisince: (v) => { oz.kutle = v; } }),
      kaydirici({ etiket: "Lastik tutuşu", en: 0.5, ust: 1.5, adim: 0.1, baslangic: oz.tutunma, bicim: (v) => v.toFixed(1).replace(".", ","), degisince: (v) => { oz.tutunma = v; } }),
      el("div", "", {}, el("span", "rs-etiket", {}, "Bıçak"), secici("Bıçak", [["var", "Bıçak var"], ["yok", "Bıçak yok"]], "var", (v) => { oz.bicak = v === "var"; })),
      el("p", "it-not", {}, "Kırmızı robot standart Kenshin: 470 g, tutuş 1,0, bıçaklı. İki robot da tam güçle ileri sürer.")),
    el("div", "rs-sahne", {}, tuval, el("div", "rs-kontrol", {}, oyna, sonuc))));
  oyna.addEventListener("click", () => {
    const tam = () => [255, 255] as [number, number];
    const r = rauntOyna([tam, tam], "karsi", 1, 6, [{ kutle: oz.kutle / 1000, tutunma: oz.tutunma, bicak: oz.bicak }, {}], konum);
    oyna.disabled = true; sonuc.textContent = "İtişiyorlar…";
    o.oynat(r, () => {
      oyna.disabled = false;
      const son = r.kareler[r.kareler.length - 1].robotlar;
      sonuc.textContent = r.kazanan === 0 ? `Senin robotun itti: rakip ${String(r.sure).replace(".", ",")}. saniyede düştü.`
        : r.kazanan === 1 ? `Rakip itti: senin robotun ${String(r.sure).replace(".", ",")}. saniyede düştü.`
        : `Kimse itemedi: ${son[0].x + 80 > 15 ? "senin robotun biraz ilerledi" : son[0].x + 80 < -15 ? "rakip seni biraz geri itti" : "ikisi de olduğu yerde kaldı"}.`;
      kap.dataset.sonuc = r.kazanan === 0 ? "kazandi" : r.kazanan === 1 ? "kaybetti" : "berabere";
      denendi(`${oz.kutle}|${oz.tutunma}|${oz.bicak}`);
    });
  });
  requestAnimationFrame(() => o.ciz(null, konum));
  return kap;
}

/* ---------- kartlardan kod ---------- */
export function kartKodu(a: { acik: Durum[] }, denendi: (d: string) => void): HTMLElement {
  const kartlar = kayitliKartlar();
  const kodKutusu = el("div", "kk-kod");
  const adGirdi = el("input", "s2-girdi", { type: "text", maxlength: "40", value: "Kartlarla yazdığım Kenshin", id: "kk-ad", "aria-label": "Robotunun adı" }) as HTMLInputElement;
  const yaz = () => { kodKutusu.replaceChildren(kodCercevesi("hamle.py", kartlardanPython(kartlar, adGirdi.value.trim() || "Robotum"))); };
  const gonder = dugme({ metin: "Lab'daki lige götür", tur: "ana", ikon: "ileri", ikonSonda: true, href: "lab/#lig", id: "kk-gonder" });
  const bilgi = el("p", "kk-bilgi", { "aria-live": "polite" }, "Kartlarını değiştirdikçe kod da değişir. Hazır olunca Lab'daki lige götür: kod editöre yüklenir.");
  gonder.addEventListener("click", () => {
    try { localStorage.setItem(LIG_TASLAK_ANAHTARI, JSON.stringify({ ad: adGirdi.value.trim() || "Robotum", kod: kartlardanPython(kartlar, adGirdi.value.trim() || "Robotum") })); } catch { /* depolama yok */ }
    denendi("gonderildi");
  });
  adGirdi.addEventListener("input", yaz);
  yaz();
  return el("div", "rs kk", { "data-deney": "kart-kodu" },
    el("div", "rs-duzen", {}, el("div", "", {}, el("label", "rs-etiket", { for: "kk-ad" }, "Robotunun adı"), adGirdi, kartTablosu(kartlar, a.acik, {}, yaz)),
      el("div", "", {}, kodKutusu, el("div", "rs-kontrol", {}, gonder), bilgi)));
}

export const SUMO_STILI = `
.rs{display:grid;gap:16px;margin-top:6px}
.rs-duzen{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}
.rs-duzen>*{min-width:0}
@media (max-width:820px){.rs-duzen{grid-template-columns:1fr}}
.rs-sahne{display:grid;gap:10px}
.rs-tuval{display:block;width:100%;max-width:440px;aspect-ratio:1;border-radius:var(--sra2-kose-2);border:3px solid var(--sra2-murekkep);margin:0 auto}
.rs-kontrol{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center}
.rs-sonuc{margin:0;font-weight:800;color:var(--sra2-murekkep);flex:1;min-width:180px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rs-etiket{display:block;font-weight:800;color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1);margin-bottom:4px}
.rs-secimler{display:flex;flex-wrap:wrap;gap:14px 24px;align-items:end}
.rs-rakip-aciklama{margin:0;color:var(--sra2-murekkep-2);font-weight:700;flex-basis:100%}
.rs-rauntlar{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.rs-rauntlar button{width:100%;text-align:left;padding:8px 12px;border-radius:12px;border:2px solid var(--sra2-lavanta-2);background:#fff;font:700 var(--sra2-boy-1) var(--sra2-yazi);color:var(--sra2-murekkep);cursor:pointer}
.rs-rauntlar button span:first-child{font-weight:900;color:var(--sra2-kirmizi-taban)}
.rs-rauntlar button.iyi span:first-child{color:var(--sra2-yesil-taban)}
.rs-rauntlar button[aria-pressed=true]{border-color:var(--sra2-mor)}
.sk{display:grid;gap:8px}
.sk-satir{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,190px);gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--sra2-lavanta)}
.sk-satir--sabit{opacity:.6}
.sk-satir label{display:grid;gap:2px}
.sk-satir small{color:var(--sra2-murekkep-2);font-weight:600;line-height:1.3}
.sk-sec{min-height:44px;border-radius:12px;border:2px solid var(--sra2-mor);background:#fff;font:800 var(--sra2-boy-1) var(--sra2-yazi);color:var(--sra2-murekkep);padding:0 10px}
.sk-sec:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:2px}
@media (max-width:480px){.sk-satir{grid-template-columns:1fr}}
.sgo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:center}
@media (max-width:820px){.sgo{grid-template-columns:1fr}}
.sgo-svg{width:100%;max-width:440px;margin:0 auto;display:block;border-radius:50%;touch-action:none;cursor:grab}
.sgo-svg:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:4px}
.sgo-isin{stroke:rgba(255,255,255,.18)}
.sgo-isin.goruyor{stroke:#F5A300}
.sgo-rakip{cursor:grab}
.sgo-yan{display:grid;gap:10px}
.sgo-yan p{margin:0}
.sgo-baslik{font-weight:800}
.sgo-sensorler{display:flex;flex-wrap:wrap;gap:8px}
.sgo-sensor{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:var(--sra2-lavanta);font-weight:800;font-size:var(--sra2-boy-1)}
.sgo-sensor i{width:12px;height:12px;border-radius:50%;background:#3A365E}
.sgo-sensor.goruyor{background:#FFF1C9}
.sgo-sensor.goruyor i{background:#F5A300;box-shadow:0 0 6px #F5A300}
.sgo-kod code{font-family:var(--sra2-yazi-kod)}
.sgo-not,.it-not{color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1)}
.it-ayarlar{display:grid;gap:16px}
.kk-kod .s2-kod{overflow:hidden}
.kk-kod pre{max-height:380px;overflow:auto;margin:0}
#kk-ad{min-height:44px;padding:0 12px;border-radius:12px;border:2px solid var(--sra2-lavanta-2);font:700 var(--sra2-boy-2) var(--sra2-yazi);color:var(--sra2-murekkep);box-sizing:border-box}
#kk-ad:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:2px}
.kk-bilgi{margin:6px 0 0;color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1)}
#kk-ad{width:100%;margin-bottom:12px}
`;
