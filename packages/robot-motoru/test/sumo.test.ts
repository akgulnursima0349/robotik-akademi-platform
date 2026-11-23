import { describe, expect, it } from "vitest";
import { baslangic, DIZILISLER, KENSHIN, rauntOyna, RING, sumoMaci, sumoTurnuvasi, type SumoBeyni } from "../src";

const boga: SumoBeyni = () => [255, 255];
const dur: SumoBeyni = () => [0, 0];
const avci: SumoBeyni = (g) => {
  if (g.kenar[0] || g.kenar[1]) return [-255, -120];
  const [sy, so, o, sg, syg] = g.rakip;
  if (o || (so && sg)) return [255, 255]; if (so) return [120, 255]; if (sg) return [255, 120];
  if (sy) return [-200, 200]; if (syg) return [200, -200]; return [160, -160];
};

describe("Mini sumo motoru", () => {
  it("başlangıç: robotlar ringin içinde, merkeze göre simetrik", () => {
    for (const d of DIZILISLER) {
      const [a, b] = baslangic(d, 4);
      expect(a[0]).toBeCloseTo(-b[0]); expect(a[1]).toBeCloseTo(-b[1]);
      expect(Math.abs(Math.abs(a[2] - b[2]) - Math.PI)).toBeLessThan(1e-9);
      expect(Math.hypot(a[0], a[1]) + KENSHIN.boy).toBeLessThan(RING.kenarIc);
    }
  });
  it("deterministik: aynı beyinler ve tohum, aynı raunt", () => {
    expect(JSON.stringify(rauntOyna([avci, avci], "yan", 3))).toBe(JSON.stringify(rauntOyna([avci, avci], "yan", 3)));
  });
  it("karşı karşıya: Boğa duran robotu halkadan iter; temas kaydedilir", () => {
    const r = rauntOyna([boga, dur], "karsi", 3);
    expect(r.kazanan).toBe(0); expect(r.sebep).toBe("dustu");
    expect(r.kareler.some((k) => k.temas)).toBe(true);
    expect(r.sure).toBeLessThan(2);
  });
  it("orta sensör karşıdaki rakibi görür, yan sensörler görmez", () => {
    const k = rauntOyna([dur, dur], "karsi", 3, 0.1).kareler[1].robotlar[0];
    expect(k.rakip[2]).toBe(1); expect(k.rakip[0]).toBe(0); expect(k.rakip[4]).toBe(0);
  });
  it("yan yana dizilişte rakip yan sensörde görünür", () => {
    const k = rauntOyna([dur, dur], "yan", 3, 0.1).kareler[1].robotlar[0];
    expect(k.rakip[0] + k.rakip[4]).toBe(1);
  });
  it("kenara gelen robotun zemin sensörü beyazı görür, sonra halkadan düşer", () => {
    const r = rauntOyna([boga, dur], "yan", 3);
    expect(r.kareler.some((k) => k.robotlar[0].kenar.includes(1))).toBe(true);
    expect(r.kazanan).toBe(1); expect(r.kareler.at(-1)!.robotlar[0].dustu).toBe(true);
  });
  it("iki eşit saldırgan önden çarpışırsa kimse kazanamaz (süre biter)", () => {
    const r = rauntOyna([boga, boga], "karsi", 3);
    expect(r.kazanan).toBeNull(); expect(r.sebep).toBe("sure");
  });
  it("bıçak avantajı: yandan bıçakla giren robot rakibini kaldırır", () => {
    const r = rauntOyna([avci, dur], "sirt", 3);
    expect(r.kareler.some((k) => k.robotlar[1].kaldirildi)).toBe(true);
    expect(r.kazanan).toBe(0);
  });
  it("hata veren beyin o raunt durur; hata kaydedilir", () => {
    const r = rauntOyna([() => { throw new Error("3. satır: patladı"); }, boga], "karsi", 2);
    expect(r.hatalar[0]).toMatch(/patladı/); expect(r.kazanan).toBe(1);
  });
  it("maç: iki raunt alan kazanır; en fazla üç raunt", () => {
    const m = sumoMaci(avci, dur, 1);
    expect(m.kazanan).toBe(0); expect(m.raunt[0]).toBe(2); expect(m.rauntlar.length).toBeLessThanOrEqual(3);
  });
  it("turnuva: herkes herkesle; puan ve sıralama", () => {
    const t = sumoTurnuvasi([{ kimlik: "a", ad: "Avcı", beyin: avci }, { kimlik: "d", ad: "Duran", beyin: dur }, { kimlik: "b", ad: "Boğa", beyin: boga }]);
    expect(t.maclar).toHaveLength(3);
    expect(t.tablo[0].kimlik).toBe("a");
    const toplamO = t.tablo.reduce((s, r) => s + r.o, 0);
    expect(toplamO).toBe(6);
    for (const r of t.tablo) expect(r.puan).toBe(r.g * 3 + r.b);
  });
});
