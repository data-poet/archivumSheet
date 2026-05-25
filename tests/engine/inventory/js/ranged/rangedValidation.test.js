const {
  validateRangedInstance,
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
  });
});
