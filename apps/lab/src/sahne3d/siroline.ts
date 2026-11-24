/* SiroLine Full PCB: akademinin sınıfta kullandığı çizgi izleyen robot, kodla modellenmiş.
   Ölçüler akademideki robottan dijital kumpasla: teker çapı 36,1 · iki teker arası 99,2 · arka gövde 94,1 ·
   boyun 28,0 · ön kenar 81,1 · motor 63,0 · pil 45,6 mm. Diğer ölçüler üstten fotoğraftan orantıyla.
   Robotun kendi ekseni: +X ileri, +Y yukarı, +Z sağ. Aks merkezi (0, 0, 0) zeminde, tekerlek ekseninin altında.
   Çizimde kullanılan düzlem ölçüsü: X yanal (sağ +), Y ileri, arka kenardan (aks Y = 12'de). */
import * as THREE from "three";
import { SIROLINE } from "@sra/robot-motoru";

const R_TEKER = SIROLINE.tekerCap / 2;           // 18
const IZ = SIROLINE.izGenisligi / 2;             // 62,5
const TEKER_EN = 26;
const AKS_Y = 12;                                // aksın arka kenardan uzaklığı
const PCB_KAL = 1.6;
const PCB_ALT = R_TEKER - 11.25 - PCB_KAL;       // motor gövdesi kartın üstünde, mili teker ekseninde
const PCB_UST = PCB_ALT + PCB_KAL;
export const SENSOR_X = SIROLINE.sensorOnde;     // 154

/** düzlem ölçüsü (X yanal, Y ileri) → robot ekseninde ileri */
const ileri = (Y: number) => Y - AKS_Y;

/* ---------- malzemeler ---------- */
const M = {
  motorMavi: new THREE.MeshStandardMaterial({ color: 0x2eaaea, roughness: 0.55 }),
  motorMaviKoyu: new THREE.MeshStandardMaterial({ color: 0x2593cc, roughness: 0.6 }),
  baskiBeyaz: new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.55 }),
  jant: new THREE.MeshStandardMaterial({ color: 0xe0161e, roughness: 0.45 }),
  jantIc: new THREE.MeshStandardMaterial({ color: 0x5a0a0d, roughness: 0.8 }),
  lastik: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.97 }),
  pcbKenar: new THREE.MeshStandardMaterial({ color: 0x8a8a55, roughness: 0.7 }),
  pcbAlt: new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.6 }),
  pcbKirmizi: new THREE.MeshStandardMaterial({ color: 0xd2202e, roughness: 0.5 }),
  pcbMavi: new THREE.MeshStandardMaterial({ color: 0x1f6fc2, roughness: 0.45 }),
  pcbSiyah: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.55 }),
  altin: new THREE.MeshStandardMaterial({ color: 0xd7b25a, roughness: 0.3, metalness: 1 }),
  gumus: new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.28, metalness: 1 }),
  celik: new THREE.MeshStandardMaterial({ color: 0xa3a8b0, roughness: 0.32, metalness: 1 }),
  plastikSiyah: new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.6 }),
  plastikBeyaz: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 }),
  entegre: new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.4 }),
  pembe: new THREE.MeshStandardMaterial({ color: 0xe8336d, roughness: 0.45 }),
  sari: new THREE.MeshStandardMaterial({ color: 0xf5b301, roughness: 0.5 }),
  kondansator: new THREE.MeshStandardMaterial({ color: 0xb9bdc3, roughness: 0.3, metalness: 0.8 }),
  seffaf: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.55, clearcoat: 1 }),
  kabloKirmizi: new THREE.MeshStandardMaterial({ color: 0xd4232b, roughness: 0.45 }),
  kabloSiyah: new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.45 }),
  ledBeyaz: new THREE.MeshStandardMaterial({ color: 0xf6efe0, roughness: 0.3, emissive: 0x000000 }),
};

function kutu(w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, yuvarla = 0): THREE.Mesh {
  const g = yuvarla > 0 ? yuvarlakKutu(w, h, d, yuvarla) : new THREE.BoxGeometry(w, h, d);
  const k = new THREE.Mesh(g, m); k.position.set(x, y, z); return k;
}
/** Kenarları yuvarlatılmış kutu (3D baskı ve plastik parçalar için). w: x, h: y, d: z */
function yuvarlakKutu(w: number, h: number, d: number, r: number) {
  const s = new THREE.Shape(); const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - r * 0.8, bevelEnabled: true, bevelThickness: r * 0.4, bevelSize: r * 0.4, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(h - r * 0.8) / 2); g.rotateX(-Math.PI / 2);
  return g;
}
function silindir(r: number, uz: number, m: THREE.Material, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, uz, seg), m); }
function golgeli<T extends THREE.Object3D>(o: T): T { o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }
/** Düzlem ölçüsüyle bir nesneyi yerleştirir. X, üstten çekilmiş fotoğraftaki gibi ölçülür
    (robotun önü aşağıda; fotoğrafın solu = robotun sağı), bu yüzden robot ekseninde z = -X. */
