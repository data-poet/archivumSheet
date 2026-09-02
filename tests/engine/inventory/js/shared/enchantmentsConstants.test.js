const {
  ATTRIBUTE_EFFECT_TYPES,
  POINT_EFFECT_TYPES,
  SKILL_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  WEIGHT_EFFECT_TYPES,
  DAMAGE_RESISTANCE_EFFECT_TYPES,
  ELEMENTAL_RESISTANCE_EFFECT_TYPES,
  VALUE_EFFECT_TYPES,
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
} = require("engine/inventory/js/shared/enchantmentsConstants.js");

describe("enchantmentsConstants — Phase 2 (armor) groups", () => {
  test("WEIGHT_EFFECT_TYPES should contain exactly add_weight and remove_weight", () => {
    expect(WEIGHT_EFFECT_TYPES).toEqual(["add_weight", "remove_weight"]);
  });

  test("DAMAGE_RESISTANCE_EFFECT_TYPES should contain exactly the fortify/weaken damage-resistance pair", () => {
    expect(DAMAGE_RESISTANCE_EFFECT_TYPES).toEqual([
      "fortify_damage_resistance",
      "weaken_damage_resistance",
    ]);
  });

  test("ELEMENTAL_RESISTANCE_EFFECT_TYPES should contain exactly the fortify/weaken resistance pair", () => {
    expect(ELEMENTAL_RESISTANCE_EFFECT_TYPES).toEqual([
      "fortify_resistance",
      "weaken_resistance",
    ]);
  });

  test("VALUE_EFFECT_TYPES should union attribute + all three Phase 2 groups, with no duplicates", () => {
    const expected = [
      ...ATTRIBUTE_EFFECT_TYPES,
      ...WEIGHT_EFFECT_TYPES,
      ...DAMAGE_RESISTANCE_EFFECT_TYPES,
      ...ELEMENTAL_RESISTANCE_EFFECT_TYPES,
    ];

    expect(VALUE_EFFECT_TYPES).toEqual(expected);
    expect(new Set(VALUE_EFFECT_TYPES).size).toBe(VALUE_EFFECT_TYPES.length);
  });

  test("VALUE_EFFECT_TYPES should not include any point, skill, or spell effect types", () => {
    for (const type of [...POINT_EFFECT_TYPES, ...DIFFICULTY_EFFECT_TYPES]) {
      expect(VALUE_EFFECT_TYPES).not.toContain(type);
    }
  });

  test("FORTIFY_EFFECT_TYPES should include the three new Phase 2 fortify types", () => {
    expect(FORTIFY_EFFECT_TYPES).toEqual(
      expect.arrayContaining([
        "add_weight",
        "fortify_damage_resistance",
        "fortify_resistance",
      ]),
    );
  });

  test("WEAKEN_EFFECT_TYPES should include the three new Phase 2 weaken types", () => {
    expect(WEAKEN_EFFECT_TYPES).toEqual(
      expect.arrayContaining([
        "remove_weight",
        "weaken_damage_resistance",
        "weaken_resistance",
      ]),
    );
  });

  test("FORTIFY_EFFECT_TYPES and WEAKEN_EFFECT_TYPES should never overlap", () => {
    const overlap = FORTIFY_EFFECT_TYPES.filter((type) =>
      WEAKEN_EFFECT_TYPES.includes(type),
    );

    expect(overlap).toEqual([]);
  });

  test("skill/spell grant types (no fortify/weaken prefix) should stay out of both sign groups", () => {
    expect(FORTIFY_EFFECT_TYPES).not.toContain("skill");
    expect(FORTIFY_EFFECT_TYPES).not.toContain("spell");
    expect(WEAKEN_EFFECT_TYPES).not.toContain("skill");
    expect(WEAKEN_EFFECT_TYPES).not.toContain("spell");
  });

  test("SKILL_EFFECT_TYPES and SPELL_EFFECT_TYPES should stay untouched by the Phase 2 additions", () => {
    expect(SKILL_EFFECT_TYPES).toEqual([
      "skill",
      "fortify_skill",
      "weaken_skill",
    ]);
    expect(SPELL_EFFECT_TYPES).toEqual([
      "spell",
      "fortify_spell",
      "weaken_spell",
    ]);
  });
});
