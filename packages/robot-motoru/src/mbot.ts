/* mBot (Makeblock, mCore) için ilkokul deneylerinin ve çizgi görevinin hesapları. Ölçüler yaklaşık (ürün bilgisi: 17 × 13 × 9 cm).
   - Teker: bir turda gidilen yol = teker çevresi.
   - İki teker: sol ve sağ teker hızından robotun izi (diferansiyel sürüş).
   - Sensörler: üstteki ışık sensörü, alttaki iki gözlü çizgi sensörü, öndeki ultrasonik mesafe sensörü.
   - Çizgi görevi: iki göz, dört durum; çocuk her duruma bir hamle seçer (durum tablosu), mBot pistte bir tur atmaya çalışır. */

export const MBOT = {
  /** teker çapı (cm) */
  tekerCapi: 6.4,
  /** iki teker arası (cm) */
  tekerArasi: 11.5,
  /** çizgi sensörünün teker eksenine uzaklığı (cm) */
  gozOnde: 6,
  /** iki göz arası (cm) */
  gozArasi: 1.4,
  /** pistteki siyah çizginin genişliği (cm) */
  cizgiGenisligi: 2.4
} as const;

/** Teker deneyi: çap (cm) ve tur sayısından gidilen yol (cm) */
export const tekerYolu = (cap: number, tur: number) => Math.PI * cap * tur;

export interface Poz { x: number; y: number; aci: number }
/** İki teker hızından (cm/sn) robotun izi. Ekran koordinatı: y aşağı; açı saat yönünde artar (sola teker hızlıysa sağa döner). */
export function tekerIzi(sol: number, sag: number, sure: number, adim = 0.05, bas: Poz = { x: 0, y: 0, aci: -Math.PI / 2 }): Poz[] {
  const r: Poz[] = [{ ...bas }];
  let { x, y, aci } = bas;
  for (let t = 0; t < sure - 1e-9; t += adim) {
    const v = (sol + sag) / 2, w = (sol - sag) / MBOT.tekerArasi;
    x += v * Math.cos(aci) * adim; y += v * Math.sin(aci) * adim; aci += w * adim;
    r.push({ x, y, aci });
  }
  return r;
}
/** İki teker hızına göre hareketin adı */
export function hareketAdi(sol: number, sag: number): string {
  if (sol === 0 && sag === 0) return "Robot duruyor.";
  if (sol === sag) return sol > 0 ? "İki teker aynı hızda: robot düz ileri gidiyor." : "İki teker aynı hızda geri: robot düz geri gidiyor.";
  if (sol === -sag) return "Bir teker ileri, öbürü geri: robot yerinde dönüyor.";
  const hizli = Math.abs(sol) > Math.abs(sag) ? "Sol" : "Sağ";
  return `${hizli} teker daha hızlı: robot ${hizli === "Sol" ? "sağa" : "sola"} doğru dönüyor.`;
}

/* ---------- sensör deneyi dünyası (cm): beyaz masa, siyah bant, lamba, duvar ---------- */
export const SENSOR_DUNYASI = { genislik: 120, yukseklik: 70, bant: { x1: 30, x2: 34 }, lamba: { x: 95, y: 15, r: 30 }, duvar: 110 } as const;
export interface SensorOkumasi {
  /** ışık sensörü 0–100: lambanın altında yüksek */
  isik: number;
  /** çizgi sensörünün iki gözü: true siyah görüyor */
  solGoz: boolean; sagGoz: boolean;
  /** ultrasonik: öndeki duvara uzaklık (cm); 400'den uzaksa null */
  mesafe: number | null;
}
/** Robot sağa (doğuya, duvara doğru) bakıyor; (x, y) robotun ortası. */
export function sensorOku(x: number, y: number): SensorOkumasi {
  const D = SENSOR_DUNYASI;
  const l = Math.hypot(x - D.lamba.x, y - D.lamba.y);
  const isik = Math.round(Math.max(8, Math.min(100, 100 - (l - D.lamba.r / 2) * 1.4)));
  const gx = x + MBOT.gozOnde;
  /* robot doğuya bakarken sol göz kuzeyde (y - ), sağ göz güneyde; bant dikey olduğu için iki göz aynı şeyi görür; bant x'te */
  const bantta = gx >= D.bant.x1 && gx <= D.bant.x2;
  const on = x + 8;
  const mesafe = D.duvar - on <= 400 ? Math.max(3, Math.round(D.duvar - on)) : null;
  return { isik, solGoz: bantta, sagGoz: bantta, mesafe };
}

