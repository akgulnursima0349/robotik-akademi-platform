import { describe, expect, it } from "vitest";
import { KART_GOREVLERI } from "@sra/robot-motoru";
import { CIZIMLER, dersiDogrula, MBOT_DERSLERI, PARCALAR } from "../src";
import { MBOT_CIZIMLERI, MBOT_METINLERI } from "../src/gorseller-mbot";

describe("İlkokul · Robot görevleri (mBot) dersleri", () => {
  it("sekiz ders, ilkokul, doğrulayıcıdan hatasız", () => {
    expect(MBOT_DERSLERI.map((d) => d.kimlik)).toEqual(["motor-ve-teker", "donmek", "sensor-ne-gorur", "eger-degilse", "dongu-ve-sensor", "enerji", "cizgiyi-izle", "mini-proje"]);
    for (const d of MBOT_DERSLERI) {
      expect(dersiDogrula(d), d.kimlik).toEqual([]);
      expect(d.seviyeler).toEqual(["ilkokul"]);
      expect(d.robot).toBe("mBot");
    }
  });
  it("her anlatım adımı görselli ve kısa (ilkokul)", () => {
    for (const d of MBOT_DERSLERI) for (const a of d.anlat) {
      expect(a.gorsel, `${d.kimlik}: ${a.metin.slice(0, 30)}`).toBeDefined();
      /* cümleler kısa: en uzun cümle 22 kelimeyi geçmez */
      for (const c of a.metin.split(/[.!?]\s/)) expect(c.split(/\s+/).length, c).toBeLessThanOrEqual(22);
    }
  });
  it("kart görevleri motorda; görev türleri", () => {
    for (const d of MBOT_DERSLERI) if (d.gorev.tur === "kart") expect(KART_GOREVLERI[d.gorev.gorev]).toBeDefined();
    expect(MBOT_DERSLERI.map((d) => d.gorev.tur)).toEqual(["kart", "kart", "bilmece", "kart", "kart", "kart", "cizgi-tablo", "tasarim"]);
  });
  it("doğrulayıcı bozuk bilmeceyi ve olmayan kart görevini hata sayar", () => {
    const d = JSON.parse(JSON.stringify(MBOT_DERSLERI[2]));
    d.gorev.sorular[0].dogru = 9;
    expect(dersiDogrula(d).join()).toMatch(/1\. bilmece eksik/);
    const k = JSON.parse(JSON.stringify(MBOT_DERSLERI[0])); k.gorev.gorev = "yok";
    expect(dersiDogrula(k).join()).toMatch(/kart görevi yok/);
  });
  it("çizimler katalogda; katmanların kelimesi kendi metninde", () => {
    for (const ad of Object.keys(MBOT_CIZIMLERI)) expect(CIZIMLER[ad]).toBeDefined();
    const metinler = new Set<string>(Object.values(MBOT_METINLERI));
    for (const d of MBOT_DERSLERI) for (const a of d.anlat) {
      if (a.gorsel?.tur !== "cizim" || !metinler.has(a.metin)) continue;
      const n = a.metin.split(/\s+/).length;
      for (const k of CIZIMLER[a.gorsel.ad].katmanlar) if (k.kelime !== undefined) expect(k.kelime).toBeLessThan(n);
    }
  });
  it("malzemeler tanımlı", () => {
    expect(PARCALAR.mbot).toBeDefined();
    for (const d of MBOT_DERSLERI) for (const m of d.gercek?.malzeme ?? []) expect(PARCALAR[m.parca], m.parca).toBeDefined();
  });
});
