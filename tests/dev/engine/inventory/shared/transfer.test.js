jest.mock("dev/public/js/store/characters.js", () => ({
  withCharacterInventory: jest.fn(),
}));

import { withCharacterInventory } from "dev/public/js/store/characters.js";
import {
  transferInstance,
  undoTransferInstance,
  transferStackQuantity,
  undoTransferStackQuantity,
} from "dev/public/js/engine/inventory/shared/transfer.js";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("transferInstance", () => {
  function makeSource() {
    return [
      { id: "armor-1", armor_id: "ARM-1", is_equipped: true, storedAt: null },
      { id: "armor-2", armor_id: "ARM-2", is_equipped: false, storedAt: "backpack" },
    ];
  }

  test("moves the instance into the destination inventory and removes it from the source", () => {
    const sourceArray = makeSource();
    let destinationArmors;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationArmors = [];
      mutator({ armors: destinationArmors });
      return true;
    });

    const clone = transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
      destinationStoredAt: "backpack",
    });

    expect(clone).not.toBeNull();
    expect(sourceArray.map((a) => a.id)).toEqual(["armor-2"]);
    expect(destinationArmors).toHaveLength(1);
    expect(destinationArmors[0]).toMatchObject({
      armor_id: "ARM-1",
      is_equipped: false,
      storedAt: "backpack",
    });
    expect(destinationArmors[0].id).not.toBe("armor-1");
    expect(clone.id).toBe(destinationArmors[0].id);
    expect(withCharacterInventory).toHaveBeenCalledWith(
      "ally-1",
      expect.any(Function),
    );
  });

  test("returns null and leaves the source untouched for an unknown instance id", () => {
    const sourceArray = makeSource();

    const clone = transferInstance({
      sourceArray,
      instanceId: "ghost",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
    });

    expect(clone).toBeNull();
    expect(sourceArray).toHaveLength(2);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("returns null without mutating the source when canReceive rejects", () => {
    const sourceArray = makeSource();

    const clone = transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
      canReceive: () => false,
    });

    expect(clone).toBeNull();
    expect(sourceArray).toHaveLength(2);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source instance in place when the destination write fails", () => {
    const sourceArray = makeSource();
    withCharacterInventory.mockReturnValue(false);

    const clone = transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "does-not-exist",
      destinationInventoryKey: "armors",
    });

    expect(clone).toBeNull();
    expect(sourceArray.map((a) => a.id)).toEqual(["armor-1", "armor-2"]);
  });

  test("clones enchantments with fresh ids independent of the source", () => {
    const sourceArray = [
      {
        id: "armor-1",
        armor_id: "ARM-1",
        is_equipped: true,
        enchantments: [{ id: "ench-1", enchantment_id: "ATTR-1" }],
      },
    ];
    let destinationArmors;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationArmors = [];
      mutator({ armors: destinationArmors });
      return true;
    });

    transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
    });

    const clonedEnchantment = destinationArmors[0].enchantments[0];
    expect(clonedEnchantment.enchantment_id).toBe("ATTR-1");
    expect(clonedEnchantment.id).not.toBe("ench-1");
  });

  test("leaves a field absent from the source untouched (no stray is_equipped on unequippable items)", () => {
    const sourceArray = [{ id: "item-1", name: "Rope" }];
    let destinationItems;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationItems = [];
      mutator({ customInventory: destinationItems });
      return true;
    });

    transferInstance({
      sourceArray,
      instanceId: "item-1",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "customInventory",
    });

    expect(destinationItems[0]).not.toHaveProperty("is_equipped");
  });
});

describe("undoTransferInstance", () => {
  test("removes the clone from the destination inventory", () => {
    const inventory = {
      armors: [
        { id: "clone-1", armor_id: "ARM-1" },
        { id: "clone-2", armor_id: "ARM-2" },
      ],
    };
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator(inventory);
      return true;
    });

    undoTransferInstance({
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
      cloneId: "clone-1",
    });

    expect(withCharacterInventory).toHaveBeenCalledWith(
      "ally-1",
      expect.any(Function),
    );
    expect(inventory.armors.map((a) => a.id)).toEqual(["clone-2"]);
  });
});

