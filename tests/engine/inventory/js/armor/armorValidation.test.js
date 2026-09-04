const {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
  validateArmorEnchantments,
} = require("engine/inventory/js/armor/armorValidation");

describe("ARMOR VALIDATION", () => {
  describe("validateArmorInstance", () => {
    test("Should return empty array for valid equipped armor", () => {
      const errors = validateArmorInstance(
        {
          armor_id: "ARM-0001",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack armor", () => {
      const errors = validateArmorInstance(
        {
          armor_id: "ARM-0001",
          is_equipped: false,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateArmorInstance(null, 0);

      expect(errors).toEqual(["armorInventory[0]: must be an object"]);
    });

    test("Should fail when armor_id is missing", () => {
      const errors = validateArmorInstance(
        {
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain("armorInventory[0]: armor_id is required");
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateArmorInstance(
        {
          armor_id: "ARM-0001",
          is_equipped: "yes",
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "armorInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should return empty array when enchantments is a valid array", () => {
      const errors = validateArmorInstance(
        {
          armor_id: "ARM-0001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when enchantments is present but not an array", () => {
      const errors = validateArmorInstance(
        {
          armor_id: "ARM-0001",
          is_equipped: true,
          storedAt: null,
          enchantments: "not-an-array",
        },
        0,
      );

      expect(errors).toContain(
        "armorInventory[0]: enchantments must be an array when present",
      );
    });

    test("Should surface enchantment shape errors with the correct entry index", () => {
      const errors = validateArmorInstance(
        {
          armor_id: "ARM-0001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ value: 0.1 }],
        },
        0,
      );

      expect(errors).toContain(
        "armorInventory[0].enchantments[0]: enchantment_id is required",
      );
    });
  });

  describe("validateArmorEnchantments", () => {
    const armorDb = {
      "ARMOR-HEAD": {
        armor_id: "ARMOR-HEAD",
        armor_piece_location: "Cabeça",
      },
      "ARMOR-FEET": {
        armor_id: "ARMOR-FEET",
        armor_piece_location: "Pés",
      },
    };

    const enchantmentsDb = {
      "ENCHANTMENT-036": {
        enchantment_id: "ENCHANTMENT-036",
        enchantment_name: "Aumentar Peso",
        enchantment_effect_type: "add_weight",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.1,
        enchantment_step: 0.1,
        enchantment_allowed_itens: ["Cabeça", "Tronco"],
      },
      "ENCHANTMENT-040": {
        enchantment_id: "ENCHANTMENT-040",
        enchantment_name: "Fortificar Resistência à Fogo",
        enchantment_effect_type: "fortify_resistance",
        enchantment_target: "Fire",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.05,
        enchantment_step: 0.05,
        enchantment_allowed_itens: [
          "Cabeça",
          "Tronco",
          "Braços",
          "Mãos",
          "Pernas",
          "Pés",
        ],
      },
    };

    const targetsDb = {
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    };

    test("Should return empty array for a valid enchantment on an allowed slot", () => {
      const errors = validateArmorEnchantments(
        [
          {
            armor_id: "ARMOR-HEAD",
            enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
          },
        ],
        armorDb,
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when the enchantment isn't allowed on this piece's own slot", () => {
      const errors = validateArmorEnchantments(
        [
          {
            armor_id: "ARMOR-FEET",
            enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
          },
        ],
        armorDb,
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'armorInventory[0].enchantments[0]: enchantment "Aumentar Peso" is not allowed on Pés',
      );
    });

    test("Should use each instance's own armor_piece_location, not a single fixed category", () => {
      const errors = validateArmorEnchantments(
        [
          {
            armor_id: "ARMOR-FEET",
            enchantments: [{ enchantment_id: "ENCHANTMENT-040", value: 0.05 }],
          },
        ],
        armorDb,
        enchantmentsDb,
        targetsDb,
      );

      // ENCHANTMENT-040 allows Pés — different instance/slot, evaluated independently
      expect(errors).toEqual([]);
    });

    test("Should skip instances with an unknown armor_id (validated elsewhere)", () => {
      const errors = validateArmorEnchantments(
        [
          {
            armor_id: "ARMOR-DOES-NOT-EXIST",
            enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
          },
        ],
        armorDb,
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for a fixed-target elemental-resistance entry with no player-supplied target", () => {
      const errors = validateArmorEnchantments(
        [
          {
            armor_id: "ARMOR-HEAD",
            enchantments: [{ enchantment_id: "ENCHANTMENT-040", value: 0.05 }],
          },
        ],
        armorDb,
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should default to an empty enchantments array when the instance has none", () => {
      const errors = validateArmorEnchantments(
        [{ armor_id: "ARMOR-HEAD" }],
        armorDb,
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });
  });
});
