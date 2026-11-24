/* RizBot labirent sahnesi: MEB "Labirent Ustası" pisti (hücre 20 cm, duvar 8 cm yüksek, 18 mm kalın;
   mat siyah zemin, parlak beyaz duvar, bitiş hücresinde beyaz alan) ve ürün fotoğraflarından RizBot modeli.
   Oynatma, simülasyonun hız profilinden gelen zamanlarla yapılır: 1× gerçek süre. */
import * as THREE from "three";
import { haritaOku, HUCRE_MM, DUVAR_MM, DUVAR_YUKSEKLIK_MM, type LabirentHaritasi, type LabirentKaresi } from "@sra/robot-motoru";
import { Studyo } from "./studyo";
import { rizbot, type RizbotModeli } from "./rizbot";

const C = HUCRE_MM / 1000, T = DUVAR_MM / 1000, H = DUVAR_YUKSEKLIK_MM / 1000;
const TABAN = 0.018;
const yonAci = (yon: number) => (1 - yon) * Math.PI / 2;
const aciFarki = (a: number, b: number) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const yumusak = (t: number) => t * t * (3 - 2 * t);
const merkez = (x: number, y: number) => [(x + 0.5) * C, (y + 0.5) * C] as const;

const M = {
  zemin: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.92 }),
  kontra: new THREE.MeshStandardMaterial({ color: 0xc8a57a, roughness: 0.8 }),
  duvar: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f1, roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.15 }),
  bitis: new THREE.MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.4 }),
  isik: new THREE.MeshBasicMaterial({ color: 0x5cf0a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  iz: new THREE.MeshBasicMaterial({ color: 0x3d7bff, transparent: true, opacity: 0.16, depthWrite: false }),
  baslangic: new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.7 })
};

export interface LabirentZamani { bas: number; son: number }

export class LabirentSahnesi3D {
  readonly studyo: Studyo;
  hiz = 1;
  kareDinle: ((k: LabirentKaresi, i: number) => void) | null = null;
  /** oynatma saati (sn): sayaç için her karede */
  saatDinle: ((t: number) => void) | null = null;
  private dunya = new THREE.Group();
  private rb: RizbotModeli = rizbot();
  private harita: LabirentHaritasi | null = null;
  private izler = new Map<string, THREE.Mesh>();
  private bitisIsigi: THREE.Mesh | null = null;
  private isinlar: Record<"on" | "sol" | "sag", { m: THREE.Mesh; nokta: THREE.Mesh }[]> = { on: [], sol: [], sag: [] };
  private isinOmru = { on: 0, sol: 0, sag: 0 };
  private nesil = 0;
  private gecisler: { f: (t: number) => void; sure: number; t: number; coz: (b: boolean) => void; kimlik: number }[] = [];
  private sarsinti = 0;
  private zaman = 0;
  private takip = false;
  private parlama = 0;
  private azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

  private constructor(kutu: HTMLElement) {
    this.studyo = new Studyo(kutu);
    const s = this.studyo.sahne;
    const arka = new THREE.Color(0xdde1e7); s.background = arka; s.fog = new THREE.Fog(arka, 2.4, 7);
    this.studyo.gunes.intensity = 2.2;
    s.add(this.dunya, this.rb.kok);
    this.isinlariKur();
    this.studyo.guncelle = (dt) => this.kare(dt);
  }
  static async kur(kutu: HTMLElement): Promise<LabirentSahnesi3D> { return new LabirentSahnesi3D(kutu); }

