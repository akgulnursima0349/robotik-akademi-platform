/* Kar Küreme 3D: karlı bir Sivas mahallesinin maketi. Sokaklar ızgara kareleri, binalar karlı çatılı evler ve apartmanlar,
   karlı karelerde kar yığınları; kar küreme robotu bıçağıyla karı iki yana savurur. Motor izini (Kare[]) oynatır.
   Ölçek: bir kare 16 cm'lik maket karesi (sahne metre). Kuzey -z, doğu +x. */
import * as THREE from "three";
import { Izgara, type Kare } from "@sra/robot-motoru";
import { Studyo } from "@sra/sahne/studyo";

const C = 0.16;                    // kare kenarı (m)
const KAL = 0.05;                  // maket tabanının kalınlığı
const yonAci = (yon: number) => (1 - yon) * Math.PI / 2; // robotun +x'i yöne baksın
const aciFarki = (a: number, b: number) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const yumusak = (t: number) => t * t * (3 - 2 * t);
/** sabit tohumlu küçük rastgele: konuma bağlı çeşitlilik (her açılışta aynı mahalle) */
const hash = (x: number, y: number, k = 0) => { const s = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };

const M = {
  asfalt: new THREE.MeshStandardMaterial({ color: 0x3a3e46, roughness: 0.9 }),
  serit: new THREE.MeshStandardMaterial({ color: 0xe8e4d6, roughness: 0.7 }),
  kaldirim: new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.85 }),
  kar: new THREE.MeshStandardMaterial({ color: 0xf7f9fc, roughness: 0.95 }),
  yolKari: new THREE.MeshStandardMaterial({ color: 0xe4ecf6, roughness: 0.9 }),
  karGolge: new THREE.MeshStandardMaterial({ color: 0xe6ecf5, roughness: 0.95 }),
  taban: new THREE.MeshStandardMaterial({ color: 0x8a6a4c, roughness: 0.85 }),
  pencere: new THREE.MeshStandardMaterial({ color: 0xffd98a, roughness: 0.4, emissive: 0xffb84d, emissiveIntensity: 0.55 }),
  pencereKoyu: new THREE.MeshStandardMaterial({ color: 0x5b6b80, roughness: 0.3 }),
  kapi: new THREE.MeshStandardMaterial({ color: 0x6b4630, roughness: 0.7 }),
  cati: new THREE.MeshStandardMaterial({ color: 0x9c4a3a, roughness: 0.7 }),
  agac: new THREE.MeshStandardMaterial({ color: 0x2f5d48, roughness: 0.9 }),
  govde: new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 }),
  robot: new THREE.MeshStandardMaterial({ color: 0xf08a1c, roughness: 0.45 }),
  robotKoyu: new THREE.MeshStandardMaterial({ color: 0x2b2e35, roughness: 0.55 }),
  bicak: new THREE.MeshStandardMaterial({ color: 0xffc21a, roughness: 0.4, metalness: 0.2 }),
  celik: new THREE.MeshStandardMaterial({ color: 0xb9bdc4, roughness: 0.35, metalness: 0.9 }),
  ekran: new THREE.MeshStandardMaterial({ color: 0x0f1218, roughness: 0.3, emissive: 0x2a9df4, emissiveIntensity: 0.6 }),
  istasyon: new THREE.MeshStandardMaterial({ color: 0x2f3440, roughness: 0.5 }),
  istasyonIsik: new THREE.MeshStandardMaterial({ color: 0x2bd47a, roughness: 0.4, emissive: 0x22c06a, emissiveIntensity: 0.8 }),
  isaret: new THREE.MeshStandardMaterial({ color: 0xff8a1a, roughness: 0.3, emissive: 0xff6a00, emissiveIntensity: 0.9 })
};
const DUVAR = [0xf1e6d2, 0xe9d3c0, 0xd9e3ee, 0xf0dcc8, 0xe3e7da, 0xd8cfe6].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));

function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); k.castShadow = true; k.receiveShadow = true; return k; }

/** Kar örtüsü: kareyi kaplayan, kenarlara doğru inen engebeli tabaka (komşu karlı karelerle birleşip sokağı doldurur) */
function karYiginiGeo(tohum: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(C * 1.04, C * 1.04, 12, 12); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, h = 0.016;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), u = Math.abs(x) / (C * 0.52), v = Math.abs(z) / (C * 0.52);
    const kenar = Math.max(0, 1 - Math.pow(Math.max(u, v), 5));
    const n = 1 + Math.sin(x * 90 + tohum) * Math.cos(z * 77 + tohum * 1.7) * 0.22 + Math.sin(x * 210 + z * 180 + tohum) * 0.06;
    p.setY(i, h * kenar * n);
  }
  g.computeVertexNormals();
  return g;
}

