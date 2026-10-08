jest.mock("dev/public/js/store/characters.js", () => ({
  withCharacterInventory: jest.fn(),
}));

import { withCharacterInventory } from "dev/public/js/store/characters.js";
import { transferInstance } from "dev/public/js/engine/inventory/shared/transfer.js";

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

    const ok = transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
      destinationStoredAt: "backpack",
    });

    expect(ok).toBe(true);
    expect(sourceArray.map((a) => a.id)).toEqual(["armor-2"]);
    expect(destinationArmors).toHaveLength(1);
    expect(destinationArmors[0]).toMatchObject({
      armor_id: "ARM-1",
      is_equipped: false,
      storedAt: "backpack",
    });
    expect(destinationArmors[0].id).not.toBe("armor-1");
    expect(withCharacterInventory).toHaveBeenCalledWith(
      "ally-1",
      expect.any(Function),
    );
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const sourceArray = makeSource();

    const ok = transferInstance({
      sourceArray,
      instanceId: "ghost",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
    });

    expect(ok).toBe(false);
    expect(sourceArray).toHaveLength(2);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("returns false without mutating the source when canReceive rejects", () => {
    const sourceArray = makeSource();

    const ok = transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "ally-1",
      destinationInventoryKey: "armors",
      canReceive: () => false,
    });

    expect(ok).toBe(false);
    expect(sourceArray).toHaveLength(2);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source instance in place when the destination write fails", () => {
    const sourceArray = makeSource();
    withCharacterInventory.mockReturnValue(false);

    const ok = transferInstance({
      sourceArray,
      instanceId: "armor-1",
      destinationCharacterId: "does-not-exist",
      destinationInventoryKey: "armors",
    });

    expect(ok).toBe(false);
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
});
