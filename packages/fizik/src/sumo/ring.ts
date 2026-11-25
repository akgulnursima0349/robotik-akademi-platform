/* Mini sumo ringi (dohyo) fizik dünyasında: ring, ring dışı zemin, düşme kuralı ve robotların sensörleri.
   - Ring: 77 cm çap, 2,5 cm yükseklik, 2,5 cm beyaz kenar. Üst kenar gerçek bir köşe; taşan robot devrilir ya da kayar.
   - Düşme: robotun herhangi bir parçası ring dışındaki zemine değerse ya da gövdesi ring üstünün 1 cm altına inerse.
   - Rakip sensörleri: robotun kendi parçalarını görmeyen ışınlar; yalnız başka bir robota çarpan ışın 1 okur.
   - Zemin sensörleri: aşağı inen ışın; ringin beyaz kenarına düşerse 1, siyah alana ya da ring dışına düşerse 0.
   Okumalar ligdeki SumoGirdi biçimindedir (rakip[5], kenar[2], zaman ms); öğrenci kodu değişmeden bağlanabilir.
   Eksenler: dünya +y yukarı; robotta +x ileri, +z sağ (ligdeki "sola" = -z). */
import { MALZEME, type Carpisan, type Dunya, type V3 } from "../fizik";
import { KenshinFizik, dondur } from "../robotlar/kenshin";

export const RING_FIZIK = {
  /** ring yarıçapı ve beyaz kenarın iç yarıçapı (m) */
  yaricap: 0.385,
  kenarIc: 0.36,
  /** ringin zeminden yüksekliği (m) */
  yukseklik: 0.025,
  /** düşme: gövde ring üstünün bu kadar altına inerse (m) */
  dusmePayi: 0.01
} as const;

/** Kenshin'in sensörleri (ligdekiyle aynı yer ve açılar; mm ve derece, açı ve "y" sola pozitif) */
export const SUMO_SENSORLERI = {
  menzil: 0.6,
  /** rakip sensörlerinin zeminden yüksekliği (m): ön karttaki dijital mesafe sensörleri */
  yukseklik: 0.02,
  rakip: [
    { ad: "sol_yan", aci: 90, x: 10, y: 50 },
    { ad: "sol_on", aci: 12, x: 50, y: 25 },
    { ad: "orta", aci: 0, x: 50, y: 0 },
    { ad: "sag_on", aci: -12, x: 50, y: -25 },
    { ad: "sag_yan", aci: -90, x: 10, y: -50 }
  ],
  /** zemin sensörleri: bıçağın arkasında; zeminden yükseklik (m) */
  zemin: [{ x: 46, y: 40 }, { x: 46, y: -40 }],
  zeminYukseklik: 0.01
} as const;

export interface SumoGirdi { rakip: number[]; kenar: number[]; zaman: number }
export interface Isin { bas: V3; son: V3; gordu: boolean }
export interface RingAyari { yaricap?: number; kenarIc?: number }

export class SumoRingi {
  readonly yaricap: number;
  readonly kenarIc: number;
  readonly yukseklik = RING_FIZIK.yukseklik;
  readonly ring: Carpisan;
  readonly disZemin: Carpisan;
  readonly robotlar: KenshinFizik[] = [];
  /** robotun düştüğü an (sn); düşmeyen için yok */
  private readonly dusmeAni = new Map<KenshinFizik, number>();
  private readonly govdeSahibi = new Map<number, KenshinFizik>();
  /** son okumadaki ışınlar (görüntü için) */
  readonly isinlar = new Map<KenshinFizik, Isin[]>();

  constructor(readonly d: Dunya, ayar: RingAyari = {}) {
    this.yaricap = ayar.yaricap ?? RING_FIZIK.yaricap;
    this.kenarIc = ayar.kenarIc ?? this.yaricap - (RING_FIZIK.yaricap - RING_FIZIK.kenarIc);
    const z = d.sabit();
    this.disZemin = d.kutu(z, { x: 2, y: 0.01, z: 2 }, MALZEME.zemin, undefined, { x: 0, y: -0.01, z: 0 });
    this.ring = d.silindir(z, this.yukseklik / 2, this.yaricap, MALZEME.ring, undefined, { x: 0, y: this.yukseklik / 2, z: 0 });
    d.oncesi.push(() => this.dusmeleriBul());
  }

