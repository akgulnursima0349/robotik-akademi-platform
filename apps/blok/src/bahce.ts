/* Bahçe sahnesi: tepeden bakılan ızgara (SVG). Bit izdeki kareleri yumuşak geçişlerle yürür, havuçları toplar. */
import { Izgara, type Kare } from "@sra/robot-motoru";
import { bitIc } from "./bit";

const NS = "http://www.w3.org/2000/svg";
const B = 100; // kare boyu (SVG birimi)
const svgEl = (ad: string, ozellik: Record<string, string | number> = {}, ic = "") => {
  const e = document.createElementNS(NS, ad);
  for (const [k, v] of Object.entries(ozellik)) e.setAttribute(k, String(v));
  if (ic) e.innerHTML = ic;
  return e;
};
const agac = (x: number, y: number, k: number) => `<g transform="translate(${x * B + 50} ${y * B + 52})">
  <ellipse cx="4" cy="30" rx="34" ry="10" fill="#1d4d2b" opacity=".18"/>
  <rect x="-6" y="6" width="12" height="26" rx="5" fill="#9b6a3c"/>
  <circle cx="0" cy="-6" r="${30 + (k % 3) * 2}" fill="${k % 2 ? "#4fb36a" : "#45a862"}"/>
  <circle cx="-12" cy="-14" r="16" fill="#62c57d"/><circle cx="12" cy="0" r="12" fill="#3f9d5a" opacity=".7"/></g>`;
const havuc = (x: number, y: number) => `<g class="havuc" data-k="${x},${y}" style="transform-origin:${x * B + 50}px ${y * B + 50}px">
  <g transform="translate(${x * B + 50} ${y * B + 50}) rotate(-20)">
  <path d="M-6 -20 Q-14 -34 -4 -36 Q0 -28 0 -22 Q4 -30 10 -34 Q14 -26 5 -19Z" fill="#3fae5c"/>
  <path d="M-11 -18 Q0 -24 11 -18 Q6 10 0 30 Q-6 10 -11 -18Z" fill="#ff8a1e"/>
  <path d="M-6 -8 L1 -6 M-4 4 L3 6 M-2 14 L3 15" stroke="#d96a00" stroke-width="2.5" stroke-linecap="round"/></g></g>`;

export class Bahce {
  readonly svg: SVGSVGElement;
  private bit!: SVGGElement;
  private izgara!: Izgara;
  private nesil = 0;
  sure = 380;

  constructor() {
    this.svg = svgEl("svg", { class: "bahce", role: "img", "aria-label": "Bahçe: Bit ve havuçlar" }) as SVGSVGElement;
  }

  yukle(harita: readonly string[], yon: number) {
    this.nesil++;
    this.izgara = new Izgara(harita);
    const w = this.izgara.genislik, h = this.izgara.yukseklik;
    this.svg.setAttribute("viewBox", `0 0 ${w * B} ${h * B}`);
    let ic = `<defs><pattern id="cimen" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#bfe6a8"/><path d="M4 14l2-5 2 5M13 7l2-5 2 5" stroke="#a6d68d" stroke-width="1.6" fill="none" stroke-linecap="round"/></pattern></defs>`;
    ic += `<rect width="${w * B}" height="${h * B}" fill="url(#cimen)" rx="24"/>`;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (this.izgara.gecilebilir(x, y)) ic += `<rect x="${x * B + 4}" y="${y * B + 4}" width="${B - 8}" height="${B - 8}" rx="18" fill="${(x + y) % 2 ? "#f6e7c6" : "#f2deb4"}"/>`;
    }
    const b = this.izgara.baslangic;
    ic += `<circle cx="${b.x * B + 50}" cy="${b.y * B + 50}" r="34" fill="none" stroke="#e0b979" stroke-width="5" stroke-dasharray="10 9"/>`;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!this.izgara.gecilebilir(x, y)) ic += agac(x, y, x * 7 + y * 3);
      else if (this.izgara.karVar(x, y)) ic += havuc(x, y);
    }
    this.svg.innerHTML = ic;
    this.bit = svgEl("g", { class: "bahce-bit" }) as SVGGElement;
    this.bit.innerHTML = `<g class="bit-ic"><ellipse cx="32" cy="60" rx="24" ry="7" fill="#1d4d2b" opacity=".18"/>
      <path d="M32 -6 L42 6 L22 6Z" fill="#d7262e" class="bit-yon"/>${bitIc("mutlu")}</g>`;
    this.svg.append(this.bit);
    this.konum(b.x, b.y, yon, false);
  }

  private konum(x: number, y: number, yon: number, gecis = true) {
    this.bit.style.transition = gecis ? `transform ${this.sure}ms cubic-bezier(.3,.7,.3,1)` : "none";
    /* Bit hep bize bakar; yalnızca kırmızı ok yönü gösterir */
    this.bit.style.transform = `translate(${x * B + 18}px, ${y * B + 14}px)`;
    const ok = this.bit.querySelector<SVGPathElement>(".bit-yon")!;
    ok.style.transformOrigin = "32px 32px";
    ok.style.transition = gecis ? `transform ${this.sure * 0.7}ms ease` : "none";
    const once = Number(ok.dataset.aci ?? yon * 90);
    let hedef = yon * 90;
    while (hedef - once > 180) hedef -= 360;
    while (once - hedef > 180) hedef += 360;
    ok.dataset.aci = String(hedef);
    ok.style.transform = `rotate(${hedef}deg) translateY(-36px)`;
  }

  private ruh(r: "mutlu" | "vay" | "uzgun") {
    const ic = this.bit.querySelector(".bit-ic")!;
    const ok = ic.querySelector(".bit-yon")!.outerHTML;
    ic.innerHTML = `<ellipse cx="32" cy="60" rx="24" ry="7" fill="#1d4d2b" opacity=".18"/>${ok}${bitIc(r)}`;
  }

  /** İzi oynatır; adim(i) her karede çağrılır (blok vurgusu için). */
  async oynat(iz: Kare[], adim?: (i: number) => void): Promise<boolean> {
    const kimlik = ++this.nesil;
    const bekle = (ms: number) => new Promise<boolean>((r) => setTimeout(() => r(kimlik === this.nesil), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms));
    this.ruh("mutlu");
    for (let i = 1; i < iz.length; i++) {
      const k = iz[i];
      adim?.(i);
      if (k.olay === "carpma") {
        this.ruh("uzgun");
        this.bit.classList.add("carpti");
        if (!(await bekle(600))) return false;
        this.bit.classList.remove("carpti");
        break;
      }
      this.konum(k.x, k.y, k.yon);
      if (k.temizlenen) {
        const h = this.svg.querySelector(`.havuc[data-k="${k.temizlenen.x},${k.temizlenen.y}"]`);
        setTimeout(() => h?.classList.add("toplandi"), this.sure * 0.6);
      }
      if (!(await bekle(k.olay === "ileri" ? this.sure + 40 : this.sure * 0.75))) return false;
    }
    return true;
  }
  sevin() { this.ruh("vay"); this.bit.classList.add("sevinc"); }
  uzul() { this.ruh("uzgun"); }
  durdur() { this.nesil++; }
}
