/* RizBot labirent görevleri: kolaydan zora. Her görevin örnek çözümü testte 3 yıldız alır.
   Hücre 20 cm (MEB). Robot her görevde kuzeye (yukarı) bakarak başlar; başlangıç satırı en alttadır. */
import { labirentUret, type LabirentGorevi } from "./labirent";

const HAREKET = ["ileri()", "sola_don()", "saga_don()"];
const SENSOR = ["duvar_on()", "duvar_sol()", "duvar_sag()", "bitti()"];

const SAG_EL = `while not bitti():
    if not duvar_sag():
        saga_don()
        ileri()
    elif not duvar_on():
        ileri()
    else:
        sola_don()
`;

/** Bitişi duvarlara bağlı olmayan bir "ada"nın içinde: duvar takibi sonsuza kadar dışarıda döner. */
const ADA = [
  "+---+---+---+---+---+",
  "|                   |",
  "+   +---+   +---+   +",
  "|   |           |   |",
  "+   +   +   +   +   +",
  "|   |     F     |   |",
  "+   +   +   +   +   +",
  "|   |           |   |",
  "+   +---+---+---+   +",
  "| B                 |",
  "+---+---+---+---+---+"
];

export const LABIRENT_GOREVLERI: LabirentGorevi[] = [
  {
    kimlik: "lb-ilk-koridor", sira: 1, ad: "İlk koridor", ogrettigi: "Hareket komutları",
    hikaye: "RizBot labirentin başında, yukarı bakıyor. Bitiş hücresindeki beyaz alana kadar sür. Her ileri() bir hücre (20 cm) gider.",
    haritalar: [[
      "+---+---+---+",
      "|   |     F |",
      "+   +   +---+",
      "|       |   |",
      "+---+   +   +",
      "| B         |",
      "+---+---+---+"
    ]],
    sureSiniri: 30, yildizSuresi: 3.5, satirSiniri: 7,
    komutlar: [...HAREKET, "geri_don()"],
    baslangicKodu: "saga_don()\nileri()\n",
    ipucu: "Önce sağa dön ve bir hücre git. Sonra sola dönüp yukarı iki hücre çık, en son sağa dön.",
    cozum: "saga_don()\nileri()\nsola_don()\nileri()\nileri()\nsaga_don()\nileri()\n"
  },
  {
    kimlik: "lb-duvara-bak", sira: 2, ad: "Duvara bak", ogrettigi: "Sensör ve while",
    hikaye: "İki farklı koridor var, ikisinde de aynı kod çalışmalı. RizBot'un önünde ve yanlarında kızılötesi duvar sensörleri var: önü açıksa ilerlesin, kapalıysa açık tarafa dönsün.",
    haritalar: [
      [
        "+---+---+---+---+",
        "| F |           |",
        "+   +   +---+   +",
        "|   |   |       |",
        "+   +   +   +---+",
        "|       |       |",
        "+---+---+---+   +",
        "| B             |",
        "+---+---+---+---+"
      ],
      [
        "+---+---+---+---+---+",
        "|               | F |",
        "+   +---+---+   +   +",
        "|   |       |       |",
        "+   +   +   +---+---+",
        "| B |   |           |",
        "+---+---+---+---+---+"
      ]
    ],
    sureSiniri: 40, yildizSuresi: 12, satirSiniri: 7,
    komutlar: [...HAREKET, ...SENSOR, "while ...:", "if ...:"],
    baslangicKodu: "while not bitti():\n    if not duvar_on():\n        ileri()\n",
    ipucu: "Önü kapalıysa ne yapmalı? elif not duvar_sag(): ile sağa, else: ile sola dön.",
    cozum: "while not bitti():\n    if not duvar_on():\n        ileri()\n    elif not duvar_sag():\n        saga_don()\n    else:\n        sola_don()\n"
  },
  {
    kimlik: "lb-sag-el", sira: 3, ad: "Sağ el kuralı", ogrettigi: "Duvar takibi algoritması",
    hikaye: "Artık yol ayrımları ve çıkmazlar var. Labirentte kaybolmamanın eski bir yolu: sağ elini duvardan hiç ayırmadan yürü. Sağ açıksa sağa dön, değilse düz git, o da değilse sola dön.",
    haritalar: [labirentUret(5, 5, 4), labirentUret(5, 5, 7)],
    sureSiniri: 60, yildizSuresi: 15, satirSiniri: 8,
    komutlar: [...HAREKET, ...SENSOR, "while ...:", "if ...:"],
    baslangicKodu: "while not bitti():\n    if not duvar_sag():\n        saga_don()\n        ileri()\n",
    ipucu: "Sıra önemli: önce sağa bak, sonra öne. İkisi de kapalıysa sola dön ve bir sonraki turda yeniden bak.",
    cozum: SAG_EL
  },
  {
    kimlik: "lb-hangi-el", sira: 4, ad: "Hangi el?", ogrettigi: "Algoritmaları karşılaştırmak",
    hikaye: "Bu labirentte sağ el kuralı bitişi bulur ama çok dolaşır. Yarışmada her saniye önemli: sol el kuralını dene, hangisi daha hızlı?",
    haritalar: [labirentUret(6, 6, 9)],
    sureSiniri: 60, yildizSuresi: 20, satirSiniri: 8,
    komutlar: [...HAREKET, ...SENSOR, "while ...:", "if ...:"],
    baslangicKodu: SAG_EL,
    ipucu: "Sağ el kuralındaki sağ ve solları yer değiştir: önce solu kontrol et.",
    cozum: "while not bitti():\n    if not duvar_sol():\n        sola_don()\n        ileri()\n    elif not duvar_on():\n        ileri()\n    else:\n        saga_don()\n"
  },
  {
    kimlik: "lb-ada", sira: 5, ad: "Ada", ogrettigi: "Hafıza: sözlük ve konum",
    hikaye: "Bitiş, duvarları dış duvara değmeyen bir adanın içinde. Sağ el de sol el de dışarıda sonsuza kadar döner! RizBot geçtiği hücreleri hatırlasın ve en az gittiği yönü seçsin.",
    haritalar: [ADA],
    sureSiniri: 60, yildizSuresi: 20, satirSiniri: 19,
    komutlar: [...HAREKET, "geri_don()", "duvar(\"sag\")", "konum()", "komsu(\"sag\")", "bitti()", "while ...:", "for ... in ...:"],
    baslangicKodu: "ziyaret = {}\nwhile not bitti():\n    k = konum()\n    ziyaret[k] = ziyaret.get(k, 0) + 1\n    print(k, ziyaret[k])\n    ileri()\n",
    ipucu: "duvar(\"sag\") sağda duvar var mı der; komsu(\"sag\") sağdaki hücrenin konumunu verir. Açık yönler arasında ziyaret[komsu(yön)] sayısı en küçük olanı seç; hiçbiri açık değilse geri_don().",
    cozum: `ziyaret = {}
while not bitti():
    k = konum()
    ziyaret[k] = ziyaret.get(k, 0) + 1
    secim = "geri"
    en_az = 1000
    for taraf in ["sag", "on", "sol"]:
        if not duvar(taraf):
            n = ziyaret.get(komsu(taraf), 0)
            if n < en_az:
                secim = taraf
                en_az = n
    if secim == "sag":
        saga_don()
    elif secim == "sol":
        sola_don()
    elif secim == "geri":
        geri_don()
    ileri()
`
  },
  {
    kimlik: "lb-meb", sira: 6, ad: "MEB pisti", ogrettigi: "Yarışma provası",
    hikaye: "Gerçek boyutlu yarışma pisti: 8 × 16 hücre, 90 saniye. Bitiremezsen puanın ulaştığın satıra göre hesaplanır (MEB Labirent Ustası kuralı). Finaldeki gibi 60 saniyenin altına inebilir misin?",
    haritalar: [labirentUret(8, 16, 1)],
    sureSiniri: 90, yildizSuresi: 60, satirSiniri: 19, meb: true,
    komutlar: [...HAREKET, "geri_don()", ...SENSOR, "duvar(\"sag\")", "konum()", "komsu(\"sag\")"],
    baslangicKodu: "# Önceki görevlerdeki algoritmalardan birini seç ya da kendininkini yaz.\n",
    ipucu: "Önce sağ el ve sol el kuralını ayrı ayrı dene; biri 90 saniyeye sığmayabilir.",
    cozum: SAG_EL
  }
];
