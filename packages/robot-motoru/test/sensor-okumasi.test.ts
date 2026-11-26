import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { banttaOkumalar, CizgiRobotu, CIZGI_GOREVLERI, Pist, qtrOkuyucu, sensorOkumasi, type PistTanimi } from "../src";

describe("ortak sensör hesabı", () => {
  it("bandın tam üstü, kenarı ve dışı", () => {
    expect(sensorOkumasi(0, "beyaz")).toBe(950);
    expect(sensorOkumasi(9.5, "beyaz")).toBe(498);
    expect(sensorOkumasi(20, "beyaz")).toBe(45);
    expect(sensorOkumasi(0, "siyah")).toBe(45);
    expect(sensorOkumasi(20, "siyah")).toBe(950);
  });
  it("bant ortadayken konum 3500, s[3] ve s[4] görür; uçlarda uç değerler", () => {
    const o = banttaOkumalar(0);
    expect(o[3]).toBe(950); expect(o[4]).toBe(950); expect(o[0]).toBe(45); expect(o[7]).toBe(45);
    expect(qtrOkuyucu()(o)).toBe(3500);
    expect(qtrOkuyucu()(banttaOkumalar(40))).toBeLessThan(500);
    expect(qtrOkuyucu()(banttaOkumalar(-40))).toBeGreaterThan(6500);
    /* siyah zeminde beyaz bant: okumalar ters, konum (taban değerin farkı dışında) aynı */
    expect(banttaOkumalar(0, "siyah")[3]).toBe(45);
    expect(Math.abs(qtrOkuyucu()(banttaOkumalar(-20, "siyah"), "siyah") - qtrOkuyucu()(banttaOkumalar(-20)))).toBeLessThan(20);
  });
  it("Lab'ın çizgi robotu ortak işleve taşınmadan önceki okumaların aynısını veriyor", () => {
    const out: number[][] = [];
    for (const g of CIZGI_GOREVLERI.slice(0, 3)) {
      const r = new CizgiRobotu(new Pist(g.pist as PistTanimi, "beyaz"), 3);
      for (let k = 0; k < 200; k++) { r.adim(120, 90); out.push(r.sensorler()); }
    }
    const r2 = new CizgiRobotu(new Pist(CIZGI_GOREVLERI[0].pist as PistTanimi, "siyah"), 5);
    for (let k = 0; k < 200; k++) { r2.adim(150, 60); out.push(r2.sensorler()); }
    expect(createHash("md5").update(JSON.stringify(out)).digest("hex")).toBe("fbb50fc505670bc96b8a35a909e80a39");
  });
});
