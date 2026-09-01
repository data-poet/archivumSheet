const {
  ELEMENTAL_TYPES,
  calculateElementalResistances,
} = require("engine/character/js/attributes/elementalResistances");

describe("Elemental Damage Resistances", () => {
  test("defaults race_base to 1 (normal damage) when a type is missing from raceMultipliers", () => {
    const result = calculateElementalResistances({}, {});

    for (const type of ELEMENTAL_TYPES) {
      expect(result[type].race_base).toBe(1);
      expect(result[type].final).toBe(1);
    }
  });

  test("covers all 10 documented elemental types", () => {
    expect(ELEMENTAL_TYPES).toEqual([
      "Fire",
      "Water",
      "Earth",
      "Air",
      "Electricity",
      "Corrosion",
      "Necrotic",
      "Holy",
      "Void",
      "Arcane",
    ]);
    expect(Object.keys(calculateElementalResistances()).sort()).toEqual(
      [...ELEMENTAL_TYPES].sort(),
    );
  });

  test("final = race_base + modifier + enchantment_modifier when the sum stays non-negative", () => {
    const result = calculateElementalResistances(
      { Fire: 1.5 },
      { Fire: { modifier: 0.3, enchantment_modifier: -0.1 } },
    );

    expect(result.Fire).toEqual({
      race_base: 1.5,
      modifier: 0.3,
      enchantment_modifier: -0.1,
      has_enchantment_modifier: false,
      final: 1.7,
    });
  });

  test("floors final at 0 when modifiers would push it negative", () => {
    const result = calculateElementalResistances(
      { Fire: 0.5 },
      { Fire: { modifier: -0.9 } },
    );

    expect(result.Fire.final).toBe(0);
  });

  test("has no upper cap — a character can become arbitrarily weak against an element", () => {
    const result = calculateElementalResistances(
      { Fire: 1 },
      { Fire: { modifier: 50 } },
    );

    expect(result.Fire.final).toBe(51);
  });

  test("a literal race_base of 0 (immune) is preserved, not treated as missing", () => {
    const result = calculateElementalResistances({ Corrosion: 0 }, {});

    expect(result.Corrosion.race_base).toBe(0);
    expect(result.Corrosion.final).toBe(0);
  });

  test("has_enchantment_modifier is presence-based, matching the primary/secondary attribute pattern — present even when the net enchantment value is 0", () => {
    const result = calculateElementalResistances(
      { Holy: 1 },
      { Holy: { enchantment_modifier: 0, has_enchantment_modifier: true } },
    );

    expect(result.Holy.has_enchantment_modifier).toBe(true);
    expect(result.Holy.enchantment_modifier).toBe(0);
    expect(result.Holy.final).toBe(1);
  });

  test("config entries for undocumented types are ignored — only ELEMENTAL_TYPES are ever returned", () => {
    const result = calculateElementalResistances(
      { Fire: 1, Unobtainium: 5 },
      { Unobtainium: { modifier: 10 } },
    );

    expect(result.Unobtainium).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(ELEMENTAL_TYPES.length);
  });
});
