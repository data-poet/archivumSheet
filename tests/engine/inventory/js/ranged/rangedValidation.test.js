const {
  validateRangedInstance,
  validateRangedEnchantments,
} = require("engine/inventory/js/ranged/rangedValidation");

const {
  VALID_STORED_AT,
} = require("engine/inventory/js/ranged/rangedConstants");

describe("RANGED WEAPON VALIDATION", () => {
  describe("validateRangedInstance", () => {
    test("Should return empty array for valid equipped ranged weapon", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack ranged weapon", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: false,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateRangedInstance(null, 0);

      expect(errors).toEqual(["rangedInventory[0]: must be an object"]);
    });

    test("Should fail when weapon_id is missing", () => {
      const errors = validateRangedInstance(
        {
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain("rangedInventory[0]: weapon_id is required");
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: "yes",
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "rangedInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should fail when equipped weapon has storedAt value", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: true,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toContain(
        "rangedInventory[0]: storedAt must be null when is_equipped is true",
      );
    });

    test("Should fail when unequipped weapon has invalid storedAt", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: false,
          storedAt: "invalid-location",
        },
        0,
      );

      expect(errors).toContain(
        `rangedInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
      );
    });

    test("Should return empty array when enchantments is a valid array", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ enchantment_id: "ENCHANTMENT-058", value: 1 }],
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when enchantments is present but not an array", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: true,
          storedAt: null,
          enchantments: "not-an-array",
        },
        0,
      );

      expect(errors).toContain(
        "rangedInventory[0]: enchantments must be an array when present",
      );
    });

    test("Should surface enchantment shape errors with the correct entry index", () => {
      const errors = validateRangedInstance(
        {
          weapon_id: "RANGED-001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ value: 1 }],
        },
        0,
      );

      expect(errors).toContain(
        "rangedInventory[0].enchantments[0]: enchantment_id is required",
      );
    });
  });

  describe("validateRangedEnchantments", () => {
    // Unlike armor's validateArmorEnchantments, this takes no rangedDb —
    // itemCategory is the fixed RANGED_ITEM_CATEGORY constant ("Armas de
    // Longo Alcance"), not looked up per-instance, so every instance is
    // validated against the same category regardless of its weapon_id.
    const enchantmentsDb = {
      "ENCHANTMENT-058": {
        enchantment_id: "ENCHANTMENT-058",
        enchantment_name: "Fortificar GDP",
        enchantment_effect_type: "fortify_damage",
        enchantment_target: "GDP",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Armas de Longo Alcance"],
      },
      "ENCHANTMENT-056": {
        enchantment_id: "ENCHANTMENT-056",
        enchantment_name: "Fortificar BAL",
        enchantment_effect_type: "fortify_damage",
        enchantment_target: "BAL",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Armas Corpo a Corpo"],
      },
    };

    const targetsDb = {
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    };

    test("Should return empty array for a valid enchantment allowed on Armas de Longo Alcance", () => {
      const errors = validateRangedEnchantments(
        [
          {
            weapon_id: "RANGED-001",
            enchantments: [{ enchantment_id: "ENCHANTMENT-058", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when the enchantment isn't allowed on Armas de Longo Alcance (e.g. a melee-only BAL enchantment)", () => {
      const errors = validateRangedEnchantments(
        [
          {
            weapon_id: "RANGED-001",
            enchantments: [{ enchantment_id: "ENCHANTMENT-056", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'rangedInventory[0].enchantments[0]: enchantment "Fortificar BAL" is not allowed on Armas de Longo Alcance',
      );
    });

    test("Should apply the same fixed category regardless of weapon_id — no per-instance lookup", () => {
      const errors = validateRangedEnchantments(
        [
          {
            weapon_id: "RANGED-DOES-NOT-EXIST",
            enchantments: [{ enchantment_id: "ENCHANTMENT-058", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should default to an empty enchantments array when the instance has none", () => {
      const errors = validateRangedEnchantments(
        [{ weapon_id: "RANGED-001" }],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });
  });
});
