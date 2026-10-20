const { loadDataset } = require("../../../../helpers/datasets.js");
const { ID_COLUMN } = require("../../../../helpers/datasetColumns.js");
const { toList, toNumberOrNull } = require("../../../../helpers/rowParsers.js");
const { CONDITION_RULES } = require("../../../../helpers/rules.js");
const {
  CONDITION_MODIFIER_COLUMNS,
} = require("../../../../helpers/taxonomy.js");
const { IMMUNITY_TRAIT_IDS } = require("../../../../helpers/ids.js");

const DEFENSE_ROLL = ["defense"];
const SELF_CONTROL_ROLL = ["self_control"];
const SENSE_ROLL = ["all_rolls", "Per"];

const TRAIT_NAME_COLUMNS = [
  ["ADVANTAGES", "advantage_name"],
  ["DISADVANTAGES", "disadvantage_name"],
];

// A DX or IQ roll matches the penalties on its own name; ST, HT and Will only match "all_rolls".
function attributeRollKinds(attribute) {
  return ["all_rolls", attribute];
}

function skillRollKinds(attribute) {
  return ["all_rolls", "skills", attribute];
}

function targetsOf(row) {
  const targets = {};
  for (const [target, column] of Object.entries(CONDITION_MODIFIER_COLUMNS)) {
    const value = toNumberOrNull(row[column]) ?? 0;
    if (value !== 0) targets[target] = value;
  }
  return targets;
}

function closeTags(granted) {
  const tags = new Set(granted);
  const pending = [...tags];
  while (pending.length > 0) {
    for (const implied of CONDITION_RULES.tagImplies[pending.pop()] ?? []) {
      if (!tags.has(implied)) {
        tags.add(implied);
        pending.push(implied);
      }
    }
  }
  return [...tags].sort();
}

function traitName(id) {
  for (const [dataset, nameColumn] of TRAIT_NAME_COLUMNS) {
    const row = loadDataset(dataset).find((r) => r[ID_COLUMN[dataset]] === id);
    if (row) return row[nameColumn];
  }
  return null;
}

function immunityOf(row, ownedTraitIds, immunityTraitIds) {
  for (const traitKey of toList(row.condition_immune_trait_keys)) {
    const id = immunityTraitIds[traitKey];
    if (id && ownedTraitIds.has(id)) {
      return { trait_key: traitKey, trait_name: traitName(id) };
    }
  }
  return null;
}

function strongest(targets, kinds) {
  return kinds.reduce((best, kind) => {
    const value = targets[kind] ?? 0;
    return Math.abs(value) > Math.abs(best) ? value : best;
  }, 0);
}

function summarize(active, tags) {
  const totals = {};
  const add = (targets) =>
    Object.entries(targets).forEach(([target, value]) => {
      totals[target] = (totals[target] ?? 0) + value;
    });
  active.forEach(({ targets }) => add(targets));
  tags.forEach((tag) => add(CONDITION_RULES.tagPenalties[tag] ?? {}));
  return totals;
}

// Immune conditions are listed and ignored; an exclusive-group loser or an unknown key is dropped and reported.
function resolveConditions(
  activeKeys = [],
  { traitIds = [], immunityTraitIds = IMMUNITY_TRAIT_IDS } = {},
) {
  const rows = loadDataset("CONDITIONS");
  const rowByKey = new Map(rows.map((row) => [row.condition_key, row]));
  const ownedTraitIds = new Set(traitIds);
  const keptByGroup = new Map();
  const chosen = new Set();
  const immune = [];
  const dropped = [];

  for (const key of new Set(activeKeys)) {
    const row = rowByKey.get(key);
    if (!row) {
      dropped.push({ key, reason: "unknown" });
      continue;
    }

    const immunity = immunityOf(row, ownedTraitIds, immunityTraitIds);
    if (immunity) {
      immune.push({ key, ...immunity });
      continue;
    }

    const group = row.condition_exclusive_group;
    if (group && keptByGroup.has(group)) {
      dropped.push({ key, reason: "exclusive", kept: keptByGroup.get(group) });
      continue;
    }
    if (group) keptByGroup.set(group, key);
    chosen.add(key);
  }

  const chosenRows = rows.filter((row) => chosen.has(row.condition_key));
  const active = chosenRows.map((row) => ({
    key: row.condition_key,
    name: row.condition_name,
    group: row.condition_group,
    targets: targetsOf(row),
  }));
  const tags = closeTags(chosenRows.flatMap((r) => toList(r.condition_grants)));

  return {
    active,
    immune,
    dropped,
    tags,
    modifiers: summarize(active, tags),
    recoveries: chosenRows
      .filter((row) => row.condition_recovery_attribute)
      .map((row) => ({
        key: row.condition_key,
        attributes: toList(row.condition_recovery_attribute),
        interval: row.condition_recovery_interval,
      })),
    reminders: chosenRows
      .filter((row) => row.condition_reminders)
      .map((row) => ({
        key: row.condition_key,
        text: row.condition_reminders,
      })),
  };
}

// Each condition hits a roll once, with its strongest matching penalty; different conditions add up.
function rollPenalty(resolved, kinds) {
  const fromConditions = resolved.active.reduce(
    (sum, { targets }) => sum + strongest(targets, kinds),
    0,
  );
  const fromTags = resolved.tags.reduce(
    (sum, tag) =>
      sum + strongest(CONDITION_RULES.tagPenalties[tag] ?? {}, kinds),
    0,
  );
  return fromConditions + fromTags;
}

module.exports = {
  DEFENSE_ROLL,
  SELF_CONTROL_ROLL,
  SENSE_ROLL,
  attributeRollKinds,
  skillRollKinds,
  resolveConditions,
  rollPenalty,
};
