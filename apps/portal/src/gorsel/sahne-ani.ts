/* 3D sahne anı: dersin robotu (Lab'daki modelin aynısı) hazır bir açıdan, bir parçası vurgulu, isteğe bağlı küçük hareketle.
   3D kodu yalnız bu dosya yüklenince gelir (ders sayfası 3D'siz adımda yüklemez). WebGL yoksa anın açıklamasıyla sade bir kart. */
import * as THREE from "three";
import { el } from "@sra/tasarim/v2";
import type { SahneAni } from "@sra/mufredat";
import { Studyo, webglVar } from "@sra/sahne/studyo";
import { siroline } from "@sra/sahne/siroline";
import { kenshin } from "@sra/sahne/kenshin";
import { rizbot } from "@sra/sahne/rizbot";

export interface SahneOynatici { kap: HTMLElement; basaDon(): void; kapat(): void }

/** kamera açıları: [kamera konumu, bakılan nokta] robotun merkezine göre (metre; robot +x yönüne bakar) */
const ACILAR: Record<SahneAni["aci"], [[number, number, number], [number, number, number]]> = {
  onden: [[0.34, 0.15, 0.17], [0.1, 0.02, 0]],
  yandan: [[0.09, 0.14, 0.46], [0.09, 0.03, 0]],
  ustten: [[0.1, 0.52, 0.02], [0.09, 0, 0]],
  alttan: [[0.2, 0.3, 0.26], [0.1, 0.04, 0]],
  yakin: [[0.3, 0.09, 0.12], [0.15, 0.01, 0]]
};

/** Kenshin küçük (10 cm) ama bayrakları uzun: kamera biraz daha uzakta ve yukarıda */
const KENSHIN_ACILARI: Partial<typeof ACILAR> = {
  onden: [[0.36, 0.24, 0.26], [0.09, 0.03, 0]],
  yakin: [[0.28, 0.16, 0.18], [0.1, 0.03, 0]],
  yandan: [[0.12, 0.16, 0.4], [0.09, 0.03, 0]]
};

/** RizBot labirent hücresinde: duvarlar kadraja girsin diye biraz uzaktan ve yukarıdan */
const RIZBOT_ACILARI: Partial<typeof ACILAR> = {
  onden: [[0.33, 0.2, 0.22], [0.08, 0.03, 0]],
  ustten: [[0.07, 0.36, 0.12], [0.07, 0, 0]],
  yandan: [[0.1, 0.12, 0.34], [0.09, 0.03, 0]],
  yakin: [[0.24, 0.14, 0.12], [0.12, 0.04, 0]]
};

