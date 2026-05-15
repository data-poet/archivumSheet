const {
  buildShieldSlots,
  VALID_STORED_AT,
  _getShieldDB,
} = require("engine/inventory/js/shield/shield.js");

describe("EQUIPMENT SHIELD", () => {
  const db = _getShieldDB();

  const shieldId = Object.keys(db)[0];

  const materialId = "MAT-003"; // assuming exists in your CSV DB

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getShieldDB", () => {
    test("Should load shield database", () => {
      expect(db).toBeDefined();

      expect(typeof db).toBe("object");

      expect(Object.keys(db).length).toBeGreaterThan(0);
    });
  });

  describe("buildShieldSlots", () => {
    test("Should build empty shield inventory", () => {
      const result = buildShieldSlots();

      expect(result.equipped).toBeNull();

      expect(result.stash).toEqual([]);

      expect(result.camp).toEqual([]);

      expect(result.backpack).toEqual([]);

      expect(result.total_shield_weight).toBe(0);

      expect(result.carried_shield_weight).toBe(0);
    });

    test("Should equip shield correctly", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped).not.toBeNull();

      expect(result.equipped.shield_id).toBe(shieldId);
    });

    test("Should place shield in backpack correctly", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);

      expect(result.backpack[0].shield_id).toBe(shieldId);

      expect(result.carried_shield_weight).toBeGreaterThan(0);
    });

    test("Should place shield in stash correctly", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "stash",
        },
      ]);

      expect(result.stash.length).toBe(1);

      expect(result.stash[0].shield_id).toBe(shieldId);

      expect(result.carried_shield_weight).toBe(0);
    });

    test("Should place shield in camp correctly", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.camp[0].shield_id).toBe(shieldId);

      expect(result.carried_shield_weight).toBe(0);
    });

    test("Should match total_shield_weight with carried_shield_weight logic", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.total_shield_weight).toBe(result.carried_shield_weight);
    });

    test("Should throw for invalid shield_id", () => {
      expect(() => {
        buildShieldSlots([
          {
            shield_id: "INVALID",
            is_equipped: true,
            storedAt: null,
          },
        ]);
      }).toThrow("Unknown shield_id(s)");
    });

    test("Should throw for invalid material_id", () => {
      expect(() => {
        buildShieldSlots([
          {
            shield_id: shieldId,
            material_id: "INVALID_MAT",
            is_equipped: false,
            storedAt: "backpack",
          },
        ]);
      }).toThrow("Unknown material_id(s)");
    });

    test("Should not throw when material_id is valid", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          material_id: materialId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);

      expect(result.backpack[0].material_id).toBe(materialId);
    });

    test("Should allow only one equipped shield", () => {
      expect(() => {
        buildShieldSlots([
          {
            shield_id: shieldId,
            is_equipped: true,
            storedAt: null,
          },
          {
            shield_id: shieldId,
            is_equipped: true,
            storedAt: null,
          },
        ]);
      }).toThrow("Equipped conflict");
    });

    test("Should respect VALID_STORED_AT implicitly via no crash", () => {
      const result = buildShieldSlots([
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.carried_shield_weight).toBe(0);
    });
  });
});
