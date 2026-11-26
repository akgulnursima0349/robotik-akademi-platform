/* Ayar görevleri ve çizgi simülasyonu için ortak hesap: kitin SiroLine bloğu (siroBeyni) belirli bir pistte koşar,
   sonuç ölçülür, yıldız verilir. Kod yok, yalnız Taban Hız, Kp ve Kd. Deterministik: aynı ayar → aynı tur. */
import { CIZGI_GOREVLERI, Pist, qtrOkuyucu, siroBeyni, turKos, type CizgiSonucu, type PistTanimi, type SiroAyar, type Zemin } from "./cizgi";

export interface AyarPisti { ad: string; pist: PistTanimi; zemin: Zemin; sureSiniri: number }
const labPisti = (k: string) => CIZGI_GOREVLERI.find((g) => g.kimlik === k)!.pist;
export const AYAR_PISTLERI: Record<string, AyarPisti> = {
  oval: { ad: "Oval pist", pist: labPisti("oval"), zemin: "beyaz", sureSiniri: 20 },
  "s-viraj": { ad: "S virajları", pist: labPisti("s-viraj"), zemin: "beyaz", sureSiniri: 20 },
  yaris: { ad: "Yarış pisti", pist: labPisti("yaris"), zemin: "beyaz", sureSiniri: 20 },
  /* sınıftaki gibi siyah zemin, beyaz bant: uzun düzlük, iki keskin dönüş ve bir S */
  "siyah-zemin": {
    ad: "Siyah zeminli pist", zemin: "siyah", sureSiniri: 20,
    pist: { parcalar: [
      { tur: "duz", uzunluk: 1000 }, { tur: "yay", yaricap: 130, aci: 180 }, { tur: "duz", uzunluk: 300 },
      { tur: "yay", yaricap: 200, aci: -90 }, { tur: "yay", yaricap: 200, aci: 90 }, { tur: "duz", uzunluk: 300 },
      { tur: "yay", yaricap: 130, aci: 180 }] }
  }
};

export type AyarAdi = "taban" | "kp" | "kd";
/** Kaydırıcı aralıkları: kitin bloğundaki birimlerle */
export const AYAR_ARALIKLARI: Record<AyarAdi, { ad: string; en: number; ust: number; adim: number }> = {
  taban: { ad: "Taban Hız", en: 40, ust: 255, adim: 5 },
  kp: { ad: "Kp", en: 0, ust: 0.12, adim: 0.005 },
  kd: { ad: "Kd", en: 0, ust: 1.5, adim: 0.05 }
};
/** Kitin mBlock örneğindeki değerler (ek hız kullanılmaz) */
export const AYAR_BASLANGIC: Record<AyarAdi, number> = { taban: 100, kp: 0.04, kd: 0.7 };

export interface AyarKosusu {
  sonuc: CizgiSonucu;
  /** her karede hata = konum − 3500 (kitin hesabı) */
  hatalar: number[];
  /** tur süresi (sn); bitmediyse null */
  sure: number | null;
  /** sensör dizisinin ortasının çizgiden ortalama uzaklığı (mm) */
  sapma: number;
}
export function ayarKos(pistAdi: string, a: Record<AyarAdi, number>): AyarKosusu {
  const p = AYAR_PISTLERI[pistAdi];
  if (!p) throw new Error(`pist yok: ${pistAdi}`);
  const ayar: SiroAyar = { taban: a.taban, kp: a.kp, kd: a.kd, ek: 0, zemin: p.zemin };
  const sonuc = turKos(new Pist(p.pist, p.zemin), siroBeyni(ayar), p.sureSiniri);
  const oku = qtrOkuyucu();
  const hatalar = sonuc.kareler.map((k) => oku(k.sensor, p.zemin) - 3500);
  return { sonuc, hatalar, sure: sonuc.durum === "bitti" ? sonuc.sure : null, sapma: sonuc.ortSapma };
}

export type AyarOlcutu = "sure" | "sapma";
export interface AyarDegerlendirme {
  olcut: AyarOlcutu;
  /** 1, 2 ve 3 yıldız için üst sınırlar (küçük daha iyi): [1★, 2★, 3★], büyükten küçüğe */
  esikler: [number, number, number];
  /** yıldız alabilmek için ek şart: en çok bu kadar süre (sn) ya da sapma (mm) */
  enCokSure?: number;
  enCokSapma?: number;
}
export type AyarYorumu = "cikti" | "bitmedi" | "yavas" | "sallaniyor" | "tamam";
/** Yıldız (0–3) ve kısa yorum. Pistten çıkan, turu bitiremeyen ya da şartı tutmayan koşu yıldız alamaz. */
export function ayarYildizi(d: AyarDegerlendirme, k: AyarKosusu): { yildiz: number; yorum: AyarYorumu; deger: number } {
  const deger = d.olcut === "sure" ? k.sure ?? Infinity : k.sapma;
  if (k.sonuc.durum === "cikti") return { yildiz: 0, yorum: "cikti", deger };
  if (k.sure === null) return { yildiz: 0, yorum: "bitmedi", deger };
  if (d.enCokSure !== undefined && k.sure > d.enCokSure) return { yildiz: 0, yorum: "yavas", deger };
  if (d.enCokSapma !== undefined && k.sapma > d.enCokSapma) return { yildiz: 0, yorum: "sallaniyor", deger };
  const [b1, b2, b3] = d.esikler;
  const yildiz = deger <= b3 ? 3 : deger <= b2 ? 2 : deger <= b1 ? 1 : 0;
  return { yildiz, yorum: yildiz ? "tamam" : d.olcut === "sure" ? "yavas" : "sallaniyor", deger };
}
