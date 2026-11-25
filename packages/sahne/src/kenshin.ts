/* Kenshin: akademinin mini sumo robotu, kodla modellenmiş.
   Kaynak: akademideki robotun fotoğrafları ve dijital kumpas ölçüleri:
   boy 98,4 mm (tekerlek arkası → bıçak ucu), bıçak eni 100,0 mm, bayrak boyu 149,4 mm.
   Yanlar açık: alt plaka + yeşil ana kart; arkada iki geniş lastik teker (alüminyum göbek),
   ortada dik duran mikro servo; servo iki siyah kolu döndürür, kolların ucundaki beyaz bayraklar
   maç başında yukarıdan yana açılır. Önde bükülmüş çelik bıçak: üç sensör penceresi, alt kenarda kapton bant.
   Marka yazıları (servo, pil etiketi) çizilmez.
   Robotun ekseni: +X ileri, +Y yukarı, +Z sağ; orijin robotun ortası, zeminde. Birim milimetre, kök 0,001 ölçekli. */
import * as THREE from "three";
import { KENSHIN } from "@sra/robot-motoru";

const R = KENSHIN.tekerCap / 2;          // 15
const TEKER_EN = 23;
const TEKER_X = -50 + R;                 // tekerleğin arkası robotun arkasında
const M = {
  celik: new THREE.MeshStandardMaterial({ color: 0xc9cdd3, roughness: 0.3, metalness: 0.95 }),
  parlakCelik: new THREE.MeshStandardMaterial({ color: 0xe4e7eb, roughness: 0.16, metalness: 1 }),
  kapton: new THREE.MeshStandardMaterial({ color: 0xf0b414, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.85 }),
  baski: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.75 }),            // 3D baskı siyah PLA
  plaka: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.55, metalness: 0.3 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1d6a37, roughness: 0.5 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.93 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.28, metalness: 0.9 }),
  pil: new THREE.MeshStandardMaterial({ color: 0xc3c7cc, roughness: 0.35, metalness: 0.75 }),
  etiket: new THREE.MeshStandardMaterial({ color: 0xeceeef, roughness: 0.6 }),
  servo: new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.3, transparent: true, opacity: 0.92 }),
  servoEtiket: new THREE.MeshStandardMaterial({ color: 0xb0175f, roughness: 0.35, metalness: 0.4 }),
  sari: new THREE.MeshStandardMaterial({ color: 0xf2a922, roughness: 0.45 }),                // XT30
  beyazKonn: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.6 }),
  dip: new THREE.MeshStandardMaterial({ color: 0xd9262e, roughness: 0.5 }),
  vida: new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.4, metalness: 0.6 }),
  lens: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.12 }),
  bayrak: new THREE.MeshStandardMaterial({ color: 0xf3f3f1, roughness: 0.62, side: THREE.DoubleSide }),
  kabloK: new THREE.MeshStandardMaterial({ color: 0xd4232b, roughness: 0.45 }),
  kabloS: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.5 }),
  kabloT: new THREE.MeshStandardMaterial({ color: 0xf08c1a, roughness: 0.45 }),
  kabloB: new THREE.MeshStandardMaterial({ color: 0x6b3a1e, roughness: 0.5 })
};

function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function silindir(r: number, h: number, m: THREE.Material, seg = 20) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }
/** köşeleri yuvarlatılmış dikdörtgen yol (delik ya da şekil) */
function yuvarlakDikdortgen(p: THREE.Path | THREE.Shape, x0: number, y0: number, w: number, h: number, r: number) {
  p.moveTo(x0 + r, y0); p.lineTo(x0 + w - r, y0); p.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); p.lineTo(x0 + w, y0 + h - r); p.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  p.lineTo(x0 + r, y0 + h); p.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
}

/* Bıçak: uç (50, 0) → üst (18, 37); eğim ≈ 49°. Plaka yerel koordinatı: u yanal (−50…50), v eğim boyunca (0…L), ön yüz +z */
const BICAK_UST = 37, BICAK_GERI = 32;
const L = Math.hypot(BICAK_GERI, BICAK_UST), ACI = Math.atan2(BICAK_UST, BICAK_GERI);

