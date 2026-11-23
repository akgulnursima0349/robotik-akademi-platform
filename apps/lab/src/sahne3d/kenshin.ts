/* Kenshin: akademinin mini sumo robotu, kodla modellenmiş (ürün fotoğraflarından; ölçü: 10 × 10 cm).
   Robotun ekseni: +X ileri, +Y yukarı, +Z sağ; orijin robotun ortası, zeminde. Birim milimetre, kök 0,001 ölçekli. */
import * as THREE from "three";
import { KENSHIN } from "@sra/robot-motoru";

const R = KENSHIN.tekerCap / 2;
const M = {
  celik: new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.32, metalness: 0.95 }),
  siyahCelik: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.55, metalness: 0.35 }),
  sari: new THREE.MeshStandardMaterial({ color: 0xf2bb12, roughness: 0.4 }),
  pencere: new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.3 }),
  pcbYesil: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.5 }),
  pcbMavi: new THREE.MeshStandardMaterial({ color: 0x1f6fc2, roughness: 0.45 }),
  mor: new THREE.MeshStandardMaterial({ color: 0x8a2f7a, roughness: 0.45 }),
  mavi: new THREE.MeshStandardMaterial({ color: 0x1f4fd8, roughness: 0.45 }),
  siyah: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.6 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.92 }),
  jant: new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.4 }),
  bayrak: new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.7 }),
  gri: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.5 }),
  kabloK: new THREE.MeshStandardMaterial({ color: 0xd4232b, roughness: 0.45 }),
  kabloT: new THREE.MeshStandardMaterial({ color: 0xf08c1a, roughness: 0.45 })
};

function kutu(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); return k; }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }

/** Yan plaka: önde alçak (bıçak), arkada yüksek, üst kenarı dişli */
function yanPlaka(): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(50, 1); s.lineTo(4, 44); s.lineTo(-6, 44); s.lineTo(-6, 48); s.lineTo(-14, 48); s.lineTo(-14, 44);
  s.lineTo(-30, 44); s.lineTo(-30, 50); s.lineTo(-40, 50); s.lineTo(-40, 44); s.lineTo(-50, 44); s.lineTo(-50, 22);
  /* tekerlek oyuğu */
  s.lineTo(-44, 22); s.absarc(-22, R + 1, R + 3, Math.PI, 0, true); s.lineTo(0, 1); s.lineTo(50, 1);
  const g = new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: false, curveSegments: 20 });
  return new THREE.Mesh(g, M.siyahCelik);
}

/** Eğimli çelik bıçak: 3 sensör penceresi, alt kenarda sarı şerit, üstte iki kulak */
function bicak(): THREE.Group {
  const g = new THREE.Group();
  const uz = Math.hypot(46, 43), aci = Math.atan2(43, 46); // (50,1) → (4,44)
  const s = new THREE.Shape();
  s.moveTo(-50, 0); s.lineTo(50, 0); s.lineTo(50, uz); s.lineTo(44, uz); s.lineTo(44, uz + 6); s.lineTo(34, uz + 6); s.lineTo(34, uz);
  s.lineTo(-34, uz); s.lineTo(-34, uz + 6); s.lineTo(-44, uz + 6); s.lineTo(-44, uz); s.lineTo(-50, uz); s.lineTo(-50, 0);
  for (const [z, w, h] of [[-25, 20, 11], [0, 12, 9], [25, 20, 11]]) {
    const p = new THREE.Path(), y0 = 20;
    p.moveTo(z - w / 2, y0); p.lineTo(z - w / 2, y0 + h); p.lineTo(z + w / 2, y0 + h); p.lineTo(z + w / 2, y0); p.lineTo(z - w / 2, y0);
    s.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false });
  const plaka = new THREE.Mesh(geo, M.celik);
  /* sensör gözleri pencerelerin arkasında */
  for (const [z, w] of [[-25, 16], [0, 9], [25, 16]]) { const k = kutu(w, 7, 6, M.pencere, z, 25.5, -4); plaka.add(k); for (const dz of [-w / 4, w / 4]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2, 12), M.siyah); l.rotation.x = Math.PI / 2; l.position.set(z + dz, 25.5, -1); plaka.add(l); } }
  const serit = kutu(100, 8, 0.4, M.sari, 0, 4, 1.7); plaka.add(serit);
  /* plaka XY'de (x yanal, y eğim boyunca) çizildi → robota yerleştir: yanal = z, eğim boyunca yukarı-geri */
  plaka.rotation.order = "YXZ";
  plaka.rotation.y = Math.PI / 2;
  plaka.rotation.x = -(Math.PI / 2 - aci);
  plaka.position.set(50, 1, 0);
  g.add(plaka);
  return g;
}

