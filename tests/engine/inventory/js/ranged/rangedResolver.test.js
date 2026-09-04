const {
  applyMaterialToRanged,
  resolveRangedWeapons,
  calculateTotalRangedWeight,
  calculateTotalRangedValue,
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
        weapon_custom_name: "Arco do Vento Norte",
        weapon_custom_description: "Um arco entalhado com runas desgastadas.",
        weapon_custom_effect: "+1 em testes de percepção contra o vento.",
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
        weapon_tr: 1,
        weapon_prec: 2,

        // RESOLVED DISTANCES
        weapon_half_distance: 10,
        weapon_max_distance: 20,

        // MATERIAL
        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_atk_effect: null,

        // FINAL VALUES
        weapon_final_gdp_modifier: 5,
        weapon_final_weight: 2.1,
        weapon_final_price: 132,
        weapon_final_hit_points: 30,

        // ENCHANTMENTS
        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,
        has_magic_return: false,

        // RUNTIME MODIFIERS
        hit_points_modifier: -5,
        final_hit_points: 25,

        // TRULY-FINAL VALUES
        final_weight: 2.1,

        weapon_custom_name: "Arco do Vento Norte",
        weapon_custom_description: "Um arco entalhado com runas desgastadas.",
        weapon_custom_effect: "+1 em testes de percepção contra o vento.",

        // RUNTIME
        _instanceId: null,
        is_equipped: true,
        storedAt: null,
        total_value: 132,
      });
    });

    test("Should normalize blank/missing custom fields to null and trim whitespace", () => {
      const instance = {
        weapon_id: "RANGED-001",
        hit_points_modifier: 0,
        is_equipped: false,
        storedAt: "camp",
        weapon_custom_name: "   ",
        weapon_custom_description: undefined,
        weapon_custom_effect: "  Efeito com espaços  ",
      };

      const result = resolveRangedWeapons(instance, mockWeapon, null, 8);

      expect(result.weapon_custom_name).toBeNull();
      expect(result.weapon_custom_description).toBeNull();
      expect(result.weapon_custom_effect).toBe("Efeito com espaços");
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
        weapon_tr: 1,
        weapon_prec: 2,

        // RESOLVED DISTANCES
        weapon_half_distance: 8,
        weapon_max_distance: 16,

        // MATERIAL
        material_id: null,
        material_name: null,
        material_type: null,
        material_tier: null,
        material_atk_effect: null,

        // FINAL VALUES
        weapon_final_gdp_modifier: 3,
        weapon_final_weight: 2,
        weapon_final_price: 120,
        weapon_final_hit_points: 15,

        // ENCHANTMENTS
        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,
        has_magic_return: false,

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 13,

        // TRULY-FINAL VALUES
        final_weight: 2,

        weapon_custom_name: null,
        weapon_custom_description: null,
        weapon_custom_effect: null,

        // RUNTIME
        _instanceId: null,
        is_equipped: false,
        storedAt: "stash",
        total_value: 120,
      });
    });
  });

  describe("resolveRangedWeapons — enchantments", () => {
    // Same fixture shape as meleeResolver.test.js's "resolveMeleeWeapons —
    // enchantments" describe block — ranged reuses the identical shared
    // enchantments engine, applied to weapon_final_gdp_modifier/
    // weapon_min_strength/weapon_prec/weapon_tr (mutated directly, no
    // separate "truly final" tier — see rangedResolver.js doc comment) plus
    // the two-tier weight split (weapon_final_weight vs final_weight), plus
    // the boolean has_magic_return flag for special_effect (no melee
    // equivalent).
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
      "ENCHANTMENT-059": {
        enchantment_id: "ENCHANTMENT-059",
        enchantment_name: "Enfraquecer GDP",
        enchantment_effect_type: "weaken_damage",
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
      "ENCHANTMENT-062": {
        enchantment_id: "ENCHANTMENT-062",
        enchantment_name: "Aumentar Precisão (PREC)",
        enchantment_effect_type: "add_requisite",
        enchantment_target: "PREC",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-063": {
        enchantment_id: "ENCHANTMENT-063",
        enchantment_name: "Reduzir Precisão (PREC)",
        enchantment_effect_type: "remove_requisite",
        enchantment_target: "PREC",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-064": {
        enchantment_id: "ENCHANTMENT-064",
        enchantment_name: "Aumentar Tiro Rápido (TR)",
        enchantment_effect_type: "add_requisite",
        enchantment_target: "TR",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-065": {
        enchantment_id: "ENCHANTMENT-065",
        enchantment_name: "Reduzir Tiro Rápido (TR)",
        enchantment_effect_type: "remove_requisite",
        enchantment_target: "TR",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_base_price: 1000,
        enchantment_price_per_extra_value: 1000,
      },
      "ENCHANTMENT-066": {
        enchantment_id: "ENCHANTMENT-066",
        enchantment_name: "Retorno Mágico",
        enchantment_effect_type: "special_effect",
        enchantment_is_percentage: false,
        enchantment_base_price: 5000,
      },
    };

    const baseInstance = {
      weapon_id: "RANGED-001",
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

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      // material weight is 2.1; +10% -> 2.31
      expect(result.weapon_final_weight).toBe(2.1);
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(2.31);
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

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      // net +10% on top of 2.1 -> 2.31
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(2.31);
    });

    test("Should apply a GDP enchantment directly onto weapon_final_gdp_modifier, independent of other fields", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_final_gdp_modifier).toBe(6);
      expect(result.weapon_min_strength).toBe(5);
      expect(result.weapon_prec).toBe(2);
      expect(result.weapon_tr).toBe(1);
    });

    test("Should net multiple GDP enchantments (fortify + weaken)", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-059", value: -1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      // base final GDP (5) + net (2 - 1 = 1) -> 6
      expect(result.weapon_final_gdp_modifier).toBe(6);
    });

    test("Should net multiple Min Strength requisite enchantments onto weapon_min_strength", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-060", value: 2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-061", value: -1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      // base weapon_min_strength (5) + net (2 - 1 = 1) -> 6
      expect(result.weapon_min_strength).toBe(6);
    });

    test("Should apply PREC requisite deltas onto weapon_prec, independent of GDP/TR", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-062", value: 1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_prec).toBe(3);
      expect(result.weapon_final_gdp_modifier).toBe(5);
      expect(result.weapon_tr).toBe(1);
    });

    test("Should net multiple PREC requisite enchantments", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-062", value: 2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-063", value: -1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      // base weapon_prec (2) + net (2 - 1 = 1) -> 3
      expect(result.weapon_prec).toBe(3);
    });

    test("Should apply TR requisite deltas onto weapon_tr, independent of GDP/PREC", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-064", value: 1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_tr).toBe(2);
      expect(result.weapon_final_gdp_modifier).toBe(5);
      expect(result.weapon_prec).toBe(2);
    });

    test("Should net multiple TR requisite enchantments", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-064", value: 2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-065", value: -1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      // base weapon_tr (1) + net (2 - 1 = 1) -> 2
      expect(result.weapon_tr).toBe(2);
    });

    test("Should not let weight/GDP/Min-Strength/PREC/TR enchantments affect each other", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-036", value: 0.1 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-058", value: 1 },
          { _instanceId: "e3", enchantment_id: "ENCHANTMENT-060", value: 1 },
          { _instanceId: "e4", enchantment_id: "ENCHANTMENT-062", value: 1 },
          { _instanceId: "e5", enchantment_id: "ENCHANTMENT-064", value: 1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.final_weight).toBe(2.31);
      expect(result.weapon_final_gdp_modifier).toBe(6);
      expect(result.weapon_min_strength).toBe(6);
      expect(result.weapon_prec).toBe(3);
      expect(result.weapon_tr).toBe(2);
    });

    test("Should resolve has_magic_return as false when no special_effect entry is present", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.has_magic_return).toBe(false);
    });

    test("Should resolve has_magic_return as true when a special_effect (Retorno Mágico) entry is present", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-066" },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.has_magic_return).toBe(true);
    });

    test("Should add enchantments_total_price on top of weapon_final_price for total_value, regardless of the enchantment's mechanical effect", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-066" },
        ],
      };

      const result = resolveRangedWeapons(
        instance,
        mockWeapon,
        mockMaterial,
        10,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_final_price).toBe(132);
      expect(result.enchantments_total_price).toBe(5000);
      expect(result.total_value).toBe(5132);
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

      const rangedInventory = [
        {
          weapon_id: "RANGED-001",
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

      const rangedDb = { "RANGED-001": mockWeapon };

      const result = calculateTotalRangedWeight(
        rangedInventory,
        rangedDb,
        {},
        10,
        enchantmentsDb,
        {},
      );

      // weapon_final_weight is 2 (no material); +10% -> 2.2
      expect(result).toBe(2.2);
    });
  });

  describe("calculateTotalRangedValue", () => {
    test("Should calculate equipped and backpack weapon value only", () => {
      const rangedInventory = [
        {
          weapon_id: "RANGED-001",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
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
          material_id: "MAT-003",
          storedAt: "backpack",
        },
      ];

      const rangedDb = { "RANGED-001": mockWeapon };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalRangedValue(
        rangedInventory,
        rangedDb,
        materialDb,
      );

      // 132 (equipped) + 132 (backpack), camp/stash excluded
      expect(result).toBe(264);
    });

    test("Should include enchantment price in the total", () => {
      const enchantmentsDb = {
        "ENCHANTMENT-058": {
          enchantment_id: "ENCHANTMENT-058",
          enchantment_effect_type: "fortify_damage",
          enchantment_target: "GDP",
          enchantment_is_percentage: false,
          enchantment_base_value: 1,
          enchantment_step: 1,
          enchantment_base_price: 2000,
          enchantment_price_per_extra_value: 2000,
        },
      };

      const rangedInventory = [
        {
          weapon_id: "RANGED-001",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
          enchantments: [
            { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
          ],
        },
      ];

      const rangedDb = { "RANGED-001": mockWeapon };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalRangedValue(
        rangedInventory,
        rangedDb,
        materialDb,
        0,
        enchantmentsDb,
        {},
      );

      expect(result).toBe(2132);
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
