const {
  VALID_STORED_AT,
} = require("engine/inventory/js/customInventory/customInventoryConstants");

describe("CUSTOM INVENTORY CONSTANTS", () => {
  test("Should export VALID_STORED_AT with stash, camp and backpack", () => {
    expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
  });
});
