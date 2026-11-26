/* Öğretmen raporu için ders ilerlemesi: öğrencinin ders kaydı, Lab kaydı ve öğretmenin onayından hücre durumu ve özet. */
import { dersDurumu, dersKayitlariOku, labAnahtari, type DersDurumuOzeti, type DersTanimi } from "./ders";
import { kayitOku } from "./model";

export type HucreDurumu = "baslamadi" | "suruyor" | "bitti" | "onay-bekliyor" | "onaylandi";
export const HUCRE_DURUMLARI: Record<HucreDurumu, { ad: string; simge: string }> = {
  baslamadi: { ad: "Başlamadı", simge: "·" },
  suruyor: { ad: "Sürüyor", simge: "◐" },
  bitti: { ad: "Bitti", simge: "✓" },
  "onay-bekliyor": { ad: "Sınıfta yaptım dedi, onay bekliyor", simge: "?" },
  onaylandi: { ad: "Öğretmen onayladı", simge: "★" }
};
export interface DersHucresi {
  durum: HucreDurumu;
  ozet: DersDurumuOzeti;
  /** ayrıntı için: kaldığı anlatım adımı, denenen değer sayısı, son çalışma */
  adim: number;
  denenen: number;
  son: string | null;
}
/** Rapor satırının ham alanları (bulut'taki RaporSatiri'nin ilgili kısmı) */
export interface DersRaporGirdisi { dersler?: unknown; lab?: unknown; onaylar?: Record<string, string> }

export function dersHucresi(d: DersTanimi, g: DersRaporGirdisi): DersHucresi {
  const k = dersKayitlariOku(g.dersler && typeof g.dersler === "object" ? g.dersler : null).dersler[d.kimlik];
  const lab = kayitOku(g.lab && typeof g.lab === "object" ? JSON.stringify(g.lab) : null);
  const labYildizi = d.gorev.tur === "lab" ? lab.gorevler[labAnahtari(d.gorev)]?.yildiz ?? 0 : 0;
  const onayli = !!g.onaylar && d.kimlik in g.onaylar;
  const s = dersDurumu(d, k, labYildizi, onayli);
  const basladi = !!k && (!!k.anlat || !!k.dene || !!k.gorev || !!k.gercek) || labYildizi > 0;
  const durum: HucreDurumu = s.onayli ? "onaylandi" : k?.gercek?.ogrenci ? "onay-bekliyor" : s.bitti ? "bitti" : basladi ? "suruyor" : "baslamadi";
  return { durum, ozet: s, adim: k?.anlat?.adim ?? 0, denenen: k?.dene?.degerler ?? 0, son: k?.son ?? null };
}

export interface DersSinifOzeti { ogrenci: number; bitiren: number; onayBekleyen: number; onaylanan: number; baslamayan: number }
/** Bir dersin sınıftaki özeti. "Bitiren": anlat + dene + görev bitmiş (onaylı ya da onay bekleyen de olabilir). */
export function dersSinifOzeti(d: DersTanimi, satirlar: DersRaporGirdisi[]): DersSinifOzeti {
  const h = satirlar.map((g) => dersHucresi(d, g));
  return {
    ogrenci: h.length,
    bitiren: h.filter((x) => x.ozet.bitti).length,
    onayBekleyen: h.filter((x) => x.durum === "onay-bekliyor").length,
    onaylanan: h.filter((x) => x.durum === "onaylandi").length,
    baslamayan: h.filter((x) => x.durum === "baslamadi").length
  };
}
