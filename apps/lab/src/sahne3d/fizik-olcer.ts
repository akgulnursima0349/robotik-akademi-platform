/* Fizik hız ölçer (geliştirme ve kurs bilgisayarı ölçümü): lab/#vitrin/fizik
   Sumo ringi büyüklüğünde bir kapta N cisim (kutu, silindir, kama) düşer, çarpışır; düşenler yeniden bırakılır.
   Ekranda canlı: fizik adımı süresi (ms), kare hızı (fps), cisim sayısı, ekran kartı. Sonuç tek satır, kopyalanabilir. */
import * as THREE from "three";
import { el } from "@sra/tasarim";
import { Studyo } from "@sra/sahne/studyo";

const RENKLER = [0xe8262f, 0x2b6fd6, 0xffc21f, 0x2bb673, 0x8a5cf0, 0xf28c28];

export async function fizikOlcer(root: HTMLElement) {
  const kap = el("div", "", { style: "position:fixed;inset:0" });
  const panel = el("div", "", { style: "position:fixed;left:12px;top:12px;z-index:5;background:rgba(255,255,255,.92);border-radius:12px;padding:12px 14px;font:14px/1.5 var(--sra-yazi);box-shadow:0 6px 20px rgb(0 0 0/.15);max-width:min(420px,calc(100vw - 24px))" });
  const satirlar = el("div", "", { id: "fo-deger", "aria-live": "off" }, "Fizik yükleniyor…");
  const sonuc = el("code", "", { id: "fo-sonuc", style: "display:block;margin-top:8px;font:12px/1.4 var(--sra-yazi-kod);word-break:break-word" });
  const dugmeler = el("div", "", { style: "display:flex;gap:6px;flex-wrap:wrap;margin-top:8px" });
  panel.append(el("b", "", {}, "Fizik hız ölçümü"), satirlar, sonuc, dugmeler);
  root.replaceChildren(kap, panel);

  const { Dunya, MALZEME } = await import("@sra/fizik");
  const s = new Studyo(kap);
  s.sahne.background = new THREE.Color(0xdde1e7);
  s.kamera.position.set(0.9, 0.85, 1.1); s.kontrol.target.set(0, 0.05, 0);
  s.golgeyiTasi(new THREE.Vector3(0, 0, 0));
  const gk = s.gunes.shadow.camera; gk.left = gk.bottom = -0.7; gk.right = gk.top = 0.7; gk.updateProjectionMatrix();

  /* görünür ring: siyah daire ve beyaz kenar (77 cm çap) */
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.025, 64), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.85 }));
  ring.position.y = -0.0125; ring.receiveShadow = true; s.sahne.add(ring);
  const kenar = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.385, 64), new THREE.MeshStandardMaterial({ color: 0xf4f4f4 }));
  kenar.rotation.x = -Math.PI / 2; kenar.position.y = 0.0002; s.sahne.add(kenar);

  let d: InstanceType<typeof Dunya> | undefined;
  let cisimler: { govde: ReturnType<InstanceType<typeof Dunya>["hareketli"]>; mesh: THREE.Mesh }[] = [];
  const kur = async (n: number) => {
    for (const c of cisimler) { s.sahne.remove(c.mesh); c.mesh.geometry.dispose(); }
    cisimler = [];
    d?.yokEt();
    const dd = d = await Dunya.kur();
    /* zemin ve görünmez kap duvarı: cisimler ringde kalsın, düşenler yeniden bırakılır */
    const zemin = dd.sabit();
    dd.silindir(zemin, 0.0125, 0.385, MALZEME.ring, undefined, { x: 0, y: -0.0125, z: 0 });
    let tohum = 1;
    const rnd = () => ((tohum = (tohum * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const tur = i % 3, x = (rnd() - 0.5) * 0.5, z = (rnd() - 0.5) * 0.5, y = 0.1 + i * 0.025;
      const govde = dd.hareketli({ x, y, z });
      let geo: THREE.BufferGeometry;
      if (tur === 0) { dd.kutu(govde, { x: 0.03, y: 0.015, z: 0.025 }, MALZEME.plastik, 900); geo = new THREE.BoxGeometry(0.06, 0.03, 0.05); }
      else if (tur === 1) { dd.silindir(govde, 0.012, 0.018, MALZEME.lastik, 1100); geo = new THREE.CylinderGeometry(0.018, 0.018, 0.024, 20); }
      else { dd.kama(govde, 0.05, 0.05, 0.025, MALZEME.celik, 2000, { x: -0.025, y: -0.0125, z: 0 }); geo = kamaGeo(0.05, 0.05, 0.025); }
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RENKLER[i % RENKLER.length], roughness: 0.5, metalness: tur === 2 ? 0.6 : 0.05 }));
      mesh.castShadow = mesh.receiveShadow = true;
      s.sahne.add(mesh);
      cisimler.push({ govde, mesh });
    }
    /* cisimlere ara sıra rastgele bir itiş: sürekli çarpışma yükü (sumo benzeri) */
    dd.girdiUygula = (_dd, _g, adim) => {
      if (adim % 120 !== 0) return;
      for (const c of cisimler) {
        const p = c.govde.translation();
        if (p.y < -0.3) { c.govde.setTranslation({ x: (rnd() - 0.5) * 0.3, y: 0.3, z: (rnd() - 0.5) * 0.3 }, true); c.govde.setLinvel({ x: 0, y: 0, z: 0 }, true); continue; }
        c.govde.applyImpulse({ x: -p.x * 0.02 + (rnd() - 0.5) * 0.01, y: 0.002, z: -p.z * 0.02 + (rnd() - 0.5) * 0.01 }, true);
      }
    };
    kareler = []; adimSuresi = [];
  };

  let kareler: number[] = [], adimSuresi: number[] = [], n = 60;
  await kur(n);
  for (const sayi of [30, 60, 120]) {
    const b = el("button", "sra-dugme sra-dugme--ikincil sra-dugme--kucuk", { type: "button", "data-sayi": String(sayi) }, `${sayi} cisim`);
    b.addEventListener("click", async () => { n = sayi; await kur(n); });
    dugmeler.append(b);
  }
  const kopyala = el("button", "sra-dugme sra-dugme--kucuk", { type: "button" }, "Sonucu kopyala");
  kopyala.addEventListener("click", () => { void navigator.clipboard?.writeText(sonuc.textContent ?? ""); kopyala.textContent = "Kopyalandı"; });
  dugmeler.append(kopyala);

  const gl = s.renderer.getContext();
  const uzanti = gl.getExtension("WEBGL_debug_renderer_info");
  const ekranKarti = uzanti ? String(gl.getParameter(uzanti.UNMASKED_RENDERER_WEBGL)) : "bilinmiyor";
  const ort = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  let sonYazim = 0;
  const q = new THREE.Quaternion();
  s.guncelle = (dt, t) => {
    const t0 = performance.now();
    if (!d) return;
    const adim = d.zamanIlerle(dt);
    const fizikMs = performance.now() - t0;
    if (adim) adimSuresi.push(fizikMs / adim);
    for (const c of cisimler) {
      const p = c.govde.translation(), r = c.govde.rotation();
      c.mesh.position.set(p.x, p.y, p.z); c.mesh.quaternion.copy(q.set(r.x, r.y, r.z, r.w));
    }
    kareler.push(dt);
    if (kareler.length > 240) kareler.shift();
    if (adimSuresi.length > 960) adimSuresi.shift();
    if (t - sonYazim > 0.5 && kareler.length > 30) {
      sonYazim = t;
      const fps = 1 / ort(kareler), ms = ort(adimSuresi), kareBasiMs = ms * 4;
      satirlar.innerHTML = `Cisim: <b>${n}</b> · Fizik adımı: <b>${ms.toFixed(2)} ms</b> (1/240 sn) · Kare başına fizik: ${kareBasiMs.toFixed(1)} ms<br>Kare hızı: <b>${fps.toFixed(0)} fps</b> · Kalite: ${s.kalite} · Ekran kartı: ${ekranKarti}`;
      sonuc.textContent = `SRA fizik · ${n} cisim · adım ${ms.toFixed(2)} ms · ${fps.toFixed(0)} fps · kalite ${s.kalite} · ${ekranKarti} · ${innerWidth}×${innerHeight}@${devicePixelRatio}`;
      document.body.dataset.hazir = "1";
    }
  };
}

/** Kama görüntüsü (fizikteki kamayla aynı: taban x boyunca, uç +x) */
function kamaGeo(boy: number, en: number, yuk: number): THREE.BufferGeometry {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(boy, 0); s.lineTo(0, yuk); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: en, bevelEnabled: false });
  g.translate(-boy / 2, -yuk / 2, -en / 2);
  return g;
}
