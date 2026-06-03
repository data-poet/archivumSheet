const {
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
} = require("engine/inventory/js/ammo/ammoConstants");

describe("AMMO CONSTANTS", () => {
  describe("VALID_CONTAINER_STORED_AT", () => {
    test("Should export VALID_CONTAINER_STORED_AT", () => {
      expect(VALID_CONTAINER_STORED_AT).toBeDefined();
    });

    test("Should contain equipped, stash, camp and backpack", () => {
      expect(VALID_CONTAINER_STORED_AT).toEqual([
        "equipped",
        "stash",
        "camp",
        "backpack",
      ]);
    });
  });

  describe("VALID_LOOSE_STORED_AT", () => {
    test("Should export VALID_LOOSE_STORED_AT", () => {
      expect(VALID_LOOSE_STORED_AT).toBeDefined();
    });

    test("Should contain stash, camp and backpack only — not equipped", () => {
      expect(VALID_LOOSE_STORED_AT).toEqual(["stash", "camp", "backpack"]);

      expect(VALID_LOOSE_STORED_AT).not.toContain("equipped");
    });
  });
});
