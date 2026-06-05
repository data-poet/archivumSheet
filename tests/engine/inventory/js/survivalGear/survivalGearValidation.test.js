const {
  validateSurvivalGearInstance,
} = require("engine/inventory/js/survivalGear/survivalGearValidation");

describe("SURVIVAL GEAR VALIDATION", () => {
  describe("validateSurvivalGearInstance", () => {
    test("Should return no errors for a valid instance", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 2,
        storedAt: "backpack",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors).toEqual([]);
    });

    test("Should return error if instance is not an object", () => {
      const errors = validateSurvivalGearInstance(null, 0);

      expect(errors).toContain("survivalGearInventory[0]: must be an object");
    });

    test("Should return error if adventure_gear_id is missing", () => {
      const instance = {
        quantity: 1,
        storedAt: "stash",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors.some((e) => e.includes("adventure_gear_id"))).toBe(true);
    });

    test("Should return error if adventure_gear_id is empty string", () => {
      const instance = {
        adventure_gear_id: "",
        quantity: 1,
        storedAt: "stash",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors.some((e) => e.includes("adventure_gear_id"))).toBe(true);
    });

    test("Should return error if quantity is zero", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 0,
        storedAt: "backpack",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });

    test("Should return error if quantity is a float", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 1.5,
        storedAt: "backpack",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });

    test("Should return error if quantity is negative", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: -1,
        storedAt: "backpack",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });

    test("Should return error for invalid storedAt value", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 1,
        storedAt: "equipped",
      };

      const errors = validateSurvivalGearInstance(instance, 0);

      expect(errors.some((e) => e.includes("storedAt"))).toBe(true);
    });

    test("Should validate all three valid storedAt values", () => {
      for (const storedAt of ["stash", "camp", "backpack"]) {
        const instance = {
          adventure_gear_id: "GEAR-000",
          quantity: 1,
          storedAt,
        };

        const errors = validateSurvivalGearInstance(instance, 0);

        expect(errors).toEqual([]);
      }
    });

    test("Should include index in error prefix", () => {
      const instance = {
        adventure_gear_id: "GEAR-000",
        quantity: 0,
        storedAt: "backpack",
      };

      const errors = validateSurvivalGearInstance(instance, 3);

      expect(errors[0]).toContain("survivalGearInventory[3]");
    });
  });
});
