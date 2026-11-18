/* Lab sahneleri. TemelSahne: Pixi uygulaması, kamera, kar yağışı, animasyon sırası.
   KarSahnesi Kar Küreme izini, LigSahnesi bir lig maçını oynatır. İkisi de yalnızca motorun ürettiği kareleri çizer. */
import { Container, Graphics, Text, type Application } from "pixi.js";
import type { Kare, MacKaresi } from "@sra/robot-motoru";
import { Izgara } from "@sra/robot-motoru";
import { azHareket, bina, istasyon, iso, kare, karYigini, kartopu, pixiKur, RENK, robot, sigdir, ton, yumusak } from "./izometrik";
import { KarYagisi, Savrulma } from "./parcacik";

const ACI = (yon: number) => (yon * Math.PI) / 2;
/** En kısa yoldan açı farkı */
const aciFarki = (a: number, b: number) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

abstract class TemelSahne {
  protected kok = new Container();
  protected sabit = new Graphics();
  protected dinamik = new Graphics();
  protected yagis: KarYagisi;
  protected savrulma: Savrulma;
  protected genislik = 1;
  protected yukseklik = 1;
  hiz = 1;
  /** Durum değişmedikçe dinamik katman yeniden çizilmez (zayıf bilgisayarlar için). */
  protected kirli = true;
  private nesil = 0;
  private sarsinti = 0;

  protected constructor(protected readonly app: Application) {
    this.savrulma = new Savrulma(app);
    this.yagis = new KarYagisi(app, Math.min(1.4, (app.screen.width * app.screen.height) / 500000));
    this.kok.addChild(this.sabit, this.dinamik, this.savrulma.katman);
    app.stage.addChild(this.kok, this.yagis.katman);
    app.ticker.add(() => {
      if (this.kirli) { this.kirli = false; this.ciz(); }
      if (this.sarsinti > 0) { this.sarsinti -= app.ticker.deltaMS; this.kok.pivot.x = Math.sin(this.sarsinti / 22) * 6 * (this.sarsinti / 380); }
      else this.kok.pivot.x = 0;
    });
    app.renderer.on("resize", () => this.sigdir());
  }
  protected sigdir() { sigdir(this.kok, this.app, this.genislik, this.yukseklik, 70); this.kirli = true; }
  protected abstract ciz(): void;
  protected sars() { if (!azHareket()) this.sarsinti = 380; }

  /** Geçerli oynatmayı durdurur; bekleyen animasyonlar sessizce biter. */
  durdur() { this.nesil++; }
  protected get oynatmaKimligi() { return this.nesil; }
  protected iptal(kimlik: number) { return kimlik !== this.nesil; }

  /** ms süren bir geçiş; her karede f(0..1) çağrılır. Hareket azaltılmışsa anında biter. */
  protected gecis(ms: number, f: (t: number) => void, kimlik: number): Promise<boolean> {
    const sure = azHareket() ? 0 : ms / this.hiz;
    return new Promise((coz) => {
      if (sure <= 0) { f(1); this.kirli = true; coz(!this.iptal(kimlik)); return; }
      const bas = performance.now();
      const adim = () => {
        if (this.iptal(kimlik)) { this.app.ticker.remove(adim); coz(false); return; }
        const t = Math.min(1, (performance.now() - bas) / sure);
        f(t); this.kirli = true;
        if (t >= 1) { this.app.ticker.remove(adim); coz(true); }
      };
      this.app.ticker.add(adim);
    });
  }
  yokEt() { this.durdur(); this.yagis.yokEt(); this.savrulma.yokEt(); this.app.destroy(true, { children: true }); }
}

/* ---------------- Kar Küreme ---------------- */
export class KarSahnesi extends TemelSahne {
  private izgara!: Izgara;
  private kar = new Map<string, number>(); // "x,y" → yığın oranı 0..1
  private rx = 0; private ry = 0; private aci = 0; private sarj = 0;
  /** her karede çağrılır: arayüz batarya ve adım göstergesini günceller */
  kareDinle: ((k: Kare, i: number) => void) | null = null;

  static async kur(kutu: HTMLElement): Promise<KarSahnesi> { return new KarSahnesi(await pixiKur(kutu)); }

