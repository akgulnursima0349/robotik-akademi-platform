/* Çizgi simülasyonu: SiroLine üstten bakışla bir pistte, kitin bloğundaki ayarlarla (Taban Hız, Kp, Kd) koşar.
   Fizik ve hesap Lab'daki çizgi robotunun aynısıdır (robot-motoru: ayarKos → turKos + siroBeyni). Hem "Dene" bölümünde
   (deney) hem ayar görevinde (yıldızlı) kullanılır. Hareketi azaltta koşu oynatılmaz; son durum ve iz hemen çizilir. */
import { canliGrafik, el, kaydirici, yildizlar } from "@sra/tasarim/v2";
import {
  AYAR_ARALIKLARI, AYAR_BASLANGIC, AYAR_PISTLERI, ayarKos, ayarYildizi, Pist, SIROLINE,
  type AyarAdi, type AyarDegerlendirme, type AyarKosusu, type AyarYorumu, type CizgiKaresi
} from "@sra/robot-motoru";

export interface SimAyari { pist: string; acik: AyarAdi[]; sabit?: Partial<Record<AyarAdi, number>> }
export interface SimSecenekleri {
  /** deney: her koşunun ayarları ("denendi" sayacı için) */
  denendi?: (anahtar: string) => void;
  /** ayar görevi: yıldız ölçütü; her koşudan sonra yıldız bildirilir */
  degerlendirme?: AyarDegerlendirme;
  yildiz?: (n: number) => void;
}
const SIRA: AyarAdi[] = ["taban", "kp", "kd"];
const bicim = (k: AyarAdi, v: number) => (k === "taban" ? String(v) : v.toFixed(k === "kp" ? 3 : 2)).replace(".", ",");
const sn = (v: number) => v.toFixed(2).replace(".", ",");
const YORUM: Record<AyarYorumu, string> = {
  cikti: "Robot pistten çıktı.",
  bitmedi: "Tur 20 saniyede bitmedi: robot titriyor ya da çok yavaş.",
  yavas: "Tur bitti ama yıldız için yavaş.",
  sallaniyor: "Tur bitti ama robot çok sallandı.",
  tamam: "Tur bitti."
};

