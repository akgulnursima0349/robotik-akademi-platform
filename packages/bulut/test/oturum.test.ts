import { describe, expect, it } from "vitest";
import { BulutHatasi, hataMetni, KURSLAR, modBul, Ogrenci, Ogretmen, Oturum, panelYolu, SahteBaglanti, TamamlanmamisHesap } from "../src";

const yeni = () => { const b = new SahteBaglanti(); return { b, o: new Oturum(b) }; };

describe("öğrenci girişi ve kursa yönlendirme", () => {
  it("Junior sınıfındaki öğrenci junior/ adresine gider", async () => {
    const { o } = yeni();
    const k = await o.ogrenciGiris("jnr123", " Ece ", "1234");
    expect(k).toBeInstanceOf(Ogrenci);
    expect(k.kurs).toBe("junior");
    expect(k.hedef()).toBe("junior/");
  });
  it("ortaokul sınıfı ortaokul/ adresine gider", async () => {
    const { o } = yeni();
    expect((await o.ogrenciGiris("ORT456", "mert", "5678")).hedef()).toBe("ortaokul/");
  });
  it("henüz yayında olmayan kurs 'yakında' ekranına gider", async () => {
    const { o } = yeni();
    expect((await o.ogrenciGiris("BLK789", "Ada", "1111")).hedef()).toBe("#yakinda/ilkokul");
  });
  it("yanlış PIN sade bir mesajla reddedilir", async () => {
    const { o } = yeni();
    await expect(o.ogrenciGiris("JNR123", "Ece", "9999")).rejects.toThrow(BulutHatasi);
    try { await o.ogrenciGiris("JNR123", "Ece", "9999"); } catch (e) { expect(hataMetni(e)).toMatch(/hatalı/); }
  });
  it("8 hatalı denemeden sonra kilitlenir", async () => {
    const { o } = yeni();
    for (let i = 0; i < 8; i++) await o.ogrenciGiris("JNR123", "Ece", "0000").catch(() => {});
    await expect(o.ogrenciGiris("JNR123", "Ece", "1234")).rejects.toMatchObject({ kod: "cok_deneme" });
  });
  it("PIN 4 rakam değilse sunucuya gitmeden reddedilir", async () => {
    const { o } = yeni();
    await expect(o.ogrenciGiris("JNR123", "Ece", "12a4")).rejects.toMatchObject({ kod: "gecersiz_giris" });
  });
  it("açık öğretmen oturumu öğrenci girişini engellemez", async () => {
    const { o } = yeni();
    await o.ogretmenGiris("ogretmen@deneme.com", "deneme123");
    expect((await o.ogrenciGiris("JNR123", "Ece", "1234")).kurs).toBe("junior");
  });
});

describe("öğretmen", () => {
  it("giriş yapınca Panellerim'e gider ve kendi sınıflarını görür", async () => {
    const { o } = yeni();
    const k = await o.ogretmenGiris("ogretmen@deneme.com", "deneme123");
    expect(k).toBeInstanceOf(Ogretmen);
    expect((k as Ogretmen).hedef()).toBe("#panellerim");
    const s = await o.siniflarim();
    expect(s.map((x) => x.kod).sort()).toEqual(["JNR123", "ORT456"]);
  });
  it("müdür bütün sınıfları görür", async () => {
    const { o } = yeni();
    await o.ogretmenGiris("mudur@deneme.com", "deneme123");
    expect((await o.siniflarim()).length).toBe(3);
  });
  it("sınıfın kursunu değiştirebilir; öğrenci yeni kursa gider", async () => {
    const { o } = yeni();
    await o.ogretmenGiris("ogretmen@deneme.com", "deneme123");
    await o.sinifKursuAyarla("s2", "junior");
    await o.cikis();
    expect((await o.ogrenciGiris("ORT456", "Mert", "5678")).kurs).toBe("junior");
  });
  it("yeni hesap kurum kodu girilene kadar tamamlanmamış sayılır", async () => {
    const { o } = yeni();
    await o.ogretmenKaydol("yeni@deneme.com", "gizli123");
    expect(await o.tamamlanmamisHesap()).toBe(true);
    await expect(o.ogretmenTamamla("Yeni Öğretmen", "YANLIS")).rejects.toMatchObject({ kod: "kurum_kodu_hatali" });
    expect(await o.ogretmenTamamla("Yeni Öğretmen", "DENEME-KURUM")).toBeInstanceOf(Ogretmen);
    expect(await o.tamamlanmamisHesap()).toBe(false);
  });
  it("tamamlanmamış hesapla giriş TamamlanmamisHesap döner", async () => {
    const { o } = yeni();
    await o.ogretmenKaydol("yeni2@deneme.com", "gizli123");
    await o.cikis();
    expect(await o.ogretmenGiris("yeni2@deneme.com", "gizli123")).toBeInstanceOf(TamamlanmamisHesap);
  });
  it("öğrencinin anonim oturumu tamamlanmamış öğretmen hesabı sayılmaz", async () => {
    const { o } = yeni();
    await o.ogrenciGiris("JNR123", "Ece", "1234");
    expect(await o.tamamlanmamisHesap()).toBe(false);
  });
});

