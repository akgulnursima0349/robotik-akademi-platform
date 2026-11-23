/* Mini sumo: iki Kenshin robotu 77 cm'lik ringde. Katı cisim fiziği (tekerlek çekişi, yana kayma sürtünmesi, kutu-kutu çarpışma),
   önden temas eden bıçağın rakibi hafifçe kaldırması, 5 rakip ve 2 zemin sensörü.
   Birim: milimetre, saniye, kilogram (kuvvet kg·mm/sn²). Deterministik: aynı beyinler ve tohum → aynı maç. */
import { rastgele } from "./izgara";

export const RING = { yaricap: 385, kenarIc: 360 } as const;          // 77 cm çap, 2,5 cm beyaz kenar
export const KENSHIN = {
  en: 100, boy: 100, kutle: 0.47,                                     // 10 × 10 cm, 470 g
  tekerYanal: 38,                                                     // tekerleklerin merkezden yana uzaklığı
  tekerCap: 30,
  azamiHiz: 800 / 60 * Math.PI * 30,                                  // ≈ 1257 mm/sn (800 devir/dk)
  tepki: 0.05,                                                        // motor tepki süresi (sn)
  tutunma: 1.0,                                                       // lastik sürtünme katsayısı
  kaldirilmisTutunma: 0.45,                                           // bıçağın altına girince
  menzil: 600,                                                        // rakip sensörü menzili (mm)
  /** rakip sensörleri: robotun ekseninde açı (derece, sola +) ve konum (ileri, sola) */
  sensorler: [
    { ad: "sol_yan", aci: 90, x: 10, y: 50 },
    { ad: "sol_on", aci: 12, x: 50, y: 25 },
    { ad: "orta", aci: 0, x: 50, y: 0 },
    { ad: "sag_on", aci: -12, x: 50, y: -25 },
    { ad: "sag_yan", aci: -90, x: 10, y: -50 }
  ],
  zeminSensorleri: [{ x: 46, y: 40 }, { x: 46, y: -40 }]
} as const;
export const FIZIK = 0.002;           // sn
export const KARAR = 0.02;            // hamle() aralığı (sn)
export const RAUNT_SURESI = 10;       // sn
const G = 9810;                       // mm/sn²

export interface SumoGirdi { rakip: number[]; kenar: number[]; zaman: number }
export type SumoBeyni = (g: SumoGirdi) => [number, number];

class Govde {
  x: number; y: number; yon: number;
  vx = 0; vy = 0; w = 0;
  pwm: [number, number] = [0, 0];
  kaldirildi = false;
  solYol = 0; sagYol = 0;
  readonly I = KENSHIN.kutle * (KENSHIN.en ** 2 + KENSHIN.boy ** 2) / 12;
  constructor(x: number, y: number, yon: number) { this.x = x; this.y = y; this.yon = yon; }
  get ileri(): [number, number] { return [Math.cos(this.yon), Math.sin(this.yon)]; }
  /** robot eksenindeki bir noktanın dünya konumu */
  dunya(px: number, py: number): [number, number] { const c = Math.cos(this.yon), s = Math.sin(this.yon); return [this.x + c * px - s * py, this.y + s * px + c * py]; }
  koseler(): [number, number][] { const a = KENSHIN.boy / 2, b = KENSHIN.en / 2; return [this.dunya(a, b), this.dunya(-a, b), this.dunya(-a, -b), this.dunya(a, -b)]; }

