import { describe, expect, it } from "vitest";
import {
  DERS_LABIRENTLERI, enHizliRota, HAZIR_ROTALAR, hizProfili, kosuSuresi, kuralKos, Labirent, LabirentDurdu, labirentDegerlendir, LABIRENT_GOREVLERI,
  mebPuani, RIZBOT, rastgele, ROTA_GOREVLERI, rotaHesapla, rotaYildizi, SIS_GOREVLERI, SisliLabirent, sisYildizi, type Hucre, type Yon
} from "../src";

const dene = (f: () => void) => { try { f(); } catch (e) { if (!(e instanceof LabirentDurdu)) throw e; } };
/** Bir rotayı Lab'daki motorda komutlarla sürer (süre karşılaştırması için) */
function simdeSur(harita: readonly string[], yol: Hucre[]): Labirent {
  const s = new Labirent(harita, 0, 999);
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  dene(() => {
    for (let i = 1; i < yol.length; i++) {
      const d = [0, 1, 2, 3].find((y) => DX[y] === yol[i][0] - yol[i - 1][0] && DY[y] === yol[i][1] - yol[i - 1][1])!;
      const fark = (d - s.yon + 4) % 4;
      if (fark === 1) s.sagaDon(); else if (fark === 3) s.solaDon(); else if (fark === 2) s.geriDon();
      s.ileri();
    }
  });
  return s;
}
/** Kuralın geçtiği hücreler, sırasıyla (sisli labirentte aynı yolu yürümek için) */
function kuralYolu(harita: readonly string[], kural: "sag-el" | "sol-el"): Hucre[] {
  const k = kuralKos(harita, kural);
  return [[k.sim.h.baslangic.x, k.sim.h.baslangic.y], ...k.sim.iz.filter((z) => z.olay === "ileri").map((z) => [z.x, z.y] as Hucre)];
}

describe("kurallar (kuralKos)", () => {
  it("sağ el kuralı Lab'daki labirentte bitirir; her karar bir dal", () => {
    const k = kuralKos(DERS_LABIRENTLERI["sag-el"], "sag-el");
    expect(k.sim.bittiMi()).toBe(true);
    expect(k.adimlar.every((a) => [0, 1, 2].includes(a.dal as number))).toBe(true);
    expect(new Set(k.adimlar.map((a) => a.dal)).size).toBe(3);
    /* adımlar izi boşluksuz örter */
    k.adimlar.forEach((a, i) => { if (i) expect(a.izBas).toBe(k.adimlar[i - 1].izSon + 1); });
    expect(k.adimlar[k.adimlar.length - 1].izSon).toBe(k.sim.iz.length - 1);
  });
  it("Lab'daki süre: kural, Lab görevinin değerlendirmesiyle aynı sonucu verir", () => {
    const g = LABIRENT_GOREVLERI.find((x) => x.kimlik === "lb-sag-el")!;
    const k = kuralKos(g.haritalar[0], "sag-el", { sureSiniri: g.sureSiniri });
    expect(k.sim.bitisZamani).toBeLessThanOrEqual(g.yildizSuresi);
  });
  it("ada: sağ el ve sol el başlangıca dönüp durur, hafızalı robot bitirir", () => {
    for (const kural of ["sag-el", "sol-el"] as const) {
      const k = kuralKos(DERS_LABIRENTLERI.ada, kural, { sureSiniri: 60 });
      expect(k.sim.bittiMi()).toBe(false);
      expect(k.sim.durdu).toBe("sure");
      expect(k.baslangicaDonus).toBeGreaterThanOrEqual(2);
    }
    const h = kuralKos(DERS_LABIRENTLERI.ada, "hafiza", { sureSiniri: 60 });
    expect(h.sim.bittiMi()).toBe(true);
    expect(h.sim.bitisZamani).toBeLessThanOrEqual(20);
  });
  it("deterministik", () => {
    expect(kuralKos(DERS_LABIRENTLERI.ada, "hafiza").sim.iz).toEqual(kuralKos(DERS_LABIRENTLERI.ada, "hafiza").sim.iz);
  });
});

