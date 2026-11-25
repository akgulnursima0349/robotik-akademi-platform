import { describe, expect, it } from "vitest";
import { IlerlemeEsitleyici, Oturum, SahteBaglanti } from "@sra/bulut";
import {
  bolumAcik, DERSLER, DersDeposu, ilkBolum, dersDurumu, dersiDogrula, dersKaydiBirlestir, dersKayitlariOku, dersOgesi, dersXp, modulIlerlemesi, seviyeHesapla,
  XP, yinelenenKimlikler, type DersTanimi, type Modul
} from "../src";
import { SIROLINE_SENSOR } from "../src/dersler/siroline-sensor";

const kopya = (d: DersTanimi): DersTanimi => JSON.parse(JSON.stringify(d));
const depo = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe("ders doğrulayıcı", () => {
  it("bütün dersler geçerli ve kimlikler benzersiz", () => {
    expect(DERSLER.flatMap(dersiDogrula)).toEqual([]);
    expect(yinelenenKimlikler(DERSLER)).toEqual([]);
  });
  it("her hata türünü Türkçe ve açıkça yakalar", () => {
    const d = kopya(SIROLINE_SENSOR);
    d.kimlik = "Kötü Kimlik"; d.anlat[0].metin = " "; (d.anlat[1] as any).bit = "uyuyor";
    d.anlat[2].soru!.secenekler.forEach((s) => (s.dogru = true));
    d.gorev = { tur: "lab", modul: "cizgi", gorev: "olmayan", yonerge: "x" };
    d.dene.enAzFarkliDeger = 0; d.sure = 0;
    const h = dersiDogrula(d).join("\n");
    for (const p of ["kimlik yalnız", "anlatım adımı 1: metin boş", "hâli tanınmıyor (uyuyor)", "tek bir doğru seçenek olmalı (3 var)", "Lab'da böyle bir görev yok (cizgi/olmayan)", "en az bir değer", "süre"]) expect(h).toContain(p);
    const bos = kopya(SIROLINE_SENSOR); bos.anlat = [];
    expect(dersiDogrula(bos).join()).toContain("anlatım boş");
    const y = kopya(SIROLINE_SENSOR); y.gorev = { tur: "yerlesik", robot: "SiroLine", yonerge: "x", baslangicKodu: "pass", olcut: "sure < 10", yildizEsikleri: [3, 2, 1] };
    expect(dersiDogrula(y).join()).toContain("küçükten büyüğe");
    expect(yinelenenKimlikler([SIROLINE_SENSOR, SIROLINE_SENSOR])).toEqual(["siroline-sensor"]);
  });
});

describe("ders ilerlemesi", () => {
  it("bozuk kayıtta sıfırdan; garip değerler temizlenir; öğretmen onayı kayıttan okunmaz", () => {
    expect(dersKayitlariOku("{bozuk").dersler).toEqual({});
    expect(dersKayitlariOku(null).dersler).toEqual({});
    const k = dersKayitlariOku(JSON.stringify({ dersler: { "siroline-sensor": { anlat: { adim: "7", bitti: "evet" }, gorev: { yildiz: 9 }, gercek: { ogrenci: true, ogretmen: true } }, "KÖTÜ": {} } }));
    expect(k.dersler).toEqual({ "siroline-sensor": { anlat: { adim: 7, bitti: false }, gorev: { yildiz: 3 }, gercek: { ogrenci: true } } });
  });
  it("birleştirme: her alanın ileri olanı kalır", () => {
    const a = { anlat: { adim: 2, bitti: false }, gorev: { yildiz: 1 }, son: "2026-11-20T10:00:00Z" };
    const b = { anlat: { adim: 1, bitti: true }, dene: { degerler: 3, bitti: true }, gorev: { yildiz: 3 }, gercek: { ogrenci: true }, son: "2026-11-25T10:00:00Z" };
    expect(dersKaydiBirlestir(a, b)).toEqual({ anlat: { adim: 2, bitti: true }, dene: { degerler: 3, bitti: true }, gorev: { yildiz: 3 }, gercek: { ogrenci: true }, son: "2026-11-25T10:00:00Z" });
    expect(dersKaydiBirlestir(b, a)).toEqual(dersKaydiBirlestir(a, b));
  });
  it("Lab görevine bağlı dersin yıldızı Lab kaydından; bitti: anlat + dene + görev", () => {
    const k = { anlat: { adim: 4, bitti: true }, dene: { degerler: 3, bitti: true } };
    expect(dersDurumu(SIROLINE_SENSOR, k, 0).bitti).toBe(false);
    const s = dersDurumu(SIROLINE_SENSOR, { ...k, gorev: { yildiz: 3 } }, 2);
    expect([s.gorevYildiz, s.bitti]).toEqual([2, true]); // yerleşik yıldız yok sayılır, Lab'ınki geçerli
    expect(dersDurumu(SIROLINE_SENSOR, { ...k, gercek: { ogrenci: true } }, 1, true).onayli).toBe(true);
    expect(dersDurumu(SIROLINE_SENSOR, k, 1, true).onayli).toBe(false); // öğrenci yapmadıysa onay sayılmaz
  });
  it("XP ve seviye", () => {
    const s = dersDurumu(SIROLINE_SENSOR, { anlat: { adim: 4, bitti: true }, dene: { degerler: 3, bitti: true }, gercek: { ogrenci: true } }, 2, true);
    expect(dersXp(s)).toBe(XP.anlat + XP.dene + XP.gorev + 2 * XP.yildiz + XP.gercek + XP.onay);
    expect(dersXp(dersDurumu(SIROLINE_SENSOR, undefined))).toBe(0);
    expect(seviyeHesapla(0)).toEqual({ seviye: 1, doluluk: 0 });
    expect(seviyeHesapla(100).seviye).toBe(2);
    expect(seviyeHesapla(249)).toEqual({ seviye: 2, doluluk: 149 / 150 });
    expect(seviyeHesapla(250).seviye).toBe(3);
  });
  it("atölye sayfası modelinde ders türü: bitmesi bölümlerden, yıldızı Lab'dan", () => {
    const m: Modul = { kimlik: "x", ad: "X", aciklama: "", seviyeler: ["ortaokul"], dersler: [dersOgesi(SIROLINE_SENSOR)] };
    const bos = modulIlerlemesi(m, { gorevler: {} });
    expect([bos.dersler[0].durum, bos.sayilan, bos.biten, bos.enCokYildiz]).toEqual(["acik", 1, 0, 0]);
    const dolu = modulIlerlemesi(m, { gorevler: { "cizgi-oval": { yildiz: 2 } }, dersler: { "siroline-sensor": { anlat: { adim: 4, bitti: true }, dene: { degerler: 3, bitti: true } } } });
    expect([dolu.dersler[0].durum, dolu.biten, dolu.dersler[0].yildiz, dolu.yildiz]).toEqual(["bitti", 1, 2, 0]); // yıldız görevde sayılır, iki kez değil
  });
});