function koy<T extends THREE.Object3D>(o: T, X: number, Y: number, y: number): T { o.position.set(ileri(Y), y, -X); return o; }

/** Küçük kartların üst yüzü için baskı dokusu */
function baskiDokusu(w: number, d: number, taban: string, ciz: (c: CanvasRenderingContext2D, o: number) => void) {
  const o = 10, cv = document.createElement("canvas"); cv.width = Math.round(w * o); cv.height = Math.round(d * o);
  const c = cv.getContext("2d")!; c.fillStyle = taban; c.fillRect(0, 0, cv.width, cv.height); ciz(c, o);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const ustBaskili = (m: THREE.Material, doku: THREE.Texture) => [m, m, new THREE.MeshStandardMaterial({ map: doku, roughness: 0.45 }), m, m, m];

/* ---------- ana kart (gövde) ---------- */
type Komut = ["L", number, number] | ["Q", number, number, number, number];
/** Gövdenin sol yarısı (düzlem ölçüsü, arkadan öne). Sağ yarı aynası. */
const SOL_YARI: Komut[] = [
  ["L", -45, 0], ["Q", -47, 0, -47, 2],
  ["L", -47, 54],
  ["L", -39, 60],                     // kanat ile gövde arasındaki çentik
  ["L", -49.5, 61],                   // ilk tüyün ucu
  ["Q", -45, 82, -30, 93],            // kanadın dış kenarı öne ve içe kıvrılır
  ["Q", -19, 96, -14, 104],           // boyna yumuşak geçiş
  ["L", -14, 140],                    // boyun (28 mm)
  ["L", -33, 141],                    // ön plakanın arka kenarı (U'nun dibi)
  ["Q", -43, 139, -46, 127],          // kancanın iç kenarı
  ["Q", -45.5, 122, -44, 120.5],      // kanca ucu (içe ve geriye bakar)
  ["Q", -52, 120, -56, 126],
  ["Q", -60, 131, -59.5, 140],        // dış omuz
  ["L", -58, 151],
  ["L", -40.5, 172],                  // pah
  ["L", 0, 172]                       // ön kenarın ortası (81 mm'lik düz kenarın yarısı)
];
const son = (k: Komut): [number, number] => (k[0] === "L" ? [k[1], k[2]] : [k[3], k[4]]);

function govdeSekli(): THREE.Shape {
  const s = new THREE.Shape();
  const p = (X: number, Y: number) => [ileri(Y), X] as const; // Shape (x, y); döndürünce y → -z, yani z = -X
  s.moveTo(...p(0, 0));
  for (const k of SOL_YARI) { if (k[0] === "L") s.lineTo(...p(k[1], k[2])); else s.quadraticCurveTo(...p(k[1], k[2]), ...p(k[3], k[4])); }
  /* sağ yarı: aynı komutlar ters sırada, X'in işareti çevrilmiş */
  for (let i = SOL_YARI.length - 1; i >= 0; i--) {
    const k = SOL_YARI[i], [hx, hy] = i > 0 ? son(SOL_YARI[i - 1]) : [0, 0];
    if (k[0] === "L") s.lineTo(...p(-hx, hy)); else s.quadraticCurveTo(...p(-k[1], k[2]), ...p(-hx, hy));
  }
  /* delikler: QTR penceresi, pil kelepçesi yarıkları, vida delikleri, kanat yarıkları */
  const dortgen = (X0: number, Y0: number, X1: number, Y1: number) => { const h = new THREE.Path(); h.moveTo(...p(X0, Y0)); h.lineTo(...p(X0, Y1)); h.lineTo(...p(X1, Y1)); h.lineTo(...p(X1, Y0)); h.lineTo(...p(X0, Y0)); s.holes.push(h); };
  dortgen(-11.5, 157, 11.5, 169);
  for (const X of [-15, 12.6]) for (const Y of [9, 29]) dortgen(X, Y, X + 2.4, Y + 9);
  for (const [X, Y] of [[-40, 158], [40, 158], [-31, 162], [31, 162], [-6, 130], [6, 130]]) { const h = new THREE.Path(); h.absarc(...p(X, Y), 1.6, 0, Math.PI * 2, true); s.holes.push(h); }
  for (const yon of [-1, 1]) for (const [a, b] of [[[-45.4, 64.5], [-33, 79]], [[-42.2, 72.5], [-31.5, 85]]] as const) {
    /* kanat yarığı: dış kenara 0,6 mm kala biten ince kanal */
    const h = new THREE.Path(), w = 1.2;
    const x0 = a[0] * -yon, y0 = a[1], x1 = b[0] * -yon, y1 = b[1];
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * w, ny = dx / l * w;
    h.moveTo(...p(x0 + nx, y0 + ny)); h.lineTo(...p(x0 - nx, y0 - ny)); h.lineTo(...p(x1 - nx, y1 - ny)); h.lineTo(...p(x1 + nx, y1 + ny)); h.lineTo(...p(x0 + nx, y0 + ny));
    s.holes.push(h);
  }
  return s;
}

/** Kartın üst yüzü: siyah lehim maskesi, bakır yollar, beyaz yazılar, gümüş adalar. Logo yok. */
function kartDokusu() {
  const o = 8, X0 = -62, X1 = 62, Y0 = -2, Y1 = 175;
  const cv = document.createElement("canvas"); cv.width = (X1 - X0) * o; cv.height = (Y1 - Y0) * o;
  const c = cv.getContext("2d")!;
  /* doku robotun önü yukarıda, sağı sağda çizilir (yazılar böyle okunur): sütun = robotun sağı = -X */
  const px = (X: number) => (-X - X0) * o, py = (Y: number) => (Y1 - Y) * o;
  c.fillStyle = "#1a1d22"; c.fillRect(0, 0, cv.width, cv.height);
  /* bakır yollar (maskenin altında, hafif açık) */
  c.strokeStyle = "rgba(120,135,150,.24)"; c.lineCap = c.lineJoin = "round"; c.lineWidth = 0.5 * o;
  for (let i = 0; i < 8; i++) {
    const X = -5.6 + i * 1.6;
    c.beginPath(); c.moveTo(px(X), py(152)); c.lineTo(px(X), py(112)); c.lineTo(px(X * 1.6), py(104)); c.lineTo(px(X * 1.6), py(92)); c.stroke();
  }
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(px(s * 12), py(118)); c.lineTo(px(s * 12), py(141)); c.lineTo(px(s * 30), py(146)); c.lineTo(px(s * 48), py(146)); c.stroke();
    c.beginPath(); c.moveTo(px(s * 26), py(72)); c.lineTo(px(s * 34), py(66)); c.lineTo(px(s * 34), py(44)); c.stroke();
  }
  c.strokeStyle = "rgba(120,135,150,.16)"; c.lineWidth = 0.35 * o;
  c.beginPath(); c.moveTo(px(-44), py(3)); c.lineTo(px(-44), py(52)); c.moveTo(px(44), py(3)); c.lineTo(px(44), py(52)); c.stroke();
  /* beyaz baskılar */
  c.fillStyle = "rgba(240,240,235,.88)"; c.font = `600 ${2.1 * o}px monospace`; c.textAlign = "center";
  const yaz = (m: string, X: number, Y: number, a = 0) => { c.save(); c.translate(px(X), py(Y)); c.rotate(a); c.fillText(m, 0, 0); c.restore(); };
  yaz("GND-5V-D7", -31, 4); yaz("GND-5V-D8", 31, 4); yaz("POWER", -4, 52); yaz("ON-OFF", 14, 52);
  yaz("TB6612FNG1", 10, 72.5); yaz("LED", -46, 141); yaz("LED", 46, 141); yaz("D12-D2", -36, 79, -Math.PI / 2); yaz("330R", -14, 94); yaz("100nF", 22, 94);
  yaz("D4-5V-GND", 0, 134.5); yaz("QTR-8A", 0, 171);
  c.strokeStyle = "rgba(240,240,235,.85)"; c.lineWidth = 0.3 * o;
  const cerceve = (Xa: number, Ya: number, Xb: number, Yb: number) => c.strokeRect(Math.min(px(Xa), px(Xb)), py(Math.max(Ya, Yb)), Math.abs(px(Xb) - px(Xa)), Math.abs(py(Yb) - py(Ya)));
  cerceve(-21, 74, 21, 92);
  cerceve(-20.3, 50.4, -0.2, 70.5); cerceve(0.5, 50.4, 20.6, 70.5);
  /* gümüş adalar */
  c.fillStyle = "#c9ccd2";
  const ada = (X: number, Y: number, r = 0.85) => { c.beginPath(); c.arc(px(X), py(Y), r * o, 0, 7); c.fill(); };
  for (const X of [-36.5, -34, -31.5, 31.5, 34, 36.5]) ada(X, 2.2, 0.95);
  for (let i = 0; i < 8; i++) ada(-8.9 + i * 2.54, 153.5);
  for (let i = 0; i < 4; i++) ada(-3.8 + i * 2.54, 136.5);
  const doku = new THREE.CanvasTexture(cv); doku.colorSpace = THREE.SRGBColorSpace; doku.anisotropy = 8;
  return { doku, X0, X1, Y0, Y1 };
}

