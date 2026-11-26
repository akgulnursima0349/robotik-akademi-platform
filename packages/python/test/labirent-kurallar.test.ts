import "./kurulum";
import { describe, expect, it } from "vitest";
import { KURAL_KODLARI, kuralKos, LABIRENT_GOREVLERI, type KuralAdi } from "@sra/robot-motoru";
import { labirentCalistir } from "../src";

/** Ders deneylerindeki kural adımları (TS) ile Lab'daki Python örnek çözümü aynı izi verir */
const iz = (k: { iz: { x: number; y: number; yon: number; olay: string; t: number }[] }) => k.iz.map(({ x, y, yon, olay, t }) => ({ x, y, yon, olay, t }));
const durumlar: [KuralAdi, string][] = [["sag-el", "lb-sag-el"], ["sag-el", "lb-meb"], ["sol-el", "lb-hangi-el"], ["hafiza", "lb-ada"], ["sag-el", "lb-ada"]];

describe("labirent kuralları: TS karşılığı = Python", () => {
  for (const [kural, gorev] of durumlar) {
    it(`${kural} · ${gorev}`, () => {
      const g = LABIRENT_GOREVLERI.find((x) => x.kimlik === gorev)!;
      const py = labirentCalistir(g, KURAL_KODLARI[kural]);
      g.haritalar.forEach((h, i) => {
        const ts = kuralKos(h, kural, { sureSiniri: g.sureSiniri });
        expect(iz(ts.sim)).toEqual(iz(py.simler[i]));
      });
    });
  }
});
