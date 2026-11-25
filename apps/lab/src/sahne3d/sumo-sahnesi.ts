/* Mini sumo sahnesi: 77 cm ring (dohyo), iki Kenshin, raunt oynatma, temas kıvılcımı, halkadan düşme. */
import * as THREE from "three";
import { baslangic, KARAR, RING, type RauntSonucu, type SumoKaresi } from "@sra/robot-motoru";
import { Studyo } from "./studyo";
import { kenshin, type KenshinModeli } from "./kenshin";

const RING_YUK = 0.025; // m
const TAKIM = [0xd7262e, 0x2a62d6];

function ringDokusu(): THREE.CanvasTexture {
  const n = 2048, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const c = cv.getContext("2d")!, o = n / (RING.yaricap * 2);
  c.fillStyle = "#121315"; c.fillRect(0, 0, n, n);
  const r = (s: number) => { s = Math.sin(s * 12.9898) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < 12000; i++) { c.fillStyle = `rgba(255,255,255,${0.008 + r(i) * 0.02})`; c.fillRect(r(i + 1) * n, r(i + 2) * n, 2, 2); }
  c.strokeStyle = "#f2f2ee"; c.lineWidth = (RING.yaricap - RING.kenarIc) * o;
  c.beginPath(); c.arc(n / 2, n / 2, (RING.yaricap + RING.kenarIc) / 2 * o, 0, Math.PI * 2); c.stroke();
  /* başlangıç çizgileri (kahverengi, 10 cm × 1 cm, aralarında 10 cm) */
  c.fillStyle = "#7a4b2a";
  for (const s of [-1, 1]) c.fillRect(n / 2 + s * 55 * o - 5 * o, n / 2 - 50 * o, 10 * o, 100 * o);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  /* silindir kapağının UV'si dünyaya göre çeyrek tur dönük: çizgiler robotların arasına dik gelsin */
  t.center.set(0.5, 0.5); t.rotation = Math.PI / 2;
  return t;
}

