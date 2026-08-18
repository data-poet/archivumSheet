const {
  validateMagicGearInstance,
  validateMagicGearGlobalEquipLimit,
  MAGIC_GEAR_ITEM_CATEGORY,
} = require("engine/inventory/js/magicGear/magicGearValidation");

const {
  VALID_STORED_AT,
  MAGIC_GEAR_EQUIP_LIMIT,
} = require("engine/inventory/js/magicGear/magicGearConstants");

describe("MAGIC GEAR VALIDATION", () => {
  describe("MAGIC_GEAR_ITEM_CATEGORY", () => {
    test("Should be the Portuguese category used for enchantment allowed_itens", () => {
      expect(MAGIC_GEAR_ITEM_CATEGORY).toBe("Instrumentos Mágicos");
    });
  });

  describe("validateMagicGearInstance", () => {
    test("Should return empty array for valid equipped magic gear", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack magic gear", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: false,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array with valid custom fields", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: null,
          magic_gear_custom_name: "Varinha de Sabugueiro",
          magic_gear_custom_description: "Feita de madeira clara.",
          magic_gear_custom_effect: "+1 NH em feitiços de Piromancia.",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array when custom fields are null", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: null,
          magic_gear_custom_name: null,
          magic_gear_custom_description: null,
          magic_gear_custom_effect: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateMagicGearInstance(null, 0);

      expect(errors).toEqual(["magicGearInventory[0]: must be an object"]);
    });

    test("Should fail when magic_gear_id is missing", () => {
      const errors = validateMagicGearInstance(
        {
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "magicGearInventory[0]: magic_gear_id is required",
      );
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: "yes",
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "magicGearInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should fail when equipped magic gear has storedAt value", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: "backpack",
        },
        0,
      );

      expect(errors).toContain(
        "magicGearInventory[0]: storedAt must be null when is_equipped is true",
      );
    });

    test("Should fail when unequipped magic gear has invalid storedAt", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: false,
          storedAt: "invalid-location",
        },
        0,
      );

      expect(errors).toContain(
        `magicGearInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
      );
    });

    test("Should not require a price field on the instance", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test.each([
      "magic_gear_custom_name",
      "magic_gear_custom_description",
      "magic_gear_custom_effect",
    ])("Should fail when %s is not a string or null", (field) => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: null,
          [field]: 42,
        },
        0,
      );

      expect(errors).toContain(
        `magicGearInventory[0]: ${field} must be a string or null`,
      );
    });

    test("Should fail when enchantments is not an array", () => {
      const errors = validateMagicGearInstance(
        {
          magic_gear_id: "MAGIC_GEAR-001",
          is_equipped: true,
          storedAt: null,
          enchantments: "not-an-array",
        },
        0,
      );

      expect(errors).toContain(
        "magicGearInventory[0]: enchantments must be an array when present",
      );
    });
  });

  describe("validateMagicGearGlobalEquipLimit", () => {
    test("Should return empty array when at or under the global limit", () => {
      const errors = validateMagicGearGlobalEquipLimit([
        { magic_gear_id: "MAGIC_GEAR-001", is_equipped: true },
        { magic_gear_id: "MAGIC_GEAR-002", is_equipped: true },
      ]);

      expect(errors).toEqual([]);
    });

    test("Should return empty array when the same type is equipped twice, up to the limit", () => {
      const errors = validateMagicGearGlobalEquipLimit([
        { magic_gear_id: "MAGIC_GEAR-001", is_equipped: true },
        { magic_gear_id: "MAGIC_GEAR-001", is_equipped: true },
      ]);

      expect(errors).toEqual([]);
    });

    test("Should ignore non-equipped instances", () => {
      const errors = validateMagicGearGlobalEquipLimit([
        { magic_gear_id: "MAGIC_GEAR-001", is_equipped: false },
        { magic_gear_id: "MAGIC_GEAR-002", is_equipped: false },
        { magic_gear_id: "MAGIC_GEAR-003", is_equipped: false },
      ]);

      expect(errors).toEqual([]);
    });

    test("Should fail when equipped count exceeds the global limit, regardless of combination", () => {
      const errors = validateMagicGearGlobalEquipLimit([
        { magic_gear_id: "MAGIC_GEAR-001", is_equipped: true },
        { magic_gear_id: "MAGIC_GEAR-002", is_equipped: true },
        { magic_gear_id: "MAGIC_GEAR-003", is_equipped: true },
      ]);

      expect(errors).toEqual([
        `3 magic gear items equipped exceeds the limit of ${MAGIC_GEAR_EQUIP_LIMIT}`,
      ]);
    });
  });
});
