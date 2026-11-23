/* Lab ana ekranı: iki etkinlik ve ilerleme. */
import { el, ikon, kursKarti, rozet, ustBar } from "@sra/tasarim";
import { CIZGI_GOREVLERI, GOREVLER } from "@sra/robot-motoru";
import { ilerleme } from "../ilerleme";
import { karKapagi } from "../kapaklar";
import kapakKenshin from "../assets/kapak-kenshin.webp";
import kapakSiroline from "../assets/kapak-siroline.webp";
import { uygulama } from "../uygulama";

export function ustKisim(...sag: Node[]): HTMLElement {
  const b = ustBar([...sag, el("a", "sra-dugme sra-dugme--hayalet sra-dugme--kucuk", { href: "../" }, ikon("sag-ok", "l-geri-ok"), el("span", "sra-dugme__yazi", {}, "Platform"))], "../");
  b.querySelector(".sra-marka small")!.textContent = "Robotik Laboratuvarı";
  return b;
}

export function ana(root: HTMLElement) {
  const yildiz = ilerleme.toplamYildiz(), toplam = GOREVLER.length * 3;
  const cYildiz = ilerleme.toplamYildiz("cizgi-"), cToplam = CIZGI_GOREVLERI.length * 3;
  const kahraman = el("section", "l-kahraman sra-sarmal sra-belir", {},
    el("p", "l-ust", {}, "Robotik Laboratuvarı"),
    el("h1", "", {}, "Robotunu programla, ", el("span", "", {}, "karla mücadele et.")),
    el("p", "l-alt", {}, "Python ile yazdığın kod, tarayıcıdaki robotu yönetir. Karlı sokakları aç, akademinin Kenshin'iyle sumo liginde yarış, SiroLine'ı 3D pistte koştur."));
  const izgara = el("div", "l-etkinlikler sra-sarmal");
  izgara.append(
    kursKarti({ kimlik: "kar", etiket: `${GOREVLER.length} görev · ${yildiz}/${toplam} yıldız`, baslik: "Kar Küreme Robotu", renk: "var(--sra-kurs-lab)",
      aciklama: "Bataryası sınırlı robotla karlı sokakları aç: sıralı komutlar, döngüler, sensörler ve enerji planlaması.",
      bilgi: yildiz ? "Devam et" : "Başla", bilgiIkon: "robot", gorsel: karKapagi(), href: "#kar" }),
    kursKarti({ kimlik: "lig", etiket: "3D · herkes herkesle", baslik: "Mini Sumo Ligi", renk: "var(--sra-vurgu)",
      aciklama: "Akademinin yarışma robotu Kenshin ringde. Sensörlerini oku, taktiğini yaz, rakiplerini ringden çıkar.",
      bilgi: ilerleme.lig() ? "Robotun hazır" : "Robotunu yaz", bilgiIkon: "kisiler", gorsel: kapakKenshin, href: "#lig" }),
    kursKarti({ kimlik: "cizgi", etiket: `3D · ${CIZGI_GOREVLERI.length} pist · ${cYildiz}/${cToplam} yıldız`, baslik: "Çizgi İzleyen Robot", renk: "#e0a800",
      aciklama: "Akademinin SiroLine robotu 3D pistte. Sekiz sensörü oku, iki motoru Python'la yönet; hızdan PID'ye.",
      bilgi: cYildiz ? "Devam et" : "Başla", bilgiIkon: "robot", gorsel: kapakSiroline, href: "#cizgi" })
  );
  const notlar = el("section", "l-not sra-sarmal", {},
    el("div", "sra-kart l-not__ic", {}, ikon("bilgi", "l-not__ikon"),
      el("p", "", {}, "Devre kurmayı ve Arduino'yu derste Tinkercad'de yapıyoruz. Laboratuvar onun yapmadığına odaklanır: ", el("b", "", {}, "robotun karar vermesi, enerji planı ve sınıfça yarışma"), ". Her şey bu bilgisayarda çalışır; kurulum gerekmez."),
      uygulama.mod === "yerel" ? rozet("İlerleme bu cihazda") : rozet(uygulama.mod === "deneme" ? "Deneme modu" : "Hesaplar açık")));
  root.replaceChildren(ustKisim(), el("main", "l-ana", { id: "ana" }, kahraman, izgara, notlar));
}
