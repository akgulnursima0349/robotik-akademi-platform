/* Kenshin'in katı cisim modeli.
   - Gövde: alt plaka, üst yapı (pil, servo) ve çelik bıçak kaması; kütle ve kütle merkezi parametre dosyasından.
   - Tekerler: gövdeye dönme eklemiyle bağlı lastik silindirler. Gövde ile teker arasında çarpışma yok.
   - Motor: DC motorun tork–hız doğrusu (tork = durma torku × (PWM − ω/ω_boş)), birinci dereceden gecikme ve ölü bölge.
     Tepki torku gövdeye uygulanır. PWM 0 iken motor kısa devre freni gibi davranır (sürücü kartının fren kipi).
   - Tutuş ayrıca kodlanmaz: teker zemini normal kuvvetle orantılı iter; kaldırılan robotun tekerleri kayar.
   Eksenler (robot): +x ileri, +y yukarı, +z sağ. */
import type { Carpisan, Dunya, Govde, V3 } from "../fizik";
import { KENSHIN_FIZIK as P } from "./kenshin-parametreleri";

type Q = { x: number; y: number; z: number; w: number };
/** vektörü dörtlükle döndür: v' = v + w·t + q×t, t = 2·(q×v) */
const dondur = (q: Q, v: V3): V3 => {
  const tx = 2 * (q.y * v.z - q.z * v.y), ty = 2 * (q.z * v.x - q.x * v.z), tz = 2 * (q.x * v.y - q.y * v.x);
  return { x: v.x + q.w * tx + (q.y * tz - q.z * ty), y: v.y + q.w * ty + (q.z * tx - q.x * tz), z: v.z + q.w * tz + (q.x * ty - q.y * tx) };
};
const yonQ = (yon: number): Q => ({ x: 0, y: Math.sin(yon / 2), z: 0, w: Math.cos(yon / 2) });
const nokta = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;

/** bıçak ucundaki kızağın yarıçapı */
export const KIZAK_YARICAP = 0.0006;

export class KenshinFizik {
  readonly govde: Govde;
  readonly tekerler: [Govde, Govde];
  readonly tekerSekli: [Carpisan, Carpisan];
  readonly bicak: Carpisan;
  /** bıçak ucunun zemine değen yuvarlak kızağı */
  readonly kizak: Carpisan;
  /** istenen PWM oranı [-1, 1]: sol, sağ */
  private istenen: [number, number] = [0, 0];
  private etkin: [number, number] = [0, 0];
  /** görüntü için tekerlerin toplam dönme açısı (rad, ileri pozitif) */
  readonly tekerAcisi: [number, number] = [0, 0];
  private sonDevir: [number, number] = [0, 0];

  constructor(private readonly d: Dunya, konum: { x: number; z: number }, yon = 0) {
    const R = d.R, q = yonQ(yon);
    /* gövde: kütle ve eylemsizlik elle verilir; çarpışma şekillerinin yoğunluğu 0 */
    this.govde = d.hareketli({ x: konum.x, y: 0, z: konum.z }, q);
    const e = P.en / 2, b = P.bicak;
    /* bıçak kaması ucundan 0,8 mm yukarıda biter; zemine ucun ortasındaki küçük yuvarlak "kızak" değer.
       Böylece robot iki teker ve bıçak ucu üzerinde, üç noktaya oturur: yük dağılımı belirli olur (dört noktada belirsiz
       kalır, robot bir yana çeker) ve sivri köşe teması yerine düzgün bir temas çözülür. Kızak bıçağın parçasıdır; tepesi
       zeminden 1,6 mm yukarıda, rakibin 2-3 mm'lik taban boşluğunun altında kalır. */
    const tavan = b.ucBosluk + 0.0008, kizakR = KIZAK_YARICAP;
    this.bicak = d.disbukey(this.govde, [
      { x: b.ucX, y: tavan, z: -e }, { x: b.ucX, y: tavan, z: e },
      { x: b.ustX, y: tavan, z: -e }, { x: b.ustX, y: tavan, z: e },
      { x: b.ustX, y: b.ustY, z: -e }, { x: b.ustX, y: b.ustY, z: e }
    ], P.malzeme.bicak, 0);
    this.kizak = d.kure(this.govde, kizakR, P.malzeme.bicak, 0, { x: b.ucX - kizakR, y: b.ucBosluk + kizakR, z: 0 });
    d.kutu(this.govde, { x: 0.03, y: 0.004, z: 0.048 }, P.malzeme.govde, 0, { x: 0, y: P.tabanBoslugu + 0.004, z: 0 });
    d.kutu(this.govde, { x: 0.022, y: 0.012, z: 0.025 }, P.malzeme.govde, 0, { x: -0.02, y: 0.022, z: 0 });
    d.kutu(this.govde, { x: 0.007, y: 0.004, z: 0.024 }, P.malzeme.govde, 0, { x: -0.043, y: P.tabanBoslugu + 0.004, z: 0 });
    d.kutleAyarla(this.govde, P.kutle - 2 * P.tekerKutlesi, P.kutleMerkezi, { x: P.boy, y: 0.04, z: P.en });
    /* tekerler: silindir y ekseninde; x etrafında 90° döndürülüp eksen z yapılır */
    const hacim = Math.PI * P.tekerYaricap ** 2 * P.tekerEni, yogunluk = P.tekerKutlesi / hacim;
    const yatir = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
    const tekerler: Govde[] = [], sekiller: Carpisan[] = [];
    for (const s of [-1, 1]) {
      const yerel = { x: P.tekerX, y: P.tekerYaricap, z: s * P.tekerZ };
      const dunyaYer = dondur(q, yerel);
      const t = d.hareketli({ x: konum.x + dunyaYer.x, y: dunyaYer.y, z: konum.z + dunyaYer.z }, q);
      const desc = R.ColliderDesc.cylinder(P.tekerEni / 2, P.tekerYaricap).setRotation(yatir)
        .setFriction(P.malzeme.lastik.surtunme).setRestitution(P.malzeme.lastik.sekme)
        .setFrictionCombineRule(R.CoefficientCombineRule.Min).setRestitutionCombineRule(R.CoefficientCombineRule.Min)
        .setDensity(yogunluk);
      sekiller.push(d.world.createCollider(desc, t));
      const eklem = d.world.createImpulseJoint(R.JointData.revolute(yerel, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), this.govde, t, true);
      eklem.setContactsEnabled(false);
      tekerler.push(t);
    }
    this.tekerler = tekerler as [Govde, Govde];
    this.tekerSekli = sekiller as [Carpisan, Carpisan];
    d.oncesi.push(() => this.motorlar());
  }