function anaKart(): THREE.Mesh {
  const g = new THREE.ExtrudeGeometry(govdeSekli(), { depth: PCB_KAL, bevelEnabled: false, curveSegments: 16 });
  g.rotateX(-Math.PI / 2);
  /* UV: düzlem ölçüsünden dokunun 0–1 aralığına (üst yüz) */
  const { doku, X0, X1, Y0, Y1 } = kartDokusu();
  const poz = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < poz.count; i++) uv.setXY(i, (poz.getZ(i) - X0) / (X1 - X0), (poz.getX(i) + AKS_Y - Y0) / (Y1 - Y0));
  const ust = new THREE.MeshStandardMaterial({ map: doku, roughness: 0.62, metalness: 0.05 });
  const k = new THREE.Mesh(g, [ust, M.pcbKenar]);
  k.position.y = PCB_ALT;
  return golgeli(k);
}

/* ---------- tekerlek: kırmızı jant, siyah köpük lastik ---------- */
function tekerlek(): THREE.Group {
  const g = new THREE.Group();
  const ic = 12.6, dis = R_TEKER, yar = TEKER_EN / 2, r = 2.2;
  const pr: THREE.Vector2[] = [new THREE.Vector2(ic, -yar)];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; pr.push(new THREE.Vector2(dis - r + Math.cos(a) * r, -yar + r + Math.sin(a) * r)); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pr.push(new THREE.Vector2(dis - r + Math.cos(a) * r, yar - r + Math.sin(a) * r)); }
  pr.push(new THREE.Vector2(ic, yar));
  const lastikG = new THREE.LatheGeometry(pr, 64); lastikG.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(lastikG, M.lastik));
  /* jant yüzü: 5 trapez pencere, ortada mil deliği */
  const jant = new THREE.Shape(); jant.absarc(0, 0, ic + 0.4, 0, Math.PI * 2, false);
  for (let k = 0; k < 5; k++) {
    const a0 = k * Math.PI * 2 / 5 + 0.22, a1 = (k + 1) * Math.PI * 2 / 5 - 0.22, ri = 4.4, ro = 10.6;
    const h = new THREE.Path();
    h.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
    h.lineTo(Math.cos(a0 - 0.1) * ro, Math.sin(a0 - 0.1) * ro);
    h.absarc(0, 0, ro, a0 - 0.1, a1 + 0.1, false);
    h.lineTo(Math.cos(a1) * ri, Math.sin(a1) * ri);
    h.absarc(0, 0, ri, a1, a0, true);
    jant.holes.push(h);
  }
  const milDelik = new THREE.Path(); milDelik.absarc(0, 0, 1.7, 0, Math.PI * 2, true); jant.holes.push(milDelik);
  const jantG = new THREE.ExtrudeGeometry(jant, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 40 });
  const yuz = new THREE.Mesh(jantG, M.jant); yuz.position.z = yar - 4.3; g.add(yuz);
  const halka = new THREE.Mesh(new THREE.CylinderGeometry(ic, ic, TEKER_EN - 3, 48, 1, true), M.jant); halka.rotation.x = Math.PI / 2; g.add(halka);
  const icDisk = new THREE.Mesh(new THREE.CylinderGeometry(ic, ic, 1, 40), M.jantIc); icDisk.rotation.x = Math.PI / 2; icDisk.position.z = -yar + 5; g.add(icDisk);
  const gobek = silindir(4.2, TEKER_EN - 7, M.jant, 24); gobek.rotation.x = Math.PI / 2; g.add(gobek);
  const flans = new THREE.Mesh(new THREE.CylinderGeometry(ic + 1.6, ic + 1.6, 1.4, 48), M.jant); flans.rotation.x = Math.PI / 2; flans.position.z = -yar + 0.2; g.add(flans);
  return golgeli(g);
}

