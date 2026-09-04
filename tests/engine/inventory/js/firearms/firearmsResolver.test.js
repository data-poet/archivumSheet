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
        weapon_custom_name: "Revólver do Artificier Renegado",
        weapon_custom_description: "Um revólver com o cano gravado à mão.",
        weapon_custom_effect: "+1 em testes de Intimidação ao sacá-lo.",
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

        // ENCHANTMENTS
        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,

        // RUNTIME MODIFIERS
        hit_points_modifier: -2,
        final_hit_points: 18,
        gdp_modifier: 1,
        tr_modifier: -1,
        prec_modifier: 1,
        magazine_size_modifier: 2,
        rounds_loaded: 4,

        // TRULY-FINAL VALUES
        final_weight: 2.63,

        weapon_custom_name: "Revólver do Artificier Renegado",
        weapon_custom_description: "Um revólver com o cano gravado à mão.",
        weapon_custom_effect: "+1 em testes de Intimidação ao sacá-lo.",

        // RUNTIME
        _instanceId: null,
        is_equipped: true,
        storedAt: null,
        total_value: 2200,
      });
    });

    test("Should normalize blank/missing custom fields to null and trim whitespace", () => {
      const instance = {
        weapon_id: "FIREARM-000",
        hit_points_modifier: 0,
        is_equipped: false,
        storedAt: "camp",
        weapon_custom_name: "   ",
        weapon_custom_description: undefined,
        weapon_custom_effect: "  Efeito com espaços  ",
      };

      const result = resolveFirearmWeapon(instance, mockWeapon);

      expect(result.weapon_custom_name).toBeNull();
      expect(result.weapon_custom_description).toBeNull();
      expect(result.weapon_custom_effect).toBe("Efeito com espaços");
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

  describe("resolveFirearmWeapon — enchantments", () => {
    // Same fixture shape as rangedResolver.test.js's "resolveRangedWeapons —
    // enchantments" describe block. Firearms have no BAL/special_effect
    // support (neither is offered per the CSV's allowed_itens), but DO
    // support weight enchantments. GDP/TR/PREC deltas are the interesting
    // case here — firearms already have pre-existing player-runtime
    // modifiers (gdp_modifier/tr_modifier/prec_modifier) on the instance,
    // so the enchantment delta must stack on top of those, not replace or
    // ignore them (see firearmsResolver.js doc comment). Min Strength has
    // no player-runtime modifier, so its enchantment delta applies directly
    // onto weapon_min_strength, mirroring rangedResolver.js.
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
    };

    const baseInstance = {
      weapon_id: "FIREARM-000",
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

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // material weight is 2.63; +10% -> 2.893
      expect(result.weapon_final_weight).toBe(2.63);
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(2.89);
    });

    test("Should net multiple weight enchantments before applying once", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-036", value: 0.2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-037", value: -0.1 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(2.89);
    });

    test("Should stack a GDP enchantment on top of the pre-existing player-runtime gdp_modifier", () => {
      const instance = {
        ...baseInstance,
        gdp_modifier: 1,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // base 2 + runtime 1 + enchantment 1 -> 4
      expect(result.weapon_final_gdp_modifier).toBe(4);
    });

    test("Should net multiple GDP enchantments (fortify + weaken) on top of the runtime modifier", () => {
      const instance = {
        ...baseInstance,
        gdp_modifier: 1,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 2 },
          { _instanceId: "e2", enchantment_id: "ENCHANTMENT-059", value: -1 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // base 2 + runtime 1 + net (2 - 1 = 1) -> 4
      expect(result.weapon_final_gdp_modifier).toBe(4);
    });

    test("Should apply a Min Strength requisite delta directly onto weapon_min_strength (no runtime modifier exists for it)", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-060", value: 2 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // base weapon_min_strength (10) + enchantment 2 -> 12
      expect(result.weapon_min_strength).toBe(12);
    });

    test("Should stack a PREC enchantment on top of the pre-existing player-runtime prec_modifier", () => {
      const instance = {
        ...baseInstance,
        prec_modifier: 1,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-062", value: 1 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // base 2 + runtime 1 + enchantment 1 -> 4
      expect(result.weapon_final_prec).toBe(4);
    });

    test("Should stack a TR enchantment on top of the pre-existing player-runtime tr_modifier", () => {
      const instance = {
        ...baseInstance,
        tr_modifier: -1,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-064", value: 1 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // base 8 + runtime -1 + enchantment 1 -> 8
      expect(result.weapon_final_tr).toBe(8);
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

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.final_weight).toBe(2.89);
      expect(result.weapon_final_gdp_modifier).toBe(3);
      expect(result.weapon_min_strength).toBe(11);
      expect(result.weapon_final_prec).toBe(3);
      expect(result.weapon_final_tr).toBe(9);
    });

    test("Should add enchantments_total_price on top of weapon_final_price for total_value", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
        ],
      };

      const result = resolveFirearmWeapon(
        instance,
        mockWeapon,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.weapon_final_price).toBe(2200);
      expect(result.enchantments_total_price).toBe(2000);
      expect(result.total_value).toBe(4200);
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

      const firearmsInventory = [
        {
          weapon_id: "FIREARM-000",
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

      const firearmsDb = { "FIREARM-000": mockWeapon };

      const result = calculateTotalFirearmsWeight(
        firearmsInventory,
        firearmsDb,
        {},
        enchantmentsDb,
        {},
      );

      // weapon_final_weight is 2.5 (no material); +10% -> 2.75
      expect(result).toBe(2.75);
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

      const firearmsInventory = [
        {
          weapon_id: "FIREARM-000",
          is_equipped: true,
          storedAt: null,
          enchantments: [
            { _instanceId: "e1", enchantment_id: "ENCHANTMENT-058", value: 1 },
          ],
        },
      ];

      const firearmsDb = { "FIREARM-000": mockWeapon };

      const result = calculateTotalFirearmsValue(
        firearmsInventory,
        firearmsDb,
        {},
        enchantmentsDb,
        {},
      );

      expect(result).toBe(4000);
    });
  });
});
