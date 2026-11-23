# Faz P6a · Lab 3D: SiroLine çizgi izleyen robot (ilk dilim)

**Not:** Nur yönü onayladı ("elimizden gelen en gerçekçi ve birebiri yapalım"). Ölçü ve görünüş, akademinin mağaza fotoğraflarından alınır (sivasrobotik.com.tr, SiroLine Pleksi ürün sayfası). Çizim dosyaları canlıya geçiş kararından sonra istenecek; o zaman model ölçüleri dosyalara göre düzeltilir.

## Amaç

Lab'in 3D'ye geçişinin **ilk dilimi**, son kalitesinde. Akademinin kendi robotu **SiroLine Pleksi** tarayıcıda 3D olarak durur. Çocuk Python'la onun çizgi izleme programını yazar ve robotu yarışma pistinde koşturur.

Bu dilim onaylanmadan Kar Küreme, Lig ve diğer robotlar 3D'ye taşınmaz.

## Neden bu robot

- Akademinin sattığı ve derste kullandığı robot. Çocuk ekranda denediğini masadaki gerçeğinde de çalıştırır.
- Çizgi izleme, sensör okumadan PID'ye kadar ilkokul sonundan ortaokula uzanan bir konu. Plandaki "Robotun Ayarı" etkinliğinin çekirdeği.
- Tinkercad'de yok: orada devre kurulur, burada robot pistte karar verir ve sensör verisi okunur.

## Model (ölçüler mağaza fotoğrafından; 21,5 × 17,5 cm)

Bütün parçalar Three.js ile kodla üretilir; dışarıdan model ya da görsel dosyası yok.

| Parça | Görünüş |
|---|---|
| Gövde | Siyah parlak pleksi. Arkada geniş gövde, ortada dar boyun, önde C biçimli sensör kolu. |
| Sensör kolu | Sarı 3D baskı (PLA), uçları öne kıvrık. Altında aynı biçimde siyah pleksi; iki şeffaf kayma topu. |
| Sensör kartı | Kırmızı kart, 8 kızılötesi sensör, siyah pin başlığı. Gökkuşağı renkli şerit kablo boyundan geçip siyah bantla tutturulur. |
| Kontrol | Siyah kalkan kartı (pirinç aralayıcılar üstünde), mavi Arduino Nano benzeri kart, kırmızı motor sürücü, beyaz JST soket. Marka logosu yok. |
| Motorlar | İki sarı redüktörlü (TT) motor, gümüş motor gövdesi, kırmızı-siyah kablolar. |
| Tekerlekler | Krem rengi geniş lastik, 4 trapez delikli sarı jant. |
| Pil | İki mavi 18650 hücre, siyah yuvada. |

## Simülasyon (`packages/robot-motoru/src/cizgi.ts`)

- Birim milimetre ve saniye. Diferansiyel sürüş, motor tepkisinde gecikme var; fizik adımı 5 ms.
- Çocuğun döngüsü Arduino'daki gibi 20 ms'de bir çalışır.
- Sensörler 0 (beyaz) ile 1000 (siyah) arası değer verir. Pistteki çizgi 19 mm genişliğinde siyah bant.
- Sensör gürültüsü sabit tohumlu. **Aynı kod her seferinde aynı turu verir.**
- Pist, düz ve yay parçalarından tanımlanan kapalı bir yoldur.
  - Tur ilerlemesi yol üzerindeki izdüşümle ölçülür.
  - 1 saniyeden uzun süre bütün sensörler beyazsa robot "çizgiden çıktı" sayılır.
  - Robot halının dışına çıkarsa da tur biter.
- Çıktı, kare kare bir iz. 3D sahne bu izi oynatır.

## Python arayüzü

```python
def kurulum():          # isteğe bağlı, bir kez
    pass

def dongu():            # 20 ms'de bir
    s = sensorler()     # 8 değer, soldan sağa, 0 beyaz – 1000 siyah
    k = cizgi_konumu()  # -100 (çizgi solda) … 0 (ortada) … 100 (sağda)
    motorlar(150, 150)  # sol ve sağ motor, -255 … 255 (Arduino analogWrite gibi)
```

Modül düzeyindeki değişkenler çağrılar arasında korunur; PID'nin "son hata" değeri gibi. Her çağrıda adım sınırı var; sonsuz döngü durdurulur. Hatalar Türkçe ve satır numaralı.