describe("sisli labirent", () => {
  it("duvara gidilmez, geçilen hücreler sayılır, bitişte durur", () => {
    const s = new SisliLabirent(DERS_LABIRENTLERI["sis-1"]);
    expect(s.goruldu(0, 4)).toBe(true);
    expect(s.git(3)).toBe("duvar");
    expect(s.adim).toBe(0);
    expect(s.git(0)).toBe("gitti");
    expect(s.git(2)).toBe("gitti");
    expect(s.ziyaret.get("0,4")).toBe(2);
    expect(s.adim).toBe(2);
  });
  const yuru = (harita: readonly string[], yol: Hucre[]) => {
    const s = new SisliLabirent(harita);
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    for (let i = 1; i < yol.length && !s.bitti; i++) s.git([0, 1, 2, 3].find((y) => DX[y] === yol[i][0] - yol[i - 1][0] && DY[y] === yol[i][1] - yol[i - 1][1]) as Yon);
    return s;
  };
  it("örnek çözüm: iki labirentte el kuralıyla sistemli keşif üç yıldız", () => {
    const g = SIS_GOREVLERI["sis-1"];
    const adimlar = g.haritalar.map((h) => { const s = yuru(DERS_LABIRENTLERI[h], kuralYolu(DERS_LABIRENTLERI[h], "sag-el")); return s.bitti ? s.adim : null; });
    expect(sisYildizi(g, adimlar)).toBe(3);
    expect(g.esikler[0]).toBeGreaterThan(g.esikler[1]);
  });
  it("rastgele dolaşmak üç yıldız almaz; bitmeyen labirent yıldızsız", () => {
    const g = SIS_GOREVLERI["sis-1"];
    const rnd = rastgele(5);
    const adimlar = g.haritalar.map((h) => {
      const s = new SisliLabirent(DERS_LABIRENTLERI[h]);
      for (let i = 0; i < 5000 && !s.bitti; i++) s.git(Math.floor(rnd() * 4) as Yon);
      return s.bitti ? s.adim : null;
    });
    expect(sisYildizi(g, adimlar)).toBeLessThan(3);
    expect(sisYildizi(g, [10, null])).toBe(0);
  });
});

/** Hücre sayısı en az olan yol (BFS) */
function enKisaYol(harita: readonly string[]): Hucre[] {
  const s = new SisliLabirent(harita), h = s.h, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const onceki = new Map<string, string>(), bas = `${h.baslangic.x},${h.baslangic.y}`, kuyruk = [bas];
  onceki.set(bas, "");
  while (kuyruk.length) {
    const k = kuyruk.shift()!, [x, y] = k.split(",").map(Number);
    for (let d = 0; d < 4; d++) {
      if (s.duvarVar(x, y, d as Yon)) continue;
      const n = `${x + DX[d]},${y + DY[d]}`;
      if (!onceki.has(n)) { onceki.set(n, k); kuyruk.push(n); }
    }
  }
  const yol: Hucre[] = [];
  for (let k = `${h.bitis.x},${h.bitis.y}`; k; k = onceki.get(k)!) yol.unshift(k.split(",").map(Number) as Hucre);
  return yol;
}

