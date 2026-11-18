import { describe, expect, it } from "vitest";
import { FORM } from "../../../kurslar/junior/src/data/testler.js";
import { csv, destekGerekenler, enZorBolumler, isiHaritasi, kazanimOzeti, KAZANIMLAR, kursEtkisi, type RaporOgrenci } from "../src";

/** dogrular: hangi soru sıraları doğru cevaplanacak */
const test = (tur: "on" | "son", dogrular: number[]) => ({ bitti: true, cevaplar: FORM[tur].map((s, i) => (dogrular.includes(i) ? s.dogru : (s.dogru + 1) % 4)) });
const ogr = (id: string, on: number[] | null, son: number[] | null, ek: Partial<RaporOgrenci> = {}): RaporOgrenci => ({
  id, takmaAd: id, sonGiris: "2026-11-17T10:00:00Z",
  junior: { testler: { ...(on ? { on: test("on", on) } : {}), ...(son ? { son: test("son", son) } : {}) } }, lab: {}, blok: {}, ...ek
});
const ilk = (n: number) => Array.from({ length: n }, (_, i) => i);

describe("kazanım ısı haritası", () => {
  it("dört durum ve test yokken", () => {
    const h = isiHaritasi([ogr("a", [0, 1], [0, 2]), ogr("b", null, null), ogr("c", [0], null)]);
    expect(h[0].hucreler.slice(0, 4)).toEqual(["biliyordu", "geriledi", "ogrendi", "zorlaniyor"]);
    expect(h[1].hucreler.every((x) => x === "yok")).toBe(true);
    expect(h[2].hucreler.every((x) => x === "yalniz_on")).toBe(true);
    expect(h[0].hucreler.length).toBe(KAZANIMLAR.length);
  });
  it("bitmemiş test sayılmaz", () => {
    const o = ogr("a", [0], [0]);
    o.junior.testler!.son!.bitti = false;
    expect(isiHaritasi([o])[0].hucreler[0]).toBe("yalniz_on");
  });
});

describe("kazanım özeti", () => {
  it("doğru oranları", () => {
    const s = kazanimOzeti([ogr("a", [0], [0, 1]), ogr("b", [], [0])]);
    expect(s[0]).toMatchObject({ on: 0.5, son: 1, onN: 2, sonN: 2 });
    expect(s[1]).toMatchObject({ on: 0, son: 0.5 });
  });
  it("kimse çözmediyse null", () => { expect(kazanimOzeti([ogr("a", null, null)])[0].on).toBeNull(); });
});

describe("kursun etkisi", () => {
  it("eşleştirilmiş dz elle hesaplanan değerle aynı", () => {
    /* ön: 2,4,6 ; son: 5,6,10 → farklar 3,2,4: ort 3, ss 1 → dz 3 */
    const e = kursEtkisi([ogr("a", ilk(2), ilk(5)), ogr("b", ilk(4), ilk(6)), ogr("c", ilk(6), ilk(10))]);
    expect(e.n).toBe(3);
    expect(e.onOrt).toBe(4); expect(e.sonOrt).toBe(7);
    expect(e.fark).toBe(3); expect(e.farkSs).toBeCloseTo(1, 10); expect(e.dz).toBeCloseTo(3, 10);
    expect(e.yorum).toBe("büyük"); expect(e.azVeri).toBe(true);
  });
  it("yalnız iki testi de çözenler sayılır", () => {
    expect(kursEtkisi([ogr("a", ilk(3), null), ogr("b", null, ilk(3))]).n).toBe(0);
  });
  it("hepsi aynı farksa ss 0: dz tanımsız", () => {
    const e = kursEtkisi([ogr("a", ilk(2), ilk(4)), ogr("b", ilk(3), ilk(5))]);
    expect(e.dz).toBeNull(); expect(e.yorum).toBe("yok");
  });
  it("orta etki", () => {
    /* farklar 1,0,2,-1,3 → ort 1, ss √2.5≈1.58 → dz≈0.63 */
    const e = kursEtkisi([ogr("a", ilk(5), ilk(6)), ogr("b", ilk(5), ilk(5)), ogr("c", ilk(5), ilk(7)), ogr("d", ilk(5), ilk(4)), ogr("e", ilk(5), ilk(8))]);
    expect(e.dz).toBeCloseTo(1 / Math.sqrt(2.5), 6); expect(e.yorum).toBe("orta"); expect(e.azVeri).toBe(false);
  });
});

describe("en zor bölümler", () => {
  it("çok deneme + az bitirme önce gelir", () => {
    const o1 = ogr("a", null, null, { blok: { deneme: { "1-4": 8, "1-1": 1 }, yildiz: { "1-1": 3 } }, lab: { gorevler: { kose: { deneme: 3, yildiz: 2 } } } });
    const o2 = ogr("b", null, null, { blok: { deneme: { "1-4": 6 }, yildiz: { "1-4": 1 } } });
    const z = enZorBolumler([o1, o2]);
    expect(z[0]).toMatchObject({ kimlik: "1-4", deneyen: 2, ortDeneme: 7, bitirmeOrani: 0.5 });
    expect(z.map((x) => x.kimlik)).toContain("kose");
    expect(z.at(-1)!.kimlik).toBe("1-1");
  });
});

describe("desteğe ihtiyacı olanlar", () => {
  const simdi = new Date("2026-11-18T12:00:00Z");
  it("gerekçeler", () => {
    const d = destekGerekenler([
      ogr("eski", null, null, { sonGiris: "2026-11-01T10:00:00Z" }),
      ogr("hic", null, null, { sonGiris: null }),
      ogr("geri", ilk(6), ilk(4)),
      ogr("takili", null, null, { blok: { deneme: { "2-3": 7 } } }),
      ogr("iyi", ilk(4), ilk(8))
    ], simdi);
    const g = Object.fromEntries(d.map((x) => [x.ogrenci.id, x.gerekceler.join(" | ")]));
    expect(g.eski).toMatch(/17 gündür/);
    expect(g.hic).toMatch(/hiç giriş/);
    expect(g.geri).toMatch(/geriledi \(6 → 4\)/);
    expect(g.takili).toMatch(/2-3 bölümünde 7 denemedir/);
    expect(g.iyi).toBeUndefined();
  });
});

describe("CSV", () => {
  it("BOM, ; ayraç, ondalık virgül yok (tam sayı fark), kaçış", () => {
    const c = csv([ogr('Ece; "Kar"', ilk(3), ilk(5), { blok: { yildiz: { "1-1": 3, "1-2": 2 } } })]);
    expect(c.startsWith("﻿")).toBe(true);
    const [bas, satir] = c.slice(1).split("\r\n");
    expect(bas.split(";").length).toBe(5 + KAZANIMLAR.length + 2);
    expect(satir.startsWith('"Ece; ""Kar"""')).toBe(true);
    expect(satir).toContain(";3;5;2;");
    expect(satir.endsWith(";5;0")).toBe(true);
  });
});
