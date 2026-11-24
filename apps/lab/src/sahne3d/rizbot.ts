/* RizBot Maze: TEMSİLÎ model. Sınıfta robot bulunamadı (Nur, 24 Kasım); ölçü ve fotoğraf yok.
   Ürün sayfasındaki bilgilerle tipik bir yarışma labirent robotu olarak tasarlandı:
   Arduino Nano, kızılötesi duvar sensörleri (ileri bakan iki, yanlara bakan iki), iki mikro redüktörlü motor,
   silikon tekerler, altta vakum fanı (fanlı model), 2S LiPo. Yaklaşık 11 × 9,5 cm.
   Gerçek robotun fotoğrafları gelince Kenshin'deki gibi yeniden yapılacak. Marka yazısı çizilmez.
   Eksenler: +X ileri, +Y yukarı, +Z sağ; birim mm, kök 0,001 ölçekli. */
import * as THREE from "three";

const R = 16;            // teker yarıçapı
const TEKER_EN = 11;
const TEKER_X = -8;
const TEKER_Z = 43;

const M = {
  pcb: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.42, metalness: 0.2 }),
  ped: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9 }),
  serigrafi: new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.6 }),
  silikon: new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.75 }),
  jant: new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.45 }),
  motor: new THREE.MeshStandardMaterial({ color: 0xbfc4ca, roughness: 0.28, metalness: 0.9 }),
  disli: new THREE.MeshStandardMaterial({ color: 0xd2b067, roughness: 0.35, metalness: 0.85 }),
  siyah: new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.55 }),
  nano: new THREE.MeshStandardMaterial({ color: 0x1f4fb8, roughness: 0.45 }),
  cip: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.35 }),
  usb: new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.25, metalness: 0.95 }),
  pil: new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.4, metalness: 0.35 }),
  pilEtiket: new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.6 }),
  irLed: new THREE.MeshStandardMaterial({ color: 0x9fc4ff, roughness: 0.08, transparent: true, opacity: 0.85, emissive: 0x1d2a66, emissiveIntensity: 0.4 }),
  irAlici: new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.1 }),
  fan: new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.5, metalness: 0.2 }),
  kablo: new THREE.MeshStandardMaterial({ color: 0xd8262e, roughness: 0.5 }),
  kabloS: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.5 }),
  jst: new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.6 })
};

function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function silindir(r: number, h: number, m: THREE.Material, seg = 20) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }

/** Ana kart: önde yuvarlak burun, yanlarda teker oyukları. Üstte altın pedler ve ince beyaz çizgiler (doku). */
function anaKart(): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-52, -30); s.lineTo(TEKER_X - 20, -30); s.lineTo(TEKER_X - 20, -36); s.lineTo(30, -36);
  s.absarc(30, 0, 36, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(TEKER_X + 20, 36); s.lineTo(TEKER_X + 20, 30); s.lineTo(-52, 30);
  s.quadraticCurveTo(-58, 30, -58, 24); s.lineTo(-58, -24); s.quadraticCurveTo(-58, -30, -52, -30);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false, curveSegments: 28 });
  g.rotateX(-Math.PI / 2);   // şekil x-y düzleminde; kalınlık yukarı (şekil simetrik)
  /* doku: kart üstü için kanvas (pedler, yollar) */
  const n = 512, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#15171b"; c.fillRect(0, 0, n, n);
  c.strokeStyle = "rgba(60,66,76,.9)"; c.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const x = (i * 97) % n, y = (i * 61) % n; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y); c.lineTo(x + 90, y + 30); c.stroke(); }
  c.fillStyle = "#c9a24a";
  for (let i = 0; i < 70; i++) { c.beginPath(); c.arc((i * 151) % n, (i * 83) % n, 3.2, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = "rgba(233,236,239,.75)"; c.lineWidth = 2; c.strokeRect(14, 14, n - 28, n - 28);
  const doku = new THREE.CanvasTexture(cv); doku.colorSpace = THREE.SRGBColorSpace;
  /* üst yüz UV: x,z düzleminden */
  const uv = g.attributes.uv as THREE.BufferAttribute, p = g.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 58) / 124, (p.getZ(i) + 40) / 80);
  const ust = new THREE.MeshStandardMaterial({ map: doku, roughness: 0.42, metalness: 0.2 });
  const k = new THREE.Mesh(g, [ust, M.pcb]);
  return k;
}

