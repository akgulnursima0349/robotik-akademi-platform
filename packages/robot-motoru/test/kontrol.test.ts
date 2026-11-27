import { describe, expect, it } from "vitest";
import {
  ayarKos, bosDevir, calismaDevri, donguKos, enkoderYolu, HEDEF_YAY, hedefYayDegerlendir, hizKos, hizYildizi, kareHatasi, kareSur, kareYildizi, kilitTorku,
  KIT_AYARI, kinematik, kinematikIz, MBOT2, motorGucu, motorTork, ORNEKLEME_ORNEK, orneklemeYildizi, rampaDegerlendir, rampaKos, RAMPA, SAGLAM_ORNEK, saglamDegerlendir,
  YAVAS_DONGU
} from "../src";

describe("kinematik", () => {
  it("eşit hız düz, ters hız yerinde, R = v/ω", () => {
    expect(kinematik(20, 20)).toEqual({ v: 20, w: 0, R: Infinity });
    const y = kinematik(-10, 10); expect(y.v).toBe(0); expect(y.R).toBe(0);
    const k = kinematik(16, 22); expect(k.R).toBeCloseTo(19 / (6 / MBOT2.tekerArasi), 9);
    const iz = kinematikIz(20, 20, 2); expect(iz[iz.length - 1].y).toBeCloseTo(40, 9);
  });
  it("hedefe yay: çözüm üç yıldız, düz gitmek yıldızsız", () => {
    expect(hedefYayDegerlendir(...HEDEF_YAY.cozum).yildiz).toBe(3);
    expect(hedefYayDegerlendir(20, 20).yildiz).toBe(0);
    /* çeyrek çember: sola dönmüş, batıya bakıyor */
    expect(HEDEF_YAY.hedef.aci).toBeCloseTo(Math.PI * 0.5 + (6 / MBOT2.tekerArasi) * 3, 6);
  });
});

describe("motor modeli", () => {
  it("boşta tork sıfır, kilitlenmede devir sıfır; dişli torku artırır, devri düşürür", () => {
    expect(motorTork(bosDevir())).toBeCloseTo(0, 9);
    expect(motorTork(0)).toBe(kilitTorku());
    expect(kilitTorku(7.4, 2)).toBe(2 * kilitTorku());
    expect(bosDevir(7.4, 2)).toBe(bosDevir() / 2);
    expect(calismaDevri(kilitTorku())).toBe(0);
    expect(bosDevir(3.7)).toBeCloseTo(175, 9);
    /* güç en çok yarı devirde */
    const yari = motorGucu(bosDevir() / 2);
    expect(yari).toBeGreaterThan(motorGucu(bosDevir() / 4));
    expect(yari).toBeGreaterThan(motorGucu((bosDevir() * 3) / 4));
  });
  it("rampa: yüksek oran yavaş, düşük oran dik rampada zorlanır; en iyi oran üç yıldız", () => {
    const dik = RAMPA.rampalar[1];
    expect(rampaKos(4, dik).cikti).toBe(true);
    expect(rampaKos(0.5, dik).sure).toBeGreaterThan(rampaKos(1, dik).sure);
    expect(rampaDegerlendir(0.75).yildiz).toBe(3);
    expect(rampaDegerlendir(4).yildiz).toBe(1);
    expect(rampaKos(0.1, { uzunluk: 0.4, aci: 30 }).cikti).toBe(false);
  });
});

describe("PID hız kontrolü", () => {
  it("yalnız P kalıcı hata bırakır, I kapatır", () => {
    const p = hizKos({ kp: 1, ki: 0, kd: 0, sinirlama: true });
    expect(p.olcut.kalici).toBeGreaterThan(10);
    expect(hizYildizi(p.olcut)).toBe(0);
    const pi = hizKos({ kp: 1, ki: 12, kd: 0, sinirlama: true });
    expect(pi.olcut.kalici).toBeLessThan(1);
    expect(hizYildizi(pi.olcut)).toBe(3);
  });
  it("sınırlama aşırı birikmeyi azaltır", () => {
    const a = hizKos({ kp: 0.8, ki: 10, kd: 0, sinirlama: false }).olcut.asma, b = hizKos({ kp: 0.8, ki: 10, kd: 0, sinirlama: true }).olcut.asma;
    expect(a).toBeGreaterThan(b);
  });
  it("güç ±100 ile sınırlı; yük devri düşürür", () => {
    const k = hizKos({ kp: 5, ki: 0, kd: 0, sinirlama: true });
    expect(Math.max(...k.guc)).toBeLessThanOrEqual(100);
    const yuksuz = hizKos({ kp: 1, ki: 0, kd: 0, sinirlama: true }, false), yuklu = hizKos({ kp: 1, ki: 0, kd: 0, sinirlama: true });
    expect(yuksuz.devir[yuksuz.devir.length - 1]).toBeGreaterThan(yuklu.devir[yuklu.devir.length - 1] + 10);
  });
});

describe("örnekleme ve gecikme", () => {
  it("10 ms ve gecikmesiz sarmalayıcı, Lab'daki ayar koşusuyla aynı", () => {
    const a = ayarKos("s-viraj", KIT_AYARI), b = donguKos(KIT_AYARI, { ornekleme: 10, gecikme: 0 });
    expect([b.durum, b.sure]).toEqual([a.sonuc.durum, a.sonuc.sure]);
  });
  it("kit ayarı yavaş döngüde bitiremez; örnek ayar üç yıldız", () => {
    expect(donguKos(KIT_AYARI, YAVAS_DONGU).durum).not.toBe("bitti");
    expect(orneklemeYildizi(donguKos(ORNEKLEME_ORNEK, YAVAS_DONGU))).toBe(3);
  });
  it("gecikme büyüyünce salınım (sapma) artar", () => {
    const a = { taban: 140, kp: 0.02, kd: 0.2 };
    const s0 = donguKos(a, { ornekleme: 10, gecikme: 0 }), s1 = donguKos(a, { ornekleme: 10, gecikme: 30 });
    expect(s1.ortSapma).toBeGreaterThan(s0.ortSapma);
  });
  it("sağlam ayar: örnek üç sürümde de bitirir, kit ayarı bitiremez", () => {
    expect(saglamDegerlendir(SAGLAM_ORNEK).yildiz).toBe(3);
    expect(saglamDegerlendir(KIT_AYARI).yildiz).toBe(0);
  });
});

describe("enkoder ve odometri", () => {
  it("bir tur = çevre; hatasız robotta kare kapanır", () => {
    expect(enkoderYolu(360)).toBeCloseTo(Math.PI * 6.4, 9);
    const N1 = (50 / (Math.PI * 6.4)) * 360, N2 = ((MBOT2.tekerArasi / 2) * (Math.PI / 2) / (Math.PI * 6.4)) * 360;
    const h = kareHatasi(kareSur(N1, N2).son);
    expect(h.mesafe).toBeLessThan(1e-6); expect(h.yon).toBeLessThan(1e-6);
  });
  it("teker çapı farkı hatayı biriktirir", () => {
    const h = kareHatasi(kareSur(895, 162, { capSol: 6.4, capSag: 6.3, tekerArasi: 11.5 }).son);
    expect(h.mesafe).toBeGreaterThan(3);
  });
  it("kareyi kapat: tam sayı derecelerle üç yıldız", () => {
    expect(kareYildizi(895, 162).yildiz).toBe(3);
    expect(kareYildizi(1000, 162).yildiz).toBeLessThan(2);
    expect(kareYildizi(895, 180).yildiz).toBeLessThan(3);
  });
});