/** Bina: hücrenin türüne göre ev (beşik çatı) ya da apartman; ön sıradakiler alçak bahçe duvarı + ağaç */
function bina(x: number, y: number, tur: "on" | "arka" | "ic"): THREE.Group {
  const g = new THREE.Group(), r = hash(x, y), duvar = DUVAR[Math.floor(hash(x, y, 1) * DUVAR.length)];
  g.position.set((x + 0.5) * C, 0, (y + 0.5) * C);
  if (tur === "on") {
    /* kameraya bakan kenar: sokakları kapatmasın diye alçak duvar, üstü karlı, bir de çam */
    /* bahçe: zemin hizasında kar, yola bakan kenarlarda alçak çit */
    for (const [dx, dz] of [[0, -1], [-1, 0]]) { const c = kutu(dx ? 0.006 : C * 0.9, 0.018, dx ? C * 0.9 : 0.006, M.govde, dx * C * 0.44, 0.009, dz * C * 0.44); c.castShadow = true; g.add(c); g.add(kutu(dx ? 0.009 : C * 0.9, 0.004, dx ? C * 0.9 : 0.009, M.kar, dx * C * 0.44, 0.02, dz * C * 0.44)); }
    if (r > 0.35) {
      const agac = new THREE.Group();
      agac.add(kutu(0.008, 0.03, 0.008, M.govde, 0, 0.04, 0));
      for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.038 - k * 0.009, 0.04, 10), M.agac); c.position.y = 0.06 + k * 0.022; c.castShadow = true; agac.add(c); const kk = new THREE.Mesh(new THREE.ConeGeometry(0.03 - k * 0.008, 0.016, 10), M.kar); kk.position.y = 0.075 + k * 0.022; agac.add(kk); }
      agac.position.set((hash(x, y, 2) - 0.5) * 0.05, 0, (hash(x, y, 3) - 0.5) * 0.05);
      g.add(agac);
    }
    return g;
  }
  const katlar = tur === "arka" ? 2 + Math.floor(r * 3) : 1 + Math.floor(r * 2);
  const kat = 0.045, h = katlar * kat, w = C * 0.86;
  g.add(kutu(w, h, w, duvar, 0, h / 2, 0));
  /* pencereler: dört yüzde, katlara göre */
  for (let k = 0; k < katlar; k++) for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) for (const s of [-0.22, 0.22]) {
    const isik = hash(x * 3 + k, y * 5 + s * 10, nx + nz * 2) > 0.35;
    const p = kutu(nx ? 0.002 : 0.022, 0.024, nz ? 0.002 : 0.022, isik ? M.pencere : M.pencereKoyu);
    p.position.set(nx * (w / 2 + 0.001) + (nz ? s * w : 0), k * kat + kat * 0.55, nz * (w / 2 + 0.001) + (nx ? s * w : 0));
    p.castShadow = false; g.add(p);
  }
  if (tur === "ic" && katlar === 1) {
    /* tek katlı ev: beşik çatı, üstü karlı */
    const cati = new THREE.Shape(); cati.moveTo(-w / 2 - 0.008, 0); cati.lineTo(0, 0.05); cati.lineTo(w / 2 + 0.008, 0); cati.lineTo(-w / 2 - 0.008, 0);
    const cg = new THREE.ExtrudeGeometry(cati, { depth: w + 0.016, bevelEnabled: false }); cg.translate(0, 0, -(w + 0.016) / 2);
    const c = new THREE.Mesh(cg, M.cati); c.position.y = h; c.castShadow = true; g.add(c);
    const kar = new THREE.Mesh(cg, M.kar); kar.scale.set(1.02, 0.55, 1.02); kar.position.y = h + 0.024; kar.castShadow = true; g.add(kar);
    g.add(kutu(0.014, 0.03, 0.002, M.kapi, 0, 0.015, w / 2 + 0.001));
  } else {
    /* apartman: düz çatı, kar örtüsü ve korkuluk */
    g.add(kutu(w + 0.006, 0.012, w + 0.006, M.kar, 0, h + 0.006, 0));
    g.add(kutu(0.02, 0.02, 0.02, M.kaldirim, w * 0.25, h + 0.02, -w * 0.2));
  }
  return g;
}

