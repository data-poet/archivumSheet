jest.mock("dev/public/js/allies/catalog.js", () => ({
  isRepoAlly: (id) => /^ALLY_/.test(id ?? ""),
  getAlly: jest.fn(),
}));

import {
  addRosterEntry,
  setActiveAllyInstanceId,
  getRoster,
} from "dev/public/js/store/allies/allies.js";
import { createAllyEditTarget } from "dev/public/js/allies/allyEditTarget.js";

const STORAGE_KEY = "archivum_characters";

function seedStore(list) {
  const store = { activeId: "c-1", list };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
}

function localAllyEntry(overrides = {}) {
  return {
    id: "c-9-local",
    name: "Forked Ally",
    kind: "ally",
    data: { character: { primary: {}, secondary: {}, ...overrides } },
  };
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("createAllyEditTarget — repo ally", () => {
  function seedActiveRepoAlly() {
    seedStore([
      { id: "c-1", name: "Hero", kind: "character", data: { character: { allies: [], alliesActiveId: null } } },
    ]);
    const instanceId = addRosterEntry("ALLY_HUMANOID_001");
    setActiveAllyInstanceId(instanceId);
    return instanceId;
  }

  test("setPrimaryModifier writes into the roster entry's overrides and calls onChange", () => {
    seedActiveRepoAlly();
    const onChange = jest.fn();
    const target = createAllyEditTarget(onChange);

    target.setPrimaryModifier("ST", 2);

    expect(getRoster()[0].overrides).toEqual({ primary: { ST: { modifier: 2 } } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("setSecondary writes into overrides and calls onChange", () => {
    seedActiveRepoAlly();
    const onChange = jest.fn();
    const target = createAllyEditTarget(onChange);

    target.setSecondary("HP", "modifier", -3);

    expect(getRoster()[0].overrides).toEqual({ secondary: { HP: { modifier: -3 } } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("ensureSecondary is a no-op for a repo ally (no local character to seed)", () => {
    seedActiveRepoAlly();
    const target = createAllyEditTarget(jest.fn());

    expect(() => target.ensureSecondary("HP")).not.toThrow();
    expect(getRoster()[0].overrides).toEqual({});
  });
});

describe("createAllyEditTarget — local/forked ally", () => {
  function seedActiveLocalAlly() {
    seedStore([
      {
        id: "c-1",
        name: "Hero",
        kind: "character",
        data: {
          character: {
            allies: [{ _instanceId: "ai-1", ally_id: "c-9-local", overrides: {} }],
            alliesActiveId: "ai-1",
          },
        },
      },
      localAllyEntry(),
    ]);
  }

  test("setPrimaryModifier mutates the local entry's character.primary directly", () => {
    seedActiveLocalAlly();
    const onChange = jest.fn();
    const target = createAllyEditTarget(onChange);

    target.setPrimaryModifier("ST", 3);

    const store = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const entry = store.list.find((e) => e.id === "c-9-local");
    expect(entry.data.character.primary.ST).toEqual({ modifier: 3 });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("ensureSecondary seeds a bought/modifier bucket on the local entry", () => {
    seedActiveLocalAlly();
    const target = createAllyEditTarget(jest.fn());

    target.ensureSecondary("HP");

    const store = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const entry = store.list.find((e) => e.id === "c-9-local");
    expect(entry.data.character.secondary.HP).toEqual({ bought: 0, modifier: 0 });
  });

  test("setSecondary ensures then writes the field on the local entry", () => {
    seedActiveLocalAlly();
    const onChange = jest.fn();
    const target = createAllyEditTarget(onChange);

    target.setSecondary("HP", "modifier", -2);

    const store = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const entry = store.list.find((e) => e.id === "c-9-local");
    expect(entry.data.character.secondary.HP).toEqual({ bought: 0, modifier: -2 });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("never writes into the roster entry's overrides for a local ally", () => {
    seedActiveLocalAlly();
    const target = createAllyEditTarget(jest.fn());

    target.setPrimaryModifier("ST", 3);

    expect(getRoster()[0].overrides).toEqual({});
  });
});

describe("createAllyEditTarget — no active ally", () => {
  test("all methods are safe no-ops", () => {
    seedStore([
      { id: "c-1", name: "Hero", kind: "character", data: { character: { allies: [], alliesActiveId: null } } },
    ]);
    const onChange = jest.fn();
    const target = createAllyEditTarget(onChange);

    expect(() => {
      target.setPrimaryModifier("ST", 2);
      target.ensureSecondary("HP");
      target.setSecondary("HP", "modifier", -3);
    }).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });
});
