import { describe, expect, it } from "vitest";
import { CIZIMLER, dersiDogrula, KONTROL_DERSLERI, PARCALAR, ROBOTIK, SAHNE_ANLARI } from "../src";
import { KONTROL_CIZIMLERI, KONTROL_METINLERI } from "../src/gorseller-kontrol";
import { KONTROL_GOREV_ADLARI } from "../src/ders";

describe("Lise · Kontrol (mBot2) dersleri", () => {
  it("altı ders, lise, mBot2, doğrulayıcıdan hatasız; atölyede Kontrol modülünde sırasıyla", () => {
    expect(KONTROL_DERSLERI.map((d) => d.kimlik)).toEqual(["diferansiyel-surus", "i-terimi", "ornekleme-ve-gecikme", "motor-modeli", "enkoderle-konum", "simulasyondan-gercege"]);
    for (const d of KONTROL_DERSLERI) {
      expect(dersiDogrula(d), d.kimlik).toEqual([]);
      expect(d.seviyeler).toEqual(["lise"]);
      expect(d.robot).toBe("mBot2");
    }
    const m = ROBOTIK.moduller.find((x) => x.kimlik === "kontrol")!;
    expect(m.seviyeler).toEqual(["lise"]);
    expect(m.dersler.map((d) => d.kimlik)).toEqual(KONTROL_DERSLERI.map((d) => d.kimlik));
  });
  it("her ders kendi kodsuz kontrol görevini kullanır; altı görevin hepsi bir derste", () => {
    const gorevler = KONTROL_DERSLERI.map((d) => (d.gorev.tur === "kontrol" ? d.gorev.gorev : ""));
    expect(gorevler).toEqual([...KONTROL_GOREV_ADLARI]);
    expect(KONTROL_DERSLERI.map((d) => d.dene.bilesen)).toEqual(["kinematik", "hiz-kontrolu", "ornekleme", "motor", "odometri", "model-farki"]);
  });
  it("doğrulayıcı olmayan kontrol görevini hata sayar", () => {
    const d = JSON.parse(JSON.stringify(KONTROL_DERSLERI[0])); d.gorev.gorev = "yok";
    expect(dersiDogrula(d).join()).toMatch(/kontrol görevi yok/);
  });
  it("her dersin anlatımında en az bir formül ve sayılı örnek var", () => {
    for (const d of KONTROL_DERSLERI) {
      const metin = d.anlat.map((a) => a.metin).join(" ");
      expect(metin, d.kimlik).toMatch(/=/);
      expect(metin, d.kimlik).toMatch(/Örnek/);
    }
  });
  it("formüllü adımların sesli okunan metni var (sembol okunmaz)", () => {
    for (const d of KONTROL_DERSLERI) for (const a of d.anlat) if (/[=ω·Σ]/.test(a.metin)) expect(a.seslendirme, `${d.kimlik}: ${a.metin.slice(0, 30)}`).toBeTruthy();
  });
  it("çizgi izleme dersleri modelin Çizgi İzleyen robotu olduğunu söyler; öğretmen notu ödünç almayı anlatır", () => {
    for (const k of ["ornekleme-ve-gecikme", "simulasyondan-gercege"]) expect(KONTROL_DERSLERI.find((d) => d.kimlik === k)!.anlat.map((a) => a.metin).join(" ")).toMatch(/SiroLine/);
    for (const d of KONTROL_DERSLERI) expect(d.gercek!.ogretmenNotu, d.kimlik).toMatch(/ortaokuldan ödünç/);
  });
  it("çizimler ve mBot2 sahne anları katalogda; katmanların kelimesi sesli metinde", () => {
    for (const ad of Object.keys(KONTROL_CIZIMLERI)) expect(CIZIMLER[ad]).toBeDefined();
    for (const ad of ["mbot2-onden", "mbot2-motorlar", "mbot2-cyberpi", "mbot2-quad-rgb"]) expect(SAHNE_ANLARI[ad]?.robot).toBe("mBot2");
    const sesler = new Map<string, string>(Object.values(KONTROL_METINLERI).map((m) => [m.metin, m.ses]));
    for (const d of KONTROL_DERSLERI) for (const a of d.anlat) {
      if (a.gorsel?.tur !== "cizim") continue;
      expect(a.seslendirme).toBe(sesler.get(a.metin));
      const n = a.seslendirme!.split(/\s+/).length;
      for (const k of CIZIMLER[a.gorsel.ad].katmanlar) if (k.kelime !== undefined) expect(k.kelime).toBeLessThan(n);
    }
  });
  it("malzemeler parça kataloğunda", () => {
    for (const d of KONTROL_DERSLERI) for (const m of d.gercek!.malzeme) expect(PARCALAR[m.parca], m.parca).toBeDefined();
  });
});
