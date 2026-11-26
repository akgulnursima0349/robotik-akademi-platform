import { describe, expect, it } from "vitest";
import {
  bosTasarim, CIZGI_ESIKLERI, cizgiYildizi, DEGERLENDIRME_SINIRI, GOREVLER, GOZ_DURUMLARI, GOZ_ORNEK_TABLO, gozDurumu, hareketAdi, haritaCoz, haritaKodla,
  KART_GOREVLERI, kartCalistir, kartDegerlendir, kartSay, kartVar, MBOT, MBOT_PISTI, mbotKos, sensorOku, SENSOR_DUNYASI, tasarimYildizi, tekerIzi, tekerYolu,
  type Kart
} from "../src";

const I: Kart = { tur: "ileri" };
describe("kart programı", () => {
  it("her kart görevinin örnek çözümü üç yıldız", () => {
    for (const g of Object.values(KART_GOREVLERI)) {
      const r = kartDegerlendir(g, g.cozum);
      expect([g.kimlik, r.yildiz, r.sebep]).toEqual([g.kimlik, 3, undefined]);
      expect(r.kart).toBe(kartSay(g.cozum));
      for (const k of g.cozum) expect(g.kartlar).toContain(k.tur);
    }
  });
  it("sensörlü görevlerde düz sıra iki haritada birden çalışmaz", () => {
    const g = KART_GOREVLERI["mb-eger"];
    const sira: Kart[] = [I, I, I, I, { tur: "sag" }, I, I];
    expect(kartDegerlendir({ ...g, haritalar: [g.haritalar[0]] }, sira).basarili).toBe(true);
    expect(kartDegerlendir(g, sira).basarili).toBe(false);
  });
  it("hatalar: çarpma, batarya, kar kaldı, sonsuz döngü", () => {
    expect(kartDegerlendir(KART_GOREVLERI["mb-duz-sokak"], Array(7).fill(I)).sebep).toBe("carpma");
    expect(kartDegerlendir(KART_GOREVLERI["mb-sarj"], [{ tur: "tekrarla", kez: 9, ic: [I] }]).sebep).toBe("batarya");
    expect(kartDegerlendir(KART_GOREVLERI["mb-duz-sokak"], [I, I]).sebep).toBe("kar_kaldi");
    const sonsuz = kartCalistir(KART_GOREVLERI["mb-duz-sokak"].haritalar[0], 1, 30, [{ tur: "surece", kosul: "onu-kapali", ic: [] }, { tur: "surece", kosul: "onu-acik", ic: [] }]);
    expect(sonsuz.durdu).toBe("sonsuz");
    expect(DEGERLENDIRME_SINIRI).toBeGreaterThan(100);
  });
  it("akış: eğer kartının hangi kolu çalıştığı kaydedilir", () => {
    const g = KART_GOREVLERI["mb-eger"];
    const k = kartCalistir(g.haritalar[0], g.yon, g.batarya, g.cozum);
    const egerler = k.akis.filter((a) => a.kart.tur === "eger");
    expect(egerler.map((a) => a.kosul)).toEqual([false, false, false, false, true, false, false]);
  });
  it("kart sayma ve arama iç içe kartları görür", () => {
    const p: Kart[] = [{ tur: "tekrarla", kez: 2, ic: [{ tur: "eger", kosul: "kar-var", ic: [I], degilse: [{ tur: "sag" }] }] }];
    expect(kartSay(p)).toBe(4);
    expect(kartVar(p, "sag")).toBe(true);
    expect(kartVar(p, "surece")).toBe(false);
  });
  it("Lab'daki Kar Küreme görevleri değişmedi (enerji kuralları aynı)", () => {
    expect(GOREVLER.map((g) => g.kimlik)).toEqual(["ilk-sokak", "kose", "uzun-cadde", "okul-yolu", "sokak-sonu", "sarj-molasi"]);
  });
});

