/* Kenshin fizik deneme sayfası: lab/#vitrin/kenshin-fizik
   Gerçek 3D fizikte (Rapier) sürülen bir Kenshin. Karşısında üç senaryodan biri: 470 g'lık kutu, duvara dayalı kutu ya da
   duran ikinci bir Kenshin. Klavyede ok tuşları, dokunmatikte iki motor sürgüsü (sol / sağ teker).
   Ekranda: hız, teker devirleri, her tekerin zemine bastığı kuvvet ve karşıdaki cismin kalkışı. */
import * as THREE from "three";
import { el } from "@sra/tasarim";
import { Studyo } from "./studyo";
import { kenshin } from "./kenshin";

type Senaryo = "kutu" | "duvar" | "rakip";
const SENARYOLAR: [Senaryo, string][] = [["kutu", "Kutu"], ["duvar", "Duvara dayalı kutu"], ["rakip", "Rakip Kenshin"]];
const STIL = `
.kf-panel{position:fixed;left:12px;top:12px;z-index:5;width:min(330px,calc(100vw - 24px));background:rgba(255,255,255,.94);border-radius:var(--sra-kose);padding:14px 16px;font:14px/1.45 var(--sra-yazi);color:var(--sra-murekkep);box-shadow:var(--sra-golge-ust)}
.kf-panel h1{font-size:16px;margin:0 0 2px}
.kf-panel p{margin:0 0 10px;color:var(--sra-murekkep-2);font-size:12.5px}
.kf-senaryo{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.kf-senaryo button[aria-pressed=true]{background:var(--sra-murekkep);color:#fff;border-color:var(--sra-murekkep)}
.kf-olcu{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center;font-variant-numeric:tabular-nums}
.kf-olcu dt{color:var(--sra-murekkep-2);font-size:12.5px}
.kf-olcu dd{margin:0;font-weight:600}
.kf-yuk{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.kf-yuk div{font-size:12px;color:var(--sra-murekkep-2)}
.kf-cubuk{height:8px;border-radius:4px;background:var(--sra-cizgi);overflow:hidden;margin-top:3px}
.kf-cubuk i{display:block;height:100%;width:0;background:var(--sra-bilgi);border-radius:4px;transition:width 80ms linear}
.kf-cubuk i.az{background:var(--sra-vurgu)}
.kf-ipucu{margin-top:10px;font-size:12px;color:var(--sra-murekkep-3)}
.kf-surgu{position:fixed;bottom:18px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:6px;font:600 12px var(--sra-yazi);color:var(--sra-murekkep);background:rgba(255,255,255,.88);border-radius:var(--sra-kose);padding:10px 8px;box-shadow:var(--sra-golge)}
.kf-surgu input{writing-mode:vertical-lr;direction:rtl;height:min(150px,26vh);width:44px;accent-color:var(--sra-vurgu);touch-action:none}
.kf-surgu.sol{left:12px}.kf-surgu.sag{right:12px}
@media (min-width:900px) and (hover:hover){.kf-surgu{display:none}}
@media (max-width:600px){.kf-panel{padding:10px 12px;font-size:13px}.kf-panel p,.kf-ipucu{display:none}.kf-yuk{margin-top:6px}}
`;

