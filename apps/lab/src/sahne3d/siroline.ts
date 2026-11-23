/* SiroLine Pleksi: akademinin çizgi izleyen robotu, kodla modellenmiş.
   Ölçüler mağaza fotoğrafından (21,5 × 17,5 cm); birim milimetre.
   Robotun kendi ekseni: +X ileri, +Y yukarı, +Z sağ. Aks merkezi (0, 0, 0) zeminde, tekerlek ekseninin altında. */
import * as THREE from "three";
import { SIROLINE } from "@sra/robot-motoru";

const R_TEKER = SIROLINE.tekerCap / 2;           // 18,5
const IZ = SIROLINE.izGenisligi / 2;             // 72,5: tekerlek merkezinin yana uzaklığı
const TEKER_EN = 25;
const PLEKSI_KAL = 3;
const PLEKSI_ALT = R_TEKER - 11.25 - PLEKSI_KAL; // motor gövdesi pleksinin üstünde, mili teker ekseninde
const PLEKSI_UST = PLEKSI_ALT + PLEKSI_KAL;
export const SENSOR_X = SIROLINE.sensorOnde;     // 168

/* ---------- malzemeler ---------- */
const M = {
  pla: new THREE.MeshStandardMaterial({ color: 0xffd20a, roughness: 0.5, metalness: 0 }),
  icGolge: new THREE.MeshStandardMaterial({ color: 0x4a3a12, roughness: 0.9 }),
  plaKoyu: new THREE.MeshStandardMaterial({ color: 0xe5b400, roughness: 0.6 }),
  pleksi: new THREE.MeshPhysicalMaterial({ color: 0x07080a, roughness: 0.38, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.3, specularIntensity: 0.5 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0xefe0a0, roughness: 0.95 }),
  pcbSiyah: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.55 }),
  pcbKirmizi: new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.5 }),
  pcbMavi: new THREE.MeshStandardMaterial({ color: 0x1d4fc4, roughness: 0.5 }),
  altin: new THREE.MeshStandardMaterial({ color: 0xd7b25a, roughness: 0.3, metalness: 1 }),
  pirinc: new THREE.MeshStandardMaterial({ color: 0xc19a4b, roughness: 0.32, metalness: 1 }),
  gumus: new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.28, metalness: 1 }),
  celik: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.35, metalness: 1 }),
  plastikSiyah: new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.6 }),
  plastikBeyaz: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 }),
  entegre: new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.4 }),
  pilMavi: new THREE.MeshStandardMaterial({ color: 0x1a5fd0, roughness: 0.35, metalness: 0.1 }),
  bant: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.75 }),
  seffaf: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, transmission: 0, transparent: true, opacity: 0.45, clearcoat: 1 }),
  kabloKirmizi: new THREE.MeshStandardMaterial({ color: 0xd4232b, roughness: 0.45 }),
  kabloSiyah: new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.45 }),
  ledKapali: new THREE.MeshStandardMaterial({ color: 0x3a0d10, roughness: 0.3, emissive: 0x000000 }),
};
const SERIT_RENKLERI = [0x7a4a2a, 0xd8262e, 0xf08c1a, 0xf2d21a, 0x2fa84a, 0x2a62d6, 0x8a3fc4, 0x8d9096, 0xf4f4f4, 0x18181a];

function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, yuvarla = 0): THREE.Mesh {
  const g = yuvarla > 0 ? yuvarlakKutu(w, h, d, yuvarla) : new THREE.BoxGeometry(w, h, d);
  const k = new THREE.Mesh(g, m); k.position.set(x, y, z); return k;
}
/** Kenarları yuvarlatılmış kutu (3D baskı ve plastik parçalar için). */
function yuvarlakKutu(w: number, h: number, d: number, r: number) {
  const s = new THREE.Shape(); const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - r * 0.8, bevelEnabled: true, bevelThickness: r * 0.4, bevelSize: r * 0.4, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(h - r * 0.8) / 2); g.rotateX(-Math.PI / 2);
  return g;
}
function silindir(r: number, uz: number, m: THREE.Material, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, uz, seg), m); }
function golgeli(o: THREE.Object3D) { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }

