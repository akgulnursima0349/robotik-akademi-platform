/* İlkokul kart programı: kartlara dokunarak program dizilir (sürükleme yok), program Kar Küreme şehrinde koşar.
   Kartın adı eklenince sesli okunur (ses açıksa). Kartlar iç içe olabilir: tekrarla, eğer (ve değilse), sürece.
   Görevler: kartGorevi (hazır görevler) ve tasarimGorevi (çocuğun kendi haritası). */
import { dugme, el, sesServisi, yildizlar } from "@sra/tasarim/v2";
import {
  bosTasarim, haritaCoz, haritaKodla, KART_ADLARI, KART_GOREVLERI, KART_HATA_YAZILARI, kartDegerlendir, kartSay, KOSUL_ADLARI, SURECE_ADLARI,
  TASARIM, TASARIM_PILI, tasarimYildizi, TEKRAR_SINIRI, Izgara, ENERJI,
  type Kart, type KartKosusu, type KartSonucu, type KartTuru, type Kosul, type Yon
} from "@sra/robot-motoru";

const NS = "http://www.w3.org/2000/svg";
const s = (ad: string, at: Record<string, string | number> = {}) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
export const azHareket = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const H = 60;
export const KART_IKONU: Record<KartTuru, string> = { ileri: "↑", sag: "↱", sol: "↰", tekrarla: "⟳", eger: "?", surece: "∞" };
const PROGRAM_SINIRI = 30;

/* ---------- Kar Küreme şehri (üstten, SVG) ---------- */
export interface Sehir {
  svg: SVGSVGElement;
  izgara: Izgara;
  /** iz karesine göre robotu ve karları çizer */
  kare(k: KartKosusu | null, f: number): void;
  /** başlangıç durumu */
  sifirla(): void;
  hucreler: SVGRectElement[][];
}
export function mbotIkonu(): SVGGElement {
  const g = s("g", { class: "kp-robot" }) as SVGGElement;
  g.append(
    s("rect", { x: -16, y: -21, width: 9, height: 16, rx: 3, fill: "#17144A" }), s("rect", { x: 7, y: -21, width: 9, height: 16, rx: 3, fill: "#17144A" }),
    s("rect", { x: -13, y: -18, width: 26, height: 36, rx: 6, fill: "#1E88E5", stroke: "#fff", "stroke-width": 3 }),
    s("circle", { cx: -6, cy: -18, r: 4.5, fill: "#CFD8DC", stroke: "#37474F", "stroke-width": 1.5 }), s("circle", { cx: 6, cy: -18, r: 4.5, fill: "#CFD8DC", stroke: "#37474F", "stroke-width": 1.5 })
  );
  return g;
}
export function sehirKur(harita: readonly string[], yon: Yon, etiket: string): Sehir {
  const izgara = new Izgara(harita), G = izgara.genislik, Y = izgara.yukseklik;
  const svg = s("svg", { viewBox: `0 0 ${G * H} ${Y * H}`, class: "kp-sehir", role: "img", "aria-label": etiket }) as SVGSVGElement;
  /* yükseklik en çok 340 px: geniş sokaklar boşluksuz, ortalı */
  svg.style.maxWidth = `${Math.round((340 * G) / Y)}px`;
  const hucreler: SVGRectElement[][] = [];
  const karlar = new Map<string, SVGElement>();
  for (let y = 0; y < Y; y++) {
    hucreler.push([]);
    for (let x = 0; x < G; x++) {
      const t = izgara.hucre(x, y);
      const r = s("rect", { x: x * H + 1, y: y * H + 1, width: H - 2, height: H - 2, rx: t === "bina" ? 8 : 3, class: `kp-h kp-h--${t}`, "data-x": x, "data-y": y }) as SVGRectElement;
      hucreler[y].push(r); svg.append(r);
      if (t === "bina") svg.append(s("rect", { x: x * H + 14, y: y * H + 14, width: 12, height: 12, rx: 2, class: "kp-pencere" }), s("rect", { x: x * H + 34, y: y * H + 14, width: 12, height: 12, rx: 2, class: "kp-pencere" }));
      if (t === "istasyon") { const b = s("path", { d: `M${x * H + 33} ${y * H + 10} L${x * H + 20} ${y * H + 33} L${x * H + 30} ${y * H + 33} L${x * H + 26} ${y * H + 50} L${x * H + 41} ${y * H + 26} L${x * H + 31} ${y * H + 26} Z`, class: "kp-simsek" }); svg.append(b); }
      if (izgara.karVar(x, y)) {
        const k = s("g", { class: "kp-kar" });
        k.append(s("rect", { x: x * H + 6, y: y * H + 6, width: H - 12, height: H - 12, rx: 14 }), s("circle", { cx: x * H + 22, cy: y * H + 26, r: 3 }), s("circle", { cx: x * H + 38, cy: y * H + 36, r: 3 }));
        karlar.set(`${x},${y}`, k); svg.append(k);
      }
    }
  }
  const robot = mbotIkonu(); svg.append(robot);
  const yerlestir = (x: number, y: number, yn: number) => robot.setAttribute("transform", `translate(${x * H + H / 2} ${y * H + H / 2}) rotate(${yn * 90})`);
  const sehir: Sehir = {
    svg, izgara, hucreler,
    sifirla() { karlar.forEach((k) => k.removeAttribute("display")); yerlestir(izgara.baslangic.x, izgara.baslangic.y, yon); },
    kare(k, f) {
      if (!k) return sehir.sifirla();
      const iz = k.sim.iz, son = iz[Math.min(f, iz.length - 1)];
      const temiz = new Set(iz.slice(0, f + 1).filter((z) => z.temizlenen).map((z) => `${z.temizlenen!.x},${z.temizlenen!.y}`));
      karlar.forEach((e, a) => (temiz.has(a) ? e.setAttribute("display", "none") : e.removeAttribute("display")));
      yerlestir(son.x, son.y, son.yon);
      robot.classList.toggle("kp-robot--carpti", son.olay === "carpma");
    }
  };
  sehir.sifirla();
  return sehir;
}

