const {
  applyMaterialToMelee,
  resolveMeleeWeapons,
  calculateTotalMeleeWeight,
  calculateHex,
} = require("engine/inventory/js/melee/meleeResolver");

describe("meleeResolver", () => {
  const mockWeapon = {
    weapon_id: "MELEE-001",
    weapon_box_name: "Espada Longa | Comum",
    weapon_name: "Espada Longa",
    weapon_type: "Espada",
    weapon_skill: "Lâminas",
    weapon_tier: "Comum",
    weapon_min_strength: 5,
    weapon_damage_type: "Corte",
    weapon_length: 3,
    weapon_bal_modifier: 2,
    weapon_gdp_modifier: 4,
    weapon_weight: 5,
    weapon_price: 150,
    weapon_hit_points: 20,
  };

  const mockMaterial = {
    material_id: "MAT-003",
    material_name: "Aço",
    material_type: "Metal",
    material_tier: "Incomum",
    material_bal_modifier: 1,
    material_gdp_modifier: 2,
    material_dr_modifier: 1,
    material_atk_effect: "",
    material_weight_modifier: 1.05,
    material_price_modifier: 1.1,
    material_hit_points_modifier: 2,
  };

  describe("applyMaterialToMelee", () => {
    test("Should apply material modifiers correctly", () => {
      const result = applyMaterialToMelee(mockWeapon, mockMaterial);

      expect(result).toEqual({
        weapon_final_bal_modifier: 3,
        weapon_final_gdp_modifier: 6,
        weapon_final_weight: 5.25,
        weapon_final_price: 165,
        weapon_final_hit_points: 40,
      });
    });

    test("Should return base values when material is null", () => {
      const result = applyMaterialToMelee(mockWeapon, null);

      expect(result).toEqual({
        weapon_final_bal_modifier: 2,
        weapon_final_gdp_modifier: 4,
        weapon_final_weight: 5,
        weapon_final_price: 150,
        weapon_final_hit_points: 20,
      });
    });
  });

  describe("resolveMeleeWeapons", () => {
    test("Should resolve full melee weapon with material", () => {
      const instance = {
        weapon_id: "MELEE-001",
        material_id: "MAT-003",
        hit_points_modifier: -5,
        is_equipped: true,
        storedAt: null,
      };

      const result = resolveMeleeWeapons(instance, mockWeapon, mockMaterial);

      expect(result).toEqual({
        // WEAPON BASE
        weapon_id: "MELEE-001",
        weapon_name: "Espada Longa",
        weapon_box_name: "Espada Longa | Comum",
        weapon_type: "Espada",
        weapon_skill: "Lâminas",
        weapon_tier: "Comum",
        weapon_min_strength: 5,
        weapon_damage_type: "Corte",
        weapon_reach: 3,
        weapon_bal_modifier: 2,
        weapon_gdp_modifier: 4,
        weapon_weight: 5,
        weapon_price: 150,
        weapon_hit_points: 20,

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
        weapon_final_bal_modifier: 3,
        weapon_final_gdp_modifier: 6,
        weapon_final_weight: 5.25,
        weapon_final_price: 165,
        weapon_final_hit_points: 40,

        // RUNTIME MODIFIERS
        hit_points_modifier: -5,
        final_hit_points: 35,

        // RUNTIME
        is_equipped: true,
        storedAt: null,
      });
    });

    test("Should resolve melee weapon without material", () => {
      const instance = {
        weapon_id: "MELEE-001",
        hit_points_modifier: -2,
        is_equipped: false,
        storedAt: "stash",
      };

      const result = resolveMeleeWeapons(instance, mockWeapon);

      expect(result).toEqual({
        // WEAPON BASE
        weapon_id: "MELEE-001",
        weapon_name: "Espada Longa",
        weapon_box_name: "Espada Longa | Comum",
        weapon_type: "Espada",
        weapon_skill: "Lâminas",
        weapon_tier: "Comum",
        weapon_min_strength: 5,
        weapon_damage_type: "Corte",
        weapon_reach: 3,
        weapon_bal_modifier: 2,
        weapon_gdp_modifier: 4,
        weapon_weight: 5,
        weapon_price: 150,
        weapon_hit_points: 20,

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
        weapon_final_bal_modifier: 2,
        weapon_final_gdp_modifier: 4,
        weapon_final_weight: 5,
        weapon_final_price: 150,
        weapon_final_hit_points: 20,

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 18,

        // RUNTIME
        is_equipped: false,
        storedAt: "stash",
      });
    });
  });

  describe("calculateTotalMeleeWeight", () => {
    test("Should calculate equipped and backpack weapon weight only", () => {
      const meleeInventory = [
        {
          weapon_id: "MELEE-001",
          material_id: "MAT-003",
          storedAt: "backpack",
        },
        {
          weapon_id: "MELEE-001",
          material_id: "MAT-003",
          storedAt: "camp",
        },
        {
          weapon_id: "MELEE-001",
          material_id: "MAT-003",
          storedAt: "stash",
        },
        {
          weapon_id: "MELEE-001",
          material_id: null,
          is_equipped: true,
          storedAt: null,
        },
      ];

      const meleeDb = {
        "MELEE-001": mockWeapon,
      };

      const materialDb = {
        "MAT-003": mockMaterial,
      };

      const result = calculateTotalMeleeWeight(
        meleeInventory,
        meleeDb,
        materialDb,
      );

      expect(result).toBe(10.25);
    });

    test("Should ignore missing weapon records", () => {
      const meleeInventory = [
        {
          weapon_id: "MELEE-999",
          storedAt: "backpack",
        },
      ];

      const result = calculateTotalMeleeWeight(meleeInventory, {}, {});

      expect(result).toBe(0);
    });

    test("Should work without material database", () => {
      const meleeInventory = [
        {
          weapon_id: "MELEE-001",
          storedAt: "backpack",
        },
      ];

      const meleeDb = {
        "MELEE-001": mockWeapon,
      };

      const result = calculateTotalMeleeWeight(meleeInventory, meleeDb);

      expect(result).toBe(5);
    });
  });

  describe("calculateHex", () => {
    test("Should return 1 when length is less than 1", () => {
      expect(calculateHex(0)).toBe(1);
      expect(calculateHex(-1)).toBe(1);
    });

    test("Should calculate correct hex reach values", () => {
      expect(calculateHex(1)).toBe(2);
      expect(calculateHex(2)).toBe(2);
      expect(calculateHex(3)).toBe(3);
      expect(calculateHex(4)).toBe(3);
      expect(calculateHex(5)).toBe(4);
    });
  });
});