export async function kenshinFizik(root: HTMLElement) {
  document.head.append(el("style", "", {}, STIL));
  const kap = el("div", "", { style: "position:fixed;inset:0" });
  const deger = (id: string) => el("dd", "", { id }, "–");
  const hiz = deger("kf-hiz"), devir = deger("kf-devir"), hedef = deger("kf-hedef"), hedefAd = el("dt", "", {}, "Kutu kalkışı");
  const cubuk = (id: string) => { const i = el("i", "", { id }); return { kap: el("div", "kf-cubuk", {}, i), i }; };
  const sol = cubuk("kf-yuk-sol"), sag = cubuk("kf-yuk-sag");
  const solYazi = el("span", "", {}, "–"), sagYazi = el("span", "", {}, "–");
  const senaryo = el("div", "kf-senaryo", { role: "group", "aria-label": "Senaryo" });
  const panel = el("section", "kf-panel", { "aria-label": "Kenshin fizik denemesi" },
    el("h1", "", {}, "Kenshin · gerçek fizik"),
    el("p", "", {}, "470 g, 800 rpm motorlar, 49° çelik bıçak. Tekerin itme gücü zemine bastığı kuvvetle sınırlı: kaldırılan robotun tekerleri kayar."),
    senaryo,
    el("dl", "kf-olcu", {}, el("dt", "", {}, "Hız"), hiz, el("dt", "", {}, "Teker devri"), devir, hedefAd, hedef),
    el("div", "kf-yuk", {},
      el("div", "", {}, "Sol teker yükü ", solYazi, sol.kap),
      el("div", "", {}, "Sağ teker yükü ", sagYazi, sag.kap)),
    el("div", "kf-ipucu", {}, "Ok tuşları: sür · R: baştan"));
  const surgu = (taraf: "sol" | "sag", ad: string) => {
    const g = el("input", "", { type: "range", min: "-100", max: "100", value: "0", step: "1", "aria-label": ad + " motor gücü", id: "kf-surgu-" + taraf });
    const sifirla = () => { g.value = "0"; };
    g.addEventListener("pointerup", sifirla); g.addEventListener("pointercancel", sifirla); g.addEventListener("blur", sifirla);
    return { kap: el("label", "kf-surgu " + taraf, {}, ad, g), g };
  };
  const sSol = surgu("sol", "Sol"), sSag = surgu("sag", "Sağ");
  root.replaceChildren(kap, panel, sSol.kap, sSag.kap);

  const { Dunya, MALZEME } = await import("@sra/fizik");
  const { KenshinFizik } = await import("@sra/fizik/kenshin");
  type DunyaT = InstanceType<typeof Dunya>;
  type Govde = ReturnType<DunyaT["hareketli"]>;

  const s = new Studyo(kap);
  s.sahne.background = new THREE.Color(0xdfe3e9);
  /* kamera: yandan ve alçaktan (bıçağın altına girişi ve kalkış görünsün); dik ekranda biraz daha uzaktan */
  const uzak = innerWidth < innerHeight ? 1.5 : 1;
  s.kontrol.target.set(-0.06, 0.02, 0);
  s.kamera.position.set(-0.06 - 0.16 * uzak, 0.17 * uzak, 0.46 * uzak);
  s.kamera.near = 0.01; s.kamera.updateProjectionMatrix();
  const gk = s.gunes.shadow.camera; gk.left = gk.bottom = -0.5; gk.right = gk.top = 0.5; gk.updateProjectionMatrix();
  s.golgeyiTasi(new THREE.Vector3(0, 0, 0));

  /* ring: 77 cm siyah daire, beyaz kenar çizgisi; ring dışı açık gri zemin (düşme kuralları C3'te) */
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.004, 96), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.85 }));
  ring.position.y = -0.002; ring.receiveShadow = true; s.sahne.add(ring);
  const kenar = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.385, 96), new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.6 }));
  kenar.rotation.x = -Math.PI / 2; kenar.position.y = 0.0003; kenar.receiveShadow = true; s.sahne.add(kenar);

  const robot = kenshin(0xd7262e); robot.bayraklar(0); s.sahne.add(robot.kok);
  const rakipModel = kenshin(0x2b6fd6); rakipModel.bayraklar(0); s.sahne.add(rakipModel.kok);
  const kutuMat = new THREE.MeshStandardMaterial({ color: 0xf0a020, roughness: 0.55 });
  const kutuMesh = new THREE.Group();
  const govdeM = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.1), kutuMat); govdeM.position.y = 0.02; kutuMesh.add(govdeM);
  for (const [x, z] of AYAKLAR) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.008), new THREE.MeshStandardMaterial({ color: 0x2a2b30 })); a.position.set(x, -0.0015, z); kutuMesh.add(a); }
  kutuMesh.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  s.sahne.add(kutuMesh);
  const duvarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.1, 0.4), new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 0.7 }));
  duvarMesh.castShadow = duvarMesh.receiveShadow = true; s.sahne.add(duvarMesh);

  let d: DunyaT | undefined, ken: InstanceType<typeof KenshinFizik>, rakip: InstanceType<typeof KenshinFizik> | undefined;
  let kutu: Govde | undefined, aktif: Senaryo = "kutu", kutuY0 = 0, rakipYuk0 = 0, enKalkis = 0, enAzRakip = Infinity;
  const kur = async (sn: Senaryo) => {
    aktif = sn;
    for (const b of senaryo.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.senaryo === sn));
    d?.yokEt();
    const dd = d = await Dunya.kur();
    const zemin = dd.sabit();
    dd.kutu(zemin, { x: 2, y: 0.01, z: 2 }, MALZEME.ring, undefined, { x: 0, y: -0.01, z: 0 });
    ken = new KenshinFizik(dd, { x: -0.16, z: 0 });
    rakip = undefined; kutu = undefined;
    if (sn === "rakip") rakip = new KenshinFizik(dd, { x: 0.06, z: 0 }, 0);
    else {
      kutu = dd.hareketli({ x: 0.04, y: 0.003, z: 0 });
      dd.kutu(kutu, { x: 0.05, y: 0.02, z: 0.05 }, MALZEME.plastik, 0, { x: 0, y: 0.02, z: 0 });
      for (const [x, z] of AYAKLAR) dd.kutu(kutu, { x: 0.004, y: 0.0015, z: 0.004 }, MALZEME.plastik, 0, { x, y: -0.0015, z });
      dd.kutleAyarla(kutu, 0.47, { x: 0, y: 0.02, z: 0 }, { x: 0.1, y: 0.04, z: 0.1 });
      if (sn === "duvar") { const w = dd.sabit({ x: 0.1, y: 0.05, z: 0 }); dd.kutu(w, { x: 0.005, y: 0.05, z: 0.2 }, MALZEME.plastik); }
    }
    duvarMesh.visible = sn === "duvar"; duvarMesh.position.set(0.1, 0.05, 0);
    kutuMesh.visible = sn !== "rakip"; rakipModel.kok.visible = sn === "rakip";
    hedefAd.textContent = sn === "rakip" ? "Rakip tekerleri" : "Kutu kalkışı";
    /* yerleşsin, sonra başlangıç değerleri */
    dd.zamanIlerle(0.4, undefined, 200);
    kutuY0 = kutu?.translation().y ?? 0;
    rakipYuk0 = rakip ? rakip.tekerYuku().reduce((a, b) => a + b) : 0;
    enKalkis = 0; enAzRakip = rakipYuk0;
    yerlestir();
  };
  for (const [sn, ad] of SENARYOLAR) {
    const b = el("button", "sra-dugme sra-dugme--ikincil sra-dugme--kucuk", { type: "button", "data-senaryo": sn, "aria-pressed": "false" }, ad);
    b.addEventListener("click", () => { void kur(sn); b.blur(); });
    senaryo.append(b);
  }

  /* klavye: ↑ ileri, ↓ geri, ← → dönüş; ikisi birlikte yay çizer */
  const basili = new Set<string>();
  addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") { void kur(aktif); return; }
    if (!e.key.startsWith("Arrow")) return;
    e.preventDefault(); basili.add(e.key);
  });
  addEventListener("keyup", (e) => basili.delete(e.key));
  addEventListener("blur", () => basili.clear());
  const komut = (): [number, number] => {
    const ileri = (basili.has("ArrowUp") ? 1 : 0) - (basili.has("ArrowDown") ? 1 : 0);
    const don = (basili.has("ArrowRight") ? 1 : 0) - (basili.has("ArrowLeft") ? 1 : 0);
    if (ileri || don) {
      if (!ileri) return [don, -don];
      return [ileri * (don > 0 ? 1 : 1 - 0.6 * Math.abs(don)), ileri * (don < 0 ? 1 : 1 - 0.6 * Math.abs(don))];
    }
    return [Number(sSol.g.value) / 100, Number(sSag.g.value) / 100];
  };

  const q = new THREE.Quaternion();
  const poz = (o: THREE.Object3D, g: { translation(): { x: number; y: number; z: number }; rotation(): { x: number; y: number; z: number; w: number } }) => {
    const p = g.translation(), r = g.rotation(); o.position.set(p.x, p.y, p.z); o.quaternion.copy(q.set(r.x, r.y, r.z, r.w));
  };
  const yerlestir = () => {
    poz(robot.kok, ken.govde); robot.tekerleriDondur(ken.tekerAcisi[0] * 15, ken.tekerAcisi[1] * 15);
    if (rakip) { poz(rakipModel.kok, rakip.govde); rakipModel.tekerleriDondur(rakip.tekerAcisi[0] * 15, rakip.tekerAcisi[1] * 15); }
    if (kutu) poz(kutuMesh, kutu);
  };

  const hedefNokta = new THREE.Vector3();
  let sonYazim = -1;
  await kur("kutu");
  s.guncelle = (dt, t) => {
    if (!d) return;
    const [a, b] = komut();
    ken.surus(a, b);
    d.zamanIlerle(dt);
    yerlestir();
    /* kamera robotu yumuşakça izler */
    const p = ken.konum;
    hedefNokta.set(p.x + 0.04, 0.02, p.z);
    const fark = hedefNokta.clone().sub(s.kontrol.target).multiplyScalar(Math.min(1, dt * 3));
    s.kontrol.target.add(fark); s.kamera.position.add(fark);
    s.golgeyiTasi(new THREE.Vector3(p.x, 0, p.z));
    if (t - sonYazim < 0.1) return;
    sonYazim = t;
    const [yl, yr] = ken.tekerYuku(), [dl, dr] = ken.devir;
    hiz.textContent = `${ken.hiz.toFixed(2)} m/s`;
    devir.textContent = `${Math.round(dl)} · ${Math.round(dr)} rpm`;
    solYazi.textContent = `${yl.toFixed(2)} N`; sagYazi.textContent = `${yr.toFixed(2)} N`;
    const olcek = 3.5; // N: çubuğun dolu olduğu yük
    for (const [c, y] of [[sol.i, yl], [sag.i, yr]] as const) { c.style.width = `${Math.min(100, (y / olcek) * 100)}%`; c.classList.toggle("az", y < 0.6); }
    if (rakip) {
      const y = rakip.tekerYuku().reduce((x, z) => x + z);
      enAzRakip = Math.min(enAzRakip, y);
      hedef.textContent = `${y.toFixed(2)} / ${rakipYuk0.toFixed(2)} N · en az ${enAzRakip.toFixed(2)}`;
    } else if (kutu) {
      const kalkis = (kutu.translation().y - kutuY0) * 1000, r = kutu.rotation();
      const egim = (2 * Math.asin(Math.min(1, Math.hypot(r.x, r.z))) * 180) / Math.PI;
      enKalkis = Math.max(enKalkis, kalkis);
      hedef.textContent = `${Math.max(0, kalkis).toFixed(1)} mm · ${egim.toFixed(1)}° · en çok ${enKalkis.toFixed(1)} mm`;
    }
    document.body.dataset.hazir = "1";
  };
}

/** kutunun ayakları: duvar tarafındakiler köşede, robota bakanlar 35 mm içeride; ön kenar yerden 3 mm yukarıda boşta */
const AYAKLAR: [number, number][] = [[0.045, -0.045], [0.045, 0.045], [-0.015, -0.045], [-0.015, 0.045]];