/* ---------- TT redüktörlü motor (mavi), beyaz kelepçe ---------- */
function ttMotor(sag: boolean): THREE.Group {
  const g = new THREE.Group(); // mil (0,0,0)'da, gövde +X yönünde uzanır; dış yüz +z
  g.add(kutu(37, 22.5, 18.8, M.motorMavi, 7.5, 0, 0, 2.4));
  g.add(kutu(8, 19, 19.2, M.motorMaviKoyu, 27, 0, 0, 1.6));
  g.add(kutu(7, 7, 18.8, M.motorMavi, -12.5, -1, 0, 1.4));
  g.add(kutu(3, 4, 3, M.motorMavi, 14, 1, 10.6, 0.8));
  for (const [x, y] of [[-2, -7], [17, 7]]) { const v = silindir(1.6, 1, M.celik, 12); v.rotation.x = Math.PI / 2; v.position.set(x, y, 9.9); g.add(v); }
  const can = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 9.6, 19, 32), M.gumus); can.rotation.z = Math.PI / 2; can.scale.set(1, 1, 0.78); can.position.set(40.5, 0, 0); g.add(can);
  const kapak = new THREE.Mesh(new THREE.CylinderGeometry(8.8, 8.8, 3, 32), M.plastikBeyaz); kapak.rotation.z = Math.PI / 2; kapak.scale.set(1, 1, 0.78); kapak.position.set(51.5, 0, 0); g.add(kapak);
  for (const y of [-4, 4]) g.add(kutu(1.6, 2.4, 0.6, M.altin, 53.3, y, 0));
  const mil = silindir(2.7, 30, M.plastikBeyaz, 6); mil.rotation.x = Math.PI / 2; mil.position.z = 6; g.add(mil);
  if (!sag) g.scale.z = -1;
  return golgeli(g);
}
/** Beyaz 3D baskı kelepçe: motoru karta iki vidayla bağlar */
function kelepce(): THREE.Group {
  const g = new THREE.Group();
  g.add(kutu(13, 21, 9, M.baskiBeyaz, 0, 10.5, 0, 1.2));
  g.add(kutu(13, 3.5, 14, M.baskiBeyaz, 0, 1.75, 0, 1));
  for (const x of [-3.2, 3.2]) { const v = silindir(2.2, 1.6, M.celik, 6); v.position.set(x, 21.6, 0); g.add(v); const s = silindir(1.2, 1.2, M.celik, 10); s.position.set(x, 22.6, 0); g.add(s); }
  return golgeli(g);
}

