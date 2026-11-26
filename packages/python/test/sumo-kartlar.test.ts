import "./kurulum";
import { describe, expect, it } from "vitest";
import { HAZIR_RAKIPLER, kartBeyni, kartlardanPython, rauntOyna, DIZILISLER, type StratejiKartlari } from "@sra/robot-motoru";
import { pythonBeyin } from "../src";

const ornekler: StratejiKartlari[] = [
  { "kenar-sol": "geri-saga", "kenar-sag": "geri-sola", "rakip-onde": "tam-ileri", "rakip-solda": "sola-don", "rakip-sagda": "saga-kavis", hicbiri: "saga-don" },
  { "kenar-sol": "bekle", "kenar-sag": "saga-don", "rakip-onde": "yavas-ileri", "rakip-solda": "sola-kavis", "rakip-sagda": "geri-saga", hicbiri: "yavas-ileri" }
];
const ozet = (r: ReturnType<typeof rauntOyna>) => [r.kazanan, r.sebep, r.sure, r.kareler.length, r.kareler[r.kareler.length - 1].robotlar.map((x) => [x.x.toFixed(6), x.y.toFixed(6)])];

describe("strateji kartlarından Python", () => {
  it("üretilen kod kartlarla aynı rauntları oynar (bir beyin art arda rauntlarda: yeni raunt başa döner)", () => {
    for (const k of ornekler) {
      const p = pythonBeyin(kartlardanPython(k));
      expect(p.hata ?? null).toBeNull();
      for (const [i, d] of DIZILISLER.entries()) for (const rakip of ["saldiran", "kacan"] as const) {
        const ts = rauntOyna([kartBeyni(k), kartBeyni(HAZIR_RAKIPLER[rakip].kartlar)], d, 5 + i);
        const py = rauntOyna([p.beyin!, kartBeyni(HAZIR_RAKIPLER[rakip].kartlar)], d, 5 + i);
        expect(ozet(py), `${d} ${rakip}`).toEqual(ozet(ts));
      }
    }
  });
});
