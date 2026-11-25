// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { kelimeler, kelimeSirasi, kendiligindenOkunsunMu, konusmaBalonu, kok, maskot, MASKOT_HALLERI, SesServisi, sesAyarlari, type SesMotoru } from "../src/v2";

/** sahte ses motoru: konuşmaları kaydeder, kelime sınırı ve bitişi elle tetiklenir */
function sahteMotor(turkce = true) {
  const kayit: { metin: string; hiz: number; kelime: (c: number) => void; bitti: () => void }[] = [];
  let sustu = 0;
  const m: SesMotoru = {
    sesler: () => (turkce ? [{ lang: "en-US", name: "en" }, { lang: "tr-TR", name: "Türkçe" }] : [{ lang: "en-US", name: "en" }]),
    konus: (metin, a, o) => kayit.push({ metin, hiz: a.hiz, ...o }),
    sustur: () => { sustu++; },
    seslerDegisince: () => {}
  };
  return { m, kayit, sustu: () => sustu };
}
const depo = () => { const d = new Map<string, string>(); return { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v), d }; };

describe("ses servisi", () => {
  it("Türkçe ses yoksa okumaz, var değil", () => {
    const { m, kayit } = sahteMotor(false);
    const s = new SesServisi(m, depo());
    expect(s.var).toBe(false);
    expect(s.oku("Merhaba")).toBe(0);
    expect(kayit).toHaveLength(0);
    expect(new SesServisi(null, depo()).oku("x")).toBe(0);
  });
  it("ayarlar hatırlanır; kapalıyken yalnız zorla okunur; hız ayara göre", () => {
    const { m, kayit } = sahteMotor();
    const d = depo();
    const s = new SesServisi(m, d);
    expect(s.ayar).toEqual({ acik: true, hiz: "normal" });
    s.ayar = { acik: false, hiz: "yavas" };
    expect(new SesServisi(m, d).ayar).toEqual({ acik: false, hiz: "yavas" });
    expect(s.oku("a")).toBe(0);
    expect(s.oku("a", { zorla: true })).toBeGreaterThan(0);
    expect(kayit[0].hiz).toBeLessThan(0.8);
  });
  it("eski Blok ayarı ('kapali') okunur", () => {
    const d = depo(); d.setItem("sra-blok-ses", "kapali");
    expect(new SesServisi(sahteMotor().m, d, "sra-blok-ses").acik).toBe(false);
  });
  it("kelime vurgusu sınır olaylarına göre ilerler; yeni okuma eskisinin olaylarını keser", () => {
    const { m, kayit } = sahteMotor();
    const s = new SesServisi(m, depo());
    const goru: number[] = []; let bitti = 0;
    s.oku("Kırmızı yıldızı bul", { kelime: (i) => goru.push(i), bitti: () => bitti++ });
    kayit[0].kelime(0); kayit[0].kelime(8); kayit[0].kelime(10); kayit[0].kelime(16);
    expect(goru).toEqual([0, 1, 1, 2]);
    s.oku("İkinci");
    kayit[0].kelime(16); kayit[0].bitti();
    expect(goru).toHaveLength(4);
    expect(bitti).toBe(0);
    expect(s.okunan).toBeGreaterThan(0);
    kayit[1].bitti();
    expect(s.okunan).toBe(0);
  });
  it("kelimeler ve konumları", () => {
    expect(kelimeler("  Bul  ve dokun")).toEqual([{ kelime: "Bul", bas: 2 }, { kelime: "ve", bas: 7 }, { kelime: "dokun", bas: 10 }]);
    expect(kelimeSirasi(kelimeler("a bb ccc"), 99)).toBe(2);
  });
  it("kendiliğinden okuma yalnız okul öncesinde ve ses açıkken", () => {
    expect(kendiligindenOkunsunMu("okul-oncesi", true)).toBe(true);
    expect(kendiligindenOkunsunMu("okul-oncesi", false)).toBe(false);
    for (const s of ["ilkokul", "ortaokul", "lise", undefined]) expect(kendiligindenOkunsunMu(s, true)).toBe(false);
  });
});

