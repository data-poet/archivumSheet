import {
  generateInstanceId,
  ensureInstanceIds,
  explodeToUnitRows,
} from "dev/public/js/store/instanceId.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("generateInstanceId", () => {
  test("returns a UUID", () => {
    expect(generateInstanceId()).toMatch(UUID_RE);
  });

  test("returns a different id on each call", () => {
    expect(generateInstanceId()).not.toBe(generateInstanceId());
  });
});

describe("ensureInstanceIds", () => {
  test("assigns an id to entries missing one", () => {
    const entries = [{ name: "a" }, { name: "b" }];
    ensureInstanceIds(entries);

    expect(entries[0].id).toMatch(UUID_RE);
    expect(entries[1].id).toMatch(UUID_RE);
    expect(entries[0].id).not.toBe(entries[1].id);
  });

  test("leaves an existing id untouched", () => {
    const entries = [{ name: "a", id: "existing-id" }];
    ensureInstanceIds(entries);

    expect(entries[0].id).toBe("existing-id");
  });

  test("handles an empty array", () => {
    expect(ensureInstanceIds([])).toEqual([]);
  });

  test("returns the same array reference it was given", () => {
    const entries = [{ name: "a" }];
    expect(ensureInstanceIds(entries)).toBe(entries);
  });
});

describe("explodeToUnitRows", () => {
  test("explodes a legacy aggregated row (no id) into one row per unit", () => {
    const entries = [
      { consumable_id: "POTION-1", quantity: 3, storedAt: "backpack" },
    ];

    const result = explodeToUnitRows(entries);

    expect(result).toHaveLength(3);
    expect(result.every((r) => r.quantity === 1)).toBe(true);
    expect(result.every((r) => r.consumable_id === "POTION-1")).toBe(true);
    const ids = new Set(result.map((r) => r.id));
    expect(ids.size).toBe(3);
  });

  test("passes through rows that already have an id untouched", () => {
    const entries = [
      { consumable_id: "POTION-1", quantity: 1, storedAt: "backpack", id: "existing" },
    ];

    const result = explodeToUnitRows(entries);

    expect(result).toEqual(entries);
  });

  test("handles a mix of legacy and already-migrated rows", () => {
    const entries = [
      { consumable_id: "POTION-1", quantity: 2, storedAt: "backpack" },
      { consumable_id: "POTION-2", quantity: 1, storedAt: "camp", id: "existing" },
    ];

    const result = explodeToUnitRows(entries);

    expect(result).toHaveLength(3);
    expect(result.filter((r) => r.consumable_id === "POTION-1")).toHaveLength(2);
    expect(result.find((r) => r.id === "existing").consumable_id).toBe("POTION-2");
  });
});
