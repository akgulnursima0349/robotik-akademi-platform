/* RizBot Maze: sivasrobotik.com.tr ürün fotoğraflarından modellendi.
   Kumpas ölçüsü yok: oranlar fotoğraflardan, tekerler arası dış genişlik ≈100 mm varsayımıyla ölçeklendi.
   - Siyah kart: önde geniş, köşeleri pahlı "kalkan"; arkada kuyruk (denetleyici kartı, anahtar, JST).
   - Denetleyici: mavi Pro Micro (fotoğrafta üstünde "pro Micro" yazıyor; ürün metni Arduino Nano diyor).
   - Kırmızı lastikli, sarı göbekli geniş tekerler; motorların üstünde pürüzlü siyah 3D baskı kapaklar.
   - Önde 3D baskı köprü; üstünde dik duran gümüş fan motoru (vakum), altında kartın üstünde fan çarkı ve beyaz halka.
   - Kızılötesi sensörler: siyah makaronlu, yatay; ileri, çapraz ve yana bakan çiftler.
   Eksenler: +X ileri, +Y yukarı, +Z sağ; orijin teker ekseninin ortası (robot yerinde bunun etrafında döner). Birim mm, kök 0,001 ölçekli. */
import * as THREE from "three";

const R = 16;            // teker yarıçapı
const TEKER_EN = 18;
const TEKER_Z = 41;      // teker merkezinin yanal konumu (dış kenar ≈ 50)
const KART_Y = 4;        // kart alt yüzü (yerden)

const M = {
  pcb: new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.38, metalness: 0.25 }),
  baski: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.72 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0xe8262f, roughness: 0.6 }),
  gobek: new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: 0.45 }),
  motor: new THREE.MeshStandardMaterial({ color: 0xc4c9cf, roughness: 0.25, metalness: 0.92 }),
  fanMotor: new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.18, metalness: 0.95 }),
  etiket: new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.6 }),
  etiketMavi: new THREE.MeshStandardMaterial({ color: 0x2b6fd6, roughness: 0.5 }),
  promicro: new THREE.MeshStandardMaterial({ color: 0x1f56c4, roughness: 0.42 }),
  cip: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.35 }),
  altin: new THREE.MeshStandardMaterial({ color: 0xd3ab52, roughness: 0.3, metalness: 0.9 }),
  usb: new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.25, metalness: 0.95 }),
  tantal: new THREE.MeshStandardMaterial({ color: 0xe8b81e, roughness: 0.4 }),
  elko: new THREE.MeshStandardMaterial({ color: 0x1e2a3a, roughness: 0.35, metalness: 0.4 }),
  jst: new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.6 }),
  makaron: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.4 }),
  bacak: new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.3, metalness: 0.9 }),
  lens: new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.08, metalness: 0.1 }),
  beyaz: new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.55 }),
  kablo: new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.45 }),
  kabloK: new THREE.MeshStandardMaterial({ color: 0xd8262e, roughness: 0.5 })
};

/** motor kapaklarının pürüzlü ("fuzzy skin") yüzeyi için gürültü dokusu */
function puruzDokusu(): THREE.CanvasTexture {
  const n = 128, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const c = cv.getContext("2d")!, img = c.createImageData(n, n);
  let s = 7;
  for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; const v = 90 + (s % 120); img.data.set([v, v, v, 255], i * 4); }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}
const PURUZ = new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.95 });
let puruzHazir = false;

function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function silindir(r: number, h: number, m: THREE.Material, seg = 20) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }

/** Kart dış çizgisi (üstten, x ileri / z yan): kuyruk, teker bölgesi, geniş ön kalkan */
function kart(): THREE.Mesh {
  const p: [number, number][] = [
    [-46, -40], [-16, -40], [-16, -31], [17, -31], [17, -38], [24, -43], [56, -43], [72, -24], [72, 24], [56, 43], [24, 43], [17, 38], [17, 31], [-16, 31], [-16, 40], [-46, 40]
  ];
  const s = new THREE.Shape(); s.moveTo(p[0][0], p[0][1]); for (const [x, z] of p.slice(1)) s.lineTo(x, z); s.closePath();
  for (const [x, z] of [[64, 0], [30, -36], [30, 36], [-40, -34], [-40, 34]]) { const d = new THREE.Path(); d.absarc(x, z, 1.4, 0, Math.PI * 2, true); s.holes.push(d); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false, curveSegments: 10 });
  g.rotateX(Math.PI / 2);          // şekil y'si → robot z'si; kalınlık aşağı
  g.translate(0, KART_Y + 1.6, 0);
  return new THREE.Mesh(g, M.pcb);
}

