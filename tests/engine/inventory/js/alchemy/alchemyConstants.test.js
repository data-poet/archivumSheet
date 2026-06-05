const { VALID_STORED_AT } = require("engine/inventory/js/alchemy/alchemyConstants");

describe("ALCHEMY CONSTANTS", () => {
  describe("VALID_STORED_AT", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toBeDefined();
    });

    test("Should contain stash, camp and backpack only", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });

    test("Should not contain equipped", () => {
      expect(VALID_STORED_AT).not.toContain("equipped");
    });
  });
});
