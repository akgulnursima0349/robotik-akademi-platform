import { describe, expect, it } from "vitest";
import { Dunya, MALZEME } from "../src/fizik";
import { KenshinFizik, KIZAK_YARICAP } from "../src/robotlar/kenshin";
import { KENSHIN_FIZIK as P } from "../src/robotlar/kenshin-parametreleri";

const G = 9.81;
async function sahne() {
  const d = await Dunya.kur();
  const zemin = d.sabit();
  const z = d.kutu(zemin, { x: 3, y: 0.01, z: 3 }, MALZEME.ring, undefined, { x: 0, y: -0.01, z: 0 });
  return { d, zemin: z };
}
const bekle = (d: Dunya, sn: number) => { for (let i = 0; i < Math.round(sn / d.adim); i++) d.ilerle(); };
/** 470 g, 10 × 10 × 4 cm kutu; 3 mm'lik ayaklar üzerinde. Robota bakan ayaklar 30 mm içeride: ön kenar, rakip robot tabanı gibi
    yerden 3 mm yukarıda ve boşta kalır (ayak köşede olsaydı bıçak ayağın dik yüzüne dayanırdı). */
function kutuKur(d: Dunya, x: number) {
  const k = d.hareketli({ x, y: 0.003, z: 0 });
  d.kutu(k, { x: 0.05, y: 0.02, z: 0.05 }, MALZEME.plastik, 0, { x: 0, y: 0.02, z: 0 });
  for (const [ax, az] of [[0.045, -0.045], [0.045, 0.045], [-0.015, -0.045], [-0.015, 0.045]]) d.kutu(k, { x: 0.004, y: 0.0015, z: 0.004 }, MALZEME.plastik, 0, { x: ax, y: -0.0015, z: az });
  d.kutleAyarla(k, 0.47, { x: 0, y: 0.02, z: 0 }, { x: 0.1, y: 0.04, z: 0.1 });
  return k;
}