export class SumoSahnesi {
  readonly studyo: Studyo;
  readonly robotlar: [KenshinModeli, KenshinModeli];
  hiz = 1;
  kareDinle: (k: SumoKaresi) => void = () => {};
  private oynatma: { kareler: SumoKaresi[]; t: number; bitir: (tamam: boolean) => void; dusus: number } | null = null;
  private kivilcim: THREE.Points;
  private kivilcimHiz: Float32Array;
  private kivilcimOmur = 0;
  private sarsinti = 0;
  private oncekiTemas = false;
  private azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(kap: HTMLElement) {
    this.studyo = new Studyo(kap);
    const s = this.studyo.sahne;
    /* ring: siyah üst yüz + beyaz kenar dokusu, yan yüzler koyu */
    const ust = new THREE.MeshStandardMaterial({ map: ringDokusu(), roughness: 0.75 });
    const yan = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.8 });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(RING.yaricap / 1000, RING.yaricap / 1000, RING_YUK, 96), [yan, ust, yan]);
    ring.position.y = RING_YUK / 2; ring.receiveShadow = true; ring.castShadow = true; s.add(ring);
    this.robotlar = [kenshin(TAKIM[0]), kenshin(TAKIM[1])];
    for (const r of this.robotlar) s.add(r.kok);
    /* kıvılcımlar */
    const N = 60, poz = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(poz, 3));
    this.kivilcim = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.006, transparent: true, opacity: 0, depthWrite: false }));
    this.kivilcimHiz = new Float32Array(N * 3);
    s.add(this.kivilcim);
    this.studyo.gunes.shadow.camera.left = this.studyo.gunes.shadow.camera.bottom = -0.5;
    this.studyo.gunes.shadow.camera.right = this.studyo.gunes.shadow.camera.top = 0.5;
    this.studyo.golgeyiTasi(new THREE.Vector3(0, 0, 0));
    this.genelBakis();
    /* maç başlamadan: karşı karşıya başlangıç dizilişi */
    baslangic("karsi", 0).forEach(([x, y, yon], i) => { const m = this.robotlar[i].kok; m.position.set(x / 1000, RING_YUK, -y / 1000); m.rotation.set(0, yon, 0); this.robotlar[i].bayraklar(0); });
    this.studyo.guncelle = (dt) => this.kare(dt);
  }

  genelBakis() { this.studyo.kontrol.target.set(0, 0.02, 0); this.studyo.kamera.position.set(0.4, 0.46, 0.58); }
  ustten() { this.studyo.kontrol.target.set(0, 0.02, 0); this.studyo.kamera.position.set(0, 1.25, 0.01); }

  /** Bir karenin durumunu robotlara uygular (dustuDerinlik: halkadan düşme animasyonu, 0–1) */
  private konumla(k: SumoKaresi, dusus = 0) {
    k.robotlar.forEach((r, i) => {
      const m = this.robotlar[i].kok;
      if (r.poz) {
        /* 3D fizik motorunun karesi: tam duruş (kaldırılma, devrilme, gerçek düşüş) */
        m.position.set(r.x / 1000, r.poz.y, -r.y / 1000);
        m.quaternion.set(...r.poz.q);
        this.robotlar[i].tekerleriDondur(r.solYol, r.sagYol);
        this.robotlar[i].bayraklar(k.t / 0.3);
        return;
      }
      let y = RING_YUK, egim = 0;
      if (r.dustu) { y = RING_YUK - dusus * 0.12; egim = dusus * 0.9; }
      m.position.set(r.x / 1000, y, -r.y / 1000);
      m.rotation.set(0, r.yon, 0); m.rotateX(egim * (i ? -1 : 1));
      this.robotlar[i].tekerleriDondur(r.solYol, r.sagYol);
      /* başlama işaretiyle servo bayrakları yukarıdan yana açar (≈0,3 sn) */
      this.robotlar[i].bayraklar(k.t / 0.3);
    });
  }

  goster(k: SumoKaresi) { this.konumla(k); this.kareDinle(k); }

  oynat(r: RauntSonucu): Promise<boolean> {
    this.durdur();
    if (this.azHareket) { const son = r.kareler[r.kareler.length - 1]; this.konumla(son, 1); this.kareDinle(son); return Promise.resolve(true); }
    return new Promise((bitir) => { this.oynatma = { kareler: r.kareler, t: 0, bitir, dusus: 0 }; });
  }
  durdur() { if (this.oynatma) { const b = this.oynatma.bitir; this.oynatma = null; b(false); } }
  get oynuyor() { return !!this.oynatma; }

  private kare(dt: number) {
    const o = this.oynatma;
    if (o) {
      const son = o.kareler[o.kareler.length - 1];
      if (o.t < son.t) {
        o.t = Math.min(son.t, o.t + dt * this.hiz);
        const i = Math.min(o.kareler.length - 1, Math.floor(o.t / KARAR)), a = o.kareler[i], b = o.kareler[Math.min(o.kareler.length - 1, i + 1)];
        const f = Math.max(0, Math.min(1, (o.t - a.t) / KARAR)), ara = (x: number, y: number) => x + (y - x) * f;
        const k: SumoKaresi = { ...a, t: o.t, robotlar: a.robotlar.map((r, j) => ({ ...r, x: ara(r.x, b.robotlar[j].x), y: ara(r.y, b.robotlar[j].y), yon: ara(r.yon, b.robotlar[j].yon), solYol: ara(r.solYol, b.robotlar[j].solYol), sagYol: ara(r.sagYol, b.robotlar[j].sagYol), poz: araPoz(r.poz, b.robotlar[j].poz, f) })) as SumoKaresi["robotlar"] };
        this.konumla(k);
        this.kareDinle(a);
        if (a.temas && !this.oncekiTemas) this.kivilcimPatlat(k);
        this.oncekiTemas = a.temas;
      } else {
        /* raunt bitti: düşen robotun düşüşü (3D fizik karelerinde düşüş zaten kayıtlı) */
        if (son.robotlar[0].poz) o.dusus = 1;
        o.dusus = Math.min(1, o.dusus + dt * this.hiz / 0.6);
        this.konumla(son, o.dusus);
        if (o.dusus >= 1 || !son.robotlar.some((r) => r.dustu)) { this.oynatma = null; this.kareDinle(son); o.bitir(true); }
      }
    }
    /* kıvılcım ve sarsıntı */
    if (this.kivilcimOmur > 0) {
      this.kivilcimOmur -= dt;
      const p = this.kivilcim.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) { this.kivilcimHiz[i * 3 + 1] -= 3 * dt; p.setXYZ(i, p.getX(i) + this.kivilcimHiz[i * 3] * dt, p.getY(i) + this.kivilcimHiz[i * 3 + 1] * dt, p.getZ(i) + this.kivilcimHiz[i * 3 + 2] * dt); }
      p.needsUpdate = true;
      (this.kivilcim.material as THREE.PointsMaterial).opacity = Math.max(0, this.kivilcimOmur / 0.35);
    }
    if (this.sarsinti > 0) {
      this.sarsinti = Math.max(0, this.sarsinti - dt);
      const g = this.sarsinti * 0.01;
      this.studyo.kamera.position.x += (Math.random() - 0.5) * g; this.studyo.kamera.position.y += (Math.random() - 0.5) * g;
    }
  }

  private kivilcimPatlat(k: SumoKaresi) {
    if (this.azHareket) return;
    const [a, b] = k.robotlar, x = (a.x + b.x) / 2000, z = -(a.y + b.y) / 2000;
    const p = this.kivilcim.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, x, RING_YUK + 0.01, z);
      const aci = Math.random() * Math.PI * 2, h = 0.3 + Math.random() * 0.6;
      this.kivilcimHiz.set([Math.cos(aci) * h, 0.4 + Math.random() * 0.8, Math.sin(aci) * h], i * 3);
    }
    p.needsUpdate = true; this.kivilcimOmur = 0.35; this.sarsinti = 0.18;
  }

  kapat() { this.durdur(); this.studyo.kapat(); }
}

/** iki 3D duruş arasında ara değer (yükseklik doğrusal, dönme küresel) */
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
function araPoz(a: SumoKaresi["robotlar"][0]["poz"], b: SumoKaresi["robotlar"][0]["poz"], f: number) {
  if (!a || !b) return a;
  qa.set(...a.q).slerp(qb.set(...b.q), f);
  return { y: a.y + (b.y - a.y) * f, q: [qa.x, qa.y, qa.z, qa.w] as [number, number, number, number] };
}