/** Kar küreme robotu: turuncu gövde, sarı açılı bıçak, paletler, tepe lambası ve batarya ekranı */
function robot(): { kok: THREE.Group; lamba: THREE.Mesh; ekran: THREE.MeshStandardMaterial } {
  const r = new THREE.Group();
  for (const z of [-0.032, 0.032]) {
    const palet = kutu(0.085, 0.026, 0.018, M.robotKoyu, -0.004, 0.015, z); r.add(palet);
    for (const x of [-0.034, 0, 0.034]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.02, 14), M.celik); t.rotation.x = Math.PI / 2; t.position.set(x - 0.004, 0.013, z); r.add(t); }
  }
  r.add(kutu(0.07, 0.034, 0.058, M.robot, -0.006, 0.044, 0));
  r.add(kutu(0.032, 0.026, 0.044, M.robot, -0.02, 0.074, 0));
  const ekranM = M.ekran.clone();
  const ekran = kutu(0.002, 0.014, 0.03, ekranM, -0.003, 0.076, 0); r.add(ekran);
  const lamba = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.008, 0.012, 14), M.isaret.clone()); lamba.position.set(-0.024, 0.093, 0); r.add(lamba);
  /* bıçak: V değil, hafif kavisli tek parça, robotun önünde ve alçakta */
  const s = new THREE.Shape(); s.moveTo(-0.05, 0); s.quadraticCurveTo(0, 0.01, 0.05, 0); s.lineTo(0.05, 0.034); s.quadraticCurveTo(0, 0.046, -0.05, 0.034); s.lineTo(-0.05, 0);
  const bg = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2 });
  const b = new THREE.Mesh(bg, M.bicak); b.rotation.y = Math.PI / 2; b.rotation.z = 0; b.position.set(0.05, 0.004, 0); b.castShadow = true;
  const bicak = new THREE.Group(); bicak.add(b); bicak.rotation.z = -0.25; r.add(bicak);
  for (const z of [-0.02, 0.02]) r.add(kutu(0.03, 0.006, 0.006, M.robotKoyu, 0.036, 0.03, z));
  r.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  return { kok: r, lamba, ekran: ekranM };
}

/** Kar parçacıkları: gökten yağan kar + bıçağın savurduğu kar */
class Parcaciklar {
  readonly yagan: THREE.Points;
  readonly savrulan: THREE.Points;
  private hiz: Float32Array; private omur: Float32Array; private siradaki = 0;
  constructor(alan: THREE.Box3, adet: number) {
    const n = adet, poz = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) poz.set([alan.min.x + Math.random() * (alan.max.x - alan.min.x), Math.random() * 0.9, alan.min.z + Math.random() * (alan.max.z - alan.min.z)], i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(poz, 3));
    this.yagan = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.006, transparent: true, opacity: 0.9, depthWrite: false }));
    const m = 260, sp = new Float32Array(m * 3).fill(-10);
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    this.savrulan = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.008, transparent: true, opacity: 0.95, depthWrite: false }));
    this.hiz = new Float32Array(m * 3); this.omur = new Float32Array(m);
  }
  patlat(x: number, z: number, yx: number, yz: number, adet = 22) {
    const p = this.savrulan.geometry.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < adet; k++) {
      const i = this.siradaki = (this.siradaki + 1) % this.omur.length;
      p.setXYZ(i, x, 0.02, z);
      const h = 0.25 + Math.random() * 0.35;
      this.hiz.set([yx * h + (Math.random() - 0.5) * 0.15, 0.35 + Math.random() * 0.5, yz * h + (Math.random() - 0.5) * 0.15], i * 3);
      this.omur[i] = 0.6 + Math.random() * 0.3;
    }
  }
  guncelle(dt: number) {
    const p = this.yagan.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 0.12;
      const x = p.getX(i) + Math.sin(y * 9 + i) * dt * 0.02;
      if (y < 0) y += 0.9;
      p.setXYZ(i, x, y, p.getZ(i));
    }
    p.needsUpdate = true;
    const s = this.savrulan.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.omur.length; i++) {
      if (this.omur[i] <= 0) continue;
      this.omur[i] -= dt; this.hiz[i * 3 + 1] -= 2.2 * dt;
      let y = s.getY(i) + this.hiz[i * 3 + 1] * dt;
      if (y < 0.012) { y = 0.012; this.hiz[i * 3] *= 0.5; this.hiz[i * 3 + 2] *= 0.5; }
      s.setXYZ(i, s.getX(i) + this.hiz[i * 3] * dt, y, s.getZ(i) + this.hiz[i * 3 + 2] * dt);
      if (this.omur[i] <= 0) s.setXYZ(i, 0, -10, 0);
    }
    s.needsUpdate = true;
  }
}

