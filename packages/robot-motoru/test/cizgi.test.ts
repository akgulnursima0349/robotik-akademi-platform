import { describe, expect, it } from "vitest";
import { CIZGI_GENISLIGI, CIZGI_GOREVLERI, cizgiYildiz, CizgiRobotu, Pist, qtrOkuyucu, siroBeyni, SIRO_VARSAYILAN, SIROLINE, turKos, type CizgiBeyni } from "../src";

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
  it("kareler 10 ms aralıklı, ilerleme 0'dan 1'e artar", () => {
    const r = turKos(oval, pd(2, 0, 200), 30);
    expect(r.kareler[1].t - r.kareler[0].t).toBeCloseTo(0.01);
    expect(r.kareler[0].ilerleme).toBe(0);
    expect(r.kareler.at(-1)!.ilerleme).toBe(1);
  });
  it("yarış pistinde hızlı robotta yalnız P virajda kaçar; PD daha hızlı gider ve 3 yıldız alır", () => {
    const p = new Pist(CIZGI_GOREVLERI[2].pist), g = CIZGI_GOREVLERI[2];
    expect(turKos(p, pd(1.2, 0, 140), 30).durum).toBe("cikti");
    const P = turKos(p, pd(1, 0, 120), 30), PD = turKos(p, pd(1, 8, 160), 30);
    expect(P.durum).toBe("bitti"); expect(PD.durum).toBe("bitti");
    expect(PD.sure).toBeLessThan(P.sure); expect(PD.ortSapma).toBeLessThan(P.ortSapma);
    expect(cizgiYildiz(g, P)).toBe(2); expect(cizgiYildiz(g, PD)).toBe(3);
  });
  it("başlangıç bloğu: robot blok kalkana kadar bekler, süre bloğun kalktığı andan ölçülür", () => {
    const a = turKos(oval, pd(1, 3, 120), 30), b = turKos(oval, pd(1, 3, 120), 30, 7, 0.5);
    expect(b.baslangic).toBe(0.5);
    expect(b.kareler.filter((k) => k.t < 0.5).every((k) => k.x === b.kareler[0].x && k.sol === 0)).toBe(true);
    expect(b.sure).toBeCloseTo(a.sure, 1);
  });
  it("çizgi genişliği yarışma bandı kadar; teker ve iz genişliği sınıftaki robottan", () => { expect(CIZGI_GENISLIGI).toBe(19); expect(SIROLINE.tekerCap).toBe(36); expect(SIROLINE.izGenisligi).toBe(125); });
  it("işaretli uzaklık: çizginin solu artı, sağı eksi", () => {
    // oval başlangıçta doğuya gidiyor: sol = +y
    expect(oval.isaretliUzaklik(300, 30)).toBeCloseTo(30, 0);
    expect(oval.isaretliUzaklik(300, -30)).toBeCloseTo(-30, 0);
  });
  it("sapma her karede ölçülür; ortalama sapma sonuçta", () => {
    const r = turKos(oval, pd(1, 3, 120), 30);
    expect(r.kareler.every((k) => Math.abs(k.sapma) <= 250)).toBe(true);
    expect(r.ortSapma).toBeGreaterThan(0); expect(r.ortSapma).toBeLessThan(15);
  });
});

describe("SiroLine bloğu (kitin mBlock uzantısı)", () => {
  const ovalSiyah = new Pist(CIZGI_GOREVLERI[0].pist, "siyah");
  it("siyah zeminli pistte (sınıf pisti) bant düşük, zemin yüksek okunur; konum yine doğru", () => {
    const r = new CizgiRobotu(ovalSiyah), s = r.sensorler();
    expect(s[3]).toBeLessThan(300); expect(s[0]).toBeGreaterThan(850);
    expect(Math.abs(r.konum(s))).toBeLessThan(20);
  });
  it("QTR okuma 0–7000: orta 3500, çizgi solda küçük, kaybolunca son görülen uç; siyah zeminde ters çevrilir", () => {
    const oku = qtrOkuyucu();
    expect(oku([0, 0, 0, 1000, 1000, 0, 0, 0])).toBe(3500);
    expect(oku([1000, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(oku([0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    oku([0, 0, 0, 0, 0, 0, 1000, 1000]);
    expect(oku([0, 0, 0, 0, 0, 0, 0, 0])).toBe(7000);
    expect(oku([1000, 1000, 1000, 0, 0, 1000, 1000, 1000], "siyah")).toBe(3500);
  });
  it("hesap kitteki gibi: düzeltme = Kp·hata + Kd·(hata - son hata)", () => {
    const b = siroBeyni({ taban: 100, ek: 0, kp: 0.04, kd: 0.03, zemin: "beyaz" });
    const s = [0, 0, 0, 0, 0, 1000, 1000, 0]; // konum 5500 → hata 2000
    expect(b({ sensorler: s, konum: 0, sure: 0 })).toEqual([100 + 80 + 60, 100 - 80 - 60]);
    expect(b({ sensorler: s, konum: 0, sure: 20 })).toEqual([180, 20]); // hata değişmedi: Kd terimi 0
    const c = siroBeyni({ taban: 100, ek: 0, kp: 0.04, kd: 0.7, zemin: "beyaz" });
    expect(c({ sensorler: s, konum: 0, sure: 0 })).toEqual([255, -255]); // motor sınırı
  });
  it("ek hız yalnızca çizgi ortadayken eklenir", () => {
    const b = siroBeyni({ taban: 100, ek: 50, kp: 0, kd: 0, zemin: "beyaz" });
    expect(b({ sensorler: [0, 0, 0, 1000, 1000, 0, 0, 0], konum: 0, sure: 0 })).toEqual([150, 150]);
    expect(b({ sensorler: [1000, 0, 0, 0, 0, 0, 0, 0], konum: 0, sure: 0 })).toEqual([100, 100]);
  });
  it("kitin örnek değerleri (taban 100, Kp 0.04, Kd 0.7, Zemin: Siyah) sınıf pistinde üç parkuru da bitirir", () => {
    for (const g of CIZGI_GOREVLERI) expect(turKos(new Pist(g.pist, "siyah"), siroBeyni(SIRO_VARSAYILAN), g.sureSiniri).durum, g.kimlik).toBe("bitti");
  });
  it("siyah zeminli pistte 'Zemin: Beyaz' seçilirse robot bandı kaybeder", () => {
    expect(turKos(ovalSiyah, siroBeyni({ ...SIRO_VARSAYILAN, zemin: "beyaz" }), 30).durum).toBe("cikti");
  });
  it("yüksek hızda düşük Kp virajda pistten çıkarır; aşırı Kd robotu titretip yavaşlatır", () => {
    expect(turKos(ovalSiyah, siroBeyni({ ...SIRO_VARSAYILAN, taban: 220, kp: 0.01, kd: 0 }), 40).durum).toBe("cikti");
    expect(turKos(ovalSiyah, siroBeyni({ ...SIRO_VARSAYILAN, kd: 10 }), 40).durum).toBe("sure");
  });
});
