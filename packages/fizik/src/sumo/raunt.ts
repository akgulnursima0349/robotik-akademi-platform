/* Ligdeki sumo raundunun yeni fizik motorundaki karşılığı.
   Ligdeki rauntOyna ile aynı girdiler (iki beyin, diziliş, tohum, süre) ve aynı sonuç biçimi (RauntSonucu): öğrencinin kodu
   değişmeden iki motorda da oynar. Farklar:
   - Robotlar Rapier'de katı cisim (C2), ring 2,5 cm yüksekliğinde gerçek bir disk; düşme ring dışı zemine değmekle (C3).
   - Karelere gövdenin tam duruşu (yükseklik ve dönme) eklenir; düşüş, kaldırılma ve devrilme oynatmada olduğu gibi görünür.
   - Raunt bittikten sonra 0,6 sn daha kayıt sürer (düşüş gerçek fizikle görünsün); sonuçtaki süre düşme anıdır.
   Koordinatlar: ligdeki gibi mm, x sağa, y "sola" (fizikte -z), yön radyan. */
import { baslangic, KARAR, RAUNT_SURESI, type Dizilis, type RauntSonucu, type SumoBeyni, type SumoGirdi, type SumoKaresi, type SumoRobotKaresi } from "@sra/robot-motoru";
import { Dunya } from "../fizik";
import { KenshinFizik } from "../robotlar/kenshin";
import { KENSHIN_FIZIK } from "../robotlar/kenshin-parametreleri";
import { SumoRingi } from "./ring";

/** fizik adımı: kararın (20 ms) tam beşte biri */
const ADIM = KARAR / 5;
/** raunt bittikten sonra düşüşün kaydedildiği süre (sn) */
const DUSUS_KAYDI = 0.6;

export async function fizikliRauntOyna(beyinler: [SumoBeyni, SumoBeyni], d: Dizilis, tohum: number, sure = RAUNT_SURESI): Promise<RauntSonucu> {
  const dunya = await Dunya.kur({ adim: ADIM });
  try { return raunt(dunya, beyinler, d, tohum, sure); }
  finally { dunya.yokEt(); }
}

function raunt(dunya: Dunya, beyinler: [SumoBeyni, SumoBeyni], d: Dizilis, tohum: number, sure: number): RauntSonucu {
  const ring = new SumoRingi(dunya);
  const g = baslangic(d, tohum).map(([x, y, yon]) => ring.ekle({ x: x / 1000, z: -y / 1000 }, yon)) as [KenshinFizik, KenshinFizik];
  const hatalar: [string | null, string | null] = [null, null];
  const pwm: [number, number][] = [[0, 0], [0, 0]];
  const kareler: SumoKaresi[] = [];
  const adimSayisi = Math.round(KARAR / ADIM);
  const agirlik = KENSHIN_FIZIK.kutle * 9.81;
  let girdiler: [SumoGirdi, SumoGirdi] = [ring.okuma(g[0]), ring.okuma(g[1])];

  const kaydet = (t: number) => kareler.push({
    t: +t.toFixed(3), temas: ring.temasta(g[0], g[1]),
    robotlar: [0, 1].map((i) => {
      const k = g[i], p = k.konum, q = k.donme, [a, b] = k.tekerAcisi;
      return {
        x: p.x * 1000, y: -p.z * 1000, yon: yonAcisi(q), sol: pwm[i][0], sag: pwm[i][1],
        solYol: a * KENSHIN_FIZIK.tekerYaricap * 1000, sagYol: b * KENSHIN_FIZIK.tekerYaricap * 1000,
        rakip: girdiler[i].rakip, kenar: girdiler[i].kenar,
        kaldirildi: k.tekerYuku()[0] + k.tekerYuku()[1] < 0.5 * agirlik,
        dustu: ring.dustu(k),
        poz: { y: p.y, q: [q.x, q.y, q.z, q.w] }
      } satisfies SumoRobotKaresi;
    }) as [SumoRobotKaresi, SumoRobotKaresi]
  });
  const bitir = (sonuc: Omit<RauntSonucu, "kareler" | "hatalar">): RauntSonucu => {
    /* düşüşün devamı: motorlar durur, fizik sürer */
    g.forEach((k, i) => { k.surus(0, 0); pwm[i] = [0, 0]; });
    for (let t = 0; t < DUSUS_KAYDI - 1e-9; t += KARAR) {
      for (let k = 0; k < adimSayisi; k++) dunya.ilerle();
      kaydet(sonuc.sure + t + KARAR);
    }
    return { ...sonuc, kareler, hatalar };
  };

  for (let tik = 0; ; tik++) {
    const t = tik * KARAR;
    kaydet(t);
    const dustu = [ring.dustu(g[0]), ring.dustu(g[1])];
    if (dustu[0] || dustu[1]) {
      return bitir({ kazanan: dustu[0] && dustu[1] ? null : dustu[0] ? 1 : 0, sebep: dustu[0] && dustu[1] ? "ikisi_dustu" : "dustu", sure: +t.toFixed(2) });
    }
    if (t >= sure - 1e-9) return { kazanan: null, sebep: "sure", sure, kareler, hatalar };
    girdiler = [ring.okuma(g[0]), ring.okuma(g[1])];
    for (const i of [0, 1] as const) {
      girdiler[i].zaman = Math.round(t * 1000);
      if (hatalar[i]) { pwm[i] = [0, 0]; continue; }
      try { const p = beyinler[i](girdiler[i]); pwm[i] = [Number(p?.[0]) || 0, Number(p?.[1]) || 0]; }
      catch (e) { hatalar[i] = e instanceof Error ? e.message : String(e); pwm[i] = [0, 0]; }
      g[i].surus(sinirla(pwm[i][0]), sinirla(pwm[i][1]));
    }
    for (let k = 0; k < adimSayisi; k++) dunya.ilerle();
  }
}

/** ligdeki PWM aralığı -255…255; fizik motoru -1…1 bekler */
const sinirla = (v: number) => Math.max(-1, Math.min(1, v / 255));
/** dönme dörtlüsünden robotun ileri yönünün yatay açısı (lig: x'ten "sola" doğru pozitif) */
function yonAcisi(q: { x: number; y: number; z: number; w: number }) {
  /* ileri vektörü (1,0,0) döndürülünce: */
  const fx = 1 - 2 * (q.y * q.y + q.z * q.z), fz = 2 * (q.x * q.z - q.w * q.y);
  return Math.atan2(-fz, fx);
}