describe("transferStackQuantity", () => {
  function makeSource() {
    return [
      { id: "coin-1", coin_type: "gold", quantity: 20, storedAt: "backpack" },
    ];
  }

  test("moves a partial amount, decrementing the source row", () => {
    const sourceArray = makeSource();
    let destinationCoins;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationCoins = [];
      mutator({ coins: destinationCoins });
      return true;
    });

    const result = transferStackQuantity({
      sourceArray,
      instanceId: "coin-1",
      amount: 5,
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      destinationStoredAt: "backpack",
      matchKeyFields: ["coin_type"],
    });

    expect(result.amount).toBe(5);
    expect(sourceArray[0].quantity).toBe(15);
    expect(destinationCoins).toHaveLength(1);
    expect(destinationCoins[0]).toMatchObject({ coin_type: "gold", quantity: 5 });
    expect(result.destinationRowId).toBe(destinationCoins[0].id);
  });

  test("removes the source row entirely on a full send", () => {
    const sourceArray = makeSource();
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator({ coins: [] });
      return true;
    });

    transferStackQuantity({
      sourceArray,
      instanceId: "coin-1",
      amount: 20,
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      matchKeyFields: ["coin_type"],
    });

    expect(sourceArray).toHaveLength(0);
  });

  test("clamps an over-amount to what's available", () => {
    const sourceArray = makeSource();
    let destinationCoins;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationCoins = [];
      mutator({ coins: destinationCoins });
      return true;
    });

    const result = transferStackQuantity({
      sourceArray,
      instanceId: "coin-1",
      amount: 999,
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      matchKeyFields: ["coin_type"],
    });

    expect(result.amount).toBe(20);
    expect(sourceArray).toHaveLength(0);
    expect(destinationCoins[0].quantity).toBe(20);
  });

  test("merges into an existing matching destination row instead of duplicating", () => {
    const sourceArray = makeSource();
    const inventory = {
      coins: [{ id: "dest-1", coin_type: "gold", quantity: 10, storedAt: "backpack" }],
    };
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator(inventory);
      return true;
    });

    const result = transferStackQuantity({
      sourceArray,
      instanceId: "coin-1",
      amount: 5,
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      destinationStoredAt: "backpack",
      matchKeyFields: ["coin_type"],
    });

    expect(inventory.coins).toHaveLength(1);
    expect(inventory.coins[0].quantity).toBe(15);
    expect(result.destinationRowId).toBe("dest-1");
  });

  test("returns null and leaves the source untouched for an unknown instance id", () => {
    const sourceArray = makeSource();

    const result = transferStackQuantity({
      sourceArray,
      instanceId: "ghost",
      amount: 5,
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      matchKeyFields: ["coin_type"],
    });

    expect(result).toBeNull();
    expect(sourceArray).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source row's exact pre-call quantity when the destination write fails", () => {
    const sourceArray = makeSource();
    withCharacterInventory.mockReturnValue(false);

    const result = transferStackQuantity({
      sourceArray,
      instanceId: "coin-1",
      amount: 5,
      destinationCharacterId: "does-not-exist",
      destinationInventoryKey: "coins",
      matchKeyFields: ["coin_type"],
    });

    expect(result).toBeNull();
    expect(sourceArray[0].quantity).toBe(20);
  });
});

describe("undoTransferStackQuantity", () => {
  test("decrements the destination row and removes it if that empties it", () => {
    const inventory = {
      coins: [{ id: "dest-1", coin_type: "gold", quantity: 5, storedAt: "backpack" }],
    };
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator(inventory);
      return true;
    });

    undoTransferStackQuantity({
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      destinationRowId: "dest-1",
      amount: 5,
    });

    expect(inventory.coins).toHaveLength(0);
  });

  test("decrements without removing a row that existed before the transfer (merge case)", () => {
    const inventory = {
      coins: [{ id: "dest-1", coin_type: "gold", quantity: 15, storedAt: "backpack" }],
    };
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator(inventory);
      return true;
    });

    undoTransferStackQuantity({
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "coins",
      destinationRowId: "dest-1",
      amount: 5,
    });

    expect(inventory.coins).toHaveLength(1);
    expect(inventory.coins[0].quantity).toBe(10);
  });
});
