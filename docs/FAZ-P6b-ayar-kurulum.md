# Faz P6b · SiroLine: Ayar Atölyesi ve 3D Kurulum Rehberi

**Not:** Nur "a ve b iyi" diyerek onayladı (23 Kasım).

## Kaynak

SiroLine Pleksi ürün sayfasındaki mBlock ekran görüntüleri:

- **Kart:** Arduino Nano.
- **Sensör:** QTR-8A kızılötesi dizi, A0–A7.
- **Ayar bloğu:** "Ayarla Taban Hız, Ek Hız, Kp, Kd". Örnek değerler: taban 70 ve 100, ek hız 0, Kp 0.04, Kd 0.7.
- **Zemin seçimi:** siyah ya da beyaz.
- **Enkoder:** teker çapı 3,7 cm.
- **Program döngüsü:** sensör oku → PID ile motor güçlerini ayarla → motorları sür.

## Düzeltme (P6a'dan)

- Teker çapı 44 mm değil **37 mm**.
- Model ve simülasyon buna göre güncellenir. Azami hız 600 mm/sn: 7,4 V'ta TT motor yaklaşık 300 devir/dk.
- Yıldız süreleri yeniden ölçülür.

## A · Ayar Atölyesi (`lab/#cizgi/ayar`)

Çocuk kod yazmaz. SiroLine'ın gerçek bloğundaki değerlerle oynar, sonucu pistte görür, bulduğu değerleri masadaki robota aynen girer.

- **Bloklar:** mBlock'taki yeşil bloklara benzeyen bir panel.
  - "Ayarla Taban Hız [100] Ek Hız [0] Kp [0.04] Kd [0.7]";
  - "Zemin [Siyah]".
  - Değerler sayı kutusu ve kaydırıcıyla değişir.
- **Hesap, kitin kütüphanesindeki gibi:**
  - Konum: QTR `readLine` gibi 0–7000; orta 3500. Çizgi kaybolunca son görülen uç alınır.
  - `hata = konum - 3500`, `düzeltme = Kp·hata + Kd·(hata - son_hata)`.
  - `sol = taban + düzeltme`, `sağ = taban - düzeltme`.
  - Zemin "Beyaz" seçilirse okuma ters çevrilir (beyaz çizgi siyah zemin). Bizim halıda robot şaşırır; bu da bir öğrenme anı.
  - **Ek Hız:** çizgi tam ortadayken (|hata| < 500) tabana eklenir. Bu yorum kitin kütüphanesiyle doğrulanmadı; Nur'a sorulacak.
- **Deneme tablosu:** her denemede taban, Kp, Kd, süre ve ortalama sapma (mm) bir satır olur. En iyi deneme işaretlenir. Çocuk deneylerini karşılaştırır: bilimsel yöntem.
- **Sapma grafiği:** son denemenin çizgiden sapması zamana göre çizilir. Sallanma gözle görülür. Tek seri ve tek eksen; dökümanı dataviz kuralları.
- **"Robotuna aktar" kutusu:** bloğa girilecek değerler, mBlock'taki sırayla.

## B · 3D Kurulum Rehberi (`lab/#cizgi/kurulum`)

Robot adım adım kurulur. O adımın parçaları yukarıdan inip yerine oturur, kamera ilgili bölgeye döner.

| # | Adım | Ne öğretir |
|---|---|---|
| 1 | Pleksi şasi | Robotun iskeleti; hafif ve sağlam |
| 2 | Sensör kolu ve kayma topları | Sensör neden önde: robot virajı önceden görür |
| 3 | Redüktörlü motorlar | Dişliler hızı düşürür, gücü artırır |
| 4 | Tekerlekler | 3,7 cm çap: bir turda 11,6 cm yol |
| 5 | QTR-8A sensör kartı | Kızılötesi ışık beyazdan yansır, siyah yutar |
| 6 | Aralayıcılar ve kalkan kartı | Kartı şasiden yalıtır |
| 7 | Arduino Nano ve motor sürücü | Beyin ve kas: Nano karar verir, sürücü motora güç verir |
| 8 | Pil yuvası | İki hücre, 7,4 V |
| 9 | Kablolar | Şerit kablo sensörü A0–A7'ye bağlar |
| 10 | Hazır | Pistte dene, Ayar Atölyesi |

(Bu tablo ilk taslaktır. Full PCB sürümünün 9 adımı için aşağıdaki düzeltmeye bak.)

