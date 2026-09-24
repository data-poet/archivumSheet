jest.mock("dev/public/js/allies/catalog.js", () => ({
  isRepoAlly: (id) => /^ALLY_/.test(id ?? ""),
  getAlly: jest.fn(),
}));

import { getAlly as getRepoAllyMock } from "dev/public/js/allies/catalog.js";
import {
  getActiveCharacterDisplay,
  getRoster,
  addRosterEntry,
  removeRosterEntry,
  getActiveAllyInstanceId,
  setActiveAllyInstanceId,
  patchOverride,
  resolveAlly,
  forkAllyToLocal,
  pruneOrphanedAllies,
} from "dev/public/js/store/allies/allies.js";

const STORAGE_KEY = "archivum_characters";

function seedStore(characterOverrides = {}) {
  const store = {
    activeId: "c-1",
    list: [
      {
        id: "c-1",
        name: "Hero",
        race: "",
        kind: "character",
        data: {
          character: { allies: [], alliesActiveId: null, ...characterOverrides },
        },
      },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("getActiveCharacterDisplay", () => {
  test("returns blank when there is no store yet", () => {
    expect(getActiveCharacterDisplay()).toEqual({ name: "", kind: "character" });
  });

  test("returns the active entry's name and kind", () => {
    seedStore();
    expect(getActiveCharacterDisplay()).toEqual({ name: "Hero", kind: "character" });
  });
});

describe("roster CRUD", () => {
  test("starts empty", () => {
    seedStore();
    expect(getRoster()).toEqual([]);
  });

  test("addRosterEntry adds a repo ally with an instance id and empty overrides", () => {
    seedStore();
    const instanceId = addRosterEntry("ALLY_HUMANOID_001");

    expect(instanceId).toEqual(expect.any(String));
    expect(getRoster()).toEqual([
      { _instanceId: instanceId, ally_id: "ALLY_HUMANOID_001", overrides: {} },
    ]);
  });

  test("addRosterEntry rejects a local ally id", () => {
    seedStore();
    expect(addRosterEntry("c-123-abcde")).toBeNull();
    expect(getRoster()).toEqual([]);
  });

  test("removeRosterEntry removes only the matching entry", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");
    const b = addRosterEntry("ALLY_ANIMAL_001");

    removeRosterEntry(a);

    expect(getRoster().map((e) => e._instanceId)).toEqual([b]);
  });

  test("removeRosterEntry clears the active instance id if it pointed at the removed entry", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");
    setActiveAllyInstanceId(a);

    removeRosterEntry(a);

    expect(getActiveAllyInstanceId()).toBeNull();
  });

  test("removeRosterEntry leaves the active instance id alone otherwise", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");
    const b = addRosterEntry("ALLY_ANIMAL_001");
    setActiveAllyInstanceId(b);

    removeRosterEntry(a);

    expect(getActiveAllyInstanceId()).toBe(b);
  });
});

describe("active ally instance id", () => {
  test("defaults to null", () => {
    seedStore();
    expect(getActiveAllyInstanceId()).toBeNull();
  });

  test("round-trips", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");

    setActiveAllyInstanceId(a);

    expect(getActiveAllyInstanceId()).toBe(a);
  });
});

describe("patchOverride", () => {
  test("sets a nested path into overrides for a repo ally entry", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");

    patchOverride(a, "primary.ST.modifier", 2);

    expect(getRoster()[0].overrides).toEqual({ primary: { ST: { modifier: 2 } } });
  });

  test("accumulates separate paths without clobbering each other", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");
    patchOverride(a, "primary.ST.modifier", 2);

    patchOverride(a, "secondary.HP.modifier", -3);

    expect(getRoster()[0].overrides).toEqual({
      primary: { ST: { modifier: 2 } },
      secondary: { HP: { modifier: -3 } },
    });
  });

  test("is a no-op on a local ally's roster entry", () => {
    seedStore({
      allies: [{ _instanceId: "ai-1", ally_id: "c-9-local" }],
    });

    patchOverride("ai-1", "primary.ST.modifier", 2);

    expect(getRoster()[0].overrides).toBeUndefined();
  });
});

