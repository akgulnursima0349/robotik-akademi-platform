/* Çizgi izleyen sahnesi: halı, SiroLine, tur oynatma ve kamera kipleri.
   Simülasyon önceden koşturulur (deterministik); sahne kareleri zamana göre ara değerleyerek oynatır. */
import * as THREE from "three";
import { DONGU_ARALIGI, type CizgiKaresi, type CizgiSonucu, type Pist } from "@sra/robot-motoru";
import { Studyo, type Kalite } from "@sra/sahne/studyo";
import { siroline, type SiroLineModeli } from "@sra/sahne/siroline";
import { HALI_KALINLIK, pistHalisi } from "./pist";

export type KameraKipi = "takip" | "serbest" | "ust";
const yumusak = (a: number, b: number, k: number) => a + (b - a) * k;

export class CizgiSahnesi {
  readonly studyo: Studyo;
  readonly robot: SiroLineModeli;
  kip: KameraKipi = "serbest";
  /** vitrin kamerasının uzaklık çarpanı (küçük kutularda yakın) */
  tanitimMesafesi = 1;
  hiz = 1;
  kareDinle: (k: CizgiKaresi) => void = () => {};
  private hali?: ReturnType<typeof pistHalisi>;
  private pist?: Pist;
  private oynatma: { kareler: CizgiKaresi[]; t: number; bitir: (tamam: boolean) => void } | null = null;
  private kamHedef = new THREE.Vector3();
  /** Yarış başlangıcı: robotun önüne konan blok; kaldırılınca engel sensörü yolu boş görür ve robot kalkar */
  private blok: THREE.Mesh;
  private blokKalkis = -1;
  baslangicBlogu = false;
  private kamKonum = new THREE.Vector3();

