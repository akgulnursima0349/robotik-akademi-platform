/* Sesli yönerge: platformun ortak ses servisi (tarayıcının Türkçe sesi; internetsiz, ücretsiz). Türkçe ses yoksa sessiz.
   Blok Atölyesi'nin kendi ayar anahtarı korunur: öğrencinin daha önce kapattığı ses kapalı kalır. */
import { SesServisi, tarayiciMotoru } from "@sra/tasarim/v2/ses";

let depo: Storage | null = null;
try { depo = localStorage; } catch { /* depolama kapalı */ }
const servis = new SesServisi(tarayiciMotoru(), depo, "sra-blok-ses");

export const ses = {
  /** Türkçe ses var mı? (yoksa ses düğmesi gizlenir) */
  get var(): boolean { return servis.var; },
  get acik(): boolean { return servis.acik; },
  set acik(v: boolean) { servis.acik = v; },
  oku(metin: string, zorla = false) { servis.oku(metin, { zorla }); },
  degisince(f: () => void) { return servis.degisince(f); }
};
