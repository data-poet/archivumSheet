const {
  resolveContainer,
  resolveLooseAmmo,
  calculateTotalEquippedAmmo,
  calculateCarriedAmmoWeight,
} = require("engine/inventory/js/ammo/ammoResolver");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MOCKS
// ─────────────────────────────────────────────────────────────────────────────

const mockAmmoDb = {
  "AMMO-001": {
    ammo_id: "AMMO-001",
    ammo_name: "Broadhead Arrow",
    ammo_type: "arrow",
    ammo_weight: 0.05,
    ammo_price: 0.1,
    ammo_effect: "bleed",
    ammo_description: "Sharp broadhead tip.",
  },
  "AMMO-002": {
    ammo_id: "AMMO-002",
    ammo_name: "Bodkin Arrow",
    ammo_type: "arrow",
    ammo_weight: 0.05,
    ammo_price: 0.12,
    ammo_effect: null,
    ammo_description: "Armour-piercing tip.",
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

const mockContainer = {
  container_id: "CONT-001",
  container_name: "Quiver",
  container_box_name: "Quivers",
  container_type: "quiver",
  container_capacity: 20,
  container_weight: 0.5,
  container_price: 15,
  container_ammo_type: "arrow",
  is_carriable: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// resolveContainer
// ─────────────────────────────────────────────────────────────────────────────

describe("ammoResolver — resolveContainer", () => {
  test("Should resolve a fully populated equipped container correctly", () => {
    const instance = {
      _instanceId: "inst-1",
      container_id: "CONT-001",
      storedAt: "equipped",
      contents: [
        { ammo_id: "AMMO-001", quantity: 12 },
        { ammo_id: "AMMO-002", quantity: 8 },
      ],
    };

    const result = resolveContainer(instance, mockContainer, mockAmmoDb);

    expect(result).toEqual({
      // CONTAINER BASE
      _instanceId: "inst-1",
      container_id: "CONT-001",
      container_name: "Quiver",
      container_box_name: "Quivers",
      container_type: "quiver",
      container_ammo_type: "arrow",
      container_capacity: 20,
      container_weight: 0.5,
      container_price: 15,
      is_carriable: true,

      // RUNTIME
      storedAt: "equipped",

      // CONTENTS
      contents: [
        { ammo_id: "AMMO-001", quantity: 12, weight: 0.6 },
        { ammo_id: "AMMO-002", quantity: 8, weight: 0.4 },
      ],
      used_capacity: 20,
      remaining_capacity: 0,
      contents_weight: 1.0,
      total_weight: 1.5,
    });
  });

  test("Should resolve an empty container correctly", () => {
    const instance = {
      _instanceId: "inst-2",
      container_id: "CONT-001",
      storedAt: "backpack",
      contents: [],
    };

    const result = resolveContainer(instance, mockContainer, mockAmmoDb);

    expect(result.used_capacity).toBe(0);

    expect(result.remaining_capacity).toBe(20);

    expect(result.contents_weight).toBe(0);

    expect(result.total_weight).toBe(0.5);
  });

  test("Should compute remaining_capacity correctly when partially filled", () => {
    const instance = {
      _instanceId: "inst-3",
      container_id: "CONT-001",
      storedAt: "stash",
      contents: [{ ammo_id: "AMMO-001", quantity: 5 }],
    };

    const result = resolveContainer(instance, mockContainer, mockAmmoDb);

    expect(result.used_capacity).toBe(5);

    expect(result.remaining_capacity).toBe(15);
  });

  test("Should compute total_weight as container_weight + contents_weight", () => {
    const instance = {
      _instanceId: "inst-4",
      container_id: "CONT-001",
      storedAt: "equipped",
      contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
    };

    const result = resolveContainer(instance, mockContainer, mockAmmoDb);

    // 0.5 (container) + 10 × 0.05 (ammo) = 1.0
    expect(result.total_weight).toBe(1.0);
  });

  test("Should compute weight per contents entry correctly", () => {
    const instance = {
      _instanceId: "inst-5",
      container_id: "CONT-001",
      storedAt: "equipped",
      contents: [{ ammo_id: "AMMO-001", quantity: 7 }],
    };

    const result = resolveContainer(instance, mockContainer, mockAmmoDb);

    expect(result.contents[0].weight).toBe(0.35);
  });

  test("Should propagate storedAt from the instance", () => {
    const instance = {
      _instanceId: "inst-6",
      container_id: "CONT-001",
      storedAt: "camp",
      contents: [],
    };

    const result = resolveContainer(instance, mockContainer, mockAmmoDb);

    expect(result.storedAt).toBe("camp");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveLooseAmmo
// ─────────────────────────────────────────────────────────────────────────────

describe("ammoResolver — resolveLooseAmmo", () => {
  test("Should resolve a loose ammo entry correctly", () => {
    const instance = {
      ammo_id: "AMMO-001",
      quantity: 5,
      storedAt: "backpack",
    };

    const result = resolveLooseAmmo(instance, mockAmmoDb["AMMO-001"]);

    expect(result).toEqual({
      ammo_id: "AMMO-001",
      ammo_name: "Broadhead Arrow",
      ammo_type: "arrow",
      ammo_weight: 0.05,
      ammo_price: 0.1,
      ammo_effect: "bleed",
      ammo_description: "Sharp broadhead tip.",

      quantity: 5,
      storedAt: "backpack",
      total_weight: 0.25,
    });
  });

  test("Should compute total_weight as ammo_weight × quantity", () => {
    const instance = { ammo_id: "AMMO-003", quantity: 10, storedAt: "stash" };

    const result = resolveLooseAmmo(instance, mockAmmoDb["AMMO-003"]);

    // 10 × 0.06
    expect(result.total_weight).toBe(0.6);
  });

  test("Should propagate storedAt from the instance", () => {
    const instance = { ammo_id: "AMMO-001", quantity: 1, storedAt: "camp" };

    const result = resolveLooseAmmo(instance, mockAmmoDb["AMMO-001"]);

    expect(result.storedAt).toBe("camp");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateTotalEquippedAmmo
// ─────────────────────────────────────────────────────────────────────────────

describe("ammoResolver — calculateTotalEquippedAmmo", () => {
  test("Should aggregate ammo quantities by type across equipped containers", () => {
    const equippedContainers = [
      {
        contents: [
          { ammo_id: "AMMO-001", quantity: 12 },
          { ammo_id: "AMMO-002", quantity: 8 },
        ],
      },
      {
        contents: [{ ammo_id: "AMMO-001", quantity: 4 }],
      },
    ];

    const result = calculateTotalEquippedAmmo(equippedContainers, mockAmmoDb);

    expect(result).toEqual({ arrow: 24 });
  });

  test("Should aggregate multiple ammo types correctly", () => {
    const equippedContainers = [
      {
        contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
      },
      {
        contents: [{ ammo_id: "AMMO-003", quantity: 12 }],
      },
    ];

    const result = calculateTotalEquippedAmmo(equippedContainers, mockAmmoDb);

    expect(result).toEqual({ arrow: 10, bolt: 12 });
  });

  test("Should return empty object when no equipped containers", () => {
    const result = calculateTotalEquippedAmmo([], mockAmmoDb);

    expect(result).toEqual({});
  });

  test("Should return empty object when equipped container has no contents", () => {
    const result = calculateTotalEquippedAmmo([{ contents: [] }], mockAmmoDb);

    expect(result).toEqual({});
  });

  test("Should skip unknown ammo_id without crashing", () => {
    const equippedContainers = [
      {
        contents: [{ ammo_id: "AMMO-999", quantity: 5 }],
      },
    ];

    const result = calculateTotalEquippedAmmo(equippedContainers, mockAmmoDb);

    expect(result).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateCarriedAmmoWeight
// ─────────────────────────────────────────────────────────────────────────────

describe("ammoResolver — calculateCarriedAmmoWeight", () => {
  const equippedContainer = { total_weight: 1.5 };

  const backpackContainer = { total_weight: 1.0 };

  const backpackLoose = { total_weight: 0.25 };

  test("Should sum equipped containers + backpack containers + backpack loose", () => {
    const result = calculateCarriedAmmoWeight(
      [equippedContainer],
      [backpackContainer],
      [backpackLoose],
    );

    // 1.5 + 1.0 + 0.25
    expect(result).toBe(2.75);
  });

  test("Should return 0 when all inputs are empty", () => {
    const result = calculateCarriedAmmoWeight([], [], []);

    expect(result).toBe(0);
  });

  test("Should not count stash or camp — those are not passed in", () => {
    // Only backpack containers count; stash/camp are filtered upstream
    const result = calculateCarriedAmmoWeight([], [backpackContainer], []);

    expect(result).toBe(1.0);
  });

  test("Should sum multiple containers correctly", () => {
    const result = calculateCarriedAmmoWeight(
      [{ total_weight: 1.5 }, { total_weight: 0.8 }],
      [{ total_weight: 1.0 }],
      [{ total_weight: 0.25 }, { total_weight: 0.1 }],
    );

    // 1.5 + 0.8 + 1.0 + 0.25 + 0.1
    expect(result).toBe(3.65);
  });
});
