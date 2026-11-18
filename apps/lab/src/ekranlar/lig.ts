/* Sınıf Robot Ligi: robotunu yaz, rakiplerin kodunu oku, turnuvayı oynat, maçları tekrar izle.
   Öğretmen (hesaplı modda) sınıfının robotlarını yükleyip tahtada sınıf turnuvası yapar. */
import { alan, dugme, el, ikon, uyari } from "@sra/tasarim";
import { hataMetni, Ogrenci, Ogretmen, type Sinif } from "@sra/bulut";
import { turnuva, TUR_SAYISI, type MacKaresi, type Oyuncu, type TurnuvaSonucu } from "@sra/robot-motoru";
import { ILK_ROBOT, ORNEK_ROBOTLAR, pythonBeyin } from "@sra/python";
import { Editor, renklendir } from "../editor";
import { ilerleme } from "../ilerleme";
import { LigSahnesi } from "../sahne/sahneler";
import { uygulama } from "../uygulama";
import { ustKisim } from "./ana";

const bekle = () => new Promise((r) => setTimeout(r, 30));

export async function lig(root: HTMLElement) {
  const ben = uygulama.kullanici;
  const kayitli = ilerleme.lig();
  const adAlan = alan({ etiket: "Robotunun adı", id: "l-robot-ad", ozellik: { maxlength: "40", value: kayitli?.ad ?? "Benim robotum" } });
  const adGirdi = adAlan.querySelector("input")!;
  const editor = new Editor(kayitli?.kod ?? ILK_ROBOT, "Robotunun Python kodu");
  const kaydet = () => ilerleme.ligKaydet(adGirdi.value.trim() || "Benim robotum", editor.kod);
  editor.degisince = kaydet; adGirdi.addEventListener("input", kaydet);

  const mesaj = el("div", "l-cikti", { "aria-live": "polite" });
  const baslatB = dugme({ metin: "Turnuvayı başlat", ikon: "ok-sag", ikonSonda: true, id: "l-turnuva" }) as HTMLButtonElement;
  const eylem = el("div", "l-eylem", {}, baslatB);

  /* öğrenci: robotunu sınıfına gönderir */
  if (ben instanceof Ogrenci && uygulama.oturum) {
    const gonderB = dugme({ metin: "Sınıfıma gönder", tur: "ikincil", ikon: "kisiler", id: "l-gonder" }) as HTMLButtonElement;
    gonderB.addEventListener("click", async () => {
      const b = pythonBeyin(editor.kod);
      if (b.hata) { mesaj.replaceChildren(hataKutusu(b.hata.satir, b.hata.mesaj)); editor.hataSatiri(b.hata.satir); return; }
      gonderB.disabled = true;
      try { await uygulama.oturum!.labRobotKaydet(adGirdi.value, editor.kod); mesaj.replaceChildren(uyari("Robotun sınıfına gönderildi. Öğretmenin sınıf turnuvasını başlatınca o da yarışacak.", "basari")); }
      catch (e) { mesaj.replaceChildren(uyari(hataMetni(e), "hata")); }
      gonderB.disabled = false;
    });
    eylem.append(gonderB);
    uygulama.oturum.labRobotum().then((r) => { if (r && !kayitli) { adGirdi.value = r.ad; editor.kod = r.kod; } }).catch(() => {});
  }

  /* rakipler: kodları okunabilir */
  const rakipler = el("div", "l-rakipler", {}, el("h2", "", {}, "Rakipler"),
    ...ORNEK_ROBOTLAR.map((r) => el("details", "l-rakip", {},
      el("summary", "", {}, el("b", "", {}, r.ad), el("span", "", {}, r.aciklama)),
      (() => { const p = el("pre", "l-kod"); p.innerHTML = renklendir(r.kod); return p; })())));

  const sol = el("section", "l-gorev-sol", {},
    el("a", "l-geri", { href: "#" }, "← Laboratuvar"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, "Sınıf Robot Ligi"), el("h1", "", {}, "Kar topu ligi"),
      el("p", "", {}, `9×9 karlı meydan, iki robot, ${TUR_SAYISI} tur. Her turda robotun hamle(robot) fonksiyonuyla karar verir: "ileri", "sola", "saga" ya da "bekle". En çok kar topu toplayan kazanır.`)),
    adAlan, editor.kok, eylem, mesaj);

  /* öğretmen: sınıf turnuvası */
  const sinifKutu = el("div", "l-sinif");
  if (ben instanceof Ogretmen && uygulama.oturum) {
    const sec = el("select", "p-kurssec", { "aria-label": "Sınıf", id: "l-sinif" });
    const sinifB = dugme({ metin: "Sınıf turnuvası", tur: "ikincil", ikon: "kisiler", id: "l-sinif-turnuva" }) as HTMLButtonElement;
    sinifKutu.append(el("h2", "", {}, "Sınıf turnuvası"), el("p", "", {}, "Öğrencilerin gönderdiği robotlar birbiriyle yarışır. Tahtaya yansıtıp birlikte izleyin."), el("div", "l-eylem", {}, sec, sinifB));
    let siniflar: Sinif[] = [];
    uygulama.oturum.siniflarim().then((s) => { siniflar = s; sec.replaceChildren(...s.map((x) => el("option", "", { value: x.id }, `${x.ad} (${x.kod})`))); }).catch((e) => sinifKutu.append(uyari(hataMetni(e), "hata")));
    sinifB.addEventListener("click", async () => {
      const s = siniflar.find((x) => x.id === sec.value); if (!s) return;
      sinifB.disabled = true;
      try {
        const robotlar = await uygulama.oturum!.labSinifRobotlari(s.id);
        if (robotlar.length < 2) { mesaj.replaceChildren(uyari("Turnuva için en az iki öğrencinin robot göndermesi gerekiyor.", "bilgi")); return; }
        const oyuncular: Oyuncu[] = []; const atlanan: string[] = [];
        for (const r of robotlar) { const b = pythonBeyin(r.kod); if (b.beyin) oyuncular.push({ kimlik: r.sahip, ad: r.ad, sahip: r.sahip, beyin: b.beyin }); else atlanan.push(r.sahip); }
        await oyna(oyuncular, `${s.ad} turnuvası`);
        if (atlanan.length) mesaj.append(uyari(`Kodunda hata olduğu için katılamayanlar: ${atlanan.join(", ")}`, "bilgi"));
      } catch (e) { mesaj.replaceChildren(uyari(hataMetni(e), "hata")); }
      finally { sinifB.disabled = false; }
    });
    sol.append(sinifKutu);
  }
  sol.append(rakipler);

  /* sağ: arena, skor, tablo */
  const skor = el("div", "l-skor", { "aria-live": "polite" },
    el("span", "l-skor__ad a", {}, "—"), el("b", "l-skor__puan a", {}, "0"), el("span", "l-skor__tur", {}, "tur 0"), el("b", "l-skor__puan b", {}, "0"), el("span", "l-skor__ad b", {}, "—"));
  const sahneKutu = el("div", "l-sahne l-sahne--lig", { role: "img", "aria-label": "Kar topu ligi arenası" });
  const tabloKutu = el("div", "l-tablo-kutu", {}, el("p", "l-bos", {}, "Turnuvayı başlatınca puan tablosu ve maçlar burada görünür."));
  const sag = el("section", "l-gorev-sag", {}, el("div", "l-sahne-kap sra-kart", {}, skor, sahneKutu), tabloKutu);
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, sag));

  const sahne = await LigSahnesi.kur(sahneKutu, ["—", "—"]);
  window.addEventListener("hashchange", () => sahne.yokEt(), { once: true });
  const skorGoster = (k: MacKaresi) => {
    skor.querySelector(".l-skor__puan.a")!.textContent = String(k.robotlar[0].puan);
    skor.querySelector(".l-skor__puan.b")!.textContent = String(k.robotlar[1].puan);
    skor.querySelector(".l-skor__tur")!.textContent = `tur ${k.tur}`;
  };
  sahne.kareDinle = skorGoster;

  let sonuc: TurnuvaSonucu | null = null, oyuncular: Oyuncu[] = [];
  const macIzle = async (i: number) => {
    if (!sonuc) return;
    const m = sonuc.maclar[i];
    const [a, b] = [oyuncular[m.ev], oyuncular[m.dep]];
    skor.querySelector(".l-skor__ad.a")!.textContent = a.ad; skor.querySelector(".l-skor__ad.b")!.textContent = b.ad;
    sahne.adlar([a.ad, b.ad]);
    tabloKutu.querySelectorAll(".l-mac").forEach((x, j) => x.classList.toggle("secili", j === i));
    sahneKutu.scrollIntoView({ block: "nearest", behavior: "smooth" });
    await sahne.oynat(m.sonuc.kareler);
  };

  async function oyna(liste: Oyuncu[], baslik: string) {
    mesaj.replaceChildren(el("p", "l-calisiyor", {}, "Maçlar oynanıyor…"));
    await bekle();
    oyuncular = liste;
    sonuc = turnuva(liste);
    mesaj.replaceChildren();
    const benimki = liste.findIndex((o) => o.kimlik === "ben");
    const tablo = el("table", "l-tablo", { "aria-label": "Puan tablosu" },
      el("thead", "", {}, el("tr", "", {}, ...["#", "Robot", "O", "G", "B", "M", "Top", "P"].map((t) => el("th", "", { scope: "col" }, t)))),
      el("tbody", "", {}, ...sonuc.tablo.map((r, i) => el("tr", r.kimlik === "ben" ? "ben" : "", {},
        el("td", "", {}, String(i + 1)), el("td", "", {}, el("b", "", {}, r.ad), r.sahip ? el("small", "", {}, r.sahip) : null),
        ...[r.o, r.g, r.b, r.m].map((n) => el("td", "", {}, String(n))), el("td", "", {}, `${r.atilan}:${r.yenen}`), el("td", "l-puan", {}, String(r.puan))))));
    const maclar = el("ol", "l-maclar", { "aria-label": "Maçlar (tıkla, tekrar izle)" }, ...sonuc.maclar.map((m, i) => {
      const s = m.sonuc;
      const b = el("button", "l-mac", { type: "button", "data-mac": String(i) },
        el("span", s.kazanan === 0 ? "kazanan" : "", {}, liste[m.ev].ad), el("b", "", {}, `${s.puan[0]} – ${s.puan[1]}`), el("span", s.kazanan === 1 ? "kazanan" : "", {}, liste[m.dep].ad), ikon("ok-sag"));
      b.addEventListener("click", () => void macIzle(i));
      return el("li", "", {}, b);
    }));
    const hatalar = sonuc.maclar.flatMap((m) => m.sonuc.hatalar.map((h, j) => (h && (j ? m.dep : m.ev) === benimki ? h : null))).filter(Boolean);
    tabloKutu.replaceChildren(el("h2", "", {}, baslik), tablo, el("h3", "", {}, "Maçlar"), maclar);
    if (hatalar.length) mesaj.append(uyari("Robotun bazı turlarda hata verdi: " + hatalar[0], "hata"));
    const sira = sonuc.tablo.findIndex((r) => r.kimlik === "ben");
    if (sira >= 0) mesaj.append(uyari(sira === 0 ? "Şampiyon sensin! Kodunu sınıfınla paylaş." : `Robotun ${sira + 1}. oldu. Rakiplerin kodlarını oku, robotunu geliştir.`, sira === 0 ? "basari" : "bilgi"));
    /* ilk olarak kendi maçlarından birini göster */
    const ilk = sonuc.maclar.findIndex((m) => m.ev === benimki || m.dep === benimki);
    void macIzle(ilk >= 0 ? ilk : 0);
  }

  baslatB.addEventListener("click", async () => {
    editor.temizle();
    const b = pythonBeyin(editor.kod);
    if (b.hata) { editor.hataSatiri(b.hata.satir); mesaj.replaceChildren(hataKutusu(b.hata.satir, b.hata.mesaj)); return; }
    baslatB.disabled = true;
    const liste: Oyuncu[] = [{ kimlik: "ben", ad: adGirdi.value.trim() || "Benim robotum", sahip: "sen", beyin: b.beyin! },
      ...ORNEK_ROBOTLAR.map((r) => ({ kimlik: r.kimlik, ad: r.ad, beyin: pythonBeyin(r.kod).beyin! }))];
    await oyna(liste, "Laboratuvar turnuvası");
    baslatB.disabled = false;
  });

  function hataKutusu(satir: number, m: string) {
    const d = uyari("", "hata");
    d.querySelector("span:last-child")!.innerHTML = (satir ? `<b>${satir}. satır:</b> ` : "") + m;
    return d;
  }
}
