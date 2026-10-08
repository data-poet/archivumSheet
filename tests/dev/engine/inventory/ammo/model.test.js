jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);
jest.mock("dev/public/js/store/characters.js", () => ({
  withCharacterInventory: jest.fn(),
}));

import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import { withCharacterInventory } from "dev/public/js/store/characters.js";
import {
  addLooseAmmo,
  moveLooseAmmo,
  sendContainerToAlly,
  sendLooseAmmoToAlly,
} from "dev/public/js/engine/inventory/ammo/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.loose_ammo = [];
});

function findEntry(ammoId, storedAt) {
  return state.selected.loose_ammo.find(
    (a) => a.ammo_id === ammoId && a.storedAt === storedAt,
  );
}

describe("addLooseAmmo", () => {
  test("creates a new row with its own id", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");

    const entry = findEntry("ARROW-1", "backpack");
    expect(entry.quantity).toBe(20);
    expect(typeof entry.id).toBe("string");
  });

  test("merging into an existing stack bumps quantity and keeps the same id", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");
    const originalId = findEntry("ARROW-1", "backpack").id;

    addLooseAmmo("ARROW-1", 5, "backpack");

    const entry = findEntry("ARROW-1", "backpack");
    expect(entry.quantity).toBe(25);
    expect(entry.id).toBe(originalId);
  });
});

describe("moveLooseAmmo", () => {
  test("carries the source row's id over when there is no destination stack", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");
    const originalId = findEntry("ARROW-1", "backpack").id;

    moveLooseAmmo("ARROW-1", "backpack", "stash");

    expect(findEntry("ARROW-1", "backpack")).toBeUndefined();
    expect(findEntry("ARROW-1", "stash").id).toBe(originalId);
  });

  test("merging into an existing destination stack keeps the destination's id", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");
    addLooseAmmo("ARROW-1", 6, "stash");
    const destId = findEntry("ARROW-1", "stash").id;

    moveLooseAmmo("ARROW-1", "backpack", "stash");

    const dest = findEntry("ARROW-1", "stash");
    expect(dest.quantity).toBe(26);
    expect(dest.id).toBe(destId);
    expect(findEntry("ARROW-1", "backpack")).toBeUndefined();
  });
});

describe("sendContainerToAlly", () => {
  beforeEach(() => {
    state.selected.ammo_containers = [
      {
        id: "container-1",
        container_id: "BOX-1",
        storedAt: "backpack",
        contents: [{ ammo_id: "ARROW-1", quantity: 10 }],
      },
    ];
  });

  test("moves the container and its contents to the destination, and removes it from the source", () => {
    let destinationContainers;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationContainers = [];
      mutator({ ammo_containers: destinationContainers });
      return true;
    });

    const ok = sendContainerToAlly("container-1", "ally-1", "stash");

    expect(ok).toBe(true);
    expect(state.selected.ammo_containers).toHaveLength(0);
    expect(destinationContainers).toHaveLength(1);
    expect(destinationContainers[0]).toMatchObject({
      container_id: "BOX-1",
      storedAt: "stash",
      contents: [{ ammo_id: "ARROW-1", quantity: 10 }],
    });
    expect(destinationContainers[0].id).not.toBe("container-1");
  });

  test("moves an empty container without contents", () => {
    state.selected.ammo_containers[0].contents = [];
    let destinationContainers;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationContainers = [];
      mutator({ ammo_containers: destinationContainers });
      return true;
    });

    const ok = sendContainerToAlly("container-1", "ally-1");

    expect(ok).toBe(true);
    expect(destinationContainers[0].contents).toEqual([]);
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendContainerToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.ammo_containers).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendContainerToAlly("container-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.ammo_containers).toHaveLength(1);
  });
});

describe("sendLooseAmmoToAlly", () => {
  beforeEach(() => {
    addLooseAmmo("ARROW-1", 20, "backpack");
  });

  test("sends a partial amount, decrementing the source row", () => {
    const instanceId = findEntry("ARROW-1", "backpack").id;
    let destinationAmmo;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationAmmo = [];
      mutator({ loose_ammo: destinationAmmo });
      return true;
    });

    const ok = sendLooseAmmoToAlly(instanceId, "ally-1", 5, "backpack");

    expect(ok).toBe(true);
    expect(findEntry("ARROW-1", "backpack").quantity).toBe(15);
    expect(destinationAmmo[0]).toMatchObject({ ammo_id: "ARROW-1", quantity: 5 });
  });

  test("removes the source row entirely on a full send", () => {
    const instanceId = findEntry("ARROW-1", "backpack").id;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator({ loose_ammo: [] });
      return true;
    });

    const ok = sendLooseAmmoToAlly(instanceId, "ally-1", 20, "backpack");

    expect(ok).toBe(true);
    expect(findEntry("ARROW-1", "backpack")).toBeUndefined();
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendLooseAmmoToAlly("ghost", "ally-1", 5);

    expect(ok).toBe(false);
    expect(findEntry("ARROW-1", "backpack").quantity).toBe(20);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    const instanceId = findEntry("ARROW-1", "backpack").id;
    withCharacterInventory.mockReturnValue(false);

    const ok = sendLooseAmmoToAlly(instanceId, "does-not-exist", 5);

    expect(ok).toBe(false);
    expect(findEntry("ARROW-1", "backpack").quantity).toBe(20);
  });
});