/* ---------- çizgi görevi: iki göz, durum tablosu ---------- */
export type GozDurumu = "ikisi-siyah" | "sol-beyaz" | "sag-beyaz" | "ikisi-beyaz";
export type MbotHamle = "ileri" | "saga" | "sola" | "geri" | "dur";
export const GOZ_DURUMLARI: GozDurumu[] = ["ikisi-siyah", "sol-beyaz", "sag-beyaz", "ikisi-beyaz"];
export const GOZ_DURUMU_ADI: Record<GozDurumu, string> = {
  "ikisi-siyah": "İki göz de siyahta", "sol-beyaz": "Sol göz beyazda", "sag-beyaz": "Sağ göz beyazda", "ikisi-beyaz": "İki göz de beyazda"
};
export const MBOT_HAMLELERI: MbotHamle[] = ["ileri", "saga", "sola", "geri", "dur"];
export const MBOT_HAMLE_ADI: Record<MbotHamle, string> = { ileri: "İleri git", saga: "Sağa dön", sola: "Sola dön", geri: "Geri git", dur: "Dur" };
/** hamlenin teker hızları (cm/sn): sol, sağ */
export const HAMLE_HIZI: Record<MbotHamle, [number, number]> = { ileri: [20, 20], saga: [18, 4], sola: [4, 18], geri: [-12, -12], dur: [0, 0] };
export type DurumTablosu = Record<GozDurumu, MbotHamle>;
export const GOZ_ORNEK_TABLO: DurumTablosu = { "ikisi-siyah": "ileri", "sol-beyaz": "saga", "sag-beyaz": "sola", "ikisi-beyaz": "geri" };

