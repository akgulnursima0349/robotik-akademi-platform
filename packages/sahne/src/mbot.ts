/* mBot (Makeblock, mCore): ürün fotoğraflarından ve ürün bilgisinden (yaklaşık 170 × 130 × 90 mm) modellendi.
   - Mavi alüminyum şasi: düz üst levha, önde aşağı inen yüz levhası (gülen ağız), iki yanda kısa etek ("M" harfi),
     ön köşelerde yukarı kalkık delikli "kanatlar".
   - mCore kartı yarı saydam beyaz bir kutunun içinde, pirinç ayaklar üstünde; kutunun üstünde delik ızgarası, kenarlarda renkli port etiketleri.
   - Önde siyah kartlı ultrasonik sensör: iki gümüş göz (robotun "yüzü").
   - Yüzün altında çizgi izleme sensörü; arkada iki büyük siyah teker, önde bilye teker.
   Eksenler: +X ileri, +Y yukarı, +Z sağ; orijin teker ekseninin ortası, yerde. Birim mm, kök 0,001 ölçekli. */
import * as THREE from "three";

const R = 32;          // teker yarıçapı (çap ≈ 64 mm)
const TEKER_EN = 26;
const TEKER_Z = 64;
const UST_Y = 36;      // üst levhanın üst yüzü
const ON_X = 92;       // yüz levhasının önü

const M = {
  sasi: new THREE.MeshStandardMaterial({ color: 0x2aa7e8, roughness: 0.32, metalness: 0.55, side: THREE.DoubleSide }),
  delik: new THREE.MeshStandardMaterial({ color: 0x0b3550, roughness: 0.6, side: THREE.DoubleSide }),
  agiz: new THREE.MeshStandardMaterial({ color: 0x0d2a40, roughness: 0.5 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.85, side: THREE.DoubleSide }),
  dis: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.5, side: THREE.DoubleSide }),
  gobek: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.5 }),
  kutu: new THREE.MeshPhysicalMaterial({ color: 0xf3f5f7, roughness: 0.35, transmission: 0.3, transparent: true, opacity: 0.72, depthWrite: false }),
  kutuKenar: new THREE.MeshStandardMaterial({ color: 0xe6e9ed, roughness: 0.4 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1c3f7a, roughness: 0.45 }),
  pcbSiyah: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.45 }),
  gumus: new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 0.2, metalness: 0.95 }),
  ag: new THREE.MeshStandardMaterial({ color: 0x3a3e45, roughness: 0.7, side: THREE.DoubleSide }),
  pirinc: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9 }),
  siyah: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.5 }),
  beyaz: new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 0.5 }),
  sari: new THREE.MeshStandardMaterial({ color: 0xf6c23e, roughness: 0.5 }),
  mavi: new THREE.MeshStandardMaterial({ color: 0x3d7be0, roughness: 0.5 }),
  ledK: new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff2050, emissiveIntensity: 0.8, roughness: 0.3 }),
  ledM: new THREE.MeshStandardMaterial({ color: 0x4dd2ff, emissive: 0x20a0ff, emissiveIntensity: 0.8, roughness: 0.3 }),
  motor: new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.5 })
};
function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function silindir(r: number, h: number, m: THREE.Material, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }
/** dikey levhaya yapışan koyu delik; yuz: "x" öne bakan levha, "z" yana bakan levha */
function delik(x: number, y: number, z: number, yuz: "x" | "z", r = 2) {
  const d = new THREE.Mesh(new THREE.CircleGeometry(r, 14), M.delik);
  if (yuz === "x") d.rotation.y = Math.PI / 2;
  d.position.set(x, y, z); return d;
}

