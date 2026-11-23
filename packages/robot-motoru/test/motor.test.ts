import { describe, expect, it } from "vitest";
import { degerlendir, GOREVLER, KarKureme, RobotDurdu, type Gorev } from "../src";

/** Örnek çözümü TS ile çalıştıran küçük yorumlayıcı (yalnızca testte; asıl yorumlayıcı Python/Skulpt). */
function tsCalistir(g: Gorev, adimlar: (s: KarKureme) => void) {
  const simler = g.haritalar.map((h) => new KarKureme(h, g.yon, g.batarya));
  let hata: "carpma" | "batarya" | "cok_adim" | undefined;
  for (const s of simler) { try { adimlar(s); } catch (e) { if (e instanceof RobotDurdu) hata = e.sebep; else throw e; } }
  return { simler, hata };
}
const tekrar = (n: number, f: () => void) => { for (let i = 0; i < n; i++) f(); };
const COZUM: Record<string, (s: KarKureme) => void> = {
  "ilk-sokak": (s) => tekrar(4, () => s.ileri()),
  kose: (s) => { tekrar(3, () => s.ileri()); s.sagaDon(); tekrar(3, () => s.ileri()); },
  "uzun-cadde": (s) => tekrar(14, () => s.ileri()),
  "okul-yolu": (s) => tekrar(2, () => { tekrar(6, () => s.ileri()); s.sagaDon(); tekrar(3, () => s.ileri()); s.sagaDon(); }),
  "sokak-sonu": (s) => { while (s.onuAcik()) s.ileri(); },
  "sarj-molasi": (s) => { tekrar(9, () => s.ileri()); s.sagaDon(); s.ileri(); s.sagaDon(); s.sagaDon(); s.ileri(); s.sagaDon(); tekrar(9, () => s.ileri()); }
};

describe("Kar Küreme motoru", () => {
  it("karlı kare 2, temiz kare 1 enerji; kar temizlenir ve ize yazılır", () => {
    const s = new KarKureme(["#####", "#R. #", "#####"], 1, 10);
    s.ileri(); s.ileri();
    expect(s.batarya).toBe(7);
    expect(s.izgara.kalanKar()).toBe(0);
    expect(s.iz.map((k) => k.olay)).toEqual(["basla", "ileri", "ileri"]);
    expect(s.iz[1].temizlenen).toEqual({ x: 2, y: 1 });
  });
  it("binaya çarpınca durur", () => {
    const s = new KarKureme(["###", "#R#", "###"], 1, 10);
    expect(() => s.ileri()).toThrow(RobotDurdu);
    expect(s.durdu).toBe("carpma");
    expect(s.iz.at(-1)!.olay).toBe("carpma");
  });
  it("batarya bitince durur", () => {
    const s = new KarKureme(["#######", "#R....#", "#######"], 1, 3);
    s.ileri();
    expect(() => s.ileri()).toThrow(/Batarya/);
    expect(s.durdu).toBe("batarya");
  });
  it("istasyona girince batarya dolar", () => {
    const s = new KarKureme(["####", "#R.#", "#S##", "####"], 2, 5);
    s.ileri();
    expect(s.batarya).toBe(5);
    expect(s.iz.at(-1)!.olay).toBe("sarj");
  });
  it("sonsuz döngü adım sınırında durur", () => {
    const s = new KarKureme(["###", "#R#", "###"], 1, 10);
    expect(() => { for (;;) s.solaDon(); }).toThrow(/çok fazla adım/);
  });
  it("dönüşler 4 kez tekrarlanınca başa döner, sensörler enerji harcamaz", () => {
    const s = new KarKureme(["#####", "#R..#", "#####"], 1, 10);
    for (let i = 0; i < 4; i++) s.sagaDon();
    expect(s.yon).toBe(1);
    expect(s.onuAcik()).toBe(true); expect(s.onundeKarVar()).toBe(true);
    expect(s.batarya).toBe(10);
  });
});

describe("görevler", () => {
  for (const g of GOREVLER) {
    it(`${g.sira}. ${g.ad}: örnek çözüm 3 yıldız`, () => {
      const { simler, hata } = tsCalistir(g, COZUM[g.kimlik]);
      const r = degerlendir(g, simler, g.cozum, hata);
      expect(r.sebep).toBeUndefined();
      expect(r.yildizlar).toEqual({ bitti: true, enerji: true, kisa: true });
    });
  }
  it("şarj molası istasyona uğramadan bitmez", () => {
    const g = GOREVLER.find((x) => x.kimlik === "sarj-molasi")!;
    const { simler, hata } = tsCalistir(g, (s) => tekrar(18, () => s.ileri()));
    expect(degerlendir(g, simler, "", hata).sebep).toBe("batarya");
  });
  it("sokak sonu görevi sabit sayıyla yalnız bir haritada geçer", () => {
    const g = GOREVLER.find((x) => x.kimlik === "sokak-sonu")!;
    const { simler, hata } = tsCalistir(g, (s) => tekrar(9, () => s.ileri()));
    expect(degerlendir(g, simler, "", hata).basarili).toBe(false);
  });
  it("kar kalırsa başarısız: sebep kar_kaldi", () => {
    const g = GOREVLER[0];
    const { simler, hata } = tsCalistir(g, (s) => s.ileri());
    expect(degerlendir(g, simler, "ileri()", hata).sebep).toBe("kar_kaldi");
  });
});