/** Kart üstü baskı: beyaz çizgiler, lehim adaları. Logo yok. */
function baskiDokusu(w: number, d: number, taban: string, ciz: (c: CanvasRenderingContext2D, o: number) => void) {
  const o = 8, cv = document.createElement("canvas"); cv.width = Math.round(w * o); cv.height = Math.round(d * o);
  const c = cv.getContext("2d")!; c.fillStyle = taban; c.fillRect(0, 0, cv.width, cv.height); ciz(c, o);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ---------- gövde (siyah pleksi) ---------- */
function govdeSekli(): THREE.Shape {
  /* üstten görünüş, (x ileri, z sağ) → Shape'te (x, -z) çünkü ExtrudeGeometry XY düzleminde; sonra X ekseni etrafında döndürülür */
  const s = new THREE.Shape();
  const p = (x: number, z: number) => [x, -z] as const;
  s.moveTo(...p(-40, -48));
  s.quadraticCurveTo(...p(-44, -56), ...p(-36, -57));
  s.lineTo(...p(68, -57));
  s.quadraticCurveTo(...p(86, -56), ...p(98, -40));
  s.quadraticCurveTo(...p(112, -20), ...p(128, -17));      // boyna iniş
  s.lineTo(...p(150, -16));
  s.quadraticCurveTo(...p(158, -16), ...p(160, -30));      // sensör koluna açılış
  s.lineTo(...p(160, 30));
  s.quadraticCurveTo(...p(158, 16), ...p(150, 16));
  s.lineTo(...p(128, 17));
  s.quadraticCurveTo(...p(112, 20), ...p(98, 40));
  s.quadraticCurveTo(...p(86, 56), ...p(68, 57));
  s.lineTo(...p(-36, 57));
  s.quadraticCurveTo(...p(-44, 56), ...p(-40, 48));
  s.lineTo(...p(-40, -48));
  /* vida delikleri ve kablo geçişi */
  for (const [x, z] of [[-30, -45], [-30, 45], [12, -24], [12, 24], [58, -24], [58, 24]]) {
    const h = new THREE.Path(); h.absarc(x, -z, 1.7, 0, Math.PI * 2, false); s.holes.push(h);
  }
  const yarik = new THREE.Path(); yarik.moveTo(80, 6); yarik.lineTo(92, 6); yarik.absarc(92, 0, 6, Math.PI / 2, -Math.PI / 2, true); yarik.lineTo(80, -6); yarik.absarc(80, 0, 6, -Math.PI / 2, Math.PI / 2, true); s.holes.push(yarik);
  return s;
}

/** Sensör kolu: önü açık C biçimi, uçları öne ve içe kıvrık. */
function kolSekli(): THREE.Shape {
  const s = new THREE.Shape();
  const p = (x: number, z: number) => [x, -z] as const;
  s.moveTo(...p(158, -40));
  s.lineTo(...p(158, 40));
  s.quadraticCurveTo(...p(158, 60), ...p(166, 64));
  s.lineTo(...p(186, 68));
  s.quadraticCurveTo(...p(196, 69), ...p(195, 60));         // sağ uç
  s.lineTo(...p(190, 52));
  s.quadraticCurveTo(...p(182, 47), ...p(178, 50));         // iç kıvrım
  s.lineTo(...p(178, 50));
  s.quadraticCurveTo(...p(176, 43), ...p(176, 38));
  s.lineTo(...p(176, -38));
  s.quadraticCurveTo(...p(176, -43), ...p(178, -50));
  s.quadraticCurveTo(...p(182, -47), ...p(190, -52));
  s.lineTo(...p(195, -60));
  s.quadraticCurveTo(...p(196, -69), ...p(186, -68));       // sol uç
  s.lineTo(...p(166, -64));
  s.quadraticCurveTo(...p(158, -60), ...p(158, -40));
  for (const z of [-30, 30, -56, 56]) { const h = new THREE.Path(); h.absarc(z === -56 || z === 56 ? 168 : 166, -z, 1.6, 0, Math.PI * 2, false); s.holes.push(h); }
  return s;
}

function katman(sekil: THREE.Shape, kalinlik: number, y: number, m: THREE.Material, pah = 0.6) {
  const g = new THREE.ExtrudeGeometry(sekil, { depth: kalinlik - pah * 2, bevelEnabled: true, bevelThickness: pah, bevelSize: pah, bevelSegments: 2, curveSegments: 14 });
  g.rotateX(-Math.PI / 2); // Shape XY → XZ (Shape y = -z)
  const k = new THREE.Mesh(g, m); k.position.y = y + pah; return k;
}

/* ---------- tekerlek ---------- */
function tekerlek(): THREE.Group {
  const g = new THREE.Group();
  /* lastik: yuvarlatılmış kenarlı geniş köpük */
  const ic = 12.8, dis = R_TEKER, yar = TEKER_EN / 2, r = 2.8;
  const pr: THREE.Vector2[] = [];
  pr.push(new THREE.Vector2(ic, -yar));
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; pr.push(new THREE.Vector2(dis - r + Math.cos(a) * r, -yar + r + Math.sin(a) * r)); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pr.push(new THREE.Vector2(dis - r + Math.cos(a) * r, yar - r + Math.sin(a) * r)); }
  pr.push(new THREE.Vector2(ic, yar));
  const lastikG = new THREE.LatheGeometry(pr, 64); lastikG.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(lastikG, M.lastik));
  /* jant: 4 trapez delikli sarı disk, dış yüzden 2 mm içeride */
  const jant = new THREE.Shape(); jant.absarc(0, 0, ic + 0.3, 0, Math.PI * 2, false);
  for (let k = 0; k < 4; k++) {
    const a0 = k * Math.PI / 2 + 0.24, a1 = (k + 1) * Math.PI / 2 - 0.24, ri = 5.2, ro = 10.9;
    const h = new THREE.Path();
    h.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
    h.lineTo(Math.cos(a0 - 0.08) * ro, Math.sin(a0 - 0.08) * ro);
    h.absarc(0, 0, ro, a0 - 0.08, a1 + 0.08, false);
    h.lineTo(Math.cos(a1) * ri, Math.sin(a1) * ri);
    h.absarc(0, 0, ri, a1, a0, true);
    jant.holes.push(h);
  }
  const jantG = new THREE.ExtrudeGeometry(jant, { depth: 3, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2, curveSegments: 32 });
  const dis1 = new THREE.Mesh(jantG, M.pla); dis1.position.z = yar - 4.6; g.add(dis1);
  const icDisk = new THREE.Mesh(new THREE.CylinderGeometry(ic, ic, 2, 40), M.icGolge); icDisk.rotation.x = Math.PI / 2; icDisk.position.z = -yar + 4; g.add(icDisk);
  const gobek = silindir(4.6, TEKER_EN - 6, M.plaKoyu, 24); gobek.rotation.x = Math.PI / 2; gobek.position.z = 1; g.add(gobek);
  const halka = new THREE.Mesh(new THREE.CylinderGeometry(ic, ic, TEKER_EN - 8, 48, 1, true), M.icGolge); halka.rotation.x = Math.PI / 2; halka.position.z = 0.5; g.add(halka);
  const vida = silindir(1.6, 1.2, M.celik, 12); vida.rotation.x = Math.PI / 2; vida.position.z = yar - 1.8; g.add(vida);
  return golgeli(g) as THREE.Group;
}

