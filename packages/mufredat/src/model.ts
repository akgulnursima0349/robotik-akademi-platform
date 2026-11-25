/* Müfredat modeli: atölye → modül → ders, ve bir öğrencinin bu yapı üzerindeki ilerlemesi.
   Saf veri ve fonksiyonlar (DOM ve depolama yok). İlerleme her atölyenin bugünkü kaydından okunur; yeni kayıt biçimi yok. */
export type Seviye = "okul-oncesi" | "ilkokul" | "ortaokul" | "lise";
export type DersTuru =
  | "gorev"     // yıldızlı görev; bir öncekinden en az bir yıldız alınca açılır
  | "rehber"    // bitince işaretlenen etkinlik (kurulum rehberi gibi)
  | "lig"       // robot kaydedilince bitmiş sayılır
  | "serbest";  // serbest çalışma; ilerlemeye sayılmaz

export interface Ders {
  kimlik: string;
  ad: string;
  ogretir: string;
  tur: DersTuru;
  /** platform kökünden göreli adres */
  adres: string;
  /** en çok yıldız (görevlerde 3, diğerlerinde 0) */
  enCokYildiz: number;
  /** ilerleme kaydındaki anahtar */
  anahtar: string;
}
export interface Modul { kimlik: string; ad: string; aciklama: string; robot?: string; seviyeler: Seviye[]; dersler: Ders[] }
export interface Atolye { kimlik: string; ad: string; aciklama: string; moduller: Modul[] }

/** İlerleme kaynağı: yıldızlar, bayraklar ve lig robotu (Lab kaydının biçimi) */
export interface IlerlemeKaydi { gorevler: Record<string, { yildiz?: number }>; bayrak?: Record<string, boolean>; lig?: { ad: string } | null }
export const BOS_KAYIT: IlerlemeKaydi = { gorevler: {}, bayrak: {}, lig: null };

/** Bozuk ya da eksik kayıtta boş kayıt; tanınmayan alanlar yok sayılır */
export function kayitOku(ham: string | null | undefined): IlerlemeKaydi {
  if (!ham) return BOS_KAYIT;
  try {
    const v = JSON.parse(ham);
    if (!v || typeof v !== "object") return BOS_KAYIT;
    const gorevler: IlerlemeKaydi["gorevler"] = {};
    if (v.gorevler && typeof v.gorevler === "object") for (const [k, g] of Object.entries(v.gorevler)) {
      const y = Number((g as { yildiz?: unknown })?.yildiz);
      gorevler[k] = { yildiz: Number.isFinite(y) ? Math.max(0, Math.min(3, Math.floor(y))) : 0 };
    }
    const bayrak: Record<string, boolean> = {};
    if (v.bayrak && typeof v.bayrak === "object") for (const [k, b] of Object.entries(v.bayrak)) if (b === true) bayrak[k] = true;
    const lig = v.lig && typeof v.lig === "object" && typeof v.lig.ad === "string" ? { ad: v.lig.ad } : null;
    return { gorevler, bayrak, lig };
  } catch { return BOS_KAYIT; }
}

export type DersDurumu = "bitti" | "acik" | "kilitli";
export interface DersIlerlemesi { ders: Ders; durum: DersDurumu; yildiz: number }
export interface ModulIlerlemesi { modul: Modul; dersler: DersIlerlemesi[]; biten: number; sayilan: number; yildiz: number; enCokYildiz: number }

const yildizi = (k: IlerlemeKaydi, d: Ders) => k.gorevler[d.anahtar]?.yildiz ?? 0;
function bittiMi(k: IlerlemeKaydi, d: Ders): boolean {
  if (d.tur === "gorev") return yildizi(k, d) > 0;
  if (d.tur === "rehber") return !!k.bayrak?.[d.anahtar];
  if (d.tur === "lig") return !!k.lig;
  return false;
}

/** Bir modülün ilerlemesi. hepsiAcik: öğretmen (kilitler kalkar) */
export function modulIlerlemesi(m: Modul, k: IlerlemeKaydi, hepsiAcik = false): ModulIlerlemesi {
  let oncekiGorevBitti = true;
  const dersler = m.dersler.map((d): DersIlerlemesi => {
    const bitti = bittiMi(k, d);
    let durum: DersDurumu = bitti ? "bitti" : "acik";
    if (d.tur === "gorev") {
      if (!bitti && !oncekiGorevBitti && !hepsiAcik) durum = "kilitli";
      oncekiGorevBitti = bitti;
    }
    return { ders: d, durum, yildiz: d.tur === "gorev" ? yildizi(k, d) : 0 };
  });
  const sayilan = dersler.filter((d) => d.ders.tur !== "serbest");
  return {
    modul: m, dersler,
    biten: sayilan.filter((d) => d.durum === "bitti").length, sayilan: sayilan.length,
    yildiz: dersler.reduce((t, d) => t + d.yildiz, 0), enCokYildiz: m.dersler.reduce((t, d) => t + d.enCokYildiz, 0)
  };
}

/** Seviyeye önerilen modüller önce (kendi sıralarıyla), diğerleri sonra */
export function seviyeSirasi(a: Atolye, s: Seviye): { onerilen: Modul[]; diger: Modul[] } {
  return { onerilen: a.moduller.filter((m) => m.seviyeler.includes(s)), diger: a.moduller.filter((m) => !m.seviyeler.includes(s)) };
}

/** Kaldığın yer: önerilen modüllerden başlayarak ilk açık ve bitmemiş, ilerlemeye sayılan ders. Hepsi bittiyse yok. */
export function kaldigiYer(a: Atolye, k: IlerlemeKaydi, s: Seviye, hepsiAcik = false): { modul: Modul; ders: Ders } | null {
  const { onerilen, diger } = seviyeSirasi(a, s);
  for (const m of [...onerilen, ...diger]) {
    const d = modulIlerlemesi(m, k, hepsiAcik).dersler.find((x) => x.durum === "acik" && x.ders.tur !== "serbest");
    if (d) return { modul: m, ders: d.ders };
  }
  return null;
}

export function atolyeOzeti(a: Atolye, k: IlerlemeKaydi, hepsiAcik = false) {
  const m = a.moduller.map((x) => modulIlerlemesi(x, k, hepsiAcik));
  return { moduller: m, biten: m.reduce((t, x) => t + x.biten, 0), sayilan: m.reduce((t, x) => t + x.sayilan, 0), yildiz: m.reduce((t, x) => t + x.yildiz, 0), enCokYildiz: m.reduce((t, x) => t + x.enCokYildiz, 0) };
}