function tekerlek(): THREE.Group {
  const g = new THREE.Group(), en = 14;
  const lastik = new THREE.Mesh(new THREE.CylinderGeometry(R, R, en, 40, 1, true), M.lastik); lastik.rotation.x = Math.PI / 2; g.add(lastik);
  const jant = new THREE.Shape(); jant.absarc(0, 0, R - 2.5, 0, Math.PI * 2, false);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, h = new THREE.Path(); h.absarc(Math.cos(a) * 7.5, Math.sin(a) * 7.5, 2.4, 0, Math.PI * 2, true); jant.holes.push(h); }
  const mh = new THREE.Path(); mh.absarc(0, 0, 1.5, 0, Math.PI * 2, true); jant.holes.push(mh);
  const jg = new THREE.ExtrudeGeometry(jant, { depth: 3, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 32 });
  const j = new THREE.Mesh(jg, M.jant); j.position.z = en / 2 - 3.2; g.add(j);
  const yan = new THREE.Mesh(new THREE.RingGeometry(R - 2.5, R, 40), M.lastik); yan.position.z = en / 2; g.add(yan);
  const ic = new THREE.Mesh(new THREE.CircleGeometry(R, 40), M.siyah); ic.position.z = -en / 2; ic.rotation.y = Math.PI; g.add(ic);
  return golgeli(g);
}

/** Bayrak: siyah çubuk ucunda beyaz kürek, ortasında renkli şerit (takım rengi) */
function bayrak(renk: number): THREE.Group {
  const g = new THREE.Group();
  const cubuk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 50, 8), M.siyah); cubuk.position.y = 25; g.add(cubuk);
  const s = new THREE.Shape(); const w = 26, h = 82, r = 6;
  s.moveTo(-w / 2 + r, 0); s.lineTo(w / 2 - r, 0); s.quadraticCurveTo(w / 2, 0, w / 2, r); s.lineTo(w / 2, h - r); s.quadraticCurveTo(w / 2, h, w / 2 - r, h);
  s.lineTo(-w / 2 + r, h); s.quadraticCurveTo(-w / 2, h, -w / 2, h - r); s.lineTo(-w / 2, r); s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  /* levha: ince kalınlıklı, iki yüzü de ışık alır; ortada takım renginde şerit (iki yüzde) */
  const levhaG = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false, curveSegments: 6 }); levhaG.translate(0, 0, -0.4);
  const levha = new THREE.Mesh(levhaG, M.bayrak); levha.position.y = 46; levha.rotation.y = Math.PI / 2; g.add(levha);
  const seritM = new THREE.MeshStandardMaterial({ color: renk, roughness: 0.5 });
  for (const yuz of [-0.45, 0.45]) { const serit = new THREE.Mesh(new THREE.BoxGeometry(0.1, h - 8, 5), seritM); serit.position.set(yuz, 46 + h / 2, 0); g.add(serit); }
  return golgeli(g);
}

export interface KenshinModeli { kok: THREE.Group; tekerleriDondur(sol: number, sag: number): void }

/** renk: bayrak şeridi (takım rengi) */
export function kenshin(renk = 0xd7262e): KenshinModeli {
  const ic = new THREE.Group();
  for (const z of [-50, 48]) { const p = golgeli(yanPlaka()); p.position.z = z; ic.add(p); }
  ic.add(golgeli(bicak()));
  /* taban plakası ve arka kapak */
  ic.add(golgeli(kutu(96, 2, 96, M.siyahCelik, 0, 2.5, 0)));
  ic.add(golgeli(kutu(2, 40, 96, M.siyahCelik, -49, 24, 0)));
  /* üst kart ve elektronik */
  ic.add(golgeli(kutu(52, 1.6, 92, M.pcbYesil, -22, 38, 0)));
  const nano = new THREE.Group(); nano.add(kutu(43, 1.6, 18, M.pcbMavi)); nano.add(kutu(7, 1.2, 7, M.siyah, 2, 1.4, 0)); nano.add(kutu(8, 3.5, 7.5, M.celik, -19, 2.4, 0));
  nano.rotation.y = Math.PI / 2; nano.position.set(-30, 42, 22); ic.add(golgeli(nano));
  ic.add(golgeli(kutu(12, 10, 12, M.mavi, -6, 44, 30)));          // mavi bileşen (fotoğraftaki)
  ic.add(golgeli(kutu(10, 14, 22, M.mor, -26, 46, 0)));           // bayrak mekanizması (mor kutu)
  ic.add(golgeli(kutu(14, 6, 26, M.siyah, -8, 42, -16)));         // motor sürücü
  const pil = kutu(40, 12, 30, M.siyah, -20, 13, 0); ic.add(golgeli(pil));
  /* kablolar */
  for (const [m, z] of [[M.kabloK, -26], [M.kabloT, -22]] as const) {
    const e = new THREE.CatmullRomCurve3([new THREE.Vector3(-8, 42, z), new THREE.Vector3(-14, 52, z + 6), new THREE.Vector3(-24, 50, z + 14), new THREE.Vector3(-26, 44, z + 18)]);
    const k = new THREE.Mesh(new THREE.TubeGeometry(e, 20, 0.8, 6), m); k.castShadow = true; ic.add(k);
  }
  /* bayraklar: V biçiminde */
  for (const s of [-1, 1]) { const b = bayrak(renk); b.position.set(-26, 52, s * 6); b.rotation.x = s * 0.36; b.rotation.z = -0.12; ic.add(b); }
  /* tekerlekler */
  const tekerler: THREE.Group[] = [];
  for (const s of [-1, 1]) { const t = tekerlek(); t.position.set(-22, R, s * 43); if (s < 0) t.rotation.y = Math.PI; ic.add(t); tekerler.push(t); }
  const kok = new THREE.Group(); kok.add(ic); kok.scale.setScalar(0.001);
  return {
    kok,
    tekerleriDondur(sol, sag) { tekerler[0].rotation.z = sol / R; tekerler[1].rotation.z = -sag / R; }
  };
}