function teker(): THREE.Group {
  const g = new THREE.Group();
  /* kırmızı lastik: kenarları yuvarlak (döndürülmüş profil) */
  const prof: THREE.Vector2[] = [];
  const e = TEKER_EN / 2, yuv = 3.5;
  prof.push(new THREE.Vector2(R - 6.5, -e));
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; prof.push(new THREE.Vector2(R - yuv + Math.cos(a) * yuv, -e + yuv + Math.sin(a) * yuv)); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; prof.push(new THREE.Vector2(R - yuv + Math.cos(a) * yuv, e - yuv + Math.sin(a) * yuv)); }
  prof.push(new THREE.Vector2(R - 6.5, e));
  const lastik = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), M.lastik); lastik.rotation.x = Math.PI / 2; g.add(lastik);
  /* sarı göbek: dış yüzde derin çanak, içte kısa boğaz */
  const gp = [new THREE.Vector2(2, e - 4), new THREE.Vector2(R - 8.5, e - 3.5), new THREE.Vector2(R - 6.4, e + 0.3), new THREE.Vector2(R - 6.4, -e), new THREE.Vector2(4, -e - 1.5), new THREE.Vector2(2, -e - 1.5)];
  const gobek = new THREE.Mesh(new THREE.LatheGeometry(gp, 36), M.gobek); gobek.rotation.x = Math.PI / 2; g.add(gobek);
  const mil = silindir(1.5, 2, M.motor, 12); mil.rotation.x = Math.PI / 2; mil.position.z = e - 4; g.add(mil);
  return golgeli(g);
}

/** IR sensör: siyah makaronlu yatay gövde (+X'e bakar), ucunda koyu mercek, kartın içine inen iki gümüş bacak */
function irSensor(): THREE.Group {
  const g = new THREE.Group();
  const gov = silindir(2.6, 9, M.makaron, 14); gov.rotation.z = -Math.PI / 2; gov.position.x = 4.5; g.add(gov);
  const uc = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.lens); uc.rotation.z = -Math.PI / 2; uc.position.x = 9; g.add(uc);
  for (const z of [-1.1, 1.1]) { const b = silindir(0.35, 6.5, M.bacak, 6); b.position.set(-0.4, -3.2, z); g.add(b); }
  return golgeli(g);
}

export interface RizbotModeli {
  kok: THREE.Group;
  tekerleriDondur(sol: number, sag: number): void;
  fanHizi: number;
  guncelle(dt: number): void;
  led(durum: "hazir" | "bitti" | "hata"): void;
  /** sensör ışınlarının çıkış noktaları ve yönleri (mm, robot ekseninde) */
  sensorler: Record<"on" | "sol" | "sag", { x: number; z: number; yon: number }[]>;
}

