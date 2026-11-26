import { describe, expect, it } from "vitest";
import { DERS_LABIRENTLERI, ROTA_GOREVLERI, SIS_GOREVLERI } from "@sra/robot-motoru";
import { CIZIMLER, dersiDogrula, LABIRENT_DERSLERI } from "../src";
import { kelime, LABIRENT_CIZIMLERI, LABIRENT_METINLERI } from "../src/gorseller-labirent";

describe("Labirent modülü dersleri", () => {
  it("altı ders, doğrulayıcıdan hatasız", () => {
    expect(LABIRENT_DERSLERI.map((d) => d.kimlik)).toEqual(["duvar-sensorleri", "sag-el-kurali", "cikmazi-hatirlamak", "ada-problemi", "hiz-profili", "meb-pisti"]);
    for (const d of LABIRENT_DERSLERI) expect(dersiDogrula(d), d.kimlik).toEqual([]);
  });
  it("kodsuz görevler ve deneylerin labirentleri motorda var", () => {
    for (const d of LABIRENT_DERSLERI) {
      if (d.gorev.tur === "sis") expect(SIS_GOREVLERI[d.gorev.gorev]).toBeDefined();
      if (d.gorev.tur === "rota") expect(ROTA_GOREVLERI[d.gorev.gorev]).toBeDefined();
      const h = (d.dene.ayar as { harita?: string }).harita;
      if (h) expect(DERS_LABIRENTLERI[h], d.kimlik).toBeDefined();
    }
    expect(LABIRENT_DERSLERI.filter((d) => d.gorev.tur === "lab").length).toBe(4);
  });
  it("doğrulayıcı tanınmayan labirenti ve görevi hata sayar", () => {
    const d = JSON.parse(JSON.stringify(LABIRENT_DERSLERI[2]));
    d.dene.ayar.harita = "yok"; d.gorev.gorev = "yok";
    const h = dersiDogrula(d).join("\n");
    expect(h).toMatch(/labirent tanınmıyor/);
    expect(h).toMatch(/sisli labirent görevi yok/);
  });
  it("çizimler katalogda; kelime sırası metindeki sözcüğü gösterir", () => {
    for (const ad of Object.keys(LABIRENT_CIZIMLERI)) expect(CIZIMLER[ad]).toBeDefined();
    expect(kelime("bir iki üç", "iki")).toBe(1);
    expect(kelime("bir iki üç", "ki")).toBe(1);
    expect(kelime("bir iki üç", "bir")).toBe(0);
    expect(() => kelime("bir", "yok")).toThrow();
  });
  it("çizimli adımlar kendi metinlerini kullanır: her katmanın kelimesi metnin içinde", () => {
    const metinler = new Set<string>(Object.values(LABIRENT_METINLERI));
    for (const d of LABIRENT_DERSLERI) for (const a of d.anlat) {
      if (a.gorsel?.tur !== "cizim" || !metinler.has(a.metin)) continue;
      const n = a.metin.split(/\s+/).length;
      for (const k of CIZIMLER[a.gorsel.ad].katmanlar) if (k.kelime !== undefined) expect(k.kelime, `${d.kimlik}/${a.gorsel.ad}`).toBeLessThan(n);
    }
  });
});
