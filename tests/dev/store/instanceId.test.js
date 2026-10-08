import {
  generateInstanceId,
  ensureInstanceIds,
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
