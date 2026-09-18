const path = require("path");
const {
  getAlly,
  listAllies,
  ALLIES_DIR,
} = require("../../../helpers/alliesCatalog.js");
const { buildSheet } = require("../../../engine/buildSheet.js");

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
});

describe("getAlly", () => {
  test("returns the full payload with its id attached", () => {
    const ally = getAlly("ALLY-000");

    expect(ally.ally_id).toBe("ALLY-000");
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

// The premise of the whole feature: an ally is a character, so the shipped payload must
// run through the unmodified engine. If this breaks, the catalog shape has drifted.
describe("a catalog ally builds through the engine", () => {
  function toEnginePayload(ally) {
    const c = ally.character;
    const inv = ally.inventory;

    return {
      pc: ally.pc,
      race: ally.race,
      character: {
        advantages: Object.keys(c.advantages),
        disadvantages: Object.keys(c.disadvantages),
        primaryAttributes: c.primary,
        secondaryAttributes: {
          ...c.secondary,
          damage: c.damage,
          elementalResistances: c.resistances,
        },
        skills: Object.entries(c.skills).map(([skill_id, d]) => ({
          skill_id,
          base_value: d.base_value,
          modifier: d.modifier,
          isTrainedWithMaster: d.isTrainedWithMaster,
        })),
        spells: c.spells,
      },
      inventory: {
        weight: inv.weight,
        armor: inv.armors,
        shield: inv.shields,
        melee: inv.melee_weapons,
        ranged: inv.ranged_weapons,
        firearms: inv.firearms,
        ammo_containers: inv.ammo_containers,
        loose_ammo: inv.loose_ammo,
        alchemy: inv.alchemy,
        survival_gear: inv.survivalGear,
        accessories: inv.accessories,
        magic_gear: inv.magicGear,
        custom_inventory: inv.customInventory,
        coins: inv.coins,
      },
    };
  }

  test.each(listAllies().map((e) => e.ally_id))(
    "%s produces resolved attributes, skills and equipment",
    (allyId) => {
      const sheet = buildSheet(toEnginePayload(getAlly(allyId)));

      expect(sheet.character.primary_attributes.ST.value).toBeGreaterThan(0);
      expect(sheet.character.secondary_attributes.HP.value).toBeGreaterThan(0);
      expect(sheet.inventory.carry_weight).toBeDefined();
      expect(sheet.character.advantages).toBeDefined();
    },
  );

  test("race innate traits are applied on top of the ally's own", () => {
    const ally = getAlly("ALLY-000");
    const sheet = buildSheet(toEnginePayload(ally));

    const own = Object.keys(ally.character.advantages).length;
    expect(Object.keys(sheet.character.advantages).length).toBe(
      own + ally.race.innate_advantage_ids.length,
    );
  });
});
