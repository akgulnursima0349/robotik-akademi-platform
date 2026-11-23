# Faz P6c · Sınıf Robot Ligi → Kenshin Mini Sumo Ligi (3D)

**Not:** Nur "hepsi sırayla" diyerek onayladı (23 Kasım). Sıra: P6c sumo ligi → P6d Kar Küreme 3D → P6e RizBot labirent. Her biri ekran görüntüleriyle onayına sunulur.

## Kaynak (sivasrobotik.com.tr, Kenshin ürün sayfası)

- 10 × 10 cm, 470 g; CNC çelik gövde, önde eğimli çelik bıçak.
- 2 × 15 A motor sürücü; 12 V 800 devir/dk 16 mm motorlar; Arduino Nano.
- 5 rakip sensörü (3 önde, 2 yanda), 2 zemin sensörü.
- Taktiğe göre çalışan geniş bayraklar (iki beyaz bayrak, V biçiminde).
- Fotoğraflar: siyah yan plakalar, fırçalanmış çelik bıçak (alt kenarı sarı), bıçakta 3 sensör penceresi, yeşil kart, küçük geniş tekerlekler (beyaz jant, 6 delik).

## Ne değişir

Kar topu ligi (9×9 ızgara, 60 tur) **kalkar**. Yerine gerçek bir mini sumo maçı gelir. Çocuğun yazdığı şey yine `def hamle(robot):`; robot artık akademinin yarışma robotu Kenshin.

## Simülasyon (`packages/robot-motoru/src/sumo.ts`)

- **Ring (dohyo):** 77 cm çap, siyah zemin, 2,5 cm beyaz kenar; başlangıç çizgileri (mini sumo kuralları).
- **İki katı cisim (10 × 10 cm, 470 g):**
  - tekerlek çekişi ve yana kayma sürtünmesi;
  - motor tepki süresi;
  - azami hız 800 devir/dk × 30 mm teker ≈ 1,26 m/sn.
- **Çarpışma:** kutu-kutu (SAT), itme ve sürtünme.
  - **Bıçak avantajı:** bir robot ötekine önüyle (bıçakla) değerse, ötekinin tekerlek tutuşu düşer (altına girip kaldırma).
- **Sensörler:**
  - rakip: 5 dar ışın (sol yan, sol ön, orta, sağ ön, sağ yan), 60 cm menzil, 0/1;
  - kenar: önde iki zemin sensörü, beyaz kenarı görünce 1.
- **Karar döngüsü:** 20 ms; fizik adımı 2 ms. Deterministik: aynı kodlar, aynı tohum → aynı maç.
- **Maç:** en fazla 3 raunt, raunt başına 10 sn. Halkadan düşen raundu kaybeder; süre biterse raunt berabere.
  - Başlangıç dizilişleri: karşı karşıya, yan yana, sırt sırta. Tohumla küçük açı farkı, iki robota simetrik.
- **Turnuva:** herkes herkesle; galibiyet 3, beraberlik 1 puan; averaj raunt farkı.

## Python arayüzü

```python
def hamle(robot):
    rakip = robot["rakip"]      # [sol_yan, sol_on, orta, sag_on, sag_yan], her biri 0 ya da 1
    kenar = robot["kenar"]      # [sol, sag]: beyaz kenarı görüyorsa 1
    zaman = robot["zaman"]      # raundun başından beri milisaniye
    return 255, 255             # sol ve sağ motor gücü, -255 … 255
```

- Hata Türkçe ve satır numaralı.
- Bir robot hata verirse o raundu durarak geçirir; hata sonuç ekranında gösterilir.
- 5 hazır rakip, kodları okunabilir:
  - **Boğa:** dosdoğru saldırır;
  - **Avcı:** döner, görünce saldırır;
  - **Kurnaz:** yandan dolanır;
  - **Temkinli:** kenardan kaçar, bekler;
  - **Fırıldak:** daire çizer.

## Ekran

- **3D ring sahnesi:**
  - Kenshin modeli kodla çizilir, iki takım rengi (bayraklardaki şerit: kırmızı ve mavi);
  - stüdyo ışığı ve gölge;
  - temas anında kıvılcım ve kısa sarsıntı;
  - halkadan düşen robot aşağı düşer.
