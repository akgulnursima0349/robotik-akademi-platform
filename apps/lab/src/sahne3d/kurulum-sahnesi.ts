/* Kurulum rehberinin sahnesi: yeşil kesim matı üstünde SiroLine, adım adım parçalar yerine iner. */
import * as THREE from "three";
import { Studyo } from "@sra/sahne/studyo";
import { PARCALAR, siroline, type ParcaAdi } from "@sra/sahne/siroline";

/** Bir adımın kamerası: robot ekseninde (mm) hedef ve kamera konumu */
export interface AdimKamerasi { hedef: [number, number, number]; kamera: [number, number, number] }

function matDokusu(): THREE.CanvasTexture {
  const n = 1024, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#1f6a52"; c.fillRect(0, 0, n, n);
  const kare = n / 20; // 1 kare = 1 cm (mat 20 cm'lik döşeme)
  for (let i = 0; i <= 20; i++) {
    c.strokeStyle = i % 5 === 0 ? "rgba(235,255,245,.55)" : "rgba(235,255,245,.22)"; c.lineWidth = i % 5 === 0 ? 2.2 : 1.2;
    c.beginPath(); c.moveTo(i * kare, 0); c.lineTo(i * kare, n); c.stroke();
    c.beginPath(); c.moveTo(0, i * kare); c.lineTo(n, i * kare); c.stroke();
  }
  c.strokeStyle = "rgba(255,214,10,.55)"; c.lineWidth = 2; c.setLineDash([10, 8]);
  c.beginPath(); c.moveTo(0, n / 2); c.lineTo(n, n / 2); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

const MM = 0.001;
const yumusak = (x: number) => 1 - Math.pow(1 - x, 3);
const zipla = (x: number) => { const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

export class KurulumSahnesi {
  readonly studyo: Studyo;
  private robot = siroline();
  private inis: { g: THREE.Group; t: number }[] = [];
  private kam: { hedef: THREE.Vector3; konum: THREE.Vector3; t: number; basH: THREE.Vector3; basK: THREE.Vector3 } | null = null;
  private azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(kap: HTMLElement) {
    this.studyo = new Studyo(kap);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.003, 0.42), [0, 0, 0, 0, 0, 0].map((_, i) => i === 2 ? new THREE.MeshStandardMaterial({ map: (() => { const t = matDokusu(); t.repeat.set(3, 2.1); return t; })(), roughness: 0.85 }) : new THREE.MeshStandardMaterial({ color: 0x17513e, roughness: 0.9 })));
    mat.position.set(0.08, 0.0015, 0); mat.receiveShadow = true;
    this.studyo.sahne.add(mat);
    this.robot.kok.position.y = 0.003;
    this.studyo.sahne.add(this.robot.kok);
    this.robot.ledler([0, 0, 0, 0, 0, 0, 0, 0]);
    this.studyo.kontrol.autoRotateSpeed = 0.8;
    this.studyo.golgeyiTasi(new THREE.Vector3(0.08, 0, 0));
    this.studyo.guncelle = (dt) => this.kare(dt);
  }

  /** `gorunur` listesindeki parçalar görünür; `yeni` parça yukarıdan iner. */
  goster(gorunur: ParcaAdi[], yeni: ParcaAdi | null, kamera: AdimKamerasi, donsun = false) {
    for (const ad of PARCALAR) {
      const g = this.robot.parcalar[ad];
      g.visible = gorunur.includes(ad);
      if (ad !== yeni) g.position.y = 0;
    }
    this.inis = [];
    if (yeni && !this.azHareket) { const g = this.robot.parcalar[yeni]; g.position.y = 70; this.inis.push({ g, t: 0 }); }
    const k = this.studyo.kontrol;
    k.autoRotate = donsun;
    const v = (p: [number, number, number]) => new THREE.Vector3(p[0] * MM, p[1] * MM + 0.003, -p[2] * MM);
    const hedef = v(kamera.hedef), konum = v(kamera.kamera);
    /* dar (dikey) ekranda kamerayı geri çek ki parça kadraja sığsın */
    const oran = this.studyo.kamera.aspect, uzak = oran < 0.9 ? 1.7 : oran < 1.3 ? 1.25 : 1;
    konum.sub(hedef).multiplyScalar(uzak).add(hedef);
    if (this.azHareket) { k.target.copy(hedef); this.studyo.kamera.position.copy(konum); this.kam = null; }
    else this.kam = { hedef, konum, t: 0, basH: k.target.clone(), basK: this.studyo.kamera.position.clone() };
  }

  /** test için: animasyonlar bitti mi */
  get durgun() { return this.inis.length === 0 && !this.kam; }

  private kare(dt: number) {
    for (const i of this.inis) { i.t = Math.min(1, i.t + dt / 0.9); i.g.position.y = 70 * (1 - zipla(i.t)); }
    this.inis = this.inis.filter((i) => i.t < 1);
    if (this.kam) {
      const c = this.kam; c.t = Math.min(1, c.t + dt / 1.1); const f = yumusak(c.t);
      this.studyo.kontrol.target.lerpVectors(c.basH, c.hedef, f);
      this.studyo.kamera.position.lerpVectors(c.basK, c.konum, f);
      if (c.t >= 1) this.kam = null;
    }
  }

  kapat() { this.studyo.kapat(); }
}
