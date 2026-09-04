const {
  validateShieldInstance,
  validateSingleEquippedShield,
  validateShieldEnchantments,
} = require("engine/inventory/js/shield/shieldValidation");

describe("SHIELD VALIDATION", () => {
  describe("validateShieldInstance", () => {
    test("Should return empty array for valid equipped shield", () => {
      const errors = validateShieldInstance(
        {
          shield_id: "SHIELD-001",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack shield", () => {
      const errors = validateShieldInstance(
        {
          shield_id: "SHIELD-001",
          is_equipped: false,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateShieldInstance(null, 0);

      expect(errors).toEqual(["shieldInventory[0]: must be an object"]);
    });

    test("Should fail when shield_id is missing", () => {
      const errors = validateShieldInstance(
        {
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain("shieldInventory[0]: shield_id is required");
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateShieldInstance(
        {
          armor_id: "SHIELD-001",
          is_equipped: "yes",
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "shieldInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should return empty array when enchantments is a valid array", () => {
      const errors = validateShieldInstance(
        {
          shield_id: "SHIELD-001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when enchantments is present but not an array", () => {
      const errors = validateShieldInstance(
        {
          shield_id: "SHIELD-001",
          is_equipped: true,
          storedAt: null,
          enchantments: "not-an-array",
        },
        0,
      );

      expect(errors).toContain(
        "shieldInventory[0]: enchantments must be an array when present",
      );
    });

    test("Should surface enchantment shape errors with the correct entry index", () => {
      const errors = validateShieldInstance(
        {
          shield_id: "SHIELD-001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ value: 0.1 }],
        },
        0,
      );

      expect(errors).toContain(
        "shieldInventory[0].enchantments[0]: enchantment_id is required",
      );
    });
  });

  describe("validateShieldEnchantments", () => {
    // Unlike armor's validateArmorEnchantments, this takes no shieldDb —
    // itemCategory is the fixed SHIELD_ITEM_CATEGORY constant ("Escudos"),
    // not looked up per-instance, so every instance is validated against
    // the same category regardless of its shield_id.
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
          "Escudos",
        ],
      },
    };

    const targetsDb = {
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    };

    test("Should return empty array for a valid enchantment allowed on Escudos", () => {
      const errors = validateShieldEnchantments(
        [
          {
            shield_id: "SHIELD-000",
            enchantments: [{ enchantment_id: "ENCHANTMENT-040", value: 0.05 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when the enchantment isn't allowed on Escudos", () => {
      const errors = validateShieldEnchantments(
        [
          {
            shield_id: "SHIELD-000",
            enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'shieldInventory[0].enchantments[0]: enchantment "Aumentar Peso" is not allowed on Escudos',
      );
    });

    test("Should apply the same fixed category regardless of shield_id — no per-instance lookup", () => {
      // Unlike armor, there's no slot to vary by — a second instance with a
      // different (even unknown) shield_id is validated against the exact
      // same "Escudos" category as the first.
      const errors = validateShieldEnchantments(
        [
          {
            shield_id: "SHIELD-DOES-NOT-EXIST",
            enchantments: [{ enchantment_id: "ENCHANTMENT-040", value: 0.05 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should default to an empty enchantments array when the instance has none", () => {
      const errors = validateShieldEnchantments(
        [{ shield_id: "SHIELD-000" }],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });
  });
});
