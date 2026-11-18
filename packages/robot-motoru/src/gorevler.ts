/* Kar Küreme görevleri: kolaydan zora. Her görevin örnek çözümü testte 3 yıldız alır. */
import type { Gorev } from "./kar-kureme";

const KOMUT_TEMEL = ["ileri()", "sola_don()", "saga_don()"];

export const GOREVLER: Gorev[] = [
  {
    kimlik: "ilk-sokak", sira: 1, ad: "İlk sokak", ogrettigi: "Sıralı komutlar",
    hikaye: "Gece kar yağdı! Mahallenin ilk sokağı bembeyaz. Robotu ileri sürüp sokağı aç.",
    haritalar: [["#######", "#R....#", "#######"]], yon: 1, batarya: 20, enerjiSiniri: 8, satirSiniri: 4,
    komutlar: ["ileri()"],
    baslangicKodu: "# Robotu bir kare ilerlet:\nileri()\n",
    ipucu: "Sokakta 4 karlı kare var. Her ileri() bir kare gider.",
    cozum: "ileri()\nileri()\nileri()\nileri()\n"
  },
  {
    kimlik: "kose", sira: 2, ad: "Köşeyi dön", ogrettigi: "Dönüş komutları",
    hikaye: "Sokak köşeden aşağı iniyor. Köşeye gelince robotu döndür.",
    haritalar: [["#######", "#R...##", "####.##", "####.##", "####.##", "#######"]], yon: 1, batarya: 30, enerjiSiniri: 12, satirSiniri: 7,
    komutlar: KOMUT_TEMEL,
    baslangicKodu: "ileri()\n",
    ipucu: "Robot doğuya bakıyor. Üç kare git, sonra aşağı (güneye) dönmek için saga_don() yaz.",
    cozum: "ileri()\nileri()\nileri()\nsaga_don()\nileri()\nileri()\nileri()\n"
  },
  {
    kimlik: "uzun-cadde", sira: 3, ad: "Uzun cadde", ogrettigi: "for döngüsü",
    hikaye: "İstasyon Caddesi çok uzun: tam 14 kare! Her adımı tek tek yazmak yerine döngü kullan.",
    haritalar: [["#################", "#R..............#", "#################"]], yon: 1, batarya: 40, enerjiSiniri: 28, satirSiniri: 2,
    komutlar: ["ileri()", "for i in range(...):"],
    baslangicKodu: "for i in range(3):\n    ileri()\n",
    ipucu: "range(3) içindekini 3 kez yapar. Caddede kaç karlı kare var?",
    cozum: "for i in range(14):\n    ileri()\n"
  },
  {
    kimlik: "okul-yolu", sira: 4, ad: "Okul yolu", ogrettigi: "İç içe döngüler",
    hikaye: "Okulun etrafındaki yol bir kare gibi. Bütün çevreyi temizleyip başladığın yere dön.",
    haritalar: [["#########", "#R......#", "#.#####.#", "#.#####.#", "#.......#", "#########"]], yon: 1, batarya: 50, enerjiSiniri: 35, satirSiniri: 7,
    komutlar: [...KOMUT_TEMEL, "for i in range(...):"],
    baslangicKodu: "for j in range(6):\n    ileri()\nsaga_don()\n",
    ipucu: "Uzun kenar 6, kısa kenar 3 kare. Uzun kenar + dön + kısa kenar + dön; bunu 2 kez yap.",
    cozum: "for i in range(2):\n    for j in range(6):\n        ileri()\n    saga_don()\n    for j in range(3):\n        ileri()\n    saga_don()\n"
  },
  {
    kimlik: "sokak-sonu", sira: 5, ad: "Sokak nerede bitiyor?", ogrettigi: "while ve sensör",
    hikaye: "Üç farklı sokak var ve uzunluklarını bilmiyoruz. Robotun önü açık olduğu sürece ilerlesin.",
    haritalar: [
      ["############", "#R.........#", "############"],
      ["#######", "#R....#", "#######"],
      ["################", "#R.............#", "################"]
    ], yon: 1, batarya: 40, enerjiSiniri: 18, satirSiniri: 2,
    komutlar: ["ileri()", "onu_acik()", "while ...:"],
    baslangicKodu: "if onu_acik():\n    ileri()\n",
    ipucu: "if bir kez bakar. while ise koşul doğru olduğu sürece tekrar eder: while onu_acik():",
    cozum: "while onu_acik():\n    ileri()\n"
  },
  {
    kimlik: "sarj-molasi", sira: 6, ad: "Şarj molası", ogrettigi: "Batarya planlama",
    hikaye: "Fabrika Caddesi 18 kare ve batarya buna yetmiyor. Yolun ortasındaki şarj istasyonuna uğramadan bitiremezsin.",
    haritalar: [["######################", "#R..................##", "##########S##########"]], yon: 1, batarya: 24, enerjiSiniri: 38, satirSiniri: 10,
    komutlar: [...KOMUT_TEMEL, "batarya()", "print(...)", "for i in range(...):"],
    baslangicKodu: "for i in range(9):\n    ileri()\nprint(batarya())\n",
    ipucu: "İstasyon yolun altında, 9. adımdan sonra. Aşağı dön, istasyona gir (batarya dolar), geri yukarı çık, tekrar doğuya dön ve kalan 9 kareyi aç.",
    cozum: "for i in range(9):\n    ileri()\nsaga_don()\nileri()\nsaga_don()\nsaga_don()\nileri()\nsaga_don()\nfor i in range(9):\n    ileri()\n"
  }
];