  /** iki tekerleğin kuvvetleriyle bir fizik adımı */
  adim(dt: number) {
    const [fx, fy] = this.ileri, nx = -fy, ny = fx;
    const m = KENSHIN.kutle, mu = this.kaldirildi ? KENSHIN.kaldirilmisTutunma : KENSHIN.tutunma;
    const Fmax = mu * m * G / 2;
    let Fx = 0, Fy = 0, T = 0;
    for (const [i, yan] of [[0, KENSHIN.tekerYanal], [1, -KENSHIN.tekerYanal]] as const) {
      const rx = -fy * yan, ry = fx * yan;                           // merkezden tekerleğe (yanal)
      const vpx = this.vx - this.w * ry, vpy = this.vy + this.w * rx; // tekerlek noktasının hızı
      const hedef = (Math.max(-255, Math.min(255, this.pwm[i])) / 255) * KENSHIN.azamiHiz;
      let ff = (m / 2) * (hedef - (vpx * fx + vpy * fy)) / KENSHIN.tepki;
      let fl = -(m / 2) * (vpx * nx + vpy * ny) / (dt * 4);           // yana kaymaya karşı
      const top = Math.hypot(ff, fl);
      if (top > Fmax) { ff *= Fmax / top; fl *= Fmax / top; }
      const kx = ff * fx + fl * nx, ky = ff * fy + fl * ny;
      Fx += kx; Fy += ky; T += rx * ky - ry * kx;
    }
    this.vx += Fx / m * dt; this.vy += Fy / m * dt; this.w += T / this.I * dt;
    this.x += this.vx * dt; this.y += this.vy * dt; this.yon += this.w * dt;
    const vIleri = this.vx * fx + this.vy * fy;
    this.solYol += (vIleri - this.w * KENSHIN.tekerYanal) * dt;
    this.sagYol += (vIleri + this.w * KENSHIN.tekerYanal) * dt;
  }
}

/* ---------- çarpışma: iki kutu (SAT) ---------- */
interface Temas { nx: number; ny: number; derinlik: number; px: number; py: number }
function carpisma(a: Govde, b: Govde): Temas | null {
  const A = a.koseler(), B = b.koseler();
  const eksenler: [number, number][] = [];
  for (const g of [a, b]) { const [fx, fy] = g.ileri; eksenler.push([fx, fy], [-fy, fx]); }
  let enAz = Infinity, en: [number, number] = [1, 0];
  for (const [ex, ey] of eksenler) {
    const izd = (P: [number, number][]) => { let lo = Infinity, hi = -Infinity; for (const [x, y] of P) { const d = x * ex + y * ey; lo = Math.min(lo, d); hi = Math.max(hi, d); } return [lo, hi]; };
    const [a0, a1] = izd(A), [b0, b1] = izd(B);
    const ort = Math.min(a1, b1) - Math.max(a0, b0);
    if (ort <= 0) return null;
    if (ort < enAz) { enAz = ort; en = [ex, ey]; }
  }
  /* normal a'dan b'ye baksın */
  if ((b.x - a.x) * en[0] + (b.y - a.y) * en[1] < 0) en = [-en[0], -en[1]];
  /* temas noktası: öbür kutunun içinde kalan köşelerin ortası */
  const icinde = (g: Govde, [x, y]: [number, number]) => {
    const [fx, fy] = g.ileri, dx = x - g.x, dy = y - g.y;
    return Math.abs(dx * fx + dy * fy) <= KENSHIN.boy / 2 + 0.01 && Math.abs(-dx * fy + dy * fx) <= KENSHIN.en / 2 + 0.01;
  };
  const noktalar = [...A.filter((p) => icinde(b, p)), ...B.filter((p) => icinde(a, p))];
  const [px, py] = noktalar.length ? noktalar.reduce(([sx, sy], [x, y]) => [sx + x / noktalar.length, sy + y / noktalar.length], [0, 0]) : [(a.x + b.x) / 2, (a.y + b.y) / 2];
  return { nx: en[0], ny: en[1], derinlik: enAz, px, py };
}

/** 1 mm şişirilmiş kutularla temas: çözümden sonra ayrılmış ama dokunan robotlar için */
function carpismaPayli(a: Govde, b: Govde): Temas | null {
  const yedek = [a.x, a.y, b.x, b.y];
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  a.x += dx / l * 0.6; a.y += dy / l * 0.6; b.x -= dx / l * 0.6; b.y -= dy / l * 0.6;
  const c = carpisma(a, b);
  [a.x, a.y, b.x, b.y] = yedek;
  return c;
}

