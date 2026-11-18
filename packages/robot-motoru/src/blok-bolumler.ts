/* Blok Atölyesi bölümleri. Harita: '#' ağaç, '.' havuç, ' ' çimen yol, 'R' Bit'in başladığı yer. */
export type BlokTuru = "ileri" | "sol" | "sag" | "tekrar";

export interface Bolum {
  kimlik: string; dunya: 1 | 2 | 3; sira: number; ad: string;
  /** Sesli okunan kısa yönerge (en fazla iki cümle) */
  yonerge: string;
  harita: string[]; yon: 0 | 1 | 2 | 3;
  palet: BlokTuru[];
  /** 3 yıldız için en az blok */
  enAz: number;
  /** testte kullanılan en kısa çözüm (kısa yazım: i=ileri, l=sol, r=sag, 3(...)=tekrar) */
  cozum: string;
}

export const DUNYALAR = [
  { no: 1, ad: "Havuç Bahçesi", ogrettigi: "Sıralı komutlar", renk: "#f0a020" },
  { no: 2, ad: "Tekrar Tarlası", ogrettigi: "Tekrarla bloğu", renk: "#22a6a0" },
  { no: 3, ad: "Dolambaçlı Yol", ogrettigi: "Tekrar ve dönüş", renk: "#7a5cf0" }
] as const;

const K: BlokTuru[] = ["ileri", "sol", "sag"];
const T: BlokTuru[] = ["ileri", "sol", "sag", "tekrar"];

export const BOLUMLER: Bolum[] = [
  { kimlik: "1-1", dunya: 1, sira: 1, ad: "İlk adım", yonerge: "Bit havuçları çok sever. İleri git bloğuyla havuçlara ulaş!", harita: ["#####", "#R..#", "#####"], yon: 1, palet: ["ileri"], enAz: 2, cozum: "ii" },
  { kimlik: "1-2", dunya: 1, sira: 2, ad: "Üç havuç", yonerge: "Bu sefer üç havuç var. Kaç blok gerekir?", harita: ["######", "#R...#", "######"], yon: 1, palet: ["ileri"], enAz: 3, cozum: "iii" },
  { kimlik: "1-3", dunya: 1, sira: 3, ad: "Köşe", yonerge: "Yol köşeden aşağı iniyor. Köşede sağa dön!", harita: ["#####", "#R.##", "##.##", "##.##", "#####"], yon: 1, palet: K, enAz: 4, cozum: "irii" },
  { kimlik: "1-4", dunya: 1, sira: 4, ad: "Merdiven", yonerge: "Havuçlar merdiven gibi diziliyor. Bir sağa, bir sola dön.", harita: ["######", "#R.###", "##..##", "###..#", "######"], yon: 1, palet: K, enAz: 9, cozum: "iriliril i".replace(" ", "") },
  { kimlik: "2-1", dunya: 2, sira: 1, ad: "Uzun sıra", yonerge: "Altı havuç! Tekrarla bloğuyla ileri gitmeyi altı kez yap.", harita: ["#########", "#R......#", "#########"], yon: 1, palet: T, enAz: 2, cozum: "6(i)" },
  { kimlik: "2-2", dunya: 2, sira: 2, ad: "Gidiş dönüş", yonerge: "Önce sağa, sonra geri sola. Tekrarla bloğunu iki kez kullan.", harita: ["#######", "#R....#", "#.....#", "#######"], yon: 1, palet: T, enAz: 7, cozum: "4(i)rir4(i)" },
  { kimlik: "2-3", dunya: 2, sira: 3, ad: "Büyük merdiven", yonerge: "Merdiven uzadı. Tekrar eden adımları bul ve tekrarla bloğuna koy.", harita: ["#######", "#R.####", "##..###", "###..##", "####..#", "#######"], yon: 1, palet: T, enAz: 6, cozum: "i3(rili)" },
  { kimlik: "2-4", dunya: 2, sira: 4, ad: "Bahçe çiti", yonerge: "Bahçenin etrafını dolaş. Her kenar aynı mı?", harita: ["######", "#R...#", "#.##.#", "#.##.#", "#....#", "######"], yon: 1, palet: T, enAz: 4, cozum: "4(3(i)r)" },
  { kimlik: "3-1", dunya: 3, sira: 1, ad: "Kıvrım", yonerge: "Yol iki kez kıvrılıyor. Dönüşleri doğru yere koy.", harita: ["#######", "#R....#", "#####.#", "#.....#", "#######"], yon: 1, palet: T, enAz: 8, cozum: "4(i)r2(i)r4(i)" },
  { kimlik: "3-2", dunya: 3, sira: 2, ad: "Ağacın etrafı", yonerge: "Yolda bir ağaç var! Altından dolaşıp diğer havuçlara ulaş.", harita: ["########", "#R..#..#", "###...##", "########"], yon: 1, palet: T, enAz: 11, cozum: "2(i)ril2(i)lir i".replace(" ", "") },
  { kimlik: "3-3", dunya: 3, sira: 3, ad: "Büyük kale", yonerge: "Kalenin surları uzun. Tekrarla bloğunun içine bir tekrarla daha koy.", harita: ["#######", "#R....#", "#.###.#", "#.###.#", "#.###.#", "#.....#", "#######"], yon: 1, palet: T, enAz: 4, cozum: "4(4(i)r)" },
  { kimlik: "3-4", dunya: 3, sira: 4, ad: "Yılan yolu", yonerge: "Son bölüm! Bütün tarlayı yılan gibi dolaş.", harita: ["########", "#R.....#", "#......#", "#......#", "########"], yon: 1, palet: T, enAz: 12, cozum: "5(i)rir5(i)lil5(i)" }
];