export function cizgiSimulasyonu(a: SimAyari, o: SimSecenekleri = {}): HTMLElement {
  const pistBilgisi = AYAR_PISTLERI[a.pist];
  const pist = new Pist(pistBilgisi.pist, pistBilgisi.zemin);
  const ayar: Record<AyarAdi, number> = { ...AYAR_BASLANGIC, ...a.sabit };
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ayarlar: açık olanlar kaydırıcı, sabit olanlar etiket */
  const kaydiricilar = el("div", "cs-ayarlar");
  for (const k of SIRA) {
    const r = AYAR_ARALIKLARI[k];
    if (a.acik.includes(k)) {
      const kd = kaydirici({ etiket: r.ad, en: r.en, ust: r.ust, adim: r.adim, baslangic: ayar[k], bicim: (v) => bicim(k, v), degisince: (v) => { ayar[k] = v; } });
      kd.dataset.ayar = k;
      kaydiricilar.append(kd);
    } else kaydiricilar.append(el("p", "cs-sabit", { "data-ayar": k }, el("span", "", {}, r.ad), el("b", "", {}, bicim(k, ayar[k])), el("small", "", {}, "sabit")));
  }

  /* pist çizimi */
  const tuval = el("canvas", "cs-tuval", { role: "img", "aria-label": `${pistBilgisi.ad}: üstten bakış. Robotun izi koşudan sonra çizilir.` }) as HTMLCanvasElement;
  const { x0, y0, x1, y1 } = pist.sinir;
  const gen = x1 - x0, yuk = y1 - y0; // pistin sınırı kenar payıyla birlikte
  tuval.style.aspectRatio = `${gen} / ${yuk}`;
  const kosBtn = el("button", "s2-dugme s2-dugme--ana cs-kos", { type: "button" }, "▶ Koştur") as HTMLButtonElement;
  const sonucYazi = el("p", "cs-sonuc", { "aria-live": "polite" }, "Ayarları seç ve robotu koştur.");
  const yildizKap = el("div", "cs-yildiz");
  const grafik = canliGrafik({ baslik: "Hata (konum − 3500)", en: -3500, ust: 3500, pencere: 5, saat: () => oynatmaSaati });
  const defter = el("ol", "cs-defter", { "aria-label": "Ayar defteri: son koşular" });
  const kap = el("div", "cs", { "data-deney": "cizgi-simulasyonu", "data-pist": a.pist },
    kaydiricilar,
    el("div", "cs-sahne", {}, tuval),
    el("div", "cs-kontrol", {}, kosBtn, sonucYazi, yildizKap),
    grafik.kap,
    el("div", "cs-defter-kap", {}, el("h3", "", {}, "Ayar defteri"), defter));

  let oynatmaSaati = 0, kosu: AyarKosusu | null = null, kare = 0, dongu = 0, enIyi = 0, no = 0;

  const ciz = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = tuval.clientWidth || 600, h = tuval.clientHeight || 300;
    if (tuval.width !== Math.round(w * dpr)) { tuval.width = Math.round(w * dpr); tuval.height = Math.round(h * dpr); }
    const c = tuval.getContext("2d");
    if (!c) return;
    const o2 = Math.min(w / gen, h / yuk), ox = (w - (x1 - x0) * o2) / 2, oy = (h - (y1 - y0) * o2) / 2;
    /* dünya (mm, y yukarı) → ekran */
    c.setTransform(dpr * o2, 0, 0, -dpr * o2, dpr * (ox - x0 * o2), dpr * (h - oy + y0 * o2));
    const siyah = pistBilgisi.zemin === "siyah";
    c.fillStyle = siyah ? "#1D1B19" : "#F7F7F4"; c.fillRect(x0 - 1000, y0 - 1000, gen + 4000, yuk + 4000);
    c.strokeStyle = siyah ? "#F7F7F4" : "#141414"; c.lineWidth = 19; c.lineJoin = "round"; c.lineCap = "round";
    c.beginPath(); pist.yol.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
    /* başlangıç çizgisi */
    const b = pist.baslangic();
    c.save(); c.translate(b.x, b.y); c.rotate(b.yon); c.fillStyle = "#F5A300"; c.fillRect(-4, -40, 8, 80); c.restore();
    if (!kosu) { robotCiz(c, { x: b.x, y: b.y, yon: b.yon }); return; }
    const k = kosu.sonuc.kareler;
    /* iz: sensör dizisinin ortası */
    c.strokeStyle = "#6A48F0"; c.lineWidth = 4 / o2 * 1.2; c.beginPath();
    for (let i = 0; i <= kare && i < k.length; i += 2) {
      const [sx, sy] = sensorOrtasi(k[i]);
      i ? c.lineTo(sx, sy) : c.moveTo(sx, sy);
    }
    c.stroke();
    robotCiz(c, k[Math.min(kare, k.length - 1)]);
  };
  const sensorOrtasi = (k: Pick<CizgiKaresi, "x" | "y" | "yon">): [number, number] => [k.x + Math.cos(k.yon) * SIROLINE.sensorOnde, k.y + Math.sin(k.yon) * SIROLINE.sensorOnde];
  const robotCiz = (c: CanvasRenderingContext2D, k: Pick<CizgiKaresi, "x" | "y" | "yon">) => {
    c.save(); c.translate(k.x, k.y); c.rotate(k.yon);
    c.fillStyle = "rgba(106,72,240,.85)"; c.strokeStyle = "#17144A"; c.lineWidth = 6;
    c.beginPath(); c.roundRect(-45, -70, 215, 140, 24); c.fill(); c.stroke();
    c.fillStyle = "#17144A"; c.fillRect(-20, -82, 40, 18); c.fillRect(-20, 64, 40, 18); // tekerler
    c.fillStyle = "#E3262F"; c.fillRect(SIROLINE.sensorOnde - 6, -38, 12, 76); // sensör dizisi
    c.restore();
  };

  const durdur = () => { cancelAnimationFrame(dongu); dongu = 0; };
  const bitir = () => {
    if (!kosu) return;
    durdur();
    kare = kosu.sonuc.kareler.length - 1; ciz();
    kosBtn.disabled = false;
    const s = kosu;
    const d = o.degerlendirme ? ayarYildizi(o.degerlendirme, s) : null;
    const ozet = s.sure !== null ? `${sn(s.sure)} sn · ortalama sapma ${Math.round(s.sapma)} mm` : s.sonuc.durum === "cikti" ? `${sn(s.sonuc.sure)}. saniyede` : "";
    const yorum = d ? YORUM[d.yorum] : s.sonuc.durum === "cikti" ? YORUM.cikti : s.sure === null ? YORUM.bitmedi : YORUM.tamam;
    sonucYazi.textContent = `${yorum} ${ozet}`.trim();
    kap.dataset.sonuc = s.sonuc.durum;
    if (d) {
      yildizKap.replaceChildren(yildizlar(3, d.yildiz), el("span", "", {}, d.yildiz ? `${d.yildiz} / 3 yıldız` : "Yıldız yok"));
      kap.dataset.yildiz = String(d.yildiz);
      if (d.yildiz > enIyi) enIyi = d.yildiz;
      o.yildiz?.(d.yildiz);
    }
    const satir = el("li", "", {},
      el("span", "cs-defter__ayar", {}, SIRA.map((k) => `${AYAR_ARALIKLARI[k].ad} ${bicim(k, ayar[k])}`).join(" · ")),
      el("b", "", {}, s.sure !== null ? `${sn(s.sure)} sn, sapma ${Math.round(s.sapma)} mm` : s.sonuc.durum === "cikti" ? "pistten çıktı" : "bitmedi"),
      d ? el("span", "cs-defter__yildiz", { "aria-label": `${d.yildiz} yıldız` }, "★".repeat(d.yildiz) + "☆".repeat(3 - d.yildiz)) : "");
    defter.prepend(satir);
    while (defter.children.length > 6) defter.lastElementChild!.remove();
  };
  kosBtn.addEventListener("click", () => {
    durdur();
    kosu = ayarKos(a.pist, ayar);
    no++;
    kap.dataset.kosu = String(no);
    o.denendi?.(a.acik.map((k) => `${k}=${ayar[k]}`).join(","));
    const k = kosu.sonuc.kareler, h = kosu.hatalar;
    if (azHareket) {
      for (let i = 0; i < k.length; i += 5) { oynatmaSaati = k[i].t; grafik.ekle(h[i]); }
      bitir();
      return;
    }
    kosBtn.disabled = true;
    sonucYazi.textContent = "Robot koşuyor…";
    const bas = performance.now();
    let sonEklenen = -1;
    const adim = (zaman: number) => {
      const t = (zaman - bas) / 1000;
      while (kare < k.length - 1 && k[kare + 1].t <= t) kare++;
      for (let i = sonEklenen + 1; i <= kare; i += 1) if (i % 3 === 0) { oynatmaSaati = k[i].t; grafik.ekle(h[i]); }
      sonEklenen = kare; oynatmaSaati = k[kare].t;
      ciz();
      if (kare >= k.length - 1 || !kap.isConnected) { bitir(); return; }
      dongu = requestAnimationFrame(adim);
    };
    kare = 0;
    dongu = requestAnimationFrame(adim);
  });
  if (typeof ResizeObserver === "function") new ResizeObserver(() => ciz()).observe(tuval);
  requestAnimationFrame(ciz);
  return kap;
}

