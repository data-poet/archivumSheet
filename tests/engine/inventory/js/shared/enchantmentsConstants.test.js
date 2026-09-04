const {
  ATTRIBUTE_EFFECT_TYPES,
  POINT_EFFECT_TYPES,
  SKILL_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  WEIGHT_EFFECT_TYPES,
  DAMAGE_RESISTANCE_EFFECT_TYPES,
  ELEMENTAL_RESISTANCE_EFFECT_TYPES,
  DAMAGE_EFFECT_TYPES,
  REQUISITE_EFFECT_TYPES,
  FLAT_EFFECT_TYPES,
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

  test("VALUE_EFFECT_TYPES should include attribute + all three Phase 2 groups, with no duplicates", () => {
    const phase1and2 = [
      ...ATTRIBUTE_EFFECT_TYPES,
      ...WEIGHT_EFFECT_TYPES,
      ...DAMAGE_RESISTANCE_EFFECT_TYPES,
      ...ELEMENTAL_RESISTANCE_EFFECT_TYPES,
    ];

    // Phase 3 (weapons) groups are folded in too, so this only asserts the Phase 1/2 subset, not exact equality.
    expect(VALUE_EFFECT_TYPES).toEqual(expect.arrayContaining(phase1and2));
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

describe("enchantmentsConstants — Phase 3 (weapons) groups", () => {
  test("DAMAGE_EFFECT_TYPES should contain exactly the fortify/weaken damage pair", () => {
    expect(DAMAGE_EFFECT_TYPES).toEqual(["fortify_damage", "weaken_damage"]);
  });

  test("REQUISITE_EFFECT_TYPES should contain exactly the add/remove requisite pair", () => {
    expect(REQUISITE_EFFECT_TYPES).toEqual([
      "add_requisite",
      "remove_requisite",
    ]);
  });

  test("FLAT_EFFECT_TYPES should contain exactly special_effect", () => {
    expect(FLAT_EFFECT_TYPES).toEqual(["special_effect"]);
  });

  test("FLAT_EFFECT_TYPES should not be part of VALUE_EFFECT_TYPES", () => {
    for (const type of FLAT_EFFECT_TYPES) {
      expect(VALUE_EFFECT_TYPES).not.toContain(type);
    }
  });

  test("VALUE_EFFECT_TYPES should union in DAMAGE_EFFECT_TYPES and REQUISITE_EFFECT_TYPES, with no duplicates", () => {
    for (const type of [...DAMAGE_EFFECT_TYPES, ...REQUISITE_EFFECT_TYPES]) {
      expect(VALUE_EFFECT_TYPES).toContain(type);
    }
    expect(new Set(VALUE_EFFECT_TYPES).size).toBe(VALUE_EFFECT_TYPES.length);
  });

  test("FORTIFY_EFFECT_TYPES should include fortify_damage and add_requisite", () => {
    expect(FORTIFY_EFFECT_TYPES).toEqual(
      expect.arrayContaining(["fortify_damage", "add_requisite"]),
    );
  });

  test("WEAKEN_EFFECT_TYPES should include weaken_damage and remove_requisite", () => {
    expect(WEAKEN_EFFECT_TYPES).toEqual(
      expect.arrayContaining(["weaken_damage", "remove_requisite"]),
    );
  });

  test("FLAT_EFFECT_TYPES should stay out of both sign groups", () => {
    for (const type of FLAT_EFFECT_TYPES) {
      expect(FORTIFY_EFFECT_TYPES).not.toContain(type);
      expect(WEAKEN_EFFECT_TYPES).not.toContain(type);
    }
  });

  test("FORTIFY_EFFECT_TYPES and WEAKEN_EFFECT_TYPES should still never overlap", () => {
    const overlap = FORTIFY_EFFECT_TYPES.filter((type) =>
      WEAKEN_EFFECT_TYPES.includes(type),
    );

    expect(overlap).toEqual([]);
  });
});
