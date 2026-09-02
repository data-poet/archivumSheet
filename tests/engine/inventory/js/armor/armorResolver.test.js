const {
  applyMaterialToArmor,
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
  calculateTotalArmorValue,
} = require("engine/inventory/js/armor/armorResolver");

const {
  SLOTS,
  SLOT_MAP,
} = require("engine/inventory/js/armor/armorConstants.js");

describe("equipmentArmorUtils", () => {
  const mockArmor = {
    armor_id: "ARMOR-000",
    armor_box_name: "Capuz | Comum",
    armor_name: "Capuz",
    armor_piece_location: "Cabeça",
    armor_type: "Leve",
    armor_tier: "Comum",
    armor_damage_resistance: 2,
    armor_weight: 1.5,
    armor_price: 100,
    armor_hit_points: 10,
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

  describe("applyMaterialToArmor", () => {
    test("Should apply material modifiers correctly", () => {
      const result = applyMaterialToArmor(mockArmor, mockMaterial);

      expect(result).toEqual({
        armor_final_damage_resistance: 3,
        armor_final_weight: 1.58,
        armor_final_price: 110,
        armor_final_hit_points: 20,
      });
    });

    test("Should return base values when material is null", () => {
      const result = applyMaterialToArmor(mockArmor, null);

      expect(result).toEqual({
        armor_final_damage_resistance: 2,
        armor_final_weight: 1.5,
        armor_final_price: 100,
        armor_final_hit_points: 10,
      });
    });
  });

  describe("resolveArmorPiece", () => {
    test("Should resolve full armor piece with material", () => {
      const instance = {
        armor_id: "ARMOR-000",
        material_id: "MAT-003",
        hit_points_modifier: -5,
        is_equipped: true,
        storedAt: "backpack",
        armor_custom_name: "Capuz da Sombra",
        armor_custom_description: "Um capuz remendado com retalhos escuros.",
        armor_custom_effect: "+1 em testes de furtividade à noite.",
      };

      const result = resolveArmorPiece(instance, mockArmor, mockMaterial);

      expect(result).toEqual({
        armor_id: "ARMOR-000",

        armor_box_name: "Capuz | Comum",
        armor_name: "Capuz",

        armor_piece_location: "head",

        armor_type: "Leve",
        armor_tier: "Comum",

        material_id: "MAT-003",
        material_name: "Aço",
        material_type: "Metal",
        material_tier: "Incomum",
        material_def_effect: null,

        armor_final_damage_resistance: 3,
        armor_final_weight: 1.58,
        armor_final_price: 110,
        armor_final_hit_points: 20,

        enchantments: [],
        enchantments_total_price: 0,
        enchantment_weight_modifier: 0,
        enchantment_damage_resistance_modifier: 0,

        hit_points_modifier: -5,

        final_hit_points: 15,
        final_weight: 1.58,
        final_damage_resistance: 3,

        armor_custom_name: "Capuz da Sombra",
        armor_custom_description: "Um capuz remendado com retalhos escuros.",
        armor_custom_effect: "+1 em testes de furtividade à noite.",

        _instanceId: null,
        is_equipped: true,

        storedAt: "backpack",
        total_value: 110,
      });
    });

    test("Should normalize blank/missing custom fields to null and trim whitespace", () => {
      const instance = {
        armor_id: "ARMOR-000",
        hit_points_modifier: 0,
        is_equipped: false,
        storedAt: "stash",
        armor_custom_name: "   ",
        armor_custom_description: undefined,
        armor_custom_effect: "  Efeito com espaços  ",
      };

      const result = resolveArmorPiece(instance, mockArmor);

      expect(result.armor_custom_name).toBeNull();
      expect(result.armor_custom_description).toBeNull();
      expect(result.armor_custom_effect).toBe("Efeito com espaços");
    });

    test("Should resolve armor without material", () => {
      const instance = {
        armor_id: "ARMOR-000",
        hit_points_modifier: -2,
        is_equipped: false,
        storedAt: "stash",
      };

      const result = resolveArmorPiece(instance, mockArmor);

      expect(result.material_id).toBeNull();
      expect(result.material_name).toBeNull();
      expect(result.armor_final_damage_resistance).toBe(2);
      expect(result.armor_final_weight).toBe(1.5);
      expect(result.armor_piece_location).toBe("head");
      expect(result.hit_points_modifier).toBe(-2);
      expect(result.final_hit_points).toBe(8);
      expect(result.armor_final_hit_points).toBe(10);
      expect(result.final_weight).toBe(1.5);
      expect(result.final_damage_resistance).toBe(2);
      expect(result.enchantments).toEqual([]);
      expect(result.enchantments_total_price).toBe(0);
    });
  });

  describe("resolveArmorPiece — enchantments (Phase 2)", () => {
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
      armor_id: "ARMOR-000",
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

      const result = resolveArmorPiece(
        instance,
        mockArmor,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // material weight is 1.58; +10% -> 1.738 -> rounds to 1.74
      expect(result.armor_final_weight).toBe(1.58);
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(1.74);
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

      const result = resolveArmorPiece(
        instance,
        mockArmor,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      // net +10% on top of 1.58 -> 1.738 -> 1.74
      expect(result.enchantment_weight_modifier).toBe(0.1);
      expect(result.final_weight).toBe(1.74);
    });

    test("Should add a flat damage-resistance enchantment on top of the post-material DR", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-038", value: 2 },
        ],
      };

      const result = resolveArmorPiece(
        instance,
        mockArmor,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.armor_final_damage_resistance).toBe(3);
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

      const result = resolveArmorPiece(
        instance,
        mockArmor,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.final_weight).toBe(1.74);
      expect(result.final_damage_resistance).toBe(4);
    });

    test("Should include an elemental-resistance enchantment in the resolved enchantments list but leave weight/DR untouched", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-040", value: 0.05 },
        ],
      };

      const result = resolveArmorPiece(
        instance,
        mockArmor,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.enchantment_weight_modifier).toBe(0);
      expect(result.enchantment_damage_resistance_modifier).toBe(0);
      expect(result.final_weight).toBe(result.armor_final_weight);
      expect(result.final_damage_resistance).toBe(
        result.armor_final_damage_resistance,
      );
      expect(result.enchantments[0].target).toBe("Fire");
      expect(result.enchantments[0].enchantment_effect_type).toBe(
        "fortify_resistance",
      );
    });

    test("Should add enchantments_total_price on top of armor_final_price for total_value, regardless of the enchantment's mechanical effect", () => {
      const instance = {
        ...baseInstance,
        enchantments: [
          { _instanceId: "e1", enchantment_id: "ENCHANTMENT-038", value: 1 },
        ],
      };

      const result = resolveArmorPiece(
        instance,
        mockArmor,
        mockMaterial,
        enchantmentsDb,
        {},
      );

      expect(result.armor_final_price).toBe(110);
      expect(result.enchantments_total_price).toBe(1500);
      expect(result.total_value).toBe(1610);
    });
  });

  describe("buildEquippedSlots", () => {
    test("Should create all equipment slots with null values", () => {
      const result = buildEquippedSlots();

      const expected = Object.fromEntries(
        Object.values(SLOT_MAP).map((slot) => [slot, null]),
      );

      expect(result).toEqual(expected);
    });
  });

  describe("calculateTotalArmorWeight", () => {
    test("Should calculate equipped and backpack armor weight only", () => {
      const armorInventory = [
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          storedAt: "backpack",
        },
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          storedAt: "camp",
        },
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          storedAt: "stash",
        },
        {
          armor_id: "ARMOR-000",
          material_id: null,
          is_equipped: true,
          storedAt: null,
        },
      ];

      const armorDb = {
        "ARMOR-000": mockArmor,
      };

      const materialDb = {
        "MAT-003": mockMaterial,
      };

      const result = calculateTotalArmorWeight(
        armorInventory,
        armorDb,
        materialDb,
      );

      expect(result).toBe(3.08);
    });

    test("Should ignore missing armor records", () => {
      const armorInventory = [
        {
          armor_id: "ARMOR-999",
          storedAt: "backpack",
        },
      ];

      const result = calculateTotalArmorWeight(armorInventory, {}, {});

      expect(result).toBe(0);
    });

    test("Should work without material database", () => {
      const armorInventory = [
        {
          armor_id: "ARMOR-000",
          storedAt: "backpack",
        },
      ];

      const armorDb = {
        "ARMOR-000": mockArmor,
      };

      const result = calculateTotalArmorWeight(armorInventory, armorDb);

      expect(result).toBe(1.5);
    });

    test("Should include enchantment weight modifiers in the total", () => {
      const enchantmentsDb = {
        "ENCHANTMENT-036": {
          enchantment_id: "ENCHANTMENT-036",
          enchantment_effect_type: "add_weight",
          enchantment_is_percentage: true,
          enchantment_base_value: 0.1,
          enchantment_step: 0.1,
          enchantment_base_price: 500,
          enchantment_price_per_extra_value: 500,
        },
      };

      const armorInventory = [
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
          enchantments: [
            {
              _instanceId: "e1",
              enchantment_id: "ENCHANTMENT-036",
              value: 0.1,
            },
          ],
        },
      ];

      const armorDb = { "ARMOR-000": mockArmor };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalArmorWeight(
        armorInventory,
        armorDb,
        materialDb,
        enchantmentsDb,
        {},
      );

      // material weight 1.58 + 10% -> 1.74
      expect(result).toBe(1.74);
    });
  });

  describe("calculateTotalArmorValue", () => {
    test("Should calculate equipped and backpack armor value only", () => {
      const armorInventory = [
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          is_equipped: true,
          storedAt: null,
        },
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          storedAt: "camp",
        },
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          storedAt: "stash",
        },
        {
          armor_id: "ARMOR-000",
          material_id: "MAT-003",
          storedAt: "backpack",
        },
      ];

      const armorDb = { "ARMOR-000": mockArmor };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalArmorValue(
        armorInventory,
        armorDb,
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

      const armorInventory = [
        {
          armor_id: "ARMOR-000",
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

      const armorDb = { "ARMOR-000": mockArmor };
      const materialDb = { "MAT-003": mockMaterial };

      const result = calculateTotalArmorValue(
        armorInventory,
        armorDb,
        materialDb,
        enchantmentsDb,
        {},
      );

      expect(result).toBe(1610);
    });
  });
});