## Görevler (bu dilimde 3)

| # | Pist | Öğrettiği | Yıldız |
|---|---|---|---|
| 1 | Oval | İki sensörle karar: çizgi soldaysa sola dön | Turu bitir |
| 2 | S virajlı pist | Sensör dizisi ve `cizgi_konumu()` ile oransal dönüş | Turu bitir, süre |
| 3 | Yarış pisti (keskin viraj + uzun düzlük) | PID: hız ile kararlılık dengesi | Süre sınırları: 1, 2, 3 yıldız |

Her görevin örnek çözümü birim testinde yıldızlarıyla doğrulanır.

## Ekran

- **Sahne:**
  - stüdyo ışığı, yumuşak gölge, ortam yansıması, ACES ton eşleme;
  - beyaz yarışma halısı ve siyah bant;
  - halının çevresinde açık gri ızgaralı zemin.
- **Kamera:** serbest döndürme ve robotu arkadan izleme. Başlangıçta robotun etrafında kısa bir tanıtım dönüşü yapılır.
- **Robotun hareketi:** tekerlekler gidilen yola göre döner. Sensörlerin altında, çizgiyi gördüklerinde kırmızı ışık yanar.
- **Canlı sensör paneli:** 8 sensörün değerleri çubuk grafik olarak gösterilir; sol ve sağ motor gücü ile süre de yanında. Veri okuma etkinliğin parçasıdır.
- **Oynatma:** 1× ve 2× hız, tekrar izleme.
- **Kalite:** ilk saniyelerde kare hızı ölçülür, gerekirse gölge ve çözünürlük düşürülür. WebGL yoksa anlaşılır bir mesaj gösterilir.
- **Yükleme:** Three.js yalnızca bu ekran açılınca yüklenir; Lab'in açılışı yavaşlamaz.
- Lab ana ekranına üçüncü kart: "Çizgi İzleyen Robot · SiroLine".

## Yapmayacaklarımız

- Kar Küreme ve Lig'i bu dilimde 3D'ye taşımak (dilim onaylanınca, P6b).
- Kenshin, RizBot ve Robofutbol modelleri (sonraki dilimler).
- Gerçekçi fizik motoru (sürtünme, kayma, çarpışma). Kinematik model yeterli ve deterministik.
- Mağaza fotoğraflarını platforma koymak. Yalnızca ölçü ve görünüş referansıdır.
- Marka logosu çizmek.
- Kurs depolarına dokunmak.

## Bitti tanımı

- [x] Motor testleri: deterministiklik, sensör değerleri, çizgiden çıkma, tur tamamlama, üç görevin örnek çözümü ve yıldızları.
- [x] Python köprüsü testleri: `dongu` ve `kurulum`, Türkçe hata, adım sınırı.
- [x] 3D ekran uçtan uca testte üç boyutta açılıyor; görev 1'in örnek çözümü tur bitiriyor; konsol hatası yok.
- [x] Model, mağaza fotoğraflarıyla yan yana göz kontrolünden geçti; ekran görüntüleri Nur'a gönderildi. (Nur'un onayı bekleniyor.)
- [x] Derleme, birim, veritabanı ve uçtan uca testler yeşil.

## Uygulama notları

- Teker çapı P6b'de 44 mm'den 37 mm'ye düzeltildi (kitin enkoder bloğu: 3,7 cm).

- Fizikte savrulma denendi ama bu boyut ve hızda hiç devreye girmediği için çıkarıldı. Fark yaratan şeyler: motor gecikmesi (0,14 sn), ölü bölge ve sensörün aksın 168 mm önünde olması.
- Yıldız süreleri, örnek çözümler ve tipik çocuk kodlarıyla ölçülerek seçildi:
  - yarış pistinde yalnız P ile tam hız 2 yıldız alır;
  - PD 3 yıldız alır;
  - başlangıç kodu 1 yıldız alır.
- Hareketi azalt açık tarayıcılarda tur oynatılmaz; iz bütün olarak çizilir ve robot son konumunda gösterilir. Uçtan uca testler de bu kipi kullanır.
- Geliştirme için `lab/#vitrin/<açı>` adresi modeli sabit açılardan gösterir. Açılar: `on-sag`, `yan`, `ust`, `arka`, `yakin`, `on`, `kapak`. Kapak görseli (`kapak-siroline.webp`) buradan alındı.