function coz(a: Govde, b: Govde, t: Temas) {
  const m = KENSHIN.kutle;
  /* konum düzeltmesi: yarı yarıya */
  const d = t.derinlik / 2 + 0.01;
  a.x -= t.nx * d; a.y -= t.ny * d; b.x += t.nx * d; b.y += t.ny * d;
  /* itki: sekme az (e), sürtünme (mu) */
  const e = 0.05, mu = 0.35;
  const ra = [t.px - a.x, t.py - a.y], rb = [t.px - b.x, t.py - b.y];
  const va = [a.vx - a.w * ra[1], a.vy + a.w * ra[0]], vb = [b.vx - b.w * rb[1], b.vy + b.w * rb[0]];
  const rv = [vb[0] - va[0], vb[1] - va[1]];
  const vn = rv[0] * t.nx + rv[1] * t.ny;
  if (vn > 0) return;
  const raXn = ra[0] * t.ny - ra[1] * t.nx, rbXn = rb[0] * t.ny - rb[1] * t.nx;
  const payda = 2 / m + raXn ** 2 / a.I + rbXn ** 2 / b.I;
  const j = -(1 + e) * vn / payda;
  const uygula = (jx: number, jy: number) => {
    a.vx -= jx / m; a.vy -= jy / m; a.w -= (ra[0] * jy - ra[1] * jx) / a.I;
    b.vx += jx / m; b.vy += jy / m; b.w += (rb[0] * jy - rb[1] * jx) / b.I;
  };
  uygula(j * t.nx, j * t.ny);
  /* teğetsel sürtünme */
  const tx = -t.ny, ty = t.nx, vt = rv[0] * tx + rv[1] * ty;
  const raXt = ra[0] * ty - ra[1] * tx, rbXt = rb[0] * ty - rb[1] * tx;
  const jt = Math.max(-mu * j, Math.min(mu * j, -vt / (2 / m + raXt ** 2 / a.I + rbXt ** 2 / b.I)));
  uygula(jt * tx, jt * ty);
}

/** a'nın bıçağı (ön yüzü) b'ye mi değiyor: temas normali a'nın ileri yönüne yakın */
const bicakla = (a: Govde, nx: number, ny: number) => { const [fx, fy] = a.ileri; return fx * nx + fy * ny > 0.82; };

