const {
  buildCoinPurseSlots,
  VALID_STORED_AT,
  VALID_COIN_TYPES,
} = require("engine/inventory/js/coinPurse/coinPurse");

const {
  COIN_WEIGHT,
  COIN_VALUE,
} = require("engine/inventory/js/coinPurse/coinPurseConstants");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

function coin(overrides = {}) {
  return {
    coin_type: "silver",
    quantity:  10,
    storedAt:  "backpack",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — constants", () => {
  test("VALID_COIN_TYPES contains copper, silver, gold", () => {
    expect(VALID_COIN_TYPES).toEqual(["copper", "silver", "gold"]);
  });

  test("VALID_STORED_AT contains backpack, stash, camp", () => {
    expect(VALID_STORED_AT).toEqual(["backpack", "stash", "camp"]);
  });

  test("COIN_WEIGHT values are correct", () => {
    expect(COIN_WEIGHT.copper).toBe(0.002);
    expect(COIN_WEIGHT.silver).toBe(0.003);
    expect(COIN_WEIGHT.gold).toBe(0.005);
  });

  test("COIN_VALUE values are correct", () => {
    expect(COIN_VALUE.copper).toBe(1);
    expect(COIN_VALUE.silver).toBe(100);
    expect(COIN_VALUE.gold).toBe(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY INPUT
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — empty input", () => {
  test("Should return empty buckets with zero totals when called with no args", () => {
    const result = buildCoinPurseSlots();

    expect(result.backpack).toEqual([]);
    expect(result.stash).toEqual([]);
    expect(result.camp).toEqual([]);
    expect(result.carried_coin_purse_weight).toBe(0);
    expect(result.total_coin_purse_value).toBe(0);
    expect(result.carried_coin_purse_value).toBe(0);
  });

  test("Should return empty buckets for empty array", () => {
    const result = buildCoinPurseSlots([]);

    expect(result.backpack).toEqual([]);
    expect(result.carried_coin_purse_weight).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — routing", () => {
  test("Should place coins in backpack bucket", () => {
    const result = buildCoinPurseSlots([coin({ storedAt: "backpack" })]);

    expect(result.backpack.length).toBe(1);
    expect(result.stash.length).toBe(0);
    expect(result.camp.length).toBe(0);
  });

  test("Should place coins in stash bucket", () => {
    const result = buildCoinPurseSlots([coin({ storedAt: "stash" })]);

    expect(result.stash.length).toBe(1);
    expect(result.backpack.length).toBe(0);
    expect(result.camp.length).toBe(0);
  });

  test("Should place coins in camp bucket", () => {
    const result = buildCoinPurseSlots([coin({ storedAt: "camp" })]);

    expect(result.camp.length).toBe(1);
    expect(result.backpack.length).toBe(0);
    expect(result.stash.length).toBe(0);
  });

  test("Should distribute across all three locations", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "copper", storedAt: "backpack" }),
      coin({ coin_type: "silver", storedAt: "stash" }),
      coin({ coin_type: "gold",   storedAt: "camp" }),
    ]);

    expect(result.backpack.length).toBe(1);
    expect(result.stash.length).toBe(1);
    expect(result.camp.length).toBe(1);
  });

  test("Should allow same coin_type in multiple locations", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "silver", quantity: 5,  storedAt: "backpack" }),
      coin({ coin_type: "silver", quantity: 5,  storedAt: "stash" }),
      coin({ coin_type: "silver", quantity: 10, storedAt: "camp" }),
    ]);

    expect(result.backpack.length).toBe(1);
    expect(result.stash.length).toBe(1);
    expect(result.camp.length).toBe(1);
    expect(result.backpack[0].quantity).toBe(5);
    expect(result.stash[0].quantity).toBe(5);
    expect(result.camp[0].quantity).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVED SHAPE
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — resolved shape", () => {
  test("Should include all expected fields on each resolved entry", () => {
    const result = buildCoinPurseSlots([coin()]);
    const entry  = result.backpack[0];

    expect(entry).toHaveProperty("coin_type");
    expect(entry).toHaveProperty("quantity");
    expect(entry).toHaveProperty("storedAt");
    expect(entry).toHaveProperty("coin_weight");
    expect(entry).toHaveProperty("coin_value");
    expect(entry).toHaveProperty("total_weight");
    expect(entry).toHaveProperty("total_value");
  });

  test("Should resolve copper coin correctly", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "copper", quantity: 100, storedAt: "backpack" }),
    ]);
    const entry = result.backpack[0];

    expect(entry.coin_weight).toBe(0.002);
    expect(entry.coin_value).toBe(1);
    expect(entry.total_weight).toBe(round2(0.002 * 100));
    expect(entry.total_value).toBe(1 * 100);
  });

  test("Should resolve silver coin correctly", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "silver", quantity: 10, storedAt: "backpack" }),
    ]);
    const entry = result.backpack[0];

    expect(entry.coin_weight).toBe(0.003);
    expect(entry.coin_value).toBe(100);
    expect(entry.total_weight).toBe(round2(0.003 * 10));
    expect(entry.total_value).toBe(100 * 10);
  });

  test("Should resolve gold coin correctly", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "gold", quantity: 5, storedAt: "backpack" }),
    ]);
    const entry = result.backpack[0];

    expect(entry.coin_weight).toBe(0.005);
    expect(entry.coin_value).toBe(1000);
    expect(entry.total_weight).toBe(round2(0.005 * 5));
    expect(entry.total_value).toBe(1000 * 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — carried weight", () => {
  test("Should count backpack coins toward carried weight", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "silver", quantity: 10, storedAt: "backpack" }),
    ]);

    expect(result.carried_coin_purse_weight).toBe(round2(0.003 * 10));
  });

  test("Should NOT count stash coins toward carried weight", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "gold", quantity: 100, storedAt: "stash" }),
    ]);

    expect(result.carried_coin_purse_weight).toBe(0);
  });

  test("Should NOT count camp coins toward carried weight", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "gold", quantity: 100, storedAt: "camp" }),
    ]);

    expect(result.carried_coin_purse_weight).toBe(0);
  });

  test("Should sum weight across multiple backpack entries", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "copper", quantity: 100, storedAt: "backpack" }),
      coin({ coin_type: "silver", quantity: 10,  storedAt: "backpack" }),
      coin({ coin_type: "gold",   quantity: 2,   storedAt: "backpack" }),
    ]);

    const expected = round2(0.002 * 100 + 0.003 * 10 + 0.005 * 2);

    expect(result.carried_coin_purse_weight).toBe(expected);
  });

  test("Should only count backpack when coins span all locations", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "gold", quantity: 50, storedAt: "stash" }),
      coin({ coin_type: "gold", quantity: 50, storedAt: "camp" }),
      coin({ coin_type: "gold", quantity: 10, storedAt: "backpack" }),
    ]);

    expect(result.carried_coin_purse_weight).toBe(round2(0.005 * 10));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VALUE
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — value (copper equivalent)", () => {
  test("total_coin_purse_value includes all locations", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "silver", quantity: 5, storedAt: "backpack" }),
      coin({ coin_type: "silver", quantity: 5, storedAt: "stash" }),
      coin({ coin_type: "silver", quantity: 5, storedAt: "camp" }),
    ]);

    // 15 × 100 = 1500
    expect(result.total_coin_purse_value).toBe(1500);
  });

  test("carried_coin_purse_value only counts backpack", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "silver", quantity: 5, storedAt: "backpack" }),
      coin({ coin_type: "silver", quantity: 5, storedAt: "stash" }),
      coin({ coin_type: "silver", quantity: 5, storedAt: "camp" }),
    ]);

    // 5 × 100 = 500
    expect(result.carried_coin_purse_value).toBe(500);
  });

  test("Should compute mixed coin values correctly", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "copper", quantity: 1000, storedAt: "backpack" }),
      coin({ coin_type: "silver", quantity: 10,   storedAt: "backpack" }),
      coin({ coin_type: "gold",   quantity: 1,    storedAt: "backpack" }),
    ]);

    // 1000×1 + 10×100 + 1×1000 = 3000
    expect(result.carried_coin_purse_value).toBe(3000);
    expect(result.total_coin_purse_value).toBe(3000);
  });

  test("gold in stash does not count toward carried_coin_purse_value", () => {
    const result = buildCoinPurseSlots([
      coin({ coin_type: "gold", quantity: 10, storedAt: "stash" }),
    ]);

    expect(result.carried_coin_purse_value).toBe(0);
    expect(result.total_coin_purse_value).toBe(10000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe("COIN PURSE — validation", () => {
  test("Should throw for invalid coin_type", () => {
    expect(() =>
      buildCoinPurseSlots([coin({ coin_type: "platinum" })]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });

  test("Should throw for zero quantity", () => {
    expect(() =>
      buildCoinPurseSlots([coin({ quantity: 0 })]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });

  test("Should throw for fractional quantity", () => {
    expect(() =>
      buildCoinPurseSlots([coin({ quantity: 1.5 })]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });

  test("Should throw for negative quantity", () => {
    expect(() =>
      buildCoinPurseSlots([coin({ quantity: -5 })]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });

  test("Should throw for invalid storedAt", () => {
    expect(() =>
      buildCoinPurseSlots([coin({ storedAt: "equipped" })]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });

  test("Should throw for non-object instance", () => {
    expect(() =>
      buildCoinPurseSlots(["invalid"]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });

  test("Should collect errors from multiple invalid instances", () => {
    expect(() =>
      buildCoinPurseSlots([
        coin({ coin_type: "platinum" }),
        coin({ quantity: 0 }),
      ]),
    ).toThrow("[buildCoinPurseSlots] Invalid coinInventory");
  });
});
