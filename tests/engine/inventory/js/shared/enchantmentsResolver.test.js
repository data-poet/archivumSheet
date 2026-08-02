const {
  resolveEnchantmentPrice,
  resolveEnchantmentEntry,
  resolveItemEnchantments,
} = require("engine/inventory/js/shared/enchantmentsResolver");

describe("enchantmentsResolver", () => {
  describe("resolveEnchantmentPrice — attribute type", () => {
    const fortifyST = {
      enchantment_id: "ENCHANTMENT-000",
      enchantment_name: "Fortificar ST",
      enchantment_effect_type: "fortify_attribute",
      enchantment_base_value: 1,
      enchantment_step: 1,
      enchantment_base_price: 5000,
      enchantment_price_per_extra_value: 5000,
    };

    test("Should charge only base_price at base_value", () => {
      const price = resolveEnchantmentPrice({ value: 1 }, fortifyST, {});
      expect(price).toBe(5000);
    });

    test("Should add price_per_extra_value per extra step above base", () => {
      const price = resolveEnchantmentPrice({ value: 3 }, fortifyST, {});
      // base 5000 + 2 extra steps × 5000
      expect(price).toBe(15000);
    });

    test("Should compute Basic Speed the same as any other attribute (now integer step)", () => {
      const fortifyBasicSpeed = {
        ...fortifyST,
        enchantment_target: "Basic Speed",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 5000,
        enchantment_price_per_extra_value: 5000,
      };

      const price = resolveEnchantmentPrice(
        { value: 3 },
        fortifyBasicSpeed,
        {},
      );

      // base 5000 + 2 extra steps × 5000
      expect(price).toBe(15000);
    });

    test("Should price a weaken (negative value) the same as the equivalent-magnitude fortify", () => {
      const weakenST = {
        ...fortifyST,
        enchantment_effect_type: "weaken_attribute",
      };

      const fortifyPrice = resolveEnchantmentPrice({ value: 3 }, fortifyST, {});
      const weakenPrice = resolveEnchantmentPrice({ value: -3 }, weakenST, {});

      expect(weakenPrice).toBe(fortifyPrice);
      expect(weakenPrice).toBeGreaterThan(0);
    });
  });

  describe("resolveEnchantmentPrice — advantage/disadvantage type", () => {
    const grantAdvantage = {
      enchantment_id: "ENCHANTMENT-026",
      enchantment_effect_type: "advantage",
      enchantment_price_per_point: 50,
    };

    const grantDisadvantage = {
      enchantment_id: "ENCHANTMENT-027",
      enchantment_effect_type: "disadvantage",
      enchantment_price_per_point: 50,
    };

    const targetsDb = {
      advantages: { "ADV-000": { name: "Atraente", cost: 5 } },
      disadvantages: {
        "DIS-000": { name: "Aparência Desagradável", cost: -5 },
      },
    };

    test("Should price an advantage by its own cost × price_per_point", () => {
      const price = resolveEnchantmentPrice(
        { target: "ADV-000" },
        grantAdvantage,
        targetsDb,
      );

      expect(price).toBe(250);
    });

    test("Should take the absolute value of a (negative) disadvantage cost", () => {
      const price = resolveEnchantmentPrice(
        { target: "DIS-000" },
        grantDisadvantage,
        targetsDb,
      );

      expect(price).toBe(250);
    });

    test("Should price 0 for an unknown target rather than throwing", () => {
      const price = resolveEnchantmentPrice(
        { target: "ADV-DOES-NOT-EXIST" },
        grantAdvantage,
        targetsDb,
      );

      expect(price).toBe(0);
    });
  });

  describe("resolveEnchantmentPrice — skill/spell type", () => {
    const addSkill = {
      enchantment_id: "ENCHANTMENT-028",
      enchantment_effect_type: "skill",
      enchantment_price_per_extra_value: 2000,
      enchantment_price_per_difficulty: 2500,
    };

    const fortifySpell = {
      enchantment_id: "ENCHANTMENT-032",
      enchantment_effect_type: "fortify_spell",
      enchantment_price_per_extra_value: 2000,
      enchantment_price_per_difficulty: 2500,
    };

    const targetsDb = {
      skills: {
        "SKILL-014": { name: "Esquiva e Aparo", difficulty: "D" },
      },
      spells: {
        "Moldar Mana": { name: "Moldar Mana", difficulty: "F" },
      },
    };

    test("Should price by tier index × price_per_difficulty with no extra points", () => {
      const price = resolveEnchantmentPrice(
        { target: "SKILL-014", extraPoints: 0 },
        addSkill,
        targetsDb,
      );

      // D = tier 3 -> 3 × 2500
      expect(price).toBe(7500);
    });

    test("Should add extraPoints × price_per_extra_value on top of the tier price", () => {
      const price = resolveEnchantmentPrice(
        { target: "SKILL-014", extraPoints: 2 },
        addSkill,
        targetsDb,
      );

      // 3 × 2500 + 2 × 2000
      expect(price).toBe(11500);
    });

    test("Should apply the same formula to spells, keyed by name", () => {
      const price = resolveEnchantmentPrice(
        { target: "Moldar Mana", extraPoints: 1 },
        fortifySpell,
        targetsDb,
      );

      // F = tier 1 -> 1 × 2500 + 1 × 2000
      expect(price).toBe(4500);
    });

    test("Should price a negative (weaken) extraPoints using its magnitude, not go negative", () => {
      const weakenSkill = {
        ...addSkill,
        enchantment_effect_type: "weaken_skill",
      };

      const price = resolveEnchantmentPrice(
        { target: "SKILL-014", extraPoints: -2 },
        weakenSkill,
        targetsDb,
      );

      // D = tier 3 -> 3 × 2500 + |-2| × 2000
      expect(price).toBe(11500);
    });

    test("Should default extraPoints to 0 when absent", () => {
      const price = resolveEnchantmentPrice(
        { target: "Moldar Mana" },
        fortifySpell,
        targetsDb,
      );

      expect(price).toBe(2500);
    });
  });

  describe("resolveEnchantmentPrice — unknown effect_type", () => {
    test("Should return 0 rather than throwing", () => {
      const price = resolveEnchantmentPrice(
        {},
        { enchantment_effect_type: "not_a_real_type" },
        {},
      );

      expect(price).toBe(0);
    });
  });

  describe("resolveEnchantmentEntry", () => {
    test("Should merge entry + enchantment into a display-ready application", () => {
      const enchantment = {
        enchantment_id: "ENCHANTMENT-000",
        enchantment_name: "Fortificar ST",
        enchantment_effect_type: "fortify_attribute",
        enchantment_target: "ST",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 5000,
        enchantment_price_per_extra_value: 5000,
      };

      const entry = {
        _instanceId: "ench-1",
        enchantment_id: "ENCHANTMENT-000",
        value: 2,
      };

      const result = resolveEnchantmentEntry(entry, enchantment, {});

      expect(result).toEqual({
        enchantment_id: "ENCHANTMENT-000",
        enchantment_name: "Fortificar ST",
        enchantment_effect_type: "fortify_attribute",
        target: "ST",
        value: 2,
        extraPoints: null,
        price: 10000,
        _instanceId: "ench-1",
      });
    });

    test("Should prefer the entry's own target over the DB row's fixed target", () => {
      const enchantment = {
        enchantment_id: "ENCHANTMENT-026",
        enchantment_name: "Adicionar Vantagem",
        enchantment_effect_type: "advantage",
        enchantment_target: null,
        enchantment_price_per_point: 50,
      };

      const entry = { enchantment_id: "ENCHANTMENT-026", target: "ADV-000" };

      const targetsDb = { advantages: { "ADV-000": { cost: 5 } } };

      const result = resolveEnchantmentEntry(entry, enchantment, targetsDb);

      expect(result.target).toBe("ADV-000");
      expect(result.price).toBe(250);
    });
  });

  describe("resolveItemEnchantments", () => {
    const enchantmentsDb = {
      "ENCHANTMENT-000": {
        enchantment_id: "ENCHANTMENT-000",
        enchantment_name: "Fortificar ST",
        enchantment_effect_type: "fortify_attribute",
        enchantment_target: "ST",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 5000,
        enchantment_price_per_extra_value: 5000,
      },
      "ENCHANTMENT-002": {
        enchantment_id: "ENCHANTMENT-002",
        enchantment_name: "Fortificar DX",
        enchantment_effect_type: "fortify_attribute",
        enchantment_target: "DX",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 5000,
        enchantment_price_per_extra_value: 5000,
      },
    };

    test("Should resolve multiple applications and sum their price", () => {
      const entries = [
        { _instanceId: "ench-1", enchantment_id: "ENCHANTMENT-000", value: 1 },
        { _instanceId: "ench-2", enchantment_id: "ENCHANTMENT-002", value: 2 },
      ];

      const { resolved, total_price } = resolveItemEnchantments(
        entries,
        enchantmentsDb,
        {},
      );

      expect(resolved).toHaveLength(2);
      // 5000 (ST at base) + 10000 (DX at +2, one extra step)
      expect(total_price).toBe(15000);
    });

    test("Should return an empty resolved list and 0 total for no entries", () => {
      const { resolved, total_price } = resolveItemEnchantments(
        [],
        enchantmentsDb,
        {},
      );

      expect(resolved).toEqual([]);
      expect(total_price).toBe(0);
    });

    test("Should allow the same enchantment applied twice with different values", () => {
      const entries = [
        { _instanceId: "ench-1", enchantment_id: "ENCHANTMENT-000", value: 1 },
        { _instanceId: "ench-2", enchantment_id: "ENCHANTMENT-000", value: 3 },
      ];

      const { resolved, total_price } = resolveItemEnchantments(
        entries,
        enchantmentsDb,
        {},
      );

      expect(resolved).toHaveLength(2);
      // 5000 (at base) + 15000 (at +3, two extra steps)
      expect(total_price).toBe(20000);
    });
  });
});
