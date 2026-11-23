/* Çizgi izleyen robot simülasyonu (SiroLine Pleksi).
   Birim: milimetre ve saniye. Diferansiyel sürüş, motor gecikmesi, 8 kızılötesi sensör.
   Deterministik: sensör gürültüsü sabit tohumlu; aynı kod → aynı tur. */
import { rastgele } from "./izgara";

/* ---------- robot ölçüleri (mağaza fotoğrafı: 21,5 × 17,5 cm) ---------- */
export const SIROLINE = {
  izGenisligi: 145,   // iki tekerleğin merkezleri arası (mm)
  tekerCap: 44,       // lastik çapı (mm)
  sensorOnde: 168,    // sensör dizisinin aks merkezinden uzaklığı (mm)
  sensorAralik: 9.5,  // komşu sensörler arası (mm)
  sensorSayisi: 8,
  azamiHiz: 700,      // 255 PWM'de tekerlek hızı (mm/sn)
  oluBolge: 35,       // bu PWM'in altında redüktörlü motor dönmez
  gecikme: 0.14       // motor ve gövde tepki süresi sabiti (sn)

} as const;
export const CIZGI_GENISLIGI = 19;     // siyah bant (mm)
export const FIZIK_ADIMI = 0.005;      // sn
export const DONGU_ARALIGI = 0.02;     // çocuğun dongu() çağrısı (sn)
const KONTROL_ORANI = Math.round(DONGU_ARALIGI / FIZIK_ADIMI);

export type Nokta = [number, number];
export type PistParca = { tur: "duz"; uzunluk: number } | { tur: "yay"; yaricap: number; aci: number /* derece, + sola */ };
export type PistTanimi = { parcalar: PistParca[] } | { noktalar: Nokta[] };

/* ---------- pist ---------- */
export class Pist {
  /** 2 mm aralıkla örneklenmiş kapalı orta çizgi */
  readonly yol: Nokta[];
  readonly uzunluk: number;
  readonly sinir: { x0: number; y0: number; x1: number; y1: number };
  private izgara = new Map<string, number[]>();
  private static HUCRE = 40;

