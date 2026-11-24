import { describe, expect, it } from "vitest";
import { haritaOku, haritaYaz, kosuSuresi, Labirent, LabirentDurdu, labirentUret, LABIRENT_GOREVLERI, RIZBOT } from "../src";

const KORIDOR = [
  "+---+---+---+",
  "|   |     F |",
  "+   +   +---+",
  "|       |   |",
  "+---+   +   +",
  "| B         |",
  "+---+---+---+"
];
const dene = (f: () => void) => { try { f(); } catch (e) { if (!(e instanceof LabirentDurdu)) throw e; } };

describe("labirent haritası", () => {
  it("metin harita okunur ve aynen geri yazılır", () => {
    const h = haritaOku(KORIDOR);
    expect([h.genislik, h.yukseklik]).toEqual([3, 3]);
    expect(h.baslangic).toEqual({ x: 0, y: 2 });
    expect(h.bitis).toEqual({ x: 2, y: 0 });
    expect(haritaYaz(h)).toEqual(KORIDOR);
  });
  it("duvarlar iki taraftan tutarlı", () => {
    for (const g of LABIRENT_GOREVLERI) for (const m of g.haritalar) {
      const h = haritaOku(m);
      for (let y = 0; y < h.yukseklik; y++) for (let x = 0; x < h.genislik; x++) {
        const d = h.duvar[y * h.genislik + x];
        if (x + 1 < h.genislik) expect(!!(d & 2), `${g.kimlik} ${x},${y} doğu`).toBe(!!(h.duvar[y * h.genislik + x + 1] & 8));
        if (y + 1 < h.yukseklik) expect(!!(d & 4), `${g.kimlik} ${x},${y} güney`).toBe(!!(h.duvar[(y + 1) * h.genislik + x] & 1));
        if (x === 0) expect(d & 8).toBeTruthy();
        if (y === 0) expect(d & 1).toBeTruthy();
      }
    }
  });
  it("üretilen labirent hep aynı ve her hücreye ulaşılır", () => {
    const a = labirentUret(8, 16, 1);
    expect(labirentUret(8, 16, 1)).toEqual(a);
    expect(labirentUret(8, 16, 2)).not.toEqual(a);
    const h = haritaOku(a), gor = new Set<string>(["0,15"]), kuyruk = [[0, 15]];
    while (kuyruk.length) {
      const [x, y] = kuyruk.pop()!;
      [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]].forEach(([dx, dy, b]) => {
        if (!(h.duvar[y * 8 + x] & b) && !gor.has(`${x + dx},${y + dy}`)) { gor.add(`${x + dx},${y + dy}`); kuyruk.push([x + dx, y + dy]); }
      });
    }
    expect(gor.size).toBe(8 * 16);
  });
});

describe("RizBot simülasyonu", () => {
  it("sensörler robotun yönüne göre okur", () => {
    const s = new Labirent(KORIDOR);
    expect([s.duvar("on"), s.duvar("sol"), s.duvar("sag")]).toEqual([true, true, false]);
    s.sagaDon();
    expect([s.duvar("on"), s.duvar("sol"), s.duvar("sag")]).toEqual([false, true, true]);
    expect(s.iz.filter((k) => k.olay === "bak").length).toBe(6);
  });
  it("duvara ileri: çarpma ve durma", () => {
    const s = new Labirent(KORIDOR);
    expect(() => s.ileri()).toThrow(LabirentDurdu);
    expect(s.durdu).toBe("carpma");
    expect(s.iz.at(-1)!.olay).toBe("carpma");
    expect(() => s.solaDon()).toThrow(LabirentDurdu);
  });
  it("bitişe varınca program durur ve süre yazılır", () => {
    const s = new Labirent(KORIDOR);
    dene(() => { s.sagaDon(); s.ileri(); s.solaDon(); s.ileri(); s.ileri(); s.sagaDon(); s.ileri(); s.ileri(); });
    expect(s.bittiMi()).toBe(true);
    expect(s.durdu).toBeNull();
    const beklenen = 3 * RIZBOT.donus90 + kosuSuresi(1) * 2 + kosuSuresi(2);
    expect(s.bitisZamani).toBeCloseTo(beklenen, 6);
    expect(s.iz.at(-1)!.olay).toBe("bitis");
  });
  it("art arda ileri tek koşu: hücre başına durmaktan hızlı", () => {
    expect(kosuSuresi(4)).toBeLessThan(4 * kosuSuresi(1));
    expect(kosuSuresi(2)).toBeCloseTo(0.8, 6);
    expect(kosuSuresi(1)).toBeCloseTo(2 * Math.sqrt(0.2 / 2.5), 6);
  });
  it("oynatma zamanları artan ve toplam süreyle aynı", () => {
    const s = new Labirent(labirentUret(8, 16, 1));
    dene(() => { for (;;) { if (!s.duvar("sag")) { s.sagaDon(); s.ileri(); } else if (!s.duvar("on")) s.ileri(); else s.solaDon(); } });
    const z = s.zamanla();
    expect(z.length).toBe(s.iz.length);
    for (let i = 1; i < z.length; i++) { expect(z[i].bas).toBeCloseTo(z[i - 1].son, 9); expect(z[i].son).toBeGreaterThanOrEqual(z[i].bas); }
    expect(z.at(-1)!.son).toBeCloseTo(s.bitisZamani!, 6);
  });
  it("süre sınırı: dönüp duran robot durdurulur", () => {
    const s = new Labirent(KORIDOR, 0, 10);
    dene(() => { for (;;) s.sagaDon(); });
    expect(s.durdu).toBe("sure");
    expect(s.sure).toBeGreaterThan(10);
  });
  it("adım sınırı ve en uzak satır", () => {
    const s = new Labirent(KORIDOR, 0, 1e9);
    dene(() => { s.sagaDon(); s.ileri(); s.solaDon(); s.ileri(); for (;;) { s.geriDon(); s.ileri(); } });
    expect(s.durdu).toBe("cok_adim");
    expect(s.enUzakSatir).toBe(2);
  });
});