/* ---------- kart düzenleyici ---------- */
type Yuva = { liste: Kart[]; ad: string };
export interface KartDuzenleyici { kap: HTMLElement; program: Kart[]; vurgula(k: Kart | null): void; yenile(): void; kilit(v: boolean): void }
export function kartDuzenleyici(turler: KartTuru[], program: Kart[], degisti: () => void): KartDuzenleyici {
  const ses = sesServisi();
  const kokYuva: Yuva = { liste: program, ad: "Program" };
  let aktif: Yuva = kokYuva, kilitli = false;
  const ogeler = new Map<Kart, HTMLElement>();
  const agac = el("div", "kp-program", { "aria-label": "Program" });
  const bilgi = el("p", "kp-bilgi", { "aria-live": "polite" }, "");
  const yeniKart = (t: KartTuru): Kart => t === "tekrarla" ? { tur: t, kez: 3, ic: [] } : t === "eger" ? { tur: t, kosul: "onu-kapali", ic: [], degilse: [] } : t === "surece" ? { tur: t, kosul: "onu-acik", ic: [] } : { tur: t };
  const palet = el("div", "kp-palet", { role: "group", "aria-label": "Kartlar" }, ...turler.map((t) => {
    const b = el("button", `kp-palet__kart kp-k--${t}`, { type: "button", "data-kart": t }, el("span", "kp-ikon", { "aria-hidden": "true" }, KART_IKONU[t]), KART_ADLARI[t]);
    b.addEventListener("click", () => {
      if (kilitli) return;
      if (kartSay(program) >= PROGRAM_SINIRI) { bilgi.textContent = `En çok ${PROGRAM_SINIRI} kart.`; return; }
      aktif.liste.push(yeniKart(t));
      ses.oku(KART_ADLARI[t]);
      bilgi.textContent = `${KART_ADLARI[t]} eklendi: ${aktif.ad}.`;
      ciz(); degisti();
    });
    return b;
  }));
  const yuvaDugmesi = (y: Yuva) => {
    const b = el("button", "kp-yuva", { type: "button", "aria-pressed": String(y === aktif), "data-yuva": y.ad }, y === aktif ? "Kartlar buraya ekleniyor" : "Buraya ekle");
    b.addEventListener("click", () => { aktif = y; bilgi.textContent = `Kartlar artık buraya ekleniyor: ${y.ad}.`; ciz(); });
    return b;
  };
  const liste = (yuva: Yuva, derin: number): HTMLElement => {
    const ol = el("ol", "kp-liste", { "data-derin": String(derin) });
    yuva.liste.forEach((k, i) => {
      const sil = el("button", "kp-sil", { type: "button", "aria-label": `${KART_ADLARI[k.tur]} kartını sil` }, "×");
      sil.addEventListener("click", () => { if (kilitli) return; yuva.liste.splice(i, 1); if (!yolVar(kokYuva.liste, aktif.liste)) aktif = kokYuva; ciz(); degisti(); });
      const bas = el("div", "kp-kart__bas", {}, el("span", "kp-ikon", { "aria-hidden": "true" }, KART_IKONU[k.tur]), el("b", "", {}, KART_ADLARI[k.tur]));
      const li = el("li", `kp-kart kp-k--${k.tur}`, { "data-kart": k.tur }, bas);
      if (k.tur === "tekrarla") {
        const say = el("output", "kp-kez", {}, `${k.kez} kez`);
        const azalt = el("button", "kp-mini", { type: "button", "aria-label": "Bir azalt" }, "−"), arttir = el("button", "kp-mini", { type: "button", "aria-label": "Bir artır" }, "+");
        azalt.addEventListener("click", () => { if (kilitli) return; k.kez = Math.max(TEKRAR_SINIRI.en, k.kez - 1); ciz(); degisti(); });
        arttir.addEventListener("click", () => { if (kilitli) return; k.kez = Math.min(TEKRAR_SINIRI.ust, k.kez + 1); ciz(); degisti(); });
        bas.append(azalt, say, arttir);
      }
      if (k.tur === "eger" || k.tur === "surece") {
        const adlar = k.tur === "eger" ? KOSUL_ADLARI : SURECE_ADLARI;
        const sec = el("select", "kp-kosul", { "aria-label": "Koşul" }, ...(Object.keys(adlar) as Kosul[]).map((c) => el("option", "", { value: c }, adlar[c]))) as HTMLSelectElement;
        sec.value = k.kosul;
        sec.addEventListener("change", () => { k.kosul = sec.value as Kosul; degisti(); });
        bas.append(sec);
      }
      bas.append(sil);
      if ("ic" in k) {
        const icYuva: Yuva = yuvaBul(k.ic) ?? { liste: k.ic, ad: k.tur === "eger" ? "Eğer kartının içi" : k.tur === "surece" ? "Sürece kartının içi" : "Tekrarla kartının içi" };
        yuvalar.set(k.ic, icYuva);
        li.append(liste(icYuva, derin + 1));
        if (k.tur === "eger") {
          const dYuva: Yuva = yuvaBul(k.degilse) ?? { liste: k.degilse, ad: "Değilse kolu" };
          yuvalar.set(k.degilse, dYuva);
          li.append(el("p", "kp-degilse", {}, "değilse"), liste(dYuva, derin + 1));
        }
      }
      ogeler.set(k, li);
      ol.append(li);
    });
    ol.append(el("li", "kp-yuva-satiri", {}, yuvaDugmesi(yuva)));
    return ol;
  };
  const yuvalar = new Map<Kart[], Yuva>([[program, kokYuva]]);
  const yuvaBul = (l: Kart[]) => yuvalar.get(l);
  const yolVar = (l: Kart[], hedef: Kart[]): boolean => l === hedef || l.some((k) => ("ic" in k && yolVar(k.ic, hedef)) || (k.tur === "eger" && yolVar(k.degilse, hedef)));
  const ciz = () => {
    ogeler.clear();
    agac.replaceChildren(liste(kokYuva, 0));
    sayac.textContent = `${kartSay(program)} kart`;
  };
  const sayac = el("span", "kp-sayac", {}, "");
  const temizle = dugme({ metin: "Temizle", kucuk: true, id: "kp-temizle" });
  temizle.addEventListener("click", () => { if (kilitli) return; program.splice(0); aktif = kokYuva; ciz(); degisti(); bilgi.textContent = "Program temizlendi."; });
  const kap = el("div", "kp-duzen", {}, palet, el("div", "kp-program-kap", {}, el("div", "kp-program-ust", {}, el("b", "", {}, "Programım"), sayac, temizle), agac), bilgi);
  ciz();
  return {
    kap, program,
    vurgula(k) { ogeler.forEach((e, kk) => e.classList.toggle("kp-calisan", kk === k)); },
    yenile: ciz,
    kilit(v) { kilitli = v; kap.classList.toggle("kp-kilitli", v); }
  };
}

