const {
  collectEquippedEnchantments,
} = require("engine/character/js/enchantments/collectEquippedEnchantments");

function enchantment(overrides) {
  return {
    enchantment_id: "ENCHANTMENT-X",
    enchantment_name: "Test",
    enchantment_effect_type: "fortify_attribute",
    target: null,
    value: null,
    extraPoints: null,
    price: 0,
    _instanceId: null,
    ...overrides,
  };
}

describe("collectEquippedEnchantments", () => {
  test("Should return all-empty structures for no equipped items", () => {
    const result = collectEquippedEnchantments([]);

    expect(result).toEqual({
      attributeModifiers: {},
      advantageIds: [],
      disadvantageIds: [],
      skillGrants: {},
      skillModifiers: {},
      spellGrants: {},
      spellModifiers: {},
    });
  });

  test("Should ignore items with no enchantments", () => {
    const result = collectEquippedEnchantments([{ enchantments: [] }, {}]);
    expect(result.attributeModifiers).toEqual({});
  });

  test("Should sum fortify_attribute value into attributeModifiers under the engine key", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "fortify_attribute",
            target: "ST",
            value: 2,
          }),
        ],
      },
    ]);

    expect(result.attributeModifiers).toEqual({ ST: 2 });
  });

  test("Should sum weaken_attribute (negative value) into the same map", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "fortify_attribute",
            target: "ST",
            value: 2,
          }),
          enchantment({
            enchantment_effect_type: "weaken_attribute",
            target: "ST",
            value: -1,
          }),
        ],
      },
    ]);

    expect(result.attributeModifiers).toEqual({ ST: 1 });
  });

  test("Should translate 'Basic Speed' target to the engine's BasicSpeed key", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "fortify_attribute",
            target: "Basic Speed",
            value: 1,
          }),
        ],
      },
    ]);

    expect(result.attributeModifiers).toEqual({ BasicSpeed: 1 });
    expect(result.attributeModifiers["Basic Speed"]).toBeUndefined();
  });

  test("Should sum across multiple equipped items targeting the same attribute", () => {
    const result = collectEquippedEnchantments([
      { enchantments: [enchantment({ target: "DX", value: 1 })] },
      { enchantments: [enchantment({ target: "DX", value: 3 })] },
    ]);

    expect(result.attributeModifiers).toEqual({ DX: 4 });
  });

  test("Should collect advantage/disadvantage target ids", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "advantage",
            target: "ADV-000",
          }),
          enchantment({
            enchantment_effect_type: "disadvantage",
            target: "DIS-000",
          }),
        ],
      },
    ]);

    expect(result.advantageIds).toEqual(["ADV-000"]);
    expect(result.disadvantageIds).toEqual(["DIS-000"]);
  });

  test("Should collect skill grants as an array of extraPoints candidates per skill_id", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "skill",
            target: "SKILL-014",
            extraPoints: 0,
          }),
        ],
      },
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "skill",
            target: "SKILL-014",
            extraPoints: 2,
          }),
        ],
      },
    ]);

    expect(result.skillGrants).toEqual({ "SKILL-014": [0, 2] });
  });

  test("Should sum fortify_skill/weaken_skill extraPoints into skillModifiers", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "fortify_skill",
            target: "SKILL-014",
            extraPoints: 3,
          }),
          enchantment({
            enchantment_effect_type: "weaken_skill",
            target: "SKILL-014",
            extraPoints: -1,
          }),
        ],
      },
    ]);

    expect(result.skillModifiers).toEqual({ "SKILL-014": 2 });
  });

  test("Should collect spell grants and modifiers keyed by spell name", () => {
    const result = collectEquippedEnchantments([
      {
        enchantments: [
          enchantment({
            enchantment_effect_type: "spell",
            target: "Moldar Mana",
            extraPoints: 1,
          }),
          enchantment({
            enchantment_effect_type: "fortify_spell",
            target: "Moldar Mana",
            extraPoints: 2,
          }),
        ],
      },
    ]);

    expect(result.spellGrants).toEqual({ "Moldar Mana": [1] });
    expect(result.spellModifiers).toEqual({ "Moldar Mana": 2 });
  });

  test("Should ignore unrecognized effect types without throwing", () => {
    const result = collectEquippedEnchantments([
      { enchantments: [enchantment({ enchantment_effect_type: "custom" })] },
    ]);

    expect(result.attributeModifiers).toEqual({});
    expect(result.advantageIds).toEqual([]);
  });

  test("Should not add a key for a target that never appears (presence-aware, not defaulted)", () => {
    const result = collectEquippedEnchantments([
      { enchantments: [enchantment({ target: "ST", value: 1 })] },
    ]);

    expect("DX" in result.attributeModifiers).toBe(false);
  });
});