export function rizbot(): RizbotModeli {
  if (!puruzHazir) { const t = puruzDokusu(); PURUZ.bumpMap = t; PURUZ.bumpScale = 1.6; PURUZ.roughnessMap = t; puruzHazir = true; }
  const ic = new THREE.Group();
  ic.add(golgeli(kart()));
  const ust = KART_Y + 1.6;
  /* tekerler */
  const tekerler: THREE.Group[] = [];
  for (const s of [-1, 1]) { const t = teker(); t.position.set(0, R, s * TEKER_Z); if (s < 0) t.rotation.y = Math.PI; ic.add(t); tekerler.push(t); }
  /* motorlar: ortadaki boşlukta gümüş uçları görünür; üstlerinde pürüzlü kapaklı 3D baskı yuvalar */
  for (const s of [-1, 1]) {
    const m = silindir(6, 20, M.motor, 18); m.rotation.x = Math.PI / 2; m.position.set(0, R, s * 15); ic.add(golgeli(m));
    const yuva = kutu(26, R + 9 - ust, 20, M.baski, 0, (ust + R + 9) / 2, s * 21); ic.add(golgeli(yuva));
    const kapak = kutu(26.5, 1.4, 20.5, PURUZ, 0, R + 9.6, s * 21); ic.add(golgeli(kapak));
  }
  const kablo = (n: [number, number, number][], m: THREE.Material, r = 0.8) => { const e = new THREE.CatmullRomCurve3(n.map((p) => new THREE.Vector3(...p))); const t = new THREE.Mesh(new THREE.TubeGeometry(e, 20, r, 6), m); t.castShadow = true; ic.add(t); };
  kablo([[-6, ust + 1, -4], [-2, R + 6, 0], [4, R + 2, 4], [10, ust + 1, 6]], M.kabloK);
  /* ön köprü: iki yan ayak, arka bağlantı ve delikli üst plaka (3D baskı) */
  for (const s of [-1, 1]) ic.add(golgeli(kutu(30, 18, 7, M.baski, 30, ust + 9, s * 24)));
  ic.add(golgeli(kutu(10, 12, 48, M.baski, 15, ust + 6, 0)));
  const plakaS = new THREE.Shape(); plakaS.moveTo(-14, -27); plakaS.lineTo(14, -27); plakaS.lineTo(16, 27); plakaS.lineTo(-14, 27); plakaS.lineTo(-14, -27);
  for (const [x, z] of [[0, -14], [0, 14]]) { const d = new THREE.Path(); d.absarc(x, z, 3.4, 0, Math.PI * 2, true); plakaS.holes.push(d); }
  const merkezDelik = new THREE.Path(); merkezDelik.absarc(0, 0, 4.6, 0, Math.PI * 2, true); plakaS.holes.push(merkezDelik);
  const plakaG = new THREE.ExtrudeGeometry(plakaS, { depth: 3, bevelEnabled: false, curveSegments: 16 }); plakaG.rotateX(Math.PI / 2);
  const plaka = new THREE.Mesh(plakaG, M.baski); plaka.position.set(32, ust + 21, 0); ic.add(golgeli(plaka));
  /* fan: kartın üstünde beyaz halka ve dönen çark; köprünün üstünde dik gümüş fan motoru */
  const halka = new THREE.Mesh(new THREE.RingGeometry(13, 14.2, 40), M.beyaz); halka.rotation.x = -Math.PI / 2; halka.position.set(32, ust + 0.05, 0); ic.add(halka);
  const cark = new THREE.Group(); cark.position.set(32, ust + 2.5, 0);
  cark.add(silindir(3.5, 3, M.baski, 14));
  for (let i = 0; i < 8; i++) { const k = kutu(9, 3.4, 0.8, M.baski); const a = (i / 8) * Math.PI * 2; k.position.set(Math.cos(a) * 7, 0, Math.sin(a) * 7); k.rotation.y = -a + 0.5; cark.add(k); }
  ic.add(golgeli(cark));
  const fm = new THREE.Group();
  fm.add(silindir(4.3, 19, M.fanMotor, 20));
  const bant = silindir(4.4, 4, M.etiket, 20); bant.position.y = 3; fm.add(bant);
  const cizgi = silindir(4.45, 0.8, M.etiketMavi, 20); cizgi.position.y = 3.6; fm.add(cizgi);
  fm.position.set(32, ust + 21 + 9.5, 0); ic.add(golgeli(fm));
  kablo([[32, ust + 40, 1.5], [36, ust + 42, 6], [40, ust + 30, 14], [44, ust + 12, 20], [48, ust + 1, 22]], M.kablo, 0.7);
  /* kuyruk: Pro Micro (enine), kondansatörler, sürgü anahtar, beyaz JST */
  const pm = new THREE.Group();
  pm.add(kutu(18, 1.6, 33, M.promicro));
  pm.add(kutu(7, 1.1, 7, M.cip, 0, 1.3, 2));
  pm.add(kutu(6, 3, 8, M.usb, 0, 2.3, -15));
  for (const x of [-7.6, 7.6]) for (let i = 0; i < 12; i++) pm.add(kutu(1.4, 0.3, 1.4, M.altin, x, 0.9, -14 + i * 2.54));
  pm.position.set(-31, ust + 4.2, -14); ic.add(golgeli(pm));
  for (const z of [-28, -2]) ic.add(golgeli(kutu(18, 2.6, 2.5, M.makaron, -31, ust + 1.3, z)));   // başlık pinleri
  for (const [x, z] of [[-24, 9], [-30, 11]]) ic.add(golgeli(kutu(3.5, 2.5, 6, M.tantal, x, ust + 1.25, z)));
  const elko = silindir(3.2, 6, M.elko, 16); elko.position.set(-37, ust + 3, 9); ic.add(golgeli(elko));
  ic.add(golgeli(kutu(7, 5, 11, M.makaron, -40, ust + 2.5, 22)));
  ic.add(golgeli(kutu(2, 3, 3, M.bacak, -43.5, ust + 4, 22)));
  ic.add(golgeli(kutu(6, 8, 9, M.jst, -38, ust + 4, 34)));
  for (const z of [-30, -22, -14]) ic.add(kutu(3, 0.15, 1.2, M.beyaz, -44, ust + 0.08, z));      // A0 A1 A2 yazıları
  /* sensörler */
  const sensorler: RizbotModeli["sensorler"] = { on: [], sol: [], sag: [] };
  const koy = (x: number, z: number, yon: number) => { const s = irSensor(); s.position.set(x, ust + 4, z); s.rotation.y = yon; ic.add(s); return { x: x + Math.cos(yon) * 10, z: z - Math.sin(yon) * 10, yon }; };
  for (const s of [-1, 1]) {
    sensorler.on.push(koy(60, s * 11, 0));
    koy(55, s * 30, s < 0 ? Math.PI / 4 : -Math.PI / 4);   // çapraz (görsel)
    const yan = koy(40, s * 36, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    sensorler[s < 0 ? "sol" : "sag"].push(yan);
  }
  /* Pro Micro'nun yanındaki durum ledi (oynatma durumunu gösterir) */
  const ledM = new THREE.MeshStandardMaterial({ color: 0x3aa0ff, emissive: 0x3aa0ff, emissiveIntensity: 1.6, roughness: 0.3 });
  ic.add(kutu(2.4, 1.2, 1.6, ledM, -27, ust + 6.4, -7));

  const kok = new THREE.Group(); kok.add(ic); kok.scale.setScalar(0.001);
  const model: RizbotModeli = {
    kok, sensorler, fanHizi: 0,
    tekerleriDondur(sol, sag) { tekerler[0].rotation.z = sol / R; tekerler[1].rotation.z = -sag / R; },
    guncelle(dt) { cark.rotation.y += model.fanHizi * dt; },
    led(d) { const r = d === "bitti" ? 0x2bd47a : d === "hata" ? 0xe0262e : 0x3aa0ff; ledM.color.setHex(r); ledM.emissive.setHex(r); }
  };
  return model;
}
