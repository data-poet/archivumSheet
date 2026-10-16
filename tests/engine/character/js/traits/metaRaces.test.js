const {
  ADVANTAGE,
  DISADVANTAGE,
  META_RACE,
} = require("tests/helpers/dataRefs");
const { resolveMetaRaces } = require("engine/character/js/traits/metaRaces");
const {
  ELEMENTAL_TYPES,
} = require("engine/character/js/attributes/elementalResistances");

describe("META-RACES", () => {
  test("returns all-1 multipliers, 0 attribute modifiers and empty id lists when nothing is selected", () => {
    const result = resolveMetaRaces([]);

    for (const type of ELEMENTAL_TYPES) {
      expect(result.elementalMultipliers[type]).toBe(1);
    }
    expect(result.attributeModifiers).toEqual({ ST: 0, DX: 0, IQ: 0, HT: 0 });
    expect(result.innateAdvantageIds).toEqual([]);
    expect(result.innateDisadvantageIds).toEqual([]);
  });

  test("resolves Zumbi from the authored CSV: immune to Necrotic, double weak to Holy", () => {
    const result = resolveMetaRaces([META_RACE.zumbi]);

    expect(result.elementalMultipliers.Necrotic).toBe(0);
    expect(result.elementalMultipliers.Holy).toBe(2);
    expect(result.elementalMultipliers.Fire).toBe(1);
  });

  test("resolves Zumbi's attribute modifiers (ST+2, IQ-2, HT+4, DX unchanged)", () => {
    const result = resolveMetaRaces([META_RACE.zumbi]);

    expect(result.attributeModifiers).toEqual({ ST: 2, DX: 0, IQ: -2, HT: 4 });
  });

  test("resolves Zumbi's innate advantage/disadvantage ids from the CSV's comma-separated cells", () => {
    const result = resolveMetaRaces([META_RACE.zumbi]);

    expect(result.innateAdvantageIds).toEqual(
      expect.arrayContaining([
        ADVANTAGE.hipoalgia,
        ADVANTAGE.naoRespira,
        ADVANTAGE.toleranciaAFerimentosSemSangue,
      ]),
    );
    expect(result.innateDisadvantageIds).toEqual(
      expect.arrayContaining([
        DISADVANTAGE.fragilNaoNatural,
        DISADVANTAGE.monstruoso,
        DISADVANTAGE.semRecuperacaoTotal,
      ]),
    );
  });

  test("stacking two meta-races multiplies their elemental multipliers together", () => {
    const single = resolveMetaRaces([META_RACE.zumbi]);
    const stacked = resolveMetaRaces([META_RACE.zumbi, META_RACE.esqueleto]);

    expect(stacked.elementalMultipliers.Holy).toBe(
      single.elementalMultipliers.Holy * single.elementalMultipliers.Holy,
    );
  });

  test("stacking two meta-races sums their attribute modifiers", () => {
    const zumbi = resolveMetaRaces([META_RACE.zumbi]).attributeModifiers;
    const esqueleto = resolveMetaRaces([
      META_RACE.esqueleto,
    ]).attributeModifiers;
    const stacked = resolveMetaRaces([
      META_RACE.zumbi,
      META_RACE.esqueleto,
    ]).attributeModifiers;

    expect(stacked.ST).toBe(zumbi.ST + esqueleto.ST);
    expect(stacked.HT).toBe(zumbi.HT + esqueleto.HT);
  });

  test("stacking two meta-races unions and de-duplicates shared innate ids", () => {
    const result = resolveMetaRaces([META_RACE.zumbi, META_RACE.esqueleto]);
    const occurrences = result.innateAdvantageIds.filter(
      (id) => id === ADVANTAGE.hipoalgia,
    );

    expect(occurrences).toHaveLength(1);
  });

  test("an unknown meta_race_id is silently ignored, not thrown", () => {
    const result = resolveMetaRaces(["META-DOES-NOT-EXIST"]);

    expect(result.innateAdvantageIds).toEqual([]);
    expect(result.elementalMultipliers.Holy).toBe(1);
  });
});