  /** Sensör ışınları robotun çocuğu (mm ölçeğinde): okunan yönde kısa süre görünür */
  private isinlariKur() {
    for (const taraf of ["on", "sol", "sag"] as const) for (const s of this.rb.sensorler[taraf]) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff4436, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.4, 1.4), mat);
      m.geometry.translate(0.5, 0, 0);
      m.position.set(s.x, 12, s.z); m.rotation.y = s.yon;
      const nm = mat.clone(); nm.side = THREE.DoubleSide;
      const nokta = new THREE.Mesh(new THREE.CircleGeometry(4, 16), nm);
      this.rb.kok.children[0].add(m, nokta);
      this.isinlar[taraf].push({ m, nokta });
    }
  }

  yukle(harita: readonly string[]) {
    this.durdur();
    const h = this.harita = haritaOku(harita), W = h.genislik, Y = h.yukseklik;
    this.dunya.clear(); this.izler.clear();
    /* taban: siyah zemin, kontrplak kenar */
    const tw = W * C + T, th = Y * C + T;
    const taban = new THREE.Mesh(new THREE.BoxGeometry(tw, TABAN, th), [M.kontra, M.kontra, M.zemin, M.kontra, M.kontra, M.kontra]);
    taban.position.set(W * C / 2, -TABAN / 2, Y * C / 2); taban.receiveShadow = true; taban.castShadow = true;
    this.dunya.add(taban);
    /* duvarlar ve direkler: örnekli (instanced) çizim, büyük pistte de hızlı */
    const yatay: [number, number][] = [], dikey: [number, number][] = [];
    const d = (x: number, y: number) => h.duvar[y * W + x];
    for (let y = 0; y < Y; y++) for (let x = 0; x < W; x++) {
      if (d(x, y) & 1) yatay.push([x, y]);
      if (d(x, y) & 8) dikey.push([x, y]);
      if (y === Y - 1 && d(x, y) & 4) yatay.push([x, Y]);
      if (x === W - 1 && d(x, y) & 2) dikey.push([W, y]);
    }
    const parca = new THREE.BoxGeometry(C - T, H, T);
    const duvarlar = new THREE.InstancedMesh(parca, M.duvar, yatay.length + dikey.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), dik = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), bir = new THREE.Vector3(1, 1, 1);
    let i = 0;
    for (const [x, y] of yatay) duvarlar.setMatrixAt(i++, m4.compose(new THREE.Vector3((x + 0.5) * C, H / 2, y * C), q, bir));
    for (const [x, y] of dikey) duvarlar.setMatrixAt(i++, m4.compose(new THREE.Vector3(x * C, H / 2, (y + 0.5) * C), dik, bir));
    duvarlar.castShadow = duvarlar.receiveShadow = true;
    const direkler = new THREE.InstancedMesh(new THREE.BoxGeometry(T, H, T), M.duvar, (W + 1) * (Y + 1));
    i = 0;
    for (let y = 0; y <= Y; y++) for (let x = 0; x <= W; x++) direkler.setMatrixAt(i++, m4.compose(new THREE.Vector3(x * C, H / 2, y * C), q, bir));
    direkler.castShadow = direkler.receiveShadow = true;
    this.dunya.add(duvarlar, direkler);
    /* bitiş: beyaz alan; varınca üstünde yeşil parıltı */
    const [bx, bz] = merkez(h.bitis.x, h.bitis.y);
    const beyaz = new THREE.Mesh(new THREE.BoxGeometry(C - T - 0.03, 0.0012, C - T - 0.03), M.bitis); beyaz.position.set(bx, 0.0006, bz); beyaz.receiveShadow = true;
    this.bitisIsigi = new THREE.Mesh(new THREE.BoxGeometry(C - T - 0.01, 0.05, C - T - 0.01), M.isik.clone());
    this.bitisIsigi.position.set(bx, 0.026, bz);
    this.dunya.add(beyaz, this.bitisIsigi);
    /* başlangıç hücresi: koyu gri çerçeve */
    const [sx, sz] = merkez(h.baslangic.x, h.baslangic.y);
    for (const [w, dd, ox, oz] of [[C - T - 0.02, 0.006, 0, -(C - T) / 2 + 0.013], [C - T - 0.02, 0.006, 0, (C - T) / 2 - 0.013], [0.006, C - T - 0.02, -(C - T) / 2 + 0.013, 0], [0.006, C - T - 0.02, (C - T) / 2 - 0.013, 0]]) {
      const k = new THREE.Mesh(new THREE.BoxGeometry(w, 0.0008, dd), M.baslangic); k.position.set(sx + ox, 0.0004, sz + oz); this.dunya.add(k);
    }
    this.robotuKoy(h.baslangic.x, h.baslangic.y, 0);
    this.rb.led("hazir"); this.rb.fanHizi = 0;
    /* kamera ve gölge */
    const orta = new THREE.Vector3(W * C / 2, 0.02, Y * C / 2);
    this.cerceve = { w: tw, h: th, merkez: orta };
    this.kameraYerlestir();
    this.studyo.golgeyiTasi(orta);
    const gk = this.studyo.gunes.shadow.camera, yar = this.takip ? 0.9 : Math.max(tw, th) / 2 + 0.12;
    gk.left = gk.bottom = -yar; gk.right = gk.top = yar; gk.updateProjectionMatrix();
  }

  private robotuKoy(x: number, y: number, yon: number) {
    const [px, pz] = merkez(x, y);
    this.rb.kok.position.set(px, 0, pz); this.rb.kok.rotation.set(0, yonAci(yon), 0);
  }

  private cerceve: { w: number; h: number; merkez: THREE.Vector3 } | null = null;
  /** küçük labirent kadraja sığar; MEB pisti (1,6 × 3,2 m) gibi büyüklerde kamera robotu izler */
  kameraYerlestir() {
    const c = this.cerceve; if (!c) return;
    this.takip = Math.max(c.w, c.h) > 1.45;
    const sis = this.studyo.sahne.fog as THREE.Fog;
    if (this.takip) { this.studyo.kontrol.target.copy(this.rb.kok.position); this.takipEt(1); sis.near = 2; sis.far = 5.5; return; }
    const k = this.studyo.kamera, yon = new THREE.Vector3(0.12, 0.9, 0.5).normalize();
    const vfov = k.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * k.aspect);
    const dd = Math.max((c.w + 0.06) / 2 / Math.tan(hfov / 2), (c.h * 0.92 + 0.16) / 2 / Math.tan(vfov / 2)) * 1.08 + 0.12;
    this.studyo.kontrol.target.copy(c.merkez);
    k.position.copy(c.merkez).addScaledVector(yon, dd);
    sis.near = dd * 1.2; sis.far = dd * 3.4;
  }

  private takipEt(k: number) {
    /* robotu izle ama pistin kenarında boş zemini göstermemek için hedefi pistin içinde tut */
    const r = this.rb.kok.position, c = this.cerceve!;
    const x = THREE.MathUtils.clamp(r.x, Math.min(0.5, c.w / 2), Math.max(c.w - 0.5, c.w / 2));
    const z = THREE.MathUtils.clamp(r.z, Math.min(0.42, c.h / 2), Math.max(c.h - 0.5, c.h / 2));
    this.studyo.kontrol.target.lerp(new THREE.Vector3(x, 0.02, z - 0.12), k);
    this.studyo.kamera.position.lerp(new THREE.Vector3(x + 0.18, 1.35, z + 0.78), k);
    this.studyo.golgeyiTasi(new THREE.Vector3(r.x, 0, r.z));
  }

  durdur() { this.nesil++; for (const g of this.gecisler) g.coz(false); this.gecisler = []; this.rb.fanHizi = 0; }

  private gecis(sn: number, f: (t: number) => void, kimlik: number): Promise<boolean> {
    const sure = this.azHareket ? 0 : sn / this.hiz;
    if (sure <= 0) { f(1); return Promise.resolve(kimlik === this.nesil); }
    return new Promise((coz) => this.gecisler.push({ f, sure, t: 0, coz, kimlik }));
  }

  private kare(dt: number) {
    this.zaman += dt;
    for (const g of this.gecisler.slice()) {
      if (g.kimlik !== this.nesil) { this.gecisler.splice(this.gecisler.indexOf(g), 1); g.coz(false); continue; }
      g.t = Math.min(1, g.t + dt / g.sure); g.f(g.t);
      if (g.t >= 1) { this.gecisler.splice(this.gecisler.indexOf(g), 1); g.coz(true); }
    }
    this.rb.guncelle(dt);
    /* sensör ışınları söner */
    for (const taraf of ["on", "sol", "sag"] as const) {
      this.isinOmru[taraf] = Math.max(0, this.isinOmru[taraf] - dt * this.hiz);
      const o = Math.min(1, this.isinOmru[taraf] / 0.12);
      for (const { m, nokta } of this.isinlar[taraf]) { (m.material as THREE.MeshBasicMaterial).opacity = 0.75 * o; (nokta.material as THREE.MeshBasicMaterial).opacity = nokta.visible ? 0.9 * o : 0; }
    }
    if (this.bitisIsigi) { const m = this.bitisIsigi.material as THREE.MeshBasicMaterial; m.opacity = this.parlama * (0.28 + 0.12 * Math.sin(this.zaman * 5)); }
    if (this.takip) this.takipEt(this.azHareket ? 1 : Math.min(1, dt * 3));
    if (this.sarsinti > 0) { this.sarsinti = Math.max(0, this.sarsinti - dt); const g = this.sarsinti * 0.02; this.studyo.kamera.position.x += Math.sin(this.zaman * 90) * g; }
  }

  /** sensör okuması: o yöndeki ışını yak; duvar varsa ucunda nokta */
  private isinGoster(taraf: "on" | "sol" | "sag", duvar: boolean) {
    const ic = (C - T) / 2 * 1000;   // hücre ortasından duvar iç yüzüne (mm)
    for (const [i, { m, nokta }] of this.isinlar[taraf].entries()) {
      const s = this.rb.sensorler[taraf][i];
      const bas = taraf === "on" ? s.x : Math.abs(s.z);
      const uzun = duvar ? Math.max(4, ic - bas) : ic - bas + HUCRE_MM * 0.9;
      m.scale.x = uzun;
      nokta.visible = duvar;
      const yx = Math.cos(s.yon), yz = -Math.sin(s.yon);
      nokta.position.set(s.x + yx * uzun - yx * 0.5, 12, s.z + yz * uzun - yz * 0.5);
      nokta.rotation.set(0, s.yon - Math.PI / 2, 0);
    }
    this.isinOmru[taraf] = 0.45;
  }

  private izBirak(x: number, y: number) {
    const a = `${x},${y}`;
    let m = this.izler.get(a);
    if (!m) {
      m = new THREE.Mesh(new THREE.PlaneGeometry(C - T - 0.012, C - T - 0.012), M.iz.clone());
      m.rotation.x = -Math.PI / 2; const [px, pz] = merkez(x, y); m.position.set(px, 0.0009, pz);
      m.userData.n = 0; this.dunya.add(m); this.izler.set(a, m);
    }
    m.userData.n++;
    (m.material as THREE.MeshBasicMaterial).opacity = Math.min(0.34, 0.08 + 0.065 * m.userData.n);
  }

  async oynat(iz: LabirentKaresi[], zaman: LabirentZamani[]): Promise<boolean> {
    if (!this.harita) return false;
    this.durdur();
    const kimlik = this.nesil, r = this.rb.kok, ilk = iz[0];
    for (const m of this.izler.values()) this.dunya.remove(m);
    this.izler.clear(); this.parlama = 0;
    this.robotuKoy(ilk.x, ilk.y, ilk.yon);
    this.rb.led("hazir"); this.rb.fanHizi = 70;
    this.izBirak(ilk.x, ilk.y);
    this.kareDinle?.(ilk, 0); this.saatDinle?.(0);
    let teker = 0;
    for (let i = 1; i < iz.length; i++) {
      const k = iz[i], once = iz[i - 1], z = zaman[i];
      const sure = Math.max(0, z.son - z.bas);
      let devam = true;
      /* robot hareket edince eski sensör ışınları söner (yoksa dönerken duvarların içinden geçer) */
      if (k.olay !== "bak") this.isinOmru = { on: 0, sol: 0, sag: 0 };
      if (k.olay === "ileri") {
        const [x0, z0] = merkez(once.x, once.y), [x1, z1] = merkez(k.x, k.y), t0 = teker;
        devam = await this.gecis(sure, (t) => {
          r.position.x = x0 + (x1 - x0) * t; r.position.z = z0 + (z1 - z0) * t;
          teker = t0 + HUCRE_MM * t; this.rb.tekerleriDondur(teker, teker);
          this.saatDinle?.(z.bas + sure * t);
        }, kimlik);
        this.izBirak(k.x, k.y);
      } else if (k.olay === "sol" || k.olay === "sag" || k.olay === "geri") {
        const a0 = r.rotation.y, d = k.olay === "geri" ? Math.PI : aciFarki(a0, yonAci(k.yon)), t0 = teker;
        devam = await this.gecis(sure, (t) => {
          const e = yumusak(t); r.rotation.y = a0 + d * e;
          const yay = Math.abs(d) * 43 * e; this.rb.tekerleriDondur(t0 - Math.sign(d) * yay, t0 + Math.sign(d) * yay);
          this.saatDinle?.(z.bas + sure * t);
        }, kimlik);
      } else if (k.olay === "bak" && k.sensor) {
        this.isinGoster(k.sensor.taraf, k.sensor.duvar);
        /* art arda okumalar ışığı görünür kılsın diye çok kısa bekle */
        if (!this.azHareket && iz[i + 1]?.olay !== "bak") devam = await this.gecis(0.04, () => {}, kimlik);
      } else if (k.olay === "carpma") {
        const [x0, z0] = [r.position.x, r.position.z], a = r.rotation.y;
        const ix = Math.cos(a) * 0.022, iz2 = -Math.sin(a) * 0.022;
        if (!this.azHareket) this.sarsinti = 0.3;
        this.rb.led("hata"); this.rb.fanHizi = 0;
        devam = await this.gecis(0.36, (t) => { const b = Math.sin(t * Math.PI); r.position.x = x0 + ix * b; r.position.z = z0 + iz2 * b; }, kimlik);
      } else if (k.olay === "bitis") {
        this.rb.led("bitti"); this.rb.fanHizi = 0; this.saatDinle?.(k.t);
        devam = await this.gecis(0.8, (t) => { this.parlama = Math.min(1, t * 2); }, kimlik);
      } else if (k.olay === "sure" || k.olay === "cok_adim") {
        this.rb.led("hata"); this.rb.fanHizi = 0; this.saatDinle?.(k.t);
        devam = await this.gecis(0.5, () => {}, kimlik);
      }
      if (!devam) return false;
      this.kareDinle?.(k, i);
    }
    this.rb.fanHizi = 0;
    return true;
  }

  sonaGit(iz: LabirentKaresi[]) {
    this.durdur();
    for (const k of iz) if (k.olay === "ileri" || k.olay === "basla") this.izBirak(k.x, k.y);
    const s = iz[iz.length - 1];
    this.robotuKoy(s.x, s.y, s.yon);
    if (s.olay === "bitis") { this.rb.led("bitti"); this.parlama = 1; }
    this.kareDinle?.(s, iz.length - 1);
  }

  yokEt() { this.durdur(); this.studyo.kapat(); }
}
