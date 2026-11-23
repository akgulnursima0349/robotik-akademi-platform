# Sivas Robotik Akademi Eğitim Platformu

İlkokuldan ortaokula kodlama, yapay zekâ ve robotik eğitimi için tek adresli bir platform.

- **Blok Atölyesi** (1–3. sınıf) · büyük bloklar, sesli yönergeler, "Bunun Python'u"
- **Python Atölyesi Junior** (4–6. sınıf) · [python-atolyesi-junior](https://github.com/akgulnursima0349/python-atolyesi-junior)
- **Python Atölyesi** (ortaokul) · [python-atolyesi](https://github.com/akgulnursima0349/python-atolyesi)
- **Robotik Laboratuvarı** · Kar Küreme görevleri ve Sınıf Robot Ligi (Python, tarayıcıda)

Geliştirme fazlar hâlinde ilerler; her fazın spec'i `docs/` klasöründedir.

| Faz | Kapsam | Durum |
|---|---|---|
| P1 | Portal, tek giriş, ortak tasarım sistemi | Yapıldı |
| P2 | Robotik Laboratuvarı MVP | Yapıldı |
| P3 | Blok Atölyesi MVP | Yapıldı |
| P4 | Öğrenme analitiği | Yapıldı |
| P5 | Demo cilası | Yapıldı |
| P6a | Lab 3D: SiroLine çizgi izleyen (ilk dilim) | Yapıldı, Nur'un onayında |

## Çalıştırma

```sh
git clone --recurse-submodules https://github.com/akgulnursima0349/robotik-akademi-platform
cd robotik-akademi-platform
npm install
npm run demo          # derler ve http://localhost:4173 adresinde açar
```

- **Hesapsız:** `ayarlar/platform.json` yoksa platform hesapsız çalışır; kurslara kartlardan girilir.
- **Deneme (sahte sunucu, internetsiz):** `npm run demo:deneme`. Deneme hesapları giriş ekranında yazar.
- **Sunum:** adım adım akış `docs/DEMO.md`. Hazır paket: GitHub Actions → son yeşil çalışma → *demo-paketi* (yalnızca Node.js gerekir).
- **Demo projesi (gerçek tek giriş):** `supabase/KURULUM.md`.

## Yapı

```
apps/portal        karşılama, tek giriş, Panellerim (Vite + TypeScript)
apps/blok          Blok Atölyesi: kendi blok düzenleyicisi, SVG bahçe, sesli yönerge
apps/lab           Robotik Laboratuvarı: izometrik sahne (PixiJS), SiroLine 3D sahnesi (Three.js), kod editörü, lig
packages/tasarim   ortak tasarım sistemi (örnekler: /ornekler.html)
packages/bulut     oturum ve kurs yönlendirme (nesne yönelimli; Supabase ya da sahte sunucu)
packages/robot-motoru  deterministik simülasyon: ızgara, Kar Küreme, lig, turnuva
packages/analitik  ısı haritası, kazanım özeti, etki büyüklüğü, zor bölümler, destek listesi, CSV
packages/python    Skulpt köprüsü: Türkçe hata mesajları, sonsuz döngü koruması, lig beyinleri
kurslar/junior     python-atolyesi-junior  (submodule)
kurslar/ortaokul   python-atolyesi         (submodule)
supabase/          platform.sql, lab.sql, analitik.sql, örnek veri, kurulum
test/              uçtan uca testler (Playwright), veritabanı senaryosu (Postgres 16)
```

## Testler

```sh
npm run tip     # TypeScript
npm test        # birim testleri (Vitest)
npm run e2e     # uçtan uca: masaüstü, tablet, telefon (önce derle)
PGHOST=... sh test/db/calistir.sh   # platform.sql senaryosu
```
