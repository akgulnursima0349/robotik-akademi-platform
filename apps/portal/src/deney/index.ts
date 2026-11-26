/* Deney bileşenleri kayıt defteri: mufredat'taki DENEY_BILESEN_ADLARI ile birebir. */
import { kaydirici } from "@sra/tasarim/v2";
import type { DeneyBileseni } from "../ekranlar/ders-sayfasi";
import { SENSOR_GOSTERGESI_STILI, sensorGostergesi } from "./sensor-gostergesi";
import { CIZGI_SIMULASYONU_STILI, cizgiSimulasyonu, type SimAyari } from "./cizgi-simulasyonu";
import { itmeDeneyi, kartKodu, ringSimulasyonu, sensorGorusu, SUMO_STILI, type RingAyari } from "./sumo";
import type { Durum } from "@sra/robot-motoru";

let stil = false;
export const stilEkle = () => { if (stil) return; stil = true; const s = document.createElement("style"); s.textContent = SENSOR_GOSTERGESI_STILI + CIZGI_SIMULASYONU_STILI + SUMO_STILI; document.head.append(s); };

export const DENEYLER: Record<string, DeneyBileseni> = {
  "sensor-gostergesi": (ayar, denendi) => { stilEkle(); return sensorGostergesi(ayar, denendi); },
  "cizgi-simulasyonu": (ayar, denendi) => { stilEkle(); return cizgiSimulasyonu(ayar as unknown as SimAyari, { denendi }); },
  "ring-simulasyonu": (ayar, denendi) => { stilEkle(); return ringSimulasyonu(ayar as unknown as RingAyari, denendi); },
  "sensor-gorusu": (ayar, denendi) => { stilEkle(); return sensorGorusu(ayar, denendi); },
  "itme-deneyi": (ayar, denendi) => { stilEkle(); return itmeDeneyi(ayar, denendi); },
  "kart-kodu": (ayar, denendi) => { stilEkle(); return kartKodu(ayar as unknown as { acik: Durum[] }, denendi); },
  kaydirici: (ayar, denendi) => {
    const a = ayar as { etiket?: string; en: number; ust: number; adim?: number; birim?: string; baslangic?: number };
    return kaydirici({ etiket: a.etiket ?? "Değer", en: a.en, ust: a.ust, adim: a.adim, birim: a.birim, baslangic: a.baslangic, birakinca: denendi });
  }
};
