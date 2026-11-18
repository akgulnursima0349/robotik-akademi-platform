import "./kurulum";
import { describe, expect, it } from "vitest";
import { GOREVLER, macOyna } from "@sra/robot-motoru";
import { calistir, karKuremeCalistir, pythonBeyin, turkceAdBul } from "../src";
import { ORNEK_ROBOTLAR } from "../src/ornek-robotlar";

const g = (k: string) => GOREVLER.find((x) => x.kimlik === k)!;

describe("Python köprüsü", () => {
  it("print çıktısı toplanır", () => {
    const r = calistir('for i in range(3):\n    print("kar", i)\n');
    expect(r.hata).toBeNull();
    expect(r.cikti).toEqual(["kar 0", "kar 1", "kar 2"]);
  });
  it("bitmeyen döngü durdurulur, satır numarası verilir", () => {
    const r = calistir("x = 0\nwhile True:\n    x = x + 1\n", {}, 5000);
    expect(r.hata?.mesaj).toMatch(/bitmeyen bir döngü/);
    expect(r.hata?.satir).toBeGreaterThanOrEqual(2);
  });
  it("eksik iki nokta Türkçe anlatılır", () => {
    const r = calistir("for i in range(3)\n    print(i)\n");
    expect(r.hata?.mesaj).toMatch(/iki nokta/);
    expect(r.hata?.satir).toBe(1);
  });
  it("kapanmamış parantez: hata dosya sonunu değil asıl satırı gösterir", () => {
    const r = calistir("ileri()\nileri(\n\n");
    expect(r.hata?.satir).toBe(2);
    expect(r.hata?.mesaj).toMatch(/Parantez/);
  });
  it("yanlış yazılmış komut için öneri", () => {
    const r = karKuremeCalistir(g("ilk-sokak"), "ilerı()\n");
    expect(r.hata?.mesaj).toMatch(/Türkçe harf/);
    const r2 = karKuremeCalistir(g("ilk-sokak"), "Ileri()\n");
    expect(r2.hata?.mesaj).toMatch(/ileri\(\)/);
  });
  it("Türkçe harfli değişken adı önceden yakalanır", () => {
    expect(turkceAdBul('sayı = 3\nprint("çok güzel")\n')?.satir).toBe(1);
    expect(turkceAdBul('print("çok güzel")\n')).toBeNull();
  });
});

describe("Kar Küreme · Python", () => {
  for (const gorev of GOREVLER) {
    it(`${gorev.sira}. ${gorev.ad}: Python çözümü 3 yıldız`, () => {
      const r = karKuremeCalistir(gorev, gorev.cozum);
      expect(r.hata).toBeNull();
      expect(r.sonuc.yildiz).toBe(3);
    });
  }
  it("binaya çarpma: robot hatası ve satırı", () => {
    const r = karKuremeCalistir(g("kose"), "ileri()\nileri()\nileri()\nileri()\n");
    expect(r.hata?.tur).toBe("Robot");
    expect(r.hata?.satir).toBe(4);
    expect(r.sonuc.sebep).toBe("carpma");
    expect(r.simler[0].iz.at(-1)!.olay).toBe("carpma");
  });
  it("izde her adımın satırı var", () => {
    const r = karKuremeCalistir(g("uzun-cadde"), g("uzun-cadde").cozum);
    expect(r.simler[0].iz.slice(1).every((k) => k.satir === 2)).toBe(true);
  });
  it("başlangıç kodu hatasız çalışır ama görevi bitirmez", () => {
    for (const gorev of GOREVLER) {
      const r = karKuremeCalistir(gorev, gorev.baslangicKodu);
      expect(r.hata).toBeNull();
      expect(r.sonuc.basarili).toBe(false);
    }
  });
  it("print(batarya()) çıktısı görünür", () => {
    const r = karKuremeCalistir(g("sarj-molasi"), "ileri()\nprint(batarya())\n");
    expect(r.cikti).toEqual(["22"]);
  });
});

describe("Lig · Python beyinleri", () => {
  it("hamle fonksiyonu yoksa açık hata", () => {
    expect(pythonBeyin("x = 1\n").hata?.mesaj).toMatch(/def hamle/);
  });
  it("örnek robotların hepsi derlenir ve hatasız oynar", () => {
    const beyinler = ORNEK_ROBOTLAR.map((o) => { const b = pythonBeyin(o.kod); expect(b.hata).toBeNull(); return b.beyin!; });
    for (let i = 1; i < beyinler.length; i++) {
      const m = macOyna(beyinler[0], beyinler[i], i);
      expect(m.hatalar).toEqual([null, null]);
    }
  });
  it("örnek robotlar arasında güç farkı var: Avcı Uyuyan'ı yener", () => {
    const b = (ad: string) => pythonBeyin(ORNEK_ROBOTLAR.find((o) => o.ad === ad)!.kod).beyin!;
    expect(macOyna(b("Avcı"), b("Uykucu"), 4).kazanan).toBe(0);
  });
  it("hamle içinde bitmeyen döngü o turu bekle yapar, hata kaydedilir", () => {
    const b = pythonBeyin("def hamle(robot):\n    while True:\n        pass\n").beyin!;
    const m = macOyna(b, () => "bekle", 1);
    expect(m.hatalar[0]).toMatch(/bitmeyen/);
  });
});
