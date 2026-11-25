/* Ortak fizik altyapısı: Rapier 3D'nin belirlenimci (deterministik) sürümü.
   - Aynı girdiler her cihazda bit bit aynı sonucu verir: maç tekrarları, sınıf ligi ve testler buna dayanır.
   - Sabit adımlı döngü (varsayılan 1/240 sn). Birimler: metre, kilogram, saniye; y ekseni yukarı.
   - DOM'suz; tarayıcıda ve Node'da (testler) aynı çalışır. WASM, paketin içinde gömülü gelir (ek ayar gerekmez).
   - Bu modül yalnız fiziği kullanan ekranlarda, dinamik import ile yüklenir. */
import RAPIER from "@dimforge/rapier3d-deterministic-compat";

export type Rapier = typeof RAPIER;
export type Govde = InstanceType<Rapier["RigidBody"]>;
export type Carpisan = InstanceType<Rapier["Collider"]>;
export interface V3 { x: number; y: number; z: number }

let hazir: Promise<Rapier> | null = null;
/** WASM'ı bir kez başlatır; sonraki çağrılar aynı sözü döndürür. */
export function fizikHazirla(): Promise<Rapier> {
  hazir ??= RAPIER.init().then(() => RAPIER);
  return hazir;
}

/** Yüzey malzemesi: sürtünme (Coulomb) ve sekme katsayısı. İki yüzey değdiğinde küçük olanlar geçerlidir
    (lastiğin kaygan zeminde, kaygan tabanın lastik zeminde tutunamaması gibi). */
export interface Malzeme { ad: string; surtunme: number; sekme: number }
export const MALZEME = {
  /** sumo ringi: siyah boyalı MDF */
  ring: { ad: "ring", surtunme: 0.9, sekme: 0.05 },
  /** silikon lastik */
  lastik: { ad: "lastik", surtunme: 1.0, sekme: 0.1 },
  /** çelik bıçak, metal parça */
  celik: { ad: "celik", surtunme: 0.25, sekme: 0.05 },
  /** 3D baskı plastik, kart kenarı */
  plastik: { ad: "plastik", surtunme: 0.35, sekme: 0.2 },
  /** masa, pist zemini (vinil) */
  zemin: { ad: "zemin", surtunme: 0.7, sekme: 0.1 }
} satisfies Record<string, Malzeme>;

export interface DunyaAyari {
  /** sabit fizik adımı (sn) */
  adim?: number;
  yercekimi?: number;
  /** çözücü yinelemesi: temas ve eklem doğruluğu */
  cozucuYinelemesi?: number;
  /** sahnenin tipik cisim boyu, metre (temas toleranslarını ölçekler); varsayılan 0,1 */
  uzunlukOlcegi?: number;
}

/** Bir adımda dünyaya uygulanacak girdi (ör. motor komutları). Kayıt ve tekrar için düz veri olmalı. */
export type Girdi = Record<string, number>;
export type GirdiUygula = (dunya: Dunya, girdi: Girdi | undefined, adimNo: number) => void;

export class Dunya {
  readonly R: Rapier;
  readonly world: InstanceType<Rapier["World"]>;
  readonly adim: number;
  adimNo = 0;
  /** her adımda uygulanan girdiler (kayıt): aynı kurulum + aynı girdiler = aynı sonuç */
  readonly kayit: (Girdi | undefined)[] = [];
  girdiUygula: GirdiUygula | null = null;
  /** her adımdan önce çağrılır (motor torkları gibi); girdiden sonra, eklenme sırasıyla */
  readonly oncesi: ((dunya: Dunya) => void)[] = [];
  /** ölçüm: son adımların ortalama süresi (ms) */
  private sureler: number[] = [];

