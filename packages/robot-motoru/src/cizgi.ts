/* Çizgi izleyen robot simülasyonu (SiroLine Full PCB, akademinin sınıftaki robotu).
   Birim: milimetre ve saniye. Diferansiyel sürüş, motor gecikmesi, 8 kızılötesi sensör.
   Deterministik: sensör gürültüsü sabit tohumlu; aynı kod → aynı tur. */
import { rastgele } from "./izgara";

/* ---------- robot ölçüleri (sınıftaki robot, dijital kumpasla: teker 36,1 mm, iki teker arası 99,2 mm, arka gövde 94,1 mm) ---------- */
export const SIROLINE = {
  izGenisligi: 125,   // iki tekerleğin merkezleri arası (mm): 99,2 iç açıklık + 26 lastik eni
  tekerCap: 36,       // lastik çapı (mm); kumpasla 36,1 (kitin enkoder bloğunda 3,7 cm)
  sensorOnde: 154,    // QTR-8A dizisinin aks merkezinden uzaklığı (mm)
  sensorAralik: 9.525, // QTR-8A: komşu sensörler arası 0,375 inç (mm)
  sensorSayisi: 8,
  motorDevir: 2000,   // "Speed TT" metal dişli yarış motoru: 2000–2500 devir/dk (ürün sayfası); yükte alt sınır
  azamiHiz: 2000 / 60 * Math.PI * 36, // 255 PWM'de tekerlek hızı ≈ 3770 mm/sn
  oluBolge: 25,       // bu PWM'in altında motor dönmez
  gecikme: 0.07       // motor ve gövde tepki süresi sabiti (sn): hafif gövde, hızlı motor

} as const;
export const CIZGI_GENISLIGI = 19;     // siyah bant (mm)
export const FIZIK_ADIMI = 0.0025;     // sn
export const DONGU_ARALIGI = 0.01;     // çocuğun dongu() çağrısı (sn); hızlı robotta sık karar gerekir
const KONTROL_ORANI = Math.round(DONGU_ARALIGI / FIZIK_ADIMI);

export type Nokta = [number, number];
export type PistParca = { tur: "duz"; uzunluk: number } | { tur: "yay"; yaricap: number; aci: number /* derece, + sola */ };
export type PistTanimi = { parcalar: PistParca[] } | { noktalar: Nokta[] };
/** Zemin rengi: "beyaz" = beyaz halı, siyah bant (yarışma standardı); "siyah" = siyah zemin, beyaz bant (akademinin sınıf pisti) */
export type Zemin = "beyaz" | "siyah";

/* ---------- pist ---------- */
export class Pist {
  /** 2 mm aralıkla örneklenmiş kapalı orta çizgi */
  readonly yol: Nokta[];
  readonly uzunluk: number;
  readonly sinir: { x0: number; y0: number; x1: number; y1: number };
  private izgara = new Map<string, number[]>();
  private static HUCRE = 40;

  constructor(t: PistTanimi, readonly zemin: Zemin = "beyaz", readonly kenarPayi = 260) {
    const ham = "parcalar" in t ? parcalardan(t.parcalar) : splineDan(t.noktalar);
    this.yol = esitAralikla(ham, 2);
    this.uzunluk = this.yol.length * 2;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    this.yol.forEach(([x, y], i) => {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      const k = this.anahtar(x, y);
      (this.izgara.get(k) ?? this.izgara.set(k, []).get(k)!).push(i);
    });
    this.sinir = { x0: x0 - kenarPayi, y0: y0 - kenarPayi, x1: x1 + kenarPayi, y1: y1 + kenarPayi };
  }
  private anahtar(x: number, y: number) { return Math.floor(x / Pist.HUCRE) + "," + Math.floor(y / Pist.HUCRE); }

