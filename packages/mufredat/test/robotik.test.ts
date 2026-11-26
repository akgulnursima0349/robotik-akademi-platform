import { describe, expect, it } from "vitest";
import { CIZGI_GOREVLERI, GOREVLER, LABIRENT_GOREVLERI } from "@sra/robot-motoru";
import { atolyeOzeti, BOS_KAYIT, CIZGI_DERSLERI, kaldigiYer, kayitOku, modulIlerlemesi, ROBOTIK, seviyeSirasi, type IlerlemeKaydi } from "../src";

/** Çizgi modülünün bütün derslerinde anlat ve dene bitmiş; ayar görevli derslerde görev yıldızı da var (Lab görevinin yıldızı Lab kaydında) */
const tumDersler = { dersler: Object.fromEntries(CIZGI_DERSLERI.map((d) => [d.kimlik, { anlat: { adim: d.anlat.length - 1, bitti: true }, dene: { degerler: d.dene.enAzFarkliDeger, bitti: true }, ...(d.gorev.tur === "ayar" ? { gorev: { yildiz: 2 } } : {}) }])) };

const modul = (k: string) => ROBOTIK.moduller.find((m) => m.kimlik === k)!;
const kayit = (gorevler: Record<string, number>, ek: Partial<IlerlemeKaydi> = {}): IlerlemeKaydi => ({ gorevler: Object.fromEntries(Object.entries(gorevler).map(([k, y]) => [k, { yildiz: y }])), bayrak: {}, lig: null, ...ek });

describe("Robotik atölyesi Lab ile aynı", () => {
  it("modüller ve görevler Lab'ın listeleriyle birebir (sıra, ad, anahtar, adres)", () => {
    expect(modul("kar").dersler.map((d) => [d.anahtar, d.ad, d.adres])).toEqual(GOREVLER.map((g) => [g.kimlik, g.ad, `lab/#kar/${g.kimlik}`]));
    expect(modul("labirent").dersler.map((d) => [d.anahtar, d.ad, d.adres])).toEqual(LABIRENT_GOREVLERI.map((g) => [g.kimlik, g.ad, `lab/#labirent/${g.kimlik}`]));
    const c = modul("cizgi").dersler.filter((d) => d.tur === "gorev");
    expect(c.map((d) => [d.anahtar, d.ad, d.adres])).toEqual(CIZGI_GOREVLERI.map((g) => ["cizgi-" + g.kimlik, g.ad, `lab/#cizgi/${g.kimlik}`]));
    expect(modul("cizgi").dersler.slice(-2).map((d) => [d.tur, d.adres, d.anahtar])).toEqual([["rehber", "lab/#cizgi/kurulum", "siro-kurulum"], ["serbest", "lab/#cizgi/ayar", ""]]);
    expect(modul("sumo").dersler.map((d) => [d.tur, d.adres])).toEqual([["lig", "lab/#lig"]]);
    expect(ROBOTIK.moduller.map((m) => m.kimlik)).toEqual(["kar", "cizgi", "labirent", "sumo"]);
  });
  it("ders kimlikleri modül içinde benzersiz", () => {
    for (const m of ROBOTIK.moduller) expect(new Set(m.dersler.map((d) => d.kimlik)).size).toBe(m.dersler.length);
  });
});

