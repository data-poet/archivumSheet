const {
  resolveSurvivalGearItem,
  calculateCarriedSurvivalGearWeight,
} = require("engine/inventory/js/survivalGear/survivalGearResolver");

describe("survivalGearResolver", () => {
  const mockGear = {
    adventure_gear_id: "GEAR-000",
    adventure_gear_name: "Ração",
    adventure_gear_type: "Alimentos",
    adventure_gear_price: 2,
    adventure_gear_weight: 0.3,
    adventure_gear_observation: "- Uma refeição com carne seca e queijo.",
  };

  describe("resolveSurvivalGearItem", () => {
    test("Should resolve item in backpack with quantity 1", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 1,
        storedAt: "backpack",
      };

      const result = resolveSurvivalGearItem(instance, mockGear);

      expect(result).toEqual({
        adventure_gear_id: "GEAR-000",
        adventure_gear_name: "Ração",
        adventure_gear_type: "Alimentos",
        adventure_gear_price: 2,
        adventure_gear_weight: 0.3,
        adventure_gear_observation: "- Uma refeição com carne seca e queijo.",
        quantity: 1,
        storedAt: "backpack",
        total_weight: 0.3,
        total_value: 2,
      });
    });

    test("Should calculate total_weight correctly for multiple quantities", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 5,
        storedAt: "stash",
      };

      const result = resolveSurvivalGearItem(instance, mockGear);

      expect(result.total_weight).toBe(1.5);
      expect(result.quantity).toBe(5);
      expect(result.storedAt).toBe("stash");
    });

    test("Should resolve item in camp", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 2,
        storedAt: "camp",
      };

      const result = resolveSurvivalGearItem(instance, mockGear);

      expect(result.storedAt).toBe("camp");
      expect(result.total_weight).toBe(0.6);
    });

    test("Should round total_weight to 2 decimal places", () => {
      const gearWithOddWeight = {
        ...mockGear,
        adventure_gear_weight: 0.1,
      };

      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 3,
        storedAt: "backpack",
      };

      const result = resolveSurvivalGearItem(instance, gearWithOddWeight);

      expect(result.total_weight).toBe(0.3);
    });
  });

  describe("calculateCarriedSurvivalGearWeight", () => {
    test("Should return 0 for empty backpack", () => {
      const result = calculateCarriedSurvivalGearWeight([]);

      expect(result).toBe(0);
    });

    test("Should sum total_weight of all backpack items", () => {
      const backpackItems = [
        { total_weight: 0.3 },
        { total_weight: 1.5 },
        { total_weight: 0.6 },
      ];

      const result = calculateCarriedSurvivalGearWeight(backpackItems);

      expect(result).toBe(2.4);
    });

    test("Should round result to 2 decimal places", () => {
      const backpackItems = [
        { total_weight: 0.1 },
        { total_weight: 0.2 },
      ];

      const result = calculateCarriedSurvivalGearWeight(backpackItems);

      expect(result).toBe(0.3);
    });
  });
});