/* ---------- elektronik ---------- */
function pinSirasi(n: number, aralik: number, m: THREE.Material, uz = 6, ekse: "x" | "z" = "x"): THREE.InstancedMesh {
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, uz, 0.64), m, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { const d = (i - (n - 1) / 2) * aralik; o.position.set(ekse === "x" ? d : 0, 0, ekse === "z" ? d : 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  return im;
}

/** Arduino Nano: mavi kart; uzun kenarı yana (USB sola bakar), dişi başlıklar üstünde */
function nano(): THREE.Group {
  const g = new THREE.Group();
  const doku = baskiDokusu(43.2, 18, "#1f6fc2", (c, o) => {
    c.fillStyle = "rgba(235,210,120,.95)";
    for (let i = 0; i < 15; i++) for (const yy of [1.3, 16.7]) { c.beginPath(); c.arc(o * (3.4 + i * 2.54), o * yy, o * 0.8, 0, 7); c.fill(); }
    c.fillStyle = "rgba(255,255,255,.9)"; c.font = `600 ${1.5 * o}px monospace`;
    ["D13", "3V3", "REF", "A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"].forEach((m, i) => c.fillText(m, o * (2.6 + i * 2.54), o * 15));
    ["D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4"].forEach((m, i) => c.fillText(m, o * (2.6 + i * 2.54), o * 4.2));
    c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = o * 0.2; c.strokeRect(o * 18, o * 5.5, o * 10, o * 7);
  });
  const ust = new THREE.Group();
  ust.add(new THREE.Mesh(new THREE.BoxGeometry(43.2, 1.6, 18), ustBaskili(M.pcbMavi, doku)));
  const ic = kutu(7, 1.2, 7, M.entegre, 2, 1.4, 0); ic.rotation.y = Math.PI / 4; ust.add(ic);
  ust.add(kutu(9, 4, 7.6, M.gumus, -19.3, 2.8, 0));
  ust.add(kutu(3.4, 1.2, 2.2, M.gumus, 10, 1.4, -4));
  ust.add(kutu(3, 1.4, 3, M.plastikBeyaz, -9, 1.5, 3));
  for (const z of [-2, 0.5, 3]) ust.add(kutu(1.6, 0.8, 1, M.plastikBeyaz, 13 + z, 1.2, -4.5));
  const icsp = new THREE.Group(); icsp.add(kutu(5.1, 2.5, 7.6, M.plastikSiyah, 0, 1.25, 0));
  for (const z of [-2.54, 0, 2.54]) { const p = pinSirasi(2, 2.54, M.altin, 6); p.position.set(0, 4, z); icsp.add(p); }
  icsp.position.set(18.5, 0.8, 0); ust.add(icsp);
  ust.position.y = 9.3;
  g.add(ust);
  for (const z of [-7.62, 7.62]) g.add(kutu(38, 8.5, 2.6, M.plastikSiyah, 0, 4.25, z));
  g.rotation.y = Math.PI / 2; // kartın +x'i robotun -z'si: USB sola
  return golgeli(g);
}

/** TB6612FNG kırmızı sürücü kartı (20,3 mm kare), pin başlıkları üstünde */
function surucu(): THREE.Group {
  const g = new THREE.Group();
  const doku = baskiDokusu(20.3, 20.3, "#d2202e", (c, o) => {
    c.fillStyle = "rgba(225,225,230,.95)";
    for (let i = 0; i < 8; i++) for (const xx of [1.4, 18.9]) { c.beginPath(); c.arc(o * xx, o * (1.4 + i * 2.54), o * 0.85, 0, 7); c.fill(); }
    c.fillStyle = "rgba(255,255,255,.9)"; c.font = `600 ${1.7 * o}px sans-serif`; c.textAlign = "center";
    c.fillText("TB6612FNG", o * 10.15, o * 17.4); c.fillText("Breakout", o * 10.15, o * 19.2);
  });
  const ust = new THREE.Group();
  ust.add(new THREE.Mesh(new THREE.BoxGeometry(20.3, 1.6, 20.3), ustBaskili(M.pcbKirmizi, doku)));
  ust.add(kutu(6.4, 1.2, 5, M.entegre, 0, 1.4, -1));
  ust.add(kutu(3.2, 1.6, 2.6, M.sari, -4.5, 1.6, -6.5));
  ust.position.y = 9.3; ust.rotation.y = Math.PI / 2; g.add(ust);
  for (const z of [-8.9, 8.9]) { g.add(kutu(20.3, 8.5, 2.6, M.plastikSiyah, 0, 4.25, z)); const p = pinSirasi(8, 2.54, M.gumus, 3, "x"); p.position.set(0, 11.4, z); g.add(p); }
  return golgeli(g);
}

function kondansator(): THREE.Group {
  const g = new THREE.Group();
  g.add(kutu(6.8, 1.4, 6.8, M.plastikSiyah, 0, 0.7, 0));
  const k = silindir(3.15, 7.7, M.kondansator, 24); k.position.y = 5.2; g.add(k);
  const u = silindir(2.6, 0.2, M.celik, 24); u.position.y = 9.1; g.add(u);
  return golgeli(g);
}
function jst2(): THREE.Group { const g = new THREE.Group(); g.add(kutu(7.5, 6, 5.8, M.plastikBeyaz, 0, 3, 0, 0.6)); return golgeli(g); }

/** QTR-8A: kırmızı kart, ön plakanın altında; üstte 8 pinli siyah başlık, pencereden görünür. Kartın uzun kenarı yana. */
function qtr(): THREE.Group {
  const g = new THREE.Group();
  const doku = baskiDokusu(13, 75, "#d2202e", (c, o) => {
    c.fillStyle = "rgba(240,240,240,.9)"; c.font = `600 ${2 * o}px monospace`; c.textAlign = "center";
    for (let i = 0; i < 8; i++) c.fillText(String(i + 1), o * 9.5, o * (37.5 + (i - 3.5) * 2.54) + o * 0.7);
    c.strokeStyle = "rgba(240,240,240,.8)"; c.lineWidth = o * 0.3;
    for (const zz of [28, 47]) { c.beginPath(); c.moveTo(o * 5, o * zz); c.lineTo(o * 10, o * zz); c.moveTo(o * 7.5, o * (zz - 2.5)); c.lineTo(o * 7.5, o * (zz + 2.5)); c.stroke(); }
  });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(13, 1.6, 75), ustBaskili(M.pcbKirmizi, doku)));
  for (let i = 0; i < 8; i++) g.add(kutu(3.2, 1.4, 6, M.entegre, 2, -1.5, (i - 3.5) * SIROLINE.sensorAralik));
  const b = new THREE.Group();
  b.add(kutu(2.6, 8.5, 20.3, M.plastikSiyah, 0, 4.25, 0));
  const p = pinSirasi(8, 2.54, M.altin, 11, "z"); p.position.set(1.6, 6, 0); b.add(p);
  b.position.set(-3.4, 0.8, 0); g.add(b);
  return golgeli(g);
}

