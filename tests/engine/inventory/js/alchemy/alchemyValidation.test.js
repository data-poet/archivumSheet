const {
  validateAlchemyInstance,
} = require("engine/inventory/js/alchemy/alchemyValidation");

const { VALID_STORED_AT } = require("engine/inventory/js/alchemy/alchemyConstants");

// ─────────────────────────────────────────────────────────────────────────────
// validateAlchemyInstance
// ─────────────────────────────────────────────────────────────────────────────

describe("ALCHEMY VALIDATION — validateAlchemyInstance", () => {
  test("Should return empty array for a valid backpack entry", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 2,
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid stash entry", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 1,
        storedAt: "stash",
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid camp entry", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "ELEXIR-000",
        quantity: 5,
        storedAt: "camp",
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should fail when instance is not an object", () => {
    const errors = validateAlchemyInstance(null, 0);

    expect(errors).toEqual(["alchemyInventory[0]: must be an object"]);
  });

  test("Should fail when consumable_id is missing", () => {
    const errors = validateAlchemyInstance(
      {
        quantity: 1,
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toContain("alchemyInventory[0]: consumable_id is required");
  });

  test("Should fail when consumable_id is empty string", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "",
        quantity: 1,
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toContain("alchemyInventory[0]: consumable_id is required");
  });

  test("Should fail when quantity is zero", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 0,
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toContain(
      "alchemyInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when quantity is negative", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: -1,
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toContain(
      "alchemyInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when quantity is a float", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 1.5,
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toContain(
      "alchemyInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when quantity is a string", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: "2",
        storedAt: "backpack",
      },
      0,
    );

    expect(errors).toContain(
      "alchemyInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when storedAt is invalid", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 1,
        storedAt: "equipped",
      },
      0,
    );

    expect(errors).toContain(
      `alchemyInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}]`,
    );
  });

  test("Should fail when storedAt is null", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 1,
        storedAt: null,
      },
      0,
    );

    expect(errors).toContain(
      `alchemyInventory[0]: storedAt must be one of [${VALID_STORED_AT.join(", ")}]`,
    );
  });

  test("Should use the correct index prefix", () => {
    const errors = validateAlchemyInstance(
      {
        consumable_id: "POTION-000",
        quantity: 1,
        storedAt: "invalid",
      },
      3,
    );

    expect(errors[0]).toMatch(/alchemyInventory\[3\]/);
  });

  test("Should accumulate multiple errors", () => {
    const errors = validateAlchemyInstance(
      {
        quantity: -1,
        storedAt: "invalid",
      },
      0,
    );

    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