  yukle(harita: readonly string[], yon: number) {
    this.durdur();
    this.izgara = new Izgara(harita);
    this.genislik = this.izgara.genislik; this.yukseklik = this.izgara.yukseklik;
    this.kar.clear();
    for (const k of this.izgara.karlilar()) this.kar.set(`${k.x},${k.y}`, 1);
    this.rx = this.izgara.baslangic.x + 0.5; this.ry = this.izgara.baslangic.y + 0.5; this.aci = ACI(yon); this.sarj = 0;
    /* sabit katman: zemin, asfalt, şeritler, istasyon */
    const g = this.sabit.clear();
    for (let y = -1; y <= this.yukseklik; y++) for (let x = -1; x <= this.genislik; x++) {
      const t = this.izgara.hucre(x, y);
      if (t === "bina") kare(g, x, y, RENK.zemin);
      else if (t === "istasyon") istasyon(g, x, y);
      else {
        kare(g, x, y, RENK.asfalt, RENK.asfaltKenar);
        const a = iso(x + 0.42, y + 0.5), b = iso(x + 0.58, y + 0.5), c = iso(x + 0.5, y + 0.42), d = iso(x + 0.5, y + 0.58);
        const yatay = this.izgara.gecilebilir(x - 1, y) || this.izgara.gecilebilir(x + 1, y);
        if (yatay) g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 2, color: RENK.serit, alpha: 0.8 });
        else g.moveTo(c.x, c.y).lineTo(d.x, d.y).stroke({ width: 2, color: RENK.serit, alpha: 0.8 });
      }
    }
    this.sigdir();
  }

  protected ciz() {
    if (!this.izgara) return;
    const g = this.dinamik.clear();
    /* ressam algoritması: x + y küçük olan (ekranda geride kalan) önce çizilir */
    const nesneler: { d: number; f: () => void }[] = [];
    for (let y = 0; y < this.yukseklik; y++) for (let x = 0; x < this.genislik; x++) {
      if (this.izgara.hucre(x, y) === "bina") {
        const tur = y === this.yukseklik - 1 || x === this.genislik - 1 ? "on" : y === 0 || x === 0 ? "arka" : "ic";
        nesneler.push({ d: x + y, f: () => bina(g, x, y, tur) });
      }
      else { const o = this.kar.get(`${x},${y}`) ?? 0; if (o > 0.01) nesneler.push({ d: x + y - 0.1, f: () => karYigini(g, x, y, o) }); }
    }
    nesneler.push({ d: this.rx + this.ry - 1 + 0.05, f: () => robot(g, this.rx, this.ry, this.aci, RENK.robot, true, this.sarj) });
    nesneler.sort((p, q) => p.d - q.d).forEach((n) => n.f());
  }

  /** İzi oynatır. Biterse true, durdurulursa false. */
  async oynat(iz: Kare[]): Promise<boolean> {
    this.durdur();
    const kimlik = this.oynatmaKimligi;
    const ilk = iz[0];
    this.rx = ilk.x + 0.5; this.ry = ilk.y + 0.5; this.aci = ACI(ilk.yon); this.kirli = true;
    this.kareDinle?.(ilk, 0);
    for (let i = 1; i < iz.length; i++) {
      const k = iz[i], once = iz[i - 1];
      let devam = true;
      if (k.olay === "ileri") {
        const [x0, y0, x1, y1] = [once.x + 0.5, once.y + 0.5, k.x + 0.5, k.y + 0.5];
        let savruldu = false;
        devam = await this.gecis(k.temizlenen ? 340 : 260, (t) => {
          const e = yumusak(t);
          this.rx = x0 + (x1 - x0) * e; this.ry = y0 + (y1 - y0) * e;
          if (k.temizlenen) {
            const anahtar = `${k.temizlenen.x},${k.temizlenen.y}`;
            this.kar.set(anahtar, Math.max(0, 1 - Math.max(0, (t - 0.25) / 0.6)));
            if (!savruldu && t > 0.3) {
              savruldu = true;
              const p = iso(k.temizlenen.x + 0.5, k.temizlenen.y + 0.5, 10);
              const ileri = iso(x1 - x0, y1 - y0);
              const n = Math.hypot(ileri.x, ileri.y) || 1;
              /* kar yana savrulur: ilerleme yönüne dik */
              this.savrulma.patlat(p.x, p.y, { x: -ileri.y / n, y: ileri.x / n });
              this.savrulma.patlat(p.x, p.y, { x: ileri.y / n, y: -ileri.x / n }, 8);
            }
          }
        }, kimlik);
      } else if (k.olay === "sol" || k.olay === "sag") {
        const a0 = this.aci, d = aciFarki(a0, ACI(k.yon));
        devam = await this.gecis(200, (t) => { this.aci = a0 + d * yumusak(t); }, kimlik);
      } else if (k.olay === "sarj") {
        devam = await this.gecis(520, (t) => { this.sarj = t < 1 ? 1 : 0; }, kimlik);
      } else if (k.olay === "carpma") {
        const [x0, y0] = [this.rx, this.ry];
        const ileri = [Math.sin(this.aci) * 0.18, -Math.cos(this.aci) * 0.18];
        this.sars();
        devam = await this.gecis(320, (t) => { const b = Math.sin(t * Math.PI); this.rx = x0 + ileri[0] * b; this.ry = y0 + ileri[1] * b; }, kimlik);
      } else if (k.olay === "batarya" || k.olay === "cok_adim") {
        devam = await this.gecis(500, () => {}, kimlik);
      }
      if (!devam) return false;
      this.kareDinle?.(k, i);
    }
    return true;
  }

  /** Oynatmadan doğrudan son duruma geç (hareketi azalt / hızlı göster) */
  sonaGit(iz: Kare[]) {
    this.durdur();
    for (const k of iz) if (k.temizlenen) this.kar.set(`${k.temizlenen.x},${k.temizlenen.y}`, 0);
    const s = iz.at(-1)!;
    this.rx = s.x + 0.5; this.ry = s.y + 0.5; this.aci = ACI(s.yon);
    this.kareDinle?.(s, iz.length - 1);
    this.kirli = true;
  }
}

