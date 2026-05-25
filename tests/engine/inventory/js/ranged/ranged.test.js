const {
  buildRangedSlots,
  VALID_STORED_AT,
  _getRangedDB,
} = require("engine/inventory/js/ranged/ranged");

describe("EQUIPMENT RANGED", () => {
  const db = _getRangedDB();

  const weaponId = Object.keys(db)[0];

  const materialId = "MAT-003";

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getRangedDB", () => {
    test("Should load ranged database", () => {
      expect(db).toBeDefined();

      expect(typeof db).toBe("object");

      expect(Object.keys(db).length).toBeGreaterThan(0);
    });
  });

  describe("buildRangedSlots", () => {
    test("Should build empty ranged inventory", () => {
      const result = buildRangedSlots();

      expect(result.equipped).toEqual([]);

      expect(result.stash).toEqual([]);

      expect(result.camp).toEqual([]);

      expect(result.backpack).toEqual([]);

      expect(result.total_ranged_weight).toBe(0);

      expect(result.carried_ranged_weapons_weight).toBe(0);
    });

    test("Should equip ranged weapon correctly", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped.length).toBe(1);

      expect(result.equipped[0].weapon_id).toBe(weaponId);
    });

    test("Should place ranged weapon in backpack correctly", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);

      expect(result.backpack[0].weapon_id).toBe(weaponId);

      expect(result.carried_ranged_weapons_weight).toBeGreaterThan(0);
    });

    test("Should place ranged weapon in stash correctly", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "stash",
        },
      ]);

      expect(result.stash.length).toBe(1);

      expect(result.stash[0].weapon_id).toBe(weaponId);

      expect(result.carried_ranged_weapons_weight).toBe(0);
    });

    test("Should place ranged weapon in camp correctly", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.camp[0].weapon_id).toBe(weaponId);

      expect(result.carried_ranged_weapons_weight).toBe(0);
    });

    test("Should match total_ranged_weight with carried_ranged_weapons_weight logic", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.total_ranged_weight).toBe(
        result.carried_ranged_weapons_weight,
      );
    });

    test("Should throw for invalid weapon_id", () => {
      expect(() => {
        buildRangedSlots([
          {
            weapon_id: "INVALID",
            is_equipped: true,
            storedAt: null,
          },
        ]);
      }).toThrow("Unknown weapon_id(s)");
    });

    test("Should throw for invalid material_id", () => {
      expect(() => {
        buildRangedSlots([
          {
            weapon_id: weaponId,
            material_id: "INVALID_MAT",
            is_equipped: false,
            storedAt: "backpack",
          },
        ]);
      }).toThrow("Unknown material_id(s)");
    });

    test("Should not throw when material_id is valid", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          material_id: materialId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);

      expect(result.backpack[0].material_id).toBe(materialId);
    });

    test("Should allow multiple equipped ranged weapons", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped.length).toBe(2);
    });

    test("Should respect VALID_STORED_AT implicitly via no crash", () => {
      const result = buildRangedSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.carried_ranged_weapons_weight).toBe(0);
    });

    test("Should throw for invalid storedAt", () => {
      expect(() => {
        buildRangedSlots([
          {
            weapon_id: weaponId,
            is_equipped: false,
            storedAt: "invalid",
          },
        ]);
      }).toThrow("storedAt must be one of");
    });

    test("Should resolve weapon distances correctly", () => {
      const result = buildRangedSlots(
        [
          {
            weapon_id: weaponId,
            is_equipped: true,
            storedAt: null,
          },
        ],
        10,
      );

      expect(result.equipped[0].weapon_half_distance).toBeGreaterThan(0);

      expect(result.equipped[0].weapon_max_distance).toBeGreaterThan(
        result.equipped[0].weapon_half_distance,
      );
    });
  });
});
