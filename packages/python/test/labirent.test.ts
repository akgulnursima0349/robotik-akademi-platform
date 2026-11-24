import "./kurulum";
import { describe, expect, it } from "vitest";
import { LABIRENT_GOREVLERI } from "@sra/robot-motoru";
import { labirentCalistir } from "../src";

const g = (k: string) => LABIRENT_GOREVLERI.find((x) => x.kimlik === k)!;
const SAG = g("lb-sag-el").cozum;
const SOL = g("lb-hangi-el").cozum;

describe("RizBot labirent (Python)", () => {
  for (const gorev of LABIRENT_GOREVLERI) {
    it(`${gorev.sira}. ${gorev.ad}: örnek çözüm 3 yıldız`, () => {
      const r = labirentCalistir(gorev, gorev.cozum);
      expect(r.hata).toBeNull();
      expect(r.sonuc.yildizlar).toEqual({ bitti: true, hizli: true, kisa: true });
    });
  }
  it("Hangi el: sağ el bitirir ama yıldız süresini geçer", () => {
    const r = labirentCalistir(g("lb-hangi-el"), SAG);
    expect(r.sonuc.basarili).toBe(true);
    expect(r.sonuc.yildizlar.hizli).toBe(false);
  });
  it("Ada: sağ el ve sol el kuralı bitiremez (süre dolar)", () => {
    for (const kod of [SAG, SOL]) {
      const r = labirentCalistir(g("lb-ada"), kod);
      expect(r.sonuc.basarili).toBe(false);
      expect(r.sonuc.sebep).toBe("sure");
      expect(r.hata?.tur).toBe("Robot");
    }
  });
  it("MEB: sol el 90 sn'ye sığmaz, puan ulaşılan satırdan", () => {
    const r = labirentCalistir(g("lb-meb"), SOL);
    expect(r.sonuc.sebep).toBe("sure");
    expect(r.sonuc.puan).toBe(200 + (16 - r.sonuc.enUzakSatir) * 10);
  });
  it("Duvara bak: tek labirente göre yazılmış kod ikincide başarısız", () => {
    const r = labirentCalistir(g("lb-duvara-bak"), "saga_don()\nileri()\nileri()\nileri()\nsola_don()\nileri()\n");
    expect(r.sonuc.basarili).toBe(false);
  });
  it("duvara çarpınca satır numarası", () => {
    const r = labirentCalistir(g("lb-ilk-koridor"), "saga_don()\nileri()\nileri()\nileri()\n");
    expect(r.hata?.tur).toBe("Robot");
    expect(r.hata?.satir).toBe(4);
    expect(r.sonuc.sebep).toBe("carpma");
  });
  it("bitişten sonra komut yazmak hata değil", () => {
    const r = labirentCalistir(g("lb-ilk-koridor"), g("lb-ilk-koridor").cozum + "ileri()\nprint('bitti')\n");
    expect(r.hata).toBeNull();
    expect(r.sonuc.basarili).toBe(true);
  });
  it("yanlış yön adı sade Türkçe hata", () => {
    const r = labirentCalistir(g("lb-ada"), 'print(duvar("sağ"))\n');
    expect(r.hata?.mesaj).toMatch(/"sag"/);
    const r2 = labirentCalistir(g("lb-ada"), 'print(duvar("arka"))\n');
    expect(r2.hata?.mesaj).toMatch(/"sol"/);
  });
  it("konum ve komsu tuple döner, sözlük anahtarı olur", () => {
    const r = labirentCalistir(g("lb-ada"), 'd = {}\nd[konum()] = 1\nprint(konum(), komsu("on"), komsu("geri"), d)\n');
    expect(r.hata).toBeNull();
    expect(r.cikti[0]).toBe("(0, 4) (0, 3) (0, 5) {(0, 4): 1}");
  });
  it("sensör sonsuz döngüsü: bitmeyen döngü hatası", () => {
    const r = labirentCalistir(g("lb-ilk-koridor"), "while not bitti():\n    duvar_on()\n");
    expect(r.hata?.mesaj).toMatch(/döngü/);
    expect(r.sonuc.sebep).toBe("hata");
  });
});