  /** Bir noktanın çizgi ortasına uzaklığı (mm); 80 mm'den uzaksa yaklaşık en yakın örnek. */
  uzaklik(x: number, y: number): number {
    const cx = Math.floor(x / Pist.HUCRE), cy = Math.floor(y / Pist.HUCRE);
    let en = Infinity, enI = -1;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const l = this.izgara.get((cx + dx) + "," + (cy + dy)); if (!l) continue;
      for (const i of l) { const [px, py] = this.yol[i]; const d = (px - x) ** 2 + (py - y) ** 2; if (d < en) { en = d; enI = i; } }
    }
    if (enI < 0) return 1e9;
    /* en yakın iki parçaya dik uzaklık */
    const n = this.yol.length;
    return Math.min(parcayaUzaklik(x, y, this.yol[enI], this.yol[(enI + 1) % n]), parcayaUzaklik(x, y, this.yol[(enI - 1 + n) % n], this.yol[enI]));
  }

  /** İşaretli uzaklık (mm): nokta yolun solundaysa artı, sağındaysa eksi. */
  isaretliUzaklik(x: number, y: number): number {
    const d = this.uzaklik(x, y);
    const cx = Math.floor(x / Pist.HUCRE), cy = Math.floor(y / Pist.HUCRE);
    let en = Infinity, enI = 0;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const l = this.izgara.get((cx + dx) + "," + (cy + dy)); if (!l) continue;
      for (const i of l) { const [px, py] = this.yol[i]; const e = (px - x) ** 2 + (py - y) ** 2; if (e < en) { en = e; enI = i; } }
    }
    const a = this.yol[enI], b = this.yol[(enI + 1) % this.yol.length];
    const capraz = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    return capraz >= 0 ? d : -d;
  }

  /** Yol üzerindeki en yakın örneğin sırası; `onceki` verilirse yalnızca onun çevresinde arar (kısa yoldan atlamayı önler). */
  izdusum(x: number, y: number, onceki: number, pencere = 150): number {
    const n = this.yol.length; let en = Infinity, enI = onceki;
    for (let k = -pencere; k <= pencere; k++) {
      const i = (onceki + k + n) % n; const [px, py] = this.yol[i];
      const d = (px - x) ** 2 + (py - y) ** 2; if (d < en) { en = d; enI = i; }
    }
    return enI;
  }

  baslangic(): { x: number; y: number; yon: number } {
    const [x, y] = this.yol[0], [x2, y2] = this.yol[5];
    return { x, y, yon: Math.atan2(y2 - y, x2 - x) };
  }
}

function parcayaUzaklik(x: number, y: number, a: Nokta, b: Nokta) {
  const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy;
  const t = l ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / l)) : 0;
  return Math.hypot(x - (a[0] + t * vx), y - (a[1] + t * vy));
}

function parcalardan(p: PistParca[]): Nokta[] {
  let x = 0, y = 0, yon = 0; const n: Nokta[] = [[0, 0]];
  for (const s of p) {
    if (s.tur === "duz") {
      const adim = Math.ceil(s.uzunluk / 2);
      for (let i = 1; i <= adim; i++) n.push([x + Math.cos(yon) * s.uzunluk * i / adim, y + Math.sin(yon) * s.uzunluk * i / adim]);
      x += Math.cos(yon) * s.uzunluk; y += Math.sin(yon) * s.uzunluk;
    } else {
      const a = s.aci * Math.PI / 180, isaret = Math.sign(a), adim = Math.ceil(Math.abs(a) * s.yaricap / 2);
      const mx = x - Math.sin(yon) * s.yaricap * isaret, my = y + Math.cos(yon) * s.yaricap * isaret;
      const bas = Math.atan2(y - my, x - mx);
      for (let i = 1; i <= adim; i++) { const t = bas + a * i / adim; n.push([mx + Math.cos(t) * s.yaricap, my + Math.sin(t) * s.yaricap]); }
      [x, y] = n[n.length - 1]; yon += a;
    }
  }
  if (Math.hypot(x, y) < 3) n.pop(); // kapanış noktası başlangıçla aynı
  return n;
}

