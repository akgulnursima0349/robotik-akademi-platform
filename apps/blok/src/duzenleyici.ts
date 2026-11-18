/* Blok düzenleyici: paletten dokun-ekle, sürükleyerek yeniden sırala, tekrarın içine koy, sil, sayıyı değiştir.
   Program bir ağaç (Blok[]); her değişiklikte yeniden çizilir. Dokunma hedefleri en az 48 piksel. */
import { el } from "@sra/tasarim";
import { BLOK_AD, bul, yeniBlok, type Blok, type BlokTuru, type TekrarBlogu } from "./model";
import { ses } from "./ses";

const IKON: Record<BlokTuru, string> = {
  ileri: '<svg viewBox="0 0 24 24"><path d="M12 20V5M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sol: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sag: '<svg viewBox="0 0 24 24"><path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tekrar: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
export const blokIkon = (t: BlokTuru) => IKON[t];

export class Duzenleyici {
  readonly palet: HTMLElement;
  readonly alan: HTMLElement;
  program: Blok[];
  /** palete dokununca blok nereye eklenir: null = ana program, yoksa tekrar bloğunun id'si */
  private hedef: string | null = null;
  private vurgu: string | null = null;
  kilitli = false;
  degisince: (() => void) | null = null;

  constructor(paletTurleri: BlokTuru[], program: Blok[]) {
    this.program = program;
    this.palet = el("div", "bk-palet", { role: "toolbar", "aria-label": "Bloklar" });
    for (const t of paletTurleri) {
      const b = el("button", `bk-blok bk-${t}`, { type: "button", "data-tur": t, "aria-label": `${BLOK_AD[t]} bloğu ekle` });
      b.innerHTML = `<span class="bk-ik">${IKON[t]}</span><span>${BLOK_AD[t]}</span>`;
      b.addEventListener("click", () => { if (!this.surukleniyor) this.ekle(t); });
      this.surukle(b, () => yeniBlok(t), true);
      this.palet.append(b);
    }
    this.alan = el("div", "bk-alan", { "aria-label": "Programın", role: "list" });
    this.alan.addEventListener("click", (e) => { if (e.target === this.alan) { this.hedef = null; this.ciz(); } });
    this.ciz();
  }

  ekle(t: BlokTuru) {
    if (this.kilitli) return;
    ses.oku(BLOK_AD[t]);
    const b = yeniBlok(t);
    this.hedefListe().push(b);
    if (t === "tekrar") this.hedef = b.id; // yeni tekrarın içine eklemeye devam
    this.degisti();
  }
  private hedefListe(): Blok[] {
    if (!this.hedef) return this.program;
    const r = bul(this.program, this.hedef);
    return r ? (r.liste[r.i] as TekrarBlogu).ic : this.program;
  }
  temizle() { if (this.kilitli) return; this.program = []; this.hedef = null; this.degisti(); }
  vurgula(id: string | null) {
    this.vurgu = id;
    this.alan.querySelectorAll(".bk-calisiyor").forEach((x) => x.classList.remove("bk-calisiyor"));
    if (id) this.alan.querySelector(`[data-id="${id}"]`)?.classList.add("bk-calisiyor");
  }
  private degisti() { this.ciz(); this.degisince?.(); }

  ciz() {
    const liste = (bloklar: Blok[], ust: string | null): HTMLElement => {
      const k = el("div", "bk-liste", { "data-ust": ust ?? "kok" });
      bloklar.forEach((b) => k.append(this.blokCiz(b)));
      if (!bloklar.length) k.append(el("div", "bk-bos", {}, ust ? "Buraya blok koy" : "Bloklara dokun, programın burada oluşsun"));
      return k;
    };
    this.liste = liste;
    this.alan.replaceChildren(liste(this.program, null));
    this.alan.classList.toggle("bk-hedef", this.hedef === null);
    if (this.vurgu) this.vurgula(this.vurgu);
  }
  private liste!: (b: Blok[], ust: string | null) => HTMLElement;

  private blokCiz(b: Blok): HTMLElement {
    const sil = el("button", "bk-sil", { type: "button", "aria-label": `${BLOK_AD[b.tur]} bloğunu sil` }, "×");
    sil.addEventListener("click", (e) => {
      e.stopPropagation(); if (this.kilitli) return;
      const r = bul(this.program, b.id); if (!r) return;
      r.liste.splice(r.i, 1);
      if (this.hedef === b.id) this.hedef = null;
      this.degisti();
    });
    if (b.tur !== "tekrar") {
      const d = el("div", `bk-blok bk-${b.tur} bk-programda`, { "data-id": b.id, role: "listitem", tabindex: "0", "aria-label": BLOK_AD[b.tur] });
      d.innerHTML = `<span class="bk-ik">${IKON[b.tur]}</span><span>${BLOK_AD[b.tur]}</span>`;
      d.append(sil);
      d.addEventListener("keydown", (e) => { if (e.key === "Delete" || e.key === "Backspace") sil.click(); });
      this.surukle(d, () => b, false);
      return d;
    }
    const sayi = el("span", "bk-sayi", { "aria-live": "polite" }, String(b.sayi));
    const eksi = el("button", "bk-arti", { type: "button", "aria-label": "Bir azalt" }, "−");
    const arti = el("button", "bk-arti", { type: "button", "aria-label": "Bir artır" }, "+");
    const degistir = (d: number) => (e: Event) => { e.stopPropagation(); if (this.kilitli) return; b.sayi = Math.min(9, Math.max(2, b.sayi + d)); this.degisti(); };
    eksi.addEventListener("click", degistir(-1)); arti.addEventListener("click", degistir(1));
    const bas = el("div", "bk-tekrar-bas", {}, el("span", "bk-ik"), el("span", "", {}, "tekrarla"), eksi, sayi, arti, el("span", "", {}, "kez"), sil);
    bas.querySelector(".bk-ik")!.innerHTML = IKON.tekrar;
    const ic = this.liste(b.ic, b.id);
    ic.classList.add("bk-ic");
    const kap = el("div", "bk-tekrar" + (this.hedef === b.id ? " bk-hedef" : ""), { "data-id": b.id, role: "listitem", "aria-label": `tekrarla ${b.sayi} kez` }, bas, ic, el("div", "bk-tekrar-alt"));
    kap.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".bk-programda, button")) return;
      e.stopPropagation(); this.hedef = this.hedef === b.id ? null : b.id; this.ciz();
    });
    this.surukle(bas, () => b, false, kap);
    return kap;
  }

  /* ---------- sürükle-bırak (fare ve dokunma) ---------- */
  private surukleniyor = false;
  private surukle(tutamak: HTMLElement, blok: () => Blok, yeni: boolean, kaynak: HTMLElement = tutamak) {
    tutamak.addEventListener("pointerdown", (e) => {
      if (this.kilitli || (e.target as HTMLElement).closest(".bk-sil, .bk-arti") || e.button > 0) return;
      const x0 = e.clientX, y0 = e.clientY;
      let hayalet: HTMLElement | null = null, b: Blok | null = null, isaret: HTMLElement | null = null, yer: { liste: Blok[]; i: number } | null = null;
      const hareket = (m: PointerEvent) => {
        if (!hayalet) {
          if (Math.hypot(m.clientX - x0, m.clientY - y0) < 8) return;
          this.surukleniyor = true;
          b = yeni ? blok() : blok();
          hayalet = kaynak.cloneNode(true) as HTMLElement;
          hayalet.classList.add("bk-hayalet");
          hayalet.style.width = Math.min(kaynak.getBoundingClientRect().width, 320) + "px";
          document.body.append(hayalet);
          if (!yeni) kaynak.classList.add("bk-tasiniyor");
          isaret = el("div", "bk-isaret");
        }
        hayalet.style.transform = `translate(${m.clientX - 30}px, ${m.clientY - 26}px)`;
        yer = this.yerBul(m.clientX, m.clientY, b!);
        isaret!.remove();
        if (yer) {
          const listeEl = yer.liste === this.program ? this.alan.querySelector('.bk-liste[data-ust="kok"]') : this.alan.querySelector(`.bk-liste[data-ust="${this.ustId(yer.liste)}"]`);
          const cocuklar = listeEl ? [...listeEl.children].filter((c) => c.matches(".bk-blok, .bk-tekrar")) : [];
          if (listeEl) listeEl.insertBefore(isaret!, cocuklar[yer.i] ?? null);
        }
      };
      const birak = () => {
        removeEventListener("pointermove", hareket); removeEventListener("pointerup", birak); removeEventListener("pointercancel", birak);
        if (!hayalet) return;
        hayalet.remove(); isaret?.remove(); kaynak.classList.remove("bk-tasiniyor");
        if (yer && b) {
          const eski = yeni ? null : bul(this.program, b.id);
          let { liste, i } = yer;
          if (eski) { eski.liste.splice(eski.i, 1); if (eski.liste === liste && eski.i < i) i--; }
          liste.splice(i, 0, b);
          if (yeni) ses.oku(BLOK_AD[b.tur]);
          this.degisti();
        }
        setTimeout(() => (this.surukleniyor = false), 0);
      };
      addEventListener("pointermove", hareket); addEventListener("pointerup", birak); addEventListener("pointercancel", birak);
    });
  }
  private ustId(liste: Blok[]): string {
    const ara = (p: Blok[]): string | null => { for (const b of p) if (b.tur === "tekrar") { if (b.ic === liste) return b.id; const r = ara(b.ic); if (r) return r; } return null; };
    return ara(this.program) ?? "kok";
  }
  /** İmlecin altındaki listede bırakma sırası; bir tekrar bloğu kendi içine bırakılamaz */
  private yerBul(x: number, y: number, tasinan: Blok): { liste: Blok[]; i: number } | null {
    const r = this.alan.getBoundingClientRect();
    if (x < r.left - 30 || x > r.right + 30 || y < r.top - 30 || y > r.bottom + 30) return null;
    const altindaki = document.elementsFromPoint(x, y).find((e) => e.matches?.(".bk-liste") && this.alan.contains(e) && !(tasinan.tur === "tekrar" && e.closest(`[data-id="${tasinan.id}"]`))) as HTMLElement | undefined;
    const listeEl = altindaki ?? (this.alan.querySelector('.bk-liste[data-ust="kok"]') as HTMLElement);
    const ust = listeEl.dataset.ust!;
    const liste = ust === "kok" ? this.program : (bul(this.program, ust)!.liste[bul(this.program, ust)!.i] as TekrarBlogu).ic;
    const cocuklar = [...listeEl.children].filter((c) => c.matches(".bk-blok, .bk-tekrar") && !c.classList.contains("bk-tasiniyor"));
    let i = cocuklar.findIndex((c) => { const b = c.getBoundingClientRect(); return y < b.top + b.height / 2; });
    if (i < 0) i = cocuklar.length;
    /* taşınan öğe listede kayıtlıysa, filtrelenmiş sırayı gerçek sıraya çevir */
    const gercek = cocuklar[i] ? liste.findIndex((b) => b.id === (cocuklar[i] as HTMLElement).dataset.id) : liste.length;
    return { liste, i: gercek < 0 ? liste.length : gercek };
  }
}