/** Pist: siyah çizginin orta hattı (cm), kapalı yol; 1 cm aralıklı noktalar. Yuvarlak köşeli dikdörtgen, altta içe doğru bir kıvrım. */
export interface MbotPisti { ad: string; genislik: number; yukseklik: number; noktalar: [number, number][]; bas: Poz; uzunluk: number }
function pistKur(): MbotPisti {
  const kose = 18, x1 = 20, x2 = 120, y1 = 18, y2 = 78;
  const parcalar: [number, number][] = [];
  const cizgi = (ax: number, ay: number, bx: number, by: number) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay))); for (let i = 0; i < n; i++) parcalar.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n]); };
  const yay = (cx: number, cy: number, r: number, a1: number, a2: number) => { const n = Math.max(2, Math.round(Math.abs(a2 - a1) * r)); for (let i = 0; i < n; i++) { const a = a1 + ((a2 - a1) * i) / n; parcalar.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  const P = Math.PI;
  /* saat yönünde: üst kenar doğuya, sağ kenar aşağı, alt kenar batıya (ortada içe kıvrım), sol kenar yukarı */
  cizgi(x1 + kose, y1, x2 - kose, y1);
  yay(x2 - kose, y1 + kose, kose, -P / 2, 0);
  cizgi(x2, y1 + kose, x2, y2 - kose);
  yay(x2 - kose, y2 - kose, kose, 0, P / 2);
  /* alt kenarda içe kıvrım: sola, yukarı, sola, aşağı (sola dönüşler de gerekir) */
  const kx = 70, kr = 14;
  cizgi(x2 - kose, y2, kx + 2 * kr, y2);
  yay(kx + 2 * kr, y2 - kr, kr, P / 2, P);
  yay(kx, y2 - kr, kr, 0, -P);
  yay(kx - 2 * kr, y2 - kr, kr, 0, P / 2);
  cizgi(kx - 2 * kr, y2, x1 + kose, y2);
  yay(x1 + kose, y2 - kose, kose, P / 2, P);
  cizgi(x1, y2 - kose, x1, y1 + kose);
  yay(x1 + kose, y1 + kose, kose, P, (3 * P) / 2);
  let uzunluk = 0;
  for (let i = 0; i < parcalar.length; i++) { const [ax, ay] = parcalar[i], [bx, by] = parcalar[(i + 1) % parcalar.length]; uzunluk += Math.hypot(bx - ax, by - ay); }
  return { ad: "Okul pisti", genislik: 140, yukseklik: 96, noktalar: parcalar, bas: { x: x1 + kose + 6, y: y1, aci: 0 }, uzunluk };
}
export const MBOT_PISTI = pistKur();

/** Bir noktanın çizgi orta hattına uzaklığı ve en yakın noktanın sırası */
export function cizgiyeUzaklik(p: MbotPisti, x: number, y: number, ipucu?: number): { d: number; i: number } {
  let en = Infinity, ei = 0;
  const n = p.noktalar.length;
  const bak = (i: number) => { const [a, b] = p.noktalar[(i + n) % n]; const d = Math.hypot(a - x, b - y); if (d < en) { en = d; ei = (i + n) % n; } };
  if (ipucu === undefined) for (let i = 0; i < n; i++) bak(i);
  else for (let k = -25; k <= 25; k++) bak(ipucu + k);
  return { d: en, i: ei };
}
export function gozler(p: MbotPisti, poz: Poz, ipucu?: number): { sol: boolean; sag: boolean } {
  const fx = poz.x + MBOT.gozOnde * Math.cos(poz.aci), fy = poz.y + MBOT.gozOnde * Math.sin(poz.aci);
  /* ekranda y aşağı: yönün solu (sinA, -cosA) */
  const lx = Math.sin(poz.aci) * (MBOT.gozArasi / 2), ly = -Math.cos(poz.aci) * (MBOT.gozArasi / 2);
  const siyah = (x: number, y: number) => cizgiyeUzaklik(p, x, y, ipucu).d <= MBOT.cizgiGenisligi / 2;
  return { sol: siyah(fx + lx, fy + ly), sag: siyah(fx - lx, fy - ly) };
}
export const gozDurumu = (sol: boolean, sag: boolean): GozDurumu => (sol && sag ? "ikisi-siyah" : sag ? "sol-beyaz" : sol ? "sag-beyaz" : "ikisi-beyaz");

export interface CizgiKosusu {
  bitti: boolean;
  sure: number;
  /** çizgiden çıktı ya da süre doldu */
  sebep?: "cikti" | "sure" | "durdu";
  iz: (Poz & { t: number; durum: GozDurumu })[];
  /** tamamlanan yol (0–1) */
  ilerleme: number;
}
export const CIZGI_SURE_SINIRI = 60;
const DT = 0.02;
/** mBot durum tablosuyla pistte bir tur atar */
export function mbotKos(tablo: DurumTablosu, p: MbotPisti = MBOT_PISTI): CizgiKosusu {
  let poz: Poz = { ...p.bas };
  let ipucu = cizgiyeUzaklik(p, poz.x, poz.y).i;
  const bas = ipucu, n = p.noktalar.length;
  let yol = 0, duraklama = 0;
  const iz: CizgiKosusu["iz"] = [];
  for (let k = 0; k * DT < CIZGI_SURE_SINIRI; k++) {
    const t = k * DT;
    const g = gozler(p, poz, ipucu), durum = gozDurumu(g.sol, g.sag);
    if (k % 5 === 0) iz.push({ ...poz, t, durum });
    const [vl, vr] = HAMLE_HIZI[tablo[durum]];
    const v = (vl + vr) / 2, w = (vl - vr) / MBOT.tekerArasi;
    poz = { x: poz.x + v * Math.cos(poz.aci) * DT, y: poz.y + v * Math.sin(poz.aci) * DT, aci: poz.aci + w * DT };
    const yeni = cizgiyeUzaklik(p, poz.x, poz.y, ipucu);
    /* ilerleme: en yakın noktanın sırası ileri ya da geri kaydıkça */
    let fark = yeni.i - ipucu;
    if (fark > n / 2) fark -= n; if (fark < -n / 2) fark += n;
    yol += fark; ipucu = yeni.i;
    if (yeni.d > 10) return { bitti: false, sure: t, sebep: "cikti", iz, ilerleme: Math.max(0, yol / n) };
    duraklama = vl === 0 && vr === 0 ? duraklama + DT : 0;
    if (duraklama > 2) return { bitti: false, sure: t, sebep: "durdu", iz, ilerleme: Math.max(0, yol / n) };
    if (yol >= n) { iz.push({ ...poz, t: t + DT, durum }); return { bitti: true, sure: Math.round((t + DT) * 100) / 100, iz, ilerleme: 1 }; }
  }
  void bas;
  return { bitti: false, sure: CIZGI_SURE_SINIRI, sebep: "sure", iz, ilerleme: Math.max(0, yol / n) };
}
/** Çizgi görevinin yıldızları: 1 bir tur, 2 ve 3 süre eşikleri (sn) */
export const CIZGI_ESIKLERI: [number, number] = [0, 0];
export function cizgiYildizi(k: CizgiKosusu): 0 | 1 | 2 | 3 {
  if (!k.bitti) return 0;
  return k.sure <= CIZGI_ESIKLERI[1] ? 3 : k.sure <= CIZGI_ESIKLERI[0] ? 2 : 1;
}
{
  const ornek = mbotKos(GOZ_ORNEK_TABLO).sure;
  CIZGI_ESIKLERI[0] = Math.round(ornek * 1.4 * 10) / 10;
  CIZGI_ESIKLERI[1] = Math.round((ornek + 0.5) * 10) / 10;
}
