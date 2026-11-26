/* mBot (Makeblock, mCore): ürün bilgisinden (yaklaşık 170 × 130 × 90 mm) ve fotoğraflardan sade bir model.
   - Mavi alüminyum şasi: taban levhası ve iki yanda katlanmış duvar.
   - Üstte mCore kartı ve şeffaf kapak; kartın önünde iki RGB LED ve ışık sensörü.
   - Önde ultrasonik mesafe sensörü: mavi kart ve iki gümüş "göz".
   - Önde altta çizgi izleme sensörü (iki göz); arkada iki teker, önde sarhoş teker (bilye).
   Eksenler: +X ileri, +Y yukarı, +Z sağ; orijin teker ekseninin ortası, yerde. Birim mm, kök 0,001 ölçekli. */
import * as THREE from "three";

const R = 32;          // teker yarıçapı (çap ≈ 64 mm)
const TEKER_EN = 24;
const TEKER_Z = 63;
const TABAN_Y = 16;

const M = {
  sasi: new THREE.MeshStandardMaterial({ color: 0x1e7fd8, roughness: 0.38, metalness: 0.55 }),
  sasiKoyu: new THREE.MeshStandardMaterial({ color: 0x0f4f93, roughness: 0.4, metalness: 0.5 }),
  delik: new THREE.MeshStandardMaterial({ color: 0x0a2440, roughness: 0.6 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.85 }),
  gobek: new THREE.MeshStandardMaterial({ color: 0xe9edf2, roughness: 0.45 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1d2b4f, roughness: 0.45, metalness: 0.2 }),
  pcbMavi: new THREE.MeshStandardMaterial({ color: 0x2167c9, roughness: 0.45 }),
  kapak: new THREE.MeshPhysicalMaterial({ color: 0xdbe8ff, roughness: 0.08, transmission: 0.6, transparent: true, opacity: 0.35 }),
  gumus: new THREE.MeshStandardMaterial({ color: 0xc9cfd6, roughness: 0.22, metalness: 0.95 }),
  ag: new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.7 }),
  siyah: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.5 }),
  beyaz: new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 0.5 }),
  ledK: new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff2050, emissiveIntensity: 0.7, roughness: 0.3 }),
  ledM: new THREE.MeshStandardMaterial({ color: 0x4dd2ff, emissive: 0x20a0ff, emissiveIntensity: 0.7, roughness: 0.3 }),
  motor: new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.5 }),
  pil: new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.7 })
};
function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function silindir(r: number, h: number, m: THREE.Material, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }

function teker(): THREE.Group {
  const g = new THREE.Group();
  const lastik = new THREE.Mesh(new THREE.TorusGeometry(R - 6, 6.5, 14, 40), M.lastik);
  lastik.scale.set(1, 1, TEKER_EN / 13); g.add(lastik);
  const gobek = silindir(R - 9, TEKER_EN - 4, M.gobek, 32); gobek.rotation.x = Math.PI / 2; g.add(gobek);
  /* göbekte beş kol boşluğu */
  for (let i = 0; i < 5; i++) {
    const d = silindir(4.5, TEKER_EN - 2, M.delik, 12); d.rotation.x = Math.PI / 2;
    const a = (i / 5) * Math.PI * 2; d.position.set(Math.cos(a) * 13, Math.sin(a) * 13, 0); g.add(d);
  }
  return golgeli(g);
}