  /** Motor komutu: PWM oranı [-1, 1] (Arduino'da analogWrite / 255) */
  surus(sol: number, sag: number) { this.istenen = [Math.max(-1, Math.min(1, sol)), Math.max(-1, Math.min(1, sag))]; }

  /** gövdenin dünyadaki teker ekseni (+z yerel) */
  private eksen(): V3 { return dondur(this.govde.rotation(), { x: 0, y: 0, z: 1 }); }
  /** tekerin ileri yöndeki açısal hızı (rad/sn, gövdeye göre) */
  private tekerHizi(i: 0 | 1, eksen: V3): number {
    const w = this.tekerler[i].angvel(), g = this.govde.angvel();
    return -nokta({ x: w.x - g.x, y: w.y - g.y, z: w.z - g.z }, eksen);
  }

  private motorlar() {
    const dt = this.d.adim, m = P.motor, eksen = this.eksen();
    this.govde.resetTorques(true);
    for (const i of [0, 1] as const) {
      const hedef = Math.abs(this.istenen[i]) < m.oluBolge ? 0 : this.istenen[i];
      this.etkin[i] += (hedef - this.etkin[i]) * Math.min(1, dt / m.gecikme);
      const w = this.tekerHizi(i, eksen);
      this.sonDevir[i] = w;
      this.tekerAcisi[i] += w * dt;
      const tork = m.durmaTorku * (this.etkin[i] - w / m.bosDevir);
      const t = this.tekerler[i];
      t.resetTorques(true);
      /* ileri dönüş -z etrafında: tekere -tork·eksen, tepkisi gövdeye */
      t.addTorque({ x: -tork * eksen.x, y: -tork * eksen.y, z: -tork * eksen.z }, true);
      this.govde.addTorque({ x: tork * eksen.x, y: tork * eksen.y, z: tork * eksen.z }, true);
    }
  }

  /* ---------- ölçümler ---------- */
  get konum(): V3 { return this.govde.translation(); }
  get donme(): Q { return this.govde.rotation(); }
  /** ileri yöndeki hız (m/s) */
  get hiz(): number { const v = this.govde.linvel(); return nokta(v, dondur(this.govde.rotation(), { x: 1, y: 0, z: 0 })); }
  /** dikey eksen etrafında dönüş hızı (rad/sn, yukarıdan bakınca saat yönünün tersi pozitif) */
  get donusHizi(): number { return this.govde.angvel().y; }
  /** teker devirleri (rpm): sol, sağ */
  get devir(): [number, number] { return [this.sonDevir[0] * 60 / (2 * Math.PI), this.sonDevir[1] * 60 / (2 * Math.PI)]; }
  /** tekerlerin zemine (ve değdikleri her şeye) bastığı kuvvet (N): sol, sağ */
  tekerYuku(): [number, number] { return [this.d.normalKuvvet(this.tekerSekli[0]), this.d.normalKuvvet(this.tekerSekli[1])]; }
  /** gövdenin yataydan eğimi (derece): kaldırılınca artar */
  get egim(): number { const yukari = dondur(this.govde.rotation(), { x: 0, y: 1, z: 0 }); return (Math.acos(Math.max(-1, Math.min(1, yukari.y))) * 180) / Math.PI; }
}