function bicak(): THREE.Group {
  const plaka = new THREE.Group();
  /* ana çelik plaka: üst kenarda iki çentik, köşelerde geriye bükülmüş kanatlar ayrı parça */
  const s = new THREE.Shape();
  s.moveTo(-50, 9); s.lineTo(50, 9); s.lineTo(50, 31); s.lineTo(37, 31); s.lineTo(37, 37); s.lineTo(15, 37); s.lineTo(15, L); s.lineTo(-15, L); s.lineTo(-15, 37);
  s.lineTo(-37, 37); s.lineTo(-37, 31); s.lineTo(-50, 31); s.lineTo(-50, 9);
  /* sensör pencereleri: yanlarda geniş, ortada dar (fotoğraftaki gibi köşeleri yuvarlak) */
  for (const [u, w] of [[-26.5, 25], [0, 16], [26.5, 25]]) { const p = new THREE.Path(); yuvarlakDikdortgen(p, u - w / 2, 16, w, 10, 2.5); s.holes.push(p); }
  const ana = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }), M.celik);
  plaka.add(ana);
  /* geriye bükülmüş üst köşe kanatları */
  for (const yon of [-1, 1]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(13, L - 31, 1), M.celik);
    const mente = new THREE.Group(); mente.position.set(yon * 37, 31, 0.5); mente.rotation.y = yon * 0.75;
    k.position.set(yon * 6.5, (L - 31) / 2, 0); mente.add(k); plaka.add(mente);
  }
  /* alt kenarda parlak bıçak şeridi (iki küçük delikli) ve kapton bant */
  const ss = new THREE.Shape(); ss.moveTo(-50, 0); ss.lineTo(50, 0); ss.lineTo(50, 12); ss.lineTo(-50, 12); ss.lineTo(-50, 0);
  for (const u of [-17, 17]) { const p = new THREE.Path(); yuvarlakDikdortgen(p, u - 3.5, 7, 7, 2, 0.6); ss.holes.push(p); }
  const serit = new THREE.Mesh(new THREE.ExtrudeGeometry(ss, { depth: 0.6, bevelEnabled: false }), M.parlakCelik); serit.position.z = 1; plaka.add(serit);
  const bant = kutu(100, 4.5, 0.15, M.kapton, 0, 2.25, 1.7); plaka.add(bant);
  /* pencerelerin arkasında siyah sensör yuvaları, içinde parlak mercek */
  for (const [u, w] of [[-26.5, 23], [0, 14], [26.5, 23]]) {
    plaka.add(kutu(w, 9, 6, M.baski, u, 21, -3));
    const m = silindir(1.2, 1, M.parlakCelik, 12); m.rotation.x = Math.PI / 2; m.position.set(u + (u < 0 ? 5 : u > 0 ? -5 : 0), 19, 0.2); plaka.add(m);
  }
  /* pencerelerin arasındaki dört vida */
  for (const u of [-44, -13, 13, 44]) { const v = silindir(1.8, 0.8, M.vida, 14); v.rotation.x = Math.PI / 2; v.position.set(u, 19, 1.3); plaka.add(v); }
  /* plakayı robota yerleştir (yerel x → robot −z, yerel z → ileri) */
  plaka.rotation.order = "YXZ";
  plaka.rotation.y = Math.PI / 2;
  plaka.rotation.x = -(Math.PI / 2 - ACI);
  plaka.position.set(50, 0.4, 0);
  const g = new THREE.Group(); g.add(plaka);
  return golgeli(g);
}

/** Geniş lastik teker: dışta düz alüminyum göbek (ortada mil deliği, yanda sabitleme vidası) */
function tekerlek(): THREE.Group {
  const g = new THREE.Group();
  const lastik = new THREE.Mesh(new THREE.CylinderGeometry(R, R, TEKER_EN, 48, 1, true), M.lastik); lastik.rotation.x = Math.PI / 2; g.add(lastik);
  /* lastik yanağı: dışta göbeğe kadar halka */
  const yan = new THREE.Mesh(new THREE.RingGeometry(R - 3.2, R, 48), M.lastik); yan.position.z = TEKER_EN / 2; g.add(yan);
  const ic = new THREE.Mesh(new THREE.CircleGeometry(R, 40), M.lastik); ic.position.z = -TEKER_EN / 2; ic.rotation.y = Math.PI; g.add(ic);
  const gs = new THREE.Shape(); gs.absarc(0, 0, R - 3.2, 0, Math.PI * 2, false);
  const mil = new THREE.Path(); mil.absarc(0, 0, 1.6, 0, Math.PI * 2, true); gs.holes.push(mil);
  const vida = new THREE.Path(); vida.absarc(0, 6, 0.7, 0, Math.PI * 2, true); gs.holes.push(vida);
  const gobek = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2, curveSegments: 40 }), M.alu);
  gobek.position.z = TEKER_EN / 2 - 1.3; g.add(gobek);
  return golgeli(g);
}

