import { describe, expect, it } from "vitest";
import { CIZGI_GENISLIGI, CIZGI_GOREVLERI, cizgiYildiz, CizgiRobotu, Pist, SIROLINE, turKos, type CizgiBeyni } from "../src";

const oval = new Pist(CIZGI_GOREVLERI[0].pist);
const pd = (kp: number, kd: number, hiz: number): CizgiBeyni => { let son = 0; return (o) => { const f = o.konum - son; son = o.konum; const d = o.konum * kp + f * kd; return [hiz + d, hiz - d]; }; };

describe("Çizgi izleyen motoru", () => {
  it("her görevin pisti kapalı ve kendini kesmiyor (çizgi ortası her yerde tek)", () => {
    for (const g of CIZGI_GOREVLERI) {
      const p = new Pist(g.pist), n = p.yol.length;
      const [a, b] = [p.yol[0], p.yol[n - 1]];
      expect(Math.hypot(a[0] - b[0], a[1] - b[1]), g.kimlik).toBeLessThan(3);
      /* yol üzerindeki her noktanın en yakın örneği kendisine yakın olmalı (başka bir parça üst üste binmiyor) */
      for (let i = 0; i < n; i += 25) {
        const [x, y] = p.yol[i];
        for (let j = 0; j < n; j += 3) {
          const ara = Math.min(Math.abs(i - j), n - Math.abs(i - j));
          if (ara > 60) expect(Math.hypot(p.yol[j][0] - x, p.yol[j][1] - y), `${g.kimlik} ${i}-${j}`).toBeGreaterThan(80);
        }
      }
    }
  });
  it("başlangıçta orta sensörler siyahı, kenarlar beyazı görür", () => {
    const s = new CizgiRobotu(oval).sensorler();
    expect(s).toHaveLength(8);
    expect(s[3]).toBeGreaterThan(700); expect(s[4]).toBeGreaterThan(700);
    expect(s[0]).toBeLessThan(150); expect(s[7]).toBeLessThan(150);
    for (const v of s) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1000); }
  });
  it("sensörler soldan sağa: robot sağa kayınca çizgi soldaki sensörlere geçer, konum negatif olur", () => {
    const r = new CizgiRobotu(oval);
    r.y -= 20; // yön doğu; y azalınca robot sağa kayar
    const s = r.sensorler();
    expect(s[1] + s[2]).toBeGreaterThan(s[5] + s[6]);
    expect(r.konum(s)).toBeLessThan(-30);
  });
  it("çizgiyi kaybedince konum son görülen tarafı söyler", () => {
    const r = new CizgiRobotu(oval);
    r.y -= 18; r.konum(r.sensorler());
    r.y -= 200;
    expect(r.konum(r.sensorler())).toBe(-100);
  });
  it("ölü bölge: düşük PWM'de redüktörlü motor dönmez", () => {
    const r = new CizgiRobotu(oval), x = r.x;
    for (let i = 0; i < 100; i++) r.adim(SIROLINE.oluBolge - 1, SIROLINE.oluBolge - 1);
    expect(r.x).toBe(x);
  });
  it("eşit güç düz gider, farklı güç döner; tam güçte hız azami hıza yaklaşır", () => {
    const r = new CizgiRobotu(oval), y = r.y;
    for (let i = 0; i < 400; i++) r.adim(255, 255); // 2 sn
    expect(Math.abs(r.y - y)).toBeLessThan(0.001);
    expect(r.vSol).toBeGreaterThan(SIROLINE.azamiHiz * 0.99);
    const d = new CizgiRobotu(oval);
    for (let i = 0; i < 100; i++) d.adim(-150, 150);
    expect(d.yon).toBeGreaterThan(0.5); // sola döndü
  });
  it("deterministik: aynı beyin, aynı tur", () => {
    const a = turKos(oval, pd(2, 0, 200), 30), b = turKos(oval, pd(2, 0, 200), 30);
    expect(a.sure).toBe(b.sure);
    expect(a.kareler.at(-1)).toEqual(b.kareler.at(-1));
    expect(a.durum).toBe("bitti");
  });
  it("hiç dönmeyen robot çizgiden çıkar", () => {
    const r = turKos(oval, () => [200, 200], 30);
    expect(r.durum).toBe("cikti");
    expect(r.ilerleme).toBeLessThan(0.5);
  });
  it("hareket etmeyen robot süre sınırına takılır", () => {
    const r = turKos(oval, () => [0, 0], 3);
    expect(r.durum).toBe("sure");
  });
  it("beyin hata fırlatırsa tur hatayla biter", () => {
    const r = turKos(oval, () => { throw new Error("3. satır: hata"); }, 10);
    expect(r.durum).toBe("hata"); expect(r.hata).toMatch(/3\. satır/);
  });
  it("kareler 20 ms aralıklı, ilerleme 0'dan 1'e artar", () => {
    const r = turKos(oval, pd(2, 0, 200), 30);
    expect(r.kareler[1].t - r.kareler[0].t).toBeCloseTo(0.02);
    expect(r.kareler[0].ilerleme).toBe(0);
    expect(r.kareler.at(-1)!.ilerleme).toBe(1);
  });
  it("PD, aynı hızda yalnız P'den daha hızlı tur atar (yarış pisti)", () => {
    const p = new Pist(CIZGI_GOREVLERI[2].pist);
    const P = turKos(p, pd(2, 0, 255), 60), PD = turKos(p, pd(2.5, 8, 255), 60);
    expect(P.durum).toBe("bitti"); expect(PD.durum).toBe("bitti");
    expect(PD.sure).toBeLessThan(P.sure);
    const g = CIZGI_GOREVLERI[2];
    expect(cizgiYildiz(g, P)).toBe(2); expect(cizgiYildiz(g, PD)).toBe(3);
  });
  it("çizgi genişliği yarışma bandı kadar", () => { expect(CIZGI_GENISLIGI).toBe(19); });
});
