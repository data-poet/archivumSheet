import {
  installMockFetch,
  mockFetchResponse,
} from "tests/dev/helpers/mockFetch.js";
import {
  listAllies,
  getAlly,
  clearAllyCache,
  isRepoAlly,
  isEditableAlly,
} from "dev/public/js/allies/catalog.js";

const INDEX = [
  { ally_id: "ALLY_HUMANOID_001", name: "Bran", race: "Humano", portrait: "" },
  { ally_id: "ALLY_HUMANOID_002", name: "Lyra", race: "Elfo", portrait: "" },
];

const FULL = { ally_id: "ALLY_HUMANOID_001", pc: { character_name: "Bran" } };

beforeEach(() => {
  installMockFetch();
  clearAllyCache();
});

describe("listAllies", () => {
  test("fetches the index once and serves the cache afterwards", async () => {
    mockFetchResponse("/api/allies", INDEX);

    expect(await listAllies()).toEqual(INDEX);
    expect(await listAllies()).toEqual(INDEX);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("refresh: true re-fetches", async () => {
    mockFetchResponse("/api/allies", INDEX);

    await listAllies();
    await listAllies({ refresh: true });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("getAlly", () => {
  test("fetches a full payload once per id", async () => {
    mockFetchResponse("/api/allies/ALLY_HUMANOID_001", FULL);

    expect(await getAlly("ALLY_HUMANOID_001")).toEqual(FULL);
    expect(await getAlly("ALLY_HUMANOID_001")).toEqual(FULL);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("returns null for a missing id without hitting the network", async () => {
    expect(await getAlly("")).toBeNull();
    expect(await getAlly(undefined)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("encodes the id into the URL", async () => {
    mockFetchResponse("/api/allies/a%2Fb", FULL);

    await getAlly("a/b");

    expect(global.fetch).toHaveBeenCalledWith("/api/allies/a%2Fb");
  });

  test("clearAllyCache forces the next call back to the network", async () => {
    mockFetchResponse("/api/allies/ALLY_HUMANOID_001", FULL);

    await getAlly("ALLY_HUMANOID_001");
    clearAllyCache();
    await getAlly("ALLY_HUMANOID_001");

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

// Namespaced ids are what let a merged repo + user catalog stay collision-free later,
// and what tells a caller whether an ally's sheet itself may be edited.
describe("id namespacing", () => {
  test("ALLY_* is a repo ally and is not editable", () => {
    expect(isRepoAlly("ALLY_HUMANOID_001")).toBe(true);
    expect(isEditableAlly("ALLY_HUMANOID_001")).toBe(false);
  });

  test("a store-generated id is user-authored and editable", () => {
    const id = "ally-1726669200000-a1b2c";
    expect(isRepoAlly(id)).toBe(false);
    expect(isEditableAlly(id)).toBe(true);
  });

  test("an absent id is treated as non-repo", () => {
    expect(isRepoAlly(undefined)).toBe(false);
    expect(isRepoAlly("")).toBe(false);
  });
});
