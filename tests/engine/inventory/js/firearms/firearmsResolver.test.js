const {
  applyMaterialToFirearm,
  resolveFirearmWeapon,
  calculateTotalFirearmsWeight,
  calculateTotalFirearmsValue,
} = require("engine/inventory/js/firearms/firearmsResolver");

describe("firearmsResolver", () => {
  const mockWeapon = {
    weapon_id: "FIREARM-000",
    weapon_name: "Revolver Artificier",
    weapon_type: "Besta",
    weapon_skill: "BESTA",
    weapon_tier: "Comum",
    weapon_gdp_dice: "1d6",
    weapon_gdp_modifier: 2,
    weapon_reload_speed: "3 Turnos",
    weapon_magazine_size: 6,
    weapon_cdt: 1,
    weapon_weight: 2.5,
    weapon_price: 2000,
    weapon_length: 0.3,
    weapon_min_strength: 10,
    weapon_damage_type: "Perfuração",
    weapon_tr: 8,
    weapon_prec: 2,
    weapon_half_distance: 75,
    weapon_max_distance: 1000,
    weapon_hit_points: 10,
  };

  const mockMaterial = {
    material_id: "MAT-003",
    material_name: "Aço",
    material_type: "Metal",
    material_tier: "Incomum",
    material_gdp_modifier: 2,
    material_dr_modifier: 1,
    material_atk_effect: "",
    material_weight_modifier: 1.05,
    material_price_modifier: 1.1,
    material_hit_points_modifier: 2,
  };

  describe("applyMaterialToFirearm", () => {
    test("Should apply material modifiers to weight/price/HP only", () => {
      const result = applyMaterialToFirearm(mockWeapon, mockMaterial);

      expect(result).toEqual({
        weapon_final_weight: 2.63,
        weapon_final_price: 2200,
        weapon_final_hit_points: 20,
      });
    });

    test("Should return base values when material is null", () => {
      const result = applyMaterialToFirearm(mockWeapon, null);

      expect(result).toEqual({
        weapon_final_weight: 2.5,
        weapon_final_price: 2000,
        weapon_final_hit_points: 10,
      });
    });
  });

  describe("resolveFirearmWeapon", () => {
    test("Should resolve full firearm with material, damage never touched by it", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        material_id: "MAT-003",
        hit_points_modifier: -2,
        gdp_modifier: 1,
        tr_modifier: -1,
        prec_modifier: 1,
        magazine_size_modifier: 2,
        rounds_loaded: 4,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, mockMaterial);

      expect(result).toEqual({
        // WEAPON BASE
        weapon_id: "FIREARM-000",
        weapon_name: "Revolver Artificier",
        weapon_type: "Besta",
        weapon_skill: "BESTA",
        weapon_tier: "Comum",
        weapon_min_strength: 10,
        weapon_damage_type: "Perfuração",
        weapon_length: 0.3,
        weapon_reload_speed: "3 Turnos",
        weapon_cdt: 1,

        // GDP DICE
        weapon_gdp_dice: "1d6",

        // RESOLVED DISTANCES
        weapon_half_distance: 75,
        weapon_max_distance: 1000,

        // MATERIAL
        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_atk_effect: null,

        // FINAL VALUES — weight/price/HP affected by material, combat stats not
        weapon_final_weight: 2.63,
        weapon_final_price: 2200,
        weapon_final_hit_points: 20,
        weapon_final_gdp_modifier: 3, // base 2 + instance 1
        weapon_final_tr: 7, // base 8 + instance -1
        weapon_final_prec: 3, // base 2 + instance 1
        weapon_final_magazine_size: 8, // base 6 + instance 2
        weapon_gdp_damage: "1d6+3",

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 18,
        gdp_modifier: 1,
        tr_modifier: -1,
        prec_modifier: 1,
        magazine_size_modifier: 2,
        rounds_loaded: 4,

        // RUNTIME
        _instanceId: null,
        is_equipped: true,
        storedAt: null,
        total_value: 2200,
      });
    });

    test("Should resolve firearm without material (no weight/price/HP change)", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        hit_points_modifier: 0,
        is_equipped: false,
        storedAt: "stash",
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, null);

      expect(result.weapon_final_weight).toBe(2.5);
      expect(result.weapon_final_price).toBe(2000);
      expect(result.weapon_final_hit_points).toBe(10);
      expect(result.material_id).toBeNull();
    });

    test("Should default all runtime modifiers to zero when omitted", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, null);

      expect(result.gdp_modifier).toBe(0);
      expect(result.tr_modifier).toBe(0);
      expect(result.prec_modifier).toBe(0);
      expect(result.magazine_size_modifier).toBe(0);
      expect(result.rounds_loaded).toBe(0);

      // Base-only finals
      expect(result.weapon_final_gdp_modifier).toBe(2);
      expect(result.weapon_final_tr).toBe(8);
      expect(result.weapon_final_prec).toBe(2);
      expect(result.weapon_final_magazine_size).toBe(6);
      expect(result.weapon_gdp_damage).toBe("1d6+2");
    });

    test("Should clamp rounds_loaded to the final magazine size", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        rounds_loaded: 999,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, null);

      expect(result.rounds_loaded).toBe(6);
    });

    test("Should clamp rounds_loaded to zero when negative", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        rounds_loaded: -3,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, null);

      expect(result.rounds_loaded).toBe(0);
    });

    test("Should clamp rounds_loaded against a modified magazine size", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        rounds_loaded: 7,
        magazine_size_modifier: -3, // final magazine size = 3
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, null);

      expect(result.weapon_final_magazine_size).toBe(3);
      expect(result.rounds_loaded).toBe(3);
    });

    test("Should never let final magazine size go negative", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        rounds_loaded: 2,
        magazine_size_modifier: -999,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveFirearmWeapon(instance, mockWeapon, null);

      expect(result.weapon_final_magazine_size).toBe(0);
      expect(result.rounds_loaded).toBe(0);
    });
  });

  describe("calculateTotalFirearmsWeight", () => {
    test("Should calculate equipped and backpack firearm weight only", () => {
      const firearmsInventory = [
        {
          weapon_id: "FIREARM-000",
          material_id: "MAT-003",
          storedAt: "backpack",
        },
        {
          weapon_id: "FIREARM-000",
          material_id: "MAT-003",
          storedAt: "camp",
        },
        {
          weapon_id: "FIREARM-000",
          material_id: "MAT-003",
          storedAt: "stash",
        },
        {
          weapon_id: "FIREARM-000",
          material_id: null,
          is_equipped: true,
          storedAt: null,
        },
      ];

      const firearmsDb = {
        "FIREARM-000": mockWeapon,
      };

      const materialDb = {
        "MAT-003": mockMaterial,
      };

      const result = calculateTotalFirearmsWeight(
        firearmsInventory,
        firearmsDb,
        materialDb,
      );

      expect(result).toBe(5.13);
    });

    test("Should ignore missing weapon records", () => {
      const firearmsInventory = [
        {
          weapon_id: "FIREARM-999",
          storedAt: "backpack",
        },
      ];

      const result = calculateTotalFirearmsWeight(firearmsInventory, {}, {});

      expect(result).toBe(0);
    });

    test("Should work without material database", () => {
      const firearmsInventory = [
        {
          weapon_id: "FIREARM-000",
          storedAt: "backpack",
        },
      ];

      const firearmsDb = {
        "FIREARM-000": mockWeapon,
      };

      const result = calculateTotalFirearmsWeight(
        firearmsInventory,
        firearmsDb,
        {},
      );

      expect(result).toBe(2.5);
    });
  });

  describe("calculateTotalFirearmsValue", () => {
    test("Should calculate equipped and backpack firearm value only", () => {
      const firearmsInventory = [
        { weapon_id: "FIREARM-000", storedAt: "backpack" },
        { weapon_id: "FIREARM-000", storedAt: "stash" },
        { weapon_id: "FIREARM-000", is_equipped: true, storedAt: null },
      ];

      const firearmsDb = { "FIREARM-000": mockWeapon };

      const result = calculateTotalFirearmsValue(
        firearmsInventory,
        firearmsDb,
        {},
      );

      expect(result).toBe(4000);
    });
  });
});
