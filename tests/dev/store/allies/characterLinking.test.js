jest.mock("dev/public/js/ui.js", () => ({
  renderListsPreserving: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/races/model.js", () => ({
  restoreRaceSelection: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/portrait/portrait.js", () => ({
  renderCharacterImage: jest.fn(),
  renderResumeImage: jest.fn(),
}));
jest.mock("dev/public/js/allies/catalog.js", () => ({
  getAlly: jest.fn(),
}));

import { getStore } from "dev/public/js/store/characters.js";
import { getAlly } from "dev/public/js/allies/catalog.js";
import {
  listCharactersGrouped,
  getAllyOwnerId,
  linkAllyToCharacter,
  unlinkAlly,
  getLinkedAllies,
  recreateLinkedAllies,
  forkAndLinkAllyToCharacter,
} from "dev/public/js/store/allies/characterLinking.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const STORAGE_KEY = "archivum_characters";

beforeEach(() => {
  localStorage.clear();
  resetDOM();
  resetState();
  jest.clearAllMocks();
});

function seedStore(list, activeId = list[0].id) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeId, list }));
}

describe("listCharactersGrouped", () => {
  test("nests a forked local ally right after the PC whose roster still points at it", () => {
    seedStore([
      {
        id: "pc-1",
        name: "Aria",
        race: "",
        kind: "character",
        data: { character: { allies: [{ _instanceId: "ai-1", ally_id: "c-ally-1" }] } },
      },
      {
        id: "c-ally-1",
        name: "Fido",
        race: "",
        kind: "ally",
        data: { character: {} },
      },
      { id: "pc-2", name: "Borin", race: "", kind: "character", data: { character: {} } },
    ]);

    expect(listCharactersGrouped()).toEqual([
      { id: "pc-1", name: "Aria", race: "", kind: "character", indented: false },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", indented: true },
      { id: "pc-2", name: "Borin", race: "", kind: "character", indented: false },
    ]);
  });

  test("leaves an ally un-indented once no PC's roster references it anymore", () => {
    seedStore([
      { id: "pc-1", name: "Aria", race: "", kind: "character", data: { character: { allies: [] } } },
      {
        id: "c-ally-1",
        name: "Fido",
        race: "",
        kind: "ally",
        data: { character: {} },
      },
    ]);

    expect(listCharactersGrouped()).toEqual([
      { id: "pc-1", name: "Aria", race: "", kind: "character", indented: false },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", indented: false },
    ]);
  });
});

