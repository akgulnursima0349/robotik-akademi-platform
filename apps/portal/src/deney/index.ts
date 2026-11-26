/* Deney bileşenleri kayıt defteri: mufredat'taki DENEY_BILESEN_ADLARI ile birebir. */
import { kaydirici } from "@sra/tasarim/v2";
import type { DeneyBileseni } from "../ekranlar/ders-sayfasi";
import { SENSOR_GOSTERGESI_STILI, sensorGostergesi } from "./sensor-gostergesi";
import { CIZGI_SIMULASYONU_STILI, cizgiSimulasyonu, type SimAyari } from "./cizgi-simulasyonu";

let stil = false;
export const stilEkle = () => { if (stil) return; stil = true; const s = document.createElement("style"); s.textContent = SENSOR_GOSTERGESI_STILI + CIZGI_SIMULASYONU_STILI; document.head.append(s); };

export const DENEYLER: Record<string, DeneyBileseni> = {
  "sensor-gostergesi": (ayar, denendi) => { stilEkle(); return sensorGostergesi(ayar, denendi); },
  "cizgi-simulasyonu": (ayar, denendi) => { stilEkle(); return cizgiSimulasyonu(ayar as unknown as SimAyari, { denendi }); },
  kaydirici: (ayar, denendi) => {
    const a = ayar as { etiket?: string; en: number; ust: number; adim?: number; birim?: string; baslangic?: number };
    return kaydirici({ etiket: a.etiket ?? "Değer", en: a.en, ust: a.ust, adim: a.adim, birim: a.birim, baslangic: a.baslangic, birakinca: denendi });
  }
};
