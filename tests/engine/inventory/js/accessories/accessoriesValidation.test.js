const {
  validateAccessoryInstance,
  validateAccessoryEquipLimits,
} = require("engine/inventory/js/accessories/accessoriesValidation");

const {
  VALID_STORED_AT,
} = require("engine/inventory/js/accessories/accessoriesConstants");

describe("ACCESSORY VALIDATION", () => {
  describe("validateAccessoryInstance", () => {
    test("Should return empty array for valid equipped accessory", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
          price: 100,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for valid backpack accessory", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: false,
          storedAt: "backpack",
          price: 0,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array with valid custom fields", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
          price: 100,
          accessory_custom_name: "Anel do Vazio",
          accessory_custom_description: "Um anel antigo e frio ao toque.",
          accessory_custom_effect: "+1 em testes de Vontade.",
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array when custom fields are null", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
          price: 100,
          accessory_custom_name: null,
          accessory_custom_description: null,
          accessory_custom_effect: null,
        },
        0,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when instance is not an object", () => {
      const errors = validateAccessoryInstance(null, 0);

      expect(errors).toEqual(["accessoryInventory[0]: must be an object"]);
    });

    test("Should fail when accessory_id is missing", () => {
      const errors = validateAccessoryInstance(
        {
          is_equipped: true,
          storedAt: null,
          price: 0,
        },
        0,
      );

      expect(errors).toContain(
        "accessoryInventory[0]: accessory_id is required",
      );
    });

    test("Should fail when is_equipped is invalid", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: "yes",
          storedAt: null,
          price: 0,
        },
        0,
      );

      expect(errors).toContain(
        "accessoryInventory[0]: is_equipped must be a boolean",
      );
    });

    test("Should fail when equipped accessory has storedAt value", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: "backpack",
          price: 0,
        },
        0,
      );

      expect(errors).toContain(
        "accessoryInventory[0]: storedAt must be null when is_equipped is true",
      );
    });

    test("Should fail when unequipped accessory has invalid storedAt", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: false,
          storedAt: "invalid-location",
          price: 0,
        },
        0,
      );

      expect(errors).toContain(
        `accessoryInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
      );
    });

    test("Should fail when price is missing", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
        },
        0,
      );

      expect(errors).toContain(
        "accessoryInventory[0]: price must be a number >= 0",
      );
    });

    test("Should fail when price is negative", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
          price: -1,
        },
        0,
      );

      expect(errors).toContain(
        "accessoryInventory[0]: price must be a number >= 0",
      );
    });

    test("Should fail when price is not a number", () => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
          price: "100",
        },
        0,
      );

      expect(errors).toContain(
        "accessoryInventory[0]: price must be a number >= 0",
      );
    });

    test.each([
      "accessory_custom_name",
      "accessory_custom_description",
      "accessory_custom_effect",
    ])("Should fail when %s is not a string or null", (field) => {
      const errors = validateAccessoryInstance(
        {
          accessory_id: "ACCESSORY-000",
          is_equipped: true,
          storedAt: null,
          price: 0,
          [field]: 42,
        },
        0,
      );

      expect(errors).toContain(
        `accessoryInventory[0]: ${field} must be a string or null`,
      );
    });
  });

  describe("validateAccessoryEquipLimits", () => {
    const db = {
      "ACCESSORY-000": {
        accessory_id: "ACCESSORY-000",
        accessory_name: "Anel",
        accessory_equip_limit: 2,
      },
      "ACCESSORY-004": {
        accessory_id: "ACCESSORY-004",
        accessory_name: "Coroa",
        accessory_equip_limit: 1,
      },
    };

    test("Should return empty array when under the limit", () => {
      const errors = validateAccessoryEquipLimits(
        [
          { accessory_id: "ACCESSORY-000", is_equipped: true },
          { accessory_id: "ACCESSORY-000", is_equipped: true },
        ],
        db,
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array when different types are each within their own limit", () => {
      const errors = validateAccessoryEquipLimits(
        [
          { accessory_id: "ACCESSORY-000", is_equipped: true },
          { accessory_id: "ACCESSORY-004", is_equipped: true },
        ],
        db,
      );

      expect(errors).toEqual([]);
    });

    test("Should ignore non-equipped instances", () => {
      const errors = validateAccessoryEquipLimits(
        [
          { accessory_id: "ACCESSORY-004", is_equipped: false },
          { accessory_id: "ACCESSORY-004", is_equipped: false },
          { accessory_id: "ACCESSORY-004", is_equipped: false },
        ],
        db,
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when equipped count exceeds the limit", () => {
      const errors = validateAccessoryEquipLimits(
        [
          { accessory_id: "ACCESSORY-004", is_equipped: true },
          { accessory_id: "ACCESSORY-004", is_equipped: true },
        ],
        db,
      );

      expect(errors).toContain(
        'Accessory "Coroa" (ACCESSORY-004): 2 equipped exceeds limit of 1',
      );
    });

    test("Should ignore unknown accessory ids (validated elsewhere)", () => {
      const errors = validateAccessoryEquipLimits(
        [{ accessory_id: "ACCESSORY-999", is_equipped: true }],
        db,
      );

      expect(errors).toEqual([]);
    });
  });
});
