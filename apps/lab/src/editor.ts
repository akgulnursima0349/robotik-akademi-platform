/* Kod editörü: satır numaraları, Python renklendirmesi, Tab = 4 boşluk, ":" sonrası otomatik girinti,
   hata ve çalışan satır vurgusu. Arkada renkli <pre>, önde şeffaf <textarea> (seçim ve imleç tarayıcının). */
import { el } from "@sra/tasarim";

const ANAHTAR = /\b(for|in|range|if|elif|else|while|def|return|and|or|not|True|False|None|is|pass|break|continue|print|abs|len)\b/g;
const KOMUT = /\b(ileri|sola_don|saga_don|onu_acik|onunde_kar_var|batarya|istasyonda_mi|hamle)\b/g;
const kac = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renklendir(kod: string): string {
  return kod.split("\n").map((satir) => {
    const parca: string[] = [];
    let kalan = satir;
    /* yorum ve metinleri koruyarak böl */
    const re = /(#.*$)|("[^"]*"?|'[^']*'?)/;
    while (kalan) {
      const m = kalan.match(re);
      if (!m || m.index === undefined) { parca.push(kodRenk(kalan)); break; }
      parca.push(kodRenk(kalan.slice(0, m.index)));
      parca.push(m[1] ? `<span class="e-yorum">${kac(m[1])}</span>` : `<span class="e-metin">${kac(m[2])}</span>`);
      kalan = kalan.slice(m.index + m[0].length);
    }
    return parca.join("");
  }).join("\n") + "\n";
}
function kodRenk(s: string): string {
  return kac(s).replace(KOMUT, '<span class="e-komut">$1</span>').replace(ANAHTAR, '<span class="e-anahtar">$1</span>').replace(/\b(\d+)\b/g, '<span class="e-sayi">$1</span>');
}

export class Editor {
  readonly kok: HTMLDivElement;
  readonly alan: HTMLTextAreaElement;
  private renkli: HTMLPreElement;
  private numaralar: HTMLDivElement;
  private vurgu = { hata: 0, calisan: 0 };
  degisince: ((kod: string) => void) | null = null;

  constructor(kod: string, etiket = "Python kodu") {
    this.numaralar = el("div", "e-no", { "aria-hidden": "true" });
    this.renkli = el("pre", "e-renk", { "aria-hidden": "true" });
    this.alan = el("textarea", "e-alan", { spellcheck: "false", autocapitalize: "off", autocomplete: "off", "aria-label": etiket, wrap: "off" });
    this.alan.value = kod;
    this.kok = el("div", "e-kok", {}, this.numaralar, el("div", "e-govde", {}, this.renkli, this.alan));
    this.alan.addEventListener("input", () => { this.vurgu.hata = 0; this.guncelle(); this.degisince?.(this.alan.value); });
    this.alan.addEventListener("scroll", () => { this.renkli.scrollTop = this.alan.scrollTop; this.renkli.scrollLeft = this.alan.scrollLeft; this.numaralar.scrollTop = this.alan.scrollTop; });
    this.alan.addEventListener("keydown", (e) => this.tus(e));
    this.guncelle();
  }
  get kod() { return this.alan.value; }
  set kod(v: string) { this.alan.value = v; this.vurgu = { hata: 0, calisan: 0 }; this.guncelle(); this.degisince?.(v); }

  private guncelle() {
    this.renkli.innerHTML = renklendir(this.alan.value);
    const n = this.alan.value.split("\n").length;
    this.numaralar.innerHTML = Array.from({ length: n }, (_, i) => {
      const s = i + 1;
      return `<span class="${s === this.vurgu.hata ? "hata" : s === this.vurgu.calisan ? "calisan" : ""}">${s}</span>`;
    }).join("");
    this.kok.style.setProperty("--hata", String(this.vurgu.hata || -10));
    this.kok.style.setProperty("--calisan", String(this.vurgu.calisan || -10));
  }
  hataSatiri(s: number) { this.vurgu.hata = s; this.vurgu.calisan = 0; this.guncelle(); }
  calisanSatir(s: number) { if (this.vurgu.calisan !== s) { this.vurgu.calisan = s; this.guncelle(); } }
  temizle() { this.vurgu = { hata: 0, calisan: 0 }; this.guncelle(); }

  /** İmlecin olduğu yere metin ekler (komut çipleri için) */
  ekle(metin: string) {
    const a = this.alan, bas = a.selectionStart, son = a.selectionEnd;
    const satirBasi = a.value.lastIndexOf("\n", bas - 1) + 1;
    const girinti = a.value.slice(satirBasi, bas).match(/^\s*/)![0];
    const onceBosMu = a.value.slice(satirBasi, bas).trim() === "";
    const yeni = (onceBosMu ? "" : "\n" + girinti) + metin;
    a.setRangeText(yeni, bas, son, "end");
    a.focus();
    a.dispatchEvent(new Event("input"));
  }

  private tus(e: KeyboardEvent) {
    const a = this.alan;
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); a.setRangeText("    ", a.selectionStart, a.selectionEnd, "end"); a.dispatchEvent(new Event("input")); }
    else if (e.key === "Enter") {
      const bas = a.selectionStart, satirBasi = a.value.lastIndexOf("\n", bas - 1) + 1;
      const satir = a.value.slice(satirBasi, bas);
      let g = satir.match(/^\s*/)![0];
      if (/:\s*$/.test(satir)) g += "    ";
      e.preventDefault();
      a.setRangeText("\n" + g, bas, a.selectionEnd, "end");
      a.dispatchEvent(new Event("input"));
    } else if (e.key === "Backspace" && a.selectionStart === a.selectionEnd) {
      const bas = a.selectionStart, satirBasi = a.value.lastIndexOf("\n", bas - 1) + 1, once = a.value.slice(satirBasi, bas);
      if (once.length && /^ +$/.test(once) && once.length % 4 === 0) { e.preventDefault(); a.setRangeText("", bas - 4, bas, "end"); a.dispatchEvent(new Event("input")); }
    }
  }
}
