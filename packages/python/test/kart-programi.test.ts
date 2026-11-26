import "./kurulum";
import { describe, expect, it } from "vitest";
import { KART_GOREVLERI, kartCalistir, kartProgramiPython, type Gorev, type Kart } from "@sra/robot-motoru";
import { karKuremeCalistir } from "../src";

/** Kart programı ile Python karşılığı Kar Küreme'de aynı izi verir */
const gorev = (haritalar: string[][], yon: 0 | 1 | 2 | 3, batarya: number): Gorev => ({
  kimlik: "kart", sira: 0, ad: "", ogrettigi: "", hikaye: "", haritalar, yon, batarya, enerjiSiniri: 0, satirSiniri: 0, komutlar: [], baslangicKodu: "", ipucu: "", cozum: ""
});
const iz = (s: { iz: { x: number; y: number; yon: number; batarya: number; olay: string }[] }) => s.iz.map(({ x, y, yon, batarya, olay }) => ({ x, y, yon, batarya, olay }));
const I: Kart = { tur: "ileri" };
const ek: [string, Kart[]][] = [
  ["iç içe tekrar ve eğer–değilse", [{ tur: "tekrarla", kez: 3, ic: [{ tur: "tekrarla", kez: 2, ic: [{ tur: "eger", kosul: "kar-var", ic: [I], degilse: [{ tur: "sol" }] }] }] }]],
  ["çarpan program", [I, I, I, I, I, I, I, I, I]],
  ["boş eğer kolu", [{ tur: "eger", kosul: "onu-acik", ic: [], degilse: [I] }, I]]
];

describe("kart programı: TS = Python", () => {
  for (const g of Object.values(KART_GOREVLERI)) {
    it(g.kimlik, () => {
      const py = karKuremeCalistir(gorev(g.haritalar, g.yon, g.batarya), kartProgramiPython(g.cozum));
      expect(py.hata).toBeNull();
      g.haritalar.forEach((h, i) => expect(iz(kartCalistir(h, g.yon, g.batarya, g.cozum).sim)).toEqual(iz(py.simler[i])));
    });
  }
  for (const [ad, p] of ek) {
    it(ad, () => {
      const g = KART_GOREVLERI["mb-koseler"];
      const py = karKuremeCalistir(gorev(g.haritalar, g.yon, g.batarya), kartProgramiPython(p));
      expect(iz(kartCalistir(g.haritalar[0], g.yon, g.batarya, p).sim)).toEqual(iz(py.simler[0]));
    });
  }
  it("Python metni okunur", () => {
    expect(kartProgramiPython(KART_GOREVLERI["mb-eger"].cozum)).toBe("for i in range(7):\n    if not onu_acik():\n        saga_don()\n    else:\n        ileri()\n");
  });
});
