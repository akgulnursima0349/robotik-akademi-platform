/* Anlatım görselleri kataloğu: 3D sahne anları ve adım adım çizimler. Saf veri: çizdiren kod portalda (gorsel/), 3D modeller
   @sra/sahne paketinde. Derslerin anlatım adımları bu adlara başvurur; doğrulayıcı olmayan adı hata sayar. */

/* ---------- 3D sahne anı ---------- */
export type SahneAcisi = "onden" | "yandan" | "ustten" | "alttan" | "yakin";
export interface SahneAni {
  robot: "SiroLine" | "Kenshin" | "RizBot";
  aci: SahneAcisi;
  /** vurgulanan parça grubu (robot modelinin parça adı) ve sahnedeki etiketi */
  vurgu?: { parca: string; etiket: string };
  zemin: "duz" | "bant" | "ring";
  /** küçük hareket: robot bandın üstünde yavaşça sağa sola kayar / sensörler nabız gibi parlar */
  hareket?: "salinim" | "nabiz";
  /** WebGL yokken ve ekran okuyucu için kısa açıklama */
  aciklama: string;
}
export const SAHNE_ANLARI: Record<string, SahneAni> = {
  "siroline-alttan": {
    robot: "SiroLine", aci: "alttan", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "sensor", etiket: "8 kızılötesi sensör" },
    aciklama: "SiroLine ters çevrilmiş; altındaki sekiz sensörlük şerit vurgulanıyor."
  },
  "siroline-bant-ustunde": {
    robot: "SiroLine", aci: "onden", zemin: "bant", hareket: "salinim",
    vurgu: { parca: "sensor", etiket: "Sensörler bandın üstünde" },
    aciklama: "SiroLine beyaz kâğıttaki siyah bandın üstünde yavaşça sağa sola kayıyor; sensörler bandı tarıyor."
  }
};

/* ---------- adım adım çizim ---------- */
/** Çizim alanı 400 × 260 birim. Renkler v2 paletinden ad olarak. */
export type CizimRengi = "murekkep" | "kirmizi" | "mor" | "yesil" | "sari" | "gri" | "beyaz" | "siyah";
export type Sekil =
  | { tur: "kutu"; x: number; y: number; g: number; y2: number; dolgu?: CizimRengi; kose?: number }
  | { tur: "daire"; x: number; y: number; r: number; dolgu?: CizimRengi }
  | { tur: "cizgi"; noktalar: [number, number][] }
  | { tur: "ok"; noktalar: [number, number][] }
  /** dalgalı ok: ışın */
  | { tur: "isin"; bas: [number, number]; son: [number, number]; soluk?: boolean }
  | { tur: "etiket"; x: number; y: number; metin: string; hiza?: "sol" | "orta" | "sag" };
export interface Katman {
  sekil: Sekil;
  renk: CizimRengi;
  /** metnin kaçıncı kelimesi okunurken belirsin (0'dan); yoksa sırası gelince */
  kelime?: number;
}
export interface Cizim { aciklama: string; katmanlar: Katman[] }

