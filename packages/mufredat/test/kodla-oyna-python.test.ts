import { describe, expect, it } from "vitest";
import { BOLUMLER, DUNYALAR } from "@sra/robot-motoru";
import { atolyeOzeti, blokKaydiOku, kaldigiYer, KODLA_OYNA, modulIlerlemeleri, PYTHON, seviyeSirasi } from "../src";

describe("Kodla Oyna atölyesi Blok ile aynı", () => {
  it("dünyalar modül, bölümler ders; sıra, ad ve adres Blok'un listesinden", () => {
    expect(KODLA_OYNA.moduller.map((m) => m.ad)).toEqual(DUNYALAR.map((d) => d.ad));
    expect(KODLA_OYNA.moduller.flatMap((m) => m.dersler.map((d) => [d.anahtar, d.ad, d.adres]))).toEqual(BOLUMLER.map((b) => [b.kimlik, b.ad, `blok/#b/${b.kimlik}`]));
  });
  it("Blok kaydı okunur; bozuk kayıtta sıfırdan", () => {
    expect(blokKaydiOku(JSON.stringify({ yildiz: { "1-1": 3, "1-2": 1 }, deneme: { "1-1": 4 } })).gorevler).toEqual({ "1-1": { yildiz: 3 }, "1-2": { yildiz: 1 } });
    expect(blokKaydiOku("{x").gorevler).toEqual({});
    expect(blokKaydiOku(null).gorevler).toEqual({});
  });
  it("kilit Blok'taki gibi dünyalar boyunca sürer: dünya 2'nin ilk bölümü dünya 1'in son bölümünü bekler", () => {
    const d1 = BOLUMLER.filter((b) => b.dunya === 1);
    const yarim = blokKaydiOku(JSON.stringify({ yildiz: Object.fromEntries(d1.slice(0, -1).map((b) => [b.kimlik, 2])) }));
    const m = [...modulIlerlemeleri(KODLA_OYNA, yarim).values()];
    expect(m[1].dersler[0].durum).toBe("kilitli");
    expect(kaldigiYer(KODLA_OYNA, yarim, "ilkokul")!.ders.anahtar).toBe(d1[d1.length - 1].kimlik);
    const tam = blokKaydiOku(JSON.stringify({ yildiz: Object.fromEntries(d1.map((b) => [b.kimlik, 2])) }));
    expect([...modulIlerlemeleri(KODLA_OYNA, tam).values()][1].dersler[0].durum).toBe("acik");
    expect(atolyeOzeti(KODLA_OYNA, tam).biten).toBe(d1.length);
  });
});

describe("Python atölyesi", () => {
  it("ilkokulda Junior, ortaokul ve lisede Python Atölyesi önerilir; modüller kursa götürür, ilerlemeye sayılmaz", () => {
    expect(seviyeSirasi(PYTHON, "ilkokul").onerilen.map((m) => m.kimlik)).toEqual(["junior"]);
    for (const s of ["ortaokul", "lise"] as const) expect(seviyeSirasi(PYTHON, s).onerilen.map((m) => m.kimlik)).toEqual(["atolye"]);
    expect(PYTHON.moduller.map((m) => m.dersler[0].adres)).toEqual(["junior/", "ortaokul/"]);
    expect(atolyeOzeti(PYTHON, blokKaydiOku(null)).sayilan).toBe(0);
  });
});
