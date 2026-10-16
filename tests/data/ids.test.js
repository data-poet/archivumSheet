const { loadDataset } = require("helpers/datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("helpers/datasetColumns.js");
const {
  WILL_BONUS_TIERS,
  WILL_PENALTY_TIERS,
  HEARING_BONUS_TIERS,
  SMELL_BONUS_TIERS,
  VISION_BONUS_TIERS,
  FULL_SENSE_BONUS_TIERS,
  REFLEXOS_EM_COMBATE_ID,
  MAGIC_APTITUDE_TIERS,
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
  MAGIC_RETURN_ENCHANTMENT_ID,
  DUAL_USE_WEAPON_PAIRS,
} = require("helpers/ids.js");

// helpers/ids.js hardcodes ids, so a renumbered or reordered dataset can leave one pointing at a
// different row that still exists. Each id is checked against the stable key of the row it must be.
const keysById = {};
function keyOf(dataset, id) {
  keysById[dataset] ??= new Map(
    loadDataset(dataset).map((r) => [
      r[ID_COLUMN[dataset]],
      r[KEY_COLUMN[dataset]],
    ]),
  );
  return keysById[dataset].get(id);
}

const TIER_GROUPS = [
  ["WILL_BONUS_TIERS", WILL_BONUS_TIERS, "ADVANTAGES", "forca-de-vontade"],
  ["WILL_PENALTY_TIERS", WILL_PENALTY_TIERS, "DISADVANTAGES", "vontade"],
  ["HEARING_BONUS_TIERS", HEARING_BONUS_TIERS, "ADVANTAGES", "ouvido-agucado"],
  [
    "SMELL_BONUS_TIERS",
    SMELL_BONUS_TIERS,
    "ADVANTAGES",
    "paladar-olfato-apurados",
  ],
  ["VISION_BONUS_TIERS", VISION_BONUS_TIERS, "ADVANTAGES", "visao-agucada"],
  ["FULL_SENSE_BONUS_TIERS", FULL_SENSE_BONUS_TIERS, "ADVANTAGES", "prontidao"],
  [
    "MAGIC_APTITUDE_TIERS",
    MAGIC_APTITUDE_TIERS,
    "ADVANTAGES",
    "aptidao-magica",
  ],
];

describe.each(TIER_GROUPS)("%s", (_name, tiers, dataset, keyPrefix) => {
  test("registers every tier of the group once", () => {
    const dataTiers = loadDataset(dataset)
      .map((row) => row[KEY_COLUMN[dataset]])
      .filter((key) => new RegExp(`^${keyPrefix}-\\d+$`).test(key))
      .map((key) => Number(key.split("-").pop()))
      .sort();
    expect(Object.values(tiers).sort()).toEqual(dataTiers);
  });

  test.each(Object.entries(tiers))(
    "id %s is tier %i of the group",
    (id, tier) => {
      expect(keyOf(dataset, id)).toBe(`${keyPrefix}-${tier}`);
    },
  );
});

describe("single ids", () => {
  test.each([
    [
      "REFLEXOS_EM_COMBATE_ID",
      "ADVANTAGES",
      REFLEXOS_EM_COMBATE_ID,
      "reflexos-em-combate",
    ],
    ["BROQUEL_SKILL_ID", "SKILLS", BROQUEL_SKILL_ID, "broquel"],
    ["ESCUDO_SKILL_ID", "SKILLS", ESCUDO_SKILL_ID, "escudo"],
    [
      "MAGIC_RETURN_ENCHANTMENT_ID",
      "ENCHANTMENTS",
      MAGIC_RETURN_ENCHANTMENT_ID,
      "retorno-magico",
    ],
  ])("%s is the row keyed %s", (_name, dataset, id, expectedKey) => {
    expect(keyOf(dataset, id)).toBe(expectedKey);
  });

  test("the magic-return enchantment is still a special effect", () => {
    const row = loadDataset("ENCHANTMENTS").find(
      (r) => r.enchantment_id === MAGIC_RETURN_ENCHANTMENT_ID,
    );
    expect(row.enchantment_effect_type).toBe("special_effect");
  });
});

describe("BROQUEL_SHIELD_IDS", () => {
  test("is exactly the shields whose key is a broquel", () => {
    const broquels = loadDataset("SHIELDS")
      .filter((row) => row.shield_key.startsWith("broquel-"))
      .map((row) => row.shield_id);
    expect([...BROQUEL_SHIELD_IDS].sort()).toEqual(broquels.sort());
  });
});

describe("DUAL_USE_WEAPON_PAIRS", () => {
  const melee = loadDataset("MELEE_WEAPONS");
  const ranged = loadDataset("RANGED_WEAPONS");

  test.each(DUAL_USE_WEAPON_PAIRS)(
    "%s and %s are the same weapon in both tables",
    (meleeId, rangedId) => {
      expect(keyOf("MELEE_WEAPONS", meleeId)).toBeDefined();
      expect(keyOf("MELEE_WEAPONS", meleeId)).toBe(
        keyOf("RANGED_WEAPONS", rangedId),
      );
    },
  );

  test("every weapon key present in both tables is registered as a pair", () => {
    const rangedKeys = new Set(ranged.map((row) => row.weapon_key));
    const sharedKeys = melee
      .map((row) => row.weapon_key)
      .filter((key) => rangedKeys.has(key));
    const registeredKeys = DUAL_USE_WEAPON_PAIRS.map(([meleeId]) =>
      keyOf("MELEE_WEAPONS", meleeId),
    );
    expect(registeredKeys.sort()).toEqual(sharedKeys.sort());
  });
});
