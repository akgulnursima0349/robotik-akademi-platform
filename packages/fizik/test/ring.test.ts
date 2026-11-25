import { describe, expect, it } from "vitest";
import { Dunya } from "../src/fizik";
import { SumoRingi, RING_FIZIK } from "../src/sumo/ring";

const bekle = (d: Dunya, sn: number) => { for (let i = 0; i < Math.round(sn / d.adim); i++) d.ilerle(); };
async function kur(ayar?: { yaricap?: number }) { const d = await Dunya.kur(); return { d, ring: new SumoRingi(d, ayar) }; }

describe("Sumo ringi", () => {
  it("ring ortasında duran robot düşmüş sayılmıyor", async () => {
    const { d, ring } = await kur();
    const k = ring.ekle({ x: 0, z: 0 });
    bekle(d, 1.5);
    expect(ring.dustu(k)).toBe(false);
    expect(k.konum.y).toBeGreaterThan(RING_FIZIK.yukseklik - 0.002);
  });

  it("kenara tam güçle giden robot ringden düşüyor ve düşme tespit ediliyor", async () => {
    const { d, ring } = await kur();
    const k = ring.ekle({ x: 0, z: 0 });
    bekle(d, 0.3);
    k.surus(1, 1);
    bekle(d, 1.5);
    expect(ring.dustu(k)).toBe(true);
    const t = ring.dusmeZamani(k)!;
    expect(t).toBeGreaterThan(0.4);  // ~33 cm yol: hızlanmayla en az 0,3 sn sürer
    expect(t).toBeLessThan(1.2);
  });

  it("zemin sensörleri: beyaz kenar 1, siyah alan 0, ring dışı 0", async () => {
    const { d, ring } = await kur();
    const orta = ring.ekle({ x: 0, z: 0 });
    const kenarda = ring.ekle({ x: 0.3725 - 0.046, z: 0 });       // sensörler beyaz kenarın ortasında
    const disarida = ring.ekle({ x: 0, z: 0.36 }, -Math.PI / 2);   // +z'ye bakıyor; sensörler 40,6 cm'de, ringin dışında
    d.ilerle();
    expect(ring.okuma(orta).kenar).toEqual([0, 0]);
    expect(ring.okuma(kenarda).kenar).toEqual([1, 1]);
    expect(ring.okuma(disarida).kenar).toEqual([0, 0]);
  });

  it("orta sensör 30 cm öndeki rakibi görüyor, 70 cm öndekini görmüyor; robot kendini görmüyor", async () => {
    const { d, ring } = await kur({ yaricap: 1.2 });
    const k = ring.ekle({ x: -0.6, z: 0 });
    const yakin = ring.ekle({ x: -0.6 + 0.05 + 0.3 + 0.05, z: 0 });
    d.ilerle();
    expect(ring.okuma(k).rakip).toEqual([0, 0, 1, 0, 0]);
    const { d: d2, ring: r2 } = await kur({ yaricap: 1.2 });
    const k2 = r2.ekle({ x: -0.6, z: 0 });
    r2.ekle({ x: -0.6 + 0.05 + 0.7 + 0.05, z: 0 });
    d2.ilerle();
    expect(r2.okuma(k2).rakip).toEqual([0, 0, 0, 0, 0]);
    const { d: d3, ring: r3 } = await kur();
    const yalniz = r3.ekle({ x: 0, z: 0 });
    d3.ilerle();
    expect(r3.okuma(yalniz).rakip).toEqual([0, 0, 0, 0, 0]);
    expect(yakin).toBeDefined();
  });

  it("yandaki rakibi yalnız o yandaki sensör görüyor", async () => {
    const { d, ring } = await kur();
    const k = ring.ekle({ x: 0, z: 0 });
    ring.ekle({ x: 0.01, z: -0.22 }, Math.PI / 2); // solda (sol = -z)
    d.ilerle();
    expect(ring.okuma(k).rakip).toEqual([1, 0, 0, 0, 0]);
    const { d: d2, ring: r2 } = await kur();
    const k2 = r2.ekle({ x: 0, z: 0 });
    r2.ekle({ x: 0.01, z: 0.22 }, Math.PI / 2);
    d2.ilerle();
    expect(r2.okuma(k2).rakip).toEqual([0, 0, 0, 0, 1]);
  });

  it("arkasından itilen robot ringden düşüyor, kenarı gören iten robot ringde kalıyor", async () => {
    const { d, ring } = await kur();
    const iten = ring.ekle({ x: -0.15, z: 0 });
    const itilen = ring.ekle({ x: 0.02, z: 0 });
    bekle(d, 0.3);
    let geri = 0;
    for (let i = 0; i < Math.round(3 / d.adim); i++) {
      const g = ring.okuma(iten);
      if (g.kenar.some((v) => v)) geri = 0.4;
      if (geri > 0) { iten.surus(-0.6, -0.6); geri -= d.adim; } else iten.surus(1, 1);
      d.ilerle();
    }
    expect(ring.dustu(itilen)).toBe(true);
    expect(ring.dustu(iten)).toBe(false);
  });

  it("aynı girdilerle aynı özet (determinizm)", async () => {
    const kos = async () => {
      const { d, ring } = await kur();
      const a = ring.ekle({ x: -0.15, z: 0.01 }), b = ring.ekle({ x: 0.15, z: -0.01 }, Math.PI);
      for (let i = 0; i < 960; i++) {
        const ga = ring.okuma(a), gb = ring.okuma(b);
        a.surus(ga.rakip[2] ? 1 : 0.6, ga.rakip[2] ? 1 : -0.6); b.surus(gb.kenar[0] ? -1 : 0.9, 1);
        d.ilerle();
      }
      return d.ozet() + ring.dustu(a) + ring.dustu(b);
    };
    expect(await kos()).toBe(await kos());
  });
});