function teker(): THREE.Group {
  const g = new THREE.Group();
  const lastik = new THREE.Mesh(new THREE.CylinderGeometry(R, R, TEKER_EN, 40, 1, true), M.silikon); lastik.rotation.x = Math.PI / 2; g.add(lastik);
  const yan = new THREE.Mesh(new THREE.RingGeometry(R - 3, R, 40), M.silikon); yan.position.z = TEKER_EN / 2; g.add(yan);
  const yanIc = yan.clone(); yanIc.position.z = -TEKER_EN / 2; yanIc.rotation.y = Math.PI; g.add(yanIc);
  /* beyaz baskı jant: dört kollu */
  const jant = new THREE.Group();
  const halka = new THREE.Mesh(new THREE.RingGeometry(R - 5.5, R - 3, 36), M.jant); jant.add(halka);
  const gobek = silindir(3.4, 2, M.jant, 16); gobek.rotation.x = Math.PI / 2; jant.add(gobek);
  for (let i = 0; i < 4; i++) { const kol = kutu(R - 6, 2.4, 1.2, M.jant); kol.position.set(Math.cos(i * Math.PI / 2) * (R - 6) / 2, Math.sin(i * Math.PI / 2) * (R - 6) / 2, 0); kol.rotation.z = i * Math.PI / 2; jant.add(kol); }
  jant.position.z = TEKER_EN / 2 - 0.4; g.add(jant);
  return golgeli(g);
}

/** Mikro redüktörlü motor (N20 tipi) + manyetik enkoder kartı; mili +Z'ye (tekere) bakar */
function motor(): THREE.Group {
  const g = new THREE.Group();
  g.add(kutu(10, 12, 9, M.disli, 0, 0, 4.5));             // dişli kutusu
  const govde = silindir(5.5, 15, M.motor, 18); govde.rotation.x = Math.PI / 2; govde.position.z = -7.5; g.add(govde);
  g.add(kutu(11, 13, 1.2, M.nano, 0, 0, -15.6));          // enkoder kartı
  const miknatis = silindir(3, 1.6, M.siyah, 14); miknatis.rotation.x = Math.PI / 2; miknatis.position.z = -17; g.add(miknatis);
  return golgeli(g);
}

/** Kızılötesi sensör çifti: verici (şeffaf mavi) ve alıcı (siyah); +X yönüne bakar */
function irCift(): THREE.Group {
  const g = new THREE.Group();
  for (const [z, m] of [[-3, M.irLed], [3, M.irAlici]] as const) {
    const gov = silindir(1.5, 5.5, m, 14); gov.rotation.z = -Math.PI / 2; gov.position.set(2.8, 0, z); g.add(gov);
    const bas = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m); bas.rotation.z = -Math.PI / 2; bas.position.set(5.5, 0, z); g.add(bas);
  }
  g.add(kutu(2, 6, 11, M.siyah, -0.5, -1, 0));            // ayırıcı / bacak tutucu
  return golgeli(g);
}

export interface RizbotModeli {
  kok: THREE.Group;
  /** tekerleri ilerlemeye göre döndür (mm) */
  tekerleriDondur(sol: number, sag: number): void;
  /** fan dönüşü (radyan/sn); 0 durur */
  fanHizi: number;
  guncelle(dt: number): void;
  /** üstteki durum ledi: "hazir" mavi, "bitti" yeşil, "hata" kırmızı */
  led(durum: "hazir" | "bitti" | "hata"): void;
  /** sensör ışınlarının robot içindeki çıkış noktaları ve yönleri (mm) */
  sensorler: Record<"on" | "sol" | "sag", { x: number; z: number; yon: number }[]>;
}

