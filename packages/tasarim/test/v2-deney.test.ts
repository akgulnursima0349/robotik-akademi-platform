// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { adimaOturt, canliGrafik, kaydirici, pencereKirp } from "../src/v2";

describe("kaydırıcı", () => {
  it("değeri sınırlara ve adıma oturtur", () => {
    expect(adimaOturt(123, 0, 255, 5)).toBe(125);
    expect(adimaOturt(-10, 0, 255, 5)).toBe(0);
    expect(adimaOturt(999, 0, 255, 5)).toBe(255);
    expect(adimaOturt(0.34, 0, 1, 0.1)).toBe(0.3);
  });
  it("sürüklerken değişince, bırakınca denendi bildirir; değer ve birim yazılır", () => {
    const degisen: number[] = [], birakilan: number[] = [];
    const k = kaydirici({ etiket: "Hız", en: 0, ust: 255, adim: 5, birim: "PWM", baslangic: 122, degisince: (d) => degisen.push(d), birakinca: (d) => birakilan.push(d) });
    const g = k.querySelector("input")!;
    expect(g.value).toBe("120");
    expect(k.querySelector("output")!.textContent).toBe("120 PWM");
    expect(k.querySelector("label")!.getAttribute("for")).toBe(g.id);
    g.value = "200"; g.dispatchEvent(new Event("input"));
    g.value = "205"; g.dispatchEvent(new Event("input"));
    expect(degisen).toEqual([200, 205]); expect(birakilan).toEqual([]);
    g.dispatchEvent(new Event("change"));
    expect(birakilan).toEqual([205]);
    expect(g.getAttribute("aria-valuetext")).toBe("205 PWM");
  });
});

describe("canlı grafik", () => {
  it("pencere kırpma: eski noktalar düşer, pencerenin başındaki son nokta kalır", () => {
    const n = [{ t: 0, d: 1 }, { t: 2, d: 2 }, { t: 5, d: 3 }, { t: 11, d: 4 }];
    expect(pencereKirp(n, 12, 10)).toEqual([{ t: 0, d: 1 }, { t: 2, d: 2 }, { t: 5, d: 3 }, { t: 11, d: 4 }].slice(0));
    expect(pencereKirp(n, 14, 10)).toEqual([{ t: 2, d: 2 }, { t: 5, d: 3 }, { t: 11, d: 4 }]);
    expect(pencereKirp(n, 30, 10)).toEqual([{ t: 11, d: 4 }]);
  });
  it("10 saniyelik pencere; sınır dışı değer kırpılır; son değer yazılır", async () => {
    let t = 100;
    const g = canliGrafik({ baslik: "Konum", en: 0, ust: 7000, saat: () => t });
    document.body.append(g.kap);
    g.ekle(3500); t = 104; g.ekle(9999); t = 108; g.ekle(-50);
    expect(g.noktalar().length).toBe(3);
    t = 115;
    expect(g.noktalar().map((n) => n.d)).toEqual([9999, -50]);
    await new Promise((r) => setTimeout(r, 80));
    const ys = g.kap.querySelector("polyline")!.getAttribute("points")!.split(" ").map((p) => Number(p.split(",")[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...ys)).toBeLessThanOrEqual(108);
    expect(g.kap.querySelector(".s2-grafik__son")!.textContent).toBe("-50");
    expect(g.kap.querySelector(".s2-gizli")!.textContent).toBe("Konum: -50");
    g.kap.remove();
  });
});