/* ---------- TT redüktörlü motor ---------- */
function ttMotor(sag: boolean): THREE.Group {
  const g = new THREE.Group(); // kendi ekseni: mil (0,0,0)'da, gövde +X yönünde uzanır, yan yüz z=0 düzleminde
  const kutuG = kutu(38, 22.5, 19, M.pla, 11, 0, 0, 2.2);
  g.add(kutuG);
  g.add(kutu(10, 18, 19.4, M.plaKoyu, 31, 0, 0, 1.5)); // motor yuvası
  const kulak = kutu(5, 6, 19, M.pla, -10, 0, 0, 1); g.add(kulak);
  for (const y of [-6.5, 6.5]) { const v = silindir(1.5, 20, M.celik, 10); v.rotation.x = Math.PI / 2; v.position.set(18, y, 0); g.add(v); }
  /* gümüş motor gövdesi: iki yanı düzleştirilmiş silindir */
  const can = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 24, 32), M.gumus); can.rotation.z = Math.PI / 2; can.scale.set(1, 1, 0.78); can.position.set(48, 0, 0); g.add(can);
  const kapak = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.2, 3.5, 32), M.plastikBeyaz); kapak.rotation.z = Math.PI / 2; kapak.scale.set(1, 1, 0.78); kapak.position.set(61.5, 0, 0); g.add(kapak);
  for (const y of [-4, 4]) g.add(kutu(1.6, 2.4, 0.6, M.altin, 63.6, y, 0));
  const mil = silindir(2.7, 37, M.pla, 6); mil.rotation.x = Math.PI / 2; g.add(mil);
  if (!sag) g.scale.z = -1;
  return golgeli(g) as THREE.Group;
}