describe("Lab robotları", () => {
  it("öğrenci robotunu kaydeder ve geri okur", async () => {
    const { o } = yeni();
    await o.ogrenciGiris("JNR123", "Ece", "1234");
    expect(await o.labRobotum()).toBeNull();
    await o.labRobotKaydet(" Kar Avcısı ", "def hamle(robot):\n    return 'ileri'\n");
    expect(await o.labRobotum()).toMatchObject({ ad: "Kar Avcısı" });
  });
  it("çok uzun kod reddedilir", async () => {
    const { o } = yeni();
    await o.ogrenciGiris("JNR123", "Ece", "1234");
    await expect(o.labRobotKaydet("x", "a".repeat(4001))).rejects.toMatchObject({ kod: "veri_gecersiz" });
  });
  it("öğretmen sınıfın robotlarını görür; başka sınıfı göremez", async () => {
    const { b, o } = yeni();
    await o.ogrenciGiris("JNR123", "Ece", "1234");
    await o.labRobotKaydet("Ece'nin robotu", "def hamle(robot):\n    return 'bekle'\n");
    await o.cikis();
    await o.ogretmenGiris("ogretmen@deneme.com", "deneme123");
    const r = await o.labSinifRobotlari("s1");
    expect(r.map((x) => x.sahip).sort()).toEqual(["Deniz", "Ece", "Kuzey"]);
    await expect(o.labSinifRobotlari("s3")).rejects.toMatchObject({ kod: "yetki_yok" });
    void b;
  });
  it("öğrenci sınıf robotlarını göremez", async () => {
    const { o } = yeni();
    await o.ogrenciGiris("JNR123", "Ece", "1234");
    await expect(o.labSinifRobotlari("s1")).rejects.toMatchObject({ kod: "yetki_yok" });
  });
});

describe("oturum kapanınca", () => {
  it("kim() null döner", async () => {
    const { o } = yeni();
    await o.ogrenciGiris("JNR123", "Ece", "1234");
    expect(await o.kim()).toBeInstanceOf(Ogrenci);
    await o.cikis();
    expect(await o.kim()).toBeNull();
  });
});

describe("katalog ve mod", () => {
  it("panel yolları", () => {
    expect(panelYolu("junior", "s1")).toBe("junior/#panel/s1");
    expect(panelYolu("ortaokul")).toBe("ortaokul/");
    expect(panelYolu("ilkokul")).toBeNull();
    expect(KURSLAR.ilkokul.yol).toBeNull();
  });
  it("ayar dosyasından mod", () => {
    expect(modBul(undefined)).toBe("yerel");
    expect(modBul({})).toBe("yerel");
    expect(modBul({ deneme: true })).toBe("deneme");
    expect(modBul({ supabaseUrl: "https://x.supabase.co", supabaseKey: "k" })).toBe("bulut");
  });
  it("bilinmeyen hata teknik ayrıntı göstermez", () => {
    const eski = console.error; console.error = () => {};
    expect(hataMetni(new Error("relation xyz does not exist"))).toMatch(/Beklenmeyen/);
    console.error = eski;
  });
});
