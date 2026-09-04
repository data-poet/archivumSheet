const {
  buildFirearmSlots,
  VALID_STORED_AT,
  _getFirearmsDB,
} = require("engine/inventory/js/firearms/firearms");

describe("EQUIPMENT FIREARMS", () => {
  const db = _getFirearmsDB();

  const weaponId = Object.keys(db)[0];

  const materialId = "MAT-003";

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getFirearmsDB", () => {
    test("Should load firearms database", () => {
      expect(db).toBeDefined();

      expect(typeof db).toBe("object");

      expect(Object.keys(db).length).toBeGreaterThan(0);
    });

    test("Should parse numeric fields correctly", () => {
      const weapon = db[weaponId];

      expect(typeof weapon.weapon_gdp_modifier).toBe("number");
      expect(typeof weapon.weapon_magazine_size).toBe("number");
      expect(typeof weapon.weapon_cdt).toBe("number");
      expect(typeof weapon.weapon_tr).toBe("number");
      expect(typeof weapon.weapon_prec).toBe("number");
      expect(typeof weapon.weapon_half_distance).toBe("number");
      expect(typeof weapon.weapon_max_distance).toBe("number");
      expect(typeof weapon.weapon_hit_points).toBe("number");
    });

    test("Should keep weapon_gdp_dice as a raw dice string", () => {
      const weapon = db[weaponId];

      expect(typeof weapon.weapon_gdp_dice).toBe("string");
      expect(weapon.weapon_gdp_dice).toMatch(/^\d+d\d+$/);
    });
  });

  describe("buildFirearmSlots", () => {
    test("Should build empty firearms inventory", () => {
      const result = buildFirearmSlots();

      expect(result.equipped).toEqual([]);

      expect(result.stash).toEqual([]);

      expect(result.camp).toEqual([]);

      expect(result.backpack).toEqual([]);

      expect(result.total_firearms_weight).toBe(0);

      expect(result.carried_firearms_weight).toBe(0);
    });

    test("Should equip firearm correctly", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped.length).toBe(1);

      expect(result.equipped[0].weapon_id).toBe(weaponId);
    });

    test("Should place firearm in backpack correctly", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);

      expect(result.backpack[0].weapon_id).toBe(weaponId);

      expect(result.carried_firearms_weight).toBeGreaterThan(-1);
    });

    test("Should place firearm in stash correctly", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "stash",
        },
      ]);

      expect(result.stash.length).toBe(1);

      expect(result.stash[0].weapon_id).toBe(weaponId);

      expect(result.carried_firearms_weight).toBe(0);
    });

    test("Should place firearm in camp correctly", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);

      expect(result.camp[0].weapon_id).toBe(weaponId);

      expect(result.carried_firearms_weight).toBe(0);
    });

    test("Should match total_firearms_weight with carried_firearms_weight logic", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.total_firearms_weight).toBe(result.carried_firearms_weight);
    });

    test("Should throw for invalid weapon_id", () => {
      expect(() => {
        buildFirearmSlots([
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
        buildFirearmSlots([
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
      const result = buildFirearmSlots([
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

    test("Should allow multiple equipped firearms", () => {
      const result = buildFirearmSlots([
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

    test("Should throw for invalid storedAt", () => {
      expect(() => {
        buildFirearmSlots([
          {
            weapon_id: weaponId,
            is_equipped: false,
            storedAt: "invalid",
          },
        ]);
      }).toThrow("storedAt must be one of");
    });

    test("Should resolve flat weapon distances without needing ST", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped[0].weapon_half_distance).toBeGreaterThan(0);

      expect(result.equipped[0].weapon_max_distance).toBeGreaterThan(
        result.equipped[0].weapon_half_distance,
      );
    });

    test("Should resolve weapon_gdp_damage from the weapon's own dice, not character ST", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(result.equipped[0].weapon_gdp_damage).toMatch(/^\d+d\d+[+-]\d+$/);
    });

    test("Should let the player tune combat stats via runtime modifiers", () => {
      const base = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]).equipped[0];

      const tuned = buildFirearmSlots([
        {
          weapon_id: weaponId,
          gdp_modifier: 5,
          tr_modifier: 2,
          prec_modifier: 1,
          magazine_size_modifier: 4,
          is_equipped: true,
          storedAt: null,
        },
      ]).equipped[0];

      expect(tuned.weapon_final_gdp_modifier).toBe(
        base.weapon_final_gdp_modifier + 5,
      );
      expect(tuned.weapon_final_tr).toBe(base.weapon_final_tr + 2);
      expect(tuned.weapon_final_prec).toBe(base.weapon_final_prec + 1);
      expect(tuned.weapon_final_magazine_size).toBe(
        base.weapon_final_magazine_size + 4,
      );
    });

    test("Should not let material affect combat stats (gdp/tr/prec/magazine)", () => {
      const withoutMaterial = buildFirearmSlots([
        {
          weapon_id: weaponId,
          is_equipped: true,
          storedAt: null,
        },
      ]).equipped[0];

      const withMaterial = buildFirearmSlots([
        {
          weapon_id: weaponId,
          material_id: materialId,
          is_equipped: true,
          storedAt: null,
        },
      ]).equipped[0];

      expect(withMaterial.weapon_final_gdp_modifier).toBe(
        withoutMaterial.weapon_final_gdp_modifier,
      );
      expect(withMaterial.weapon_final_tr).toBe(
        withoutMaterial.weapon_final_tr,
      );
      expect(withMaterial.weapon_final_prec).toBe(
        withoutMaterial.weapon_final_prec,
      );
      expect(withMaterial.weapon_final_magazine_size).toBe(
        withoutMaterial.weapon_final_magazine_size,
      );
      expect(withMaterial.weapon_gdp_damage).toBe(
        withoutMaterial.weapon_gdp_damage,
      );

      // But material still affects weight/price/HP
      expect(withMaterial.weapon_final_weight).not.toBe(
        withoutMaterial.weapon_final_weight,
      );
    });

    test("Should resolve a valid enchantment and reflect it in final_weight/total_firearms_weight", () => {
      const result = buildFirearmSlots([
        {
          weapon_id: weaponId,
          material_id: materialId,
          is_equipped: true,
          storedAt: null,
          enchantments: [
            {
              _instanceId: "e1",
              enchantment_id: "ENCHANTMENT-036", // add_weight, allowed on Armas de Fogo
              value: 0.1,
            },
          ],
        },
      ]);

      expect(result.equipped[0].enchantments).toHaveLength(1);
      expect(result.equipped[0].enchantment_weight_modifier).toBe(0.1);
      expect(result.equipped[0].final_weight).toBeGreaterThan(
        result.equipped[0].weapon_final_weight,
      );
      expect(result.carried_firearms_weight).toBe(
        result.equipped[0].final_weight,
      );
      expect(result.total_firearms_weight).toBe(
        result.equipped[0].final_weight,
      );
    });

    test("Should throw for an enchantment not allowed on firearms (e.g. a melee-only BAL enchantment)", () => {
      expect(() => {
        buildFirearmSlots([
          {
            weapon_id: weaponId,
            is_equipped: true,
            storedAt: null,
            enchantments: [
              { _instanceId: "e1", enchantment_id: "ENCHANTMENT-056" },
            ],
          },
        ]);
      }).toThrow("Invalid enchantments");
    });
  });
});