/* ---------- elektronik ---------- */
function pinSirasi(n: number, aralik: number, m: THREE.Material, uz = 6): THREE.InstancedMesh {
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, uz, 0.64), m, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { o.position.set((i - (n - 1) / 2) * aralik, 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  return im;
}
function baslik(n: number, x: number, y: number, z: number, donuk = false) {
  const g = new THREE.Group();
  g.add(kutu(n * 2.54, 2.5, 2.54, M.plastikSiyah, 0, 1.25, 0));
  const p = pinSirasi(n, 2.54, M.altin, 8.5); p.position.y = 2.5; g.add(p);
  g.position.set(x, y, z); if (donuk) g.rotation.y = Math.PI / 2; return g;
}

function kalkan(): THREE.Group {
  const g = new THREE.Group(), W = 58, D = 54;
  const doku = baskiDokusu(W, D, "#15171b", (c, o) => {
    c.strokeStyle = "rgba(215,178,90,.9)"; c.lineWidth = o * 0.7; c.strokeRect(o * 0.6, o * 0.6, (W - 1.2) * o, (D - 1.2) * o);
    c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = o * 0.25;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(o * (8 + i * 3), o * 8); c.lineTo(o * (8 + i * 3), o * 20); c.lineTo(o * (20 + i * 4), o * 30); c.stroke(); }
    c.fillStyle = "rgba(215,178,90,.95)";
    for (let i = 0; i < 15; i++) for (const yy of [6, 48]) { c.beginPath(); c.arc(o * (10 + i * 2.54), o * yy, o * 0.8, 0, 7); c.fill(); }
    c.fillStyle = "rgba(255,255,255,.7)"; c.font = `${o * 2.4}px monospace`; c.fillText("SIRO  v2", o * 38, o * 44);
  });
  const kart = new THREE.Mesh(new THREE.BoxGeometry(W, 1.6, D), [M.pcbSiyah, M.pcbSiyah, new THREE.MeshStandardMaterial({ map: doku, roughness: 0.5 }), M.pcbSiyah, M.pcbSiyah, M.pcbSiyah]);
  g.add(kart);
  /* Nano: mavi kart, dişi başlıklar üstünde */
  const nano = new THREE.Group();
  const nanoDoku = baskiDokusu(43, 18, "#1d4fc4", (c, o) => {
    c.fillStyle = "rgba(230,200,110,.95)";
    for (let i = 0; i < 15; i++) for (const yy of [1.4, 16.6]) { c.beginPath(); c.arc(o * (3 + i * 2.54), o * yy, o * 0.75, 0, 7); c.fill(); }
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = o * 0.22; c.strokeRect(o * 14, o * 5, o * 12, o * 8);
    c.fillStyle = "rgba(255,255,255,.85)"; for (let i = 0; i < 8; i++) c.fillRect(o * (3 + i * 4.6), o * 3, o * 1.6, o * 0.4);
  });
  nano.add(new THREE.Mesh(new THREE.BoxGeometry(43, 1.6, 18), [M.pcbMavi, M.pcbMavi, new THREE.MeshStandardMaterial({ map: nanoDoku, roughness: 0.45 }), M.pcbMavi, M.pcbMavi, M.pcbMavi]));
  const ic = kutu(7, 1.2, 7, M.entegre, 1, 1.4, 0); ic.rotation.y = Math.PI / 4; nano.add(ic);
  nano.add(kutu(9, 4, 7.6, M.gumus, -19.8, 2.8, 0)); // usb
  nano.add(kutu(3.4, 1.2, 2.2, M.gumus, 10, 1.4, -4)); // kristal
  nano.add(kutu(2.4, 0.8, 1.4, M.plastikBeyaz, 14, 1.2, 4)); // düğme
  for (const z of [-7.62, 7.62]) { nano.add(kutu(38, 8.5, 2.6, M.plastikSiyah, 0, -5.2, z)); }
  nano.position.set(-2, 10.6, -10); nano.userData.ust = true;
  g.add(nano);
  /* kırmızı motor sürücü */
  const surucu = new THREE.Group();
  surucu.add(kutu(20, 1.6, 20, M.pcbKirmizi));
  surucu.add(kutu(6, 1.3, 5, M.entegre, 0, 1.4, 0));
  surucu.add(kutu(2.2, 1.3, 1.4, M.entegre, -6, 1.4, 5)); surucu.add(kutu(2.2, 1.3, 1.4, M.entegre, 6, 1.4, -5));
  for (const z of [-8.5, 8.5]) surucu.add(kutu(17, 6, 2.5, M.plastikSiyah, 0, -3.8, z));
  surucu.position.set(8, 9, 15); surucu.userData.ust = true;
  g.add(surucu);
  /* JST soket, kondansatör */
  g.add(kutu(8, 6, 6, M.plastikBeyaz, 24, 3.8, -19));
  g.add(kutu(6.5, 6, 6, M.plastikBeyaz, -20, 3.8, 20));
  const kond = silindir(3.2, 7, M.pilMavi, 20); kond.position.set(-21, 4.3, -18); g.add(kond);
  g.add(baslik(6, 22, 0.8, 22)); g.add(baslik(4, -24, 0.8, 4, true));
  return golgeli(g) as THREE.Group;
}

