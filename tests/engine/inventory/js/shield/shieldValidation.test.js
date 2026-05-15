const {
  validateShieldInstance,
  validateSingleEquippedShield,
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
  });
});
