/* Lise · Kontrol modülünün hesapları (mBot2). Hepsi deterministik ve zaman alanında, adım adım.
   - Diferansiyel sürüş kinematiği ve "hedefe yay" görevi
   - DC motor modeli (tork–devir doğrusu), dişli oranı ve "rampayı çık" görevi
   - Enkoderli motorda PID hız kontrolü (I terimi, sınırlama) ve "yükte hız tut" görevi
   - Çizgi izlemede örnekleme ve gecikme (Çizgi İzleyen modülünün robot modeliyle; Lab sonuçları değişmez)
   - Enkoder ve odometri, "kareyi kapat" görevi
   - Simülasyondan gerçeğe: aynı ayarın farklı robot sürümlerinde denenmesi
   Değerler "yaklaşık"tır; mBot2 ve 180 enkoderli motorun ürün bilgisindeki değerler kaynağıyla kullanılır. */
import { Pist, siroBeyni, turKos, type CizgiBeyni, type CizgiSonucu } from "./cizgi";
import { AYAR_PISTLERI } from "./cizgi-ayar";

/** mBot2 (yaklaşık ölçüler): teker 64 mm lastik, iki teker arası ≈ 11,5 cm; enkoder 1° algılar; 1–200 dev/dk */
export const MBOT2 = { tekerCapi: 6.4, tekerArasi: 11.5, azamiDevir: 200, enkoder: 1 } as const;

