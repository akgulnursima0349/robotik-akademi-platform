# Faz P6e · RizBot Labirent (3D)

**Not:** "Hepsi sırayla" kararının son dilimi.
- Nur, 23 Kasım: "RizBot'a da geçebilirsin".
- Nur, 24 Kasım: sınıfta RizBot bulunamadı, "şimdilik kafamızdan yapalım". Spec bu kararla onaylandı.

## Kaynaklar

- **RizBot Maze ürün sayfası** (sivasrobotik.com.tr):
  - Arduino Nano tabanlı, programlanabilir;
  - kızılötesi duvar sensörleri, kalibre edilebilir;
  - vakum fanı (fanlı model seçeneği) ve yüksek devirli motorlar;
  - PID kontrole uygun yapı.
  - Ölçü, sensör sayısı ve teker çapı sayfada yok.
  - Site otomatik okumayı bir doğrulama ekranıyla engelliyor; ürün fotoğraflarına bakılamadı.
- **MEB Robot Yarışması 2026 · Labirent Ustası şartnamesi:**
  - Hücre 20 × 20 cm; pist 8 × 16 hücre.
  - Duvar 8 cm yüksek, 18 mm kalın; parlak beyaz ahşap. Zemin mat siyah ahşap.
  - Başlangıç ve bitiş 20 × 20 cm. Bitiş hücresinde bitiş sensörü için beyaz alan var; robot orada 5 sn kalmalı.
  - İlk tur 90 sn, final 60 sn. Deneme turu yok. Müdahale başına 10 sn ceza.
  - Bitiremeyen robot: 200 + (16 − ulaştığı satır) × 10 puan.
  - Robotta kablosuz bağlantı ve ayar anahtarı yasak; yalnız başlatma düğmesi olabilir.

## Amaç

Lab'e dördüncü 3D etkinlik: çocuk RizBot'u Python'la programlar, MEB pistinin aynısı olan 3D labirentte yarıştırır. Çizgi izleyende "kontrol" (PID) öğreniliyordu, sumoda "strateji"; burada öğrenilen **algoritma**: duvar takibi (sağ el kuralı), çıkmazı hatırlama, en kısa yol.

## Robot modeli (`sahne3d/rizbot.ts`)

- **Ölçü ve fotoğraf yok:** sınıfta RizBot bulunamadı. Model, ürün sayfasındaki bilgilerle **tipik bir yarışma labirent robotu** olarak tasarlandı.
  - Arduino Nano;
  - kızılötesi duvar sensörleri: ileri bakan iki, yanlara bakan iki;
  - iki mikro redüktörlü motor ve silikon teker;
  - altta vakum fanı (fanlı model);
  - 2S LiPo.
- **Boyut:** yaklaşık 11 × 9,5 cm. 20 cm'lik hücrede rahat döner.
- Kod içinde ve "Nasıl çalışır" notunda "temsilî model" diye belirtilir.
- **İleride:** sınıftaki robot bulununca fotoğraf ve kumpas ölçüleriyle Kenshin'deki gibi yeniden yapılır.
- Marka yazıları çizilmez.

## Simülasyon (`packages/robot-motoru/src/labirent.ts`)

- **Pist:** hücre ızgarası; her hücrenin dört kenarında duvar var/yok. Ölçüler MEB'den: hücre 200 mm, duvar 18 mm.
- **Robot hareketi:** hücre hücre ilerler (ileri bir hücre, sola ya da sağa 90°, geri dön). Süre robotun hızından hesaplanır:
  - düz gidiş ivmelenerek;
  - art arda düz hücreler bir dönüşten daha hızlı.
  - Böylece "daha az dönüşlü yol daha hızlı" gerçek robottaki gibi ortaya çıkar.
- **Sensörler:** üç kızılötesi duvar sensörü (sol, ön, sağ): bulunulan hücrenin o kenarında duvar var mı.
  - Gerçek robotta çapraz sensör olabilir; Nur'un fotoğraflarına göre güncellenir.
- **Hatalar:** duvara doğru `ileri()` → robot çarpar, deneme biter. Süre sınırı aşılırsa MEB'deki gibi "bitiremedi".
- **Sonuç:** süre, ulaşılan en uzak satır, MEB puanı, hücre izi (3D tekrar için).
- Deterministik: aynı kod ve aynı labirent, her seferinde aynı sonuç.

## Python arayüzü

Kar Küreme'deki komut stiline yakın, yeni olan "sensör":

