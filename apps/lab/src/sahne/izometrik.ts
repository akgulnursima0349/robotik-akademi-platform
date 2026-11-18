/* İzometrik çizim çekirdeği: dünya koordinatı (kare, kare, piksel yükseklik) → ekran.
   Bütün nesneler kodla çizilir (dosya yok); tek bir stil: yumuşak pastel binalar, karlı çatılar, mavi robotlar. */
import { Application, Container, Graphics } from "pixi.js";

export const KW = 64; // karenin ekrandaki genişliği
export const KH = 32; // yüksekliği (2:1 izometri)
export interface Nokta { x: number; y: number }

export const iso = (x: number, y: number, z = 0): Nokta => ({ x: ((x - y) * KW) / 2, y: ((x + y) * KH) / 2 - z });
const duz = (n: Nokta[]) => n.flatMap((p) => [p.x, p.y]);

export const RENK = {
  zemin: 0xe9eefc,
  asfalt: 0x9aa5c0,
  asfaltKenar: 0x8792ae,
  serit: 0xf4f6fb,
  kar: 0xffffff,
  karGolge: 0xdfe6f5,
  karYan: 0xc9d3ea,
  istasyon: 0x2bb673,
  istasyonKenar: 0x1f8f59,
  robot: 0x3a62e0,
  robotKoyu: 0x2747b0,
  robotAcik: 0x5b80f0,
  kurek: 0xffc21a,
  kurekKoyu: 0xd29a00,
  teker: 0x26324f,
  vurgu: 0xd7262e,
  pencere: 0xfff6d6,
  meydan: 0xdde4f4,
  meydanCizgi: 0xc9d3ea
};
const BINA_RENKLERI = [0xc9d4f2, 0xf2c9c9, 0xc9e8e2, 0xf2e2c4, 0xd6cdf2, 0xcfe3f6];
/** Rengi açar (+) ya da koyulaştırır (−): yüzlerin gölgesi için. */
export function ton(renk: number, k: number): number {
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
  return (f((renk >> 16) & 255) << 16) | (f((renk >> 8) & 255) << 8) | f(renk & 255);
}

/** Zemin karesi */
export function kare(g: Graphics, x: number, y: number, renk: number, kenar?: number, z = 0) {
  g.poly(duz([iso(x, y, z), iso(x + 1, y, z), iso(x + 1, y + 1, z), iso(x, y + 1, z)])).fill(renk);
  if (kenar !== undefined) g.poly(duz([iso(x, y, z), iso(x + 1, y, z), iso(x + 1, y + 1, z), iso(x, y + 1, z)])).stroke({ width: 1, color: kenar, alpha: 0.6 });
}

/** Kutu: taban (x0,y0)-(x1,y1), yükseklik z0→z1. Önde görünen iki yan yüz ve üst yüz. */
export function kutu(g: Graphics, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, renk: number) {
  g.poly(duz([iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)])).fill(ton(renk, -0.12)); // güney yüzü
  g.poly(duz([iso(x1, y0, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1)])).fill(ton(renk, -0.24)); // doğu yüzü
  g.poly(duz([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)])).fill(renk);
}

export type BinaTuru = "arka" | "ic" | "on";
/** Önde kalan kenar: sokağı kapatmasın diye alçak karlı çit/yığın */
export function karDuvari(g: Graphics, x: number, y: number) {
  /* taş çit: karlı yoldan ayırt edilsin diye mavimsi gri, üstünde ince kar */
  kutu(g, x + 0.2, y + 0.2, x + 0.8, y + 0.8, 0, 8, 0xb4bfdb);
  kutu(g, x + 0.24, y + 0.24, x + 0.76, y + 0.76, 8, 10, 0xf4f7fd);
}

/** Karlı çatılı bina; rengi ve yüksekliği konumdan türetilir (her açılışta aynı).
    arka: kenardaki yüksek binalar (sokağın arkasında kalır), ic: aradaki orta boy binalar. */