/* ---------- 1 · diferansiyel sürüş ---------- */
export interface Kinematik { v: number; w: number; R: number }
/** v (cm/sn), w (rad/sn, + sola), R (cm; düz gidişte sonsuz) */
export function kinematik(vSol: number, vSag: number, L: number = MBOT2.tekerArasi): Kinematik {
  const v = (vSol + vSag) / 2, w = (vSag - vSol) / L;
  return { v, w, R: w === 0 ? Infinity : v / w };
}
export interface Poz2 { x: number; y: number; aci: number }
/** Matematik ekseni (y yukarı, açı saat yönünün tersine). Kapalı formülle örneklenmiş iz. */
export function kinematikIz(vSol: number, vSag: number, sure: number, bas: Poz2 = { x: 0, y: 0, aci: Math.PI / 2 }, n = 60, L: number = MBOT2.tekerArasi): Poz2[] {
  const { v, w } = kinematik(vSol, vSag, L);
  const r: Poz2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (sure * i) / n, a = bas.aci + w * t;
    if (Math.abs(w) < 1e-9) r.push({ x: bas.x + v * t * Math.cos(bas.aci), y: bas.y + v * t * Math.sin(bas.aci), aci: a });
    else r.push({ x: bas.x + (v / w) * (Math.sin(a) - Math.sin(bas.aci)), y: bas.y - (v / w) * (Math.cos(a) - Math.cos(bas.aci)), aci: a });
  }
  return r;
}
const aciFarki = (a: number, b: number) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
export const derece = (r: number) => (r * 180) / Math.PI;
/** Hedefe yay: robot (0, 0)'dan yukarı bakarak çıkar; sabit teker hızlarıyla `sure` saniyede hedef konum ve yöne varmalı */
export const HEDEF_YAY = (() => {
  const sure = 3, cozum: [number, number] = [16, 22];
  const son = kinematikIz(cozum[0], cozum[1], sure).pop()!;
  return { sure, hedef: { x: +son.x.toFixed(1), y: +son.y.toFixed(1), aci: ((son.aci % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) }, aralik: { en: -30, ust: 30, adim: 1 }, cozum };
})();
export function hedefYayDegerlendir(vSol: number, vSag: number): { mesafe: number; yonHatasi: number; yildiz: 0 | 1 | 2 | 3; iz: Poz2[] } {
  const iz = kinematikIz(vSol, vSag, HEDEF_YAY.sure), son = iz[iz.length - 1];
  const mesafe = Math.hypot(son.x - HEDEF_YAY.hedef.x, son.y - HEDEF_YAY.hedef.y), yonHatasi = derece(aciFarki(son.aci, HEDEF_YAY.hedef.aci));
  const yildiz = mesafe <= 1.5 && yonHatasi <= 5 ? 3 : mesafe <= 5 && yonHatasi <= 15 ? 2 : mesafe <= 12 ? 1 : 0;
  return { mesafe, yonHatasi, yildiz, iz };
}

/* ---------- 4 · DC motor modeli ---------- */
/** Makeblock 180 enkoderli motor (mBot2): 7,4 V, boşta 350 dev/dk, başlangıç (kilitlenme) torku 5 kg·cm */
export const MOTOR180 = { gerilim: 7.4, bosDevir: 350, kilitTork: 5 } as const;
/** Çıkış milinde tork (kg·cm), ek dişli oranı n (n > 1 yavaşlatır, torku artırır), gerilim V. Kayıpsız doğrusal model. */
export function motorTork(devir: number, V: number = MOTOR180.gerilim, n = 1): number {
  const o = V / MOTOR180.gerilim, w0 = (MOTOR180.bosDevir * o) / n, ts = MOTOR180.kilitTork * o * n;
  return Math.max(0, ts * (1 - devir / w0));
}
export const bosDevir = (V: number = MOTOR180.gerilim, n = 1) => (MOTOR180.bosDevir * V) / MOTOR180.gerilim / n;
export const kilitTorku = (V: number = MOTOR180.gerilim, n = 1) => (MOTOR180.kilitTork * V) / MOTOR180.gerilim * n;
/** Mekanik güç (W): tork (kg·cm → N·m) × açısal hız (dev/dk → rad/sn) */
export const motorGucu = (devir: number, V: number = MOTOR180.gerilim, n = 1) => motorTork(devir, V, n) * 0.0980665 * ((devir * 2 * Math.PI) / 60);
/** Yük torkunda (kg·cm) çalışma noktası: devir */
export const calismaDevri = (yuk: number, V: number = MOTOR180.gerilim, n = 1) => Math.max(0, bosDevir(V, n) * (1 - yuk / kilitTorku(V, n)));

/** Rampayı çık: yük taşıyan mBot2 (toplam kütle), iki motor; teker yarıçapı 3,2 cm; yuvarlanma direnci küçük */
export const RAMPA = { kutle: 2.5, tekerYaricap: 0.032, yuvarlanma: 0.03, rampalar: [{ ad: "Uzun rampa", uzunluk: 1.2, aci: 8 }, { ad: "Dik rampa", uzunluk: 0.4, aci: 30 }], aralik: { en: 0.5, ust: 4, adim: 0.25 } } as const;
export interface RampaKosusu { cikti: boolean; sure: number; iz: { t: number; x: number; v: number }[] }
export function rampaKos(n: number, rampa: { uzunluk: number; aci: number }, V: number = MOTOR180.gerilim): RampaKosusu {
  const g = 9.81, m = RAMPA.kutle, r = RAMPA.tekerYaricap, a = (rampa.aci * Math.PI) / 180;
  const dt = 0.002;
  let x = 0, v = 0;
  const iz: RampaKosusu["iz"] = [{ t: 0, x: 0, v: 0 }];
  for (let k = 1; k * dt <= 20; k++) {
    const devir = ((v / r) * 60) / (2 * Math.PI);
    const tork = 2 * motorTork(devir, V, n) * 0.0980665;           // iki motor, N·m
    const F = tork / r - m * g * Math.sin(a) - RAMPA.yuvarlanma * m * g * Math.cos(a);
    v = Math.max(0, v + (F / m) * dt);
    x += v * dt;
    if (k % 25 === 0) iz.push({ t: +(k * dt).toFixed(3), x, v });
    if (x >= rampa.uzunluk) { iz.push({ t: k * dt, x, v }); return { cikti: true, sure: +(k * dt).toFixed(2), iz }; }
    if (v === 0 && F <= 0) return { cikti: false, sure: Infinity, iz };
  }
  return { cikti: false, sure: Infinity, iz };
}
export function rampaDegerlendir(n: number): { kosular: RampaKosusu[]; toplam: number; yildiz: 0 | 1 | 2 | 3 } {
  const kosular = RAMPA.rampalar.map((r) => rampaKos(n, r));
  const toplam = kosular.every((k) => k.cikti) ? +kosular.reduce((t, k) => t + k.sure, 0).toFixed(2) : Infinity;
  const [e2, e3] = RAMPA_ESIKLERI;
  return { kosular, toplam, yildiz: toplam === Infinity ? 0 : toplam <= e3 ? 3 : toplam <= e2 ? 2 : 1 };
}
/** 2 ve 3 yıldız eşikleri: en iyi oranın süresinden */
export const RAMPA_ESIKLERI: [number, number] = (() => {
  let en = Infinity;
  for (let n = RAMPA.aralik.en; n <= RAMPA.aralik.ust + 1e-9; n += RAMPA.aralik.adim) {
    const k = RAMPA.rampalar.map((r) => rampaKos(n, r));
    if (k.every((x) => x.cikti)) en = Math.min(en, k.reduce((t, x) => t + x.sure, 0));
  }
  return [+(en * 1.25).toFixed(2), +(en + 0.05).toFixed(2)];
})();

/* ---------- 2 · PID hız kontrolü (enkoderli motor) ---------- */
/** Motor ve teker: birinci dereceden model. Güç %u → hedeflenen devir K·u; zaman sabiti T; yük devri düşürür. */
export const HIZ_MODELI = { K: 3.5, T: 0.12, dt: 0.01, sure: 3.5, hedef: 150, yukAni: 1.5, yuk: 90 } as const;
export interface PidAyari { kp: number; ki: number; kd: number; sinirlama: boolean }
export interface HizKosusu { t: number[]; devir: number[]; guc: number[]; olcut: HizOlcutu }
export interface HizOlcutu { asma: number; oturma: number; toparlanma: number; kalici: number }
export function hizKos(a: PidAyari, yukVar = true): HizKosusu {
  const { K, T, dt, sure, hedef, yukAni, yuk } = HIZ_MODELI;
  let w = 0, top = 0, sonHata: number = hedef;
  const t: number[] = [], devir: number[] = [], guc: number[] = [];
  for (let k = 0; k * dt <= sure + 1e-9; k++) {
    const zaman = +(k * dt).toFixed(3);
    const e = hedef - w;
    let u = a.kp * e + a.ki * top + a.kd * ((e - sonHata) / dt);
    const doygun = u > 100 || u < -100;
    u = Math.max(-100, Math.min(100, u));
    /* sınırlama (anti-windup): çıkış doymuşken ve hata aynı yöndeyken integral birikmez */
    if (!(a.sinirlama && doygun && Math.sign(e) === Math.sign(u))) top += e * dt;
    sonHata = e;
    t.push(zaman); devir.push(w); guc.push(u);
    const d = yukVar && zaman >= yukAni ? yuk : 0;
    w += ((K * u - d - w) / T) * dt;
  }
  return { t, devir, guc, olcut: hizOlcut(t, devir) };
}
function hizOlcut(t: number[], w: number[]): HizOlcutu {
  const { hedef, yukAni, sure } = HIZ_MODELI, bant = hedef * 0.05;
  const once = t.map((x, i) => [x, w[i]] as const).filter(([x]) => x < yukAni);
  const asma = Math.max(0, (Math.max(...once.map(([, v]) => v)) - hedef) / hedef) * 100;
  let oturma = 0; for (const [x, v] of once) if (Math.abs(v - hedef) > bant) oturma = x + HIZ_MODELI.dt;
  const sonra = t.map((x, i) => [x, w[i]] as const).filter(([x]) => x >= yukAni);
  let toparlanma = 0; for (const [x, v] of sonra) if (Math.abs(v - hedef) > bant) toparlanma = x + HIZ_MODELI.dt - yukAni;
  const son = sonra.filter(([x]) => x >= sure - 0.5);
  const kalici = son.reduce((s, [, v]) => s + Math.abs(hedef - v), 0) / son.length;
  return { asma: +asma.toFixed(1), oturma: +oturma.toFixed(2), toparlanma: +toparlanma.toFixed(2), kalici: +kalici.toFixed(1) };
}
export const HIZ_ESIKLERI = { kalici: 3, asma: 5, oturma: 0.25, toparlanma: 0.2 } as const;
export function hizYildizi(o: HizOlcutu): 0 | 1 | 2 | 3 {
  if (o.kalici > HIZ_ESIKLERI.kalici) return 0;
  if (o.asma > HIZ_ESIKLERI.asma) return 1;
  return o.oturma <= HIZ_ESIKLERI.oturma && o.toparlanma <= HIZ_ESIKLERI.toparlanma ? 3 : 2;
}

/* ---------- 3 ve 6 · örnekleme, gecikme ve robot sürümleri (çizgi izleme) ---------- */
export interface CizgiAyari { taban: number; kp: number; kd: number }
export interface DonguAyari {
  /** kontrol döngüsünün çalışma aralığı (ms, 10'un katı) */
  ornekleme: number;
  /** ölçümle motor komutu arasındaki gecikme (ms, 10'un katı) */
  gecikme: number;
  /** motorların ek tepki süresi (sn): ağır robot */
  suzgec?: number;
  /** pil zayıfken motor gücü çarpanı */
  olcek?: number;
}
/** Kitin bloğu (siroBeyni) örnekleme ve gecikmeyle sarılır. Robot fiziği ve sensörler değişmez. */
export function ornekliBeyin(beyin: CizgiBeyni, d: DonguAyari): CizgiBeyni {
  const her = Math.max(1, Math.round(d.ornekleme / 10)), bekle = Math.max(0, Math.round(d.gecikme / 10));
  let tik = 0, son: [number, number] = [0, 0], cikis: [number, number] = [0, 0];
  const kuyruk: [number, number][] = [];
  return (o) => {
    if (tik++ % her === 0) son = beyin(o).map(Number) as [number, number];
    kuyruk.push(son);
    const hazir = kuyruk.length > bekle ? kuyruk.shift()! : [0, 0] as [number, number];
    const k = d.olcek ?? 1;
    const hedef: [number, number] = [hazir[0] * k, hazir[1] * k];
    if (d.suzgec && d.suzgec > 0) { const a = 0.01 / (d.suzgec + 0.01); cikis = [cikis[0] + a * (hedef[0] - cikis[0]), cikis[1] + a * (hedef[1] - cikis[1])]; }
    else cikis = hedef;
    return [Math.round(cikis[0]), Math.round(cikis[1])];
  };
}
export const KONTROL_PISTI = "s-viraj";
export function donguKos(a: CizgiAyari, d: DonguAyari, pistAdi = KONTROL_PISTI): CizgiSonucu {
  const p = AYAR_PISTLERI[pistAdi];
  return turKos(new Pist(p.pist, p.zemin), ornekliBeyin(siroBeyni({ ...a, ek: 0, zemin: p.zemin }), d), p.sureSiniri);
}
/** Ders 3 görevi: döngü 20 ms'de bir çalışıyor (yavaş kart); pisti bitiren en hızlı ayar */
export const YAVAS_DONGU: DonguAyari = { ornekleme: 20, gecikme: 0 };
export const ORNEKLEME_ARALIKLARI = { taban: { en: 40, ust: 255, adim: 5 }, kp: { en: 0, ust: 0.12, adim: 0.005 }, kd: { en: 0, ust: 1.5, adim: 0.05 } } as const;
/** 2 ve 3 yıldız için en çok süre (sn); örnek ayar (180, 0,01, 0,4) 3,59 sn */
export const ORNEKLEME_ESIKLERI: [number, number] = [6, 4];
export function orneklemeYildizi(s: CizgiSonucu): 0 | 1 | 2 | 3 {
  if (s.durum !== "bitti") return 0;
  return s.sure <= ORNEKLEME_ESIKLERI[1] ? 3 : s.sure <= ORNEKLEME_ESIKLERI[0] ? 2 : 1;
}
/** Ders 6: üç robot sürümü */
export const SURUMLER: { ad: string; aciklama: string; dongu: DonguAyari }[] = [
  { ad: "Simülasyondaki robot", aciklama: "Modeldeki gibi: 10 ms döngü, gecikme yok.", dongu: { ornekleme: 10, gecikme: 0 } },
  { ad: "Ağır robot", aciklama: "Üstüne pil ve sensör eklendi: motorlar 0,08 sn geç tepki veriyor.", dongu: { ornekleme: 10, gecikme: 0, suzgec: 0.08 } },
  { ad: "Zayıf pil ve yavaş kart", aciklama: "Pil %80 güç veriyor, döngü 20 ms'de bir çalışıyor.", dongu: { ornekleme: 20, gecikme: 0, olcek: 0.8 } }
];
/** 2 ve 3 yıldız için en kötü süre (sn); örnek ayar (160, 0,01, 0,2) en kötü 3,76 sn */
export const SAGLAM_ESIKLERI: [number, number] = [6, 4.2];
export function saglamDegerlendir(a: CizgiAyari): { sonuclar: CizgiSonucu[]; enKotu: number; yildiz: 0 | 1 | 2 | 3 } {
  const sonuclar = SURUMLER.map((s) => donguKos(a, s.dongu));
  const enKotu = sonuclar.every((s) => s.durum === "bitti") ? Math.max(...sonuclar.map((s) => s.sure)) : Infinity;
  return { sonuclar, enKotu, yildiz: enKotu === Infinity ? 0 : enKotu <= SAGLAM_ESIKLERI[1] ? 3 : enKotu <= SAGLAM_ESIKLERI[0] ? 2 : 1 };
}

/* ---------- 5 · enkoder ve odometri ---------- */
export interface RobotGercegi { capSol: number; capSag: number; tekerArasi: number }
export const NOMINAL: RobotGercegi = { capSol: MBOT2.tekerCapi, capSag: MBOT2.tekerCapi, tekerArasi: MBOT2.tekerArasi };
/** Teker açısından (derece) yol (cm) */
export const enkoderYolu = (derece: number, cap: number = MBOT2.tekerCapi) => (Math.PI * cap * derece) / 360;
/** Kare: dört kez "düz N1 derece, sola dön N2 derece (teker ters yönde)" */
export function kareSur(N1: number, N2: number, g: RobotGercegi = NOMINAL): { iz: Poz2[]; son: Poz2 } {
  let p: Poz2 = { x: 0, y: 0, aci: Math.PI / 2 };
  const iz: Poz2[] = [{ ...p }];
  const hareket = (dSol: number, dSag: number, adim = 30) => {
    for (let i = 0; i < adim; i++) {
      const sl = dSol / adim, sg = dSag / adim, ds = (sl + sg) / 2, da = (sg - sl) / g.tekerArasi;
      p = { x: p.x + ds * Math.cos(p.aci + da / 2), y: p.y + ds * Math.sin(p.aci + da / 2), aci: p.aci + da };
      iz.push({ ...p });
    }
  };
  for (let k = 0; k < 4; k++) {
    hareket(enkoderYolu(N1, g.capSol), enkoderYolu(N1, g.capSag));
    hareket(-enkoderYolu(N2, g.capSol), enkoderYolu(N2, g.capSag), 12);
  }
  return { iz, son: p };
}
export function kareHatasi(son: Poz2): { mesafe: number; yon: number } {
  return { mesafe: Math.hypot(son.x, son.y), yon: derece(aciFarki(son.aci, Math.PI / 2)) };
}
export const KARE = { kenar: 50, N1: { en: 500, ust: 1300 }, N2: { en: 60, ust: 300 } } as const;
export function kareYildizi(N1: number, N2: number): { yildiz: 0 | 1 | 2 | 3; mesafe: number; yon: number; kenar: number } {
  const { son } = kareSur(N1, N2), h = kareHatasi(son), kenar = enkoderYolu(N1);
  const kenarHatasi = Math.abs(kenar - KARE.kenar);
  const yildiz = h.mesafe <= 0.5 && h.yon <= 2 && kenarHatasi <= 0.5 ? 3 : h.mesafe <= 2 && h.yon <= 6 && kenarHatasi <= 2 ? 2 : h.mesafe <= 6 && h.yon <= 15 && kenarHatasi <= 5 ? 1 : 0;
  return { yildiz, ...h, kenar };
}

/* ---------- eşikler: örnek ayarların sürelerinden ---------- */
export const ORNEKLEME_ORNEK: CizgiAyari = { taban: 180, kp: 0.01, kd: 0.4 };
export const SAGLAM_ORNEK: CizgiAyari = { taban: 160, kp: 0.01, kd: 0.2 };
/** Çizgi İzleyen modülündeki kit değerleri: hızlı döngüde bitirir, yavaş döngüde bitiremez */
export const KIT_AYARI: CizgiAyari = { taban: 100, kp: 0.04, kd: 0.7 };
