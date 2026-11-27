/* mBot2 (Makeblock): ürün fotoğraflarından ve ürün bilgisinden (yaklaşık 180 × 130 × 90 mm) modellendi.
   - Mavi alüminyum şasi: alt levha, delikli iki yan duvar, önde sensör ayağı.
   - mBot2 Shield (içinde pil) şasinin üstünde koyu gri kutu; üstünde CyberPi: beyaz kart, ortada renkli ekran, sağda
     joystick, iki düğme, önde beş renkli ışık.
   - Önde Ultrasonic Sensor 2: açık gri kutu, iki göz, gözlerin çevresinde mavi ışık halkası.
   - Önde altta Quad RGB sensör: dört göz yere bakar.
   - Arkada iki enkoderli motor ve iki büyük teker, önde küçük teker.
   Eksenler: +X ileri, +Y yukarı, +Z sağ; orijin teker ekseninin ortası, yerde. Birim mm, kök 0,001 ölçekli. */
import * as THREE from "three";

const R = 32;          // teker yarıçapı (çap ≈ 64 mm)
const TEKER_EN = 22;
const TEKER_Z = 54;
const TABAN_Y = 16;    // alt levhanın üst yüzü
const DUVAR_Y = 44;    // yan duvarların üst kenarı
const ON_X = 96;       // sensör ayağının önü

const M = {
  sasi: new THREE.MeshStandardMaterial({ color: 0x2b8fe0, roughness: 0.32, metalness: 0.55, side: THREE.DoubleSide }),
  delik: new THREE.MeshStandardMaterial({ color: 0x0b3550, roughness: 0.6, side: THREE.DoubleSide }),
  lastik: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.85, side: THREE.DoubleSide }),
  jant: new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.45, side: THREE.DoubleSide }),
  kalkan: new THREE.MeshStandardMaterial({ color: 0x3a3e46, roughness: 0.55 }),
  kalkanUst: new THREE.MeshStandardMaterial({ color: 0x2c2f36, roughness: 0.5 }),
  beyaz: new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.4 }),
  acikGri: new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.45 }),
  ekran: new THREE.MeshStandardMaterial({ color: 0x1b2440, emissive: 0x3b63d8, emissiveIntensity: 0.45, roughness: 0.2 }),
  ekranYuz: new THREE.MeshStandardMaterial({ color: 0xffd54a, emissive: 0xffc000, emissiveIntensity: 0.6, roughness: 0.3 }),
  siyah: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.5 }),
  ag: new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.75, side: THREE.DoubleSide }),
  maviIsik: new THREE.MeshStandardMaterial({ color: 0x7cc7ff, emissive: 0x2f8cff, emissiveIntensity: 0.9, roughness: 0.3 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1c3f7a, roughness: 0.45 }),
  motor: new THREE.MeshStandardMaterial({ color: 0xb9bec7, roughness: 0.35, metalness: 0.6 }),
  motorKapak: new THREE.MeshStandardMaterial({ color: 0x5b6170, roughness: 0.5 }),
  gumus: new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 0.2, metalness: 0.95 }),
  ledler: [0xff4d6d, 0xffb020, 0x3ddc84, 0x4dd2ff, 0xa66bff].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.8, roughness: 0.3 })),
  dolgu: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.3 })
};
function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function silindir(r: number, h: number, m: THREE.Material, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }
/** köşeleri yuvarlak kutu (üstten bakınca), yükseklik Y ekseninde */
function yuvarlakKutu(w: number, h: number, d: number, r: number, m: THREE.Material) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2); s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2); s.lineTo(-w / 2 + r, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r); s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, m);
}

/** büyük teker: kaygan siyah lastik, açık gri jant, beş kollu göbek */
function teker(dis: 1 | -1): THREE.Group {
  const g = new THREE.Group();
  const lastik = silindir(R, TEKER_EN, M.lastik, 48); lastik.rotation.x = Math.PI / 2; g.add(lastik);
  const yz = dis * (TEKER_EN / 2);
  const jant = new THREE.Mesh(new THREE.CircleGeometry(R - 6, 40), M.jant); jant.position.z = yz + dis * 0.3; g.add(jant);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.CircleGeometry(5, 16), M.siyah); b.scale.set(1, 1.5, 1);
    const a = (i / 5) * Math.PI * 2; b.position.set(Math.cos(a) * 15, Math.sin(a) * 15, yz + dis * 0.6); b.rotation.z = a + Math.PI / 2; g.add(b);
  }
  const gob = silindir(6.5, 4, M.acikGri, 20); gob.rotation.x = Math.PI / 2; gob.position.z = yz + dis * 1; g.add(gob);
  return golgeli(g);
}