describe("resolveAlly", () => {
  test("repo ids resolve through allies/catalog.js", async () => {
    getRepoAllyMock.mockResolvedValue({ ally_id: "ALLY_HUMANOID_001", pc: {} });

    const resolved = await resolveAlly("ALLY_HUMANOID_001");

    expect(getRepoAllyMock).toHaveBeenCalledWith("ALLY_HUMANOID_001");
    expect(resolved).toEqual({ ally_id: "ALLY_HUMANOID_001", pc: {} });
  });

  test("local ids resolve from the character store", async () => {
    const store = {
      activeId: "c-1",
      list: [
        {
          id: "c-1",
          name: "Hero",
          kind: "character",
          data: { character: { allies: [] } },
        },
        {
          id: "c-9-local",
          name: "Forked Ally",
          kind: "ally",
          data: { pc: { character_name: "Forked Ally" } },
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    const resolved = await resolveAlly("c-9-local");

    expect(resolved).toEqual({
      ally_id: "c-9-local",
      pc: { character_name: "Forked Ally" },
    });
  });

  test("returns null for an unknown local id", async () => {
    seedStore();
    expect(await resolveAlly("c-does-not-exist")).toBeNull();
  });
});

describe("forkAllyToLocal", () => {
  test("bakes catalog + overrides into a new local entry and rewrites the roster entry", async () => {
    getRepoAllyMock.mockResolvedValue({
      ally_id: "ALLY_HUMANOID_001",
      version: 1,
      pc: { character_name: "Bran" },
      race: { race_name: "Human" },
      character: { primary: { ST: { modifier: 0 } }, secondary: {} },
      inventory: { items: [] },
    });
    seedStore();
    const instanceId = addRosterEntry("ALLY_HUMANOID_001");
    patchOverride(instanceId, "primary.ST.modifier", 2);

    const localId = await forkAllyToLocal(instanceId);

    expect(localId).toEqual(expect.any(String));
    expect(getRoster()).toEqual([{ _instanceId: instanceId, ally_id: localId }]);

    const resolved = await resolveAlly(localId);
    expect(resolved).toEqual({
      ally_id: localId,
      version: 1,
      pc: { character_name: "Bran" },
      race: { race_name: "Human" },
      character: { primary: { ST: { modifier: 2 } }, secondary: {} },
      inventory: { items: [] },
    });
  });

  test("returns null for an already-local roster entry, leaving it untouched", async () => {
    seedStore({
      allies: [{ _instanceId: "ai-1", ally_id: "c-9-local" }],
    });

    expect(await forkAllyToLocal("ai-1")).toBeNull();
    expect(getRoster()).toEqual([{ _instanceId: "ai-1", ally_id: "c-9-local" }]);
  });

  test("returns null for an unknown instance id", async () => {
    seedStore();
    expect(await forkAllyToLocal("ai-does-not-exist")).toBeNull();
  });
});

describe("pruneOrphanedAllies", () => {
  test("drops a local roster entry whose backing character was deleted", () => {
    seedStore({
      allies: [{ _instanceId: "ai-1", ally_id: "c-9-local" }],
      alliesActiveId: "ai-1",
    });

    pruneOrphanedAllies();

    expect(getRoster()).toEqual([]);
    expect(getActiveAllyInstanceId()).toBeNull();
  });

  test("leaves a local entry alone when its backing character still exists", () => {
    const store = {
      activeId: "c-1",
      list: [
        {
          id: "c-1",
          name: "Hero",
          kind: "character",
          data: {
            character: {
              allies: [{ _instanceId: "ai-1", ally_id: "c-9-local" }],
              alliesActiveId: "ai-1",
            },
          },
        },
        { id: "c-9-local", name: "Forked Ally", kind: "ally", data: {} },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    pruneOrphanedAllies();

    expect(getRoster()).toEqual([{ _instanceId: "ai-1", ally_id: "c-9-local" }]);
    expect(getActiveAllyInstanceId()).toBe("ai-1");
  });

  test("leaves repo entries alone regardless of the character list", () => {
    seedStore();
    const a = addRosterEntry("ALLY_HUMANOID_001");
    setActiveAllyInstanceId(a);

    pruneOrphanedAllies();

    expect(getRoster()).toEqual([
      { _instanceId: a, ally_id: "ALLY_HUMANOID_001", overrides: {} },
    ]);
    expect(getActiveAllyInstanceId()).toBe(a);
  });

  test("only clears the active id if it pointed at the pruned entry", () => {
    seedStore({
      allies: [
        { _instanceId: "ai-1", ally_id: "c-9-local" },
        { _instanceId: "ai-2", ally_id: "ALLY_HUMANOID_001", overrides: {} },
      ],
      alliesActiveId: "ai-2",
    });

    pruneOrphanedAllies();

    expect(getRoster()).toEqual([
      { _instanceId: "ai-2", ally_id: "ALLY_HUMANOID_001", overrides: {} },
    ]);
    expect(getActiveAllyInstanceId()).toBe("ai-2");
  });
});
