/* Kodla Oyna atölyesi: Blok Atölyesi'nin dünyaları modül, bölümleri ders. Adlar ve sıralar Blok'un kendi listesinden gelir.
   İlerleme Blok'un kaydından (sra-blok-v1); kilit Blok'taki gibi bütün bölümler boyunca sürer. */
import { BOLUMLER, DUNYALAR } from "@sra/robot-motoru";
import { kayitOku, type Atolye, type IlerlemeKaydi } from "./model";

export const BLOK_KAYIT_ANAHTARI = "sra-blok-v1";

export const KODLA_OYNA: Atolye = {
  kimlik: "kodla-oyna",
  ad: "Kodla Oyna",
  aciklama: "Sürükle-bırak bloklarla Bit'i ızgarada yürüt. Her yönerge sesli okunur; okumayı yeni sökenler de rahat eder.",
  kilit: "atolye",
  moduller: DUNYALAR.map((d) => ({
    kimlik: `dunya-${d.no}`, ad: d.ad, aciklama: d.ogrettigi, robot: "Bit", seviyeler: ["okul-oncesi", "ilkokul"],
    dersler: BOLUMLER.filter((b) => b.dunya === d.no).map((b) => ({ kimlik: b.kimlik, ad: b.ad, ogretir: `Bölüm ${b.sira}`, tur: "gorev" as const, adres: `blok/#b/${b.kimlik}`, enCokYildiz: 3, anahtar: b.kimlik }))
  }))
};

/** Blok kaydı ({ yildiz: { "1-1": 3 } }) → ortak ilerleme kaydı */
export function blokKaydiOku(ham: string | null | undefined): IlerlemeKaydi {
  if (!ham) return kayitOku(null);
  try {
    const v = JSON.parse(ham);
    return kayitOku(JSON.stringify({ gorevler: Object.fromEntries(Object.entries(v?.yildiz ?? {}).map(([k, y]) => [k, { yildiz: y }])) }));
  } catch { return kayitOku(null); }
}