export function rizbot(): RizbotModeli {
  const ic = new THREE.Group();
  const kart = anaKart(); kart.position.y = 6; ic.add(golgeli(kart));
  /* tekerler ve motorlar */
  const tekerler: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const t = teker(); t.position.set(TEKER_X, R, s * TEKER_Z); if (s < 0) t.rotation.y = Math.PI; ic.add(t); tekerler.push(t);
    const m = motor(); m.position.set(TEKER_X, R, s * 28); if (s < 0) m.rotation.y = Math.PI; ic.add(m);
    ic.add(golgeli(kutu(12, 8, 3, M.siyah, TEKER_X, 10, s * 34)));      // motor tutucu
  }
  /* vakum fanı: kartın altında etek, üstte gövde ve dönen pervane */
  const etek = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 4.4, 36, 1, true), M.fan); etek.position.set(22, 3.6, 0); ic.add(golgeli(etek));
  const fanGovde = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 15.5, 9, 32, 1, true), M.fan); fanGovde.position.set(22, 12.2, 0); ic.add(golgeli(fanGovde));
  const fanHalka = new THREE.Mesh(new THREE.RingGeometry(13.6, 15.5, 32), M.fan); fanHalka.rotation.x = -Math.PI / 2; fanHalka.position.set(22, 16.7, 0); ic.add(fanHalka);
  const pervane = new THREE.Group(); pervane.position.set(22, 13, 0);
  const merkez = silindir(4.5, 5, M.siyah, 16); pervane.add(merkez);
  for (let i = 0; i < 7; i++) { const k = kutu(9, 0.8, 4, M.fan); const a = i / 7 * Math.PI * 2; k.position.set(Math.cos(a) * 8.6, 0, Math.sin(a) * 8.6); k.rotation.set(0.45, -a, 0); pervane.add(k); }
  ic.add(golgeli(pervane));
  for (const a of [0.6, 2.2, 3.8, 5.4]) ic.add(golgeli(kutu(3, 9, 3, M.fan, 22 + Math.cos(a) * 16.5, 12, Math.sin(a) * 16.5)));
  /* 2S LiPo arkada, üstünde Arduino Nano */
  const pil = new THREE.Group(); pil.add(kutu(30, 11, 44, M.pil)); pil.add(kutu(0.3, 7, 20, M.pilEtiket, -15.2, 0, 0));
  pil.position.set(-38, 13.4, 0); ic.add(golgeli(pil));
  for (const [x, z] of [[-52, -8], [-52, 8], [-24, -8], [-24, 8]]) ic.add(golgeli(kutu(2.5, 14, 2.5, M.siyah, x, 15, z)));
  const nano = new THREE.Group();
  nano.add(kutu(43, 1.6, 18, M.nano));
  nano.add(kutu(7, 1.2, 7, M.cip, 2, 1.4, 0));
  nano.add(kutu(8, 4, 7.6, M.usb, -19.5, 2.6, 0));
  for (const z of [-7.6, 7.6]) nano.add(kutu(38, 2.4, 2.4, M.siyah, 0, 2, z));    // pin başlıkları
  nano.add(kutu(3, 1.4, 2, M.serigrafi, 14, 1.4, -4));                            // reset düğmesi
  nano.position.set(-38, 22.8, 0); ic.add(golgeli(nano));
  /* pil kabloları ve JST */
  const kablo = (n: [number, number, number][], m: THREE.Material) => { const e = new THREE.CatmullRomCurve3(n.map((p) => new THREE.Vector3(...p))); const t = new THREE.Mesh(new THREE.TubeGeometry(e, 20, 0.9, 6), m); t.castShadow = true; ic.add(t); };
  kablo([[-23, 14, 14], [-16, 18, 18], [-10, 11, 20]], M.kablo);
  kablo([[-23, 14, 16], [-15, 17, 21], [-9, 11, 22]], M.kabloS);
  ic.add(golgeli(kutu(6, 5, 8, M.jst, -7, 10, 21)));
  /* ön sensörler: burunda ileri bakan iki çift, yanlarda dışa bakan iki çift */
  const sensorler: RizbotModeli["sensorler"] = { on: [], sol: [], sag: [] };
  for (const s of [-1, 1]) {
    const on = irCift(); on.position.set(60, 12, s * 15); ic.add(on);
    sensorler.on.push({ x: 66, z: s * 15, yon: 0 });
    const yan = irCift(); yan.position.set(44, 12, s * 26); yan.rotation.y = -s * Math.PI / 2; ic.add(yan);
    sensorler[s < 0 ? "sol" : "sag"].push({ x: 44, z: s * 32, yon: s < 0 ? Math.PI / 2 : -Math.PI / 2 });
  }
  /* burun altında kayar pabuç, üstte durum ledi ve anahtar */
  const pabuc = new THREE.Mesh(new THREE.SphereGeometry(4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.jst); pabuc.rotation.x = Math.PI; pabuc.position.set(50, 5.6, 0); ic.add(pabuc);
  const ledM = new THREE.MeshStandardMaterial({ color: 0x3aa0ff, emissive: 0x3aa0ff, emissiveIntensity: 1.6, roughness: 0.3 });
  ic.add(kutu(3.2, 1.6, 2, ledM, 2, 8.4, -24));
  ic.add(golgeli(kutu(7, 4, 4, M.siyah, -8, 9.6, -20)));
  for (const x of [-4, 0, 4]) ic.add(kutu(2, 0.2, 1, M.serigrafi, x + 38, 7.7, 0));

  const kok = new THREE.Group(); kok.add(ic); kok.scale.setScalar(0.001);
  const model: RizbotModeli = {
    kok, sensorler, fanHizi: 0,
    tekerleriDondur(sol, sag) { tekerler[0].rotation.z = sol / R; tekerler[1].rotation.z = -sag / R; },
    guncelle(dt) { pervane.rotation.y += model.fanHizi * dt; },
    led(d) { const r = d === "bitti" ? 0x2bd47a : d === "hata" ? 0xe0262e : 0x3aa0ff; ledM.color.setHex(r); ledM.emissive.setHex(r); }
  };
  return model;
}
