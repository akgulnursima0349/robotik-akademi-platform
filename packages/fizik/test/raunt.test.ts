import { describe, expect, it } from "vitest";
import { rauntOyna, type SumoBeyni } from "@sra/robot-motoru";
import { fizikliRauntOyna } from "../src/sumo/raunt";

const duran: SumoBeyni = () => [0, 0];
/** ligdeki örnek "Avcı" gibi: rakibi görünce saldırır, görmezse yerinde döner, kenarda geri çekilir */
const avci: SumoBeyni = (g) => {
  if (g.kenar[0] || g.kenar[1]) return [-255, -255];
  const [sy, so, o, sgo, sgy] = g.rakip;
  if (o || (so && sgo)) return [255, 255];
  if (so || sy) return [-150, 150];
  if (sgo || sgy) return [150, -150];
  return [140, -140];
};

describe("Fizikli sumo raundu", () => {
  it("ligdeki biçimde sonuç; saldıran robot kıpırdamayana karşı kazanıyor", async () => {
    for (const d of ["karsi", "yan", "sirt"] as const) {
      const r = await fizikliRauntOyna([avci, duran], d, 3);
      expect(r.kazanan).toBe(0);
      expect(r.sebep).toBe("dustu");
      expect(r.sure).toBeLessThan(10);
      const k = r.kareler[0].robotlar[0];
      for (const alan of ["x", "y", "yon", "sol", "sag", "solYol", "sagYol", "rakip", "kenar", "kaldirildi", "dustu", "poz"]) expect(k).toHaveProperty(alan);
      /* başlangıç ligdekiyle aynı yerde */
      const eski = rauntOyna([avci, duran], d, 3);
      expect(k.x).toBeCloseTo(eski.kareler[0].robotlar[0].x, 0);
      expect(k.y).toBeCloseTo(eski.kareler[0].robotlar[0].y, 0);
      const fark = k.yon - eski.kareler[0].robotlar[0].yon;
      expect(Math.abs(Math.atan2(Math.sin(fark), Math.cos(fark)))).toBeLessThan(1e-3);
      /* sonuçtan sonra düşüş kaydı: son karede düşen robot ring üstünün altında */
      const son = r.kareler[r.kareler.length - 1];
      expect(son.t).toBeGreaterThan(r.sure);
      expect(son.robotlar[1].dustu).toBe(true);
    }
  });

  it("iki robot da kıpırdamazsa süre dolar, berabere", async () => {
    const r = await fizikliRauntOyna([duran, duran], "karsi", 1, 2);
    expect(r).toMatchObject({ kazanan: null, sebep: "sure", sure: 2 });
    expect(r.kareler).toHaveLength(101);
  });

  it("aynı beyinler ve tohumla aynı sonuç (determinizm)", async () => {
    const a = await fizikliRauntOyna([avci, avci], "yan", 7);
    const b = await fizikliRauntOyna([avci, avci], "yan", 7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("hata veren beyin kaydediliyor, o robot duruyor, raunt sürüyor", async () => {
    const hatali: SumoBeyni = (g) => { if (g.zaman >= 500) throw new Error("bozuldu"); return [200, 200]; };
    const r = await fizikliRauntOyna([hatali, duran], "karsi", 2, 3);
    expect(r.hatalar[0]).toBe("bozuldu");
    expect(r.hatalar[1]).toBeNull();
    const sonra = r.kareler.find((k) => k.t >= 0.6)!;
    expect(sonra.robotlar[0].sol).toBe(0);
    expect(r.kareler[r.kareler.length - 1].t).toBeGreaterThan(0.6);
  });

  it("10 saniyelik raunt makul sürede hesaplanıyor", async () => {
    const t0 = performance.now();
    const r = await fizikliRauntOyna([() => [150, -150], () => [-150, 150]], "yan", 5); // ikisi de yerinde döner: tam 10 sn
    const ms = performance.now() - t0;
    console.log(`fizikli raunt: ${r.sure} sn oyun, ${ms.toFixed(0)} ms hesap`);
    expect(r.sebep).toBe("sure");
    expect(ms).toBeLessThan(5000);
  });
});
