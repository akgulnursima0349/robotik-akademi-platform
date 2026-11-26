import { describe, expect, it } from "vitest";
import { stratejiDegerlendir, BASLANGIC_KARTLARI, type StratejiKartlari } from "@sra/robot-motoru";
import { dersiDogrula, ROBOTIK, SUMO_DERSLERI } from "../src";

/** Her strateji görevi için üç yıldızlı bir örnek kart seti (testte doğrulanır, öğrenciye gösterilmez) */
const UC_YILDIZ: Record<string, Partial<StratejiKartlari>> = {
  "sumo-kurallari": { "rakip-onde": "tam-ileri", hicbiri: "sola-don" },
  "rakibi-gormek": { "rakip-onde": "tam-ileri", "rakip-solda": "sola-don", "rakip-sagda": "saga-don", hicbiri: "saga-don" },
  "ringde-kalmak": { "kenar-sol": "geri-saga", "kenar-sag": "geri-saga", "rakip-onde": "tam-ileri", "rakip-solda": "sola-don", "rakip-sagda": "saga-don", hicbiri: "saga-don" },
  "itme-fizigi": { "kenar-sol": "geri-saga", "kenar-sag": "geri-saga", "rakip-onde": "tam-ileri", "rakip-solda": "sola-don", "rakip-sagda": "saga-don", hicbiri: "sola-don" },
  "sumo-strateji": { "kenar-sol": "geri-saga", "kenar-sag": "geri-saga", "rakip-onde": "tam-ileri", "rakip-solda": "sola-don", "rakip-sagda": "saga-kavis", hicbiri: "saga-don" }
};

describe("Mini Sumo modülü", () => {
  it("altı ders doğrulayıcıdan geçiyor ve Lig'den önce sırasıyla duruyor", () => {
    for (const d of SUMO_DERSLERI) expect(dersiDogrula(d), d.kimlik).toEqual([]);
    const m = ROBOTIK.moduller.find((x) => x.kimlik === "sumo")!;
    expect(m.dersler.map((d) => d.kimlik)).toEqual([...SUMO_DERSLERI.map((d) => d.kimlik), "lig"]);
  });
  it("her anlatım adımının görseli var", () => {
    for (const d of SUMO_DERSLERI) for (const [i, a] of d.anlat.entries()) expect(a.gorsel, `${d.kimlik} ${i + 1}`).toBeDefined();
  });
  it("strateji görevlerinin üç yıldızı ulaşılabilir (sabit kartlar ders tanımından)", () => {
    for (const d of SUMO_DERSLERI) {
      if (d.gorev.tur !== "strateji") continue;
      const k = { ...BASLANGIC_KARTLARI, ...UC_YILDIZ[d.kimlik], ...d.gorev.sabit } as StratejiKartlari;
      expect(stratejiDegerlendir(k, d.gorev.degerlendirme).yildiz, d.kimlik).toBe(3);
    }
  });
  it("hiç kıpırdamayan robot ringde kalsa da yıldız alamaz (10 saniye kuralı)", () => {
    const d = SUMO_DERSLERI[0];
    if (d.gorev.tur !== "strateji") throw new Error();
    const k = { ...BASLANGIC_KARTLARI, ...d.gorev.sabit, "rakip-onde": "bekle", hicbiri: "bekle" } as StratejiKartlari;
    const r = stratejiDegerlendir(k, d.gorev.degerlendirme);
    expect(r.rauntlar.some((x) => x.sonuc.kazanan === null && !x.iyi)).toBe(true);
  });
  it("aynı kartlar her zaman aynı sonucu verir", () => {
    const d = SUMO_DERSLERI.find((x) => x.kimlik === "sumo-strateji")!;
    if (d.gorev.tur !== "strateji") throw new Error();
    const k = { ...BASLANGIC_KARTLARI, ...UC_YILDIZ[d.kimlik] } as StratejiKartlari;
    const a = stratejiDegerlendir(k, d.gorev.degerlendirme), b = stratejiDegerlendir(k, d.gorev.degerlendirme);
    expect(a.rauntlar.map((x) => [x.sonuc.kazanan, x.sonuc.sure])).toEqual(b.rauntlar.map((x) => [x.sonuc.kazanan, x.sonuc.sure]));
  });
});