describe("rota ve hız profili", () => {
  it("rota süresi Lab'daki motorla aynı", () => {
    for (const r of Object.values(HAZIR_ROTALAR)) {
      const s = simdeSur(DERS_LABIRENTLERI.hiz, r.yol);
      expect(s.bittiMi()).toBe(true);
      expect(rotaHesapla(DERS_LABIRENTLERI.hiz, r.yol).sure).toBeCloseTo(s.bitisZamani!, 9);
    }
    const en = enHizliRota(DERS_LABIRENTLERI.rota);
    expect(rotaHesapla(DERS_LABIRENTLERI.rota, en.yol).sure).toBeCloseTo(simdeSur(DERS_LABIRENTLERI.rota, en.yol).bitisZamani!, 9);
  });
  it("kısa yol yavaş, az dönüşlü uzun yol hızlı", () => {
    const k = rotaHesapla(DERS_LABIRENTLERI.hiz, HAZIR_ROTALAR.merdiven.yol), u = rotaHesapla(DERS_LABIRENTLERI.hiz, HAZIR_ROTALAR.kenar.yol);
    expect(k.hucre).toBeLessThan(u.hucre);
    expect(k.donus).toBeGreaterThan(u.donus);
    expect(u.sure).toBeLessThan(k.sure);
  });
  it("geçersiz rota reddedilir", () => {
    const m = DERS_LABIRENTLERI.hiz;
    expect(rotaHesapla(m, [[1, 5]]).gecerli).toBe(false);
    expect(rotaHesapla(m, [[0, 5], [2, 5]]).hata).toMatch(/kopuk/);
    expect(rotaHesapla(m, [[0, 5], [0, 4], [1, 4]]).hata).toMatch(/duvar/);
    const yarim = rotaHesapla(m, [[0, 5], [0, 4]]);
    expect([yarim.gecerli, yarim.tamam]).toEqual([true, false]);
  });
  it("rota görevi: en hızlı yol üç yıldız, en kısa yol bir yıldız", () => {
    const g = ROTA_GOREVLERI["rota-1"], m = DERS_LABIRENTLERI[g.harita];
    expect(rotaYildizi(g, rotaHesapla(m, enHizliRota(m).yol))).toBe(3);
    const r = rotaHesapla(m, enKisaYol(m));
    expect(r.hucre).toBe(10);
    expect(r.gecerli).toBe(true);
    expect(rotaYildizi(g, r)).toBeLessThan(3);
    expect(rotaYildizi(g, rotaHesapla(m, [[0, 5], [0, 4]]))).toBe(0);
  });
  it("hız profili: son an toplam süre, hız azami hızı geçmez, dönüşte 0", () => {
    for (const r of Object.values(HAZIR_ROTALAR)) {
      const p = hizProfili(DERS_LABIRENTLERI.hiz, r.yol);
      expect(p[p.length - 1].t).toBeCloseTo(rotaHesapla(DERS_LABIRENTLERI.hiz, r.yol).sure, 9);
      expect(Math.max(...p.map((n) => n.v))).toBeLessThanOrEqual(RIZBOT.azamiHiz);
      expect(p[p.length - 1].v).toBe(0);
    }
  });
  it("deneydeki hız ayarı Lab'ı etkilemez", () => {
    const once = kosuSuresi(5);
    const hizli = { ...RIZBOT, azamiHiz: 1.6, ivme: 4 };
    expect(rotaHesapla(DERS_LABIRENTLERI.hiz, HAZIR_ROTALAR.kenar.yol, hizli).sure).toBeLessThan(rotaHesapla(DERS_LABIRENTLERI.hiz, HAZIR_ROTALAR.kenar.yol).sure);
    expect(kosuSuresi(5)).toBe(once);
    expect(RIZBOT.azamiHiz).toBe(1);
  });
});

describe("MEB puanı", () => {
  it("motorun değerlendirmesiyle aynı", () => {
    const g = LABIRENT_GOREVLERI.find((x) => x.kimlik === "lb-meb")!;
    const k = kuralKos(g.haritalar[0], "sol-el", { sureSiniri: g.sureSiniri });
    const r = labirentDegerlendir(g, [k.sim], "");
    expect(mebPuani({ bitti: false, sure: r.sure, enUzakSatir: r.enUzakSatir })).toBe(r.puan);
    const s = kuralKos(g.haritalar[0], "sag-el", { sureSiniri: g.sureSiniri });
    const r2 = labirentDegerlendir(g, [s.sim], "");
    expect(mebPuani({ bitti: true, sure: s.sim.bitisZamani!, enUzakSatir: 16 })).toBe(r2.puan);
  });
  it("müdahale cezası ve bitiremeyen robot", () => {
    expect(mebPuani({ bitti: true, sure: 42.5, enUzakSatir: 16, mudahale: 2 })).toBe(62.5);
    expect(mebPuani({ bitti: false, sure: 90, enUzakSatir: 9 })).toBe(270);
  });
});
