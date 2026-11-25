/* Python atölyesi: iki ayrı kurs (Python Atölyesi Junior ve Python Atölyesi) iki modül. Kursların ders yapısı kendi içlerinde;
   burada modül kursa götürür. Ders düzeyinde ilerleme ders motoruyla (E bölümü) gelir. */
import type { Atolye } from "./model";

export const PYTHON: Atolye = {
  kimlik: "python",
  ad: "Python",
  aciklama: "Adım adım Python'dan yapay zekâya: oyunlarla başlayan Junior ve gerçek Python defterleriyle Python Atölyesi.",
  moduller: [
    {
      kimlik: "junior", ad: "Python Atölyesi Junior", robot: "Bit", seviyeler: ["ilkokul"],
      aciklama: "4–6. sınıf: on dünya, başlangıç ve bitiş testi, sertifika ve oyun salonu.",
      dersler: [{ kimlik: "junior", ad: "Kursa gir", ogretir: "On dünya · oyun salonu · sertifika", tur: "kurs", adres: "junior/", enCokYildiz: 0, anahtar: "" }]
    },
    {
      kimlik: "atolye", ad: "Python Atölyesi", seviyeler: ["ortaokul", "lise"],
      aciklama: "Gerçek Python, makine öğrenmesi kütüphaneleri ve tarayıcıda çalışan defterlerle yapay zekâ laboratuvarları.",
      dersler: [{ kimlik: "ortaokul", ad: "Kursa gir", ogretir: "Tarayıcıda çalışan Python defterleri", tur: "kurs", adres: "ortaokul/", enCokYildiz: 0, anahtar: "" }]
    }
  ]
};
