import { describe, expect, it } from "vitest";
import { AYAR_BASLANGIC, AYAR_PISTLERI, ayarKos, ayarYildizi, Pist, siroBeyni, turKos, type AyarAdi } from "@sra/robot-motoru";
import { CIZGI_DERSLERI, dersiDogrula, ROBOTIK, type DersTanimi } from "../src";

/** Her ayar görevi için üç yıldızlı bir örnek ayar (testte doğrulanır, öğrenciye gösterilmez) */
const UC_YILDIZ: Record<string, Partial<Record<AyarAdi, number>>> = {
  "p-kontrol": { kp: 0.02 },
  "d-kontrol": { kd: 0.1 },
  "pist-yarisi": { taban: 220, kp: 0.06, kd: 0.4 }
};
const ayarlar = (d: DersTanimi, ek: Partial<Record<AyarAdi, number>>) => {
  if (d.gorev.tur !== "ayar") throw new Error("ayar görevi değil");
  return { ...AYAR_BASLANGIC, ...d.gorev.sabit, ...ek } as Record<AyarAdi, number>;
};

describe("Çizgi İzleyen Robot modülü", () => {
  it("altı ders doğrulayıcıdan hatasız geçiyor ve modülde sırasıyla duruyor", () => {
    expect(CIZGI_DERSLERI.map((d) => d.kimlik)).toEqual(["siroline-sensor", "cizgi-konumu", "p-kontrol", "d-kontrol", "hiz-kararlilik", "pist-yarisi"]);
    for (const d of CIZGI_DERSLERI) expect(dersiDogrula(d), d.kimlik).toEqual([]);
    const m = ROBOTIK.moduller.find((x) => x.kimlik === "cizgi")!;
    expect(m.dersler.filter((d) => d.tur === "ders").map((d) => d.kimlik)).toEqual(CIZGI_DERSLERI.map((d) => d.kimlik));
  });
  it("her anlatım adımının görseli var", () => {
    for (const d of CIZGI_DERSLERI) for (const [i, a] of d.anlat.entries()) expect(a.gorsel, `${d.kimlik} ${i + 1}`).toBeDefined();
  });
  it("ayar görevlerinin üç yıldızı ulaşılabilir", () => {
    for (const d of CIZGI_DERSLERI.filter((x) => x.gorev.tur === "ayar")) {
      if (d.gorev.tur !== "ayar") continue;
      expect(UC_YILDIZ[d.kimlik], d.kimlik).toBeDefined();
      const r = ayarYildizi(d.gorev.degerlendirme, ayarKos(d.gorev.pist, ayarlar(d, UC_YILDIZ[d.kimlik])));
      expect(r.yildiz, d.kimlik).toBe(3);
    }
  });
  it("pistten çıkan ya da şartı tutmayan ayar yıldız almıyor", () => {
    const p = CIZGI_DERSLERI.find((d) => d.kimlik === "p-kontrol")!;
    if (p.gorev.tur !== "ayar") throw new Error();
    expect(ayarYildizi(p.gorev.degerlendirme, ayarKos(p.gorev.pist, ayarlar(p, { kp: 0.005 })))).toMatchObject({ yildiz: 0, yorum: "cikti" });
    const dk = CIZGI_DERSLERI.find((d) => d.kimlik === "d-kontrol")!;
    if (dk.gorev.tur !== "ayar") throw new Error();
    /* çok büyük Kd: robot titreyerek yavaşlar, 5 saniye şartını tutmaz */
    expect(ayarYildizi(dk.gorev.degerlendirme, ayarKos(dk.gorev.pist, ayarlar(dk, { kd: 0.8 })))).toMatchObject({ yildiz: 0, yorum: "yavas" });
    /* Kd = 0: sallanır, sapma büyük */
    expect(ayarYildizi(dk.gorev.degerlendirme, ayarKos(dk.gorev.pist, ayarlar(dk, { kd: 0 }))).yildiz).toBe(0);
  });
  it("simülasyon Lab'ın çizgi robotuyla aynı sonucu veriyor ve deterministik", () => {
    for (const [ad, p] of Object.entries(AYAR_PISTLERI)) {
      const a = { taban: 120, kp: 0.03, kd: 0.3 };
      const lab = turKos(new Pist(p.pist, p.zemin), siroBeyni({ ...a, ek: 0, zemin: p.zemin }), p.sureSiniri);
      const k1 = ayarKos(ad, a), k2 = ayarKos(ad, a);
      expect([k1.sonuc.durum, k1.sonuc.sure, k1.sapma], ad).toEqual([lab.durum, lab.sure, lab.ortSapma]);
      expect(k2.sonuc.sure).toBe(k1.sonuc.sure);
      expect(k1.hatalar.length).toBe(k1.sonuc.kareler.length);
    }
  });
});
