const {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
} = require("engine/inventory/js/equipmentArmorValidation");

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
  });
});
