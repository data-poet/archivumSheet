const {
  applyMaterialToRanged,
  resolveRangedWeapons,
  calculateTotalRangedWeight,
  resolveDistanceFormula,
} = require("engine/inventory/js/ranged/rangedResolver");

describe("rangedResolver", () => {
  const mockWeapon = {
    weapon_id: "RANGED-001",
    weapon_box_name: "Arco Curto | Comum",
    weapon_name: "Arco Curto",
    weapon_type: "Arco",
    weapon_skill: "Arcos",
    weapon_tier: "Comum",
    weapon_half_distance: "ST",
    weapon_max_distance: "ST x 2",
    weapon_damage_type: "Perfuração",
    weapon_min_strength: 5,
    weapon_gdp_modifier: 3,
    weapon_tr: 1,
    weapon_prec: 2,
    weapon_weight: 2,
    weapon_price: 120,
    weapon_hit_points: 15,
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

  describe("applyMaterialToRanged", () => {
    test("Should apply material modifiers correctly", () => {
      const result = applyMaterialToRanged(mockWeapon, mockMaterial);

      expect(result).toEqual({
        weapon_final_gdp_modifier: 5,
        weapon_final_weight: 2.1,
        weapon_final_price: 132,
        weapon_final_hit_points: 30,
      });
    });

    test("Should return base values when material is null", () => {
      const result = applyMaterialToRanged(mockWeapon, null);

      expect(result).toEqual({
        weapon_final_gdp_modifier: 3,
        weapon_final_weight: 2,
        weapon_final_price: 120,
        weapon_final_hit_points: 15,
      });
    });
  });

  describe("resolveRangedWeapons", () => {
    test("Should resolve full ranged weapon with material", () => {
      const instance = {
        weapon_id: "RANGED-001",
        material_id: "MAT-003",
        hit_points_modifier: -5,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
      );

      expect(result).toEqual({
        // WEAPON BASE
        weapon_id: "RANGED-001",
        weapon_name: "Arco Curto",
        weapon_box_name: "Arco Curto | Comum",
        weapon_type: "Arco",
        weapon_skill: "Arcos",
        weapon_tier: "Comum",
        weapon_min_strength: 5,
        weapon_damage_type: "Perfuração",
        weapon_gdp_modifier: 3,
        weapon_tr: 1,
        weapon_prec: 2,
        weapon_weight: 2,
        weapon_price: 120,
        weapon_hit_points: 15,

        // RESOLVED DISTANCES
        weapon_half_distance: 10,
        weapon_max_distance: 20,

        // MATERIAL
        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_dr_modifier: 1,
        material_atk_effect: null,
        material_weight_modifier: 1.05,
        material_price_modifier: 1.1,
        material_hit_points_modifier: 2,

        // FINAL VALUES
        weapon_final_gdp_modifier: 5,
        weapon_final_weight: 2.1,
        weapon_final_price: 132,
        weapon_final_hit_points: 30,

        // RUNTIME MODIFIERS
        hit_points_modifier: -5,
        final_hit_points: 25,

        // RUNTIME
        _instanceId: null,
        is_equipped: true,
        storedAt: null,
        total_value: 132,
      });
    });

    test("Should resolve ranged weapon without material", () => {
      const instance = {
        weapon_id: "RANGED-001",
        hit_points_modifier: -2,
        is_equipped: false,
        storedAt: "stash",
      };

      const result = resolveRangedWeapons(instance, mockWeapon, null, 8);

      expect(result).toEqual({
        // WEAPON BASE
        weapon_id: "RANGED-001",
        weapon_name: "Arco Curto",
        weapon_box_name: "Arco Curto | Comum",
        weapon_type: "Arco",
        weapon_skill: "Arcos",
        weapon_tier: "Comum",
        weapon_min_strength: 5,
        weapon_damage_type: "Perfuração",
        weapon_gdp_modifier: 3,
        weapon_tr: 1,
        weapon_prec: 2,
        weapon_weight: 2,
        weapon_price: 120,
        weapon_hit_points: 15,

        // RESOLVED DISTANCES
        weapon_half_distance: 8,
        weapon_max_distance: 16,

        // MATERIAL
        material_id: null,
        material_name: null,
        material_type: null,
        material_tier: null,
        material_dr_modifier: 0,
        material_atk_effect: null,
        material_weight_modifier: 1,
        material_price_modifier: 1,
        material_hit_points_modifier: 0,

        // FINAL VALUES
        weapon_final_gdp_modifier: 3,
        weapon_final_weight: 2,
        weapon_final_price: 120,
        weapon_final_hit_points: 15,

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 13,

        // RUNTIME
        _instanceId: null,
        is_equipped: false,
        storedAt: "stash",
        total_value: 120,
      });
    });
  });

  describe("calculateTotalRangedWeight", () => {
    test("Should calculate equipped and backpack weapon weight only", () => {
      const rangedInventory = [
        {
          weapon_id: "RANGED-001",
          material_id: "MAT-003",
          storedAt: "backpack",
        },
        {
          weapon_id: "RANGED-001",
          material_id: "MAT-003",
          storedAt: "camp",
        },
        {
          weapon_id: "RANGED-001",
          material_id: "MAT-003",
          storedAt: "stash",
        },
        {
          weapon_id: "RANGED-001",
          material_id: null,
          is_equipped: true,
          storedAt: null,
        },
      ];

      const rangedDb = {
        "RANGED-001": mockWeapon,
      };

      const materialDb = {
        "MAT-003": mockMaterial,
      };

      const result = calculateTotalRangedWeight(
        rangedInventory,
        rangedDb,
        materialDb,
        10,
      );

      expect(result).toBe(4.1);
    });

    test("Should ignore missing weapon records", () => {
      const rangedInventory = [
        {
          weapon_id: "RANGED-999",
          storedAt: "backpack",
        },
      ];

      const result = calculateTotalRangedWeight(rangedInventory, {}, {});

      expect(result).toBe(0);
    });

    test("Should work without material database", () => {
      const rangedInventory = [
        {
          weapon_id: "RANGED-001",
          storedAt: "backpack",
        },
      ];

      const rangedDb = {
        "RANGED-001": mockWeapon,
      };

      const result = calculateTotalRangedWeight(
        rangedInventory,
        rangedDb,
        {},
        10,
      );

      expect(result).toBe(2);
    });
  });

  describe("resolveDistanceFormula", () => {
    test("Should resolve ST formula correctly", () => {
      const result = resolveDistanceFormula("ST", 10);

      expect(result).toBe(10);
    });

    test("Should resolve ST multiplication formula correctly", () => {
      const result = resolveDistanceFormula("ST x 2", 10);

      expect(result).toBe(20);
    });

    test("Should resolve ST addition formula correctly", () => {
      const result = resolveDistanceFormula("ST + 5", 10);

      expect(result).toBe(15);
    });

    test("Should resolve ST subtraction formula correctly", () => {
      const result = resolveDistanceFormula("ST - 3", 10);

      expect(result).toBe(7);
    });

    test("Should return 0 when formula is null", () => {
      const result = resolveDistanceFormula(null, 10);

      expect(result).toBe(0);
    });

    test("Should throw for invalid formula", () => {
      expect(() => {
        resolveDistanceFormula("INVALID", 10);
      }).toThrow('[resolveDistanceFormula] Invalid formula "INVALID"');
    });
  });
});