describe("ilerleme", () => {
  it("boş kayıtta: ilk görev açık, sonrakiler kilitli; rehber ve lig her zaman açık", () => {
    const k = modulIlerlemesi(modul("kar"), BOS_KAYIT);
    expect(k.dersler.map((d) => d.durum)).toEqual(["acik", ...GOREVLER.slice(1).map(() => "kilitli")]);
    const c = modulIlerlemesi(modul("cizgi"), BOS_KAYIT);
    expect(c.dersler.slice(-2).map((d) => d.durum)).toEqual(["acik", "acik"]);
    expect(modulIlerlemesi(modul("sumo"), BOS_KAYIT).dersler[0].durum).toBe("acik");
  });
  it("yıldızlar, biten sayısı ve kilitler kayda göre; öğretmende kilit yok", () => {
    const g = GOREVLER;
    const k = modulIlerlemesi(modul("kar"), kayit({ [g[0].kimlik]: 3, [g[1].kimlik]: 1 }));
    expect([k.yildiz, k.biten, k.sayilan, k.enCokYildiz]).toEqual([4, 2, g.length, g.length * 3]);
    expect(k.dersler.slice(0, 4).map((d) => d.durum)).toEqual(["bitti", "bitti", "acik", "kilitli"]);
    expect(modulIlerlemesi(modul("kar"), BOS_KAYIT, true).dersler.every((d) => d.durum === "acik")).toBe(true);
  });
  it("rehber bayrakla, lig kayıtlı robotla biter; serbest çalışma sayılmaz", () => {
    const c = modulIlerlemesi(modul("cizgi"), kayit({}, { bayrak: { "siro-kurulum": true } }));
    expect(c.dersler.find((d) => d.ders.tur === "rehber")!.durum).toBe("bitti");
    expect(c.sayilan).toBe(CIZGI_GOREVLERI.length + 1 + CIZGI_DERSLERI.length); // görevler + kurulum rehberi + dersler
    expect(modulIlerlemesi(modul("sumo"), kayit({}, { lig: { ad: "Ok" } })).biten).toBe(1);
  });
  it("kaldığın yer: seviyenin önerdiği modüllerde ilk açık ve bitmemiş ders", () => {
    expect(kaldigiYer(ROBOTIK, BOS_KAYIT, "ilkokul")!.ders.anahtar).toBe(GOREVLER[0].kimlik);
    expect(kaldigiYer(ROBOTIK, BOS_KAYIT, "lise")!.ders.anahtar).toBe("siroline-sensor"); // modülün başındaki ders
    const dersBitti = { dersler: { "siroline-sensor": { anlat: { adim: 4, bitti: true }, dene: { degerler: 3, bitti: true } } } };
    const hepsi = Object.fromEntries(CIZGI_GOREVLERI.map((g) => ["cizgi-" + g.kimlik, 2]));
    expect(kaldigiYer(ROBOTIK, kayit({}, dersBitti), "lise")!.ders.anahtar).toBe("siroline-sensor"); // görevi (İlk tur) bitmeden ders bitmez
    expect(kaldigiYer(ROBOTIK, kayit(hepsi), "lise")!.ders.kimlik).toBe("siroline-sensor");
    expect(kaldigiYer(ROBOTIK, kayit(hepsi, dersBitti), "lise")!.ders.kimlik).toBe("cizgi-konumu"); // sıradaki ders
    expect(kaldigiYer(ROBOTIK, kayit(hepsi, tumDersler), "lise")!.ders.kimlik).toBe("kurulum");
    expect(kaldigiYer(ROBOTIK, kayit(hepsi, { ...tumDersler, bayrak: { "siro-kurulum": true } }), "lise")!.ders.anahtar).toBe(LABIRENT_GOREVLERI[0].kimlik);
  });
  it("her şey bittiyse kaldığın yer yok; özet toplamları doğru", () => {
    const gorevler: Record<string, number> = {};
    for (const m of ROBOTIK.moduller) for (const d of m.dersler) if (d.tur === "gorev") gorevler[d.anahtar] = 3;
    const k = kayit(gorevler, { bayrak: { "siro-kurulum": true }, lig: { ad: "x" }, ...tumDersler });
    expect(kaldigiYer(ROBOTIK, k, "ortaokul")).toBeNull();
    const o = atolyeOzeti(ROBOTIK, k);
    expect(o.biten).toBe(o.sayilan);
    expect(o.yildiz).toBe(o.enCokYildiz);
  });
  it("seviyeye göre sıra: ilkokulda Kar Küreme önerilir, okul öncesinde öneri yok", () => {
    expect(seviyeSirasi(ROBOTIK, "ilkokul").onerilen.map((m) => m.kimlik)).toEqual(["kar"]);
    expect(seviyeSirasi(ROBOTIK, "lise").onerilen.map((m) => m.kimlik)).toEqual(["cizgi", "labirent", "sumo"]);
    expect(seviyeSirasi(ROBOTIK, "okul-oncesi").onerilen).toEqual([]);
  });
});

describe("kayıt okuma", () => {
  it("bozuk, boş ya da garip değerlerde güvenli", () => {
    expect(kayitOku(null)).toEqual(BOS_KAYIT);
    expect(kayitOku("{bozuk")).toEqual(BOS_KAYIT);
    expect(kayitOku("42")).toEqual(BOS_KAYIT);
    const k = kayitOku(JSON.stringify({ gorevler: { a: { yildiz: 7 }, b: { yildiz: "x" }, c: null }, bayrak: { r: "evet", s: true }, lig: { ad: 3 } }));
    expect(k.gorevler).toEqual({ a: { yildiz: 3 }, b: { yildiz: 0 }, c: { yildiz: 0 } });
    expect(k.bayrak).toEqual({ s: true });
    expect(k.lig).toBeNull();
  });
});
