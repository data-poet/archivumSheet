const {
  buildSurvivalGearSlots,
  VALID_STORED_AT,
  _getSurvivalGearDB,
} = require("engine/inventory/js/survivalGear/survivalGear.js");

describe("SURVIVAL GEAR", () => {
  const db = _getSurvivalGearDB();

  const gearId = Object.keys(db)[0];

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getSurvivalGearDB", () => {
    test("Should load adventure gear database", () => {
      expect(db).toBeDefined();
      expect(typeof db).toBe("object");
      expect(Object.keys(db).length).toBeGreaterThan(0);
    });

    test("Should have correct shape for each record", () => {
      const gear = db[gearId];

      expect(gear).toHaveProperty("adventure_gear_id");
      expect(gear).toHaveProperty("adventure_gear_name");
      expect(gear).toHaveProperty("adventure_gear_type");
      expect(gear).toHaveProperty("adventure_gear_price");
      expect(gear).toHaveProperty("adventure_gear_weight");
      expect(gear).toHaveProperty("adventure_gear_observation");
    });
  });

  describe("buildSurvivalGearSlots", () => {
    test("Should build empty inventory with correct shape", () => {
      const result = buildSurvivalGearSlots();

      expect(result.stash).toEqual([]);
      expect(result.camp).toEqual([]);
      expect(result.backpack).toEqual([]);
      expect(result.carried_survival_gear_weight).toBe(0);
    });

    test("Should place item in stash", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "stash" },
      ]);

      expect(result.stash.length).toBe(1);
      expect(result.camp.length).toBe(0);
      expect(result.backpack.length).toBe(0);
    });

    test("Should place item in camp", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "camp" },
      ]);

      expect(result.camp.length).toBe(1);
      expect(result.stash.length).toBe(0);
      expect(result.backpack.length).toBe(0);
    });

    test("Should place item in backpack", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "backpack" },
      ]);

      expect(result.backpack.length).toBe(1);
      expect(result.stash.length).toBe(0);
      expect(result.camp.length).toBe(0);
    });

    test("Should count backpack weight toward carried weight", () => {
      const gear = db[gearId];

      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "backpack" },
      ]);

      expect(result.carried_survival_gear_weight).toBe(gear.adventure_gear_weight);
    });

    test("Should NOT count stash weight toward carried weight", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "stash" },
      ]);

      expect(result.carried_survival_gear_weight).toBe(0);
    });

    test("Should NOT count camp weight toward carried weight", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "camp" },
      ]);

      expect(result.carried_survival_gear_weight).toBe(0);
    });

    test("Should correctly sum weight across multiple backpack items", () => {
      const gear = db[gearId];

      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 2, storedAt: "backpack" },
        { adventure_gear_id: gearId, quantity: 3, storedAt: "backpack" },
      ]);

      const expectedWeight = Math.round((gear.adventure_gear_weight * 5 + Number.EPSILON) * 100) / 100;

      expect(result.carried_survival_gear_weight).toBe(expectedWeight);
    });

    test("Should distribute items across all three locations", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 1, storedAt: "stash" },
        { adventure_gear_id: gearId, quantity: 2, storedAt: "camp" },
        { adventure_gear_id: gearId, quantity: 3, storedAt: "backpack" },
      ]);

      expect(result.stash.length).toBe(1);
      expect(result.camp.length).toBe(1);
      expect(result.backpack.length).toBe(1);
    });

    test("Should throw for invalid instance shape", () => {
      expect(() => {
        buildSurvivalGearSlots([
          { adventure_gear_id: "GEAR-000", quantity: 0, storedAt: "backpack" },
        ]);
      }).toThrow("[buildSurvivalGearSlots] Invalid survivalGearInventory");
    });

    test("Should throw for unknown adventure_gear_id", () => {
      expect(() => {
        buildSurvivalGearSlots([
          { adventure_gear_id: "GEAR-INVALID", quantity: 1, storedAt: "backpack" },
        ]);
      }).toThrow("Unknown adventure_gear_id(s)");
    });

    test("Should include resolved fields in each entry", () => {
      const result = buildSurvivalGearSlots([
        { adventure_gear_id: gearId, quantity: 2, storedAt: "backpack" },
      ]);

      const entry = result.backpack[0];

      expect(entry).toHaveProperty("adventure_gear_id");
      expect(entry).toHaveProperty("adventure_gear_name");
      expect(entry).toHaveProperty("adventure_gear_type");
      expect(entry).toHaveProperty("adventure_gear_price");
      expect(entry).toHaveProperty("adventure_gear_weight");
      expect(entry).toHaveProperty("quantity");
      expect(entry).toHaveProperty("storedAt");
      expect(entry).toHaveProperty("total_weight");
    });
  });
});
