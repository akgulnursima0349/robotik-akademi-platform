# Faz P6d · Kar Küreme 3D

**Not:** Nur'un "hepsi sırayla" onayıyla (23 Kasım). Nur: "sen kar küremeyi yap da ben kenshine bakıyım".

## Amaç

Kar Küreme görevleri (motor, görevler, Python, yıldızlar aynı) PixiJS izometrik çizimden **3D maket sahnesine** taşınır. Böylece Lab'in bütün etkinlikleri tek sanat stilinde olur.

## Sahne (`apps/lab/src/sahne3d/kar-sahnesi.ts`)

- **Maket:** karlı bir Sivas mahallesi. Bir ızgara karesi 16 cm; ahşap kenarlı taban.
- **Binalar:**
  - arka sırada 2–4 katlı apartmanlar;
  - içeride 1–2 katlı evler ve apartmanlar; tek katlı evlerin beşik çatısı karlı;
  - pencerelerin bir kısmı sıcak ışıklı;
  - kameraya bakan ön sırada bina yok: bahçe çiti ve karlı çamlar. Sokaklar kapanmaz.
  - Çeşitlilik konuma bağlı sabit hash: her açılışta aynı mahalle.
- **Sokaklar:** asfalt, şerit çizgisi, binaya bakan kenarlarda kaldırım.
  - Karlı karelerde 1,6 cm kar örtüsü; komşu karelerle birleşir.
  - Şarj istasyonu: yeşil ışıklı ped ve direk.
- **Robot:** turuncu gövde, sarı bıçak, paletler, dönen tepe lambası.
  - Lamba ve ekran rengi duruma göre: normal turuncu, şarjda yeşil, batarya bitince kırmızı.
- **Hareket:**
  - Kar küreme: örtü erir, kar iki yana savrulur (parçacık).
  - Çarpma: robot geri sekmesi ve kamera sarsıntısı.
  - Gökten kar yağar. Hareketi azalt açıksa animasyon ve yağış yok.
- **Kamera:**
  - Maket görüş açısına göre kadraja sığdırılır.
  - Uzun caddelerde (en > 2,5 × boy) robotu izler.
  - Fare ya da parmakla döndürülebilir.
- **Arayüz:** API eski PixiJS sahnesiyle aynı (`kur`, `yukle`, `oynat`, `sonaGit`, `durdur`, `hiz`, `kareDinle`, `yokEt`). Ekran ve uçtan uca testler değişmeden çalışır.

## Kaldırılanlar

- PixiJS bağımlılığı, `sahne/` klasörü (izometrik çizim, parçacıklar) ve `kapaklar.ts` (SVG kapaklar).
- Kar Küreme kartının kapağı artık 3D sahneden alınmış görsel.

## Yapmayacaklarımız

- Görevleri, enerji kurallarını, yıldızları değiştirmek.
- Kar küreme robotunu bir kit robotuna benzetmek. Bu bir kurgu araç; akademinin kitlerinde kar küreme robotu yok.

## Bitti tanımı

- [x] Altı görev 3D sahnede açılıyor ve oynuyor; uçtan uca testler (3 boyut) yeşil.
- [x] Uzun caddede kamera robotu izliyor, kare biçimli haritada maket kadraja sığıyor.
- [ ] Ekran görüntüleri Nur'a gönderildi, onay bekleniyor.
