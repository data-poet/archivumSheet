jest.mock("dev/public/js/allies/catalog.js", () => ({
  isRepoAlly: (id) => /^ALLY_/.test(id ?? ""),
}));

import {
  getRoster,
  getActiveAllyInstanceId,
  patchOverride,
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

describe("getRoster", () => {
  test("starts empty", () => {
    seedStore();
    expect(getRoster()).toEqual([]);
  });

  test("returns whatever roster entries the active character has", () => {
    seedStore({
      allies: [{ _instanceId: "ai-1", ally_id: "ALLY_HUMANOID_001", overrides: {} }],
    });

    expect(getRoster()).toEqual([
      { _instanceId: "ai-1", ally_id: "ALLY_HUMANOID_001", overrides: {} },
    ]);
  });
});

describe("getActiveAllyInstanceId", () => {
  test("defaults to null", () => {
    seedStore();
    expect(getActiveAllyInstanceId()).toBeNull();
  });

  test("reads whatever is currently set", () => {
    seedStore({ alliesActiveId: "ai-1" });
    expect(getActiveAllyInstanceId()).toBe("ai-1");
  });
});

describe("patchOverride", () => {
  test("sets a nested path into overrides for a repo ally entry", () => {
    seedStore({
      allies: [{ _instanceId: "ai-1", ally_id: "ALLY_HUMANOID_001", overrides: {} }],
    });

    patchOverride("ai-1", "primary.ST.modifier", 2);

    expect(getRoster()[0].overrides).toEqual({ primary: { ST: { modifier: 2 } } });
  });

  test("accumulates separate paths without clobbering each other", () => {
    seedStore({
      allies: [{ _instanceId: "ai-1", ally_id: "ALLY_HUMANOID_001", overrides: {} }],
    });

    patchOverride("ai-1", "primary.ST.modifier", 2);
    patchOverride("ai-1", "secondary.HP.modifier", -3);

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
