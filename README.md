# Sivas Robotik Akademi Eğitim Platformu

İlkokuldan ortaokula kodlama, yapay zekâ ve robotik eğitimi için tek adresli bir platform. Bütün etkinlikler tarayıcıda çalışır; kurulum gerekmez.

| Kurs | Yaş | İçerik |
|---|---|---|
| **Blok Atölyesi** | 1–3. sınıf | Büyük bloklar, sesli yönergeler, her programın "Bunun Python'u" karşılığı |
| **Python Atölyesi Junior** | 4–6. sınıf | [python-atolyesi-junior](https://github.com/akgulnursima0349/python-atolyesi-junior) |
| **Python Atölyesi** | Ortaokul | [python-atolyesi](https://github.com/akgulnursima0349/python-atolyesi) |
| **Robotik Laboratuvarı** | Junior ve ortaokul | Python ile 3D robot simülasyonları |

**Robotik Laboratuvarı** akademinin kendi robotlarını kullanır:

- **Kar Küreme:** sıralı komutlar, döngüler, sensörler ve enerji planlaması; karlı mahalle maketi.
- **Mini Sumo Ligi:** Kenshin robotu 3D ringde. Sınıf turnuvası; maçlar tekrar izlenebilir.
- **Çizgi İzleyen:** SiroLine 3D pistte. Sensör okuma, motor kontrolü, PID ayar atölyesi, adım adım kurulum rehberi.
- **Labirent Ustası:** RizBot, MEB Labirent Ustası ölçülerindeki pistte. Duvar takibinden hafızalı aramaya.

## Çalıştırma

```sh
git clone --recurse-submodules https://github.com/akgulnursima0349/robotik-akademi-platform
cd robotik-akademi-platform
npm install
npm run demo          # derler ve http://localhost:4173 adresinde açar
```

- **Hesapsız:** `ayarlar/platform.json` yoksa platform hesapsız çalışır; kurslara kartlardan girilir.
- **Deneme (sahte sunucu, internetsiz):** `npm run demo:deneme`. Deneme hesapları giriş ekranında yazar.
- **Tek giriş (Supabase):** `supabase/KURULUM.md`.
- **Sunum akışı:** `docs/DEMO.md`. Derlenmiş demo paketi her başarılı CI çalışmasında *demo-paketi* olarak indirilebilir (yalnızca Node.js gerekir).

## Yapı

```
apps/portal            karşılama, tek giriş, öğretmen ve öğrenci panelleri (Vite + TypeScript)
apps/blok              Blok Atölyesi: blok düzenleyici, SVG sahne, sesli yönerge
apps/lab               Robotik Laboratuvarı: 3D sahneler (Three.js) ve kod editörü
packages/tasarim       ortak tasarım sistemi (örnekler: /ornekler.html)
packages/bulut         oturum ve kurs yönlendirme (Supabase ya da sahte sunucu)
packages/robot-motoru  deterministik simülasyonlar: ızgara, sumo fiziği, çizgi izleyen, labirent
packages/fizik         3D katı cisim fiziği (Rapier, belirlenimci sürüm): sabit adım, kayıt ve tekrar
packages/analitik      ısı haritası, kazanım özeti, etki büyüklüğü, zor bölümler, CSV
packages/python        Skulpt köprüsü: Türkçe hata mesajları, sonsuz döngü koruması
kurslar/junior         python-atolyesi-junior (submodule)
kurslar/ortaokul       python-atolyesi (submodule)
supabase/              veritabanı şeması, satır düzeyi güvenlik, örnek veri, kurulum
test/                  uçtan uca testler (Playwright), veritabanı senaryosu (Postgres 16)
docs/                  mimari ve sunum akışı
```

Ayrıntılar: [docs/MIMARI.md](docs/MIMARI.md).

## Testler

```sh
npm run tip     # TypeScript
npm test        # birim testleri (Vitest)
npm run e2e     # uçtan uca: masaüstü, tablet, telefon (önce derle)
PGHOST=... sh test/db/calistir.sh   # veritabanı senaryosu
```

Her push'ta GitHub Actions tip denetimi, birim testleri, veritabanı senaryosu, derleme ve üç ekran boyutunda uçtan uca testleri çalıştırır.
