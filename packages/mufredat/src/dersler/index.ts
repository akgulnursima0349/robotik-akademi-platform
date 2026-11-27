/* Bütün dersler. F bölümünde yazılan her ders buraya eklenir; test/dersler.test.ts hepsini doğrulayıcıdan geçirir. */
import type { DersTanimi } from "../ders";
import type { Ders } from "../model";
import { SIROLINE_SENSOR } from "./siroline-sensor";
import { CIZGI_KONUMU } from "./cizgi-konumu";
import { P_KONTROL } from "./p-kontrol";
import { D_KONTROL } from "./d-kontrol";
import { HIZ_KARARLILIK } from "./hiz-kararlilik";
import { PIST_YARISI } from "./pist-yarisi";
import { SUMO_DERSLERI } from "./sumo";
import { LABIRENT_DERSLERI } from "./labirent";
import { MBOT_DERSLERI } from "./mbot";
import { KONTROL_DERSLERI } from "./kontrol";

/** Çizgi İzleyen Robot modülünün altı dersi, sırasıyla */
export const CIZGI_DERSLERI: DersTanimi[] = [SIROLINE_SENSOR, CIZGI_KONUMU, P_KONTROL, D_KONTROL, HIZ_KARARLILIK, PIST_YARISI];
export { SUMO_DERSLERI, LABIRENT_DERSLERI, MBOT_DERSLERI, KONTROL_DERSLERI };
export const DERSLER: DersTanimi[] = [...MBOT_DERSLERI, ...CIZGI_DERSLERI, ...SUMO_DERSLERI, ...LABIRENT_DERSLERI, ...KONTROL_DERSLERI];
export const dersBul = (kimlik: string) => DERSLER.find((d) => d.kimlik === kimlik);

/** Ders tanımından atölye sayfasındaki ders ögesi */
export function dersOgesi(t: DersTanimi): Ders {
  return { kimlik: t.kimlik, ad: t.ad, ogretir: t.kazanim, tur: "ders", adres: `#ders/${t.kimlik}`, enCokYildiz: 0, anahtar: t.kimlik, tanim: t };
}
