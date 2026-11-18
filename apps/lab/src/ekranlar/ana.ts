/* Lab ana ekranı: iki etkinlik ve ilerleme. */
import { el, ikon, kursKarti, rozet, ustBar } from "@sra/tasarim";
import { GOREVLER } from "@sra/robot-motoru";
import { ilerleme } from "../ilerleme";
import { karKapagi, ligKapagi } from "../kapaklar";
import { uygulama } from "../uygulama";

export function ustKisim(...sag: Node[]): HTMLElement {
  const b = ustBar([...sag, el("a", "sra-dugme sra-dugme--hayalet sra-dugme--kucuk", { href: "../" }, ikon("sag-ok", "l-geri-ok"), el("span", "sra-dugme__yazi", {}, "Platform"))], "../");
  b.querySelector(".sra-marka small")!.textContent = "Robotik Laboratuvarı";
  return b;
}

export function ana(root: HTMLElement) {
  const yildiz = ilerleme.toplamYildiz(), toplam = GOREVLER.length * 3;
  const kahraman = el("section", "l-kahraman sra-sarmal sra-belir", {},
    el("p", "l-ust", {}, "Robotik Laboratuvarı"),
    el("h1", "", {}, "Robotunu programla, ", el("span", "", {}, "karla mücadele et.")),
    el("p", "l-alt", {}, "Python ile yazdığın kod, tarayıcıdaki robotu yönetir. Önce mahallenin karlı sokaklarını aç, sonra robotunu sınıf liginde yarıştır."));
  const izgara = el("div", "l-etkinlikler sra-sarmal");
  izgara.append(
    kursKarti({ kimlik: "kar", etiket: `${GOREVLER.length} görev · ${yildiz}/${toplam} yıldız`, baslik: "Kar Küreme Robotu", renk: "var(--sra-kurs-lab)",
      aciklama: "Bataryası sınırlı robotla karlı sokakları aç: sıralı komutlar, döngüler, sensörler ve enerji planlaması.",
      bilgi: yildiz ? "Devam et" : "Başla", bilgiIkon: "robot", gorsel: karKapagi(), href: "#kar" }),
    kursKarti({ kimlik: "lig", etiket: "Herkes herkesle", baslik: "Sınıf Robot Ligi", renk: "var(--sra-vurgu)",
      aciklama: "Her turda ne yapacağına kendi karar veren bir robot yaz. Kar topu toplama maçlarında rakiplerini geç.",
      bilgi: ilerleme.lig() ? "Robotun hazır" : "Robotunu yaz", bilgiIkon: "kisiler", gorsel: ligKapagi(), href: "#lig" })
  );
  const notlar = el("section", "l-not sra-sarmal", {},
    el("div", "sra-kart l-not__ic", {}, ikon("bilgi", "l-not__ikon"),
      el("p", "", {}, "Devre kurmayı ve Arduino'yu derste Tinkercad'de yapıyoruz. Laboratuvar onun yapmadığına odaklanır: ", el("b", "", {}, "robotun karar vermesi, enerji planı ve sınıfça yarışma"), ". Her şey bu bilgisayarda çalışır; kurulum gerekmez."),
      uygulama.mod === "yerel" ? rozet("İlerleme bu cihazda") : rozet(uygulama.mod === "deneme" ? "Deneme modu" : "Hesaplar açık")));
  root.replaceChildren(ustKisim(), el("main", "l-ana", { id: "ana" }, kahraman, izgara, notlar));
}
