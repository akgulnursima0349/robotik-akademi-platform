import { describe, expect, it } from "vitest";
import { acilisSeviyesi, kursSeviyesi, SEVIYE_ATOLYELERI, seviyeOku, seviyeYaz, VARSAYILAN_SEVIYE } from "../src/atolyeler";

const acik = (s: keyof typeof SEVIYE_ATOLYELERI) => SEVIYE_ATOLYELERI[s].filter((a) => a.hedef).map((a) => `${a.kimlik}:${a.hedef!.kurs}`);
const yakinda = (s: keyof typeof SEVIYE_ATOLYELERI) => SEVIYE_ATOLYELERI[s].filter((a) => !a.hedef).map((a) => a.kimlik).sort();
const depo = (ilk?: string) => { const m = new Map<string, string>(ilk === undefined ? [] : [["sra-seviye", ilk]]); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe("seviye → atölye eşlemesi", () => {
  it("okul öncesi: Kodla Oyna açık; Bilgisayarla Tanışma ve Robotik yakında", () => {
    expect(acik("okul-oncesi")).toEqual(["blok:ilkokul"]);
    expect(yakinda("okul-oncesi")).toEqual(["bilgisayar", "robotik"]);
  });
  it("ilkokul: Kodla Oyna, Python (Junior), Robotik (Lab) açık; Bilgisayarla Tanışma yakında", () => {
    expect(acik("ilkokul")).toEqual(["blok:ilkokul", "python:junior", "robotik:lab"]);
    expect(yakinda("ilkokul")).toEqual(["bilgisayar"]);
  });
  it("ortaokul ve lise: Python (Python Atölyesi) ve Robotik açık; C++ ve Arduino yakında", () => {
    for (const s of ["ortaokul", "lise"] as const) {
      expect(acik(s)).toEqual(["python:ortaokul", "robotik:lab"]);
      expect(yakinda(s)).toEqual(["arduino", "cpp"]);
    }
  });
  it("her seviyede açık atölyeler kilitlilerden önce", () => {
    for (const l of Object.values(SEVIYE_ATOLYELERI)) {
      const ilkKilitli = l.findIndex((a) => !a.hedef);
      expect(l.slice(ilkKilitli).every((a) => !a.hedef)).toBe(true);
    }
  });
});

describe("seviye seçimi", () => {
  it("öğrencinin seviyesi sınıfının kursundan gelir, hatırlanan seçimi ezer", () => {
    expect(kursSeviyesi("ilkokul")).toBe("ilkokul");
    expect(kursSeviyesi("junior")).toBe("ilkokul");
    expect(kursSeviyesi("ortaokul")).toBe("ortaokul");
    expect(acilisSeviyesi(depo("lise"), "ortaokul")).toBe("ortaokul");
    expect(acilisSeviyesi(depo("lise"))).toBe("lise");
  });
  it("hatırlanan seviye okunur; yoksa, bozuksa ya da depo hata verirse varsayılan", () => {
    const d = depo();
    expect(seviyeOku(d)).toBe(VARSAYILAN_SEVIYE);
    seviyeYaz(d, "okul-oncesi");
    expect(seviyeOku(d)).toBe("okul-oncesi");
    expect(seviyeOku(depo("universite"))).toBe(VARSAYILAN_SEVIYE);
    expect(seviyeOku({ getItem: () => { throw new Error("kapalı"); } })).toBe(VARSAYILAN_SEVIYE);
    expect(seviyeOku(null)).toBe(VARSAYILAN_SEVIYE);
    expect(() => seviyeYaz({ setItem: () => { throw new Error("dolu"); } }, "lise")).not.toThrow();
  });
});