/** Boyun ucundaki engel sensörü: başlangıçta önüne blok konur, kaldırılınca robot kalkar (kitte "Mz80" bloğu, D4) */
function onModul(): THREE.Group {
  const g = new THREE.Group();
  g.add(kutu(2.6, 7, 10.2, M.plastikSiyah, 0, 3.5, 0));
  g.add(kutu(1.6, 17, 13, M.pcbSiyah, 1.6, 15, 0));
  g.add(kutu(1.4, 2.2, 3.4, M.entegre, 2.8, 17, -3)); g.add(kutu(1.2, 1.2, 2, M.sari, 2.7, 13, 3));
  const p = pinSirasi(4, 2.54, M.altin, 9, "z"); p.position.set(-0.2, 6, 0); g.add(p);
  const led = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 6, 20), M.seffaf); led.rotation.z = Math.PI / 2; led.position.set(4.8, 10, 0); g.add(led);
  const ledUc = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.seffaf); ledUc.rotation.z = -Math.PI / 2; ledUc.position.set(7.8, 10, 0); g.add(ledUc);
  return golgeli(g);
}

/** LiPo pil: gümüş zarf, etiket, siyah kablo bağı. Uzun kenarı ileri doğru. */
function pil(): THREE.Group {
  const g = new THREE.Group();
  const doku = baskiDokusu(45.6, 17, "#c4c7cc", (c, o) => {
    c.fillStyle = "#f2f2f0"; c.fillRect(o * 6, o * 2, o * 30, o * 13);
    c.fillStyle = "#555"; for (let i = 0; i < 6; i++) c.fillRect(o * 8, o * (4 + i * 1.6), o * (14 + (i % 3) * 4), o * 0.6);
    c.fillStyle = "#e3a11a"; c.fillRect(o * 27, o * 5, o * 5, o * 5);
  });
  g.add(golgeli(new THREE.Mesh(yuvarlakKutu(45.6, 9, 17, 1.6), new THREE.MeshStandardMaterial({ map: doku, roughness: 0.35, metalness: 0.5 }))));
  g.add(golgeli(kutu(4, 9.8, 18.2, M.plastikSiyah, 2, 0, 0)));
  return g;
}

