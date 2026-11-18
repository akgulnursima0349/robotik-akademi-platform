import { describe, expect, it } from "vitest";
import { GOREVLER } from "@sra/robot-motoru";
import { BOLUMLER } from "../src/bolumler";
import { blokSay, bul, calistir, pythona, yeniBlok, yildizHesapla, type Blok } from "../src/model";

/** "4(3(i)r)" → blok programı */
function coz(s: string): Blok[] {
  let i = 0;
  const liste = (): Blok[] => {
    const r: Blok[] = [];
    while (i < s.length && s[i] !== ")") {
      const c = s[i];
      if (/\d/.test(c)) { i += 2; const b = yeniBlok("tekrar") as Extract<Blok, { tur: "tekrar" }>; b.sayi = Number(c); b.ic = liste(); i++; r.push(b); }
      else { r.push(yeniBlok(c === "i" ? "ileri" : c === "l" ? "sol" : "sag")); i++; }
    }
    return r;
  };
  return liste();
}

describe("blok modeli", () => {
  it("blok sayısı iç içe tekrarı sayar", () => {
    expect(blokSay(coz("4(3(i)r)"))).toBe(4);
    expect(blokSay(coz("iiri"))).toBe(4);
  });
  it("Python çevirisi", () => {
    expect(pythona(coz("i2(ir)"))).toBe("ileri()\nfor i in range(2):\n    ileri()\n    saga_don()\n");
    expect(pythona(coz("2(l3(i))"))).toBe("for i in range(2):\n    sola_don()\n    for i in range(3):\n        ileri()\n");
  });
  it("boş tekrar Python'da pass olur ve çalışınca hiçbir şey yapmaz", () => {
    const p = coz("3()");
    expect(pythona(p)).toBe("for i in range(3):\n    pass\n");
    expect(calistir(p, ["####", "#R.#", "####"], 1).sim.iz.length).toBe(1);
  });
  it("bul: iç içe blok bulunur", () => {
    const p = coz("i2(ir)");
    const ic = (p[1] as Extract<Blok, { tur: "tekrar" }>).ic[1];
    expect(bul(p, ic.id)?.i).toBe(1);
    expect(bul(p, "yok")).toBeNull();
  });
  it("her iz karesinin bloğu bilinir (oynatırken vurgu için)", () => {
    const p = coz("2(i)");
    const r = calistir(p, ["#####", "#R..#", "#####"], 1);
    expect(r.bloklar.length).toBe(r.sim.iz.length);
    expect(r.bloklar.slice(1).every((b) => b === (p[0] as Extract<Blok, { tur: "tekrar" }>).ic[0].id)).toBe(true);
  });
  it("ağaca çarpınca durur", () => {
    const r = calistir(coz("iii"), ["#####", "#R.##", "#####"], 1);
    expect(r.durdu).toBe("carpma");
  });
  it("yıldızlar", () => {
    expect(yildizHesapla(true, 4, 4)).toBe(3);
    expect(yildizHesapla(true, 6, 4)).toBe(2);
    expect(yildizHesapla(true, 7, 4)).toBe(1);
    expect(yildizHesapla(false, 2, 4)).toBe(0);
  });
});

describe("bölümler", () => {
  it("12 bölüm, kimlikler benzersiz", () => {
    expect(BOLUMLER.length).toBe(12);
    expect(new Set(BOLUMLER.map((b) => b.kimlik)).size).toBe(12);
  });
  for (const b of BOLUMLER) {
    it(`${b.kimlik} ${b.ad}: en kısa çözüm bütün havuçları toplar ve 3 yıldız alır`, () => {
      const p = coz(b.cozum);
      const r = calistir(p, b.harita, b.yon);
      expect(r.durdu).toBeNull();
      expect(r.sim.izgara.kalanKar()).toBe(0);
      expect(blokSay(p)).toBe(b.enAz);
      expect(yildizHesapla(true, blokSay(p), b.enAz)).toBe(3);
      if (!b.palet.includes("tekrar")) expect(b.cozum).not.toMatch(/\(/);
    });
  }
  it("yönergeler kısa (sesli okunacak)", () => {
    for (const b of BOLUMLER) expect(b.yonerge.split(/[.!?]/).filter((x) => x.trim()).length).toBeLessThanOrEqual(2);
  });
  it("Lab ile aynı motor", () => { expect(GOREVLER.length).toBeGreaterThan(0); });
});
