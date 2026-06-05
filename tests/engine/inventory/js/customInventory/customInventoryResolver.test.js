const {
  resolveCustomInventoryItem,
  calculateCarriedCustomInventoryWeight,
} = require("engine/inventory/js/customInventory/customInventoryResolver");

describe("customInventoryResolver", () => {
  const validInstance = {
    custom_item_id: "abc-123",
    name: "Pedra Rúnica",
    weight: 0.5,
    price: 10,
    quantity: 2,
    description: "Encontrada nas ruínas.",
    storedAt: "backpack",
  };

  describe("resolveCustomInventoryItem", () => {
    test("Should resolve a full instance correctly", () => {
      const result = resolveCustomInventoryItem(validInstance);

      expect(result).toEqual({
        custom_item_id: "abc-123",
        name: "Pedra Rúnica",
        weight: 0.5,
        price: 10,
        quantity: 2,
        description: "Encontrada nas ruínas.",
        storedAt: "backpack",
        total_weight: 1,
      });
    });

    test("Should compute total_weight as weight * quantity", () => {
      const instance = { ...validInstance, weight: 0.3, quantity: 3 };
      const result = resolveCustomInventoryItem(instance);
      expect(result.total_weight).toBe(0.9);
    });

    test("Should return total_weight of 0 when weight is 0", () => {
      const instance = { ...validInstance, weight: 0, quantity: 5 };
      const result = resolveCustomInventoryItem(instance);
      expect(result.total_weight).toBe(0);
    });

    test("Should round total_weight to 2 decimal places", () => {
      const instance = { ...validInstance, weight: 0.1, quantity: 3 };
      const result = resolveCustomInventoryItem(instance);
      expect(result.total_weight).toBe(0.3);
    });

    test("Should trim whitespace from name", () => {
      const instance = { ...validInstance, name: "  Espada  " };
      const result = resolveCustomInventoryItem(instance);
      expect(result.name).toBe("Espada");
    });

    test("Should trim whitespace from description", () => {
      const instance = { ...validInstance, description: "  Afiada.  " };
      const result = resolveCustomInventoryItem(instance);
      expect(result.description).toBe("Afiada.");
    });

    test("Should set description to null when null", () => {
      const instance = { ...validInstance, description: null };
      const result = resolveCustomInventoryItem(instance);
      expect(result.description).toBeNull();
    });

    test("Should set description to null when undefined", () => {
      const { description, ...instance } = validInstance;
      const result = resolveCustomInventoryItem(instance);
      expect(result.description).toBeNull();
    });

    test("Should set description to null when empty string after trim", () => {
      const instance = { ...validInstance, description: "   " };
      const result = resolveCustomInventoryItem(instance);
      expect(result.description).toBeNull();
    });

    test("Should preserve storedAt value", () => {
      for (const storedAt of ["stash", "camp", "backpack"]) {
        const instance = { ...validInstance, storedAt };
        const result = resolveCustomInventoryItem(instance);
        expect(result.storedAt).toBe(storedAt);
      }
    });
  });

  describe("calculateCarriedCustomInventoryWeight", () => {
    test("Should return 0 for empty backpack", () => {
      expect(calculateCarriedCustomInventoryWeight([])).toBe(0);
    });

    test("Should sum total_weight of all entries", () => {
      const items = [
        { total_weight: 0.5 },
        { total_weight: 1.2 },
        { total_weight: 0.3 },
      ];
      expect(calculateCarriedCustomInventoryWeight(items)).toBe(2);
    });

    test("Should round result to 2 decimal places", () => {
      const items = [{ total_weight: 0.1 }, { total_weight: 0.2 }];
      expect(calculateCarriedCustomInventoryWeight(items)).toBe(0.3);
    });

    test("Should handle a single item", () => {
      const items = [{ total_weight: 3.75 }];
      expect(calculateCarriedCustomInventoryWeight(items)).toBe(3.75);
    });
  });
});