function kablo(noktalar: [number, number, number][], m: THREE.Material, r = 0.75): THREE.Mesh {
  const e = new THREE.CatmullRomCurve3(noktalar.map((p) => new THREE.Vector3(...p)));
  const k = new THREE.Mesh(new THREE.TubeGeometry(e, 48, r, 8, false), m); k.castShadow = true; return k;
}
/** düzlem ölçüsündeki noktalardan kablo: [X, Y, karttan yükseklik] */
const kabloD = (n: [number, number, number][], m: THREE.Material, r = 0.75) => kablo(n.map(([X, Y, h]) => [ileri(Y), PCB_UST + h, -X]), m, r);

/* ---------- robot ---------- */
/** Kurulum rehberinin adımlarına göre parça grupları */
export const PARCALAR = ["sasi", "sensor", "motor", "teker", "surucu", "nano", "pil", "kablo", "modul"] as const;
export type ParcaAdi = (typeof PARCALAR)[number];

export interface SiroLineModeli {
  kok: THREE.Group;
  parcalar: Record<ParcaAdi, THREE.Group>;
  /** sol ve sağ tekerleği gidilen yola göre döndürür (mm) */
  tekerleriDondur(solMm: number, sagMm: number): void;
  /** robot çalışırken öndeki iki beyaz LED yanar */
  ledler(degerler: number[]): void;
}