export const CIZIMLER: Record<string, Cizim> = {
  /* "Her sensörde iki parça vardır: gözümüzün göremediği kızılötesi ışığı yayan küçük bir lamba ve geri dönen ışığı ölçen bir alıcı." */
  "sensor-isik-yolu": {
    aciklama: "Sensörün kesiti: solda kızılötesi lamba, sağda alıcı. Lambadan çıkan ışın zemine iner, yansıyıp alıcıya döner.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 90, y: 40, g: 220, y2: 50, dolgu: "gri", kose: 10 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "etiket", x: 200, y: 32, metin: "sensör", hiza: "orta" }, renk: "murekkep", kelime: 1 },
      { sekil: { tur: "daire", x: 140, y: 90, r: 14, dolgu: "kirmizi" }, renk: "murekkep", kelime: 7 },
      { sekil: { tur: "etiket", x: 126, y: 132, metin: "lamba", hiza: "sag" }, renk: "kirmizi", kelime: 12 },
      { sekil: { tur: "isin", bas: [140, 104], son: [200, 205] }, renk: "kirmizi", kelime: 9 },
      { sekil: { tur: "kutu", x: 40, y: 205, g: 320, y2: 22, dolgu: "beyaz", kose: 4 }, renk: "gri", kelime: 9 },
      { sekil: { tur: "etiket", x: 200, y: 250, metin: "zemin", hiza: "orta" }, renk: "murekkep", kelime: 9 },
      { sekil: { tur: "isin", bas: [200, 205], son: [260, 104] }, renk: "kirmizi", kelime: 15 },
      { sekil: { tur: "kutu", x: 246, y: 76, g: 28, y2: 28, dolgu: "mor", kose: 6 }, renk: "murekkep", kelime: 17 },
      { sekil: { tur: "etiket", x: 274, y: 132, metin: "alıcı", hiza: "sol" }, renk: "mor", kelime: 19 }
    ]
  },
  /* "Beyaz zemin ışığın çoğunu geri yansıtır. Siyah bant ise ışığın çoğunu yutar. Alıcıya dönen ışığın miktarı, sensörün altındaki rengi ele verir." */
  "beyaz-siyah-yansima": {
    aciklama: "İki sensör yan yana. Beyaz zeminin üstündeki sensöre kalın bir ışın geri döner; siyah bandın üstündekine ise çok zayıf bir ışın döner.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 20, y: 205, g: 170, y2: 24, dolgu: "beyaz", kose: 4 }, renk: "gri", kelime: 0 },
      { sekil: { tur: "etiket", x: 105, y: 250, metin: "beyaz zemin", hiza: "orta" }, renk: "murekkep", kelime: 1 },
      { sekil: { tur: "kutu", x: 65, y: 40, g: 80, y2: 40, dolgu: "gri", kose: 8 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "isin", bas: [85, 80], son: [105, 205] }, renk: "kirmizi", kelime: 2 },
      { sekil: { tur: "isin", bas: [105, 205], son: [125, 80] }, renk: "kirmizi", kelime: 4 },
      { sekil: { tur: "etiket", x: 105, y: 28, metin: "çok ışık döner", hiza: "orta" }, renk: "yesil", kelime: 5 },
      { sekil: { tur: "kutu", x: 210, y: 205, g: 170, y2: 24, dolgu: "siyah", kose: 4 }, renk: "murekkep", kelime: 6 },
      { sekil: { tur: "etiket", x: 295, y: 250, metin: "siyah bant", hiza: "orta" }, renk: "murekkep", kelime: 7 },
      { sekil: { tur: "kutu", x: 255, y: 40, g: 80, y2: 40, dolgu: "gri", kose: 8 }, renk: "murekkep", kelime: 6 },
      { sekil: { tur: "isin", bas: [275, 80], son: [295, 205] }, renk: "kirmizi", kelime: 9 },
      { sekil: { tur: "isin", bas: [295, 205], son: [315, 80], soluk: true }, renk: "kirmizi", kelime: 11 },
      { sekil: { tur: "etiket", x: 295, y: 28, metin: "az ışık döner", hiza: "orta" }, renk: "kirmizi", kelime: 11 }
    ]
  }
};

export const gorselVarMi = (tur: "sahne" | "cizim", ad: string) => (tur === "sahne" ? ad in SAHNE_ANLARI : ad in CIZIMLER);

/** Hangi katmanlar görünür. Ses okurken kelimeye göre (kelime: okunan kelimenin sırası), yoksa saniyeye göre (her katman
    sırası gelince, saniyede bir). Hareketi azalt açıksa ya da okuma bittiyse hepsi. Sonuç: görünen katmanların sıraları. */
export function gorunenKatmanlar(c: Cizim, o: { kelime?: number; saniye?: number; bitti?: boolean; azHareket?: boolean }): number[] {
  const hepsi = c.katmanlar.map((_, i) => i);
  if (o.azHareket || o.bitti) return hepsi;
  if (o.kelime !== undefined) {
    let enSon = -1;
    return hepsi.filter((i) => {
      const k = c.katmanlar[i].kelime;
      const goster = k === undefined ? i <= enSon + 1 : k <= o.kelime!;
      if (goster) enSon = i;
      return goster;
    });
  }
  const n = Math.floor((o.saniye ?? 0) / 1) + 1;
  /* saniye: aynı kelimeye bağlı katmanlar birlikte belirir */
  const gruplar = [...new Set(c.katmanlar.map((k, i) => k.kelime ?? 1000 + i))].sort((a, b) => a - b);
  const sinir = gruplar[Math.min(n, gruplar.length) - 1];
  return hepsi.filter((i) => (c.katmanlar[i].kelime ?? 1000 + i) <= sinir);
}
