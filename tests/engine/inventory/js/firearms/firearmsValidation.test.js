const {
  validateFirearmInstance,
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
  });
});
