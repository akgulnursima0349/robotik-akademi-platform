import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { CIZIMLER, DERSLER, dersiDogrula, gorunenKatmanlar, SAHNE_ANLARI, type DersTanimi } from "../src";
import { PARCALAR as SIROLINE_PARCALARI } from "../../sahne/src/siroline";
import { SIROLINE_SENSOR } from "../src/dersler/siroline-sensor";

const kopya = (d: DersTanimi): DersTanimi => JSON.parse(JSON.stringify(d));

describe("görsel kataloğu", () => {
  it("derslerin başvurduğu her görsel katalogda var", () => {
    for (const d of DERSLER) for (const a of d.anlat) if (a.gorsel) {
      const k = a.gorsel.tur === "sahne" ? SAHNE_ANLARI : CIZIMLER;
      expect(k[a.gorsel.ad], `${d.kimlik}: ${a.gorsel.ad}`).toBeDefined();
    }
  });
  it("doğrulayıcı bilinmeyen görseli hata sayar", () => {
    const d = kopya(SIROLINE_SENSOR);
    d.anlat[0].gorsel = { tur: "cizim", ad: "olmayan-cizim" };
    expect(dersiDogrula(d).join("\n")).toMatch(/görsel katalogda yok \(cizim\/olmayan-cizim\)/);
  });
  it("sahne anlarının vurguladığı parça modelde var", () => {
    for (const [ad, an] of Object.entries(SAHNE_ANLARI)) {
      expect(an.aciklama.length, ad).toBeGreaterThan(20);
      if (an.vurgu && an.robot === "SiroLine") expect([...SIROLINE_PARCALARI] as string[], ad).toContain(an.vurgu.parca);
    }
  });
  it("her sahne anının WebGL'siz tarayıcı için hazır resmi var (scripts/sahne-resimleri.mjs)", () => {
    for (const ad of Object.keys(SAHNE_ANLARI)) expect(existsSync(resolve(import.meta.dirname, `../../../apps/portal/public/gorseller/${ad}.webp`)), ad).toBe(true);
  });
  it("çizimler alanın içinde, her birinin açıklaması var", () => {
    for (const [ad, c] of Object.entries(CIZIMLER)) {
      expect(c.aciklama.length, ad).toBeGreaterThan(20);
      for (const { sekil: s } of c.katmanlar) {
        const noktalar: [number, number][] = s.tur === "kutu" ? [[s.x, s.y], [s.x + s.g, s.y + s.y2]] : s.tur === "daire" ? [[s.x - s.r, s.y - s.r], [s.x + s.r, s.y + s.r]]
          : s.tur === "isin" ? [s.bas, s.son] : s.tur === "etiket" ? [[s.x, s.y]] : s.noktalar;
        for (const [x, y] of noktalar) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(400); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(260); }
      }
    }
  });
});

describe("çizim zamanlaması", () => {
  const c = CIZIMLER["sensor-isik-yolu"];
  it("kelimeye göre: okunan kelimeye kadar bağlı katmanlar görünür, sayı hiç azalmaz", () => {
    expect(gorunenKatmanlar(c, { kelime: 0 })).toEqual([0]);
    let once = 0;
    for (let k = 0; k <= 30; k++) { const n = gorunenKatmanlar(c, { kelime: k }).length; expect(n).toBeGreaterThanOrEqual(once); once = n; }
    expect(once).toBe(c.katmanlar.length);
  });
  it("ses yokken saniyede bir grup belirir, sonunda hepsi", () => {
    expect(gorunenKatmanlar(c, { saniye: 0 })).toEqual([0]);
    expect(gorunenKatmanlar(c, { saniye: 1 })).toEqual([0, 1]);
    expect(gorunenKatmanlar(c, { saniye: 99 }).length).toBe(c.katmanlar.length);
    /* aynı kelimeye bağlı katmanlar birlikte gelir */
    const b = CIZIMLER["beyaz-siyah-yansima"];
    expect(gorunenKatmanlar(b, { saniye: 0 }).length).toBe(2);
  });
  it("hareketi azalt açıkken ya da okuma bitince hepsi hemen görünür", () => {
    expect(gorunenKatmanlar(c, { saniye: 0, azHareket: true }).length).toBe(c.katmanlar.length);
    expect(gorunenKatmanlar(c, { kelime: 0, bitti: true }).length).toBe(c.katmanlar.length);
  });
});