export const CIZGI_SIMULASYONU_STILI = `
.cs{display:grid;gap:14px;margin-top:6px}
.cs-ayarlar{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px 24px;align-items:end}
.cs-sabit{margin:0;display:flex;gap:8px;align-items:baseline;padding:10px 14px;border-radius:12px;background:var(--sra2-lavanta);color:var(--sra2-murekkep)}
.cs-sabit span{font-weight:800}
.cs-sabit b{font:800 var(--sra2-boy-4) var(--sra2-yazi-baslik);color:var(--sra2-mor)}
.cs-sabit small{color:var(--sra2-murekkep-2);font-weight:700}
.cs-sahne{border-radius:var(--sra2-kose-2);border:3px solid var(--sra2-murekkep);overflow:hidden;background:#2B2770}
.cs-tuval{display:block;width:100%;height:auto;max-height:420px}
.cs-kontrol{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center}
.cs .s2-grafik{max-width:560px}
.cs-sonuc{margin:0;font-weight:800;color:var(--sra2-murekkep);flex:1;min-width:200px}
.cs-yildiz{display:flex;align-items:center;gap:8px;font-weight:800}
.cs-defter-kap h3{margin:0 0 6px;font:800 var(--sra2-boy-2) var(--sra2-yazi-baslik)}
.cs-defter{margin:0;padding:0 0 0 22px;display:grid;gap:4px;font-size:var(--sra2-boy-1)}
.cs-defter li{display:flex;flex-wrap:wrap;gap:4px 12px}
.cs-defter__ayar{color:var(--sra2-murekkep-2);font-variant-numeric:tabular-nums}
.cs-defter__yildiz{color:var(--sra2-sari-taban);letter-spacing:2px}
.cs-defter:empty::before{content:"Henüz koşu yok.";color:var(--sra2-murekkep-2)}
`;