/* ---------- sensörler ---------- */
/** Işının kutuya uzaklığı (yoksa Infinity): kutunun kendi ekseninde dilim yöntemi */
function isinKutu(ox: number, oy: number, dx: number, dy: number, g: Govde): number {
  const [fx, fy] = g.ileri, rx = ox - g.x, ry = oy - g.y;
  const o = [rx * fx + ry * fy, -rx * fy + ry * fx], d = [dx * fx + dy * fy, -dx * fy + dy * fx];
  const s = [KENSHIN.boy / 2, KENSHIN.en / 2];
  let t0 = -Infinity, t1 = Infinity;
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (Math.abs(o[i]) > s[i]) return Infinity; continue; }
    let a = (-s[i] - o[i]) / d[i], b = (s[i] - o[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t1 < 0 ? Infinity : Math.max(0, t0);
}

function okuma(g: Govde, rakip: Govde, zaman: number): SumoGirdi {
  const r = KENSHIN.sensorler.map((s) => {
    const [ox, oy] = g.dunya(s.x, s.y);
    for (const sap of [-3, 0, 3]) {
      const a = g.yon + (s.aci + sap) * Math.PI / 180;
      if (isinKutu(ox, oy, Math.cos(a), Math.sin(a), rakip) <= KENSHIN.menzil) return 1;
    }
    return 0;
  });
  const k = KENSHIN.zeminSensorleri.map((s) => { const [x, y] = g.dunya(s.x, s.y); const d = Math.hypot(x, y); return d >= RING.kenarIc && d <= RING.yaricap ? 1 : 0; });
  return { rakip: r, kenar: k, zaman: Math.round(zaman * 1000) };
}

/* ---------- raunt ve maç ---------- */
export interface SumoRobotKaresi { x: number; y: number; yon: number; sol: number; sag: number; solYol: number; sagYol: number; rakip: number[]; kenar: number[]; kaldirildi: boolean; dustu: boolean }
export interface SumoKaresi { t: number; robotlar: [SumoRobotKaresi, SumoRobotKaresi]; temas: boolean }
export interface RauntSonucu {
  /** 0 ya da 1: raundu kazanan; null berabere */
  kazanan: 0 | 1 | null;
  sebep: "dustu" | "sure" | "ikisi_dustu";
  sure: number;
  kareler: SumoKaresi[];
  hatalar: [string | null, string | null];
}
export type Dizilis = "karsi" | "yan" | "sirt";
export const DIZILISLER: Dizilis[] = ["karsi", "yan", "sirt"];

/** Başlangıç konumları: robotlar başlangıç çizgilerinin arkasında, ringe göre simetrik. */
export function baslangic(d: Dizilis, tohum: number): [[number, number, number], [number, number, number]] {
  const r = rastgele(tohum), sap = (r() - 0.5) * 0.35; // ±10°
  const yon0 = d === "karsi" ? 0 : d === "sirt" ? Math.PI : Math.PI / 2;
  const a: [number, number, number] = [-130, 0, yon0 + sap];
  return [a, [130, 0, a[2] + Math.PI]]; // merkeze göre nokta simetrisi
}

export function rauntOyna(beyinler: [SumoBeyni, SumoBeyni], d: Dizilis, tohum: number, sure = RAUNT_SURESI): RauntSonucu {
  const [p0, p1] = baslangic(d, tohum);
  const g: [Govde, Govde] = [new Govde(...p0), new Govde(...p1)];
  const hatalar: [string | null, string | null] = [null, null];
  const kareler: SumoKaresi[] = [];
  const adim = Math.round(KARAR / FIZIK);
  let girdiler: [SumoGirdi, SumoGirdi] = [okuma(g[0], g[1], 0), okuma(g[1], g[0], 0)];
  let temasVar = false;
  const kaydet = (t: number, dustu: [boolean, boolean]) => kareler.push({
    t: +t.toFixed(3), temas: temasVar,
    robotlar: [0, 1].map((i) => ({ x: g[i].x, y: g[i].y, yon: g[i].yon, sol: g[i].pwm[0], sag: g[i].pwm[1], solYol: g[i].solYol, sagYol: g[i].sagYol, rakip: girdiler[i].rakip, kenar: girdiler[i].kenar, kaldirildi: g[i].kaldirildi, dustu: dustu[i] })) as [SumoRobotKaresi, SumoRobotKaresi]
  });
  const disarida = (x: Govde) => Math.hypot(x.x, x.y) > RING.yaricap;
  for (let tik = 0; ; tik++) {
    const t = tik * KARAR;
    const dustu: [boolean, boolean] = [disarida(g[0]), disarida(g[1])];
    kaydet(t, dustu);
    if (dustu[0] || dustu[1]) {
      return { kazanan: dustu[0] && dustu[1] ? null : dustu[0] ? 1 : 0, sebep: dustu[0] && dustu[1] ? "ikisi_dustu" : "dustu", sure: +t.toFixed(2), kareler, hatalar };
    }
    if (t >= sure) return { kazanan: null, sebep: "sure", sure, kareler, hatalar };
    girdiler = [okuma(g[0], g[1], t), okuma(g[1], g[0], t)];
    for (const i of [0, 1] as const) {
      if (hatalar[i]) { g[i].pwm = [0, 0]; continue; }
      try { const p = beyinler[i](girdiler[i]); g[i].pwm = [Number(p?.[0]) || 0, Number(p?.[1]) || 0]; }
      catch (e) { hatalar[i] = e instanceof Error ? e.message : String(e); g[i].pwm = [0, 0]; }
    }
    temasVar = false;
    for (let k = 0; k < adim; k++) {
      g[0].adim(FIZIK); g[1].adim(FIZIK);
      const c = carpisma(g[0], g[1]);
      /* temas sürdükçe bıçağı değen taraf rakibini hafifçe kaldırır (bir sonraki adımda tutuşu düşer) */
      g[0].kaldirildi = g[1].kaldirildi = false;
      if (c) {
        temasVar = true;
        const a0 = bicakla(g[0], c.nx, c.ny), a1 = bicakla(g[1], -c.nx, -c.ny);
        if (a0 && !a1) g[1].kaldirildi = true;
        if (a1 && !a0) g[0].kaldirildi = true;
        coz(g[0], g[1], c);
      } else {
        /* çok yakın (1 mm) ama ayrık: temas sayılır, kaldırma sürer */
        const y = carpismaPayli(g[0], g[1]);
        if (y) { temasVar = true; const a0 = bicakla(g[0], y.nx, y.ny), a1 = bicakla(g[1], -y.nx, -y.ny); if (a0 && !a1) g[1].kaldirildi = true; if (a1 && !a0) g[0].kaldirildi = true; }
      }
    }
  }
}

export interface SumoMacSonucu { raunt: [number, number]; kazanan: 0 | 1 | null; rauntlar: (RauntSonucu & { dizilis: Dizilis })[]; tohum: number }
/** En fazla 3 raunt; iki raunt kazanan maçı alır. Süre biterse raunt berabere sayılır. */
export function sumoMaci(a: SumoBeyni, b: SumoBeyni, tohum: number): SumoMacSonucu {
  const raunt: [number, number] = [0, 0];
  const rauntlar: SumoMacSonucu["rauntlar"] = [];
  for (let i = 0; i < 3 && raunt[0] < 2 && raunt[1] < 2; i++) {
    const d = DIZILISLER[i];
    const r = rauntOyna([a, b], d, tohum * 7 + i);
    rauntlar.push({ ...r, dizilis: d });
    if (r.kazanan !== null) raunt[r.kazanan]++;
  }
  return { raunt, kazanan: raunt[0] > raunt[1] ? 0 : raunt[1] > raunt[0] ? 1 : null, rauntlar, tohum };
}

/* ---------- turnuva ---------- */
export interface SumoOyuncu { kimlik: string; ad: string; sahip?: string; beyin: SumoBeyni }
export interface SumoTabloSatiri { kimlik: string; ad: string; sahip?: string; o: number; g: number; b: number; m: number; alinan: number; verilen: number; puan: number }
export interface SumoTurnuvaSonucu { tablo: SumoTabloSatiri[]; maclar: { ev: number; dep: number; sonuc: SumoMacSonucu }[] }

export function sumoTurnuvasi(oyuncular: SumoOyuncu[], tohum = 1): SumoTurnuvaSonucu {
  const satir = oyuncular.map((o) => ({ kimlik: o.kimlik, ad: o.ad, sahip: o.sahip, o: 0, g: 0, b: 0, m: 0, alinan: 0, verilen: 0, puan: 0 }));
  const maclar: SumoTurnuvaSonucu["maclar"] = [];
  let n = 0;
  for (let i = 0; i < oyuncular.length; i++) for (let j = i + 1; j < oyuncular.length; j++) {
    const s = sumoMaci(oyuncular[i].beyin, oyuncular[j].beyin, tohum + n++);
    maclar.push({ ev: i, dep: j, sonuc: s });
    const [a, b] = [satir[i], satir[j]];
    a.o++; b.o++; a.alinan += s.raunt[0]; a.verilen += s.raunt[1]; b.alinan += s.raunt[1]; b.verilen += s.raunt[0];
    if (s.kazanan === 0) { a.g++; b.m++; a.puan += 3; } else if (s.kazanan === 1) { b.g++; a.m++; b.puan += 3; } else { a.b++; b.b++; a.puan++; b.puan++; }
  }
  const tablo = satir.slice().sort((x, y) => y.puan - x.puan || (y.alinan - y.verilen) - (x.alinan - x.verilen) || y.alinan - x.alinan || x.ad.localeCompare(y.ad, "tr"));
  return { tablo, maclar };
}
