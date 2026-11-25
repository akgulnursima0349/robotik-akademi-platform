// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { adimGostergesi, atolyeKarti, bildirim, dugme, kok, parcaliIlerleme, secici, sekmeler, seviyeGostergesi, xpHap, yildizlar } from "../src/v2";

const tus = (e: Element, key: string) => e.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

describe("v2 bileşenleri", () => {
  it("kök: .sra2 sınıfı ve seviye", () => {
    const d = kok(document.createElement("div"), "okul-oncesi");
    expect(d.classList.contains("sra2")).toBe(true);
    expect(d.dataset.seviye).toBe("okul-oncesi");
    kok(d);
    expect(d.dataset.seviye).toBeUndefined();
  });

  it("düğme: tür sınıfı, yalnız ikonda erişilebilir ad, devre dışı ve yükleniyor", () => {
    const a = dugme({ metin: "Çalıştır", tur: "ana", ikon: "oynat" });
    expect(a.tagName).toBe("BUTTON");
    expect(a.className).toContain("s2-dugme--ana");
    expect(a.textContent!.trim()).toBe("Çalıştır");
    const i = dugme({ metin: "Geri", ikon: "geri", yalnizIkon: true });
    expect(i.getAttribute("aria-label")).toBe("Geri");
    expect(i.textContent!.trim()).toBe("");
    expect((dugme({ metin: "x", devreDisi: true }) as HTMLButtonElement).disabled).toBe(true);
    const bag = dugme({ metin: "Git", href: "#a", devreDisi: true });
    expect(bag.getAttribute("aria-disabled")).toBe("true");
    expect(bag.hasAttribute("href")).toBe(false);
    expect(dugme({ metin: "Kaydet", yukleniyor: true }).getAttribute("aria-busy")).toBe("true");
  });

  it("atölye kartı: seçili ve kilitli hâller", () => {
    const k = atolyeKarti({ kimlik: "python", ad: "Python", aciklama: "Kenshin'i kodla.", href: "#p", secili: true });
    expect(k.getAttribute("aria-current")).toBe("true");
    expect(k.getAttribute("style")).toContain("--sra2-atolye-python");
    const kl = atolyeKarti({ kimlik: "cpp", ad: "C++", aciklama: "x", href: "#c", kilitli: true });
    expect(kl.getAttribute("aria-disabled")).toBe("true");
    expect(kl.hasAttribute("href")).toBe(false);
    expect(kl.textContent).toContain("Yakında");
  });

  it("ilerleme ve yıldızlar: doğru değerler ve okunur metin", () => {
    const p = parcaliIlerleme(6, 3, true, "Modül");
    expect(p.getAttribute("role")).toBe("progressbar");
    expect(p.getAttribute("aria-valuenow")).toBe("3");
    expect(p.getAttribute("aria-valuemax")).toBe("6");
    expect(p.querySelectorAll(".bitti")).toHaveLength(3);
    expect(p.querySelectorAll(".simdi")).toHaveLength(1);
    const y = yildizlar(5, 3);
    expect(y.getAttribute("aria-label")).toBe("5 yıldızdan 3 tanesi kazanıldı");
    expect(y.querySelectorAll(".dolu")).toHaveLength(3);
    const s = seviyeGostergesi(7, "Mühendis", 0.64);
    expect(s.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("64");
    expect(xpHap(30).getAttribute("aria-label")).toBe("+30 deneyim puanı");
  });

  it("seviye seçici: radiogroup, tek seçim, ok tuşlarıyla gezinme", () => {
    const degisti = vi.fn();
    const s = secici("Seviye", [["a", "A"], ["b", "B"], ["c", "C"]], "b", degisti);
    document.body.append(s);
    const r = [...s.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(s.getAttribute("role")).toBe("radiogroup");
    expect(r.map((x) => x.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(r.map((x) => x.tabIndex)).toEqual([-1, 0, -1]);
    expect(degisti).not.toHaveBeenCalled();
    r[1].focus(); tus(r[1], "ArrowRight");
    expect(r[2].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(r[2]);
    tus(r[2], "ArrowRight");
    expect(r[0].getAttribute("aria-checked")).toBe("true");
    tus(r[0], "End");
    expect(degisti).toHaveBeenLastCalledWith("c");
    r[0].click();
    expect(degisti).toHaveBeenLastCalledWith("a");
    s.remove();
  });

  it("sekmeler: tablist, bağlı paneller, ok tuşlarıyla geçiş", () => {
    const k = sekmeler("Görünüm", [{ ad: "Kod", icerik: document.createTextNode("kod") }, { ad: "Sahne", icerik: document.createTextNode("sahne") }]);
    document.body.append(k);
    const t = [...k.querySelectorAll<HTMLButtonElement>('[role="tab"]')], p = [...k.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(k.querySelector('[role="tablist"]')!.getAttribute("aria-label")).toBe("Görünüm");
    expect(t[0].getAttribute("aria-controls")).toBe(p[0].id);
    expect(p[0].getAttribute("aria-labelledby")).toBe(t[0].id);
    expect([p[0].hidden, p[1].hidden]).toEqual([false, true]);
    t[0].focus(); tus(t[0], "ArrowLeft");
    expect(t[1].getAttribute("aria-selected")).toBe("true");
    expect([p[0].hidden, p[1].hidden]).toEqual([true, false]);
    k.remove();
  });

  it("adım göstergesi: biten adımlar okunur, şimdiki aria-current", () => {
    const a = adimGostergesi(1);
    const li = a.querySelectorAll("li");
    expect(li).toHaveLength(4);
    expect(li[0].classList.contains("bitti")).toBe(true);
    expect(li[0].textContent).toContain("(bitti)");
    expect(li[1].getAttribute("aria-current")).toBe("step");
    expect(a.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("bildirim: hata alert, diğerleri status", () => {
    expect(bildirim("hata", "Olmadı.", "Satır 3").getAttribute("role")).toBe("alert");
    expect(bildirim("basari", "Süper!", "x").getAttribute("role")).toBe("status");
  });
});