describe("maskot ve konuşma balonu", () => {
  it("maskot: her hâl için erişilebilir ad; süs olarak gizli", () => {
    for (const [h, ad] of MASKOT_HALLERI) {
      const m = maskot(h, 64);
      expect(m.getAttribute("role")).toBe("img");
      expect(m.getAttribute("aria-label")).toBe(`Bit ${ad}`);
      expect(m.querySelector("svg")).not.toBeNull();
      expect(m.style.width).toBe("64px");
    }
    expect(maskot("seviniyor", 96, true).getAttribute("aria-hidden")).toBe("true");
  });
  it("balon: Dinle okur, söylenen kelimeyi vurgular, Durdur keser", () => {
    const { m, kayit } = sahteMotor();
    const ses = new SesServisi(m, depo());
    const b = konusmaBalonu({ metin: "Kırmızı yıldızı bul", ses, kendiliginden: false });
    document.body.append(b);
    const d = b.querySelector<HTMLButtonElement>(".s2-dinle")!;
    expect(d.hidden).toBe(false);
    d.click();
    expect(kayit).toHaveLength(1);
    expect(d.getAttribute("aria-pressed")).toBe("true");
    expect(d.textContent).toContain("Durdur");
    kayit[0].kelime(10);
    expect([...b.querySelectorAll(".okunan")].map((x) => x.textContent)).toEqual(["yıldızı"]);
    d.click();
    expect(ses.okunan).toBe(0);
    expect(d.getAttribute("aria-pressed")).toBe("false");
    expect(b.querySelectorAll(".okunan")).toHaveLength(0);
    b.remove();
  });
  it("balon okuma olaylarını (başladı, kelime sırası, bitti) dışarı bildirir; Durdur da bitti sayılır", () => {
    const { m, kayit } = sahteMotor();
    const ses = new SesServisi(m, depo());
    const olaylar: string[] = [];
    const b = konusmaBalonu({ metin: "Kırmızı yıldızı bul", ses, kendiliginden: false,
      olay: { basladi: () => olaylar.push("basladi"), kelime: (i) => olaylar.push(`k${i}`), bitti: () => olaylar.push("bitti") } });
    const d = b.querySelector<HTMLButtonElement>(".s2-dinle")!;
    d.click(); kayit[0].kelime(10); kayit[0].bitti();
    expect(olaylar).toEqual(["basladi", "k1", "bitti"]);
    d.click(); d.click();
    expect(olaylar.slice(3)).toEqual(["basladi", "bitti"]);
  });
  it("Türkçe ses yoksa Dinle düğmesi gizli, metin görünür", () => {
    const b = konusmaBalonu({ metin: "Merhaba", ses: new SesServisi(sahteMotor(false).m, depo()) });
    expect(b.querySelector<HTMLButtonElement>(".s2-dinle")!.hidden).toBe(true);
    expect(b.textContent).toContain("Merhaba");
  });
  it("okul öncesinde kendiliğinden okur, ilkokulda okumaz", async () => {
    for (const [sev, beklenen] of [["okul-oncesi", 1], ["ilkokul", 0]] as const) {
      const { m, kayit } = sahteMotor();
      const k = kok(document.createElement("div"), sev);
      k.append(konusmaBalonu({ metin: "Dokun", ses: new SesServisi(m, depo()) }));
      document.body.append(k);
      await Promise.resolve();
      expect(kayit).toHaveLength(beklenen);
      k.remove();
    }
  });
  it("ses ayarları: anahtar sesi kapatır, switch rolü ve durumu doğru", () => {
    const ses = new SesServisi(sahteMotor().m, depo());
    const a = sesAyarlari(ses);
    const anahtar = a.querySelector<HTMLButtonElement>('[role="switch"]')!;
    expect(anahtar.getAttribute("aria-checked")).toBe("true");
    anahtar.click();
    expect(ses.acik).toBe(false);
    expect(anahtar.getAttribute("aria-checked")).toBe("false");
  });
});