export class KarSahnesi3D {
  readonly studyo: Studyo;
  hiz = 1;
  kareDinle: ((k: Kare, i: number) => void) | null = null;
  private dunya = new THREE.Group();
  private yiginlar = new Map<string, THREE.Mesh>();
  private rb = robot();
  private parcacik: Parcaciklar | null = null;
  private nesil = 0;
  private gecisler: { bitis: number; f: (t: number) => void; sure: number; t: number; coz: (b: boolean) => void; kimlik: number }[] = [];
  private sarsinti = 0;
  private zaman = 0;
  private azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

  private constructor(kutu: HTMLElement) {
    this.studyo = new Studyo(kutu);
    const s = this.studyo.sahne;
    const gok = new THREE.Color(0xdfe7f2); s.background = gok; s.fog = new THREE.Fog(gok, 2.2, 6);
    this.studyo.gunes.color.set(0xfff1e0); this.studyo.gunes.intensity = 2.1;
    s.add(this.dunya, this.rb.kok);
    this.studyo.guncelle = (dt) => this.kare(dt);
  }
  static async kur(kutu: HTMLElement): Promise<KarSahnesi3D> { return new KarSahnesi3D(kutu); }

  yukle(harita: readonly string[], yon: number) {
    this.durdur();
    const iz = new Izgara(harita), W = iz.genislik, H = iz.yukseklik;
    this.dunya.clear(); this.yiginlar.clear();
    if (this.parcacik) { this.studyo.sahne.remove(this.parcacik.yagan, this.parcacik.savrulan); }
    /* maket tabanı: karlı kenar payı ve ahşap yanlar */
    const pay = 0.08, tw = W * C + pay * 2, th = H * C + pay * 2;
    const taban = new THREE.Mesh(new THREE.BoxGeometry(tw, KAL, th), [M.taban, M.taban, M.kar, M.taban, M.taban, M.taban]);
    taban.position.set(W * C / 2, -KAL / 2, H * C / 2); taban.receiveShadow = true; taban.castShadow = true; this.dunya.add(taban);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = iz.hucre(x, y), cx = (x + 0.5) * C, cz = (y + 0.5) * C;
      if (t === "bina") {
        const tur = y === H - 1 || x === W - 1 ? "on" : y === 0 || x === 0 ? "arka" : "ic";
        this.dunya.add(kutu(C, 0.004, C, M.kar, cx, 0.002, cz));
        this.dunya.add(bina(x, y, tur));
        continue;
      }
      /* yol: asfalt, kenar çizgisi; komşu binaya bakan kenarda kaldırım */
      this.dunya.add(kutu(C, 0.003, C, M.asfalt, cx, 0.0015, cz));
      const yatay = iz.gecilebilir(x - 1, y) || iz.gecilebilir(x + 1, y);
      if (t !== "istasyon") this.dunya.add(kutu(yatay ? C * 0.32 : 0.004, 0.0008, yatay ? 0.004 : C * 0.32, M.serit, cx, 0.0034, cz));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!iz.gecilebilir(x + dx, y + dy)) {
        this.dunya.add(kutu(dx ? 0.014 : C, 0.008, dx ? C : 0.014, M.kaldirim, cx + dx * (C / 2 - 0.007), 0.004, cz + dy * (C / 2 - 0.007)));
      }
      if (t === "istasyon") {
        this.dunya.add(kutu(C * 0.8, 0.004, C * 0.8, M.istasyon, cx, 0.004, cz));
        this.dunya.add(kutu(C * 0.6, 0.0012, C * 0.06, M.istasyonIsik, cx, 0.0065, cz - C * 0.25));
        const direk = kutu(0.012, 0.07, 0.012, M.istasyon, cx + C * 0.36, 0.035, cz + C * 0.36); this.dunya.add(direk);
        this.dunya.add(kutu(0.02, 0.014, 0.004, M.istasyonIsik, cx + C * 0.36, 0.06, cz + C * 0.36 - 0.008));
      }
      if (iz.karVar(x, y)) {
        const k = new THREE.Mesh(karYiginiGeo(x * 7 + y * 13), M.yolKari); k.position.set(cx, 0.003, cz); k.castShadow = true; k.receiveShadow = true;
        this.dunya.add(k); this.yiginlar.set(`${x},${y}`, k);
      }
    }
    /* robot */
    this.rb.kok.position.set((iz.baslangic.x + 0.5) * C, 0.003, (iz.baslangic.y + 0.5) * C);
    this.rb.kok.rotation.set(0, yonAci(yon), 0);
    this.takip = false;
    this.lamba("normal");
    /* kar yağışı ve kamera */
    const alan = new THREE.Box3(new THREE.Vector3(-pay, 0, -pay), new THREE.Vector3(W * C + pay, 0.9, H * C + pay));
    this.parcacik = new Parcaciklar(alan, this.azHareket ? 0 : Math.min(900, Math.round(W * H * 9)));
    this.studyo.sahne.add(this.parcacik.yagan, this.parcacik.savrulan);
    const merkez = new THREE.Vector3(W * C / 2, 0.02, H * C / 2);
    this.studyo.kontrol.target.copy(merkez);
    this.cerceve = { w: tw, h: th, merkez };
    this.kameraYerlestir();
    this.studyo.golgeyiTasi(merkez);
    const gk = this.studyo.gunes.shadow.camera, yar = Math.max(tw, th) / 2 + 0.1;
    gk.left = gk.bottom = -yar; gk.right = gk.top = yar; gk.updateProjectionMatrix();
  }

  private cerceve: { w: number; h: number; merkez: THREE.Vector3 } | null = null;
  /** Maketi kadraja sığdır: güneydoğudan, yukarıdan bakış; uzaklık görüş açısına ve en-boy oranına göre */
  /** uzun caddelerde kamera robotu izler (bütün caddeyi sığdırınca robot çok küçük kalıyor) */
  private takip = false;
  kameraYerlestir() {
    const c = this.cerceve; if (!c) return;
    this.takip = c.w > c.h * 2.5;
    if (this.takip) { this.takipEt(1); const sis = this.studyo.sahne.fog as THREE.Fog; sis.near = 1.2; sis.far = 3.5; return; }
    const k = this.studyo.kamera, uzun = c.w > c.h * 2.5;
    const yon = (uzun ? new THREE.Vector3(0.06, 0.7, 0.72) : new THREE.Vector3(0.22, 0.78, 0.6)).normalize();
    const vfov = k.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * k.aspect);
    const d = Math.max(c.w / 2 / Math.tan(hfov / 2), (c.h * 0.75 + 0.12) / 2 / Math.tan(vfov / 2)) * 1.12 + 0.1;
    k.position.copy(c.merkez).addScaledVector(yon, d);
    /* sis uzaklığa göre: yakın maket net, uzak zemin soluk */
    const sis = this.studyo.sahne.fog as THREE.Fog; sis.near = d * 1.1; sis.far = d * 3.2;
  }

  private takipEt(k: number) {
    const r = this.rb.kok.position;
    const hedef = new THREE.Vector3(r.x + 0.12, 0.02, r.z);
    this.studyo.kontrol.target.lerp(hedef, k);
    this.studyo.kamera.position.lerp(new THREE.Vector3(r.x + 0.02, 0.42, r.z + 0.62), k);
  }

  private lamba(durum: "normal" | "sarj" | "bitti") {
    const m = this.rb.lamba.material as THREE.MeshStandardMaterial;
    const renk = durum === "sarj" ? 0x2bd47a : durum === "bitti" ? 0xe0262e : 0xff8a1a;
    m.color.setHex(renk); m.emissive.setHex(renk);
    this.rb.ekran.emissive.setHex(durum === "sarj" ? 0x2bd47a : durum === "bitti" ? 0x7a1010 : 0x2a9df4);
  }

  durdur() { this.nesil++; for (const g of this.gecisler) g.coz(false); this.gecisler = []; }

  private gecis(ms: number, f: (t: number) => void, kimlik: number): Promise<boolean> {
    const sure = this.azHareket ? 0 : ms / 1000 / this.hiz;
    if (sure <= 0) { f(1); return Promise.resolve(kimlik === this.nesil); }
    return new Promise((coz) => this.gecisler.push({ bitis: 0, f, sure, t: 0, coz, kimlik }));
  }

  private kare(dt: number) {
    this.zaman += dt;
    for (const g of this.gecisler.slice()) {
      if (g.kimlik !== this.nesil) { this.gecisler.splice(this.gecisler.indexOf(g), 1); g.coz(false); continue; }
      g.t = Math.min(1, g.t + dt / g.sure); g.f(g.t);
      if (g.t >= 1) { this.gecisler.splice(this.gecisler.indexOf(g), 1); g.coz(true); }
    }
    this.parcacik?.guncelle(dt);
    if (this.takip) this.takipEt(Math.min(1, dt * 3));
    this.rb.lamba.rotation.y += dt * 4;
    if (this.sarsinti > 0) { this.sarsinti = Math.max(0, this.sarsinti - dt); const g = this.sarsinti * 0.02; this.studyo.kamera.position.x += Math.sin(this.zaman * 90) * g; }
  }

  async oynat(iz: Kare[]): Promise<boolean> {
    this.durdur();
    const kimlik = this.nesil;
    const r = this.rb.kok, ilk = iz[0];
    r.position.set((ilk.x + 0.5) * C, 0.003, (ilk.y + 0.5) * C); r.rotation.set(0, yonAci(ilk.yon), 0);
    this.lamba("normal");
    this.kareDinle?.(ilk, 0);
    for (let i = 1; i < iz.length; i++) {
      const k = iz[i], once = iz[i - 1];
      let devam = true;
      if (k.olay === "ileri") {
        const [x0, z0, x1, z1] = [(once.x + 0.5) * C, (once.y + 0.5) * C, (k.x + 0.5) * C, (k.y + 0.5) * C];
        const yigin = k.temizlenen ? this.yiginlar.get(`${k.temizlenen.x},${k.temizlenen.y}`) : undefined;
        let savruldu = false;
        devam = await this.gecis(k.temizlenen ? 420 : 300, (t) => {
          const e = yumusak(t);
          r.position.x = x0 + (x1 - x0) * e; r.position.z = z0 + (z1 - z0) * e;
          r.position.y = 0.003 + (yigin ? Math.sin(t * Math.PI * 6) * 0.0012 : 0);
          if (yigin) {
            const o = Math.max(0, 1 - Math.max(0, (t - 0.2) / 0.65));
            yigin.scale.set(Math.max(0.05, o), Math.max(0.02, o), Math.max(0.05, o)); yigin.visible = o > 0.02;
            if (!savruldu && t > 0.28 && this.parcacik) {
              savruldu = true;
              const dx = Math.sign(x1 - x0), dz = Math.sign(z1 - z0);
              /* kar ilerleme yönüne dik, iki yana savrulur */
              this.parcacik.patlat(x1, z1, -dz, dx); this.parcacik.patlat(x1, z1, dz, -dx, 14);
            }
          }
        }, kimlik);
      } else if (k.olay === "sol" || k.olay === "sag") {
        const a0 = r.rotation.y, d = aciFarki(a0, yonAci(k.yon));
        devam = await this.gecis(240, (t) => { r.rotation.y = a0 + d * yumusak(t); }, kimlik);
      } else if (k.olay === "sarj") {
        this.lamba("sarj");
        devam = await this.gecis(620, (t) => { r.position.y = 0.003 + Math.sin(t * Math.PI) * 0.004; }, kimlik);
        this.lamba("normal");
      } else if (k.olay === "carpma") {
        const [x0, z0] = [r.position.x, r.position.z], a = r.rotation.y;
        const ix = Math.cos(a) * C * 0.18, iz2 = -Math.sin(a) * C * 0.18;
        if (!this.azHareket) this.sarsinti = 0.3;
        devam = await this.gecis(360, (t) => { const b = Math.sin(t * Math.PI); r.position.x = x0 + ix * b; r.position.z = z0 + iz2 * b; }, kimlik);
      } else if (k.olay === "batarya" || k.olay === "cok_adim") {
        this.lamba("bitti");
        devam = await this.gecis(500, () => {}, kimlik);
      }
      if (!devam) return false;
      this.kareDinle?.(k, i);
    }
    return true;
  }

  sonaGit(iz: Kare[]) {
    this.durdur();
    for (const k of iz) if (k.temizlenen) { const y = this.yiginlar.get(`${k.temizlenen.x},${k.temizlenen.y}`); if (y) y.visible = false; }
    const s = iz[iz.length - 1];
    this.rb.kok.position.set((s.x + 0.5) * C, 0.003, (s.y + 0.5) * C); this.rb.kok.rotation.set(0, yonAci(s.yon), 0);
    this.kareDinle?.(s, iz.length - 1);
  }

  yokEt() { this.durdur(); this.studyo.kapat(); }
}
