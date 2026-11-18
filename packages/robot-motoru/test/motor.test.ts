import { describe, expect, it } from "vitest";
import { degerlendir, GOREVLER, KarKureme, macOyna, RobotDurdu, topDagit, turnuva, TOP_SAYISI, type Beyin, type Durum, type Gorev } from "../src";

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

/* ligde kullanılan basit beyinler */
const bekleyen: Beyin = () => "bekle";
const avci: Beyin = (d: Durum) => {
  if (!d.en_yakin_top) return "bekle";
  const [tx, ty] = d.en_yakin_top;
  const istenen = tx > d.x ? "doğu" : tx < d.x ? "batı" : ty > d.y ? "güney" : "kuzey";
  if (d.yon === istenen) return "ileri";
  const sira = ["kuzey", "doğu", "güney", "batı"];
  return (sira.indexOf(istenen) - sira.indexOf(d.yon) + 4) % 4 === 3 ? "sola" : "saga";
};

describe("lig", () => {
  it("toplar simetrik, 15 tane ve başlangıç karelerinde değil", () => {
    const t = topDagit(7);
    expect(t.length).toBe(TOP_SAYISI);
    for (const k of t) expect(t.some((m) => m.x === 8 - k.x && m.y === 8 - k.y)).toBe(true);
    expect(t.some((k) => (k.x === 0 || k.x === 8) && k.y === 4)).toBe(false);
  });
  it("aynı beyinler ve tohum aynı maçı üretir", () => {
    expect(JSON.stringify(macOyna(avci, avci, 5))).toBe(JSON.stringify(macOyna(avci, avci, 5)));
  });
  it("toplayan robot bekleyeni yener; toplar ile puan tutarlı", () => {
    const s = macOyna(avci, bekleyen, 11);
    expect(s.kazanan).toBe(0);
    expect(s.puan[0]).toBeGreaterThan(0);
    const son = s.kareler.at(-1)!;
    expect(s.puan[0] + s.puan[1] + son.toplar.length).toBe(TOP_SAYISI);
  });
  it("iki aynı simetrik robot berabere kalır", () => {
    expect(macOyna(bekleyen, bekleyen, 3).kazanan).toBeNull();
  });
  it("robotlar aynı kareye ve birbirinin yerine giremez", () => {
    const s = macOyna(avci, avci, 9);
    for (const k of s.kareler) expect(k.robotlar[0].x === k.robotlar[1].x && k.robotlar[0].y === k.robotlar[1].y).toBe(false);
  });
  it("geçersiz hamle ve hata beklemeye döner, hata kaydedilir", () => {
    const s = macOyna(() => "zıpla", () => { throw new Error("patladı"); }, 1);
    expect(s.hatalar[0]).toMatch(/zıpla/);
    expect(s.hatalar[1]).toMatch(/patladı/);
    expect(s.kareler.at(-1)!.robotlar[0]).toMatchObject({ x: 0, y: 4 });
  });
  it("arena sınırında ileri gitmez", () => {
    const s = macOyna(() => "ileri", bekleyen, 1);
    for (const k of s.kareler) expect(k.robotlar[0].x).toBeLessThanOrEqual(8);
  });
  it("turnuva: 6 robot 15 maç, puan tablosu doğru", () => {
    const o = ["a", "b", "c", "d", "e", "f"].map((k, i) => ({ kimlik: k, ad: k.toUpperCase(), beyin: i < 2 ? avci : bekleyen }));
    const t = turnuva(o);
    expect(t.maclar.length).toBe(15);
    expect(t.tablo.reduce((s, x) => s + x.o, 0)).toBe(30);
    expect(t.tablo.slice(0, 2).map((x) => x.kimlik).sort()).toEqual(["a", "b"]);
    for (const r of t.tablo) expect(r.puan).toBe(r.g * 3 + r.b);
  });
});