/* ---------------- Sınıf Robot Ligi ---------------- */
const LIG_RENK = [0xd7262e, 0x22a6a0];
export class LigSahnesi extends TemelSahne {
  private kare: MacKaresi | null = null;
  private poz: { x: number; y: number; aci: number }[] = [];
  private toplar = new Map<string, number>();
  private etiketler: Container[] = [];
  kareDinle: ((k: MacKaresi) => void) | null = null;

  static async kur(kutu: HTMLElement, adlar: [string, string]): Promise<LigSahnesi> {
    const s = new LigSahnesi(await pixiKur(kutu));
    s.adlar(adlar);
    return s;
  }
  private constructor(app: Application) {
    super(app);
    this.genislik = 9; this.yukseklik = 9;
    const g = this.sabit;
    /* çevrede karlı kenar, içeride meydan taşları */
    for (let y = -1; y <= 9; y++) for (let x = -1; x <= 9; x++) {
      const ic = x >= 0 && y >= 0 && x < 9 && y < 9;
      kare(g, x, y, ic ? ((x + y) % 2 ? RENK.meydan : ton(RENK.meydan, -0.03)) : RENK.zemin, ic ? RENK.meydanCizgi : undefined);
    }
    for (const [x, y] of [[0, 4], [8, 4]]) {
      const c = iso(x + 0.5, y + 0.5);
      g.ellipse(c.x, c.y, 22, 11).stroke({ width: 2, color: LIG_RENK[x ? 1 : 0], alpha: 0.5 });
    }
    this.sigdir();
  }
  adlar(a: [string, string]) {
    this.etiketler.forEach((t) => t.destroy({ children: true }));
    this.etiketler = a.map((ad, i) => {
      /* etiket: renkli hap + beyaz yazı (yazı arka planın üstünde olsun diye ayrı kap) */
      const kap = new Container();
      const t = new Text({ text: ad.length > 16 ? ad.slice(0, 15) + "…" : ad, style: { fontFamily: "Lexend, sans-serif", fontSize: 13, fontWeight: "700", fill: 0xffffff } });
      t.anchor.set(0.5, 1);
      const arka = new Graphics().roundRect(-t.width / 2 - 9, -t.height - 4, t.width + 18, t.height + 7, 11).fill(LIG_RENK[i]);
      kap.addChild(arka, t);
      this.kok.addChild(kap);
      return kap;
    });
  }
  goster(k: MacKaresi) {
    this.kare = k;
    this.poz = k.robotlar.map((r) => ({ x: r.x + 0.5, y: r.y + 0.5, aci: ACI(r.yon) }));
    this.toplar.clear();
    for (const t of k.toplar) this.toplar.set(`${t.x},${t.y}`, 1);
    this.kareDinle?.(k);
    this.kirli = true;
  }
  protected ciz() {
    if (!this.kare) return;
    const g = this.dinamik.clear();
    const nesneler: { d: number; f: () => void }[] = [];
    for (const [a, o] of this.toplar) { const [x, y] = a.split(",").map(Number); nesneler.push({ d: x + y, f: () => kartopu(g, x + 0.5, y + 0.5, o) }); }
    this.poz.forEach((p, i) => nesneler.push({ d: p.x + p.y - 1 + 0.05, f: () => robot(g, p.x, p.y, p.aci, LIG_RENK[i], true) }));
    nesneler.sort((a, b) => a.d - b.d).forEach((n) => n.f());
    this.poz.forEach((p, i) => { const e = iso(p.x, p.y, 48); this.etiketler[i]?.position.set(e.x, e.y); });
  }
  async oynat(kareler: MacKaresi[], baslangic = 0): Promise<boolean> {
    this.durdur();
    const kimlik = this.oynatmaKimligi;
    this.goster(kareler[baslangic]);
    for (let i = baslangic + 1; i < kareler.length; i++) {
      const k = kareler[i], once = this.poz.map((p) => ({ ...p }));
      const hedef = k.robotlar.map((r) => ({ x: r.x + 0.5, y: r.y + 0.5, aci: ACI(r.yon) }));
      const toplanan = k.toplanan.map((t) => `${t.x},${t.y}`);
      const ok = await this.gecis(240, (t) => {
        const e = yumusak(t);
        this.poz = once.map((p, j) => ({ x: p.x + (hedef[j].x - p.x) * e, y: p.y + (hedef[j].y - p.y) * e, aci: p.aci + aciFarki(p.aci, hedef[j].aci) * e }));
        for (const a of toplanan) this.toplar.set(a, Math.max(0, 1 - Math.max(0, (t - 0.5) * 2)));
      }, kimlik);
      if (!ok) return false;
      for (const a of toplanan) {
        this.toplar.delete(a);
        const [x, y] = a.split(",").map(Number); const p = iso(x + 0.5, y + 0.5, 12);
        this.savrulma.patlat(p.x, p.y, { x: 0, y: -1 }, 10);
      }
      this.kare = k; this.kareDinle?.(k); this.kirli = true;
    }
    return true;
  }
}