- **Skor ve kontroller:** üstte raunt skoru, süre, 1× ve 2× hız; kamera serbest ya da üstten.
- **Liste:** puan tablosu ve maç listesi; maçlar tekrar izlenir.
- **Öğretmen:** öğrencilerin gönderdiği robotlarla sınıf turnuvası (mevcut altyapı).
- **Lab ana kartı:** "Mini Sumo Ligi · Kenshin".

## Yapmayacaklarımız

- Gerçek kitin başlangıç taktikleri ve bayrak mekanizması: ayrıntısı bilinmiyor, uydurulmaz. Bayraklar duruyor.
- Ring dışında itme sonrası yuvarlanma ve devrilme fiziği. Halkadan düşen robot basit bir düşme animasyonuyla gösterilir.
- Eski kar topu ligini ayrıca tutmak. Platform henüz yayında değil, gerçek kullanıcı verisi yok.

## Bitti tanımı

- [x] Motor testleri:
  - deterministiklik;
  - halkadan düşme;
  - çarpışmada itme ve bıçak avantajı;
  - sensör ışınları;
  - kenar sensörü;
  - raunt ve maç puanı;
  - turnuva tablosu;
  - hazır robotların davranışı (Boğa duran robotu iter).
- [x] Python köprüsü: `hamle`, demet ya da liste dönüşü, hata ve adım sınırı.
- [x] Ekran üç boyutta: turnuva, maç tekrarı, öğretmen sınıf turnuvası (uçtan uca).
- [x] Kenshin modeli ürün fotoğraflarıyla yan yana göz kontrolü; ekran görüntüleri Nur'a gönderildi.
- [x] Bütün testler yeşil.

## Uygulama notları

- **Ölçülen davranış:**
  - İki eşit saldırgan önden çarpışınca süre bitiyor (gerçekte de öyle); kazandıran açı almak.
  - Avcı, duran robotu her dizilişte atıyor.
  - Bıçak avantajı yandan ve arkadan girişte devreye giriyor.
- **Hazır rakiplerle turnuva:** 6 robot, 15 maç, Python ile tarayıcıda yaklaşık 3,5 saniye sürüyor ("Maçlar oynanıyor…" yazısı görünüyor).
- **Eski kod:** Eski kar topu ligi kodu (yazı döndüren `hamle`) editöre yüklenmiyor; yerine başlangıç kodu geliyor.
- **Görsel:** Kıvılcım ve kamera sarsıntısı yalnızca görsel; simülasyonu etkilemiyor. Hareketi azalt açıksa kapalı.
- **Kenshin modeli:** ilk sürüm ürün fotoğraflarından. 23 Kasım'da sınıftaki robotun fotoğrafları ve kumpas ölçüleriyle yeniden yapıldı.
  - **Ölçüler:** boy 98,4 mm (tekerlek arkası → bıçak ucu), bıçak eni 100,0 mm, bayrak boyu 149,4 mm.
  - **Gövde:** yanlar açık (yan plaka yok); alt plaka ve yeşil ana kart.
  - **Tekerler:** arkada iki geniş lastik teker, alüminyum göbekli.
  - **İç yerleşim:** ortada dik duran mikro servo; servo ile bıçak arasında yatay 2S LiPo; sağda kızılötesi başlatma modülü; iki yanda yan rakip sensörü.
  - **Bıçak:** bükülmüş çelik; üç sensör penceresi ve aralarında dört vida; üst kenarda iki çentik, köşelerde geriye bükük kanat; alt kenarda parlak şerit ve kapton bant.
  - **Bayraklar:** servonun döndürdüğü iki siyah kolun ucunda beyaz levha. Maç başlamadan dik (yukarıda) durur, başlama işaretiyle ≈0,3 sn'de yana açılır.
    - Gerçekte levhanın ortasında kolun gölgesi gri bir şerit olarak görünür; sahnede bu şerit takım renginde (kırmızı/mavi), iki robot ayırt edilsin diye.
  - Marka yazıları (servo, pil) çizilmez.
  - Kumpasla ölçülen 21,4 mm'nin neyin ölçüsü olduğu Nur'a soruldu.