  constructor(R: Rapier, ayar: DunyaAyari = {}) {
    this.R = R;
    this.adim = ayar.adim ?? 1 / 240;
    this.world = new R.World({ x: 0, y: -(ayar.yercekimi ?? 9.81), z: 0 });
    this.world.timestep = this.adim;
    this.world.integrationParameters.numSolverIterations = ayar.cozucuYinelemesi ?? 8;
    /* uzunluk ölçeği: sahnedeki cisimler 10 cm mertebesinde. Rapier'in temas toleransları (izinli iç içe geçme,
       öngörü mesafesi) bu ölçekle çarpılır; varsayılan 1 m ile 2 mm'lik öngörü, bıçak ucunun rakibin 2-3 mm'lik
       taban boşluğuna girmesini engelleyen hayalet temaslar üretiyordu. */
    this.world.lengthUnit = ayar.uzunlukOlcegi ?? 0.1;
  }
  static async kur(ayar?: DunyaAyari): Promise<Dunya> { return new Dunya(await fizikHazirla(), ayar); }

  get zaman() { return this.adimNo * this.adim; }

  /** Bir sabit adım ilerlet. Girdi kayda yazılır. */
  ilerle(girdi?: Girdi): void {
    const t0 = performance.now();
    this.girdiUygula?.(this, girdi, this.adimNo);
    for (const f of this.oncesi) f(this);
    this.kayit.push(girdi ? { ...girdi } : undefined);
    this.world.step();
    this.adimNo++;
    const s = this.sureler; s.push(performance.now() - t0); if (s.length > 120) s.shift();
  }
  /** Gerçek zamanda geçen süre kadar sabit adım at (en çok `enCok` adım; yavaş makinede sarmal kilitlenmeyi önler). */
  private birikim = 0;
  zamanIlerle(sn: number, girdi?: () => Girdi | undefined, enCok = 8): number {
    this.birikim += sn;
    let n = 0;
    while (this.birikim >= this.adim && n < enCok) { this.ilerle(girdi?.()); this.birikim -= this.adim; n++; }
    if (n === enCok) this.birikim = 0;
    return n;
  }
  /** son adımların ortalama fizik süresi (ms) */
  get ortalamaAdimSuresi() { const s = this.sureler; return s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0; }

