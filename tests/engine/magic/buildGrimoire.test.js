const { buildGrimoire } = require("engine/magic/buildGrimoire");

function mockRow(overrides = {}) {
  return {
    spell_name: "Moldar Mana",
    spell_school: "Arcanomancia",
    spell_type: "Mental",
    spell_tier: "Aprendiz",
    spell_difficulty: "F",
    ...overrides,
  };
}

describe("buildGrimoire", () => {
  const character = {
    primary_attributes: { IQ: { base_value: 10, value: 10 } },
  };

  test("Should compute level and a nonzero cost for a normally-purchased spell", () => {
    const result = buildGrimoire(
      {
        "ARC-0001": {
          row: mockRow(),
          base_value: 10,
          modifier: 2,
        },
      },
      character,
    );

    const spell = result.spells["ARC-0001"];

    expect(spell.value).toBe(12);
    expect(spell.is_enchantment).toBe(false);
    expect(spell.points).toBeGreaterThan(0);
    expect(result.character_points.spells).toBe(spell.points);
  });

  test("Should zero cost for an enchantment-granted spell (is_enchantment: true)", () => {
    const result = buildGrimoire(
      {
        "ARC-0001": {
          row: mockRow(),
          base_value: 10,
          modifier: 0,
          is_enchantment: true,
        },
      },
      character,
    );

    const spell = result.spells["ARC-0001"];

    expect(spell.is_enchantment).toBe(true);
    expect(spell.points).toBe(0);
    expect(result.character_points.spells).toBe(0);
  });

  test("Should add enchantment_modifier into the final level without affecting cost", () => {
    const withoutModifier = buildGrimoire(
      {
        "ARC-0001": {
          row: mockRow(),
          base_value: 10,
          modifier: 0,
        },
      },
      character,
    );

    const withModifier = buildGrimoire(
      {
        "ARC-0001": {
          row: mockRow(),
          base_value: 10,
          modifier: 0,
          enchantment_modifier: 3,
          has_enchantment_modifier: true,
        },
      },
      character,
    );

    expect(withModifier.spells["ARC-0001"].value).toBe(
      withoutModifier.spells["ARC-0001"].value + 3,
    );
    expect(withModifier.spells["ARC-0001"].has_enchantment_modifier).toBe(true);
    expect(withModifier.spells["ARC-0001"].points).toBe(
      withoutModifier.spells["ARC-0001"].points,
    );
  });

  test("Should apply a negative enchantment_modifier (weaken)", () => {
    const result = buildGrimoire(
      {
        "ARC-0001": {
          row: mockRow(),
          base_value: 14,
          modifier: 0,
          enchantment_modifier: -3,
        },
      },
      character,
    );

    expect(result.spells["ARC-0001"].value).toBe(11);
  });

  test("Should default enchantment fields to false/0 when absent (backward compatible)", () => {
    const result = buildGrimoire(
      {
        "ARC-0001": { row: mockRow(), base_value: 10, modifier: 0 },
      },
      character,
    );

    expect(result.spells["ARC-0001"].enchantment_modifier).toBe(0);
    expect(result.spells["ARC-0001"].has_enchantment_modifier).toBe(false);
    expect(result.spells["ARC-0001"].is_enchantment).toBe(false);
  });

  test("Should skip a spell entry with no row (safety)", () => {
    const result = buildGrimoire({ "ARC-0001": { base_value: 10 } }, character);

    expect(result.spells["ARC-0001"]).toBeUndefined();
  });
});
