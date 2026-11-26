import { describe, expect, it } from "vitest";
import { dersHucresi, dersSinifOzeti, dersBul } from "../src";

const d = dersBul("siroline-sensor")!;
const kayit = (k: object) => ({ dersler: { "siroline-sensor": k } });
const bitmis = { anlat: { adim: 3, bitti: true }, dene: { degerler: 3, bitti: true } };
const lab = { gorevler: { "cizgi-oval": { yildiz: 2 } } };

describe("ders raporu hücresi", () => {
  it("beş durum kayıttan doğru çıkıyor", () => {
    expect(dersHucresi(d, {}).durum).toBe("baslamadi");
    expect(dersHucresi(d, { dersler: kayit({ anlat: { adim: 1, bitti: false } }) }).durum).toBe("suruyor");
    expect(dersHucresi(d, { dersler: kayit(bitmis) }).durum).toBe("suruyor"); // görev yok
    expect(dersHucresi(d, { dersler: kayit(bitmis), lab }).durum).toBe("bitti");
    expect(dersHucresi(d, { dersler: kayit({ gercek: { ogrenci: true } }) }).durum).toBe("onay-bekliyor");
    expect(dersHucresi(d, { dersler: kayit({ gercek: { ogrenci: true } }), onaylar: { "siroline-sensor": "2026-11-26T10:00:00Z" } }).durum).toBe("onaylandi");
    /* öğrenci işaretlemeyi unutmuş: öğretmen yine onaylayabilir */
    expect(dersHucresi(d, { onaylar: { "siroline-sensor": "2026-11-26T10:00:00Z" } }).durum).toBe("onaylandi");
  });
  it("ayrıntı: adım, denenen değer, Lab yıldızı, son çalışma", () => {
    const h = dersHucresi(d, { dersler: kayit({ ...bitmis, son: "2026-11-25T09:00:00Z" }), lab });
    expect([h.adim, h.denenen, h.ozet.gorevYildiz, h.son]).toEqual([3, 3, 2, "2026-11-25T09:00:00Z"]);
  });
  it("onay yalnız ilgili dersi etkiler; bozuk kayıt başlamadı sayılır", () => {
    expect(dersHucresi(d, { onaylar: { "baska-ders": "x" } }).durum).toBe("baslamadi");
    expect(dersHucresi(d, { dersler: "bozuk", lab: [1, 2] }).durum).toBe("baslamadi");
  });
});

describe("sınıf özeti", () => {
  it("bitiren, onay bekleyen, onaylanan, başlamayan", () => {
    const o = dersSinifOzeti(d, [
      {},
      { dersler: kayit(bitmis), lab },
      { dersler: kayit({ ...bitmis, gercek: { ogrenci: true } }), lab },
      { dersler: kayit({ ...bitmis, gercek: { ogrenci: true } }), lab, onaylar: { "siroline-sensor": "z" } },
      { dersler: kayit({ anlat: { adim: 2, bitti: false } }) }
    ]);
    expect(o).toEqual({ ogrenci: 5, bitiren: 3, onayBekleyen: 1, onaylanan: 1, baslamayan: 1 });
  });
});