/** Sensör kartı: kırmızı, 8 kızılötesi göz, pin başlığı. LED'ler dışarı verilir (çizgiyi görünce yanar). */
function sensorKarti(): { g: THREE.Group; ledler: THREE.Mesh[] } {
  const g = new THREE.Group(), ledler: THREE.Mesh[] = [];
  g.add(kutu(12, 1.6, 80, M.pcbKirmizi));
  for (let i = 0; i < 8; i++) {
    const z = (i - 3.5) * SIROLINE.sensorAralik;
    const goz = kutu(3.2, 2.2, 6, M.entegre, 1.5, -1.9, z); g.add(goz);
    const lens = silindir(0.9, 0.4, M.seffaf, 10); lens.position.set(1.5, -3.1, z - 1.4); g.add(lens);
    const lens2 = silindir(0.9, 0.4, M.plastikSiyah, 10); lens2.position.set(1.5, -3.1, z + 1.4); g.add(lens2);
    const led = kutu(1.2, 0.6, 0.8, M.ledKapali.clone(), -4, 1.1, z); g.add(led); ledler.push(led);
  }
  const b = baslik(10, -3.5, 0.8, 0, true); g.add(b);
  return { g: golgeli(g) as THREE.Group, ledler };
}

/* ---------- kablolar ---------- */
function kablo(noktalar: [number, number, number][], m: THREE.Material, r = 0.75): THREE.Mesh {
  const e = new THREE.CatmullRomCurve3(noktalar.map((p) => new THREE.Vector3(...p)));
  const k = new THREE.Mesh(new THREE.TubeGeometry(e, 48, r, 8, false), m); k.castShadow = true; return k;
}
/** Gökkuşağı şerit kablo: on tel yan yana, yol boyunca yassı. */
function seritKablo(yol: [number, number, number][]): THREE.Group {
  const g = new THREE.Group();
  const e = new THREE.CatmullRomCurve3(yol.map((p) => new THREE.Vector3(...p)));
  const ornek = e.getSpacedPoints(80);
  SERIT_RENKLERI.forEach((renk, i) => {
    const kay = (i - 4.5) * 1.27;
    const nokt = ornek.map((p, j) => {
      const t = e.getTangentAt(Math.min(1, j / 80)); const yan = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize();
      return p.clone().addScaledVector(yan, kay);
    });
    const tel = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nokt), 80, 0.62, 6, false), new THREE.MeshStandardMaterial({ color: renk, roughness: 0.5 }));
    tel.castShadow = true; g.add(tel);
  });
  return g;
}