export function bina(g: Graphics, x: number, y: number, tur: BinaTuru = "arka") {
  if (tur === "on") return karDuvari(g, x, y);
  const h = tur === "arka" ? 30 + ((x * 7 + y * 13) % 4) * 9 : 18 + ((x * 5 + y * 3) % 3) * 5;
  const renk = BINA_RENKLERI[(x * 3 + y * 5) % BINA_RENKLERI.length];
  const p = 0.06;
  kutu(g, x + p, y + p, x + 1 - p, y + 1 - p, 0, h, renk);
  /* pencereler: güney ve doğu yüzlerinde */
  for (let k = 0; k < 2; k++) {
    const a = x + p + 0.18 + k * 0.38, b = a + 0.2;
    const zz = h * 0.42;
    g.poly(duz([iso(a, y + 1 - p, zz), iso(b, y + 1 - p, zz), iso(b, y + 1 - p, zz + 9), iso(a, y + 1 - p, zz + 9)])).fill({ color: RENK.pencere, alpha: 0.9 });
    const c = y + p + 0.18 + k * 0.38, d = c + 0.2;
    g.poly(duz([iso(x + 1 - p, c, zz), iso(x + 1 - p, d, zz), iso(x + 1 - p, d, zz + 9), iso(x + 1 - p, c, zz + 9)])).fill({ color: RENK.pencere, alpha: 0.75 });
  }
  /* çatıdaki kar: biraz taşan beyaz kapak */
  const q = p - 0.03;
  kutu(g, x + q, y + q, x + 1 - q, y + 1 - q, h, h + 5, RENK.kar);
}

/** Yoldaki kar yığını; oran 0 → temiz, 1 → tam yığın */
export function karYigini(g: Graphics, x: number, y: number, oran: number) {
  if (oran <= 0.01) return;
  const z = 9 * oran, p = 0.08 + (1 - oran) * 0.25;
  g.poly(duz([iso(x + p, y + 1 - p, 0), iso(x + 1 - p, y + 1 - p, 0), iso(x + 1 - p, y + 1 - p, z), iso(x + p, y + 1 - p, z)])).fill(RENK.karGolge);
  g.poly(duz([iso(x + 1 - p, y + p, 0), iso(x + 1 - p, y + 1 - p, 0), iso(x + 1 - p, y + 1 - p, z), iso(x + 1 - p, y + p, z)])).fill(RENK.karYan);
  g.poly(duz([iso(x + p, y + p, z), iso(x + 1 - p, y + p, z), iso(x + 1 - p, y + 1 - p, z), iso(x + p, y + 1 - p, z)])).fill(RENK.kar);
  /* yüzeyde küçük kabartılar */
  const c = iso(x + 0.38, y + 0.42, z + 1.5), d = iso(x + 0.62, y + 0.58, z + 1);
  g.ellipse(c.x, c.y, 9 * oran, 4 * oran).fill({ color: RENK.kar });
  g.ellipse(d.x, d.y, 7 * oran, 3 * oran).fill({ color: 0xf6f8fd });
}

/** Robot: dünya koordinatında merkez (cx, cy), açı (radyan; 0 = kuzey, saat yönünde). */
export function robot(g: Graphics, cx: number, cy: number, aci: number, govde: number, kurekVar = true, sarj = 0) {
  const dondur = (dx: number, dy: number): [number, number] => {
    const c = Math.cos(aci), s = Math.sin(aci);
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  };
  /* gölge */
  const go = iso(cx, cy, 0);
  g.ellipse(go.x, go.y + 2, 26, 12).fill({ color: 0x1a2340, alpha: 0.16 });
  /* yüzlü kutu: yüzleri derinliğe göre sırala */
  const kutuCiz = (yerel: [number, number][], z0: number, z1: number, renk: number) => {
    const p = yerel.map(([a, b]) => dondur(a, b));
    const yuzler = p.map((a, i) => {
      const b = p[(i + 1) % 4];
      return { d: (a[0] + b[0] + a[1] + b[1]) / 2, a, b, isik: (b[0] - a[0]) * 0.6 - (b[1] - a[1]) * 0.4 };
    }).sort((u, v) => u.d - v.d);
    for (const y of yuzler) g.poly(duz([iso(y.a[0], y.a[1], z0), iso(y.b[0], y.b[1], z0), iso(y.b[0], y.b[1], z1), iso(y.a[0], y.a[1], z1)])).fill(ton(renk, y.isik > 0 ? -0.1 : -0.28));
    g.poly(duz(p.map(([a, b]) => iso(a, b, z1)))).fill(renk);
  };
  /* tekerler */
  for (const sx of [-0.3, 0.22]) for (const sy of [-0.2, 0.12]) kutuCiz([[sx, sy], [sx + 0.08, sy], [sx + 0.08, sy + 0.12], [sx, sy + 0.12]], 0, 9, RENK.teker);
  /* gövde */
  kutuCiz([[-0.26, -0.24], [0.26, -0.24], [0.26, 0.26], [-0.26, 0.26]], 5, 20, govde);
  /* üst plaka */
  kutuCiz([[-0.17, -0.12], [0.17, -0.12], [0.17, 0.2], [-0.17, 0.2]], 20, 23, ton(govde, 0.25));
  /* kürek (önde, sarı) */
  if (kurekVar) kutuCiz([[-0.36, -0.42], [0.36, -0.42], [0.36, -0.32], [-0.36, -0.32]], 1, 13, RENK.kurek);
  /* sensör ve anten */
  const [sx, sy] = dondur(0, -0.06);
  const s = iso(sx, sy, 27);
  g.ellipse(s.x, s.y, 7, 4).fill(0xf3f6ff);
  g.ellipse(s.x, s.y - 1, 4, 2.4).fill(sarj > 0 ? RENK.istasyon : RENK.vurgu);
  const [ax, ay] = dondur(0.12, 0.14);
  const a0 = iso(ax, ay, 23), a1 = iso(ax, ay, 38);
  g.moveTo(a0.x, a0.y).lineTo(a1.x, a1.y).stroke({ width: 2, color: ton(govde, -0.35) });
  g.circle(a1.x, a1.y, 3).fill(sarj > 0 ? RENK.istasyon : RENK.kurek);
}