  /* ---------- gövde ve şekil kurucuları ---------- */
  /** Sabit (hareketsiz) gövde: zemin, ring, duvar */
  sabit(konum: V3 = { x: 0, y: 0, z: 0 }): Govde {
    return this.world.createRigidBody(this.R.RigidBodyDesc.fixed().setTranslation(konum.x, konum.y, konum.z));
  }
  /** Hareketli gövde. Kütle, eklenen şekillerin yoğunluğundan ya da `kutleAyarla` ile gelir. */
  hareketli(konum: V3, donme?: { x: number; y: number; z: number; w: number }): Govde {
    const d = this.R.RigidBodyDesc.dynamic().setTranslation(konum.x, konum.y, konum.z).setCanSleep(false);
    if (donme) d.setRotation(donme);
    return this.world.createRigidBody(d);
  }
  private sekil(desc: InstanceType<Rapier["ColliderDesc"]>, govde: Govde, m: Malzeme, yogunluk?: number, yer?: V3): Carpisan {
    desc.setFriction(m.surtunme).setRestitution(m.sekme)
      .setFrictionCombineRule(this.R.CoefficientCombineRule.Min)
      .setRestitutionCombineRule(this.R.CoefficientCombineRule.Min);
    if (yogunluk !== undefined) desc.setDensity(yogunluk);
    if (yer) desc.setTranslation(yer.x, yer.y, yer.z);
    return this.world.createCollider(desc, govde);
  }
  /** Kutu: yarı boyutlar (m) */
  kutu(govde: Govde, yari: V3, m: Malzeme, yogunluk?: number, yer?: V3) { return this.sekil(this.R.ColliderDesc.cuboid(yari.x, yari.y, yari.z), govde, m, yogunluk, yer); }
  /** Silindir: y ekseni boyunca; yarı yükseklik ve yarıçap (m) */
  silindir(govde: Govde, yariYukseklik: number, yaricap: number, m: Malzeme, yogunluk?: number, yer?: V3) { return this.sekil(this.R.ColliderDesc.cylinder(yariYukseklik, yaricap), govde, m, yogunluk, yer); }
  kure(govde: Govde, yaricap: number, m: Malzeme, yogunluk?: number, yer?: V3) { return this.sekil(this.R.ColliderDesc.ball(yaricap), govde, m, yogunluk, yer); }
  /** Dışbükey gövde: nokta bulutundan (bıçak kaması gibi) */
  disbukey(govde: Govde, noktalar: V3[], m: Malzeme, yogunluk?: number): Carpisan {
    const a = new Float32Array(noktalar.flatMap((p) => [p.x, p.y, p.z]));
    const d = this.R.ColliderDesc.convexHull(a);
    if (!d) throw new Error("Dışbükey gövde kurulamadı: noktalar düzlemsel ya da yetersiz");
    return this.sekil(d, govde, m, yogunluk);
  }
  /** Kama: tabanı x ekseni boyunca `boy`, en `en`, arka yüksekliği `yukseklik`; uç +x yönünde, zeminde */
  kama(govde: Govde, boy: number, en: number, yukseklik: number, m: Malzeme, yogunluk?: number, yer: V3 = { x: 0, y: 0, z: 0 }): Carpisan {
    const e = en / 2, p = (x: number, y: number, z: number) => ({ x: x + yer.x, y: y + yer.y, z: z + yer.z });
    return this.disbukey(govde, [p(0, 0, -e), p(0, 0, e), p(boy, 0, -e), p(boy, 0, e), p(0, yukseklik, -e), p(0, yukseklik, e)], m, yogunluk);
  }
  /** Kütle ve kütle merkezini doğrudan ver (ölçülen değerler); eylemsizlik kutu yaklaşımıyla */
  kutleAyarla(govde: Govde, kutle: number, merkez: V3, kutuBoyu: V3): void {
    const { x: a, y: b, z: c } = kutuBoyu;
    const ix = (kutle / 12) * (b * b + c * c), iy = (kutle / 12) * (a * a + c * c), iz = (kutle / 12) * (a * a + b * b);
    govde.setAdditionalMassProperties(kutle, merkez, { x: ix, y: iy, z: iz }, { x: 0, y: 0, z: 0, w: 1 }, true);
  }

  /* ---------- determinizm ---------- */
  /** Dünyanın tam durumunun özeti (FNV-1a, 32 bit, onaltılık). Aynı kurulum ve girdiler = aynı özet. */
  ozet(): string {
    const v = this.world.takeSnapshot();
    let h = 0x811c9dc5;
    for (let i = 0; i < v.length; i++) { h ^= v[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }
  /** Bir çarpışma şeklinin o anda değdiği bütün yüzeylerden aldığı toplam normal kuvvet (N) */
  normalKuvvet(c: Carpisan): number {
    let toplam = 0;
    this.world.contactPairsWith(c, (o) => {
      this.world.contactPair(c, o, (m) => { for (let i = 0; i < m.numContacts(); i++) toplam += m.contactImpulse(i); });
    });
    return toplam / this.adim;
  }
  /** Gövdenin konumu ve dönmesi (görüntüye aktarmak için) */
  static poz(g: Govde) { return { konum: g.translation(), donme: g.rotation() }; }

  yokEt() { this.world.free(); }
}

/** Kayıttan tekrar: aynı kurulum fonksiyonu ve kaydedilmiş girdilerle dünyayı baştan oynatır. */
export async function tekrarOynat(kur: (d: Dunya) => void, kayit: (Girdi | undefined)[], ayar?: DunyaAyari): Promise<Dunya> {
  const d = await Dunya.kur(ayar);
  kur(d);
  for (const g of kayit) d.ilerle(g);
  return d;
}