export interface MbotModeli {
  kok: THREE.Group;
  parcalar: Record<"tekerler" | "ultrasonik" | "cizgiSensoru" | "isikSensoru" | "ledler" | "kart" | "motorlar", THREE.Group>;
  tekerler: THREE.Group[];
}
export function mbot(): MbotModeli {
  const kok = new THREE.Group(); kok.scale.setScalar(0.001);
  const ic = new THREE.Group(); kok.add(ic);
  const parcalar = { tekerler: new THREE.Group(), ultrasonik: new THREE.Group(), cizgiSensoru: new THREE.Group(), isikSensoru: new THREE.Group(), ledler: new THREE.Group(), kart: new THREE.Group(), motorlar: new THREE.Group() };
  Object.values(parcalar).forEach((g) => ic.add(g));

  /* şasi: taban levhası (x -55…100) ve yan duvarlar; duvarlarda delik sırası */
  const sasi = new THREE.Group();
  sasi.add(kutu(155, 3, 104, M.sasi, 22, TABAN_Y, 0));
  for (const z of [-52, 52]) {
    sasi.add(kutu(155, 26, 3, M.sasi, 22, TABAN_Y + 13, z));
    for (let i = 0; i < 9; i++) { const d = silindir(2.2, 4, M.delik, 10); d.rotation.x = Math.PI / 2; d.position.set(-45 + i * 16, TABAN_Y + 18, z); sasi.add(d); }
  }
  /* önde aşağı katlanan burun */
  const burun = kutu(3, 14, 104, M.sasiKoyu, 99, TABAN_Y + 8, 0); sasi.add(burun);
  ic.add(golgeli(sasi));

  /* motorlar şasinin içinde, teker hizasında */
  for (const z of [-34, 34]) parcalar.motorlar.add(golgeli(kutu(46, 22, 20, M.motor, 0, R, z)));
  /* pil yuvası arkada, şasinin içinde */
  ic.add(golgeli(kutu(58, 16, 62, M.pil, -28, TABAN_Y + 10, 0)));

  /* tekerler */
  const tekerler: THREE.Group[] = [];
  for (const z of [-TEKER_Z, TEKER_Z]) { const t = teker(); t.position.set(0, R, z); parcalar.tekerler.add(t); tekerler.push(t); }
  /* önde sarhoş teker: bilye */
  const bilye = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), M.gumus); bilye.position.set(80, 7, 0); ic.add(golgeli(bilye));
  ic.add(golgeli(kutu(16, 8, 16, M.siyah, 80, 12, 0)));

  /* mCore kartı ve şeffaf kapak */
  const kartY = TABAN_Y + 28;
  parcalar.kart.add(golgeli(kutu(92, 2, 86, M.pcb, 18, kartY, 0)));
  for (const [x, z, w, d] of [[40, -22, 14, 10], [5, 18, 18, 12], [-10, -18, 10, 10]] as const) parcalar.kart.add(golgeli(kutu(w, 4, d, M.siyah, x, kartY + 3, z)));
  for (const z of [-32, -12, 8, 28]) parcalar.kart.add(golgeli(kutu(10, 9, 12, M.beyaz, -22, kartY + 5, z)));   // RJ25 yuvaları
  const kapak = kutu(96, 22, 90, M.kapak, 18, kartY + 12, 0); kapak.castShadow = false; parcalar.kart.add(kapak);
  /* kartın önünde iki RGB LED ve ortada ışık sensörü */
  for (const [z, m] of [[-24, M.ledK], [24, M.ledM]] as const) { const l = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 10), m); l.position.set(58, kartY + 3, z); parcalar.ledler.add(l); }
  const isik = new THREE.Mesh(new THREE.SphereGeometry(3.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.beyaz); isik.position.set(58, kartY + 1, 0); parcalar.isikSensoru.add(golgeli(isik));
  parcalar.isikSensoru.add(golgeli(silindir(4.4, 1.6, M.siyah, 16).translateX(58).translateY(kartY + 0.8)));

  /* ultrasonik sensör: önde dik mavi kart, iki gümüş göz */
  const us = parcalar.ultrasonik;
  us.add(golgeli(kutu(14, 8, 40, M.sasiKoyu, 92, TABAN_Y + 32, 0)));
  us.add(golgeli(kutu(2, 22, 48, M.pcbMavi, 100, TABAN_Y + 48, 0)));
  for (const z of [-13, 13]) {
    const goz = silindir(8, 12, M.gumus, 28); goz.rotation.z = -Math.PI / 2; goz.position.set(107, TABAN_Y + 48, z); us.add(golgeli(goz));
    const ag = new THREE.Mesh(new THREE.CircleGeometry(6.4, 24), M.ag); ag.rotation.y = Math.PI / 2; ag.position.set(113.1, TABAN_Y + 48, z); us.add(ag);
  }
  /* çizgi sensörü: önde altta, iki göz aşağı bakar */
  const cs = parcalar.cizgiSensoru;
  cs.add(golgeli(kutu(18, 2, 32, M.pcbMavi, 88, TABAN_Y - 6, 0)));
  cs.add(golgeli(kutu(6, 6, 8, M.sasiKoyu, 88, TABAN_Y - 2, 0)));
  for (const z of [-7, 7]) { const g = silindir(2.6, 5, M.siyah, 12); g.position.set(88, TABAN_Y - 9.5, z); cs.add(golgeli(g)); }
  return { kok, parcalar, tekerler };
}