/* ---------- çalıştırıcı: programı haritalarda koşar, ilkini oynatır ---------- */
interface Calistirici { kap: HTMLElement; calistir(): void; sehirAyarla(h: string[]): void }
function calistirici(o: {
  haritalar: () => string[][]; yon: Yon; batarya: () => number; duzen: KartDuzenleyici;
  degerlendir: (p: Kart[]) => KartSonucu; bitince: (r: KartSonucu) => void; etiket: string;
}): Calistirici {
  let sehirler = o.haritalar().map((h, i) => sehirKur(h, o.yon, `${o.etiket}: ${i + 1}. sokak`));
  const sehirYeri = el("div", "kp-sehirler");
  const pil = el("div", "kp-pil", { role: "meter", "aria-label": "Batarya", "aria-valuemin": "0" }, el("i"));
  const pilYazi = el("span", "kp-pil-yazi", {}, "");
  const durum = el("p", "kp-durum", { "aria-live": "polite" }, "");
  const calistirBtn = dugme({ metin: "Çalıştır", tur: "ana", ikon: "oynat", id: "kp-calistir" }) as HTMLButtonElement;
  let zaman = 0;
  const pilYaz = (b: number) => { const k = o.batarya(); (pil.firstChild as HTMLElement).style.width = `${(b / k) * 100}%`; pil.setAttribute("aria-valuenow", String(b)); pil.setAttribute("aria-valuemax", String(k)); pilYazi.textContent = `Batarya: ${b} / ${k}`; pil.classList.toggle("az", b / k < 0.25); };
  const sehirleriKoy = () => {
    sehirYeri.replaceChildren(...sehirler.map((x, i) => el("figure", "kp-sehir-kap", { "data-sokak": String(i + 1) }, x.svg, sehirler.length > 1 ? el("figcaption", "", {}, `${i + 1}. sokak`) : "")));
    pilYaz(o.batarya());
  };
  sehirleriKoy();
  const dur = () => { clearInterval(zaman); zaman = 0; o.duzen.kilit(false); calistirBtn.disabled = false; o.duzen.vurgula(null); };
  const calistir = () => {
    if (zaman) return;
    if (!o.duzen.program.length) { durum.textContent = "Önce programa kart ekle."; return; }
    const r = o.degerlendir(o.duzen.program);
    sehirler.forEach((x) => x.sifirla());
    o.duzen.kilit(true); calistirBtn.disabled = true;
    durum.textContent = "Robot çalışıyor…";
    /* her harita sırayla oynatılır; kart vurgusu iz karesine göre */
    let h = 0, f = 0;
    const kareKart = (k: KartKosusu) => { const m: (Kart | null)[] = []; for (const a of k.akis) if (a.kart.tur === "ileri" || a.kart.tur === "sag" || a.kart.tur === "sol") m[a.iz - 1] = a.kart; return m; };
    let haritaKartlari = kareKart(r.kosular[0]);
    const bitir = () => {
      dur();
      r.kosular.forEach((k, i) => sehirler[i].kare(k, k.sim.iz.length - 1));
      pilYaz(r.kosular[0].sim.batarya);
      durum.textContent = r.basarili ? `Tüm kar temizlendi! ${r.kart} kart, ${r.harcanan} enerji.` : KART_HATA_YAZILARI[r.sebep!];
      durum.dataset.sonuc = r.basarili ? "basarili" : r.sebep!;
      o.bitince(r);
    };
    if (azHareket()) { bitir(); return; }
    zaman = window.setInterval(() => {
      if (!document.body.contains(calistirBtn)) { dur(); return; }
      const k = r.kosular[h];
      sehirler[h].kare(k, f);
      if (h === 0) pilYaz(k.sim.iz[f].batarya);
      o.duzen.vurgula(haritaKartlari[f] ?? null);
      f++;
      if (f >= k.sim.iz.length) {
        h++; f = 0;
        if (h >= r.kosular.length) bitir(); else haritaKartlari = kareKart(r.kosular[h]);
      }
    }, 280);
  };
  calistirBtn.addEventListener("click", calistir);
  const baslat = dugme({ metin: "Baştan", kucuk: true, id: "kp-bastan" });
  baslat.addEventListener("click", () => { dur(); sehirler.forEach((x) => x.sifirla()); pilYaz(o.batarya()); durum.textContent = ""; delete durum.dataset.sonuc; });
  const kap = el("div", "kp-calistirici", {}, sehirYeri, el("div", "kp-pil-satiri", {}, pil, pilYazi), el("div", "rs-kontrol", {}, calistirBtn, baslat), durum);
  return {
    kap, calistir,
    sehirAyarla(h) { sehirler = [sehirKur(h, o.yon, o.etiket)]; sehirleriKoy(); }
  };
}