describe("Kenshin fizik modeli", () => {
  it("dururken: ağırlık iki tekere eşit ve bıçak ucuna kütle merkezine göre dağılıyor", async () => {
    const { d } = await sahne();
    const k = new KenshinFizik(d, { x: 0, z: 0 });
    bekle(d, 1);
    let sol = 0, sag = 0, bicak = 0;
    for (let i = 0; i < 240; i++) { d.ilerle(); const [a, b] = k.tekerYuku(); sol += a; sag += b; bicak += d.normalKuvvet(k.bicak) + d.normalKuvvet(k.kizak); }
    sol /= 240; sag /= 240; bicak /= 240;
    expect(sol + sag + bicak).toBeCloseTo(P.kutle * G, 1);
    expect(Math.abs(sol - sag) / (sol + sag)).toBeLessThan(0.05);
    /* moment dengesi: bıçağın taşıdığı = gövde ağırlığı × (kütle merkezi − teker ekseni) / (bıçak ucu − teker ekseni) */
    const govdeAgirlik = (P.kutle - 2 * P.tekerKutlesi) * G;
    const beklenen = govdeAgirlik * (P.kutleMerkezi.x - P.tekerX) / (P.bicak.ucX - KIZAK_YARICAP - P.tekerX);
    expect(Math.abs(bicak - beklenen) / beklenen).toBeLessThan(0.05);
  });

  it("tam güçte düz gidiş: hız motor doğrusunun sürtünmeyle dengelendiği değerde (±%10), yoldan sapmıyor", async () => {
    const { d } = await sahne();
    const k = new KenshinFizik(d, { x: 0, z: 0 });
    bekle(d, 0.5);
    k.surus(1, 1);
    bekle(d, 1.5);
    const bicakYuku = d.normalKuvvet(k.bicak) + d.normalKuvvet(k.kizak);
    const surukleme = bicakYuku * Math.min(P.malzeme.bicak.surtunme, MALZEME.ring.surtunme);
    const durmaKuvveti = (2 * P.motor.durmaTorku) / P.tekerYaricap;
    const beklenen = P.motor.bosDevir * P.tekerYaricap * (1 - surukleme / durmaKuvveti);
    expect(Math.abs(k.hiz - beklenen) / beklenen).toBeLessThan(0.1);
    expect(k.hiz).toBeLessThan(P.motor.bosDevir * P.tekerYaricap);
    expect(Math.abs(k.konum.z)).toBeLessThan(0.02);
  });

  it("yerinde dönüş iki yöne simetrik (±%2)", async () => {
    const don = async (yon: number) => {
      const { d } = await sahne();
      const k = new KenshinFizik(d, { x: 0, z: 0 });
      bekle(d, 0.5);
      k.surus(yon, -yon); bekle(d, 2);
      return k.donusHizi;
    };
    const a = await don(1), b = await don(-1);
    expect(a).toBeLessThan(0); // sol ileri, sağ geri: yukarıdan bakınca saat yönü
    expect(b).toBeGreaterThan(0);
    expect(Math.abs(Math.abs(a) - Math.abs(b)) / Math.abs(a)).toBeLessThan(0.02);
  });

  it("PWM ölü bölgenin altında teker dönmüyor", async () => {
    const { d } = await sahne();
    const k = new KenshinFizik(d, { x: 0, z: 0 });
    bekle(d, 0.5);
    k.surus(P.motor.oluBolge * 0.5, P.motor.oluBolge * 0.5); bekle(d, 1);
    expect(Math.abs(k.hiz)).toBeLessThan(0.01);
  });

  /* Bıçak 49° eğimli ve kutu duvara dayalı: tam devirmek için gereken itme, 470 g'lık robotun tekerlerinin tutuşunu
     aşar (bıçak kutuyu kaldırdıkça tepki kuvveti bıçağı bastırıp tekerleri boşaltır). Gerçekte de böyledir; burada
     beklenen, ucun kenarın altına girmesi ve kenarı belirgin biçimde kaldırmasıdır. */
  it("bıçak, duvara dayalı kutunun altına girip ön kenarını kaldırıyor", async () => {
    const { d } = await sahne();
    const k = new KenshinFizik(d, { x: 0, z: 0 });
    const kutu = kutuKur(d, 0.16);
    const duvar = d.sabit({ x: 0.22, y: 0.05, z: 0 });
    d.kutu(duvar, { x: 0.005, y: 0.05, z: 0.2 }, MALZEME.plastik);
    bekle(d, 0.5);
    const y0 = kutu.translation().y;
    k.surus(1, 1);
    let enEgim = 0;
    for (let i = 0; i < 480; i++) { d.ilerle(); const r = kutu.rotation(); enEgim = Math.max(enEgim, (2 * Math.asin(Math.min(1, Math.hypot(r.x, r.z))) * 180) / Math.PI); }
    expect(enEgim).toBeGreaterThan(1.5);
    expect(kutu.translation().y).toBeGreaterThan(y0 + 0.0015);
  });

  it("arkasından gelen rakip kaldırılınca tekerlerinin zemine bastığı kuvvet düşüyor", async () => {
    const { d } = await sahne();
    const a = new KenshinFizik(d, { x: 0, z: 0 });
    const b = new KenshinFizik(d, { x: 0.16, z: 0 }, 0); // aynı yöne bakıyor: a, b'nin arkasından gelir
    bekle(d, 1);
    const once = b.tekerYuku().reduce((x, y) => x + y);
    a.surus(1, 1);
    let enAz = Infinity;
    for (let i = 0; i < 480; i++) { d.ilerle(); const y = b.tekerYuku(); enAz = Math.min(enAz, y[0] + y[1]); }
    expect(enAz).toBeLessThan(once * 0.5);
  });

  it("aynı girdiler aynı özet (determinizm)", async () => {
    const kos = async () => {
      const { d } = await sahne();
      const a = new KenshinFizik(d, { x: -0.15, z: 0 }), b = new KenshinFizik(d, { x: 0.15, z: 0.01 }, Math.PI);
      for (let i = 0; i < 720; i++) { a.surus(1, 0.8 + 0.2 * Math.sin(i / 50)); b.surus(0.9, 1); d.ilerle(); }
      return d.ozet();
    };
    expect(await kos()).toBe(await kos());
  });
});
