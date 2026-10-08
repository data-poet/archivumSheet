jest.mock("dev/public/js/store/characters.js", () => ({
  withCharacterInventory: jest.fn(),
}));

import { withCharacterInventory } from "dev/public/js/store/characters.js";
import {
  transferInstance,
  undoTransferInstance,
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