```python
while not bitti():
    if not duvar_sag():
        saga_don()
        ileri()
    elif not duvar_on():
        ileri()
    else:
        sola_don()
```

- **Komutlar:** `ileri()`, `sola_don()`, `saga_don()`, `geri_don()`.
- **Sensörler:** `duvar_on()`, `duvar_sol()`, `duvar_sag()` → True/False; `bitti()` → bitiş hücresinde mi.
- **Sonraki görevler:**
  - `konum()` → (sütun, satır);
  - `yon()` → "K"/"D"/"G"/"B";
  - çıkmazı hatırlamak için liste ve sözlük.
- **Adım sınırı:** sonsuz döngüye karşı, Kar Küreme'deki gibi.

## Görevler (yaklaşık; Nur'un sınıftaki sırasına göre değişebilir)

1. **İlk koridor:** düz yol ve bir köşe. Sensörsüz komutlarla.
2. **Duvara bak:** aynı koridor, ama kod duvar sensörüyle karar versin. Farklı labirentte de çalışmalı; iki labirentte birden denenir.
3. **Sağ el kuralı:** dallı bir labirent.
4. **Çıkmazlar:** sağ el kuralının uzun yoldan gittiği labirent. Yıldız süreye bağlı.
5. **Ada:** bitiş, duvarlara bağlı olmayan bir "ada"nın içinde. Sağ el kuralı sonsuza kadar döner. Çocuk konumu hatırlamayı öğrenir.
6. **MEB pisti:** 8 × 16, 90 sn sınır, MEB puanlaması.

- **Yıldızlar:** bitirdi, süre sınırının altında, iki labirentte birden çalıştı (genelleme). Kesin sınırlar örnek çözümle ölçülüp yazılır.

## 3D sahne (`sahne3d/labirent-sahnesi.ts`)

- **Pist:** mat siyah zemin, parlak beyaz duvarlar (gerçek oranlarla), başlangıç hücresi, bitişte beyaz alan.
- **Kamera:** küçük labirentlerde bütün pist kadrajda; MEB pistinde robotu izleyen kamera; fareyle döndürülebilir.
- **Tekrar:** robot hücre hücre hareket eder.
  - Sensörlerin duvarı gördüğü anlar kısa ışık çizgisiyle gösterilir.
  - Geçilen hücreler zeminde soluk iz bırakır; çıkmaza giriş görünür olsun diye.
- **Ekran:** Kar Küreme'nin düzeni. Sağda sahne ve sayaç (süre, MEB puanı), solda görev, kod, Çalıştır.
- **Lab ana sayfası:** yeni kart "Labirent Ustası · RizBot"; kapak 3D sahneden.

## Yapmayacaklarımız

- **Mikro fare akış (flood fill) algoritmasını hazır vermek:** çocuk kendi yazar, en fazla son görevde ipucu verilir.
- **Sürekli fizik:** duvara sürtünme ve PID'li ortalama simüle edilmez. Hareket hücre düzeyinde.
- **Vakum fanı:** simülasyonda yok; yalnızca modelde parça olarak görünür.
- **Gerçek ölçü iddiası:** temsilî modelin ölçüleri gerçek RizBot'unkiymiş gibi sunulmaz.
- **Sumo ligi gibi sınıf ligi:** labirentte sınıf içi sıralama ileride düşünülür.

## Bitti tanımı

- [x] Labirent motoru birim testleri: duvar algılama, çarpma, süre hesabı, MEB puanı, adım sınırı, determinizm.
- [x] Altı görevin örnek çözümleri testte yıldız alıyor; "ada" görevinde sağ el kuralı bitiremiyor.
- [x] 3D sahne: pist MEB ölçüleriyle, temsilî RizBot modeli; göz kontrolünden geçti.
- [x] Uçtan uca testler masaüstü, tablet ve telefonda yeşil; konsol hatası yok.
- [ ] Ekran görüntüleri Nur'a gönderildi, onay alındı.

## Varsayılan kararlar (Nur'un yanıtı gelene kadar)

- Sınıfta RizBot yok. Model temsilî.
- Fanlı model: fan modelde görünür, simülasyonu etkilemez.
- Kodlama seviyesi: hücre komutları ve duvar sensörleri. Ortaokul seviyesi; Kar Küreme ile tutarlı.
- Görev sırası yukarıdaki gibi. Nur değiştirmek isterse görev listesi değişir, motor değişmez.
