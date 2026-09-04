const {
  resolveAccessoryItem,
  calculateCarriedAccessoryValue,
} = require("engine/inventory/js/accessories/accessoriesResolver");

describe("accessoriesResolver", () => {
  const mockAccessory = {
    accessory_id: "ACCESSORY-000",
    accessory_name: "Anel",
    accessory_equip_limit: 10,
  };

  describe("resolveAccessoryItem", () => {
    test("Should resolve a fully populated equipped accessory", () => {
      const instance = {
        _instanceId: "accessory-inst-1",
        accessory_id: "ACCESSORY-000",
        price: 150,
        is_equipped: true,
        storedAt: null,
        accessory_custom_name: "Anel do Vazio",
        accessory_custom_description: "Um anel antigo e frio ao toque.",
        accessory_custom_effect: "+1 em testes de Vontade.",
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result).toEqual({
        accessory_id: "ACCESSORY-000",
        accessory_name: "Anel",
        accessory_equip_limit: 10,
        price: 150,
        enchantments: [],
        enchantments_total_price: 0,
        total_value: 150,
        accessory_custom_name: "Anel do Vazio",
        accessory_custom_description: "Um anel antigo e frio ao toque.",
        accessory_custom_effect: "+1 em testes de Vontade.",
        is_equipped: true,
        storedAt: null,
        _instanceId: "accessory-inst-1",
      });
    });

    test("Should default missing/invalid price to 0", () => {
      const instance = {
        _instanceId: "accessory-inst-2",
        accessory_id: "ACCESSORY-000",
        is_equipped: false,
        storedAt: "backpack",
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result.price).toBe(0);
      expect(result.total_value).toBe(0);
    });

    test("Should normalize blank custom fields to null", () => {
      const instance = {
        _instanceId: "accessory-inst-3",
        accessory_id: "ACCESSORY-000",
        price: 0,
        is_equipped: false,
        storedAt: "stash",
        accessory_custom_name: "   ",
        accessory_custom_description: undefined,
        accessory_custom_effect: null,
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result.accessory_custom_name).toBeNull();
      expect(result.accessory_custom_description).toBeNull();
      expect(result.accessory_custom_effect).toBeNull();
    });

    test("Should trim custom fields", () => {
      const instance = {
        _instanceId: "accessory-inst-4",
        accessory_id: "ACCESSORY-000",
        price: 0,
        is_equipped: false,
        storedAt: "camp",
        accessory_custom_name: "  Anel Sujo  ",
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result.accessory_custom_name).toBe("Anel Sujo");
    });

    test("Should default _instanceId to null when missing", () => {
      const instance = {
        accessory_id: "ACCESSORY-000",
        price: 0,
        is_equipped: false,
        storedAt: "camp",
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result._instanceId).toBeNull();
    });

    test("Should never include a weight field", () => {
      const instance = {
        accessory_id: "ACCESSORY-000",
        price: 50,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result).not.toHaveProperty("weight");
      expect(result).not.toHaveProperty("accessory_weight");
      expect(result).not.toHaveProperty("total_weight");
    });
  });

  describe("resolveAccessoryItem — with enchantments", () => {
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
      "ENCHANTMENT-026": {
        enchantment_id: "ENCHANTMENT-026",
        enchantment_name: "Adicionar Vantagem",
        enchantment_effect_type: "advantage",
        enchantment_target: null,
        enchantment_price_per_point: 50,
      },
    };

    const targetsDb = {
      advantages: { "ADV-000": { name: "Atraente", cost: 5 } },
      disadvantages: {},
      skills: {},
      spells: {},
    };

    test("Should default to no enchantments and 0 enchantments_total_price when absent", () => {
      const instance = {
        accessory_id: "ACCESSORY-000",
        price: 100,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveAccessoryItem(instance, mockAccessory);

      expect(result.enchantments).toEqual([]);
      expect(result.enchantments_total_price).toBe(0);
      expect(result.total_value).toBe(100);
    });

    test("Should add enchantments_total_price on top of the user-input price", () => {
      const instance = {
        accessory_id: "ACCESSORY-000",
        price: 100,
        is_equipped: true,
        storedAt: null,
        enchantments: [
          {
            _instanceId: "ench-1",
            enchantment_id: "ENCHANTMENT-000",
            value: 1,
          },
        ],
      };

      const result = resolveAccessoryItem(
        instance,
        mockAccessory,
        enchantmentsDb,
        targetsDb,
      );

      expect(result.enchantments_total_price).toBe(5000);
      expect(result.total_value).toBe(5100);
    });

    test("Should resolve multiple enchantments of different effect types on the same item", () => {
      const instance = {
        accessory_id: "ACCESSORY-000",
        price: 0,
        is_equipped: true,
        storedAt: null,
        enchantments: [
          {
            _instanceId: "ench-1",
            enchantment_id: "ENCHANTMENT-000",
            value: 1,
          },
          {
            _instanceId: "ench-2",
            enchantment_id: "ENCHANTMENT-026",
            target: "ADV-000",
          },
        ],
      };

      const result = resolveAccessoryItem(
        instance,
        mockAccessory,
        enchantmentsDb,
        targetsDb,
      );

      expect(result.enchantments).toHaveLength(2);
      // 5000 (fortify ST) + 250 (advantage cost 5 × price_per_point 50)
      expect(result.enchantments_total_price).toBe(5250);
      expect(result.total_value).toBe(5250);
    });

    test("Should still contribute enchantment price to total_value while unequipped", () => {
      const instance = {
        accessory_id: "ACCESSORY-000",
        price: 0,
        is_equipped: false,
        storedAt: "stash",
        enchantments: [
          {
            _instanceId: "ench-1",
            enchantment_id: "ENCHANTMENT-000",
            value: 1,
          },
        ],
      };

      const result = resolveAccessoryItem(
        instance,
        mockAccessory,
        enchantmentsDb,
        targetsDb,
      );

      // price is intrinsic to the item, independent of equip state
      expect(result.total_value).toBe(5000);
    });
  });

  describe("calculateCarriedAccessoryValue", () => {
    test("Should sum equipped + backpack values", () => {
      const equipped = [{ total_value: 100 }, { total_value: 50 }];
      const backpack = [{ total_value: 25 }];

      expect(calculateCarriedAccessoryValue(equipped, backpack)).toBe(175);
    });

    test("Should return 0 for empty buckets", () => {
      expect(calculateCarriedAccessoryValue([], [])).toBe(0);
    });

    test("Should round to 2 decimals", () => {
      const equipped = [{ total_value: 1.005 }];
      const backpack = [{ total_value: 1.005 }];

      expect(calculateCarriedAccessoryValue(equipped, backpack)).toBe(2.01);
    });
  });
});
