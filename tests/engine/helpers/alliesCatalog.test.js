const path = require("path");
const {
  getAlly,
  listAllies,
  ALLIES_DIR,
} = require("../../../helpers/alliesCatalog.js");

describe("listAllies", () => {
  test("returns one lightweight entry per ally file in data/allies/", () => {
    const list = listAllies();

    expect(list.length).toBeGreaterThan(0);
    list.forEach((entry) => {
      expect(Object.keys(entry).sort()).toEqual([
        "ally_id",
        "name",
        "portrait",
        "race",
        "subtype",
        "type",
      ]);
    });
  });

  test("carries no full payload — the picker must not pull whole sheets", () => {
    listAllies().forEach((entry) => {
      expect(entry.character).toBeUndefined();
      expect(entry.inventory).toBeUndefined();
    });
  });

  test("is sorted by id, so the picker order is stable across requests", () => {
    const ids = listAllies().map((e) => e.ally_id);
    expect(ids).toEqual([...ids].sort());
  });

  test("exposes the folder nesting as type and optional subtype", () => {
    const byId = Object.fromEntries(listAllies().map((e) => [e.ally_id, e]));

    expect(byId.ALLY_HUMANOID_001).toMatchObject({ type: "humanoids", subtype: null });
    expect(byId.ALLY_ANIMAL_001).toMatchObject({ type: "animals", subtype: null });
    expect(byId.ALLY_ANIMAL_MOUNT_001).toMatchObject({ type: "animals", subtype: "mounts" });
  });
});

describe("getAlly", () => {
  test("returns the full payload with its id attached", () => {
    const ally = getAlly("ALLY_HUMANOID_001");

    expect(ally.ally_id).toBe("ALLY_HUMANOID_001");
    expect(ally.type).toBe("humanoids");
    expect(ally.subtype).toBeNull();
    expect(ally.pc).toBeDefined();
    expect(ally.race).toBeDefined();
    expect(ally.character).toBeDefined();
    expect(ally.inventory).toBeDefined();
  });

  test("returns null for an unknown id rather than throwing", () => {
    expect(getAlly("ALLY-DOES-NOT-EXIST")).toBeNull();
  });

  test("returns null for an empty or missing id", () => {
    expect(getAlly("")).toBeNull();
    expect(getAlly(undefined)).toBeNull();
  });

  // allyId comes straight off the URL, so these must never resolve to a real file.
  test.each([
    "../package",
    "../../package",
    "..%2Fpackage",
    "foo/../../package",
    "/etc/passwd",
    "a.b",
  ])("rejects the traversal-shaped id %p", (id) => {
    expect(getAlly(id)).toBeNull();
  });

  test("resolves inside data/allies/ and nowhere else", () => {
    expect(path.basename(ALLIES_DIR)).toBe("allies");
    expect(path.basename(path.dirname(ALLIES_DIR))).toBe("data");
  });
});
