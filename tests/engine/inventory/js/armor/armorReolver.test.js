const {
  applyMaterialToArmor,
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
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
    armor_damage_resistence: 2,
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
        armor_final_damage_resistence: 3,
        armor_final_weight: 1.58,
        armor_final_price: 110,
        armor_final_hit_points: 20,
      });
    });

    test("Should return base values when material is null", () => {
      const result = applyMaterialToArmor(mockArmor, null);

      expect(result).toEqual({
        armor_final_damage_resistence: 2,
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
        is_equipped: true,
        storedAt: "backpack",
      };

      const result = resolveArmorPiece(instance, mockArmor, mockMaterial);

      expect(result).toEqual({
        armor_id: "ARMOR-000",

        armor_box_name: "Capuz | Comum",
        armor_name: "Capuz",

        // NOW ENGLISH
        armor_piece_location: "head",

        armor_type: "Leve",
        armor_tier: "Comum",
        armor_damage_resistence: 2,
        armor_weight: 1.5,
        armor_price: 100,
        armor_hit_points: 10,

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
        armor_final_damage_resistence: 3,
        armor_final_weight: 1.58,
        armor_final_price: 110,
        armor_final_hit_points: 20,

        // RUNTIME
        is_equipped: true,

        storedAt: "backpack",
      });
    });

    test("Should resolve armor without material", () => {
      const instance = {
        armor_id: "ARMOR-000",
        is_equipped: false,
        storedAt: "stash",
      };

      const result = resolveArmorPiece(instance, mockArmor);

      expect(result.material_id).toBeNull();

      expect(result.material_name).toBeNull();

      expect(result.armor_final_damage_resistence).toBe(2);

      expect(result.armor_final_weight).toBe(1.5);

      expect(result.armor_piece_location).toBe("head");
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

      // backpack (1.58) + equipped (1.5)
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
  });
});
