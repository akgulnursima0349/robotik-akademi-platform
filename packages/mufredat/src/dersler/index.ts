/* Bütün dersler. F bölümünde yazılan her ders buraya eklenir; test/dersler.test.ts hepsini doğrulayıcıdan geçirir. */
import type { DersTanimi } from "../ders";
import type { Ders } from "../model";
import { SIROLINE_SENSOR } from "./siroline-sensor";

export const DERSLER: DersTanimi[] = [SIROLINE_SENSOR];
export const dersBul = (kimlik: string) => DERSLER.find((d) => d.kimlik === kimlik);

/** Ders tanımından atölye sayfasındaki ders ögesi */
export function dersOgesi(t: DersTanimi): Ders {
  return { kimlik: t.kimlik, ad: t.ad, ogretir: t.kazanim, tur: "ders", adres: `#ders/${t.kimlik}`, enCokYildiz: 0, anahtar: t.kimlik, tanim: t };
}
