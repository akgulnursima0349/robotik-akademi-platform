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
      const b = el("button", `bk-blok bk-tur-${t}`, { type: "button", "data-tur": t, "aria-label": `${BLOK_AD[t]} bloğu ekle` });
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
      const d = el("div", `bk-blok bk-tur-${b.tur} bk-programda`, { "data-id": b.id, role: "listitem", tabindex: "0", "aria-label": BLOK_AD[b.tur] });
      d.innerHTML = `<span class="bk-ik">${IKON[b.tur]}</span><span>${BLOK_AD[b.tur]}</span>`;
      d.append(sil);
      d.addEventListener("keydown", (e) => {
        if (e.key === "Delete" || e.key === "Backspace") sil.click();
        else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); this.klavyeyleTasi(b.id, e.key === "ArrowUp" ? -1 : 1); }
      });
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
    const kap = el("div", "bk-tekrar" + (this.hedef === b.id ? " bk-hedef" : ""), { "data-id": b.id, role: "listitem", tabindex: "0", "aria-label": `tekrarla ${b.sayi} kez` }, bas, ic, el("div", "bk-tekrar-alt"));
    kap.addEventListener("keydown", (e) => {
      if (e.target !== kap) return;
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); this.klavyeyleTasi(b.id, e.key === "ArrowUp" ? -1 : 1); }
    });
    kap.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".bk-programda, button")) return;
      e.stopPropagation(); this.hedef = this.hedef === b.id ? null : b.id; this.ciz();
    });
    this.surukle(bas, () => b, false, kap);
    return kap;
  }

  /* ---------- sürükle-bırak (fare ve dokunma) ----------
     Öğe işaretçiyi yakalar: bırakma ya da iptal her durumda gelir (imleç pencereden çıksa da).
     İptal yolları: pointercancel, yakalamanın kaybı, Esc, pencere odağını kaybetme, sekmenin gizlenmesi.
     Aynı anda tek sürükleme; ikinci parmak yok sayılır. Ekran kenarına yaklaşınca sayfa kendiliğinden kayar. */
  private surukleniyor = false;
  private aktif: { iptal: () => void } | null = null;
  private surukle(tutamak: HTMLElement, blok: () => Blok, yeni: boolean, kaynak: HTMLElement = tutamak) {
    tutamak.addEventListener("pointerdown", (e) => {
      if (this.kilitli || this.aktif || !e.isPrimary || e.button > 0 || (e.target as HTMLElement).closest(".bk-sil, .bk-arti")) return;
      const x0 = e.clientX, y0 = e.clientY, esik = e.pointerType === "mouse" ? 8 : 6;
      const kutu0 = kaynak.getBoundingClientRect();
      const tutX = Math.min(x0 - kutu0.left, kutu0.width), tutY = Math.min(y0 - kutu0.top, kutu0.height);
      let hayalet: HTMLElement | null = null, isaret: HTMLElement | null = null, b: Blok | null = null;
      let yer: { liste: Blok[]; i: number } | null = null, x = x0, y = y0, kaydirma = 0, bitti = false;
      try { tutamak.setPointerCapture(e.pointerId); } catch { /* öğe sayfadan çıkmışsa */ }
      /* farenin sürüklerken sayfadaki yazıları seçmesini önle */
      if (e.pointerType === "mouse") e.preventDefault();

      const yerGuncelle = () => {
        if (!hayalet || !b) return;
        hayalet.style.transform = `translate(${x - tutX}px, ${y - tutY}px) rotate(-2deg)`;
        yer = this.yerBul(x, y, b);
        isaret!.remove();
        if (!yer) return;
        const listeEl = this.alan.querySelector(`.bk-liste[data-ust="${yer.liste === this.program ? "kok" : this.ustId(yer.liste)}"]`);
        if (!listeEl) return;
        const cocuklar = [...listeEl.children].filter((c) => c.matches(".bk-blok, .bk-tekrar"));
        const once = yer.i < yer.liste.length ? cocuklar.find((c) => (c as HTMLElement).dataset.id === yer!.liste[yer!.i].id) ?? null : null;
        listeEl.insertBefore(isaret!, once ?? listeEl.querySelector(":scope > .bk-bos") ?? null);
      };
      /* ekranın üst/alt 64 pikseline girince kenara yakınlıkla hızlanan kaydırma */
      const kaydir = () => {
        if (bitti || !hayalet) return;
        const kenar = 64, h = innerHeight;
        const hiz = y < kenar ? -Math.ceil((kenar - y) / 4) : y > h - kenar ? Math.ceil((y - (h - kenar)) / 4) : 0;
        if (hiz) { const once = scrollY; scrollBy(0, hiz); if (scrollY !== once) yerGuncelle(); }
        kaydirma = requestAnimationFrame(kaydir);
      };
      const basla = () => {
        this.surukleniyor = true;
        document.documentElement.classList.add("bk-surukleme");
        getSelection()?.removeAllRanges();
        b = blok();
        hayalet = kaynak.cloneNode(true) as HTMLElement;
        hayalet.classList.add("bk-hayalet");
        hayalet.querySelectorAll("[tabindex]").forEach((t) => t.removeAttribute("tabindex"));
        hayalet.setAttribute("aria-hidden", "true");
        hayalet.style.width = Math.min(kutu0.width, 360) + "px";
        document.body.append(hayalet);
        if (!yeni) kaynak.classList.add("bk-tasiniyor");
        isaret = el("div", "bk-isaret", { "aria-hidden": "true" });
        kaydirma = requestAnimationFrame(kaydir);
      };
      const temizle = () => {
        bitti = true; this.aktif = null;
        cancelAnimationFrame(kaydirma);
        tutamak.removeEventListener("pointermove", hareket);
        tutamak.removeEventListener("pointerup", birak);
        tutamak.removeEventListener("pointercancel", iptal);
        tutamak.removeEventListener("lostpointercapture", iptal);
        removeEventListener("keydown", tus, true);
        removeEventListener("blur", iptal);
        document.removeEventListener("visibilitychange", gizlenince);
        try { if (tutamak.hasPointerCapture(e.pointerId)) tutamak.releasePointerCapture(e.pointerId); } catch { /* yok */ }
        hayalet?.remove(); isaret?.remove(); kaynak.classList.remove("bk-tasiniyor");
        document.documentElement.classList.remove("bk-surukleme");
        /* sürüklemenin ardından gelen "click" bloğu bir daha eklemesin */
        setTimeout(() => (this.surukleniyor = false), 0);
      };
      const hareket = (m: PointerEvent) => {
        if (m.pointerId !== e.pointerId) return;
        x = m.clientX; y = m.clientY;
        if (!hayalet) { if (Math.hypot(x - x0, y - y0) < esik) return; basla(); }
        yerGuncelle();
      };
      const birak = (m: PointerEvent) => {
        if (m.pointerId !== e.pointerId || bitti) return;
        const surukledi = !!hayalet, son = yer, tasinan = b;
        temizle();
        if (!surukledi || !son || !tasinan) return;
        const eski = yeni ? null : bul(this.program, tasinan.id);
        let { liste, i } = son;
        if (eski) { eski.liste.splice(eski.i, 1); if (eski.liste === liste && eski.i < i) i--; }
        liste.splice(i, 0, tasinan);
        if (yeni) ses.oku(BLOK_AD[tasinan.tur]);
        this.degisti();
      };
      const iptal = () => { if (!bitti) temizle(); };
      const tus = (k: KeyboardEvent) => { if (k.key === "Escape") { k.preventDefault(); iptal(); } };
      const gizlenince = () => { if (document.hidden) iptal(); };
      tutamak.addEventListener("pointermove", hareket);
      tutamak.addEventListener("pointerup", birak);
      tutamak.addEventListener("pointercancel", iptal);
      tutamak.addEventListener("lostpointercapture", iptal);
      addEventListener("keydown", tus, true);
      addEventListener("blur", iptal);
      document.addEventListener("visibilitychange", gizlenince);
      this.aktif = { iptal };
    });
  }
  /** Programdaki bir bloğu kendi listesinde bir yukarı (-1) ya da aşağı (+1) taşır; odak blokta kalır. */
  private klavyeyleTasi(id: string, yon: -1 | 1) {
    if (this.kilitli) return;
    const r = bul(this.program, id); if (!r) return;
    const j = r.i + yon;
    if (j < 0 || j >= r.liste.length) return;
    const [blok] = r.liste.splice(r.i, 1);
    r.liste.splice(j, 0, blok);
    this.degisti();
    (this.alan.querySelector(`[data-id="${id}"]`) as HTMLElement | null)?.focus();
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