describe("bölümlerin açılışı ve malzeme", () => {
  const s = (o: Partial<Record<"anlat" | "dene" | "gorev", boolean>>) => dersDurumu(SIROLINE_SENSOR, { anlat: { adim: 0, bitti: !!o.anlat }, dene: { degerler: 0, bitti: !!o.dene } }, o.gorev ? 1 : 0);
  it("öğrencide sırayla açılır; deney yoksa deneme atlanabilir; öğretmende hepsi açık", () => {
    expect(["anlat", "dene", "gorev", "gercek"].map((b) => bolumAcik(s({}), b as any))).toEqual([true, false, false, true]);
    expect(["dene", "gorev"].map((b) => bolumAcik(s({ anlat: true }), b as any))).toEqual([true, false]);
    expect(bolumAcik(s({ anlat: true }), "gorev", { deneyVar: false })).toBe(true);
    expect(bolumAcik(s({ anlat: true, dene: true }), "gorev")).toBe(true);
    expect(["anlat", "dene", "gorev", "gercek"].every((b) => bolumAcik(s({}), b as any, { ogretmen: true }))).toBe(true);
  });
  it("ders ilk bitmemiş açık bölümden açılır; deney yokken ders bitmez", () => {
    expect(ilkBolum(s({}))).toBe("anlat");
    expect(ilkBolum(s({ anlat: true }))).toBe("dene");
    expect(ilkBolum(s({ anlat: true, dene: true }))).toBe("gorev");
    expect(ilkBolum(s({ anlat: true }), { deneyVar: false })).toBe("dene");
    expect(s({ anlat: true, gorev: true }).bitti).toBe(false);
  });
  it("malzemedeki parça listede olmalı", () => {
    const d = kopya(SIROLINE_SENSOR); d.gercek!.malzeme.push({ parca: "uzay-gemisi", adet: 1 });
    expect(dersiDogrula(d).join()).toContain("parça listede yok (uzay-gemisi)");
  });
});

describe("ders deposu ve bulut eşitlemesi", () => {
  it("depo: ilerleme geri gitmez, kayıt hatırlanır", () => {
    const d = depo();
    const a = new DersDeposu(d, () => new Date("2026-11-25T12:00:00Z"));
    a.ilerle("siroline-sensor", { anlat: { adim: 3, bitti: false } });
    a.ilerle("siroline-sensor", { anlat: { adim: 1, bitti: false } });
    const b = new DersDeposu(d);
    expect(b.kayit("siroline-sensor")).toEqual({ anlat: { adim: 3, bitti: false }, son: "2026-11-25T12:00:00.000Z" });
  });
  it("iki cihaz: okulda başlanan ders evde buluttan birleşir, ikisinin ilerlemesi de kalır", async () => {
    const b = new SahteBaglanti();
    const okul = new Oturum(b), ev = new Oturum(b);
    await okul.ogrenciGiris("JNR123", "Ece", "1234");
    await ev.ogrenciGiris("JNR123", "Ece", "1234");
    const okulDepo = new DersDeposu(depo()), evDepo = new DersDeposu(depo());
    const okulE = new IlerlemeEsitleyici(okul, "dersler", okulDepo, 0), evE = new IlerlemeEsitleyici(ev, "dersler", evDepo, 0);
    await okulE.baslat();
    okulDepo.ilerle("siroline-sensor", { anlat: { adim: 4, bitti: true } }); okulE.degisti(0);
    await new Promise((r) => setTimeout(r, 10));
    evDepo.ilerle("siroline-sensor", { dene: { degerler: 3, bitti: true } });
    await evE.baslat();
    await new Promise((r) => setTimeout(r, 10));
    const k = evDepo.kayit("siroline-sensor");
    expect([k.anlat?.bitti, k.dene?.bitti]).toEqual([true, true]);
    const bulut = dersKayitlariOku(await okul.ilerlemeGetir("dersler"));
    expect([bulut.dersler["siroline-sensor"].anlat?.bitti, bulut.dersler["siroline-sensor"].dene?.bitti]).toEqual([true, true]);
  });
});