/* ---------- robot ---------- */
/** Kurulum rehberinin adımlarına göre parça grupları */
export const PARCALAR = ["sasi", "kol", "motor", "teker", "sensor", "kalkan", "nano", "pil", "kablo"] as const;
export type ParcaAdi = (typeof PARCALAR)[number];

export interface SiroLineModeli {
  kok: THREE.Group;
  parcalar: Record<ParcaAdi, THREE.Group>;
  /** sol ve sağ tekerleği gidilen yola göre döndürür (mm) */
  tekerleriDondur(solMm: number, sagMm: number): void;
  /** sensör değerleriyle (0–1000) LED'leri yakar */
  ledler(degerler: number[]): void;
}

export function siroline(): SiroLineModeli {
  const ic = new THREE.Group();
  const parcalar = Object.fromEntries(PARCALAR.map((a) => { const g = new THREE.Group(); g.name = a; ic.add(g); return [a, g]; })) as Record<ParcaAdi, THREE.Group>;
  const { sasi, kol, motor, teker, sensor, kalkan: kalkanG, nano, pil: pilG, kablo: kabloG } = parcalar;

  /* 1 · şasi */
  sasi.add(golgeli(katman(govdeSekli(), PLEKSI_KAL, PLEKSI_ALT, M.pleksi, 0.4)));
  /* 2 · sensör kolu: siyah pleksi taban + sarı baskı, yaka, kayma topları, vidalar */
  kol.add(golgeli(katman(kolSekli(), 2, PLEKSI_ALT, M.pleksi, 0.3)));
  kol.add(golgeli(katman(kolSekli(), 5, PLEKSI_ALT + 2, M.pla, 0.7)));
  kol.add(golgeli(kutu(14, 4, 30, M.pla, 156, PLEKSI_UST + 2, 0, 1.5)));
  for (const z of [-50, 50]) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 16), M.seffaf); t.position.set(184, 4.2, z); kol.add(t);
    kol.add(golgeli(silindir(5.4, 3, M.seffaf, 24)).translateX(184).translateY(PLEKSI_ALT + 0.6).translateZ(z));
  }
  for (const z of [-30, 30]) kol.add(golgeli(silindir(2.6, 1.6, M.celik, 12)).translateX(166).translateY(PLEKSI_ALT + 7.6).translateZ(z));
  /* 5 · sensör kartı kolun ön kenarında */
  const KART_Y = PLEKSI_ALT + 7 + 0.8;
  const sk = sensorKarti(); sk.g.position.set(SENSOR_X, KART_Y, 0); sensor.add(sk.g);
  /* 3-4 · motorlar ve tekerlekler */
  const KALKAN_Y = PLEKSI_UST + 14.8;
  const tekerler: THREE.Group[] = [];
  for (const sag of [false, true]) {
    const z = (sag ? 1 : -1) * (IZ - TEKER_EN / 2 - 10.5), zs = sag ? 1 : -1;
    const mot = ttMotor(sag); mot.position.set(0, R_TEKER, z); motor.add(mot);
    motor.add(golgeli(kutu(16, 12, 3, M.pla, 12, PLEKSI_UST + 6, z - zs * 11, 1)));
    const t = tekerlek(); t.position.set(0, R_TEKER, zs * IZ); if (!sag) t.rotation.y = Math.PI; teker.add(t); tekerler.push(t);
    kabloG.add(kablo([[62, R_TEKER + 4, z], [68, R_TEKER + 12, z - zs * 6], [56, KALKAN_Y + 15, zs * 22], [44, KALKAN_Y + 11, zs * 18]], M.kabloKirmizi, 0.8));
    kabloG.add(kablo([[62, R_TEKER - 4, z], [70, R_TEKER + 8, z - zs * 10], [58, KALKAN_Y + 13, zs * 17], [46, KALKAN_Y + 11, zs * 14]], M.kabloSiyah, 0.8));
  }
  /* 6 · pirinç aralayıcılar ve kalkan kartı; 7 · Nano ve sürücü (kalkanın üstünde) */
  for (const [x, z] of [[12, -24], [12, 24], [58, -24], [58, 24]]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 14, 6), M.pirinc); a.position.set(x, PLEKSI_UST + 7, z); golgeli(a); kalkanG.add(a);
  }
  const k = kalkan(); k.position.set(35, KALKAN_Y, 0);
  /* kalkan grubundan Nano ve sürücüyü ayır: kurulumda ayrı adım */
  const ust = k.children.filter((c) => c.userData.ust);
  for (const c of ust) { k.remove(c); c.position.add(k.position); nano.add(c); }
  kalkanG.add(k);
  /* 8 · pil yuvası: arkada, iki mavi 18650 */
  const pil = new THREE.Group();
  pil.add(kutu(40, 8, 70, M.plastikSiyah, 0, 4, 0, 1.2));
  for (const x of [-9.5, 9.5]) { const h = silindir(9, 65, M.pilMavi, 32); h.rotation.x = Math.PI / 2; h.position.set(x, 11, 0); pil.add(h); const u = silindir(4, 1.2, M.gumus, 16); u.rotation.x = Math.PI / 2; u.position.set(x, 11, 33); pil.add(u); }
  pil.position.set(-20, PLEKSI_UST, 0); golgeli(pil); pilG.add(pil);
  /* 9 · kablolar: pil, şerit kablo (sensör → A0–A7), boyundaki bant */
  kabloG.add(kablo([[-8, PLEKSI_UST + 8, 34], [0, PLEKSI_UST + 26, 30], [12, PLEKSI_UST + 22, 22]], M.kabloKirmizi, 0.85));
  kabloG.add(kablo([[-8, PLEKSI_UST + 5, 34], [-2, PLEKSI_UST + 22, 34], [14, PLEKSI_UST + 20, 26]], M.kabloSiyah, 0.85));
  const sy = PLEKSI_UST + 0.9;
  kabloG.add(seritKablo([[64, KALKAN_Y + 2, 0], [76, PLEKSI_UST + 8, 0], [92, sy + 0.4, 0], [130, sy, 0], [150, sy + 3, 0], [156, PLEKSI_UST + 7, 0], [160, KART_Y + 10, 0], [SENSOR_X - 6, KART_Y + 9, 0], [SENSOR_X - 3.5, KART_Y + 10.5, 0]]));
  kabloG.add(golgeli(kutu(16, 2.6, 22, M.bant, 118, PLEKSI_UST + 1.2, 0, 0.6)));

  const kok = new THREE.Group(); kok.add(ic); kok.scale.setScalar(0.001); // mm → metre

  const ledMat = sk.ledler.map((l) => l.material as THREE.MeshStandardMaterial);
  return {
    kok, parcalar,
    tekerleriDondur(solMm, sagMm) {
      tekerler[0].rotation.z = solMm / R_TEKER;   // sol tekerlek y ekseninde ters çevrili
      tekerler[1].rotation.z = -sagMm / R_TEKER;
    },
    ledler(d) {
      d.forEach((v, i) => { const m = ledMat[i]; const a = v > 500 ? 1 : 0; m.emissive.setRGB(a * 1.0, a * 0.08, a * 0.06); m.emissiveIntensity = 2.2; m.color.setHex(a ? 0xff3030 : 0x3a0d10); });
    }
  };
}
