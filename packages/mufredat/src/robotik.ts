/* Robotik atölyesi: bugünkü Robotik Laboratuvarı'nın etkinlikleri modül, görevleri ders.
   Görev adları, sıraları ve anahtarları Lab'ın kendi listelerinden gelir: Lab'a görev eklenince burası da güncellenir.
   İlerleme Lab'ın kaydından (sra-lab-v1) okunur. */
import { CIZGI_GOREVLERI, GOREVLER, LABIRENT_GOREVLERI } from "@sra/robot-motoru";
import type { Atolye } from "./model";
import { CIZGI_DERSLERI, dersOgesi, LABIRENT_DERSLERI, MBOT_DERSLERI, SUMO_DERSLERI } from "./dersler";

export const LAB_KAYIT_ANAHTARI = "sra-lab-v1";

export const ROBOTIK: Atolye = {
  kimlik: "robotik",
  ad: "Robotik",
  aciklama: "Akademinin robotları 3D: gerçek ölçüler, gerçek fizik. Python'la sür, sensörleri oku, yarış.",
  moduller: [
    {
      kimlik: "mbot", ad: "Robot Görevleri", robot: "mBot", seviyeler: ["ilkokul"],
      aciklama: "Motor, teker ve sensörler; kartlarla eğer, döngü ve enerji; sonunda kendi görev haritan.",
      dersler: MBOT_DERSLERI.map(dersOgesi)
    },
    {
      kimlik: "kar", ad: "Kar Küreme", robot: "Kar küreme robotu", seviyeler: ["ilkokul", "ortaokul"],
      aciklama: "Bataryası sınırlı robotla karlı sokakları aç: sıralı komutlar, döngüler, sensörler, enerji.",
      dersler: GOREVLER.map((g) => ({ kimlik: g.kimlik, ad: g.ad, ogretir: g.ogrettigi, tur: "gorev", adres: `lab/#kar/${g.kimlik}`, enCokYildiz: 3, anahtar: g.kimlik }))
    },
    {
      kimlik: "cizgi", ad: "Çizgi İzleyen Robot", robot: "SiroLine", seviyeler: ["ortaokul", "lise"],
      aciklama: "Sekiz sensörü oku, iki motoru yönet: koşuldan oransal dönüşe, oradan PID'ye.",
      dersler: [
        ...CIZGI_DERSLERI.map(dersOgesi),
        ...CIZGI_GOREVLERI.map((g) => ({ kimlik: g.kimlik, ad: g.ad, ogretir: g.ogretir, tur: "gorev" as const, adres: `lab/#cizgi/${g.kimlik}`, enCokYildiz: 3, anahtar: "cizgi-" + g.kimlik })),
        { kimlik: "kurulum", ad: "3D kurulum rehberi", ogretir: "SiroLine'ı parça parça kur", tur: "rehber", adres: "lab/#cizgi/kurulum", enCokYildiz: 0, anahtar: "siro-kurulum" },
        { kimlik: "ayar", ad: "Ayar atölyesi", ogretir: "Kp, Kd ve hızla serbest deney", tur: "serbest", adres: "lab/#cizgi/ayar", enCokYildiz: 0, anahtar: "" }
      ]
    },
    {
      kimlik: "labirent", ad: "Labirent Ustası", robot: "RizBot", seviyeler: ["ortaokul", "lise"],
      aciklama: "Duvar sensörleri, sağ el kuralı, çıkmazlar, ada ve hız; sonunda MEB ölçülerinde yarışma pisti.",
      dersler: [
        ...LABIRENT_DERSLERI.map(dersOgesi),
        ...LABIRENT_GOREVLERI.map((g) => ({ kimlik: g.kimlik, ad: g.ad, ogretir: g.ogrettigi, tur: "gorev" as const, adres: `lab/#labirent/${g.kimlik}`, enCokYildiz: 3, anahtar: g.kimlik }))
      ]
    },
    {
      kimlik: "sumo", ad: "Mini Sumo", robot: "Kenshin", seviyeler: ["ortaokul", "lise"],
      aciklama: "Kurallar, sensörler, itme fiziği ve strateji; sonunda sınıf ligi.",
      dersler: [...SUMO_DERSLERI.map(dersOgesi), { kimlik: "lig", ad: "Ligde yarış", ogretir: "Robotunu yaz ve kaydet", tur: "lig", adres: "lab/#lig", enCokYildiz: 0, anahtar: "lig" }]
    }
  ]
};
