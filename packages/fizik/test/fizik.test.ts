import { describe, expect, it } from "vitest";
import { Dunya, MALZEME, tekrarOynat, type Girdi } from "../src/fizik";

const g = 9.81;

describe("fizik: analitik karşılaştırma", () => {
  it("serbest düşüş: 1 m'den yere varış süresi √(2h/g) ile ±%1", async () => {
    const d = await Dunya.kur();
    const r = 0.02, h = 1;
    const top = d.hareketli({ x: 0, y: h + r, z: 0 });
    d.kure(top, r, MALZEME.celik, 1000);
    /* yer yok: yalnız serbest düşüş; merkez h kadar inince dur */
    while (top.translation().y > r) d.ilerle();
    const beklenen = Math.sqrt((2 * h) / g);
    expect(Math.abs(d.zaman - beklenen) / beklenen).toBeLessThan(0.01);
    d.yokEt();
  });

  it("eğik düzlemde kayma: kritik açı atan(μ) ile ±1°", async () => {
    const mu = 0.5, beklenen = (Math.atan(mu) * 180) / Math.PI; // ≈ 26,57°
    const kayiyorMu = async (derece: number) => {
      const d = await Dunya.kur();
      const a = (derece * Math.PI) / 180;
      const m = { ad: "deney", surtunme: mu, sekme: 0 };
      /* eğik düzlem: büyük, ince bir kutu; z ekseni etrafında döndürülmüş */
      const q = { x: 0, y: 0, z: Math.sin(-a / 2), w: Math.cos(-a / 2) };
      const zemin = d.world.createRigidBody(d.R.RigidBodyDesc.fixed().setRotation(q));
      d.kutu(zemin, { x: 2, y: 0.05, z: 1 }, m);
      /* blok düzlemin üstünde, düzleme göre hizalı */
      const n = { x: Math.sin(a), y: Math.cos(a) };
      const blok = d.hareketli({ x: n.x * 0.101, y: n.y * 0.101, z: 0 }, q);
      d.kutu(blok, { x: 0.05, y: 0.05, z: 0.05 }, m, 1000);
      for (let i = 0; i < 60; i++) d.ilerle(); // yerleşsin
      const p0 = blok.translation();
      for (let i = 0; i < 240; i++) d.ilerle(); // 1 sn
      const p1 = blok.translation();
      const yol = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      d.yokEt();
      return yol > 0.01;
    };
    let alt = beklenen - 6, ust = beklenen + 6;
    expect(await kayiyorMu(alt)).toBe(false);
    expect(await kayiyorMu(ust)).toBe(true);
    for (let i = 0; i < 9; i++) { const o = (alt + ust) / 2; if (await kayiyorMu(o)) ust = o; else alt = o; }
    expect(Math.abs((alt + ust) / 2 - beklenen)).toBeLessThan(1);
  });
});

/* motorlu küçük bir araç: iki girdi (sol, sağ itme) ile sürülür; determinizm ve tekrar testi için */
function kur(d: Dunya) {
  const zemin = d.sabit();
  d.kutu(zemin, { x: 1, y: 0.01, z: 1 }, MALZEME.ring, undefined, { x: 0, y: -0.01, z: 0 });
  const govdeler = [0, 1, 2].map((i) => {
    const b = d.hareketli({ x: -0.3 + i * 0.3, y: 0.05 + i * 0.02, z: 0.1 * i });
    d.kutu(b, { x: 0.05, y: 0.02, z: 0.04 }, MALZEME.lastik, 600);
    return b;
  });
  d.girdiUygula = (_d, girdi) => {
    if (!girdi) return;
    govdeler[0].applyImpulse({ x: girdi.sol * 0.001, y: 0, z: girdi.sag * 0.001 }, true);
  };
}
const girdiler = (n: number): Girdi[] => Array.from({ length: n }, (_, i) => ({ sol: Math.sin(i / 17), sag: Math.cos(i / 23) }));

describe("fizik: determinizm", () => {
  it("aynı kurulum ve girdiler iki koşuda aynı özet", async () => {
    const kos = async () => { const d = await Dunya.kur(); kur(d); for (const g of girdiler(600)) d.ilerle(g); const o = d.ozet(); d.yokEt(); return o; };
    const a = await kos(), b = await kos();
    expect(a).toMatch(/^[0-9a-f]{8}$/);
    expect(a).toBe(b);
  });
  it("farklı girdi farklı özet", async () => {
    const d1 = await Dunya.kur(); kur(d1); for (const g of girdiler(300)) d1.ilerle(g);
    const d2 = await Dunya.kur(); kur(d2); for (const g of girdiler(300)) d2.ilerle({ ...g, sol: g.sol + 0.5 });
    expect(d1.ozet()).not.toBe(d2.ozet());
    d1.yokEt(); d2.yokEt();
  });
  it("kayıttan tekrar aynı özeti veriyor", async () => {
    const d = await Dunya.kur(); kur(d);
    for (const g of girdiler(480)) d.ilerle(g);
    const tekrar = await tekrarOynat(kur, d.kayit);
    expect(tekrar.ozet()).toBe(d.ozet());
    expect(tekrar.adimNo).toBe(480);
    d.yokEt(); tekrar.yokEt();
  });
  it("gerçek zaman sarmalı: sabit adım sayısı ve yavaş karede sınır", async () => {
    const d = await Dunya.kur();
    expect(d.zamanIlerle(1 / 60)).toBe(4);
    expect(d.zamanIlerle(1)).toBe(8); // en çok 8 adım; birikim atılır
    expect(d.zamanIlerle(1 / 240)).toBe(1);
    d.yokEt();
  });
  it("kütle ayarı: ölçülen kütle ve merkez gövdeye yazılıyor", async () => {
    const d = await Dunya.kur();
    const b = d.hareketli({ x: 0, y: 0.1, z: 0 });
    d.kutu(b, { x: 0.05, y: 0.02, z: 0.05 }, MALZEME.plastik, 0);
    d.kutleAyarla(b, 0.47, { x: 0.01, y: 0.01, z: 0 }, { x: 0.1, y: 0.04, z: 0.1 });
    d.ilerle();
    expect(b.mass()).toBeCloseTo(0.47, 3);
    expect(b.localCom().x).toBeCloseTo(0.01, 4);
    d.yokEt();
  });
});
