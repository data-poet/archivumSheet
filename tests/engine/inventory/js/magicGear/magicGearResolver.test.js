const {
  resolveMagicGearItem,
  calculateCarriedMagicGearValue,
  calculateCarriedMagicGearWeight,
} = require("engine/inventory/js/magicGear/magicGearResolver");

describe("magicGearResolver", () => {
  const mockMagicGear = {
    magic_gear_id: "MAGIC_GEAR-001",
    magic_gear_name: "Varinha",
    magic_gear_price: 150,
    magic_gear_weight: 0.3,
  };

  describe("resolveMagicGearItem", () => {
    test("Should resolve a fully populated equipped magic gear item", () => {
      const instance = {
        _instanceId: "magic-gear-inst-1",
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: true,
        storedAt: null,
        magic_gear_custom_name: "Varinha de Sabugueiro",
        magic_gear_custom_description: "Feita de madeira clara e nodosa.",
        magic_gear_custom_effect: "+1 NH em feitiços de Piromancia.",
      };

      const result = resolveMagicGearItem(instance, mockMagicGear);

      expect(result).toEqual({
        magic_gear_id: "MAGIC_GEAR-001",
        magic_gear_name: "Varinha",
        magic_gear_price: 150,
        magic_gear_weight: 0.3,
        enchantments: [],
        enchantments_total_price: 0,
        total_value: 150,
        total_weight: 0.3,
        magic_gear_custom_name: "Varinha de Sabugueiro",
        magic_gear_custom_description: "Feita de madeira clara e nodosa.",
        magic_gear_custom_effect: "+1 NH em feitiços de Piromancia.",
        is_equipped: true,
        storedAt: null,
        _instanceId: "magic-gear-inst-1",
      });
    });

    test("Should pull price and weight from the DB record, not the instance", () => {
      const instance = {
        _instanceId: "magic-gear-inst-2",
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: false,
        storedAt: "backpack",
        // even if a caller mistakenly puts price/weight on the instance,
        // the resolver must ignore it and use the DB record instead
        magic_gear_price: 999999,
        magic_gear_weight: 999999,
      };

      const result = resolveMagicGearItem(instance, mockMagicGear);

      expect(result.magic_gear_price).toBe(150);
      expect(result.magic_gear_weight).toBe(0.3);
      expect(result.total_value).toBe(150);
      expect(result.total_weight).toBe(0.3);
    });

    test("Should normalize blank custom fields to null", () => {
      const instance = {
        _instanceId: "magic-gear-inst-3",
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: false,
        storedAt: "stash",
        magic_gear_custom_name: "   ",
        magic_gear_custom_description: undefined,
        magic_gear_custom_effect: null,
      };

      const result = resolveMagicGearItem(instance, mockMagicGear);

      expect(result.magic_gear_custom_name).toBeNull();
      expect(result.magic_gear_custom_description).toBeNull();
      expect(result.magic_gear_custom_effect).toBeNull();
    });

    test("Should trim custom fields", () => {
      const instance = {
        _instanceId: "magic-gear-inst-4",
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: false,
        storedAt: "camp",
        magic_gear_custom_name: "  Varinha Suja  ",
      };

      const result = resolveMagicGearItem(instance, mockMagicGear);

      expect(result.magic_gear_custom_name).toBe("Varinha Suja");
    });

    test("Should default _instanceId to null when missing", () => {
      const instance = {
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: false,
        storedAt: "camp",
      };

      const result = resolveMagicGearItem(instance, mockMagicGear);

      expect(result._instanceId).toBeNull();
    });
  });

  describe("resolveMagicGearItem — with enchantments", () => {
    const enchantmentsDb = {
      "ENCHANTMENT-010": {
        enchantment_id: "ENCHANTMENT-010",
        enchantment_name: "Fortificar Mana",
        enchantment_effect_type: "fortify_attribute",
        enchantment_target: "Mana",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 2500,
        enchantment_price_per_extra_value: 2500,
      },
      "ENCHANTMENT-033": {
        enchantment_id: "ENCHANTMENT-033",
        enchantment_name: "Adicionar Feitiço",
        enchantment_effect_type: "spell",
        enchantment_target: null,
        enchantment_price_per_difficulty: 2500,
        enchantment_price_per_extra_value: 2000,
      },
    };

    const targetsDb = {
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {
        "SPELL-000": { name: "Bola de Fogo", difficulty: "Difícil" },
      },
    };

    test("Should default to no enchantments and 0 enchantments_total_price when absent", () => {
      const instance = {
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveMagicGearItem(instance, mockMagicGear);

      expect(result.enchantments).toEqual([]);
      expect(result.enchantments_total_price).toBe(0);
      expect(result.total_value).toBe(150);
    });

    test("Should add enchantments_total_price on top of the DB-driven price", () => {
      const instance = {
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: true,
        storedAt: null,
        enchantments: [
          {
            _instanceId: "ench-1",
            enchantment_id: "ENCHANTMENT-010",
            value: 1,
          },
        ],
      };

      const result = resolveMagicGearItem(
        instance,
        mockMagicGear,
        enchantmentsDb,
        targetsDb,
      );

      expect(result.enchantments_total_price).toBe(2500);
      expect(result.total_value).toBe(2650);
    });

    test("Should not let enchantments affect total_weight", () => {
      const instance = {
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: true,
        storedAt: null,
        enchantments: [
          {
            _instanceId: "ench-1",
            enchantment_id: "ENCHANTMENT-010",
            value: 1,
          },
        ],
      };

      const result = resolveMagicGearItem(
        instance,
        mockMagicGear,
        enchantmentsDb,
        targetsDb,
      );

      expect(result.total_weight).toBe(0.3);
    });

    test("Should still contribute enchantment price to total_value while unequipped", () => {
      const instance = {
        magic_gear_id: "MAGIC_GEAR-001",
        is_equipped: false,
        storedAt: "stash",
        enchantments: [
          {
            _instanceId: "ench-1",
            enchantment_id: "ENCHANTMENT-010",
            value: 1,
          },
        ],
      };

      const result = resolveMagicGearItem(
        instance,
        mockMagicGear,
        enchantmentsDb,
        targetsDb,
      );

      expect(result.total_value).toBe(2650);
    });
  });

  describe("calculateCarriedMagicGearValue", () => {
    test("Should sum equipped + backpack values", () => {
      const equipped = [{ total_value: 100 }, { total_value: 50 }];
      const backpack = [{ total_value: 25 }];

      expect(calculateCarriedMagicGearValue(equipped, backpack)).toBe(175);
    });

    test("Should return 0 for empty buckets", () => {
      expect(calculateCarriedMagicGearValue([], [])).toBe(0);
    });

    test("Should round to 2 decimals", () => {
      const equipped = [{ total_value: 1.005 }];
      const backpack = [{ total_value: 1.005 }];

      expect(calculateCarriedMagicGearValue(equipped, backpack)).toBe(2.01);
    });
  });

  describe("calculateCarriedMagicGearWeight", () => {
    test("Should sum equipped + backpack weights", () => {
      const equipped = [{ total_weight: 0.3 }, { total_weight: 1.2 }];
      const backpack = [{ total_weight: 0.5 }];

      expect(calculateCarriedMagicGearWeight(equipped, backpack)).toBe(2);
    });

    test("Should return 0 for empty buckets", () => {
      expect(calculateCarriedMagicGearWeight([], [])).toBe(0);
    });

    test("Should round to 2 decimals", () => {
      const equipped = [{ total_weight: 1.005 }];
      const backpack = [{ total_weight: 1.005 }];

      expect(calculateCarriedMagicGearWeight(equipped, backpack)).toBe(2.01);
    });
  });
});