  /** Ringin üstüne bir Kenshin koyar. konum: ring merkezine göre (m); yon: rad, 0 → +x */
  ekle(konum: { x: number; z: number }, yon = 0): KenshinFizik {
    const k = new KenshinFizik(this.d, konum, yon, this.yukseklik);
    this.robotlar.push(k);
    for (const g of [k.govde, ...k.tekerler]) this.govdeSahibi.set(g.handle, k);
    return k;
  }

  /** düştü mü (mini sumo kuralı; bir kez düşen düşmüş kalır) */
  dustu(k: KenshinFizik): boolean { return this.dusmeAni.has(k); }
  dusmeZamani(k: KenshinFizik): number | undefined { return this.dusmeAni.get(k); }

  private dusmeleriBul() {
    for (const k of this.robotlar) {
      if (this.dusmeAni.has(k)) continue;
      if (k.konum.y < this.yukseklik - RING_FIZIK.dusmePayi || this.zemineDegiyor(k)) this.dusmeAni.set(k, this.d.zaman);
    }
  }
  private zemineDegiyor(k: KenshinFizik): boolean {
    let degdi = false;
    for (const g of [k.govde, ...k.tekerler]) {
      for (let i = 0; i < g.numColliders() && !degdi; i++) {
        this.d.world.contactPair(g.collider(i), this.disZemin, (m) => {
          for (let j = 0; j < m.numContacts(); j++) if (m.contactDist(j) <= 0.0005) degdi = true;
        });
      }
    }
    return degdi;
  }

  /** iki robot birbirine değiyor mu (gövde, bıçak ya da teker) */
  temasta(a: KenshinFizik, b: KenshinFizik): boolean {
    let var_ = false;
    for (const ga of [a.govde, ...a.tekerler]) for (let i = 0; i < ga.numColliders() && !var_; i++) {
      const ca = ga.collider(i);
      for (const gb of [b.govde, ...b.tekerler]) for (let j = 0; j < gb.numColliders() && !var_; j++) {
        this.d.world.contactPair(ca, gb.collider(j), (m) => { for (let n = 0; n < m.numContacts(); n++) if (m.contactDist(n) <= 0.0005) var_ = true; });
      }
    }
    return var_;
  }

  /** Robotun sensör okumaları; ligdeki SumoGirdi biçiminde */
  okuma(k: KenshinFizik): SumoGirdi {
    const R = this.d.R, w = this.d.world, q = k.donme, p = k.konum, S = SUMO_SENSORLERI;
    const dunya = (v: V3): V3 => { const r = dondur(q, v); return { x: p.x + r.x, y: p.y + r.y, z: p.z + r.z }; };
    const kendisiDegil = (c: Carpisan) => { const g = c.parent(); return !g || this.govdeSahibi.get(g.handle) !== k; };
    const isinlar: Isin[] = [];
    const rakip = S.rakip.map((s) => {
      const a = (s.aci * Math.PI) / 180;
      const bas = dunya({ x: s.x / 1000, y: S.yukseklik, z: -s.y / 1000 });
      const yon = dondur(q, { x: Math.cos(a), y: 0, z: -Math.sin(a) });
      const vur = w.castRay(new R.Ray(bas, yon), S.menzil, true, undefined, undefined, undefined, undefined, kendisiDegil);
      const g = vur?.collider.parent();
      const gordu = !!g && this.govdeSahibi.has(g.handle);
      const t = vur ? vur.timeOfImpact : S.menzil;
      isinlar.push({ bas, son: { x: bas.x + yon.x * t, y: bas.y + yon.y * t, z: bas.z + yon.z * t }, gordu });
      return gordu ? 1 : 0;
    });
    const asagi = dondur(q, { x: 0, y: -1, z: 0 });
    const kenar = S.zemin.map((s) => {
      const bas = dunya({ x: s.x / 1000, y: S.zeminYukseklik, z: -s.y / 1000 });
      const vur = w.castRay(new R.Ray(bas, asagi), 0.05, true, undefined, undefined, undefined, undefined, kendisiDegil);
      if (!vur || vur.collider.handle !== this.ring.handle) return 0;
      const t = vur.timeOfImpact, x = bas.x + asagi.x * t, z = bas.z + asagi.z * t, r = Math.hypot(x, z);
      return r >= this.kenarIc && r <= this.yaricap ? 1 : 0;
    });
    this.isinlar.set(k, isinlar);
    return { rakip, kenar, zaman: Math.round(this.d.zaman * 1000) };
  }
}