/** Bayrak: siyah kolun ucuna geçirilmiş ince beyaz levha (149,4 × 46 mm); kol levhanın ortasından geçer,
    o hizada takım renginde şerit. Kolun pivotu orijinde, levha +X yönünde uzanır. */
function bayrakKolu(renk: number): THREE.Group {
  const g = new THREE.Group();
  /* kol: dişli başlı siyah baskı çubuk */
  const kol = kutu(56, 5, 3.2, M.baski, 28, 0, 0); g.add(kol);
  const dis = silindir(6, 3.6, M.baski, 14); dis.rotation.x = Math.PI / 2; g.add(dis);
  const BOY = 149.4, YUK = 46, x0 = 40;
  const s = new THREE.Shape();
  s.moveTo(x0 + 6, -YUK / 2); s.lineTo(x0 + BOY - 6, -YUK / 2); s.quadraticCurveTo(x0 + BOY, -YUK / 2, x0 + BOY, -YUK / 2 + 6); s.lineTo(x0 + BOY, YUK / 2 - 6);
  s.quadraticCurveTo(x0 + BOY, YUK / 2, x0 + BOY - 6, YUK / 2); s.lineTo(x0 + 10, YUK / 2); s.lineTo(x0, YUK / 2 - 10); s.lineTo(x0, -YUK / 2 + 6); s.quadraticCurveTo(x0, -YUK / 2, x0 + 6, -YUK / 2);
  const levha = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false, curveSegments: 6 }), M.bayrak);
  levha.position.z = -0.3; g.add(levha);
  /* levhanın içinden görünen kol: takım renginde şerit (iki yüzde) */
  const seritM = new THREE.MeshStandardMaterial({ color: renk, roughness: 0.5 });
  for (const z of [-0.45, 0.45]) { const sr = kutu(BOY - 6, 5, 0.1, seritM, x0 + BOY / 2, 0, z); g.add(sr); }
  return golgeli(g);
}

export interface KenshinModeli {
  kok: THREE.Group;
  tekerleriDondur(sol: number, sag: number): void;
  /** 0: bayraklar kapalı (dik, yukarıda), 1: açık (yana) */
  bayraklar(acik: number): void;
}