/** Kapalı, merkezcil Catmull-Rom eğrisi (kendi üstüne düğüm atmaz). */
function splineDan(p: Nokta[]): Nokta[] {
  const n = p.length, out: Nokta[] = [];
  const t = (a: Nokta, b: Nokta, ti: number) => ti + Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1]));
  for (let i = 0; i < n; i++) {
    const P0 = p[(i - 1 + n) % n], P1 = p[i], P2 = p[(i + 1) % n], P3 = p[(i + 2) % n];
    const t0 = 0, t1 = t(P0, P1, t0), t2 = t(P1, P2, t1), t3 = t(P2, P3, t2);
    const adim = Math.max(8, Math.ceil(Math.hypot(P2[0] - P1[0], P2[1] - P1[1]) / 2));
    for (let k = 0; k < adim; k++) {
      const tt = t1 + (t2 - t1) * k / adim;
      const L = (a: Nokta, b: Nokta, ta: number, tb: number): Nokta => [((tb - tt) * a[0] + (tt - ta) * b[0]) / (tb - ta), ((tb - tt) * a[1] + (tt - ta) * b[1]) / (tb - ta)];
      const A1 = L(P0, P1, t0, t1), A2 = L(P1, P2, t1, t2), A3 = L(P2, P3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  return out;
}

/** Kapalı çok-çizgiyi eşit aralıklı noktalara böler. */
function esitAralikla(p: Nokta[], aralik: number): Nokta[] {
  const out: Nokta[] = [p[0]]; let kalan = aralik;
  for (let i = 0; i < p.length; i++) {
    let [ax, ay] = p[i]; const [bx, by] = p[(i + 1) % p.length];
    let d = Math.hypot(bx - ax, by - ay);
    while (d >= kalan) {
      const r = kalan / d; ax += (bx - ax) * r; ay += (by - ay) * r; out.push([ax, ay]);
      d -= kalan; kalan = aralik;
    }
    kalan -= d;
  }
  if (Math.hypot(out[out.length - 1][0] - out[0][0], out[out.length - 1][1] - out[0][1]) < aralik * 0.5) out.pop();
  return out;
}

/* ---------- robot ve tur ---------- */
export interface CizgiKaresi {
  t: number; x: number; y: number; yon: number;
  sol: number; sag: number;               // çocuğun verdiği PWM
  sensor: number[];                       // 8 değer, 0–1000
  solTeker: number; sagTeker: number;     // tekerleğin aldığı yol (mm) → dönüş açısı
  ilerleme: number;                       // 0–1
  sapma: number;                          // sensör dizisi ortasının çizgiye işaretli uzaklığı (mm), solda artı
}
export type CizgiDurum = "bitti" | "cikti" | "sure" | "hata";
export interface CizgiSonucu {
  durum: CizgiDurum; sure: number; ilerleme: number; kareler: CizgiKaresi[]; hata?: string; ortSapma: number;
  /** başlangıç bloğunun kaldırıldığı an (sn); süre bu andan ölçülür */
  baslangic: number;
}
export interface CizgiOkuma { sensorler: number[]; konum: number; sure: number }
/** Her 10 ms'de çağrılır; [sol, sağ] PWM döndürür. */
export type CizgiBeyni = (o: CizgiOkuma) => [number, number];

export class CizgiRobotu {
  x: number; y: number; yon: number;
  vSol = 0; vSag = 0; solTeker = 0; sagTeker = 0;
  private gurultu: () => number;
  private sonKonum = 0;

  constructor(readonly pist: Pist, tohum = 7) {
    const b = pist.baslangic(); this.x = b.x; this.y = b.y; this.yon = b.yon;
    this.gurultu = rastgele(tohum);
  }

  /** i. sensörün dünyadaki konumu (0 en solda) */
  sensorKonumu(i: number): Nokta {
    const ileri = SIROLINE.sensorOnde, yan = (3.5 - i) * SIROLINE.sensorAralik; // + sola
    const c = Math.cos(this.yon), s = Math.sin(this.yon);
    return [this.x + c * ileri - s * yan, this.y + s * ileri + c * yan];
  }

  sensorler(): number[] {
    const out: number[] = [];
    for (let i = 0; i < SIROLINE.sensorSayisi; i++) {
      const [sx, sy] = this.sensorKonumu(i);
      const d = this.pist.uzaklik(sx, sy);
      const ortu = Math.max(0, Math.min(1, (CIZGI_GENISLIGI / 2 - d) / 8 + 0.5)); // sensörün ~8 mm'lik görüş alanı
      const g = (this.gurultu() - 0.5) * 30;
      /* QTR: koyu yüzey büyük sayı. Beyaz zeminde bant siyah, siyah zeminde bant beyaz. */
      const koyuluk = this.pist.zemin === "beyaz" ? ortu : 1 - ortu;
      out.push(Math.round(Math.max(0, Math.min(1000, 45 + 905 * koyuluk + g))));
    }
    return out;
  }

  /** QTR kütüphanesindeki gibi ağırlıklı konum: -100 (çizgi solda) … 100 (sağda). Çizgi görünmezse son gördüğü taraf. */
  /** Bandın sensördeki payı (0–1000): zemin rengine göre çevrilmiş okuma */
  cizgiPayi(s: number[]): number[] { return this.pist.zemin === "beyaz" ? s : s.map((v) => 1000 - v); }

  konum(ham: number[]): number {
    const s = this.cizgiPayi(ham);
    let top = 0, agir = 0;
    s.forEach((v, i) => { if (v > 200) { top += v; agir += v * i; } });
    if (top < 300) return this.sonKonum < 0 ? -100 : 100;
    this.sonKonum = Math.round(((agir / top) - 3.5) / 3.5 * 100);
    return this.sonKonum;
  }

  adim(pwmSol: number, pwmSag: number) {
    const hedef = (p: number) => Math.abs(p) < SIROLINE.oluBolge ? 0 : Math.max(-255, Math.min(255, p)) / 255 * SIROLINE.azamiHiz;
    const k = 1 - Math.exp(-FIZIK_ADIMI / SIROLINE.gecikme);
    this.vSol += (hedef(pwmSol) - this.vSol) * k;
    this.vSag += (hedef(pwmSag) - this.vSag) * k;
    const v = (this.vSol + this.vSag) / 2, w = (this.vSag - this.vSol) / SIROLINE.izGenisligi;
    const ortaYon = this.yon + w * FIZIK_ADIMI / 2;
    this.x += Math.cos(ortaYon) * v * FIZIK_ADIMI;
    this.y += Math.sin(ortaYon) * v * FIZIK_ADIMI;
    this.yon += w * FIZIK_ADIMI;
    this.solTeker += this.vSol * FIZIK_ADIMI; this.sagTeker += this.vSag * FIZIK_ADIMI;
  }
}

export const CIKMA_SURESI = 1.0;   // bant hiçbir sensörde görünmeden geçebilecek süre (sn)
export const YOLDAN_UZAK = 240;    // aks merkezinin çizgiden en fazla uzaklığı (mm)

/** Turu baştan sona koşturur. `bekleme` > 0 ise robot, önündeki blok kaldırılana kadar (engel sensörü) bekler. */
export function turKos(pist: Pist, beyin: CizgiBeyni, sureSiniri: number, tohum = 7, bekleme = 0): CizgiSonucu {
  const r = new CizgiRobotu(pist, tohum);
  const n = pist.yol.length;
  let iz = 0, gidilen = 0, cizgisiz = 0, pwm: [number, number] = [0, 0];
  const kareler: CizgiKaresi[] = [];
  const kare = (t: number, s: number[]) => {
    const [sx, sy] = r.sensorKonumu(3.5);
    kareler.push({ t: +t.toFixed(3), x: r.x, y: r.y, yon: r.yon, sol: pwm[0], sag: pwm[1], sensor: s, solTeker: r.solTeker, sagTeker: r.sagTeker, ilerleme: Math.max(0, Math.min(1, gidilen / n)), sapma: +Math.max(-250, Math.min(250, pist.isaretliUzaklik(sx, sy))).toFixed(1) });
  };
  const bitir = (durum: CizgiDurum, t: number, hata?: string): CizgiSonucu => ({
    durum, sure: +Math.max(0, t - bekleme).toFixed(2), ilerleme: Math.max(0, Math.min(1, gidilen / n)), kareler, hata, baslangic: bekleme,
    ortSapma: +(kareler.reduce((a, k) => a + Math.abs(k.sapma), 0) / kareler.length).toFixed(1)
  });

  for (let tik = 0; ; tik++) {
    const t = tik * DONGU_ARALIGI;
    const s = r.sensorler();
    kare(t, s);
    if (gidilen >= n) return bitir("bitti", t);
    if (t >= sureSiniri + bekleme) return bitir("sure", t);
    if (t < bekleme) { pwm = [0, 0]; continue; } // blok hâlâ önünde: engel sensörü yolu kapalı görüyor
    cizgisiz = r.cizgiPayi(s).every((v) => v < 300) ? cizgisiz + DONGU_ARALIGI : 0; // bant hiçbir sensörde yok
    const { x0, y0, x1, y1 } = pist.sinir;
    if (cizgisiz > CIKMA_SURESI || pist.uzaklik(r.x, r.y) > YOLDAN_UZAK || r.x < x0 || r.x > x1 || r.y < y0 || r.y > y1) return bitir("cikti", t);
    try {
      const p = beyin({ sensorler: s, konum: r.konum(s), sure: Math.round(t * 1000) });
      pwm = [Number(p[0]) || 0, Number(p[1]) || 0];
    } catch (e) {
      return bitir("hata", t, e instanceof Error ? e.message : String(e));
    }
    for (let k = 0; k < KONTROL_ORANI; k++) r.adim(pwm[0], pwm[1]);
    const yeni = pist.izdusum(r.x, r.y, iz);
    let fark = yeni - iz; if (fark > n / 2) fark -= n; if (fark < -n / 2) fark += n;
    gidilen += fark; iz = yeni;
  }
}

/* ---------- SiroLine bloğu: kitin mBlock uzantısındaki PID ---------- */
export interface SiroAyar { taban: number; ek: number; kp: number; kd: number; zemin: Zemin }
/** Ürün sayfasındaki mBlock örneğinin değerleri (Zemin: Siyah = akademinin siyah zeminli, beyaz bantlı pisti) */
export const SIRO_VARSAYILAN: SiroAyar = { taban: 100, ek: 0, kp: 0.04, kd: 0.7, zemin: "siyah" };

/** QTR kütüphanesindeki readLine gibi: 0 (çizgi en solda) … 3500 (orta) … 7000 (en sağda). */
export function qtrOkuyucu() {
  let son = 3500;
  return (s: number[], zemin: Zemin = "beyaz"): number => {
    /* kitteki "Zemin" seçimi zeminin rengidir: siyah zeminde beyaz bant aranır, okuma ters çevrilir */
    const v = zemin === "beyaz" ? s : s.map((x) => 1000 - x);
    let top = 0, agir = 0, gordu = false;
    v.forEach((d, i) => { if (d > 200) gordu = true; if (d > 50) { top += d; agir += d * i * 1000; } });
    if (!gordu) return son < 3500 ? 0 : 7000;
    son = Math.round(agir / top);
    return son;
  };
}

/** Kitin bloklarıyla aynı hesap: hata = konum - 3500; düzeltme = Kp·hata + Kd·(hata - son hata). */
export function siroBeyni(a: SiroAyar): CizgiBeyni {
  const oku = qtrOkuyucu(); let sonHata = 0;
  return (o) => {
    const hata = oku(o.sensorler, a.zemin) - 3500;
    const duz = a.kp * hata + a.kd * (hata - sonHata);
    sonHata = hata;
    const taban = a.taban + (Math.abs(hata) < 500 ? a.ek : 0);
    const sinirla = (x: number) => Math.max(-255, Math.min(255, Math.round(x)));
    return [sinirla(taban + duz), sinirla(taban - duz)];
  };
}

/* ---------- görevler ---------- */
export interface CizgiGorevi {
  kimlik: string; ad: string; ozet: string; ogretir: string;
  pist: PistTanimi; sureSiniri: number;
  /** yıldız 2 ve 3 için süre sınırları (sn) */
  yildizSureleri: [number, number];
  baslangicKod: string; ipucu: string;
  /** testte doğrulanan örnek çözüm (Python) */
  ornekCozum: string;
}

export const CIZGI_GOREVLERI: CizgiGorevi[] = [
  {
    kimlik: "oval", ad: "İlk tur", ozet: "Oval pistte bir tur at.", ogretir: "Sensör okuma ve koşul",
    pist: { parcalar: [{ tur: "duz", uzunluk: 900 }, { tur: "yay", yaricap: 340, aci: 180 }, { tur: "duz", uzunluk: 900 }, { tur: "yay", yaricap: 340, aci: 180 }] },
    sureSiniri: 30, yildizSureleri: [4.8, 4.2],
    ipucu: "SiroLine'ın motorları dakikada 2000 tur atar; küçük güçlerle başla. Ortadaki sensör s[3] siyahı görüyorsa çizgi soldadır: sola dönmek için sol motoru yavaşlat. Güçleri azar azar artırıp en hızlı turu bul.",
    baslangicKod: `# SiroLine her 10 milisaniyede bir dongu() fonksiyonunu çalıştırır.
# sensorler(): 8 değer, soldan sağa. 0 = beyaz, 1000 = siyah.
# motorlar(sol, sag): -255 ile 255 arası güç. Motorlar çok hızlı: küçük başla!

def dongu():
    s = sensorler()
    if s[3] > 500:          # çizgi solda
        motorlar(30, 70)
    else:
        motorlar(70, 30)
`,
    ornekCozum: `def dongu():
    s = sensorler()
    if s[3] > 500:
        motorlar(40, 90)
    else:
        motorlar(90, 40)
`
  },
  {
    kimlik: "s-viraj", ad: "S virajları", ozet: "Art arda gelen virajlarda çizgiyi kaybetme.", ogretir: "Sensör dizisi, oransal dönüş",
    pist: { noktalar: [[0, 0], [520, 0], [900, 160], [1280, 0], [1700, 0], [2020, 300], [1700, 640], [1300, 640], [900, 470], [500, 640], [120, 640], [-220, 320]] },
    sureSiniri: 30, yildizSureleri: [4.2, 3.7],
    ipucu: "cizgi_konumu() sana çizginin nerede olduğunu tek sayıyla söyler: -100 solda, 0 ortada, 100 sağda. Dönüşü bu sayıyla orantılı yap. Robot sallanıyorsa çarpanı küçült, sonra hızı artır.",
    baslangicKod: `def dongu():
    k = cizgi_konumu()      # -100 (solda) ... 0 (ortada) ... 100 (sağda)
    donus = k * 1           # bu sayıyı değiştir
    motorlar(80 + donus, 80 - donus)
`,
    ornekCozum: `def dongu():
    k = cizgi_konumu()
    donus = k * 0.6
    motorlar(100 + donus, 100 - donus)
`
  },
  {
    kimlik: "yaris", ad: "Yarış pisti", ozet: "Uzun düzlük, keskin viraj: en hızlı turu at.", ogretir: "PID: hız ile kararlılık dengesi",
    pist: { parcalar: [
      { tur: "duz", uzunluk: 1400 }, { tur: "yay", yaricap: 110, aci: 90 }, { tur: "duz", uzunluk: 620 }, { tur: "yay", yaricap: 110, aci: 90 },
      { tur: "duz", uzunluk: 470.19 }, { tur: "yay", yaricap: 150, aci: 50 }, { tur: "yay", yaricap: 150, aci: -100 }, { tur: "yay", yaricap: 150, aci: 50 },
      { tur: "duz", uzunluk: 470.19 }, { tur: "yay", yaricap: 110, aci: 90 }, { tur: "duz", uzunluk: 620 }, { tur: "yay", yaricap: 110, aci: 90 }] },
    sureSiniri: 30, yildizSureleri: [3.2, 2.3],
    ipucu: "Yalnız oransal dönüş (P) hızlanınca sallanır ve virajda kaçar. Hatanın ne kadar hızlı değiştiğini de ekle (D): fark = k - son_k. Modülün en üstündeki değişkenler çağrılar arasında saklanır; fonksiyonun içinde global yazmayı unutma.",
    baslangicKod: `son_k = 0

def dongu():
    global son_k
    k = cizgi_konumu()
    fark = k - son_k
    son_k = k
    donus = k * 1 + fark * 0     # Kp = 1, Kd = 0: Kd'yi artır
    hiz = 100
    motorlar(hiz + donus, hiz - donus)
`,
    ornekCozum: `son_k = 0

def dongu():
    global son_k
    k = cizgi_konumu()
    fark = k - son_k
    son_k = k
    donus = k * 1 + fark * 8
    hiz = 160
    motorlar(hiz + donus, hiz - donus)
`
  }
];

/** Süreye göre yıldız: tur bitmediyse 0. */
export function cizgiYildiz(g: CizgiGorevi, s: CizgiSonucu): number {
  if (s.durum !== "bitti") return 0;
  return s.sure <= g.yildizSureleri[1] ? 3 : s.sure <= g.yildizSureleri[0] ? 2 : 1;
}
