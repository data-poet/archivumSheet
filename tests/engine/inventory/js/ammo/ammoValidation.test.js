const {
  validateContainerInstance,
  validateLooseAmmoInstance,
  validateContainerCrossRules,
} = require("engine/inventory/js/ammo/ammoValidation");

const {
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
} = require("engine/inventory/js/ammo/ammoConstants");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MOCKS
// ─────────────────────────────────────────────────────────────────────────────

const mockContainerDb = {
  "CONT-001": {
    container_id: "CONT-001",
    container_name: "Quiver",
    container_box_name: "Quivers",
    container_type: "quiver",
    container_capacity: 20,
    container_weight: 0.5,
    container_price: 15,
    container_ammo_type: "arrow",
    is_carriable: true,
  },
  "CONT-002": {
    container_id: "CONT-002",
    container_name: "Bolt Case",
    container_box_name: "Bolt Cases",
    container_type: "bolt_case",
    container_capacity: 30,
    container_weight: 0.6,
    container_price: 18,
    container_ammo_type: "bolt",
    is_carriable: true,
  },
  "CONT-003": {
    container_id: "CONT-003",
    container_name: "Arrow Crate",
    container_box_name: "Arrow Crates",
    container_type: "crate",
    container_capacity: 200,
    container_weight: 5.0,
    container_price: 40,
    container_ammo_type: "arrow",
    is_carriable: false,
  },
};

