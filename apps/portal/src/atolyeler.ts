/* Atölyeler ve seviyeler: hangi seviyede hangi atölye açık, hangisi yakında; kart bugünkü hangi kursa gider.
   Saf veri ve fonksiyonlar (DOM yok): birim testleri apps/portal/test/atolyeler.test.ts. */
import type { KursKimligi } from "@sra/bulut";

export type Seviye = "okul-oncesi" | "ilkokul" | "ortaokul" | "lise";
export const SEVIYE_ADLARI: [Seviye, string][] = [["okul-oncesi", "Okul öncesi"], ["ilkokul", "İlkokul"], ["ortaokul", "Ortaokul"], ["lise", "Lise"]];
export const VARSAYILAN_SEVIYE: Seviye = "ilkokul";
export type AtolyeKimligi = "bilgisayar" | "blok" | "python" | "cpp" | "arduino" | "robotik";

/** Kartın gittiği yer: bugünkü kurslardan biri ya da Lab. null → yakında. */
export type Hedef = { kurs: KursKimligi | "lab"; yol: string } | null;
export interface Atolye { kimlik: AtolyeKimligi; ad: string; aciklama: string; hedef: Hedef }

const BLOK: Hedef = { kurs: "ilkokul", yol: "blok/" };
const JUNIOR: Hedef = { kurs: "junior", yol: "junior/" };
const PYTHON: Hedef = { kurs: "ortaokul", yol: "ortaokul/" };
/** Robotik atölyesinin kendi sayfası (modüller, dersler, ilerleme); görevler Lab'da açılır */
const LAB: Hedef = { kurs: "lab", yol: "#atolye/robotik" };

const a = (kimlik: AtolyeKimligi, ad: string, aciklama: string, hedef: Hedef): Atolye => ({ kimlik, ad, aciklama, hedef });

/** Seviye → atölyeler (açıklar önce, yakında olanlar sonra) */
export const SEVIYE_ATOLYELERI: Record<Seviye, Atolye[]> = {
  "okul-oncesi": [
    a("blok", "Kodla Oyna", "Bloklarla robotu yürüt; her yönerge sesli okunur.", BLOK),
    a("bilgisayar", "Bilgisayarla Tanışma", "Fareyi tut, tıkla, sürükle.", null),
    a("robotik", "Robotik", "İlk robotunu tanı.", null)
  ],
  ilkokul: [
    a("blok", "Kodla Oyna", "Sürükle-bırak bloklarla bulmaca çöz.", BLOK),
    a("python", "Python", "Adım adım Python ve yapay zekâ (4–6. sınıf).", JUNIOR),
    a("robotik", "Robotik", "Akademinin robotları 3D: SiroLine, Kenshin, RizBot.", LAB),
    a("bilgisayar", "Bilgisayarla Tanışma", "Klavye, dosya, internet güvenliği.", null)
  ],
  ortaokul: [
    a("python", "Python", "Gerçek Python ve yapay zekâ laboratuvarları.", PYTHON),
    a("robotik", "Robotik", "Kenshin'i kodla, sumo liginde yarıştır.", LAB),
    a("cpp", "C++", "Derslerde kullandığımız dil.", null),
    a("arduino", "Arduino", "LED, sensör, motor: devre kur.", null)
  ],
  lise: [
    a("python", "Python", "Gerçek Python ve makine öğrenmesi.", PYTHON),
    a("robotik", "Robotik", "Gerçek fizikle robot tasarla ve yarıştır.", LAB),
    a("cpp", "C++", "Nesneler, algoritmalar, gömülü sistemler.", null),
    a("arduino", "Arduino", "Sensörler, haberleşme, proje.", null)
  ]
};

export const seviyeMi = (x: unknown): x is Seviye => typeof x === "string" && SEVIYE_ADLARI.some(([s]) => s === x);

/** Öğrencinin seviyesi, sınıfının kursundan. Junior 4–6. sınıfı kapsar; ilkokul listesinde yer aldığı için ilkokul. */
export function kursSeviyesi(kurs: KursKimligi): Seviye {
  return kurs === "ortaokul" ? "ortaokul" : "ilkokul";
}

const ANAHTAR = "sra-seviye";
/** Hatırlanan seviye; yoksa, bozuksa ya da depolama kapalıysa varsayılan */
export function seviyeOku(depo: Pick<Storage, "getItem"> | null): Seviye {
  try { const s = depo?.getItem(ANAHTAR); return seviyeMi(s) ? s : VARSAYILAN_SEVIYE; } catch { return VARSAYILAN_SEVIYE; }
}
export function seviyeYaz(depo: Pick<Storage, "setItem"> | null, s: Seviye): void {
  try { depo?.setItem(ANAHTAR, s); } catch { /* gizli pencere ya da kapalı depolama: yalnız bu ziyarette geçerli */ }
}
/** Sayfanın açılacağı seviye: öğrencide sınıfından, değilse hatırlanandan */
export function acilisSeviyesi(depo: Pick<Storage, "getItem"> | null, ogrenciKursu?: KursKimligi): Seviye {
  return ogrenciKursu ? kursSeviyesi(ogrenciKursu) : seviyeOku(depo);
}