describe("harita tasarımcısı", () => {
  it("kod aynı haritayı geri verir", () => {
    const h = bosTasarim();
    h[2] = "#..S....#"; h[3] = "#.#####.#"; h[5] = "#.....R.#".replace("R", " ");
    h[1] = "#R......#";
    expect(haritaCoz(haritaKodla(h))).toEqual(h);
    expect(haritaCoz(haritaKodla(bosTasarim()))).toEqual(bosTasarim());
  });
  it("bozuk kod reddedilir", () => {
    for (const k of ["", "abc", "2-11-aaaaaaaaaaaaaaaaaa", "1-91-aaaaaaaaaaaaaaaaaa", "1-11-aaa", "1-11-zzzzzzzzzzzzzzzzzz"]) expect(haritaCoz(k)).toBeNull();
  });
  it("tasarım görevi örneği", () => {
    const h = bosTasarim(); h[1] = "#R......#"; h[2] = "#######.#"; h[3] = "#######.#";
    const p: Kart[] = [{ tur: "surece", kosul: "onu-acik", ic: [I] }, { tur: "sag" }, { tur: "surece", kosul: "onu-acik", ic: [I] }];
    const r = tasarimYildizi(h, p);
    expect([r.kar, r.yildiz]).toEqual([8, 3]);
    expect(tasarimYildizi(h, [I, I, I, I, I, I, { tur: "sag" }, I, I]).yildiz).toBe(2);
    expect(tasarimYildizi(bosTasarim(), []).yildiz).toBe(0);
  });
});

describe("mBot deneyleri", () => {
  it("teker: büyük teker aynı turda daha uzağa gider", () => {
    expect(tekerYolu(MBOT.tekerCapi, 1)).toBeCloseTo(20.1, 1);
    expect(tekerYolu(10, 2)).toBeGreaterThan(tekerYolu(5, 2));
  });
  it("iki teker: eşit hız düz, farklı hız döner, ters hız yerinde döner", () => {
    const duz = tekerIzi(20, 20, 2), son = duz[duz.length - 1];
    expect(son.x).toBeCloseTo(0, 6); expect(son.y).toBeCloseTo(-40, 6);
    const sag = tekerIzi(20, 10, 2); expect(sag[sag.length - 1].x).toBeGreaterThan(0);
    const yer = tekerIzi(10, -10, 2); expect(Math.hypot(yer[yer.length - 1].x, yer[yer.length - 1].y)).toBeLessThan(1e-6);
    expect(hareketAdi(20, 10)).toMatch(/sağa/); expect(hareketAdi(10, 20)).toMatch(/sola/); expect(hareketAdi(10, -10)).toMatch(/yerinde/);
  });
  it("sensörler: bant, lamba, duvar", () => {
    const D = SENSOR_DUNYASI;
    expect(sensorOku(D.bant.x1 - MBOT.gozOnde + 1, 50).solGoz).toBe(true);
    expect(sensorOku(10, 50).solGoz).toBe(false);
    expect(sensorOku(D.lamba.x, D.lamba.y).isik).toBeGreaterThan(sensorOku(10, 60).isik);
    expect(sensorOku(90, 50).mesafe).toBeLessThan(sensorOku(40, 50).mesafe!);
  });
});

describe("mBot çizgi görevi", () => {
  it("örnek tablo pisti bitirir, üç yıldız", () => {
    const k = mbotKos(GOZ_ORNEK_TABLO);
    expect(k.bitti).toBe(true);
    expect(cizgiYildizi(k)).toBe(3);
    expect(CIZGI_ESIKLERI[0]).toBeGreaterThan(CIZGI_ESIKLERI[1]);
  });
  it("yanlış tablo: ters dönen robot çizgiden çıkar; hep duran robot durdu", () => {
    const ters = mbotKos({ ...GOZ_ORNEK_TABLO, "sol-beyaz": "sola", "sag-beyaz": "saga" });
    expect(ters.bitti).toBe(false);
    expect(cizgiYildizi(ters)).toBe(0);
    const dur = mbotKos({ "ikisi-siyah": "dur", "sol-beyaz": "dur", "sag-beyaz": "dur", "ikisi-beyaz": "dur" });
    expect(dur.sebep).toBe("durdu");
  });
  it("göz durumları ve pist", () => {
    expect(GOZ_DURUMLARI.map((d) => d)).toEqual([gozDurumu(true, true), gozDurumu(false, true), gozDurumu(true, false), gozDurumu(false, false)]);
    expect(MBOT_PISTI.uzunluk).toBeGreaterThan(250);
    expect(mbotKos(GOZ_ORNEK_TABLO).iz).toEqual(mbotKos(GOZ_ORNEK_TABLO).iz);
  });
});
