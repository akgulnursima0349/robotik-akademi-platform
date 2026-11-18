/* Parçacıklar: ekranda yağan kar ve küreğin savurduğu kar. Kare hızı düşerse sayı kendiliğinden azalır;
   "hareketi azalt" tercihinde hiç çizilmez. */
import { Container, Graphics, type Application, type Ticker } from "pixi.js";
import { azHareket } from "./izometrik";

interface Tane { x: number; y: number; vx: number; vy: number; r: number; omur: number; yas: number; g: Graphics }

export class KarYagisi {
  readonly katman = new Container();
  private taneler: Tane[] = [];
  private hedef: number;
  private olcum = { sure: 0, kare: 0 };
  constructor(private readonly app: Application, yogunluk = 1) {
    this.hedef = azHareket() ? 0 : Math.round(70 * yogunluk);
    this.katman.eventMode = "none";
    app.ticker.add(this.adim, this);
  }
  private yeni(ustten: boolean): Tane {
    const g = new Graphics();
    const r = 1 + Math.random() * 2.4;
    g.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.65 + Math.random() * 0.35 });
    this.katman.addChild(g);
    const W = this.app.screen.width, H = this.app.screen.height;
    return { x: Math.random() * W, y: ustten ? -10 : Math.random() * H, vx: -6 + Math.random() * 12, vy: 16 + r * 12, r, omur: Infinity, yas: 0, g };
  }
  private adim(t: Ticker) {
    const dt = Math.min(0.05, t.deltaMS / 1000);
    /* kare hızı ölçümü: 2 saniyede bir; 40'ın altındaysa yarıya indir */
    this.olcum.sure += t.deltaMS; this.olcum.kare++;
    if (this.olcum.sure > 2000) {
      const fps = (this.olcum.kare * 1000) / this.olcum.sure;
      if (fps < 40 && this.hedef > 10) this.hedef = Math.floor(this.hedef / 2);
      this.olcum = { sure: 0, kare: 0 };
    }
    while (this.taneler.length < this.hedef) this.taneler.push(this.yeni(this.taneler.length > this.hedef / 2));
    const H = this.app.screen.height, W = this.app.screen.width;
    for (const p of this.taneler) {
      p.yas += dt;
      p.x += (p.vx + Math.sin(p.yas * 2 + p.r) * 10) * dt; p.y += p.vy * dt;
      if (p.y > H + 10 || p.x < -20 || p.x > W + 20) { p.x = Math.random() * W; p.y = -10; }
      p.g.position.set(p.x, p.y);
    }
    while (this.taneler.length > this.hedef) this.taneler.pop()!.g.destroy();
  }
  yokEt() { this.app.ticker.remove(this.adim, this); this.katman.destroy({ children: true }); }
}

/** Küreğin savurduğu kar: dünya katmanında, kısa ömürlü */
export class Savrulma {
  readonly katman = new Container();
  private taneler: Tane[] = [];
  constructor(private readonly app: Application) { app.ticker.add(this.adim, this); }
  patlat(x: number, y: number, yon: { x: number; y: number }, adet = 14) {
    if (azHareket()) return;
    for (let i = 0; i < adet; i++) {
      const g = new Graphics();
      const r = 1.5 + Math.random() * 3;
      g.circle(0, 0, r).fill({ color: 0xffffff });
      this.katman.addChild(g);
      const yay = (Math.random() - 0.5) * 1.6;
      this.taneler.push({ x, y, vx: (yon.x * 60 + yay * 50) * (0.6 + Math.random()), vy: (yon.y * 40 - 70 - Math.random() * 60), r, omur: 0.5 + Math.random() * 0.4, yas: 0, g });
    }
  }
  private adim(t: Ticker) {
    const dt = Math.min(0.05, t.deltaMS / 1000);
    this.taneler = this.taneler.filter((p) => {
      p.yas += dt;
      if (p.yas > p.omur) { p.g.destroy(); return false; }
      p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.g.position.set(p.x, p.y); p.g.alpha = 1 - p.yas / p.omur;
      return true;
    });
  }
  yokEt() { this.app.ticker.remove(this.adim, this); this.katman.destroy({ children: true }); }
}
