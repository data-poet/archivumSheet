const {
  applyMaterialToShield,
  resolveShieldPiece,
  calculateTotalShieldWeight,
  calculateTotalShieldValue,
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
        shield_custom_name: "Escudo do Guardião",
        shield_custom_description: "Um escudo com brasão apagado pelo tempo.",
        shield_custom_effect: "+1 em testes de Intimidação ao erguê-lo.",
      };

      const result = resolveShieldPiece(instance, mockShield, mockMaterial);

      expect(result).toEqual({
        // SHIELD BASE
        shield_id: "SHIELD-000",
        shield_name: "Escudo Redondo",
        shield_box_name: "Escudo Redondo | Comum",
        shield_type: "Leve",
        shield_tier: "Comum",

        // MATERIAL
        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_def_effect: null,

        // FINAL VALUES
        shield_final_damage_resistance: 3,
        shield_final_weight: 3.15,
        shield_final_price: 110,
        shield_final_hit_points: 20,

        // ENCHANTMENTS
        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,
        enchantment_damage_resistance_modifier: 0,

        // RUNTIME MODIFIERS
        hit_points_modifier: -5,
        final_hit_points: 15,

        // TRULY-FINAL VALUES
        final_weight: 3.15,
        final_damage_resistance: 3,

        shield_custom_name: "Escudo do Guardião",
        shield_custom_description: "Um escudo com brasão apagado pelo tempo.",
        shield_custom_effect: "+1 em testes de Intimidação ao erguê-lo.",

        // RUNTIME
        _instanceId: null,
        is_equipped: true,
        storedAt: "backpack",
        total_value: 110,
      });
    });

    test("Should normalize blank/missing custom fields to null and trim whitespace", () => {
      const instance = {
        shield_id: "SHIELD-000",
        hit_points_modifier: 0,
        is_equipped: false,
        storedAt: "camp",
        shield_custom_name: "   ",
        shield_custom_description: undefined,
        shield_custom_effect: "  Efeito com espaços  ",
      };

      const result = resolveShieldPiece(instance, mockShield);

      expect(result.shield_custom_name).toBeNull();
      expect(result.shield_custom_description).toBeNull();
      expect(result.shield_custom_effect).toBe("Efeito com espaços");
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

        // MATERIAL
        material_id: null,
        material_name: null,
        material_type: null,
        material_tier: null,
        material_def_effect: null,

        // FINAL VALUES
        shield_final_damage_resistance: 2,
        shield_final_weight: 3,
        shield_final_price: 100,
        shield_final_hit_points: 10,

        // ENCHANTMENTS
        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,
        enchantment_damage_resistance_modifier: 0,

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 8,

        // TRULY-FINAL VALUES
        final_weight: 3,
        final_damage_resistance: 2,

        shield_custom_name: null,
        shield_custom_description: null,
        shield_custom_effect: null,

        // RUNTIME
        _instanceId: null,
        is_equipped: false,
        storedAt: "stash",
        total_value: 100,
      });
    });
  });

  describe("resolveShieldPiece — enchantments", () => {
    // Same fixture shape as armorResolver.test.js's "resolveArmorPiece —
    // enchantments (Phase 2)" describe block — shield reuses the identical
    // shared enchantments engine, just applied to shield's own weight/DR
    // fields.
    const enchantmentsDb = {
      "ENCHANTMENT-036": {
        enchantment_id: "ENCHANTMENT-036",
        enchantment_name: "Aumentar Peso",
        enchantment_effect_type: "add_weight",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.1,
        enchantment_step: 0.1,
        enchantment_base_price: 500,
        enchantment_price_per_extra_value: 500,
      },
      "ENCHANTMENT-037": {
        enchantment_id: "ENCHANTMENT-037",
        enchantment_name: "Reduzir Peso",
        enchantment_effect_type: "remove_weight",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.1,
        enchantment_step: 0.1,
        enchantment_base_price: 500,
        enchantment_price_per_extra_value: 500,
      },
      "ENCHANTMENT-038": {
        enchantment_id: "ENCHANTMENT-038",
        enchantment_name: "Aumentar Resistência à Dano",
        enchantment_effect_type: "fortify_damage_resistance",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 1500,
        enchantment_price_per_extra_value: 1500,
      },
      "ENCHANTMENT-040": {
        enchantment_id: "ENCHANTMENT-040",
        enchantment_name: "Fortificar Resistência à Fogo",
        enchantment_effect_type: "fortify_resistance",
        enchantment_target: "Fire",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.05,
        enchantment_step: 0.05,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
    };

    const baseInstance = {
      shield_id: "SHIELD-000",
      material_id: "MAT-003",
      hit_points_modifier: 0,
      is_equipped: true,
      storedAt: null,
    };

    test("Should apply a weight-percentage enchantment on top of the post-material weight", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-036", value: 0.1 },
        ],
      };

      const result = resolveShieldPiece(
        instance,
        mockShield,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // material weight is 3.15; +10% -> 3.465 -> rounds to 3.47
      expect(result.shield_final_weight).toBe(3.15);
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(3.47);
    });

    test("Should net multiple weight enchantments before applying once", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-036", value: 0.2 },
          {
            _instanceId: "e2",
            enchantment_id: "ENCHANTMENT-037",
            value: -0.1,
          },
        ],
      };

      const result = resolveShieldPiece(
        instance,
        mockShield,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // net +10% on top of 3.15 -> 3.465 -> 3.47
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(3.47);
    });

    test("Should add a flat damage-resistance enchantment on top of the post-material DR", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-038", value: 2 },
        ],
      };

      const result = resolveShieldPiece(
        instance,
        mockShield,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.shield_final_damage_resistance).toBe(3);
      expect(result.enchantment_damage_resistance_modifier).toBe(2);
      expect(result.final_damage_resistance).toBe(5);
    });

    test("Should not let weight/DR enchantments affect each other's final field", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-036", value: 0.1 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-038", value: 1 },
        ],
      };

      const result = resolveShieldPiece(
        instance,
        mockShield,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.final_weight).toBe(3.47);
      expect(result.final_damage_resistance).toBe(4);
    });

    test("Should include an elemental-resistance enchantment in the resolved enchantments list but leave weight/DR untouched", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-040", value: 0.05 },
        ],
      };

      const result = resolveShieldPiece(
        instance,
        mockShield,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.enchantment_weight_modifier).toBe(0);
      expect(result.enchantment_damage_resistance_modifier).toBe(0);
      expect(result.final_weight).toBe(result.shield_final_weight);
      expect(result.final_damage_resistance).toBe(
        result.shield_final_damage_resistance,
      );
      expect(result.enchantments[0].target).toBe("Fire");
      expect(result.enchantments[0].enchantment_effect_type).toBe(
        "fortify_resistance",
      );
    });

    test("Should add enchantments_total_price on top of shield_final_price for total_value, regardless of the enchantment's mechanical effect", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-038", value: 1 },
        ],
      };

      const result = resolveShieldPiece(
        instance,
        mockShield,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.shield_final_price).toBe(110);
      expect(result.enchantments_total_price).toBe(1500);
      expect(result.total_value).toBe(1610);
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

  describe("calculateTotalShieldValue", () => {
    test("Should calculate equipped and backpack shield value only", () => {
      const shieldInventory = [
        {
          shield_id: "SHIELD-000",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
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
          material_id: "MAT-003",
          storedAt: "backpack",
        },
      ];

      const shieldDb = { "SHIELD-000": mockShield };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalShieldValue(
        shieldInventory,
        shieldDb,
        materialDb,
      );

      // 110 (equipped) + 110 (backpack), camp/stash excluded
      expect(result).toBe(220);
    });

    test("Should include enchantment price in the total", () => {
      const enchantmentsDb = {
        "ENCHANTMENT-038": {
          enchantment_id: "ENCHANTMENT-038",
          enchantment_effect_type: "fortify_damage_resistance",
          enchantment_is_percentage: false,
          enchantment_base_value: 1,
          enchantment_step: 1,
          enchantment_base_price: 1500,
          enchantment_price_per_extra_value: 1500,
        },
      };

      const shieldInventory = [
        {
          shield_id: "SHIELD-000",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
          enchantments: [
            {
              _instanceId: "e1",
              enchantment_id: "ENCHANTMENT-038",
              value: 1,
            },
          ],
        },
      ];

      const shieldDb = { "SHIELD-000": mockShield };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalShieldValue(
        shieldInventory,
        shieldDb,
        materialDb,
        enchantmentsDb,
        {},
      );

      expect(result).toBe(1610);
    });
  });
});