  constructor(kap: HTMLElement, kalite?: Kalite) {
    this.studyo = new Studyo(kap, { kalite });
    this.robot = siroline();
    this.studyo.sahne.add(this.robot.kok);
    this.studyo.guncelle = (dt) => this.kare(dt);
    this.studyo.kontrol.autoRotateSpeed = 0.7;
    const bd = document.createElement("canvas"); bd.width = bd.height = 128;
    const c = bd.getContext("2d")!; c.fillStyle = "#d9b98c"; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 14; i++) { c.strokeStyle = `rgba(120,80,40,${0.12 + (i % 3) * 0.05})`; c.lineWidth = 2; c.beginPath(); c.moveTo(0, i * 9 + 4); c.bezierCurveTo(40, i * 9 + 8, 90, i * 9, 128, i * 9 + 5); c.stroke(); }
    const dk = new THREE.CanvasTexture(bd); dk.colorSpace = THREE.SRGBColorSpace;
    this.blok = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.08), new THREE.MeshStandardMaterial({ map: dk, roughness: 0.8 }));
    this.blok.castShadow = true; this.blok.visible = false;
    this.studyo.sahne.add(this.blok);
  }

  /** Bloğu robotun önüne koyar (robotun başlangıç konumuna göre) */
  private blokKoy() {
    const r = this.robot.kok, yon = r.rotation.y;
    const ileri = new THREE.Vector3(Math.cos(yon), 0, -Math.sin(yon));
    this.blok.position.copy(r.position).addScaledVector(ileri, 0.19).setY(HALI_KALINLIK + 0.025);
    this.blok.rotation.y = yon;
    this.blok.visible = this.baslangicBlogu; this.blokKalkis = -1;
  }

  /** Pisti kurar, robotu başlangıca koyar, kamerayı tanıtım dönüşüne alır. */
  yukle(pist: Pist) {
    if (this.hali) { this.studyo.sahne.remove(this.hali.kok); this.hali.kok.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); }); }
    this.pist = pist;
    this.hali = pistHalisi(pist);
    this.studyo.sahne.add(this.hali.kok);
    this.sifirla();
  }

  sifirla() {
    this.durdur();
    if (!this.pist) return;
    const b = this.pist.baslangic();
    this.konumla({ t: 0, x: b.x, y: b.y, yon: b.yon, sol: 0, sag: 0, sensor: [0, 0, 0, 900, 900, 0, 0, 0], solTeker: 0, sagTeker: 0, ilerleme: 0, sapma: 0 });
    this.hali?.izSil();
    this.blokKoy();
    this.tanitim();
  }

  /** Robotun çevresinde yavaş dönen vitrin kamerası. */
  tanitim(mesafe = this.tanitimMesafesi) {
    const p = this.robot.kok.position, k = this.studyo.kontrol;
    const ileri = new THREE.Vector3(Math.cos(this.robot.kok.rotation.y), 0, -Math.sin(this.robot.kok.rotation.y));
    k.target.copy(p).addScaledVector(ileri, 0.08).setY(0.02);
    this.studyo.kamera.position.copy(p).addScaledVector(ileri, 0.34 * mesafe + 0.08).add(new THREE.Vector3(0, 0.17 * mesafe, 0)).add(new THREE.Vector3(ileri.z, 0, -ileri.x).multiplyScalar(0.27 * mesafe));
    k.autoRotate = true;
    this.studyo.golgeyiTasi(k.target);
  }

  kipSec(k: KameraKipi) {
    this.kip = k; this.studyo.kontrol.autoRotate = false;
    if (k === "ust" && this.pist) {
      const { x0, y0, x1, y1 } = this.pist.sinir;
      const c = new THREE.Vector3((x0 + x1) / 2000, 0, -(y0 + y1) / 2000), boy = Math.max(x1 - x0, (y1 - y0) * 1.6) / 1000;
      this.studyo.kontrol.target.copy(c);
      this.studyo.kamera.position.set(c.x, boy * 1.25, c.z + boy * 0.55);
    }
  }

  /** Kareleri oynatır; sonuna gelince true, durdurulursa false döner. */
  oynat(s: CizgiSonucu): Promise<boolean> {
    this.durdur();
    this.hali?.izSil();
    this.studyo.kontrol.autoRotate = false;
    if (this.kip === "takip") this.takipKamerasi(1);
    /* hareketi azalt açıksa tur oynatılmaz: iz bütün olarak çizilir, robot son konumda durur */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.blok.visible = false;
      for (const k of s.kareler) this.hali?.iz(k.x, k.y);
      const son = s.kareler[s.kareler.length - 1];
      this.konumla(son); this.kareDinle(son);
      if (this.kip === "takip") this.takipKamerasi(1);
      return Promise.resolve(true);
    }
    this.blokKoy();
    this.blokKalkis = s.baslangic > 0 ? s.baslangic : -1;
    return new Promise((bitir) => { this.oynatma = { kareler: s.kareler, t: 0, bitir }; });
  }

  durdur() { if (this.oynatma) { const b = this.oynatma.bitir; this.oynatma = null; b(false); } }
  get oynuyor() { return !!this.oynatma; }

  private kare(dt: number) {
    const o = this.oynatma;
    if (o) {
      o.t += dt * this.hiz;
      /* blok kaldırılır: yukarı ve geriye doğru, 0,35 sn */
      if (this.blokKalkis >= 0 && this.blok.visible) {
        const f = (o.t - this.blokKalkis) / 0.35;
        if (f >= 0) { this.blok.position.y = HALI_KALINLIK + 0.025 + Math.min(1, f) * 0.14; this.blok.rotation.z = Math.min(1, f) * 0.5; if (f >= 1) this.blok.visible = false; }
      }
      const son = o.kareler[o.kareler.length - 1];
      const i = Math.min(o.kareler.length - 1, Math.floor(o.t / DONGU_ARALIGI));
      const a = o.kareler[i], b = o.kareler[Math.min(o.kareler.length - 1, i + 1)];
      const f = Math.max(0, Math.min(1, (o.t - a.t) / DONGU_ARALIGI));
      const k: CizgiKaresi = { ...a, x: yumusak(a.x, b.x, f), y: yumusak(a.y, b.y, f), yon: yumusak(a.yon, b.yon, f), solTeker: yumusak(a.solTeker, b.solTeker, f), sagTeker: yumusak(a.sagTeker, b.sagTeker, f) };
      this.konumla(k);
      this.hali?.iz(k.x, k.y);
      this.kareDinle(a);
      if (o.t >= son.t) { this.oynatma = null; this.konumla(son); this.kareDinle(son); o.bitir(true); }
    }
    if (this.kip === "takip" && (o || !this.studyo.kontrol.autoRotate)) this.takipKamerasi(Math.min(1, dt * 3.2));
    else if (this.kip === "serbest" && o) {
      /* serbest kipte hedef robotu izler, kullanıcı açıyı seçer */
      const p = this.robot.kok.position, k = this.studyo.kontrol, fark = p.clone().setY(0.02).sub(k.target);
      k.target.add(fark); this.studyo.kamera.position.add(fark);
    }
    this.studyo.golgeyiTasi(this.robot.kok.position);
  }

  private takipKamerasi(k: number) {
    const p = this.robot.kok.position, yon = this.robot.kok.rotation.y;
    const ileri = new THREE.Vector3(Math.cos(yon), 0, -Math.sin(yon));
    this.kamHedef.copy(p).addScaledVector(ileri, 0.2).setY(0.02);
    this.kamKonum.copy(p).addScaledVector(ileri, -0.22).setY(0.13);
    const kon = this.studyo.kontrol;
    kon.target.lerp(this.kamHedef, k);
    this.studyo.kamera.position.lerp(this.kamKonum, k * 0.8);
  }

  private konumla(k: CizgiKaresi) {
    this.robot.kok.position.set(k.x / 1000, HALI_KALINLIK, -k.y / 1000);
    this.robot.kok.rotation.y = k.yon;
    this.robot.tekerleriDondur(k.solTeker, k.sagTeker);
    this.robot.ledler(k.sensor);
  }

  kapat() { this.durdur(); this.studyo.kapat(); }
}
