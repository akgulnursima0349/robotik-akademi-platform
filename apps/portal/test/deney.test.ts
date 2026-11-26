// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { DENEY_BILESEN_ADLARI, dersBul, dersiDogrula, DERSLER } from "@sra/mufredat";
import { DENEYLER } from "../src/deney";
import { enCokGorenSensor, konumYazisi, sensorGostergesi } from "../src/deney/sensor-gostergesi";

const tus = (e: Element, key: string) => e.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

describe("deney kayıt defteri", () => {
  it("portalın bileşenleri müfredatın tanıdığı adlarla birebir", () => {
    expect(Object.keys(DENEYLER).sort()).toEqual([...DENEY_BILESEN_ADLARI].sort());
    for (const d of DERSLER) expect(DENEYLER[d.dene.bilesen], d.kimlik).toBeDefined();
  });
  it("doğrulayıcı olmayan bileşeni ve geçersiz kaydırıcıyı hata sayar", () => {
    const d = JSON.parse(JSON.stringify(dersBul("siroline-sensor")));
    d.dene.bilesen = "olmayan";
    expect(dersiDogrula(d).join()).toMatch(/deney bileşeni tanınmıyor \(olmayan\)/);
    d.dene.bilesen = "kaydirici"; d.dene.ayar = { en: 10, ust: 5 };
    expect(dersiDogrula(d).join()).toMatch(/kaydırıcının/);
    d.dene.ayar = { en: 0, ust: 255, adim: 5 };
    expect(dersiDogrula(d)).toEqual([]);
  });
});

describe("sensör göstergesi", () => {
  it("bandı en çok gören sensör; hiçbiri görmüyorsa yok", () => {
    expect(enCokGorenSensor([45, 45, 45, 950, 950, 45, 45, 45])).toBe(3);
    expect(enCokGorenSensor([45, 45, 45, 45, 45, 45, 45, 45])).toBeNull();
    expect(enCokGorenSensor([950, 950, 950, 45, 950, 950, 950, 950], "siyah")).toBe(3);
    expect([konumYazisi(0), konumYazisi(3500), konumYazisi(7000)]).toEqual(["çizgi solda", "çizgi ortada", "çizgi sağda"]);
  });
  it("ok tuşlarıyla kayar; farklı sensörler bildirilir, aynı sensörde kalınca bildirilmez", () => {
    const bildirilen: (string | number)[] = [];
    const g = sensorGostergesi({ zemin: "beyaz-uzerinde-siyah-bant" }, (d) => bildirilen.push(d));
    document.body.append(g);
    const svg = g.querySelector(".sg-svg")!;
    expect(g.dataset.konum).toBe("3500");
    expect(bildirilen).toEqual([]); // açılışta bildirim yok
    tus(svg, "ArrowLeft"); tus(svg, "ArrowLeft");
    expect(bildirilen).toEqual([4]);
    for (let i = 0; i < 4; i++) tus(svg, "ArrowLeft");
    expect(bildirilen).toEqual([4, 5]);
    expect(Number(g.dataset.konum)).toBeGreaterThan(4500);
    expect(svg.getAttribute("aria-valuetext")).toMatch(/s\[5\] altında, konum \d+, çizgi sağda/);
    /* robot bir anda en sağa: bant hiçbir sensörün altında değil; QTR gibi çizgiyi son gördüğü tarafta (sağda) sanar */
    tus(svg, "End");
    expect(bildirilen).toEqual([4, 5]);
    expect(g.querySelectorAll(".sg-isik.yanik").length).toBe(0);
    expect(Number(g.dataset.konum)).toBe(7000);
    tus(svg, "Home"); for (let i = 0; i < 8; i++) tus(svg, "ArrowRight");
    expect(g.querySelectorAll(".sg-isik.yanik").length).toBeGreaterThan(0);
    expect(g.querySelectorAll(".sg-cubuk__sayi")[7].textContent).not.toBe("45");
    g.remove();
  });
});