/** renk: bayrak şeridi (takım rengi) */
export function kenshin(renk = 0xd7262e): KenshinModeli {
  const ic = new THREE.Group();
  /* alt plaka ve ana kart: önde tam en, arkada tekerlerin arasında dar */
  for (const [y, h, m] of [[3.5, 2, M.plaka], [5.6, 1.6, M.pcb]] as const) {
    ic.add(golgeli(kutu(58, h, 96, m, 0, y, 0)));
    ic.add(golgeli(kutu(28, h, 48, m, -43, y, 0)));
  }
  ic.add(golgeli(bicak()));
  /* tekerlekler (motorlar göbeklerin içinde, görünmez) */
  const tekerler: THREE.Group[] = [];
  for (const s of [-1, 1]) { const t = tekerlek(); t.position.set(TEKER_X, R, s * (50 - TEKER_EN / 2)); if (s < 0) t.rotation.y = Math.PI; ic.add(t); tekerler.push(t); }
  /* servo yuvası (siyah baskı) ve dik duran mikro servo */
  ic.add(golgeli(kutu(16, 30, 30, M.baski, -38, 21, 0)));
  const servo = new THREE.Group();
  servo.add(kutu(12.2, 29, 22.8, M.servo, 0, 0, 0));
  servo.add(kutu(12.6, 2.5, 32, M.servo, 0, 6, 0));                  // montaj kulakları
  servo.add(kutu(0.3, 11, 18, M.servoEtiket, 6.25, -2, 0));          // etiket (yazısız)
  const mil = silindir(2.5, 4, M.baski, 12); mil.position.set(0, 16.5, -5.5); servo.add(mil);
  servo.position.set(-26, 22, 0); ic.add(golgeli(servo));
  /* pil: servo ile bıçak arasında yatay (2S LiPo, gümüş kılıf, etiket yazısız) */
  const pil = new THREE.Group();
  pil.add(kutu(15, 13, 56, M.pil));
  pil.add(kutu(0.3, 9, 9, M.etiket, 7.6, 0, 17));
  for (const z of [-6, -1]) pil.add(kutu(0.3, 9, 1.6, new THREE.MeshStandardMaterial({ color: 0x1d5fd8, roughness: 0.6 }), 7.6, 0, z));
  pil.position.set(-5, 13.5, -1); ic.add(golgeli(pil));
  /* başlatma modülü (kızılötesi alıcı): sağda, yeşil küçük kart + siyah huni + kubbe */
  const bm = new THREE.Group();
  bm.add(kutu(16, 1.4, 15, M.pcb));
  bm.add(kutu(10, 7, 10, M.baski, 0, 4.2, 0));
  const kubbe = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.lens); kubbe.position.y = 4.5; bm.add(kubbe);
  bm.position.set(-12, 21, 36); ic.add(golgeli(bm));
  /* yan rakip sensörleri: iki yanda siyah kutu, iki mercek dışa bakar */
  for (const s of [-1, 1]) {
    const ys = new THREE.Group(); ys.add(kutu(13, 9, 7, M.baski));
    for (const dx of [-3, 3]) { const m = silindir(1.6, 1, M.lens, 14); m.rotation.x = Math.PI / 2; m.position.set(dx, 0, s * 3.6); ys.add(m); }
    ys.position.set(8, 11, s * 44); ic.add(golgeli(ys));
  }
  /* kart üstü: XT30 (sarı), sürgü anahtar, kırmızı DIP anahtar, kondansatörler */
  ic.add(golgeli(kutu(9, 6, 16, M.sari, -16, 9.5, -33)));
  ic.add(golgeli(kutu(8, 6, 4, M.baski, -16, 9.5, -42)));
  ic.add(golgeli(kutu(6, 3, 10, M.dip, 14, 7.9, 38)));
  for (const [x, z] of [[-17, -12], [-17, 14]]) { const k = silindir(3, 7, M.alu, 14); k.position.set(x, 10, z); ic.add(golgeli(k)); }
  /* kablolar: pilden XT30'a kırmızı-siyah, servodan karta turuncu-kırmızı-kahverengi */
  const kablo = (noktalar: [number, number, number][], m: THREE.Material, r = 0.9) => {
    const e = new THREE.CatmullRomCurve3(noktalar.map((p) => new THREE.Vector3(...p)));
    const k = new THREE.Mesh(new THREE.TubeGeometry(e, 24, r, 6), m); k.castShadow = true; ic.add(k);
  };
  kablo([[-5, 16, -29], [-6, 24, -36], [-12, 22, -40], [-16, 13, -38]], M.kabloK, 1.1);
  kablo([[-3, 14, -29], [-3, 22, -38], [-10, 21, -43], [-15, 13, -41]], M.kabloS, 1.1);
  for (const [m, dz] of [[M.kabloT, 0], [M.kabloK, 1], [M.kabloB, 2]] as const) kablo([[-20, 30, 10 + dz], [-10, 26, 16 + dz], [-6, 21, 22 + dz], [-8, 9, 26 + dz]], m, 0.45);
  /* bayrak mekanizması: servonun dişlisi iki kolu döndürür; pivotlar servonun üstünde */
  const pivotlar: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(-41, 40, s * 7);
    const kol = bayrakKolu(renk);
    /* kol yerel +X'te uzanır → robotun yan tarafına (s·Z) çevir; levha ileri bakar */
    kol.rotation.y = -s * Math.PI / 2;
    p.add(kol); ic.add(p); pivotlar.push(p);
  }
  const kok = new THREE.Group(); kok.add(ic); kok.scale.setScalar(0.001);
  const model: KenshinModeli = {
    kok,
    tekerleriDondur(sol, sag) { tekerler[0].rotation.z = sol / R; tekerler[1].rotation.z = -sag / R; },
    bayraklar(acik) {
      const a = Math.max(0, Math.min(1, acik));
      const yumusak = a * a * (3 - 2 * a);
      /* kapalıyken dik (yukarı), açıkken yataydan 12° yukarıda */
      const aci = Math.PI / 2 - yumusak * (Math.PI / 2 - 0.21);
      pivotlar.forEach((p, i) => { const s = i ? 1 : -1; p.rotation.x = -s * aci; });
    }
  };
  model.bayraklar(1);
  return model;
}
