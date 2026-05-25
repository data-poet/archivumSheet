const {
  buildMeleeSlots,
  VALID_STORED_AT,
  _getMeleeDB,
} = require("engine/inventory/js/melee/melee");

describe("EQUIPMENT MELEE", () => {
  const db = _getMeleeDB();

  const weaponId = Object.keys(db)[0];

  const materialId = "MAT-003";

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getMeleeDB", () => {
    test("Should load melee database", () => {
      expect(db).toBeDefined();

      expect(typeof db).toBe("object");

      expect(Object.keys(db).length).toBeGreaterThan(0);
    });
  });

  describe("buildMeleeSlots", () => {
    test("Should build empty melee inventory", () => {
      const result = buildMeleeSlots();

      expect(result.equipped).toEqual([]);

      expect(result.stash).toEqual([]);

      expect(result.camp).toEqual([]);

      expect(result.backpack).toEqual([]);

      expect(result.total_melee_weight).toBe(0);

      expect(result.carried_melee_weapons_weight).toBe(0);
    });

    test("Should equip melee weapon correctly", () => {
      const result = buildMeleeSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped.length).toBe(1);

      expect(result.equipped[0].weapon_id).toBe(weaponId);
    });

    test("Should place melee weapon in backpack correctly", () => {
      const result = buildMeleeSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);

      expect(result.backpack[0].weapon_id).toBe(weaponId);

      expect(result.carried_melee_weapons_weight).toBeGreaterThan(0);
    });

    test("Should place melee weapon in stash correctly", () => {
      const result = buildMeleeSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "stash",
        },
      ]);

      expect(result.stash.length).toBe(1);

      expect(result.stash[0].weapon_id).toBe(weaponId);

      expect(result.carried_melee_weapons_weight).toBe(0);
    });

    test("Should place melee weapon in camp correctly", () => {
      const result = buildMeleeSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.camp[0].weapon_id).toBe(weaponId);

      expect(result.carried_melee_weapons_weight).toBe(0);
    });

    test("Should match total_melee_weight with carried_melee_weapons_weight logic", () => {
      const result = buildMeleeSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.total_melee_weight).toBe(
        result.carried_melee_weapons_weight,
      );
    });

    test("Should throw for invalid weapon_id", () => {
      expect(() => {
        buildMeleeSlots([
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
        buildMeleeSlots([
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
      const result = buildMeleeSlots([
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

    test("Should allow multiple equipped melee weapons", () => {
      const result = buildMeleeSlots([
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
      const result = buildMeleeSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.carried_melee_weapons_weight).toBe(0);
    });

    test("Should throw for invalid storedAt", () => {
      expect(() => {
        buildMeleeSlots([
          {
            weapon_id: weaponId,
            is_equipped: false,
            storedAt: "invalid",
          },
        ]);
      }).toThrow("storedAt must be one of");
    });
  });
});