const mockAmmoDb = {
  "AMMO-001": {
    ammo_id: "AMMO-001",
    ammo_name: "Broadhead Arrow",
    ammo_type: "arrow",
    ammo_weight: 0.05,
    ammo_price: 0.1,
    ammo_effect: null,
    ammo_description: null,
  },
  "AMMO-002": {
    ammo_id: "AMMO-002",
    ammo_name: "Bodkin Arrow",
    ammo_type: "arrow",
    ammo_weight: 0.05,
    ammo_price: 0.12,
    ammo_effect: null,
    ammo_description: null,
  },
  "AMMO-003": {
    ammo_id: "AMMO-003",
    ammo_name: "Crossbow Bolt",
    ammo_type: "bolt",
    ammo_weight: 0.06,
    ammo_price: 0.15,
    ammo_effect: null,
    ammo_description: null,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// validateContainerInstance
// ─────────────────────────────────────────────────────────────────────────────

describe("AMMO VALIDATION — validateContainerInstance", () => {
  test("Should return empty array for a valid equipped container", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid backpack container", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-2",
        container_id: "CONT-001",
        storedAt: "backpack",
        contents: [],
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid stash container", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-3",
        container_id: "CONT-003",
        storedAt: "stash",
        contents: [],
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid camp container", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-4",
        container_id: "CONT-003",
        storedAt: "camp",
        contents: [],
      },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should fail when instance is not an object", () => {
    const errors = validateContainerInstance(null, 0);

    expect(errors).toEqual(["ammoContainerInventory[0]: must be an object"]);
  });

  test("Should fail when container_id is missing", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        storedAt: "equipped",
        contents: [],
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0]: container_id is required",
    );
  });

  test("Should fail when _instanceId is missing", () => {
    const errors = validateContainerInstance(
      {
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: [],
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0]: _instanceId is required",
    );
  });

  test("Should fail when storedAt is invalid", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "wallet",
        contents: [],
      },
      0,
    );

    expect(errors).toContain(
      `ammoContainerInventory[0]: storedAt must be one of [${VALID_CONTAINER_STORED_AT.join(", ")}]`,
    );
  });

  test("Should fail when contents is not an array", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: null,
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0]: contents must be an array",
    );
  });

  test("Should fail when a contents entry has no ammo_id", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: [{ quantity: 5 }],
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0].contents[0]: ammo_id is required",
    );
  });

  test("Should fail when a contents entry has zero quantity", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: [{ ammo_id: "AMMO-001", quantity: 0 }],
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0].contents[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when a contents entry has a negative quantity", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: [{ ammo_id: "AMMO-001", quantity: -3 }],
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0].contents[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when a contents entry has a float quantity", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-1",
        container_id: "CONT-001",
        storedAt: "equipped",
        contents: [{ ammo_id: "AMMO-001", quantity: 2.5 }],
      },
      0,
    );

    expect(errors).toContain(
      "ammoContainerInventory[0].contents[0]: quantity must be a positive integer",
    );
  });

  test("Should use correct index in error prefix", () => {
    const errors = validateContainerInstance(
      {
        _instanceId: "inst-3",
        storedAt: "stash",
        contents: [],
      },
      3,
    );

    expect(errors[0]).toMatch("ammoContainerInventory[3]");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateLooseAmmoInstance
// ─────────────────────────────────────────────────────────────────────────────

describe("AMMO VALIDATION — validateLooseAmmoInstance", () => {
  test("Should return empty array for a valid backpack loose ammo entry", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 10, storedAt: "backpack" },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid stash loose ammo entry", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 50, storedAt: "stash" },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for a valid camp loose ammo entry", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 100, storedAt: "camp" },
      0,
    );

    expect(errors).toEqual([]);
  });

  test("Should fail when instance is not an object", () => {
    const errors = validateLooseAmmoInstance(null, 0);

    expect(errors).toEqual(["looseAmmoInventory[0]: must be an object"]);
  });

  test("Should fail when ammo_id is missing", () => {
    const errors = validateLooseAmmoInstance(
      { quantity: 10, storedAt: "backpack" },
      0,
    );

    expect(errors).toContain("looseAmmoInventory[0]: ammo_id is required");
  });

  test("Should fail when quantity is zero", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 0, storedAt: "backpack" },
      0,
    );

    expect(errors).toContain(
      "looseAmmoInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when quantity is negative", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: -1, storedAt: "backpack" },
      0,
    );

    expect(errors).toContain(
      "looseAmmoInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when quantity is a float", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 1.5, storedAt: "backpack" },
      0,
    );

    expect(errors).toContain(
      "looseAmmoInventory[0]: quantity must be a positive integer",
    );
  });

  test("Should fail when storedAt is equipped", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 10, storedAt: "equipped" },
      0,
    );

    expect(errors).toContain(
      `looseAmmoInventory[0]: storedAt must be one of [${VALID_LOOSE_STORED_AT.join(", ")}]`,
    );
  });

  test("Should fail when storedAt is invalid", () => {
    const errors = validateLooseAmmoInstance(
      { ammo_id: "AMMO-001", quantity: 10, storedAt: "chest" },
      0,
    );

    expect(errors).toContain(
      `looseAmmoInventory[0]: storedAt must be one of [${VALID_LOOSE_STORED_AT.join(", ")}]`,
    );
  });

  test("Should use correct index in error prefix", () => {
    const errors = validateLooseAmmoInstance(
      { quantity: 5, storedAt: "backpack" },
      2,
    );

    expect(errors[0]).toMatch("looseAmmoInventory[2]");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateContainerCrossRules
// ─────────────────────────────────────────────────────────────────────────────

describe("AMMO VALIDATION — validateContainerCrossRules", () => {
  test("Should return empty array for a valid single equipped carriable container", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for carriable container in backpack", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for non-carriable container in stash", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "stash",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should return empty array for non-carriable container in camp", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "camp",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should fail when non-carriable container is equipped", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "equipped",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toContain(
      'ammoContainerInventory[0]: container_id "CONT-003" is not carriable and cannot be stored at "equipped"',
    );
  });

  test("Should fail when non-carriable container is in backpack", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "backpack",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toContain(
      'ammoContainerInventory[0]: container_id "CONT-003" is not carriable and cannot be stored at "backpack"',
    );
  });

  test("Should fail when same container_id is equipped twice", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toContain(
      'ammoContainerInventory: container_id "CONT-001" appears 2 times at "equipped" — max 1 allowed',
    );
  });

  test("Should fail when same container_id is in backpack twice", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toContain(
      'ammoContainerInventory: container_id "CONT-001" appears 2 times at "backpack" — max 1 allowed',
    );
  });

  test("Should allow same container_id in stash multiple times", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "stash",
          contents: [],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-001",
          storedAt: "stash",
          contents: [],
        },
        {
          _instanceId: "inst-3",
          container_id: "CONT-001",
          storedAt: "stash",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should allow same container_id in camp multiple times", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "camp",
          contents: [],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-001",
          storedAt: "camp",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should allow 1 equipped and 1 backpack of the same container_id", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should fail when ammo type does not match container_ammo_type", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",    // accepts "arrow"
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-003", quantity: 5 }],  // bolt
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toContain(
      'ammoContainerInventory[0].contents[0]: ammo_id "AMMO-003" has type "bolt" but container "CONT-001" only accepts "arrow"',
    );
  });

  test("Should allow mixed ammo of the correct type in one container", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",    // accepts "arrow"
          storedAt: "equipped",
          contents: [
            { ammo_id: "AMMO-001", quantity: 10 },  // arrow
            { ammo_id: "AMMO-002", quantity: 5 },   // arrow
          ],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    expect(errors).toEqual([]);
  });

  test("Should skip unknown container_id without crashing", () => {
    const errors = validateContainerCrossRules(
      [
        {
          _instanceId: "inst-1",
          container_id: "CONT-999",
          storedAt: "equipped",
          contents: [],
        },
      ],
      mockContainerDb,
      mockAmmoDb,
    );

    // unknown IDs are caught by the DB existence check in ammo.js, not here
    expect(errors).toEqual([]);
  });
});