  constructor(t: PistTanimi, readonly kenarPayi = 260) {
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
}
export type CizgiDurum = "bitti" | "cikti" | "sure" | "hata";
export interface CizgiSonucu { durum: CizgiDurum; sure: number; ilerleme: number; kareler: CizgiKaresi[]; hata?: string }
export interface CizgiOkuma { sensorler: number[]; konum: number; sure: number }
/** Her 20 ms'de çağrılır; [sol, sağ] PWM döndürür. */
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
      out.push(Math.round(Math.max(0, Math.min(1000, 45 + 905 * ortu + g))));
    }
    return out;
  }

  /** QTR kütüphanesindeki gibi ağırlıklı konum: -100 (çizgi solda) … 100 (sağda). Çizgi görünmezse son gördüğü taraf. */
  konum(s: number[]): number {
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

export const CIKMA_SURESI = 1.0;   // bütün sensörler beyazken geçebilecek süre (sn)
export const YOLDAN_UZAK = 240;    // aks merkezinin çizgiden en fazla uzaklığı (mm)

/** Turu baştan sona koşturur. Beyin hata fırlatırsa tur "hata" ile biter. */
export function turKos(pist: Pist, beyin: CizgiBeyni, sureSiniri: number, tohum = 7): CizgiSonucu {
  const r = new CizgiRobotu(pist, tohum);
  const n = pist.yol.length;
  let iz = 0, gidilen = 0, beyaz = 0, pwm: [number, number] = [0, 0];
  const kareler: CizgiKaresi[] = [];
  const kare = (t: number, s: number[]) => kareler.push({ t: +t.toFixed(3), x: r.x, y: r.y, yon: r.yon, sol: pwm[0], sag: pwm[1], sensor: s, solTeker: r.solTeker, sagTeker: r.sagTeker, ilerleme: Math.max(0, Math.min(1, gidilen / n)) });
  const bitir = (durum: CizgiDurum, t: number, hata?: string): CizgiSonucu => ({ durum, sure: +t.toFixed(2), ilerleme: Math.max(0, Math.min(1, gidilen / n)), kareler, hata });

  for (let tik = 0; ; tik++) {
    const t = tik * DONGU_ARALIGI;
    const s = r.sensorler();
    kare(t, s);
    if (gidilen >= n) return bitir("bitti", t);
    if (t >= sureSiniri) return bitir("sure", t);
    beyaz = s.every((v) => v < 300) ? beyaz + DONGU_ARALIGI : 0;
    const { x0, y0, x1, y1 } = pist.sinir;
    if (beyaz > CIKMA_SURESI || pist.uzaklik(r.x, r.y) > YOLDAN_UZAK || r.x < x0 || r.x > x1 || r.y < y0 || r.y > y1) return bitir("cikti", t);
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
    sureSiniri: 40, yildizSureleri: [11, 9.5],
    ipucu: "Ortadaki iki sensöre bak: s[3] soldaki, s[4] sağdaki. Çizgi sola kaydıysa soldaki sensör siyahı görür; sola dönmek için sol motoru yavaşlat.",
    baslangicKod: `# SiroLine her 20 milisaniyede bir dongu() fonksiyonunu çalıştırır.
# sensorler(): 8 değer, soldan sağa. 0 = beyaz, 1000 = siyah.
# motorlar(sol, sag): -255 ile 255 arası güç.

def dongu():
    s = sensorler()
    if s[3] > 500:          # çizgi solda
        motorlar(60, 160)
    else:
        motorlar(160, 60)
`,
    ornekCozum: `def dongu():
    s = sensorler()
    if s[2] > 500:
        motorlar(40, 220)
    elif s[5] > 500:
        motorlar(220, 40)
    elif s[3] > 500:
        motorlar(160, 230)
    elif s[4] > 500:
        motorlar(230, 160)
    else:
        motorlar(230, 230)
`
  },
  {
    kimlik: "s-viraj", ad: "S virajları", ozet: "Art arda gelen virajlarda çizgiyi kaybetme.", ogretir: "Sensör dizisi, oransal dönüş",
    pist: { noktalar: [[0, 0], [520, 0], [900, 160], [1280, 0], [1700, 0], [2020, 300], [1700, 640], [1300, 640], [900, 470], [500, 640], [120, 640], [-220, 320]] },
    sureSiniri: 50, yildizSureleri: [11.5, 9.8],
    ipucu: "cizgi_konumu() sana çizginin nerede olduğunu tek sayıyla söyler: -100 solda, 0 ortada, 100 sağda. Dönüşü bu sayıyla orantılı yap.",
    baslangicKod: `def dongu():
    k = cizgi_konumu()      # -100 (solda) ... 0 (ortada) ... 100 (sağda)
    donus = k * 1           # bu sayıyı değiştir
    motorlar(150 + donus, 150 - donus)
`,
    ornekCozum: `def dongu():
    k = cizgi_konumu()
    donus = k * 2
    motorlar(200 + donus, 200 - donus)
`
  },
  {
    kimlik: "yaris", ad: "Yarış pisti", ozet: "Uzun düzlük, keskin viraj: en hızlı turu at.", ogretir: "PID: hız ile kararlılık dengesi",
    pist: { parcalar: [
      { tur: "duz", uzunluk: 1400 }, { tur: "yay", yaricap: 110, aci: 90 }, { tur: "duz", uzunluk: 620 }, { tur: "yay", yaricap: 110, aci: 90 },
      { tur: "duz", uzunluk: 470.19 }, { tur: "yay", yaricap: 150, aci: 50 }, { tur: "yay", yaricap: 150, aci: -100 }, { tur: "yay", yaricap: 150, aci: 50 },
      { tur: "duz", uzunluk: 470.19 }, { tur: "yay", yaricap: 110, aci: 90 }, { tur: "duz", uzunluk: 620 }, { tur: "yay", yaricap: 110, aci: 90 }] },
    sureSiniri: 60, yildizSureleri: [9, 7.8],
    ipucu: "Oransal dönüş (P) hızlanınca sallanır. Hatanın ne kadar hızlı değiştiğini de ekle (D): fark = k - son_k. Modülün en üstündeki değişkenler çağrılar arasında saklanır; içeride global yazmayı unutma.",
    baslangicKod: `son_k = 0

def dongu():
    global son_k
    k = cizgi_konumu()
    fark = k - son_k
    son_k = k
    donus = k * 2 + fark * 0     # Kp = 2, Kd = 0: Kd'yi artır
    hiz = 180
    motorlar(hiz + donus, hiz - donus)
`,
    ornekCozum: `son_k = 0

def dongu():
    global son_k
    k = cizgi_konumu()
    fark = k - son_k
    son_k = k
    donus = k * 2.5 + fark * 8
    hiz = 255
    motorlar(hiz + donus, hiz - donus)
`
  }
];

/** Süreye göre yıldız: tur bitmediyse 0. */
export function cizgiYildiz(g: CizgiGorevi, s: CizgiSonucu): number {
  if (s.durum !== "bitti") return 0;
  return s.sure <= g.yildizSureleri[1] ? 3 : s.sure <= g.yildizSureleri[0] ? 2 : 1;
}
