import "./kurulum";
import { describe, expect, it } from "vitest";
import { CIZGI_GOREVLERI, cizgiYildiz } from "@sra/robot-motoru";
import { cizgiCalistir } from "../src";

describe("SiroLine Python köprüsü", () => {
  for (const g of CIZGI_GOREVLERI) {
    it(`${g.ad}: örnek çözüm 3 yıldız, başlangıç kodu turu bitirir ama 3 yıldız almaz`, () => {
      const o = cizgiCalistir(g, g.ornekCozum);
      expect(o.hata).toBeNull();
      expect(o.sonuc!.durum).toBe("bitti");
      expect(cizgiYildiz(g, o.sonuc!)).toBe(3);
      const b = cizgiCalistir(g, g.baslangicKod);
      expect(b.sonuc!.durum).toBe("bitti");
      expect(cizgiYildiz(g, b.sonuc!)).toBeLessThan(3);
    });
  }
  it("kurulum() bir kez çalışır, modül değişkenleri çağrılar arasında korunur", () => {
    const r = cizgiCalistir(CIZGI_GOREVLERI[0], `sayac = 0
def kurulum():
    print("hazır")
def dongu():
    global sayac
    sayac = sayac + 1
    if sayac == 10:
        print("onuncu", sure())
    motorlar(0, 0)
`);
    expect(r.cikti).toEqual(["hazır", "onuncu 90"]);
    expect(r.sonuc!.durum).toBe("sure");
  });
  it("dongu yoksa Türkçe anlatılır", () => {
    const r = cizgiCalistir(CIZGI_GOREVLERI[0], "motorlar(100, 100)\n");
    expect(r.hata?.mesaj).toMatch(/def dongu/);
  });
  it("dongu içindeki hata satır numarasıyla turu durdurur", () => {
    const r = cizgiCalistir(CIZGI_GOREVLERI[0], "def dongu():\n    s = sensorler()\n    motorlar(s[9], 100)\n");
    expect(r.sonuc!.durum).toBe("hata");
    expect(r.hata?.satir).toBe(3);
  });
  it("motorlar'a sayı olmayan değer verilirse anlaşılır hata", () => {
    const r = cizgiCalistir(CIZGI_GOREVLERI[0], 'def dongu():\n    motorlar("hızlı", 100)\n');
    expect(r.hata?.mesaj).toMatch(/sayı olmalı/);
  });
  it("dongu içinde bitmeyen döngü durdurulur", () => {
    const r = cizgiCalistir(CIZGI_GOREVLERI[0], "def dongu():\n    while True:\n        pass\n");
    expect(r.sonuc!.durum).toBe("hata");
    expect(r.hata?.mesaj).toMatch(/bitmeyen/);
  });
});
