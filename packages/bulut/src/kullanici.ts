/* Giriş yapmış kişi. Her tür kendi gideceği yeri bilir (çok biçimlilik): portal yalnızca hedef() sorar. */
import { KURSLAR, type KursKimligi } from "./katalog";

export type Rol = "ogrenci" | "ogretmen";

export abstract class Kullanici {
  abstract readonly rol: Rol;
  constructor(readonly gorunenAd: string) {}
  /** Girişten sonra açılacak adres (platform kökünden göreli ya da #rota). */
  abstract hedef(): string;
}

export class Ogrenci extends Kullanici {
  readonly rol = "ogrenci" as const;
  constructor(takmaAd: string, readonly sinif: string, readonly sinifKodu: string, readonly kurs: KursKimligi) {
    super(takmaAd);
  }
  hedef(): string {
    return KURSLAR[this.kurs].yol ?? "#yakinda/" + this.kurs;
  }
}

export class Ogretmen extends Kullanici {
  readonly rol = "ogretmen" as const;
  constructor(ad: string, readonly mudur: boolean) {
    super(ad);
  }
  hedef(): string {
    return "#panellerim";
  }
}

export interface Sinif {
  id: string;
  ad: string;
  kod: string;
  kurs: KursKimligi;
  ogrenciSayisi: number;
  benim: boolean;
  sahipAd: string;
}