export function siroline(): SiroLineModeli {
  const ic = new THREE.Group();
  const P = Object.fromEntries(PARCALAR.map((a) => { const g = new THREE.Group(); g.name = a; ic.add(g); return [a, g]; })) as Record<ParcaAdi, THREE.Group>;

  /* 1 · ana kart; karta lehimli küçük parçalar; vidalar */
  P.sasi.add(anaKart());
  for (const [X, Y] of [[-40, 158], [40, 158]]) P.sasi.add(golgeli(koy(silindir(2.8, 1.6, M.celik, 16), X, Y, PCB_UST + 0.8)));
  for (const [X, Y] of [[-31, 162], [31, 162]]) P.sasi.add(golgeli(koy(silindir(2.6, 1.8, M.celik, 6), X, Y, PCB_UST + 0.9)));
  const ledler: THREE.MeshStandardMaterial[] = [];
  for (const X of [-46, 46]) { const m = M.ledBeyaz.clone(); ledler.push(m); P.sasi.add(koy(kutu(3.2, 0.9, 1.6, m), X, 144, PCB_UST + 0.45)); }
  P.sasi.add(koy(kondansator(), -21, 152, PCB_UST));
  P.sasi.add(koy(kondansator(), -27, 67, PCB_UST));
  P.sasi.add(koy(kondansator(), 27, 66, PCB_UST));
  P.sasi.add(koy(jst2(), -26, 58, PCB_UST)); P.sasi.add(koy(jst2(), 27, 57.5, PCB_UST));
  const dip = new THREE.Group(); dip.add(kutu(10, 4, 6.4, M.pembe, 0, 2, 0, 0.5)); for (const z of [-1.3, 1.3]) dip.add(kutu(2.4, 1, 1.6, M.plastikBeyaz, -1.5, 4.2, z));
  dip.rotation.y = Math.PI / 2; P.sasi.add(golgeli(koy(dip, -29, 82, PCB_UST)));
  for (const [X, Y] of [[-14, 96], [22, 96], [-8, 50], [8, 50], [-38, 30], [38, 30]]) P.sasi.add(koy(kutu(2, 0.6, 1.25, M.entegre), X, Y, PCB_UST + 0.3));

  /* 2 · QTR-8A ön plakanın hemen altında; başlığı pencereden yukarı çıkar */
  P.sensor.add(koy(qtr(), 0, AKS_Y + SENSOR_X - 2, PCB_ALT - 0.85));

  /* 3-4 · motorlar, kelepçeler, tekerlekler */
  const tekerler: THREE.Group[] = [];
  for (const sag of [false, true]) {
    const zs = sag ? 1 : -1;
    const mot = ttMotor(sag); mot.position.set(-1, R_TEKER, zs * 37.6); P.motor.add(mot);
    P.motor.add(koy(kelepce(), zs * 24.5, 30, PCB_UST));
    const t = tekerlek(); t.position.set(0, R_TEKER, zs * IZ); if (!sag) t.rotation.y = Math.PI; P.teker.add(t); tekerler.push(t);
  }

  /* 5 · iki TB6612FNG sürücü */
  for (const X of [-10.2, 10.6]) P.surucu.add(koy(surucu(), X, 60.5, PCB_UST));
  P.surucu.add(koy(jst2(), -10.2, 66.5, PCB_UST + 11));

  /* 6 · Arduino Nano */
  P.nano.add(koy(nano(), 0, 83, PCB_UST));

  /* 7 · LiPo pil ve XT30 */
  P.pil.add(koy(pil(), -1, 25, PCB_UST + 4.5));
  const xt = new THREE.Group(); xt.add(kutu(10, 5, 6, M.sari, 0, 2.5, 0, 0.8)); xt.add(kutu(4, 4, 5, M.sari, 6, 2.5, 0, 0.6));
  xt.rotation.y = -Math.PI / 2.4; P.pil.add(golgeli(koy(xt, 10, 50, PCB_UST + 8)));

  /* 8 · kablolar: pil → XT30 → güç girişi; motorlar → beyaz JST soketler */
  P.kablo.add(kabloD([[3, 47, 9], [7, 52, 13], [10, 50, 12]], M.kabloKirmizi, 0.9));
  P.kablo.add(kabloD([[1, 47, 8], [5, 53, 11], [8.5, 50.5, 10]], M.kabloSiyah, 0.9));
  P.kablo.add(kabloD([[13, 51, 10], [17, 46, 18], [15, 40, 10], [8, 44, 4]], M.kabloKirmizi, 0.9));
  P.kablo.add(kabloD([[12, 51, 9], [18, 45, 16], [16, 39, 8], [6, 44, 3]], M.kabloSiyah, 0.9));
  for (const zs of [-1, 1]) {
    const X0 = zs * 37.6, Xj = zs * 26.5;
    P.kablo.add(kabloD([[X0 - zs * 3, 64.5, 9], [X0 - zs * 6, 68, 12], [Xj, 62, 9], [Xj, 58, 5]], M.kabloKirmizi, 0.75));
    P.kablo.add(kabloD([[X0 + zs * 2, 64.5, 9], [X0 - zs * 3, 69, 7], [Xj + zs * 2, 61, 7], [Xj + zs * 1.5, 58, 5]], M.kabloSiyah, 0.75));
  }

  /* 9 · boyun ucundaki modül */
  P.modul.add(koy(onModul(), 0, 136.5, PCB_UST));

  const kok = new THREE.Group(); kok.add(ic); kok.scale.setScalar(0.001); // mm → metre

  return {
    kok, parcalar: P,
    tekerleriDondur(solMm, sagMm) {
      tekerler[0].rotation.z = solMm / R_TEKER;
      tekerler[1].rotation.z = -sagMm / R_TEKER;
    },
    ledler(d) {
      const acik = d.some((v) => v > 0);
      for (const m of ledler) { m.emissive.setRGB(acik ? 1 : 0, acik ? 0.95 : 0, acik ? 0.85 : 0); m.emissiveIntensity = acik ? 1.6 : 0; }
    }
  };
}
