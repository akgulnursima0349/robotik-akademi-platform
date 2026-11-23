/* Yarışma halısı: beyaz zemin + 19 mm siyah bant ya da akademinin sınıf pisti gibi siyah zemin + beyaz bant. Çizgi, motorun kullandığı aynı pist örneklerinden çizilir.
   Motor (x, y) mm → sahne (x/1000, ·, -y/1000). */
import * as THREE from "three";
import { CIZGI_GENISLIGI, type Pist } from "@sra/robot-motoru";

export const HALI_KALINLIK = 0.003;

export function pistHalisi(pist: Pist): { kok: THREE.Group; iz: (x: number, y: number) => void; izSil: () => void } {
  const { x0, y0, x1, y1 } = pist.sinir;
  const w = x1 - x0, h = y1 - y0;
  const olcek = Math.min(1.6, 4096 / Math.max(w, h)); // piksel/mm
  const cv = document.createElement("canvas"); cv.width = Math.round(w * olcek); cv.height = Math.round(h * olcek);
  const c = cv.getContext("2d")!;
  const px = (x: number) => (x - x0) * olcek, py = (y: number) => (y1 - y) * olcek;

  const siyahZemin = pist.zemin === "siyah";
  const ZEMIN = siyahZemin ? "#1b1c1f" : "#f6f5f1", BANT = siyahZemin ? "#eeeeea" : "#141416";
  /* halı: belli belirsiz doku; siyah zeminde hafif çizikler */
  c.fillStyle = ZEMIN; c.fillRect(0, 0, cv.width, cv.height);
  const r = (s: number) => { s = Math.sin(s * 12.9898) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < 9000; i++) { c.fillStyle = siyahZemin ? `rgba(255,255,255,${0.01 + r(i) * 0.025})` : `rgba(0,0,0,${0.012 + r(i) * 0.02})`; c.fillRect(r(i + 1) * cv.width, r(i + 2) * cv.height, 1.5, 1.5); }

  /* siyah bant: kenarları hafif yumuşak */
  const yol = pist.yol;
  c.lineJoin = c.lineCap = "round";
  for (const [kal, renk] of [[CIZGI_GENISLIGI + 0.8, siyahZemin ? "rgba(238,238,234,.35)" : "rgba(20,20,22,.35)"], [CIZGI_GENISLIGI, BANT]] as const) {
    c.strokeStyle = renk; c.lineWidth = kal * olcek; c.beginPath();
    yol.forEach(([x, y], i) => (i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)))); c.closePath(); c.stroke();
  }
  /* bantta hafif parlama çizgileri */
  c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 3 * olcek; c.beginPath();
  yol.forEach(([x, y], i) => (i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)))); c.closePath(); c.stroke();

  /* başlangıç çizgisi: bandın iki yanında kısa dik işaretler */
  const [sx, sy] = yol[0], [tx, ty] = yol[6];
  const a = Math.atan2(ty - sy, tx - sx), nx = -Math.sin(a), ny = Math.cos(a);
  c.strokeStyle = BANT; c.lineWidth = 12 * olcek; c.lineCap = "butt";
  for (const s of [1, -1]) { c.beginPath(); c.moveTo(px(sx + nx * s * 34), py(sy + ny * s * 34)); c.lineTo(px(sx + nx * s * 90), py(sy + ny * s * 90)); c.stroke(); }

  const doku = new THREE.CanvasTexture(cv); doku.colorSpace = THREE.SRGBColorSpace; doku.anisotropy = 8;

  /* robotun geçtiği yolu gösteren ince iz (ayrı katman, şeffaf) */
  const izCv = document.createElement("canvas"); izCv.width = Math.round(cv.width / 2); izCv.height = Math.round(cv.height / 2);
  const ic = izCv.getContext("2d")!; ic.strokeStyle = "rgba(215,38,46,.85)"; ic.lineWidth = Math.max(2, 4 * olcek / 2); ic.lineCap = ic.lineJoin = "round";
  const izDoku = new THREE.CanvasTexture(izCv); izDoku.colorSpace = THREE.SRGBColorSpace;
  let onceki: [number, number] | null = null;

  const kok = new THREE.Group();
  const W = w / 1000, H = h / 1000, cx = (x0 + x1) / 2000, cz = -(y0 + y1) / 2000;
  const ustM = new THREE.MeshStandardMaterial({ map: doku, roughness: siyahZemin ? 0.7 : 0.82 });
  const yanM = new THREE.MeshStandardMaterial({ color: siyahZemin ? 0x2a2b2f : 0xe9e7e0, roughness: 0.9 });
  const hali = new THREE.Mesh(new THREE.BoxGeometry(W, HALI_KALINLIK, H), [yanM, yanM, ustM, yanM, yanM, yanM]);
  hali.position.set(cx, HALI_KALINLIK / 2, cz); hali.receiveShadow = true; kok.add(hali);
  const izKat = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: izDoku, transparent: true, depthWrite: false }));
  izKat.rotation.x = -Math.PI / 2; izKat.position.set(cx, HALI_KALINLIK + 0.0002, cz); kok.add(izKat);

  return {
    kok,
    iz(x, y) {
      const p: [number, number] = [px(x) / 2, py(y) / 2];
      if (onceki) { ic.beginPath(); ic.moveTo(...onceki); ic.lineTo(...p); ic.stroke(); izDoku.needsUpdate = true; }
      onceki = p;
    },
    izSil() { ic.clearRect(0, 0, izCv.width, izCv.height); onceki = null; izDoku.needsUpdate = true; }
  };
}
