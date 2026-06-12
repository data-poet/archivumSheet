const {
  applyMaterialToShield,
  resolveShieldPiece,
  calculateTotalShieldWeight,
} = require("engine/inventory/js/shield/shieldResolver");

describe("shieldResolver", () => {
  const mockShield = {
    shield_id: "SHIELD-000",
    shield_box_name: "Escudo Redondo | Comum",
    shield_name: "Escudo Redondo",
    shield_type: "Leve",
    shield_tier: "Comum",
    shield_damage_resistance: 2,
    shield_weight: 3,
    shield_price: 100,
    shield_hit_points: 10,
  };

  const mockMaterial = {
    material_id: "MAT-003",
    material_name: "Aço",
    material_type: "Metal",
    material_tier: "Incomum",
    material_gdp_modifier: 1,
    material_bal_modifier: 1,
    material_dr_modifier: 1,
    material_atk_effect: "",
    material_def_effect: "",
    material_weight_modifier: 1.05,
    material_price_modifier: 1.1,
    material_hit_points_modifier: 2,
  };

  describe("applyMaterialToShield", () => {
    test("Should apply material modifiers correctly", () => {
      const result = applyMaterialToShield(mockShield, mockMaterial);

      expect(result).toEqual({
        shield_final_damage_resistance: 3,
        shield_final_weight: 3.15,
        shield_final_price: 110,
        shield_final_hit_points: 20,
      });
    });

    test("Should return base values when material is null", () => {
      const result = applyMaterialToShield(mockShield, null);

      expect(result).toEqual({
        shield_final_damage_resistance: 2,
        shield_final_weight: 3,
        shield_final_price: 100,
        shield_final_hit_points: 10,
      });
    });
  });

  describe("resolveShieldPiece", () => {
    test("Should resolve full shield piece with material", () => {
      const instance = {
        shield_id: "SHIELD-000",
        material_id: "MAT-003",
        hit_points_modifier: -5,
        is_equipped: true,
        storedAt: "backpack",
      };

      const result = resolveShieldPiece(instance, mockShield, mockMaterial);

      expect(result).toEqual({
        // SHIELD BASE
        shield_id: "SHIELD-000",
        shield_name: "Escudo Redondo",
        shield_box_name: "Escudo Redondo | Comum",
        shield_type: "Leve",
        shield_tier: "Comum",
        shield_damage_resistance: 2,
        shield_weight: 3,
        shield_price: 100,
        shield_hit_points: 10,

        // MATERIAL
        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_dr_modifier: 1,
        material_def_effect: null,
        material_weight_modifier: 1.05,
        material_price_modifier: 1.1,
        material_hit_points_modifier: 2,

        // FINAL VALUES
        shield_final_damage_resistance: 3,
        shield_final_weight: 3.15,
        shield_final_price: 110,
        shield_final_hit_points: 20,

        // RUNTIME MODIFIERS
        hit_points_modifier: -5,
        final_hit_points: 15,

        // RUNTIME
        _instanceId: null,
        is_equipped: true,
        storedAt: "backpack",
        total_value: 110,
      });
    });

    test("Should resolve shield without material", () => {
      const instance = {
        shield_id: "SHIELD-000",
        hit_points_modifier: -2,
        is_equipped: false,
        storedAt: "stash",
      };

      const result = resolveShieldPiece(instance, mockShield);

      expect(result).toEqual({
        // SHIELD BASE
        shield_id: "SHIELD-000",
        shield_name: "Escudo Redondo",
        shield_box_name: "Escudo Redondo | Comum",
        shield_type: "Leve",
        shield_tier: "Comum",
        shield_damage_resistance: 2,
        shield_weight: 3,
        shield_price: 100,
        shield_hit_points: 10,

        // MATERIAL
        material_id: null,
        material_name: null,
        material_type: null,
        material_tier: null,
        material_dr_modifier: 0,
        material_def_effect: null,
        material_weight_modifier: 1,
        material_price_modifier: 1,
        material_hit_points_modifier: 0,

        // FINAL VALUES
        shield_final_damage_resistance: 2,
        shield_final_weight: 3,
        shield_final_price: 100,
        shield_final_hit_points: 10,

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 8,

        // RUNTIME
        _instanceId: null,
        is_equipped: false,
        storedAt: "stash",
        total_value: 100,
      });
    });
  });

  describe("calculateTotalShieldWeight", () => {
    test("Should calculate equipped and backpack shield weight only", () => {
      const shieldInventory = [
        {
          shield_id: "SHIELD-000",
          material_id: "MAT-003",
          storedAt: "backpack",
        },
        {
          shield_id: "SHIELD-000",
          material_id: "MAT-003",
          storedAt: "camp",
        },
        {
          shield_id: "SHIELD-000",
          material_id: "MAT-003",
          storedAt: "stash",
        },
        {
          shield_id: "SHIELD-000",
          material_id: null,
          is_equipped: true,
          storedAt: null,
        },
      ];

      const shieldDb = {
        "SHIELD-000": mockShield,
      };

      const materialDb = {
        "MAT-003": mockMaterial,
      };

      const result = calculateTotalShieldWeight(
        shieldInventory,
        shieldDb,
        materialDb,
      );

      expect(result).toBe(6.15);
    });

    test("Should ignore missing shield records", () => {
      const shieldInventory = [
        {
          shield_id: "SHIELD-999",
          storedAt: "backpack",
        },
      ];

      const result = calculateTotalShieldWeight(shieldInventory, {}, {});

      expect(result).toBe(0);
    });

    test("Should work without material database", () => {
      const shieldInventory = [
        {
          shield_id: "SHIELD-000",
          storedAt: "backpack",
        },
      ];

      const shieldDb = {
        "SHIELD-000": mockShield,
      };

      const result = calculateTotalShieldWeight(shieldInventory, shieldDb);

      expect(result).toBe(3);
    });
  });
});
