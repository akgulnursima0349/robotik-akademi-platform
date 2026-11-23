/* Model inceleme sahnesi (geliştirme): #vitrin/<açı> */
import * as THREE from "three";
import { CIZGI_GOREVLERI, Pist } from "@sra/robot-motoru";
import { Studyo } from "./studyo";
import { siroline } from "./siroline";
import { pistHalisi, HALI_KALINLIK } from "./pist";

const ACILAR: Record<string, [number, number, number, number]> = {
  // kamera konumu (robot ekseninde, metre) ve hedef yüksekliği
  "on-sag": [0.42, 0.2, 0.3, 0.02], "yan": [0.08, 0.06, 0.42, 0.02], "ust": [0.09, 0.5, 0.001, 0], "arka": [-0.35, 0.22, -0.28, 0.02], "yakin": [0.2, 0.12, 0.2, 0.025], "on": [0.5, 0.08, 0.0, 0.02], "kapak": [0.36, 0.17, 0.27, 0.03], "foto": [-0.12, 0.17, -0.3, 0.01], "foto-ust": [0.1, 0.42, 0.0005, 0]
};
export function vitrin(root: HTMLElement, aci: string) {
  const kap = document.createElement("div"); kap.style.cssText = "position:fixed;inset:0"; root.replaceChildren(kap);
  const s = new Studyo(kap);
  const pist = new Pist(CIZGI_GOREVLERI[0].pist);
  s.sahne.add(pistHalisi(pist).kok);
  const r = siroline(); const b = pist.baslangic();
  r.kok.position.set(b.x / 1000 + 0.3, HALI_KALINLIK, -b.y / 1000); r.kok.rotation.y = b.yon;
  r.ledler([40, 60, 300, 900, 920, 200, 40, 50]);
  s.sahne.add(r.kok);
  const [x, y, z, hy] = ACILAR[aci] ?? ACILAR["on-sag"];
  const m = r.kok.position.clone();
  s.kamera.position.set(m.x + x, m.y + y, m.z + z); s.kontrol.target.set(m.x + 0.08, m.y + hy, m.z); s.kamera.fov = 30; s.kamera.updateProjectionMatrix();
  s.golgeyiTasi(new THREE.Vector3(m.x + 0.08, 0, m.z));
  setTimeout(() => document.body.dataset.hazir = "1", 1500);
}