/** Şarj istasyonu: yeşil zemin + şimşek */
export function istasyon(g: Graphics, x: number, y: number) {
  kare(g, x, y, RENK.istasyon, RENK.istasyonKenar, 0);
  const p = 0.18;
  g.poly(duz([iso(x + p, y + p, 1), iso(x + 1 - p, y + p, 1), iso(x + 1 - p, y + 1 - p, 1), iso(x + p, y + 1 - p, 1)])).fill(ton(RENK.istasyon, 0.25));
  const c = iso(x + 0.5, y + 0.5, 2);
  g.poly([c.x - 2, c.y - 9, c.x + 6, c.y - 9, c.x + 1, c.y - 1, c.x + 7, c.y - 1, c.x - 5, c.y + 9, c.x - 1, c.y + 1, c.x - 7, c.y + 1]).fill(0xffffff);
}

/** Kar topu (lig): gölgeli küre */
export function kartopu(g: Graphics, x: number, y: number, olcek = 1) {
  const z = iso(x, y, 0), t = iso(x, y, 11 * olcek);
  g.ellipse(z.x, z.y + 1, 11 * olcek, 5 * olcek).fill({ color: 0x1a2340, alpha: 0.14 });
  g.circle(t.x, t.y, 10 * olcek).fill(0xf7f9ff);
  g.circle(t.x + 3 * olcek, t.y + 3 * olcek, 7 * olcek).fill({ color: 0xdfe6f5, alpha: 0.7 });
  g.circle(t.x - 3 * olcek, t.y - 4 * olcek, 3.2 * olcek).fill(0xffffff);
}

/** Pixi uygulamasını bir kutuya kurar; çözünürlük ekrana göre, arka plan saydam. */
export async function pixiKur(kutu: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({ resizeTo: kutu, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, preference: "webgl" });
  app.canvas.setAttribute("aria-hidden", "true");
  kutu.append(app.canvas);
  return app;
}

/** Sahneyi kutuya sığdırır: dünya sınırları → ölçek ve ortalama */
export function sigdir(kok: Container, app: Application, w: number, h: number, ekYukseklik = 60, bosluk = 24) {
  const sol = iso(0, h).x, sag = iso(w, 0).x, ust = iso(0, 0, ekYukseklik).y, alt = iso(w, h).y;
  const gw = sag - sol, gh = alt - ust;
  const W = app.screen.width, H = app.screen.height;
  const s = Math.min((W - bosluk * 2) / gw, (H - bosluk * 2) / gh, 1.6);
  kok.scale.set(s);
  kok.position.set((W - gw * s) / 2 - sol * s, (H - gh * s) / 2 - ust * s);
}

export const azHareket = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const yumusak = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
