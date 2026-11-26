import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { DIZILISLER, rauntOyna, sumoSensorOkumasi, type SumoBeyni } from "../src";

describe("sumo fiziği: ders deneyleri ligi değiştirmez", () => {
  it("varsayılan özelliklerle rauntlar ayarlanabilir fizikten önceki sonuçların aynısı", () => {
    const a: SumoBeyni = (g) => g.kenar[0] || g.kenar[1] ? [-200, -100] : g.rakip[2] ? [255, 255] : g.rakip[0] || g.rakip[1] ? [-150, 150] : g.rakip[3] || g.rakip[4] ? [150, -150] : [140, -60];
    const b: SumoBeyni = (g) => g.kenar[0] ? [-100, -255] : g.kenar[1] ? [-255, -100] : g.rakip[2] || g.rakip[1] || g.rakip[3] ? [230, 230] : [100, 180];
    const out: unknown[] = [];
    for (let t = 1; t < 6; t++) for (const d of DIZILISLER) { const r = rauntOyna([a, b], d, t); out.push([r.kazanan, r.sebep, r.sure, r.kareler.at(-1)]); }
    expect(createHash("md5").update(JSON.stringify(out)).digest("hex")).toBe("9d61aa02a8e766b295ed8c103d60aa73");
  });
  it("itme deneyi: eşitler itemez; ağır, iyi tutunan ya da bıçaklı olan iter", () => {
    const tam: SumoBeyni = () => [255, 255];
    const it = (oz: object) => rauntOyna([tam, tam], "karsi", 1, 6, [oz, {}], [[-80, 0, 0], [80, 0, Math.PI]]).kazanan;
    expect(it({})).toBeNull();
    expect(it({ kutle: 0.5 })).toBe(0);
    expect(it({ kutle: 0.3 })).toBe(1);
    expect(it({ tutunma: 1.5 })).toBe(0);
    expect(it({ bicak: false })).toBe(1);
  });
  it("sensör okuması: rakip tam karşıda orta sensör, arkada hiçbiri", () => {
    expect(sumoSensorOkumasi([0, 0, 0], [550, 0, Math.PI]).rakip).toEqual([0, 0, 1, 0, 0]); // uzakta yalnız orta
    expect(sumoSensorOkumasi([0, 0, 0], [200, 0, Math.PI]).rakip).toEqual([0, 1, 1, 1, 0]); // yakında öndeki üçü
    expect(sumoSensorOkumasi([0, 0, 0], [-200, 0, 0]).rakip).toEqual([0, 0, 0, 0, 0]);
    expect(sumoSensorOkumasi([0, 0, 0], [0, 200, 0]).rakip[0]).toBe(1);
  });
});
