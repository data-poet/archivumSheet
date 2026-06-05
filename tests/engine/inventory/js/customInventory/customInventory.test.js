const {
  buildCustomInventorySlots,
  VALID_STORED_AT,
} = require("engine/inventory/js/customInventory/customInventory");

describe("CUSTOM INVENTORY", () => {
  const item = (overrides = {}) => ({
    custom_item_id: "abc-123",
    name: "Pedra Rúnica",
    weight: 0.5,
    price: 10,
    quantity: 2,
    description: "Encontrada nas ruínas.",
    storedAt: "backpack",
    ...overrides,
  });

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("buildCustomInventorySlots — empty input", () => {
    test("Should return empty buckets with zero weight when called with no args", () => {
      const result = buildCustomInventorySlots();
      expect(result.stash).toEqual([]);
      expect(result.camp).toEqual([]);
      expect(result.backpack).toEqual([]);
      expect(result.carried_custom_inventory_weight).toBe(0);
    });

    test("Should return empty buckets with zero weight for empty array", () => {
      const result = buildCustomInventorySlots([]);
      expect(result.stash).toEqual([]);
      expect(result.camp).toEqual([]);
      expect(result.backpack).toEqual([]);
      expect(result.carried_custom_inventory_weight).toBe(0);
    });
  });

  describe("buildCustomInventorySlots — routing", () => {
    test("Should place item in stash bucket", () => {
      const result = buildCustomInventorySlots([item({ storedAt: "stash" })]);
      expect(result.stash.length).toBe(1);
      expect(result.camp.length).toBe(0);
      expect(result.backpack.length).toBe(0);
    });

    test("Should place item in camp bucket", () => {
      const result = buildCustomInventorySlots([item({ storedAt: "camp" })]);
      expect(result.camp.length).toBe(1);
      expect(result.stash.length).toBe(0);
      expect(result.backpack.length).toBe(0);
    });

    test("Should place item in backpack bucket", () => {
      const result = buildCustomInventorySlots([item({ storedAt: "backpack" })]);
      expect(result.backpack.length).toBe(1);
      expect(result.stash.length).toBe(0);
      expect(result.camp.length).toBe(0);
    });

    test("Should distribute items across all three buckets", () => {
      const result = buildCustomInventorySlots([
        item({ custom_item_id: "a", storedAt: "stash" }),
        item({ custom_item_id: "b", storedAt: "camp" }),
        item({ custom_item_id: "c", storedAt: "backpack" }),
      ]);
      expect(result.stash.length).toBe(1);
      expect(result.camp.length).toBe(1);
      expect(result.backpack.length).toBe(1);
    });

    test("Should place multiple items in the same bucket", () => {
      const result = buildCustomInventorySlots([
        item({ custom_item_id: "a", storedAt: "backpack" }),
        item({ custom_item_id: "b", storedAt: "backpack" }),
      ]);
      expect(result.backpack.length).toBe(2);
    });
  });

  describe("buildCustomInventorySlots — weight", () => {
    test("Should count backpack weight toward carried weight", () => {
      const result = buildCustomInventorySlots([
        item({ weight: 0.5, quantity: 2, storedAt: "backpack" }),
      ]);
      expect(result.carried_custom_inventory_weight).toBe(1);
    });

    test("Should NOT count stash weight toward carried weight", () => {
      const result = buildCustomInventorySlots([
        item({ weight: 5, quantity: 3, storedAt: "stash" }),
      ]);
      expect(result.carried_custom_inventory_weight).toBe(0);
    });

    test("Should NOT count camp weight toward carried weight", () => {
      const result = buildCustomInventorySlots([
        item({ weight: 5, quantity: 3, storedAt: "camp" }),
      ]);
      expect(result.carried_custom_inventory_weight).toBe(0);
    });

    test("Should sum carried weight across multiple backpack items", () => {
      const result = buildCustomInventorySlots([
        item({ custom_item_id: "a", weight: 1, quantity: 2, storedAt: "backpack" }),
        item({ custom_item_id: "b", weight: 0.5, quantity: 4, storedAt: "backpack" }),
      ]);
      expect(result.carried_custom_inventory_weight).toBe(4);
    });

    test("Should return 0 carried weight when item weight is 0", () => {
      const result = buildCustomInventorySlots([
        item({ weight: 0, quantity: 10, storedAt: "backpack" }),
      ]);
      expect(result.carried_custom_inventory_weight).toBe(0);
    });

    test("Should only count backpack when items span all locations", () => {
      const result = buildCustomInventorySlots([
        item({ custom_item_id: "a", weight: 10, quantity: 1, storedAt: "stash" }),
        item({ custom_item_id: "b", weight: 10, quantity: 1, storedAt: "camp" }),
        item({ custom_item_id: "c", weight: 2, quantity: 3, storedAt: "backpack" }),
      ]);
      expect(result.carried_custom_inventory_weight).toBe(6);
    });
  });

  describe("buildCustomInventorySlots — resolved shape", () => {
    test("Should include all expected fields on each resolved entry", () => {
      const result = buildCustomInventorySlots([item()]);
      const entry = result.backpack[0];

      expect(entry).toHaveProperty("custom_item_id");
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("weight");
      expect(entry).toHaveProperty("price");
      expect(entry).toHaveProperty("quantity");
      expect(entry).toHaveProperty("description");
      expect(entry).toHaveProperty("storedAt");
      expect(entry).toHaveProperty("total_weight");
    });

    test("Should resolve entry data correctly", () => {
      const result = buildCustomInventorySlots([
        item({ weight: 0.5, quantity: 2 }),
      ]);
      const entry = result.backpack[0];

      expect(entry.name).toBe("Pedra Rúnica");
      expect(entry.total_weight).toBe(1);
      expect(entry.description).toBe("Encontrada nas ruínas.");
    });
  });

  describe("buildCustomInventorySlots — validation errors", () => {
    test("Should throw for invalid instance shape", () => {
      expect(() =>
        buildCustomInventorySlots([item({ quantity: 0 })]),
      ).toThrow("[buildCustomInventorySlots] Invalid customInventory");
    });

    test("Should throw for missing name", () => {
      expect(() =>
        buildCustomInventorySlots([item({ name: "" })]),
      ).toThrow("[buildCustomInventorySlots] Invalid customInventory");
    });

    test("Should throw for negative weight", () => {
      expect(() =>
        buildCustomInventorySlots([item({ weight: -1 })]),
      ).toThrow("[buildCustomInventorySlots] Invalid customInventory");
    });

    test("Should throw for invalid storedAt", () => {
      expect(() =>
        buildCustomInventorySlots([item({ storedAt: "pocket" })]),
      ).toThrow("[buildCustomInventorySlots] Invalid customInventory");
    });

    test("Should throw listing errors for all invalid items", () => {
      expect(() =>
        buildCustomInventorySlots([
          item({ quantity: 0 }),
          item({ custom_item_id: "valid", name: "" }),
        ]),
      ).toThrow("[buildCustomInventorySlots] Invalid customInventory");
    });
  });
});
