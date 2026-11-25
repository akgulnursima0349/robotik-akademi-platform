/* 3D stüdyo: renderer, ışık, ortam yansıması, zemin, kamera ve kalite ayarı.
   Kurs bilgisayarı (ThinkPad, dahili Intel grafik) için: ilk saniyelerde kare hızı ölçülür, gerekirse gölge ve çözünürlük düşer. */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Kalite = "yuksek" | "orta" | "dusuk";
export const webglVar = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };

function zeminDokusu(): THREE.CanvasTexture {
  const n = 512, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#dfe3e9"; c.fillRect(0, 0, n, n);
  c.strokeStyle = "rgba(120,130,150,.18)"; c.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * n / 4, 0); c.lineTo(i * n / 4, n); c.stroke(); c.beginPath(); c.moveTo(0, i * n / 4); c.lineTo(n, i * n / 4); c.stroke(); }
  c.strokeStyle = "rgba(120,130,150,.32)"; c.lineWidth = 3; c.strokeRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export class Studyo {
  readonly renderer: THREE.WebGLRenderer;
  readonly sahne = new THREE.Scene();
  readonly kamera: THREE.PerspectiveCamera;
  readonly kontrol: OrbitControls;
  readonly gunes: THREE.DirectionalLight;
  readonly hedef = new THREE.Vector3();
  kalite: Kalite = "yuksek";
  /** her karede çağrılır (saniye) */
  guncelle: (dt: number, t: number) => void = () => {};
  private istek = 0; private son = 0; private olcum: number[] = []; private gozlem?: ResizeObserver;

  constructor(readonly kap: HTMLElement, secenek: { kalite?: Kalite } = {}) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.className = "l3-tuval";
    kap.append(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.sahne.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.sahne.environmentIntensity = 0.42;
    const arka = new THREE.Color(0xdde1e7);
    this.sahne.background = arka;
    this.sahne.fog = new THREE.Fog(arka, 3.2, 9);

    this.kamera = new THREE.PerspectiveCamera(34, 1, 0.01, 40);
    this.kamera.position.set(0.55, 0.38, 0.6);
    this.kontrol = new OrbitControls(this.kamera, this.renderer.domElement);
    this.kontrol.enableDamping = true; this.kontrol.dampingFactor = 0.08;
    this.kontrol.minDistance = 0.18; this.kontrol.maxDistance = 5;
    this.kontrol.maxPolarAngle = Math.PI * 0.47;

    /* ışık: sıcak ana ışık (gölge), soğuk dolgu, arkadan kenar ışığı */
    this.gunes = new THREE.DirectionalLight(0xfff4e6, 2.4);
    this.gunes.position.set(1.2, 2.2, 0.9);
    this.gunes.castShadow = true;
    this.gunes.shadow.mapSize.set(2048, 2048);
    const gk = this.gunes.shadow.camera; gk.left = gk.bottom = -0.55; gk.right = gk.top = 0.55; gk.near = 0.5; gk.far = 5;
    this.gunes.shadow.bias = -0.0004; this.gunes.shadow.normalBias = 0.002; this.gunes.shadow.radius = 4;
    this.sahne.add(this.gunes, this.gunes.target);
    this.sahne.add(new THREE.HemisphereLight(0xdfe8ff, 0xc9c3b8, 0.75));
    const kenar = new THREE.DirectionalLight(0xd6e4ff, 0.9); kenar.position.set(-1.5, 1.0, -1.6); this.sahne.add(kenar);

    /* zemin: ızgaralı açık gri stüdyo zemini */
    const zd = zeminDokusu(); zd.repeat.set(30, 30);
    const zemin = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: zd, roughness: 0.95 }));
    zemin.rotation.x = -Math.PI / 2; zemin.position.y = -0.0005; zemin.receiveShadow = true;
    this.sahne.add(zemin);

    this.kaliteUygula(secenek.kalite ?? "yuksek");
    this.gozlem = new ResizeObserver(() => this.boyutla()); this.gozlem.observe(kap);
    this.boyutla();
    this.renderer.setAnimationLoop((ms) => this.kare(ms));
  }

  kaliteUygula(k: Kalite) {
    this.kalite = k;
    const oran = Math.min(devicePixelRatio || 1, k === "yuksek" ? 2 : k === "orta" ? 1.25 : 1);
    this.renderer.setPixelRatio(oran);
    this.renderer.shadowMap.enabled = k !== "dusuk";
    this.gunes.shadow.mapSize.set(k === "yuksek" ? 2048 : 1024, k === "yuksek" ? 2048 : 1024);
    this.gunes.shadow.map?.dispose(); (this.gunes.shadow as any).map = null;
    this.sahne.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
    this.boyutla();
  }

  boyutla() {
    const w = Math.max(1, this.kap.clientWidth), h = Math.max(1, this.kap.clientHeight);
    this.renderer.setSize(w, h, false);
    this.kamera.aspect = w / h; this.kamera.updateProjectionMatrix();
  }

  /** gölge kamerası hedefi izler: küçük bir alanda keskin gölge */
  golgeyiTasi(p: THREE.Vector3) {
    this.gunes.target.position.copy(p);
    this.gunes.position.set(p.x + 1.2, p.y + 2.2, p.z + 0.9);
  }

  private kare(ms: number) {
    const t = ms / 1000, dt = this.son ? Math.min(0.1, t - this.son) : 1 / 60; this.son = t;
    /* ilk 3 saniye kare hızını ölç; yavaşsa kaliteyi düşür */
    if (this.olcum.length < 180 && dt > 0) {
      this.olcum.push(dt);
      if (this.olcum.length === 90 || this.olcum.length === 180) {
        const fps = this.olcum.length / this.olcum.reduce((a, b) => a + b, 0);
        if (fps < 24 && this.kalite !== "dusuk") this.kaliteUygula(this.kalite === "yuksek" ? "orta" : "dusuk");
        else if (fps < 40 && this.kalite === "yuksek") this.kaliteUygula("orta");
        if (this.olcum.length === 90) this.olcum = this.olcum.slice(0, 90);
      }
    }
    this.guncelle(dt, t);
    this.kontrol.update();
    this.renderer.render(this.sahne, this.kamera);
  }

  /** test ve ekran görüntüsü için: bir kare çiz */
  ciz() { this.renderer.render(this.sahne, this.kamera); }

  kapat() {
    cancelAnimationFrame(this.istek);
    this.renderer.setAnimationLoop(null);
    this.gozlem?.disconnect();
    this.kontrol.dispose();
    this.sahne.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const x of mats) { for (const v of Object.values(x)) if (v instanceof THREE.Texture) v.dispose(); x.dispose(); }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
