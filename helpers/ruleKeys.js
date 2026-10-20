// The rows that rules in code refer to, named by stable key instead of id. Renumbering or reordering a
// dataset therefore needs no edit here, only keeping these keys on the rows they name.
const { loadDataset } = require("./datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("./datasetColumns.js");

// The highest registered tier of a group wins; keys are `<prefix>-<tier>` for tier 1..tiers.
const TIER_GROUPS = {
  WILL_BONUS_TIERS: {
    dataset: "ADVANTAGES",
    prefix: "forca-de-vontade",
    tiers: 5,
  },
  WILL_PENALTY_TIERS: { dataset: "DISADVANTAGES", prefix: "vontade", tiers: 5 },
  HEARING_BONUS_TIERS: {
    dataset: "ADVANTAGES",
    prefix: "ouvido-agucado",
    tiers: 5,
  },
  SMELL_BONUS_TIERS: {
    dataset: "ADVANTAGES",
    prefix: "paladar-olfato-apurados",
    tiers: 5,
  },
  VISION_BONUS_TIERS: {
    dataset: "ADVANTAGES",
    prefix: "visao-agucada",
    tiers: 5,
  },
  FULL_SENSE_BONUS_TIERS: {
    dataset: "ADVANTAGES",
    prefix: "prontidao",
    tiers: 5,
  },
  MAGIC_APTITUDE_TIERS: {
    dataset: "ADVANTAGES",
    prefix: "aptidao-magica",
    tiers: 3,
  },
};

const SINGLE_KEYS = {
  REFLEXOS_EM_COMBATE_ID: ["ADVANTAGES", "reflexos-em-combate"],
  BROQUEL_SKILL_ID: ["SKILLS", "broquel"],
  ESCUDO_SKILL_ID: ["SKILLS", "escudo"],
  MAGIC_RETURN_ENCHANTMENT_ID: ["ENCHANTMENTS", "retorno-magico"],
};

const BROQUEL_SHIELD_KEY_PREFIX = "broquel-";

// Traits that exempt a condition; a key with no row is pending, not missing, because the trait tables are being rebuilt.
const IMMUNITY_TRAIT_KEYS = [
  ["ADVANTAGES", "nao-respira"],
  ["DISADVANTAGES", "estraga-prazeres"],
  ["ADVANTAGES", "tolerancia-a-ferimentos-difuso"],
  ["ADVANTAGES", "tolerancia-a-ferimentos-homogeneo"],
  ["ADVANTAGES", "tolerancia-a-ferimentos-sem-vitais"],
];

function idsByKey(dataset) {
  return new Map(
    loadDataset(dataset).map((row) => [
      row[KEY_COLUMN[dataset]],
      row[ID_COLUMN[dataset]],
    ]),
  );
}

// Resolves every rule against the datasets in the current working directory. `missing` lists keys the
// code depends on that no row has; `unregistered` lists tier keys the data has beyond the registered count.
function resolveRuleKeys() {
  const cache = {};
  const idsOf = (dataset) => (cache[dataset] ??= idsByKey(dataset));
  const missing = [];
  const unregistered = [];

  const tierGroups = {};
  Object.entries(TIER_GROUPS).forEach(([name, { dataset, prefix, tiers }]) => {
    tierGroups[name] = {};
    for (let tier = 1; tier <= tiers; tier += 1) {
      const key = `${prefix}-${tier}`;
      const id = idsOf(dataset).get(key);
      if (id) tierGroups[name][id] = tier;
      else missing.push({ dataset, key });
    }
    const shape = new RegExp(`^${prefix}-(\\d+)$`);
    [...idsOf(dataset).keys()].forEach((key) => {
      const match = shape.exec(key);
      if (match && Number(match[1]) > tiers)
        unregistered.push({ dataset, key });
    });
  });

  const singles = {};
  Object.entries(SINGLE_KEYS).forEach(([name, [dataset, key]]) => {
    const id = idsOf(dataset).get(key);
    if (id) singles[name] = id;
    else missing.push({ dataset, key });
  });

  const immunityTraitIds = {};
  const pendingImmunityKeys = [];
  IMMUNITY_TRAIT_KEYS.forEach(([dataset, key]) => {
    const id = idsOf(dataset).get(key);
    if (id) immunityTraitIds[key] = id;
    else pendingImmunityKeys.push(key);
  });

  const broquelShieldIds = loadDataset("SHIELDS")
    .filter((row) => row.shield_key.startsWith(BROQUEL_SHIELD_KEY_PREFIX))
    .map((row) => row.shield_id);

  const rangedByKey = idsOf("RANGED_WEAPONS");
  const dualUsePairs = loadDataset("MELEE_WEAPONS")
    .filter((row) => rangedByKey.has(row.weapon_key))
    .map((row) => [row.weapon_id, rangedByKey.get(row.weapon_key)]);

  return {
    tierGroups,
    singles,
    immunityTraitIds,
    pendingImmunityKeys,
    broquelShieldIds,
    dualUsePairs,
    missing,
    unregistered,
  };
}

module.exports = {
  TIER_GROUPS,
  SINGLE_KEYS,
  BROQUEL_SHIELD_KEY_PREFIX,
  IMMUNITY_TRAIT_KEYS,
  resolveRuleKeys,
};