export interface Mbot2Modeli {
  kok: THREE.Group;
  parcalar: Record<"tekerler" | "motorlar" | "cyberpi" | "kalkan" | "ultrasonik" | "quadRgb", THREE.Group>;
  tekerler: THREE.Group[];
}
export function mbot2(): Mbot2Modeli {
  const kok = new THREE.Group(); kok.scale.setScalar(0.001);
  const ic = new THREE.Group(); kok.add(ic);
  const parcalar = { tekerler: new THREE.Group(), motorlar: new THREE.Group(), cyberpi: new THREE.Group(), kalkan: new THREE.Group(), ultrasonik: new THREE.Group(), quadRgb: new THREE.Group() };
  Object.values(parcalar).forEach((g) => ic.add(g));

  /* ---- şasi: alt levha, iki yan duvar (delikli), önde sensör ayağı ---- */
  const sasi = new THREE.Group();
  sasi.add(kutu(140, 3, 80, M.sasi, 26, TABAN_Y - 1.5, 0));
  for (const s of [-1, 1]) {
    sasi.add(kutu(122, DUVAR_Y - TABAN_Y, 3, M.sasi, 18, (DUVAR_Y + TABAN_Y) / 2, s * 41.5));
    sasi.add(kutu(122, 3, 10, M.sasi, 18, DUVAR_Y - 1.5, s * 37));                         // üst kenar kıvrımı
    for (let i = 0; i < 5; i++) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(i % 2 ? 2.2 : 3.4, 16), M.delik);
      d.position.set(-24 + i * 20, (DUVAR_Y + TABAN_Y) / 2 + (i % 2 ? 6 : -2), s * 43.1); sasi.add(d);
    }
    /* yan duvarda uzun oval pencere */
    const p = new THREE.Mesh(new THREE.CircleGeometry(5, 20), M.delik); p.scale.set(3.2, 1, 1); p.position.set(62, (DUVAR_Y + TABAN_Y) / 2, s * 43.1); sasi.add(p);
  }
  /* ön: sensör ayağı (öne eğik levha) */
  const ayak = kutu(3, 46, 70, M.sasi, ON_X - 6, TABAN_Y + 20, 0); ayak.rotation.z = -0.12; sasi.add(ayak);
  sasi.add(kutu(16, 3, 70, M.sasi, ON_X - 12, TABAN_Y - 1.5, 0));
  ic.add(golgeli(sasi));

  /* ---- enkoderli motorlar: teker ekseninde, şasinin içinde ---- */
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    const govde = silindir(12, 30, M.motor, 28); govde.rotation.x = Math.PI / 2; govde.position.set(0, R, s * 22); g.add(govde);
    const kapak = silindir(12.5, 6, M.motorKapak, 28); kapak.rotation.x = Math.PI / 2; kapak.position.set(0, R, s * 5); g.add(kapak);
    g.add(kutu(40, 18, 16, M.motorKapak, -20, R - 2, s * 22));                               // dişli kutusu
    parcalar.motorlar.add(golgeli(g));
  }

  /* ---- tekerler ---- */
  const tekerler: THREE.Group[] = [];
  for (const s of [-1, 1] as const) { const t = teker(s); t.position.set(0, R, s * TEKER_Z); parcalar.tekerler.add(t); tekerler.push(t); }
  /* önde küçük teker */
  const kucuk = silindir(7, 8, M.siyah, 20); kucuk.rotation.x = Math.PI / 2; kucuk.position.set(74, 7, 0); ic.add(golgeli(kucuk));
  ic.add(golgeli(kutu(14, TABAN_Y - 10, 12, M.acikGri, 74, (TABAN_Y + 10) / 2, 0)));

  /* ---- mBot2 Shield: koyu gri kutu (içinde pil) ---- */
  const kk = parcalar.kalkan;
  const kalkanY = DUVAR_Y + 1;
  const kalkan = yuvarlakKutu(92, 16, 76, 8, M.kalkan); kalkan.position.set(4, kalkanY, 0); kk.add(golgeli(kalkan));
  kk.add(golgeli(kutu(80, 1.5, 64, M.kalkanUst, 4, kalkanY + 17.5, 0)));
  /* yanlarda motor ve mBuild bağlantı yuvaları */
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) kk.add(kutu(8, 5, 1, i === 1 ? M.beyaz : M.siyah, -20 + i * 16, kalkanY + 7, s * 38.6));

  /* ---- CyberPi: beyaz kart enine yatar; ekran ortada, joystick sağda, düğmeler solda, ledler önde ---- */
  const cp = parcalar.cyberpi;
  const cpY = kalkanY + 19;
  const cpGovde = yuvarlakKutu(46, 6, 96, 9, M.beyaz); cpGovde.position.set(4, cpY, 0); cp.add(golgeli(cpGovde));
  cp.add(kutu(30, 1, 30, M.siyah, 2, cpY + 7.3, 0));
  cp.add(kutu(26, 1, 26, M.ekran, 2, cpY + 7.9, 0));
  /* ekranda gülen yüz */
  for (const z of [-5, 5]) cp.add(kutu(3, 0.6, 3, M.ekranYuz, 6, cpY + 8.6, z));
  const agiz = new THREE.Mesh(new THREE.TorusGeometry(5, 0.9, 6, 16, Math.PI), M.ekranYuz); agiz.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); agiz.position.set(-1, cpY + 8.6, 0); cp.add(agiz);
  const joy = silindir(4.5, 4, M.siyah, 18); joy.position.set(2, cpY + 9, 32); cp.add(golgeli(joy));
  const joyUst = new THREE.Mesh(new THREE.SphereGeometry(3.6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.acikGri); joyUst.position.set(2, cpY + 11, 32); cp.add(joyUst);
  for (const x of [-6, 8]) { const d = silindir(3, 2, M.acikGri, 14); d.position.set(x, cpY + 8, -32); cp.add(d); }
  M.ledler.forEach((m, i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 8), m); l.position.set(25.5, cpY + 4, -24 + i * 12); cp.add(l); });

  /* ---- Ultrasonic Sensor 2: açık gri kutu, iki göz, mavi ışık halkaları ---- */
  const us = parcalar.ultrasonik;
  const usY = TABAN_Y + 34;
  us.add(golgeli(kutu(14, 24, 56, M.acikGri, ON_X, usY, 0)));
  for (const z of [-14, 14]) {
    const goz = silindir(9, 6, M.beyaz, 28); goz.rotation.z = -Math.PI / 2; goz.position.set(ON_X + 9, usY, z); us.add(golgeli(goz));
    const halka = new THREE.Mesh(new THREE.TorusGeometry(9.6, 1, 8, 32), M.maviIsik); halka.rotation.y = Math.PI / 2; halka.position.set(ON_X + 12.2, usY, z); us.add(halka);
    const ag = new THREE.Mesh(new THREE.CircleGeometry(7, 24), M.ag); ag.rotation.y = Math.PI / 2; ag.position.set(ON_X + 12.3, usY, z); us.add(ag);
  }

  /* ---- Quad RGB sensör: sensör ayağının altında, dört göz ve iki dolgu ışığı yere bakar ---- */
  const q = parcalar.quadRgb;
  q.add(golgeli(kutu(18, 4, 50, M.acikGri, ON_X - 8, 9, 0)));
  q.add(kutu(16, 1, 46, M.pcb, ON_X - 8, 6.6, 0));
  for (const z of [-18, -6, 6, 18]) { const g = silindir(2.6, 2, M.siyah, 14); g.position.set(ON_X - 6, 5.6, z); q.add(g); }
  for (const z of [-12, 12]) { const l = silindir(1.8, 1, M.dolgu, 12); l.position.set(ON_X - 12, 5.8, z); q.add(l); }
  q.add(golgeli(kutu(6, TABAN_Y - 10, 10, M.siyah, ON_X - 8, (TABAN_Y + 10) / 2, 0)));
  return { kok, parcalar, tekerler };
}
