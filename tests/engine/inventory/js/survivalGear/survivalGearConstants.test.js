const { VALID_STORED_AT } = require("engine/inventory/js/survivalGear/survivalGearConstants");

describe("SURVIVAL GEAR CONSTANTS", () => {
  describe("VALID_STORED_AT", () => {
    test("Should contain stash, camp and backpack", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });
});
