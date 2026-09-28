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

  test("resolves META-000 (Zumbi) from the authored CSV: immune to Necrotic, double weak to Holy", () => {
    const result = resolveMetaRaces(["META-000"]);

    expect(result.elementalMultipliers.Necrotic).toBe(0);
    expect(result.elementalMultipliers.Holy).toBe(2);
    expect(result.elementalMultipliers.Fire).toBe(1);
  });

  test("resolves META-000's attribute modifiers (ST+2, IQ-2, HT+4, DX unchanged)", () => {
    const result = resolveMetaRaces(["META-000"]);

    expect(result.attributeModifiers).toEqual({ ST: 2, DX: 0, IQ: -2, HT: 4 });
  });

  test("resolves META-000's innate advantage/disadvantage ids from the CSV's comma-separated cells", () => {
    const result = resolveMetaRaces(["META-000"]);

    expect(result.innateAdvantageIds).toEqual(
      expect.arrayContaining(["ADV-049", "ADV-136", "ADV-129"]),
    );
    expect(result.innateDisadvantageIds).toEqual(
      expect.arrayContaining(["DIS-141", "DIS-143", "DIS-145"]),
    );
  });

  test("stacking two meta-races multiplies their elemental multipliers together", () => {
    const single = resolveMetaRaces(["META-000"]);
    const stacked = resolveMetaRaces(["META-000", "META-001"]);

    expect(stacked.elementalMultipliers.Holy).toBe(
      single.elementalMultipliers.Holy * single.elementalMultipliers.Holy,
    );
  });

  test("stacking two meta-races sums their attribute modifiers", () => {
    const zumbi = resolveMetaRaces(["META-000"]).attributeModifiers;
    const esqueleto = resolveMetaRaces(["META-001"]).attributeModifiers;
    const stacked = resolveMetaRaces(["META-000", "META-001"]).attributeModifiers;

    expect(stacked.ST).toBe(zumbi.ST + esqueleto.ST);
    expect(stacked.HT).toBe(zumbi.HT + esqueleto.HT);
  });

  test("stacking two meta-races unions and de-duplicates shared innate ids", () => {
    const result = resolveMetaRaces(["META-000", "META-001"]);
    const occurrences = result.innateAdvantageIds.filter(
      (id) => id === "ADV-049",
    );

    expect(occurrences).toHaveLength(1);
  });

  test("an unknown meta_race_id is silently ignored, not thrown", () => {
    const result = resolveMetaRaces(["META-DOES-NOT-EXIST"]);

    expect(result.innateAdvantageIds).toEqual([]);
    expect(result.elementalMultipliers.Holy).toBe(1);
  });
});