/** Fotoğraftaki teker: kalın siyah lastik, dış yüzde açık gri jant, altı boşluk ve koyu göbek */
function teker(dis: 1 | -1): THREE.Group {
  const g = new THREE.Group();
  const lastik = silindir(R, TEKER_EN, M.lastik, 48); lastik.rotation.x = Math.PI / 2; g.add(lastik);
  const yz = dis * (TEKER_EN / 2);
  const yanak = new THREE.Mesh(new THREE.TorusGeometry(R - 3, 3, 10, 48), M.lastik); yanak.position.z = yz; g.add(yanak);
  const jant = new THREE.Mesh(new THREE.CircleGeometry(R - 7, 40), M.dis); jant.position.z = yz + dis * 0.3; g.add(jant);
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.CircleGeometry(4.6, 16), M.lastik); b.scale.set(1, 1.6, 1);
    const a = (i / 6) * Math.PI * 2; b.position.set(Math.cos(a) * 15, Math.sin(a) * 15, yz + dis * 0.6); b.rotation.z = a + Math.PI / 2; g.add(b);
  }
  const gob = silindir(6, 4, M.gobek, 20); gob.rotation.x = Math.PI / 2; gob.position.z = yz + dis * 1; g.add(gob);
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

  /* ---- şasi ---- */
  const sasi = new THREE.Group();
  sasi.add(kutu(ON_X + 48, 3, 96, M.sasi, (ON_X - 48) / 2, UST_Y - 1.5, 0));                   // üst levha (x -48…92)
  sasi.add(kutu(3, 28, 96, M.sasi, ON_X - 1.5, UST_Y - 14, 0));                               // yüz levhası
  for (const s of [-1, 1]) {
    sasi.add(kutu(ON_X + 30, 16, 3, M.sasi, (ON_X - 30) / 2 + 2, UST_Y - 9, s * 48));          // yan etek
    for (let i = 0; i < 3; i++) sasi.add(delik(-22 + i * 14, UST_Y - 9, s * 49.6, "z", 1.8));
    /* yan etekte "M" harfi */
    const mz = s * 49.7, mx = 50, my = UST_Y - 9;
    for (const [dx, a, h] of [[-5, 0, 11], [5, 0, 11], [-2.5, 0.5, 7], [2.5, -0.5, 7]] as const) {
      const c = kutu(1.8, h, 0.4, M.agiz, mx + dx, my + (h < 10 ? 2 : 0), mz); c.rotation.z = a; sasi.add(c);
    }
  }
  /* yüz: gülen ağız (aşağı bakan yarım halka) ve iki küçük delik */
  const agiz = new THREE.Mesh(new THREE.TorusGeometry(9, 1.3, 8, 24, Math.PI), M.agiz);
  agiz.rotation.set(Math.PI, Math.PI / 2, 0); agiz.position.set(ON_X + 0.3, UST_Y - 12, 0); sasi.add(agiz);
  for (const z of [-34, 34]) sasi.add(delik(ON_X + 0.2, UST_Y - 8, z, "x"));
  /* ön köşelerde dışa doğru yukarı kalkık kanatlar */
  for (const s of [-1, 1]) {
    const sekil = new THREE.Shape(); sekil.moveTo(0, 0); sekil.lineTo(36, 0); sekil.lineTo(32, 20); sekil.quadraticCurveTo(16, 27, 4, 18); sekil.closePath();
    for (const [hx, hy] of [[9, 7], [18, 8], [27, 7], [13, 15], [23, 15]]) { const h = new THREE.Path(); h.absarc(hx, hy, 2, 0, Math.PI * 2, true); sekil.holes.push(h); }
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sekil, { depth: 2.5, bevelEnabled: false, curveSegments: 10 }), M.sasi);
    /* şekil x → robot x, şekil y → yana (dışa) */
    m.rotation.x = s * Math.PI / 2;
    const kanat = new THREE.Group(); kanat.add(m);
    kanat.position.set(52, UST_Y - 3, s * 48);
    kanat.rotation.x = s * -0.5;           // dış kenar yukarı kalkık
    sasi.add(kanat);
  }
  ic.add(golgeli(sasi));

  /* motorlar şasinin altında, teker hizasında */
  for (const z of [-30, 30]) parcalar.motorlar.add(golgeli(kutu(48, 20, 22, M.motor, 0, UST_Y - 14, z)));
  /* pil yuvası arkada, şasinin altında */
  ic.add(golgeli(kutu(56, 14, 60, M.siyah, -26, UST_Y - 12, 0)));

  /* tekerler */
  const tekerler: THREE.Group[] = [];
  for (const s of [-1, 1] as const) { const t = teker(s); t.position.set(0, R, s * TEKER_Z); parcalar.tekerler.add(t); tekerler.push(t); }
  /* önde bilye teker */
  const bilye = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), M.gumus); bilye.position.set(66, 7, 0); ic.add(golgeli(bilye));
  ic.add(golgeli(kutu(16, UST_Y - 16, 16, M.siyah, 66, (UST_Y + 8) / 2 - 2, 0)));

  /* ---- mCore: pirinç ayaklar, kart, yarı saydam kutu ---- */
  const k = parcalar.kart;
  const kutuY = UST_Y + 8;            // kutunun alt yüzü
  for (const [x, z] of [[-30, -34], [-30, 34], [44, -34], [44, 34]]) { const a = silindir(2.5, 8, M.pirinc, 8); a.position.set(x, UST_Y + 4, z); k.add(golgeli(a)); }
  k.add(golgeli(kutu(86, 1.6, 78, M.pcb, 7, kutuY + 3, 0)));
  for (const [x, z, w, d] of [[30, -18, 14, 10], [0, 16, 18, 12], [-16, -16, 10, 10]] as const) k.add(kutu(w, 4, d, M.siyah, x, kutuY + 6, z));
  const kap = new THREE.Mesh(new THREE.BoxGeometry(94, 40, 86), M.kutu); kap.position.set(7, kutuY + 20, 0); kap.castShadow = true; k.add(kap);
  /* üst kenar çerçevesi (ortası açık: kapak yarı saydam, içi görünür) */
  for (const z of [-42.5, 42.5]) k.add(kutu(96, 3, 3, M.kutuKenar, 7, kutuY + 40, z));
  for (const x of [-39.5, 53.5]) k.add(kutu(3, 3, 88, M.kutuKenar, x, kutuY + 40, 0));
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const d = silindir(2.2, 0.6, M.ag, 10); d.position.set(-6 + i * 8, kutuY + 41.6, -12 + j * 8); k.add(d); }
  const renkler = [M.sari, M.mavi, M.beyaz, M.siyah, M.sari, M.mavi];
  renkler.forEach((m, i) => { k.add(kutu(9, 1, 5, m, -28 + i * 11, kutuY + 41.7, -38)); k.add(kutu(9, 1, 5, renkler[(i + 2) % 6], -28 + i * 11, kutuY + 41.7, 38)); });
  /* kartın önünde iki RGB LED ve ortada ışık sensörü (kutunun içinden görünür) */
  for (const [z, m] of [[-22, M.ledK], [22, M.ledM]] as const) { const l = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 10), m); l.position.set(48, kutuY + 6, z); parcalar.ledler.add(l); }
  const isik = new THREE.Mesh(new THREE.SphereGeometry(3.6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.beyaz); isik.position.set(48, kutuY + 4.6, 0); parcalar.isikSensoru.add(golgeli(isik));
  const isikTaban = silindir(4.6, 1.6, M.siyah, 16); isikTaban.position.set(48, kutuY + 4, 0); parcalar.isikSensoru.add(isikTaban);

  /* ---- ultrasonik sensör: siyah kart, iki gümüş göz ---- */
  const us = parcalar.ultrasonik;
  const usY = UST_Y + 14;
  us.add(golgeli(kutu(10, 6, 30, M.siyah, ON_X - 6, UST_Y + 3, 0)));
  us.add(golgeli(kutu(2, 24, 50, M.pcbSiyah, ON_X + 1, usY, 0)));
  for (const z of [-13, 13]) {
    const goz = silindir(8, 11, M.gumus, 28); goz.rotation.z = -Math.PI / 2; goz.position.set(ON_X + 7.5, usY, z); us.add(golgeli(goz));
    const ag = new THREE.Mesh(new THREE.CircleGeometry(6.6, 24), M.ag); ag.rotation.y = Math.PI / 2; ag.position.set(ON_X + 13.1, usY, z); us.add(ag);
  }
  const usLed = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), M.ledM); usLed.position.set(ON_X + 2.2, usY - 9, 0); us.add(usLed);

  /* ---- çizgi sensörü: yüzün altında, öne taşan küçük kart; iki göz aşağı bakar ---- */
  const cs = parcalar.cizgiSensoru;
  cs.add(golgeli(kutu(20, 2, 32, M.pcb, ON_X - 4, 9, 0)));
  cs.add(golgeli(kutu(8, UST_Y - 12, 8, M.siyah, ON_X - 10, (UST_Y + 10) / 2, 0)));
  for (const z of [-7, 7]) { const g = silindir(2.6, 5, M.siyah, 12); g.position.set(ON_X - 2, 5.5, z); cs.add(golgeli(g)); }
  return { kok, parcalar, tekerler };
}
