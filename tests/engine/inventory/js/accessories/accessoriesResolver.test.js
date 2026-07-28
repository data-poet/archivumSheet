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
