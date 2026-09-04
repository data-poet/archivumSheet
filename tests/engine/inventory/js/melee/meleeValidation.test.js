const {
  validateMeleeInstance,
  validateMeleeEnchantments,
} = require("engine/inventory/js/melee/meleeValidation");

const { VALID_STORED_AT } = require("engine/inventory/js/melee/meleeConstants");

describe("MELEE WEAPON VALIDATION", () => {
  describe("validateMeleeInstance", () => {
    test("Should return empty array for valid equipped melee weapon", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack melee weapon", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: false,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateMeleeInstance(null, 0);

      expect(errors).toEqual(["meleeInventory[0]: must be an object"]);
    });

    test("Should fail when weapon_id is missing", () => {
      const errors = validateMeleeInstance(
        {
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain("meleeInventory[0]: weapon_id is required");
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: "yes",
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "meleeInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should fail when equipped weapon has storedAt value", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: true,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toContain(
        "meleeInventory[0]: storedAt must be null when is_equipped is true",
      );
    });

    test("Should fail when unequipped weapon has invalid storedAt", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: false,
          storedAt: "invalid-location",
        },
        0,
      );

      expect(errors).toContain(
        `meleeInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
      );
    });

    test("Should return empty array when enchantments is a valid array", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ enchantment_id: "ENCHANTMENT-056", value: 1 }],
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when enchantments is present but not an array", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: true,
          storedAt: null,
          enchantments: "not-an-array",
        },
        0,
      );

      expect(errors).toContain(
        "meleeInventory[0]: enchantments must be an array when present",
      );
    });

    test("Should surface enchantment shape errors with the correct entry index", () => {
      const errors = validateMeleeInstance(
        {
          weapon_id: "MELEE-001",
          is_equipped: true,
          storedAt: null,
          enchantments: [{ value: 1 }],
        },
        0,
      );

      expect(errors).toContain(
        "meleeInventory[0].enchantments[0]: enchantment_id is required",
      );
    });
  });

  describe("validateMeleeEnchantments", () => {
    // Unlike armor, itemCategory here is the fixed MELEE_ITEM_CATEGORY constant, not looked up per-instance.
    const enchantmentsDb = {
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
      "ENCHANTMENT-000": {
        enchantment_id: "ENCHANTMENT-000",
        enchantment_name: "Enchantment de Acessórios",
        enchantment_effect_type: "fortify_skill",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-062": {
        enchantment_id: "ENCHANTMENT-062",
        enchantment_name: "Aumentar Precisão (PREC)",
        enchantment_effect_type: "add_requisite",
        enchantment_target: "PREC",
        enchantment_is_percentage: false,
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Armas de Longo Alcance", "Armas de Fogo"],
      },
    };

    const targetsDb = {
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    };

    test("Should return empty array for a valid enchantment allowed on Armas Corpo a Corpo", () => {
      const errors = validateMeleeEnchantments(
        [
          {
            weapon_id: "MELEE-001",
            enchantments: [{ enchantment_id: "ENCHANTMENT-056", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when the enchantment isn't allowed on Armas Corpo a Corpo", () => {
      const errors = validateMeleeEnchantments(
        [
          {
            weapon_id: "MELEE-001",
            enchantments: [{ enchantment_id: "ENCHANTMENT-000", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'meleeInventory[0].enchantments[0]: enchantment "Enchantment de Acessórios" is not allowed on Armas Corpo a Corpo',
      );
    });

    test("Should apply the same fixed category regardless of weapon_id — no per-instance lookup", () => {
      const errors = validateMeleeEnchantments(
        [
          {
            weapon_id: "MELEE-DOES-NOT-EXIST",
            enchantments: [{ enchantment_id: "ENCHANTMENT-056", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should default to an empty enchantments array when the instance has none", () => {
      const errors = validateMeleeEnchantments(
        [{ weapon_id: "MELEE-001" }],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    // MELEE-215 is dual-use (paired with RANGED-050): enchantments sync across the pair, so a ranged-only entry can legitimately end up here — validate against the union of both categories.
    test("Should allow a ranged-only enchantment on a dual-use melee instance (union category)", () => {
      const errors = validateMeleeEnchantments(
        [
          {
            weapon_id: "MELEE-215",
            enchantments: [{ enchantment_id: "ENCHANTMENT-062", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toEqual([]);
    });

    test("Should still reject an enchantment not allowed on either side of a dual-use pair", () => {
      const errors = validateMeleeEnchantments(
        [
          {
            weapon_id: "MELEE-215",
            enchantments: [{ enchantment_id: "ENCHANTMENT-000", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'meleeInventory[0].enchantments[0]: enchantment "Enchantment de Acessórios" is not allowed on Armas Corpo a Corpo or Armas de Longo Alcance',
      );
    });

    test("Should NOT extend the union to a non-dual-use melee instance", () => {
      const errors = validateMeleeEnchantments(
        [
          {
            weapon_id: "MELEE-001",
            enchantments: [{ enchantment_id: "ENCHANTMENT-062", value: 1 }],
          },
        ],
        enchantmentsDb,
        targetsDb,
      );

      expect(errors).toContain(
        'meleeInventory[0].enchantments[0]: enchantment "Aumentar Precisão (PREC)" is not allowed on Armas Corpo a Corpo',
      );
    });
  });
});