const kayitOku = (anahtar: string): Kart[] => { try { const v = JSON.parse(localStorage.getItem(anahtar) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const kayitYaz = (anahtar: string, p: Kart[]) => { try { localStorage.setItem(anahtar, JSON.stringify(p)); } catch { /* depolama kapalı */ } };

/** Hazır kart görevi (dersin Görev bölümü) */
export function kartGorevi(gorevAdi: string, yildiz: (n: number) => void): HTMLElement {
  const g = KART_GOREVLERI[gorevAdi];
  const anahtar = "sra-kart-" + g.kimlik;
  const program = kayitOku(anahtar);
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const duzen = kartDuzenleyici(g.kartlar, program, () => kayitYaz(anahtar, program));
  const c = calistirici({
    haritalar: () => g.haritalar, yon: g.yon, batarya: () => g.batarya, duzen, etiket: "Kar Küreme şehri",
    degerlendir: (p) => kartDegerlendir(g, p),
    bitince: (r) => {
      kap.dataset.yildiz = String(r.yildiz);
      sonuc.replaceChildren(yildizlar(3, r.yildiz), el("b", "", {}, ` ${r.yildiz} / 3 yıldız`),
        el("ul", "kp-olcut", {},
          el("li", r.basarili ? "tamam" : "", {}, r.basarili ? "✓ Bütün kar temizlendi" : "✗ Bütün kar temizlenmedi"),
          el("li", r.basarili && r.harcanan <= g.enerjiSiniri ? "tamam" : "", {}, `${r.basarili && r.harcanan <= g.enerjiSiniri ? "✓" : "✗"} En çok ${g.enerjiSiniri} enerji`),
          el("li", r.basarili && r.kart <= g.enAzKart ? "tamam" : "", {}, `${r.basarili && r.kart <= g.enAzKart ? "✓" : "✗"} En çok ${g.enAzKart} kart`)));
      if (r.yildiz) yildiz(r.yildiz);
    }
  });
  const kap = el("div", "rs kp", { "data-gorev": "kart", "data-kart-gorevi": g.kimlik },
    el("div", "kp-izgara", {}, el("div", "kp-sol", {}, c.kap), el("div", "kp-sag", {}, duzen.kap)), sonuc,
    g.haritalar.length > 1 ? el("p", "lb-not", {}, `Programın ${g.haritalar.length} sokağın hepsinde çalışmalı.`) : "");
  return kap;
}

/* ---------- harita tasarımcısı (ders 8) ---------- */
const TASARIM_ANAHTARI = "sra-tasarim-harita";
export const tasarimOku = (): string[] => { try { return haritaCoz(localStorage.getItem(TASARIM_ANAHTARI) ?? "") ?? bosTasarim(); } catch { return bosTasarim(); } };
const tasarimYaz = (h: string[]) => { try { localStorage.setItem(TASARIM_ANAHTARI, haritaKodla(h)); } catch { /* depolama kapalı */ } };
type Arac = "#" | "." | " " | "S" | "R";
const ARACLAR: [Arac, string][] = [["#", "Bina"], [".", "Kar"], [" ", "Temiz yol"], ["S", "Şarj"], ["R", "Robot"]];
export function haritaTasarimcisi(_ayar: Record<string, unknown>, denendi: (d: string) => void): HTMLElement {
  let harita = tasarimOku(), arac: Arac = ".";
  const yer = el("div", "kp-tasarim-yer");
  const kodYazi = el("output", "kp-kod", {}, "");
  const bilgi = el("p", "kp-bilgi", { "aria-live": "polite" }, "");
  const ciz = () => {
    const sh = sehirKur(harita, 1, "Harita tasarımı: bir araç seç, sonra hücrelere dokun.");
    sh.svg.classList.add("kp-tasarim");
    sh.hucreler.forEach((satir, y) => satir.forEach((r, x) => {
      if (x === 0 || y === 0 || x === TASARIM.genislik - 1 || y === TASARIM.yukseklik - 1) return;
      r.setAttribute("tabindex", "0"); r.setAttribute("role", "button");
      r.setAttribute("aria-label", `${x}. sütun, ${y}. satır`);
      const koy = () => {
        const satirlar = harita.map((s) => s.split(""));
        if (arac === "R") { for (const s of satirlar) for (let i = 0; i < s.length; i++) if (s[i] === "R") s[i] = " "; }
        else if (satirlar[y][x] === "R") { bilgi.textContent = "Robotun yerine başka şey konamaz; önce robotu taşı."; return; }
        satirlar[y][x] = arac;
        harita = satirlar.map((s) => s.join(""));
        tasarimYaz(harita); denendi(`${x},${y},${arac}`); ciz();
        (yer.querySelector(`[data-x="${x}"][data-y="${y}"]`) as SVGElement | null)?.focus();
      };
      r.addEventListener("click", koy);
      r.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); koy(); } });
    }));
    yer.replaceChildren(sh.svg);
    kodYazi.textContent = haritaKodla(harita);
    sayi.textContent = `${harita.join("").split(".").length - 1} karlı kare`;
  };
  const sayi = el("span", "kp-sayac", {}, "");
  const araclar = el("div", "s2-secici kp-araclar", { role: "radiogroup", "aria-label": "Araç" }, ...ARACLAR.map(([a, ad]) => {
    const b = el("button", "", { type: "button", role: "radio", "aria-checked": String(a === arac), "data-arac": a === " " ? "yol" : a }, ad);
    b.addEventListener("click", () => { arac = a; araclar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", String(x === b))); });
    return b;
  }));
  const kodGir = el("input", "kp-kod-gir", { type: "text", "aria-label": "Harita kodu", placeholder: "1-11-…", maxlength: "30" }) as HTMLInputElement;
  const yukle = dugme({ metin: "Kodu yükle", kucuk: true, id: "kp-kod-yukle" });
  yukle.addEventListener("click", () => {
    const h = haritaCoz(kodGir.value);
    if (!h) { bilgi.textContent = "Bu kod bir haritaya benzemiyor. Arkadaşının kodunu bir daha kontrol et."; return; }
    harita = h; tasarimYaz(h); ciz(); bilgi.textContent = "Arkadaşının haritası yüklendi."; denendi("yuklendi-" + kodGir.value);
  });
  const sifirla = dugme({ metin: "Boş harita", kucuk: true, id: "kp-bos" });
  sifirla.addEventListener("click", () => { harita = bosTasarim(); tasarimYaz(harita); ciz(); });
  ciz();
  return el("div", "rs kp", { "data-deney": "harita-tasarimcisi" }, el("div", "kp-izgara", {},
    el("div", "kp-sol", {}, yer),
    el("div", "kp-sag", {}, el("span", "rs-etiket", {}, "Araç"), araclar, sayi, bilgi,
      el("div", "kp-kod-satiri", {}, el("span", "rs-etiket", {}, "Harita kodu (arkadaşına ver):"), kodYazi),
      el("div", "kp-kod-satiri", {}, kodGir, yukle, sifirla))));
}
/** Tasarım görevi: kendi haritanı (ya da arkadaşınınkini) kartlarla temizle */
export function tasarimGorevi(yildiz: (n: number) => void): HTMLElement {
  const harita = tasarimOku();
  const anahtar = "sra-kart-tasarim";
  const program = kayitOku(anahtar);
  const sonuc = el("div", "rs-sonuc", { "aria-live": "polite" }, "");
  const duzen = kartDuzenleyici(["ileri", "sag", "sol", "tekrarla", "eger", "surece"], program, () => kayitYaz(anahtar, program));
  const kar = harita.join("").split(".").length - 1;
  const c = calistirici({
    haritalar: () => [harita], yon: 1, batarya: () => TASARIM_PILI, duzen, etiket: "Senin haritan",
    degerlendir: (p) => tasarimYildizi(harita, p).sonuc,
    bitince: () => {
      const t = tasarimYildizi(harita, program);
      kap.dataset.yildiz = String(t.yildiz);
      sonuc.replaceChildren(yildizlar(3, t.yildiz), el("b", "", {}, ` ${t.yildiz} / 3 yıldız`), el("p", "lb-not", {}, t.yildiz === 3 ? "Harika bir görev!" : t.kar < 8 ? "Haritana daha çok kar koyarsan daha çok yıldız alırsın (en az 8 karlı kare)." : "Tekrarla, eğer ya da sürece kartıyla üç yıldız."));
      if (t.yildiz) yildiz(t.yildiz);
    }
  });
  const kap = el("div", "rs kp", { "data-gorev": "tasarim" },
    el("p", "lb-not", {}, `Haritanda ${kar} karlı kare var. Yıldızlar: en az 4 kar temizle (1), en az 8 (2), bir de tekrarla, eğer ya da sürece kartı kullan (3). Robot başta sağa bakar; bataryası ${TASARIM_PILI}.`),
    el("div", "kp-izgara", {}, el("div", "kp-sol", {}, c.kap), el("div", "kp-sag", {}, duzen.kap)), sonuc);
  return kap;
}

void ENERJI;
export const KART_STILI = `
.kp{display:grid;gap:14px}
.kp-izgara{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}
@media (max-width:760px){.kp-izgara{grid-template-columns:minmax(0,1fr)}}
.kp-sol,.kp-sag{display:grid;gap:12px;min-width:0;align-content:start}
.kp-sehirler{display:grid;gap:10px}
.kp-sehir-kap{margin:0;display:grid;gap:4px}
.kp-sehir-kap figcaption{font-weight:800;font-size:var(--sra2-boy-1)}
.kp-sehir{display:block;width:100%;height:auto;margin:0 auto;border-radius:var(--sra2-kose-2);background:#5B6C8F}
.kp-h--bina{fill:#46557A}
.kp-h--yol{fill:#C9CDD8}
.kp-h--istasyon{fill:#FFD54A}
.kp-pencere{fill:#FFE7A3;opacity:.75}
.kp-simsek{fill:#17144A}
.kp-kar rect{fill:#fff;stroke:#DDE7FF;stroke-width:2}
.kp-kar circle{fill:#DDE7FF}
.kp-robot{transition:transform .22s var(--sra2-yumusak)}
.kp-robot--carpti rect:nth-child(3){fill:#E5484D}
.kp-pil-satiri{display:flex;align-items:center;gap:10px;font-weight:800}
.kp-pil{flex:1;max-width:220px;height:16px;border-radius:8px;background:var(--sra2-lavanta);overflow:hidden;border:2px solid var(--sra2-murekkep)}
.kp-pil i{display:block;height:100%;background:#2FBF71;transition:width .2s}
.kp-pil.az i{background:#E5484D}
.kp-durum{font-weight:800;min-height:1.4em;margin:0}
.kp-durum[data-sonuc]:not([data-sonuc=basarili]){color:#C0262D}
.kp-palet{display:flex;flex-wrap:wrap;gap:8px}
.kp-palet__kart{display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:8px 14px;border:0;border-radius:14px;font:800 var(--sra2-boy-2) var(--sra2-yazi);color:#fff;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.kp-palet__kart:active{transform:translateY(2px);box-shadow:none}
.kp-palet__kart:focus-visible,.kp-yuva:focus-visible,.kp-mini:focus-visible,.kp-sil:focus-visible{outline:3px solid var(--sra2-sari-koyu);outline-offset:2px}
.kp-ikon{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.25);font-size:20px;line-height:1}
.kp-k--ileri{--kp:#6A48F0}.kp-k--sag{--kp:#1E88E5}.kp-k--sol{--kp:#1E88E5}.kp-k--tekrarla{--kp:#E07B00}.kp-k--eger{--kp:#18A058}.kp-k--surece{--kp:#C2185B}
.kp-palet__kart{background:var(--kp)}
.kp-program-kap{border:2px dashed var(--sra2-mor-acik,#B9A6FF);border-radius:var(--sra2-kose-2);padding:10px;background:#fff;min-width:0}
.kp-program-ust{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.kp-program-ust .kp-sayac{margin-right:auto;color:var(--sra2-murekkep-2);font-weight:700}
.kp-liste{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.kp-liste .kp-liste{margin:6px 0 4px 18px;padding-left:10px;border-left:4px solid var(--kp)}
.kp-kart{border-radius:12px;background:color-mix(in srgb,var(--kp) 14%,#fff);border:2px solid var(--kp);padding:6px 8px}
.kp-kart__bas{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.kp-kart__bas .kp-ikon{background:var(--kp);color:#fff;width:28px;height:28px;font-size:18px}
.kp-kart__bas b{margin-right:auto}
.kp-kart.kp-calisan{box-shadow:0 0 0 4px #FFC531;background:#FFF3C4}
.kp-sil{border:0;background:transparent;font:900 22px var(--sra2-yazi);color:var(--sra2-murekkep-2);cursor:pointer;min-width:36px;min-height:36px;border-radius:10px}
.kp-sil:hover{background:rgba(0,0,0,.06)}
.kp-mini{min-width:34px;min-height:34px;border-radius:10px;border:2px solid var(--kp);background:#fff;font:900 18px var(--sra2-yazi);cursor:pointer}
.kp-kez{font-weight:800;min-width:46px;text-align:center}
.kp-kosul{font:700 var(--sra2-boy-1) var(--sra2-yazi);border:2px solid var(--kp);border-radius:10px;padding:6px 8px;background:#fff;max-width:100%}
.kp-degilse{margin:6px 0 0 18px;font-weight:800;color:var(--kp)}
.kp-yuva{width:100%;min-height:40px;border:2px dashed #B8B3D6;border-radius:10px;background:transparent;font:700 var(--sra2-boy-1) var(--sra2-yazi);color:var(--sra2-murekkep-2);cursor:pointer}
.kp-yuva[aria-pressed=true]{border-color:var(--sra2-mor);background:var(--sra2-lavanta);color:var(--sra2-mor-taban)}
.kp-kilitli .kp-palet,.kp-kilitli .kp-sil,.kp-kilitli .kp-mini,.kp-kilitli .kp-yuva{opacity:.55;pointer-events:none}
.kp-bilgi{margin:0;color:var(--sra2-murekkep-2);font-weight:700;min-height:1.3em}
.kp-olcut{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:2px;font-weight:700;color:var(--sra2-murekkep-2)}
.kp-olcut .tamam{color:#127A43}
.kp-tasarim .kp-h[tabindex]{cursor:pointer}
.kp-tasarim .kp-h[tabindex]:focus-visible{stroke:#FFC531;stroke-width:5}
.kp-araclar{flex-wrap:wrap}
.kp-kod-satiri{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.kp-kod{font:800 var(--sra2-boy-2) var(--sra2-yazi-kod);background:var(--sra2-lavanta);padding:4px 10px;border-radius:8px;word-break:break-all}
.kp-kod-gir{font:700 var(--sra2-boy-2) var(--sra2-yazi-kod);border:2px solid var(--sra2-murekkep);border-radius:10px;padding:8px 10px;min-width:0;width:16ch}
@media (prefers-reduced-motion: reduce){.kp-robot,.kp-pil i{transition:none}}
`;