describe("ally linking", () => {
  test("linkAllyToCharacter pushes an ordinary roster entry onto the target", () => {
    seedStore([
      { id: "pc-1", name: "Aria", race: "", kind: "character", data: { character: { allies: [] } } },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", data: { character: {} } },
    ]);

    linkAllyToCharacter("c-ally-1", "pc-1");

    const roster = getStore().list.find((c) => c.id === "pc-1").data.character.allies;
    expect(roster).toEqual([
      { _instanceId: expect.any(String), ally_id: "c-ally-1", overrides: {} },
    ]);
    expect(getAllyOwnerId("c-ally-1")).toBe("pc-1");
  });

  test("refuses to link when the target is itself an ally (decision #24)", () => {
    seedStore([
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", data: { character: {} } },
      { id: "c-ally-2", name: "Rex", race: "", kind: "ally", data: { character: { allies: [] } } },
    ]);

    linkAllyToCharacter("c-ally-1", "c-ally-2");

    expect(getAllyOwnerId("c-ally-1")).toBeNull();
  });

  test("re-linking to a different character moves the roster entry rather than duplicating it", () => {
    seedStore([
      { id: "pc-1", name: "Aria", race: "", kind: "character", data: { character: { allies: [] } } },
      { id: "pc-2", name: "Borin", race: "", kind: "character", data: { character: { allies: [] } } },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", data: { character: {} } },
    ]);

    linkAllyToCharacter("c-ally-1", "pc-1");
    linkAllyToCharacter("c-ally-1", "pc-2");

    expect(getStore().list.find((c) => c.id === "pc-1").data.character.allies).toEqual([]);
    expect(
      getStore().list.find((c) => c.id === "pc-2").data.character.allies,
    ).toHaveLength(1);
    expect(getAllyOwnerId("c-ally-1")).toBe("pc-2");
  });

  test("unlinkAlly orphans the ally rather than deleting it (decision #21)", () => {
    seedStore([
      {
        id: "pc-1",
        name: "Aria",
        race: "",
        kind: "character",
        data: {
          character: {
            allies: [{ _instanceId: "ai-1", ally_id: "c-ally-1", overrides: {} }],
            alliesActiveId: "ai-1",
          },
        },
      },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", data: { character: {} } },
    ]);

    unlinkAlly("c-ally-1");

    const pc = getStore().list.find((c) => c.id === "pc-1");
    expect(pc.data.character.allies).toEqual([]);
    expect(pc.data.character.alliesActiveId).toBeNull();
    expect(getStore().list.some((c) => c.id === "c-ally-1")).toBe(true);
  });

  test("unlinkAlly is a no-op when the ally isn't currently linked", () => {
    seedStore([
      { id: "pc-1", name: "Aria", race: "", kind: "character", data: { character: { allies: [] } } },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", data: { character: {} } },
    ]);

    expect(() => unlinkAlly("c-ally-1")).not.toThrow();
  });

  test("getLinkedAllies excludes repo-catalog roster entries", () => {
    seedStore([
      {
        id: "pc-1",
        name: "Aria",
        race: "",
        kind: "character",
        data: {
          character: {
            allies: [
              { _instanceId: "ai-1", ally_id: "c-ally-1", overrides: {} },
              { _instanceId: "ai-2", ally_id: "ALLY_WOLF", overrides: {} },
            ],
          },
        },
      },
      { id: "c-ally-1", name: "Fido", race: "", kind: "ally", data: { character: {} } },
    ]);

    expect(getLinkedAllies("pc-1")).toEqual([
      { _instanceId: "ai-1", ally_id: "c-ally-1", overrides: {} },
    ]);
  });

  test("recreateLinkedAllies creates fresh local entries and remaps the roster", () => {
    seedStore([
      {
        id: "pc-1",
        name: "Aria",
        race: "",
        kind: "character",
        data: {
          character: {
            allies: [{ _instanceId: "ai-1", ally_id: "old-ally-id", overrides: {} }],
          },
        },
      },
    ]);

    recreateLinkedAllies(
      { "old-ally-id": { pc: { character_name: "Fido" }, race: {}, character: {}, inventory: {} } },
      "pc-1",
    );

    const store = getStore();
    const roster = store.list.find((c) => c.id === "pc-1").data.character.allies;
    expect(roster).toHaveLength(1);
    expect(roster[0].ally_id).not.toBe("old-ally-id");

    const newAlly = store.list.find((c) => c.id === roster[0].ally_id);
    expect(newAlly.kind).toBe("ally");
    expect(newAlly.name).toBe("Fido");
  });

  describe("forkAndLinkAllyToCharacter", () => {
    test("forks a catalog ally into a new local entry and links it under the owner", async () => {
      seedStore([
        { id: "pc-1", name: "Aria", race: "", kind: "character", data: { character: { allies: [] } } },
      ]);
      getAlly.mockResolvedValue({
        version: 1,
        pc: { character_name: "Wolf" },
        race: { race_name: "Beast" },
        character: {},
        inventory: {},
      });

      const newId = await forkAndLinkAllyToCharacter("ALLY_WOLF", "pc-1");

      expect(newId).toEqual(expect.any(String));
      const store = getStore();
      const newAlly = store.list.find((c) => c.id === newId);
      expect(newAlly.kind).toBe("ally");
      expect(newAlly.name).toBe("Wolf");

      const roster = store.list.find((c) => c.id === "pc-1").data.character.allies;
      expect(roster).toEqual([
        { _instanceId: expect.any(String), ally_id: newId, overrides: {} },
      ]);
      expect(getAllyOwnerId(newId)).toBe("pc-1");
    });

    test("returns null when the ally id doesn't resolve", async () => {
      seedStore([
        { id: "pc-1", name: "Aria", race: "", kind: "character", data: { character: { allies: [] } } },
      ]);
      getAlly.mockResolvedValue(null);

      const newId = await forkAndLinkAllyToCharacter("ALLY_MISSING", "pc-1");

      expect(newId).toBeNull();
      expect(getStore().list).toHaveLength(1);
    });
  });
});
