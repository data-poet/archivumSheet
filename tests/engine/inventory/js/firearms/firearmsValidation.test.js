const {
  validateFirearmInstance,
  validateFirearmEnchantments,
} = require("engine/inventory/js/firearms/firearmsValidation");

const {
  VALID_STORED_AT,
} = require("engine/inventory/js/firearms/firearmsConstants");

describe("FIREARM VALIDATION", () => {
  describe("validateFirearmInstance", () => {
    test("Should return empty array for valid equipped firearm", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack firearm", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: false,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateFirearmInstance(null, 0);

      expect(errors).toEqual(["firearmsInventory[0]: must be an object"]);
    });

    test("Should fail when weapon_id is missing", () => {
      const errors = validateFirearmInstance(
        {
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain("firearmsInventory[0]: weapon_id is required");
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: "yes",
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "firearmsInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should fail when equipped firearm has storedAt value", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: true,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toContain(
        "firearmsInventory[0]: storedAt must be null when is_equipped is true",
      );
    });

    test("Should fail when unequipped firearm has invalid storedAt", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: false,
          storedAt: "invalid-location",
        },
        0,
      );

      expect(errors).toContain(
        `firearmsInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
      );
    });

    test("Should return empty array when enchantments is a valid array", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when enchantments is present but not an array", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: true,
          storedAt: null,
          enchantments: "not-an-array",
        },
        0,
      );

      expect(errors).toContain(
        "firearmsInventory[0]: enchantments must be an array when present",
      );
    });

    test("Should surface enchantment shape errors with the correct entry index", () => {
      const errors = validateFirearmInstance(
        {
          weapon_id: "FIREARM-000",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ value: 1 }],
        },
        0,
      );

      expect(errors).toContain(
        "firearmsInventory[0].enchantments[0]: enchantment_id is required",
      );
    });
  });

  describe("validateFirearmEnchantments", () => {
    // Unlike armor's validateArmorEnchantments, this takes no firearmsDb —
    // itemCategory is the fixed FIREARMS_ITEM_CATEGORY constant ("Armas de
    // Fogo"), not looked up per-instance. Firearms aren't part of any
    // dual-use pairing, so there's no union-category logic here (unlike
    // meleeValidation.js/rangedValidation.js).
    const enchantmentsDb = {
      "ENCHANTMENT-036": {
        enchantment_id: "ENCHANTMENT-036",
        enchantment_name: "Aumentar Peso",
        enchantment_effect_type: "add_weight",
        enchantment_is_percentage: true,
        enchantment_base_value: 0.1,
        enchantment_step: 0.1,
        enchantment_allowed_itens: [
          "Armas Corpo a Corpo",
          "Armas de Longo Alcance",
          "Armas de Fogo",
        ],
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
      "ENCHANTMENT-066": {
        enchantment_id: "ENCHANTMENT-066",
        enchantment_name: "Retorno Mágico",
        enchantment_effect_type: "special_effect",
        enchantment_is_percentage: false,
        enchantment_allowed_itens: ["Armas de Longo Alcance"],
      },
    };

    const targetsDb = {
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    };

    test("Should return empty array for a valid enchantment allowed on Armas de Fogo", () => {
      const errors = validateFirearmEnchantments(
        [
          {
            weapon_id: "FIREARM-000",
            enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when the enchantment isn't allowed on Armas de Fogo (e.g. a melee-only BAL enchantment)", () => {
      const errors = validateFirearmEnchantments(
        [
          {
            weapon_id: "FIREARM-000",
            enchantments: [{ enchantment_id: "ENCHANTMENT-056", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'firearmsInventory[0].enchantments[0]: enchantment "Fortificar BAL" is not allowed on Armas de Fogo',
      );
    });

    test("Should fail for a ranged-only special_effect enchantment, since firearms don't support special_effect", () => {
      const errors = validateFirearmEnchantments(
        [
          {
            weapon_id: "FIREARM-000",
            enchantments: [{ enchantment_id: "ENCHANTMENT-066" }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'firearmsInventory[0].enchantments[0]: enchantment "Retorno Mágico" is not allowed on Armas de Fogo',
      );
    });

    test("Should apply the same fixed category regardless of weapon_id — no per-instance lookup", () => {
      const errors = validateFirearmEnchantments(
        [
          {
            weapon_id: "FIREARM-DOES-NOT-EXIST",
            enchantments: [{ enchantment_id: "ENCHANTMENT-036", value: 0.1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should default to an empty enchantments array when the instance has none", () => {
      const errors = validateFirearmEnchantments(
        [{ weapon_id: "FIREARM-000" }],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });
  });
});
