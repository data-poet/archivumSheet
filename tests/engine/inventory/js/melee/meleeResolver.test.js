const {
  applyMaterialToMelee,
  resolveMeleeWeapons,
  calculateTotalMeleeWeight,
  calculateTotalMeleeValue,
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
        weapon_custom_name: "Lâmina do Juramento",
        weapon_custom_description: "Uma espada gasta pelo tempo.",
        weapon_custom_effect: "+1 em testes de intimidação ao desembainhar.",
      };

      const result = resolveMeleeWeapons(instance, mockWeapon, mockMaterial);

      expect(result).toEqual({
        weapon_id: "MELEE-001",
        weapon_name: "Espada Longa",
        weapon_box_name: "Espada Longa | Comum",
        weapon_type: "Espada",
        weapon_skill: "Lâminas",
        weapon_tier: "Comum",
        weapon_min_strength: 5,
        weapon_damage_type: "Corte",
        weapon_reach: 3,

        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_atk_effect: null,

        weapon_final_bal_modifier: 3,
        weapon_final_gdp_modifier: 6,
        weapon_final_weight: 5.25,
        weapon_final_price: 165,
        weapon_final_hit_points: 40,
        weapon_min_strength: 5,

        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,

        hit_points_modifier: -5,
        final_hit_points: 35,

        final_weight: 5.25,

        weapon_custom_name: "Lâmina do Juramento",
        weapon_custom_description: "Uma espada gasta pelo tempo.",
        weapon_custom_effect: "+1 em testes de intimidação ao desembainhar.",

        _instanceId: null,
        is_equipped: true,
        storedAt: null,
        total_value: 165,
      });
    });

    test("Should normalize blank/missing custom fields to null and trim whitespace", () => {
      const instance = {
        weapon_id: "MELEE-001",
        hit_points_modifier: 0,
        is_equipped: false,
        storedAt: "camp",
        weapon_custom_name: "   ",
        weapon_custom_description: undefined,
        weapon_custom_effect: "  Efeito com espaços  ",
      };

      const result = resolveMeleeWeapons(instance, mockWeapon);

      expect(result.weapon_custom_name).toBeNull();
      expect(result.weapon_custom_description).toBeNull();
      expect(result.weapon_custom_effect).toBe("Efeito com espaços");
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
        weapon_id: "MELEE-001",
        weapon_name: "Espada Longa",
        weapon_box_name: "Espada Longa | Comum",
        weapon_type: "Espada",
        weapon_skill: "Lâminas",
        weapon_tier: "Comum",
        weapon_min_strength: 5,
        weapon_damage_type: "Corte",
        weapon_reach: 3,

        material_id: null,
        material_name: null,
        material_type: null,
        material_tier: null,
        material_atk_effect: null,

        weapon_final_bal_modifier: 2,
        weapon_final_gdp_modifier: 4,
        weapon_final_weight: 5,
        weapon_final_price: 150,
        weapon_final_hit_points: 20,
        weapon_min_strength: 5,

        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,

        hit_points_modifier: -2,
        final_hit_points: 18,

        final_weight: 5,

        weapon_custom_name: null,
        weapon_custom_description: null,
        weapon_custom_effect: null,

        _instanceId: null,
        is_equipped: false,
        storedAt: "stash",
        total_value: 150,
      });
    });
  });

  describe("resolveMeleeWeapons — enchantments", () => {
    // Same shared enchantments engine as shieldResolver.test.js: mutates weapon_final_* fields directly (no separate "truly final" tier) plus the two-tier weight split.
    const enchantmentsDb = {
      "ENCHANTMENT-036": {
        enchantment_id: "ENCHANTMENT-036",
        enchantment_name: "Aumentar Peso",
        enchantment_effect_type: "add_weight",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.1,
        enchantment_step: 0.1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-037": {
        enchantment_id: "ENCHANTMENT-037",
        enchantment_name: "Reduzir Peso",
        enchantment_effect_type: "remove_weight",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.1,
        enchantment_step: 0.1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-056": {
        enchantment_id: "ENCHANTMENT-056",
        enchantment_name: "Fortificar BAL",
        enchantment_effect_type: "fortify_damage",
        enchantment_target: "BAL",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-058": {
        enchantment_id: "ENCHANTMENT-058",
        enchantment_name: "Fortificar GDP",
        enchantment_effect_type: "fortify_damage",
        enchantment_target: "GDP",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 2000,
        enchantment_price_per_extra_value: 2000,
      },
      "ENCHANTMENT-060": {
        enchantment_id: "ENCHANTMENT-060",
        enchantment_name: "Aumentar ST Mín",
        enchantment_effect_type: "add_requisite",
        enchantment_target: "Min Strength",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 500,
        enchantment_price_per_extra_value: 500,
      },
      "ENCHANTMENT-061": {
        enchantment_id: "ENCHANTMENT-061",
        enchantment_name: "Diminuir ST Mín",
        enchantment_effect_type: "remove_requisite",
        enchantment_target: "Min Strength",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 500,
        enchantment_price_per_extra_value: 500,
      },
    };

    const baseInstance = {
      weapon_id: "MELEE-001",
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

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // material weight is 5.25; +10% -> 5.775 -> rounds to 5.78
      expect(result.weapon_final_weight).toBe(5.25);
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(5.78);
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

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // net +10% on top of 5.25 -> 5.775 -> 5.78
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(5.78);
    });

    test("Should apply a BAL enchantment directly onto weapon_final_bal_modifier, independent of GDP", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-056", value: 1 },
        ],
      };

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_final_bal_modifier).toBe(4);
      expect(result.weapon_final_gdp_modifier).toBe(6);
    });

    test("Should apply a GDP enchantment directly onto weapon_final_gdp_modifier, independent of BAL", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
        ],
      };

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_final_bal_modifier).toBe(3);
      expect(result.weapon_final_gdp_modifier).toBe(7);
    });

    test("Should net multiple Min Strength requisite enchantments onto weapon_min_strength", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-060", value: 2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-061", value: -1 },
        ],
      };

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // base weapon_min_strength (5) + net (2 - 1 = 1) -> 6
      expect(result.weapon_min_strength).toBe(6);
    });

    test("Should not let BAL/GDP/Min-Strength/weight enchantments affect each other", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-036", value: 0.1 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-056", value: 1 },
          { _instanceId: "e3", enchantment_id: "ENCHANTMENT-060", value: 1 },
        ],
      };

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.final_weight).toBe(5.78);
      expect(result.weapon_final_bal_modifier).toBe(4);
      expect(result.weapon_final_gdp_modifier).toBe(6);
      expect(result.weapon_min_strength).toBe(6);
    });

    test("Should add enchantments_total_price on top of weapon_final_price for total_value, regardless of the enchantment's mechanical effect", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-056", value: 1 },
        ],
      };

      const result = resolveMeleeWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_final_price).toBe(165);
      expect(result.enchantments_total_price).toBe(1000);
      expect(result.total_value).toBe(1165);
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

    test("Should include enchantment weight in the total", () => {
      const enchantmentsDb = {
        "ENCHANTMENT-036": {
          enchantment_id: "ENCHANTMENT-036",
          enchantment_effect_type: "add_weight",
          enchantment_is_percentage: true,
          enchantment_base_value: 0.1,
          enchantment_step: 0.1,
          enchantment_base_price: 1000,
          enchantment_price_per_extra_value: 1000,
        },
      };

      const meleeInventory = [
        {
          weapon_id: "MELEE-001",
          storedAt: "backpack",
          enchantments: [
            {
              _instanceId: "e1",
              enchantment_id: "ENCHANTMENT-036",
              value: 0.1,
            },
          ],
        },
      ];

      const meleeDb = { "MELEE-001": mockWeapon };

      const result = calculateTotalMeleeWeight(
        meleeInventory,
        meleeDb,
        {},
        enchantmentsDb,
        {},
      );

      // weapon_final_weight is 5 (no material); +10% -> 5.5
      expect(result).toBe(5.5);
    });
  });

  describe("calculateTotalMeleeValue", () => {
    test("Should calculate equipped and backpack weapon value only", () => {
      const meleeInventory = [
        {
          weapon_id: "MELEE-001",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
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
          material_id: "MAT-003",
          storedAt: "backpack",
        },
      ];

      const meleeDb = { "MELEE-001": mockWeapon };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalMeleeValue(
        meleeInventory,
        meleeDb,
        materialDb,
      );

      // 165 (equipped) + 165 (backpack), camp/stash excluded
      expect(result).toBe(330);
    });

    test("Should include enchantment price in the total", () => {
      const enchantmentsDb = {
        "ENCHANTMENT-056": {
          enchantment_id: "ENCHANTMENT-056",
          enchantment_effect_type: "fortify_damage",
          enchantment_target: "BAL",
          enchantment_is_percentage: false,
          enchantment_base_value: 1,
          enchantment_step: 1,
          enchantment_base_price: 1000,
          enchantment_price_per_extra_value: 1000,
        },
      };

      const meleeInventory = [
        {
          weapon_id: "MELEE-001",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
          enchantments: [
            { _instanceId: "e1", enchantment_id: "ENCHANTMENT-056", value: 1 },
          ],
        },
      ];

      const meleeDb = { "MELEE-001": mockWeapon };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalMeleeValue(
        meleeInventory,
        meleeDb,
        materialDb,
        enchantmentsDb,
        {},
      );

      expect(result).toBe(1165);
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