export function sahneAniKur(ad: string, an: SahneAni): SahneOynatici {
  const kap = el("figure", "sa", { style: "margin:0", "data-sahne": ad, role: "img", "aria-label": an.aciklama });
  if (!webglVar()) {
    /* önceden çizilmiş hâli (scripts/sahne-resimleri.mjs üretir) ve açıklaması */
    kap.classList.add("sa--yedek");
    kap.append(el("img", "", { src: `gorseller/${ad}.webp`, alt: "", width: "800", height: "600" }), el("figcaption", "", {}, an.aciklama));
    kap.dataset.hazir = "yedek";
    return { kap, basaDon() {}, kapat() {} };
  }
  const tuval = el("div", "sa-tuval");
  const etiket = an.vurgu ? el("span", "sa-etiket", { "aria-hidden": "true" }, an.vurgu.etiket) : null;
  const basa = el("button", "s2-dugme s2-dugme--kucuk sa-basa", { type: "button" }, "Baştaki açı");
  kap.append(tuval, ...(etiket ? [etiket] : []), basa);

  const s = new Studyo(tuval);
  s.sahne.background = new THREE.Color(0x2b2770);
  s.sahne.fog = null;
  s.kontrol.minDistance = 0.08;

  /* zemin */
  if (an.zemin === "bant" || an.zemin === "beyaz-bant") {
    const siyahZemin = an.zemin === "beyaz-bant";
    const kagit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.001, 0.3), new THREE.MeshStandardMaterial({ color: siyahZemin ? 0x1d1b19 : 0xf7f7f4, roughness: 0.9 }));
    kagit.position.set(0.05, 0.0005, 0); kagit.receiveShadow = true;
    const bant = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.0012, 0.019), new THREE.MeshStandardMaterial({ color: siyahZemin ? 0xf4f4f0 : 0x141414, roughness: 0.5 }));
    bant.position.set(0.05, 0.0011, 0); bant.receiveShadow = true;
    s.sahne.add(kagit, bant);
  }

  if (an.zemin === "ring") {
    /* 77 cm dohyo: siyah zemin, kenarında 2,5 cm beyaz çizgi; ortada kahverengi başlangıç çizgileri */
    const halka = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.001, 96), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.8 }));
    const ic = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.0012, 96), new THREE.MeshStandardMaterial({ color: 0x1d1b19, roughness: 0.6 }));
    halka.position.set(0.09, 0.0005, 0); ic.position.set(0.09, 0.0008, 0);
    halka.receiveShadow = ic.receiveShadow = true;
    s.sahne.add(halka, ic);
    for (const x of [-0.05, 0.05]) {
      const cizgi = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.0014, 0.1), new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 }));
      cizgi.position.set(0.09 + x, 0.0009, 0); s.sahne.add(cizgi);
    }
  }

  if (an.zemin === "labirent") {
    /* MEB hücresi (20 cm): siyah mat zemin, 8 cm yüksek 18 mm kalın beyaz duvarlar; robotun solunda ve önünde duvar, sağı açık */
    const zemin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.002, 0.7), new THREE.MeshStandardMaterial({ color: 0x1d1b19, roughness: 0.95 }));
    zemin.position.set(0.09, -0.001, 0); zemin.receiveShadow = true; s.sahne.add(zemin);
    const duvarM = new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.35 });
    const duvar = (x: number, z: number, uzX: number, uzZ: number) => {
      const d = new THREE.Mesh(new THREE.BoxGeometry(uzX, 0.08, uzZ), duvarM); d.position.set(0.09 + x, 0.04, z); d.castShadow = d.receiveShadow = true; s.sahne.add(d);
    };
    duvar(0.1, -0.1, 0.018, 0.218);     // ön
    duvar(-0.1, -0.1, 0.418, 0.018);    // sol (arka hücreye uzanır)
  }

  /* robot */
  let kok: THREE.Object3D, vurgulanan: THREE.Object3D | null = null;
  if (an.robot === "SiroLine") { const r = siroline(); kok = r.kok; if (an.vurgu) vurgulanan = (r.parcalar as Record<string, THREE.Group>)[an.vurgu.parca] ?? null; }
  else if (an.robot === "Kenshin") { const r = kenshin(); r.bayraklar(0); kok = r.kok; if (an.vurgu) vurgulanan = (r.parcalar as Record<string, THREE.Group>)[an.vurgu.parca] ?? null; }
  else { const r = rizbot(); kok = r.kok; if (an.vurgu) vurgulanan = (r.parcalar as Record<string, THREE.Group>)[an.vurgu.parca] ?? null; }
  const tasiyici = new THREE.Group(); tasiyici.add(kok); s.sahne.add(tasiyici);
  if (an.aci === "alttan") { tasiyici.rotation.x = Math.PI; tasiyici.position.y = 0.06; }
  /* Kenshin'in merkezi gövdesinin ortasında; kameralar SiroLine'a göre (merkez önde) ayarlı */
  if (an.robot === "Kenshin" || an.robot === "RizBot") tasiyici.position.x += 0.09;

  /* vurgu: parçanın malzemeleri kendine ait kopyalara geçer ve kırmızı parlar; öbür parçalar soluklaşır */
  const parlayan: THREE.MeshStandardMaterial[] = [];
  const vurguda = new Set<THREE.Object3D>();
  vurgulanan?.traverse((o) => vurguda.add(o));
  const gri = new THREE.Color(0xc9c6d6);
  if (vurgulanan) kok.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const ici = vurguda.has(m);
    const kopya = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => {
      const c = (x as THREE.MeshStandardMaterial).clone();
      if (ici) { c.emissive = new THREE.Color(0xe3262f); c.emissiveIntensity = 0.55; parlayan.push(c); }
      else if (c.color) { c.color.lerp(gri, 0.45); if ("envMapIntensity" in c) c.envMapIntensity *= 0.6; }
      return c;
    });
    m.material = Array.isArray(m.material) ? kopya : kopya[0];
  });

  const [kp, hd] = (an.robot === "Kenshin" ? KENSHIN_ACILARI[an.aci] : an.robot === "RizBot" ? RIZBOT_ACILARI[an.aci] : undefined) ?? ACILAR[an.aci];
  /* sönümleme kapatılıp açılır ki dönmenin artakalan hızı baştaki açıyı bozmasın */
  const basaDon = () => { s.kontrol.enableDamping = false; s.kontrol.update(); s.kamera.position.set(...kp); s.kontrol.target.set(...hd); s.kontrol.update(); s.kontrol.enableDamping = true; };
  basaDon();
  basa.addEventListener("click", basaDon);
  s.golgeyiTasi(new THREE.Vector3(0.09, 0, 0));

  const kutu = new THREE.Box3(), merkez = new THREE.Vector3();
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let bagliydi = false;
  s.guncelle = (_dt, t) => {
    /* ders sayfasından çıkıldıysa (kap belgeden düştü) döngüyü durdur */
    if (kap.isConnected) bagliydi = true; else if (bagliydi) { s.kapat(); return; }
    if (!azHareket) {
      if (an.hareket === "salinim") tasiyici.position.z = Math.sin(t * 0.9) * 0.03;
      if (an.hareket === "nabiz") for (const m of parlayan) m.emissiveIntensity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3));
    }
    if (etiket && vurgulanan) {
      kutu.setFromObject(vurgulanan).getCenter(merkez); merkez.project(s.kamera);
      const w = tuval.clientWidth, h = tuval.clientHeight;
      /* etiket çerçevenin içinde kalır */
      const ew = etiket.offsetWidth, x = Math.min(Math.max((merkez.x * 0.5 + 0.5) * w, ew / 2 + 6), w - ew / 2 - 6);
      const y = Math.min(Math.max((-merkez.y * 0.5 + 0.5) * h - 34, 6), h - 40);
      etiket.style.transform = `translate(${x - ew / 2}px, ${y}px)`;
      etiket.hidden = merkez.z > 1;
    }
    kap.dataset.hazir = "1";
    kap.dataset.kamera = s.kamera.position.toArray().map((v) => v.toFixed(3)).join(",");
  };
  return { kap, basaDon, kapat: () => s.kapat() };
}

export const SAHNE_STILI = `
.sa{position:relative;width:100%;height:100%;overflow:hidden;border-radius:inherit}
.sa-tuval{position:absolute;inset:0}
.sa-tuval canvas{width:100% !important;height:100% !important;display:block;touch-action:none}
.sa-etiket{position:absolute;left:0;top:0;padding:4px 10px;border-radius:999px;background:var(--sra2-sari);color:var(--sra2-murekkep);font:800 13px var(--sra2-yazi);white-space:nowrap;pointer-events:none;box-shadow:0 3px 0 var(--sra2-sari-taban)}
.sa-basa{position:absolute;right:10px;bottom:10px}
.sa--yedek img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sa--yedek figcaption{position:absolute;left:10px;right:10px;bottom:10px;padding:8px 12px;border-radius:12px;background:rgba(23,20,74,.82);color:#fff;font-weight:700;font-size:14px;line-height:1.35}
`;