- Her adımda kısa bir açıklama ve "Biliyor muydun?" notu var.
- Dört adımda üç şıklı bir soru sorulur; doğru cevapta yeşil onay görünür.
- İleri ve geri düğmeleri, adım noktaları, klavye okları. Hareketi azalt açıksa parçalar animasyonsuz yerine konur.
- Rehber bitince ilerlemeye "kurulum tamam" yazılır.
- **Dürüst not:** montaj sırası genel bir çizgi izleyen kurulumudur; akademinin kendi montaj kılavuzuyla karşılaştırılıp düzeltilecek.

## SiroLine sayfası

Görev listesinin üstünde iki yeni kart olur: "3D Kurulum Rehberi" ve "Ayar Atölyesi". Kod görevleri (3 pist) aynen kalır.

## Yapmayacaklarımız

- Kitin kütüphanesinin bilmediğimiz ayrıntılarını uydurmak (kalibrasyon, enkoder, taktik düğmeleri). Yalnızca ekran görüntüsünde görülenler.
- Tasarım atölyesi, yani parça seçimi (C). Sonraya.
- Kar Küreme ve Lig'i 3D'ye taşımak (P6c).
- Mağaza fotoğraflarını ya da marka logolarını platforma koymak.

## Bitti tanımı

- [x] Motor: 37 mm teker. SiroLine bloğu kitin hesabıyla çalışıyor. Kitin örnek değerleri (taban 100, Kp 0.04, Kd 0.7) oval pisti bitiriyor. Zemin "Beyaz" robotu pistten çıkarıyor. Sapma ölçüsü doğru (birim testleri).
- [x] Ayar Atölyesi: değer değişir, deneme tablosuna satır eklenir, en iyi deneme işaretlenir, grafik çizilir (uçtan uca).
- [x] Kurulum rehberi: 10 adım ileri ve geri, soru doğru/yanlış, klavye, bitişte kayıt (uçtan uca).
- [x] Üç boyutta göz kontrolü; konsol hatası yok; bütün testler yeşil.

## Uygulama notları

- **Kitin değerleriyle sonuç:** Kitin örnek değerleri (taban 100, Kp 0.04, Kd 0.7) üç pisti de bitiriyor. Simülasyonun gerçek robota yakın davrandığına dair iyi bir işaret.
- **Ölçülen hata durumları (birim testinde):**
  - Yüksek hızda düşük Kp ile robot virajda çıkıyor.
  - Aşırı Kd ile motorlar titriyor ve süre doluyor.
  - Zemin "Beyaz" seçilince robot çizgiyi kaybediyor.
- **Dar ekran:** kurulum kamerası dikey ekranda geri çekiliyor ki parça kadraja sığsın.
- **Nur'a sorulacaklar:**
  - "Ek Hız" bloğunun gerçek anlamı;
  - akademinin montaj sırası;
  - kalkan kartının üstten fotoğrafı.

## Sınıftaki robota göre düzeltme (23 Kasım, Nur'un kumpasla ölçtüğü fotoğraflar)

- **Hangi robot:** Sınıftaki robot **SiroLine Full PCB**. Model buna göre baştan yapıldı:
  - gövde siyah devre kartı; tarak kanatlar, kancalı ön plaka;
  - mavi TT motorlar ve beyaz kelepçeler;
  - kırmızı jant, siyah köpük lastik;
  - iki TB6612FNG sürücü ve yan yatık Nano;
  - LiPo pil ve XT30;
  - ön plakanın altında QTR-8A ve pencereden görünen başlığı;
  - boyun ucunda dikey modül.
- **Ölçüler (kumpasla):**
  - teker 36,1 mm;
  - iki teker arası 99,2 mm, iz genişliği 125 mm;
  - arka gövde 94,1 mm, boyun 28 mm, ön kenar 81,1 mm;
  - motor 63 mm, pil 45,6 mm.
  - Sensör aksın 154 mm önünde.
- **"Zemin" bloğunun anlamı düzeltildi:** pistin **zemin** rengidir. Sınıf pisti siyah zemin, beyaz bant; kitin örnek değeri de "Siyah".
  - Ayar Atölyesi artık siyah zeminli, beyaz bantlı pistte çalışıyor.
  - Python görevleri beyaz halı, siyah bant olarak kaldı.
- **Kurulum rehberi:** 9 adım, üç soru. Adımlar: ana kart, QTR-8A, motorlar, tekerlekler, sürücüler, Nano, pil, kablolar, hazır.
- **Nur'a sorulanlar:** boyun ucundaki dikey kartın görevi ve neden iki sürücü olduğu. Rehberde açıklanmadı.
