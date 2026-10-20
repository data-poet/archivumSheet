const { criticalRanges } = require("../../../../helpers/criticalRanges.js");
const { PRIMARY_KEYS } = require("../../../../helpers/rules.js");
const {
  ALL_BUCKETS,
  VALID_STORED_AT,
} = require("../../../../helpers/storage.js");
const { SPELL_ATTRIBUTE } = require("../../../magic/js/spellsConstants.js");
const {
  resolveConditions,
  rollPenalty,
  attributeRollKinds,
  skillRollKinds,
  DEFENSE_ROLL,
  SENSE_ROLL,
} = require("./conditions.js");

const SENSE_KEYS = ["Vision", "Hearing", "Smell"];

// The original field stays the pre-condition number: Parry, Block and costs are derived from it.
function addEffective(entry, field, penalty) {
  if (!entry || entry[field] == null || penalty === 0) return false;
  entry[`effective_${field}`] = entry[field] + penalty;
  return true;
}

function markRoll(entry, field, penalty) {
  if (!addEffective(entry, field, penalty)) return;
  entry.condition_modifier = penalty;
  if (entry.critical) {
    entry.critical = criticalRanges(entry[`effective_${field}`]);
  }
}

// Mutates the built sheet in place; with no active conditions it does nothing, so a sheet with no flags is unchanged.
function applyConditions({
  activeKeys,
  characterData,
  grimoire = {},
  inventory = {},
  skillRows = {},
}) {
  if (!Array.isArray(activeKeys) || activeKeys.length === 0) return;

  const resolved = resolveConditions(activeKeys, {
    traitIds: [
      ...Object.keys(characterData.advantages ?? {}),
      ...Object.keys(characterData.disadvantages ?? {}),
    ],
  });
  characterData.conditions = resolved;

  const penaltyFor = (kinds) => rollPenalty(resolved, kinds);
  const defense = penaltyFor(DEFENSE_ROLL);

  const attributeOf = (check) =>
    skillRows[check.skill_id]?.skill_base_attribute || "DX";

  function markCheck(check) {
    if (!check) return;
    markRoll(check, "level", penaltyFor(skillRollKinds(attributeOf(check))));
    addEffective(check, "parry", defense);
  }

  const primary = characterData.primary_attributes ?? {};
  PRIMARY_KEYS.forEach((key) =>
    markRoll(primary[key], "value", penaltyFor(attributeRollKinds(key))),
  );

  const secondary = characterData.secondary_attributes ?? {};
  markRoll(secondary.Will, "value", penaltyFor(attributeRollKinds("Will")));
  SENSE_KEYS.forEach((key) =>
    markRoll(secondary[key], "value", penaltyFor(SENSE_ROLL)),
  );
  if (addEffective(secondary.Dodge, "value", defense)) {
    secondary.Dodge.condition_modifier = defense;
  }

  Object.values(characterData.skills ?? {}).forEach((skill) => {
    markRoll(skill, "value", penaltyFor(skillRollKinds(skill.attribute)));
    addEffective(skill, "parry", defense);
  });

  Object.values(grimoire).forEach((spell) =>
    markRoll(spell, "value", penaltyFor(skillRollKinds(SPELL_ATTRIBUTE))),
  );

  (characterData.unarmed ?? []).forEach(markCheck);

  for (const bucket of [
    inventory.melee,
    inventory.ranged,
    inventory.firearms,
  ]) {
    for (const name of ALL_BUCKETS) {
      (bucket?.[name] ?? []).forEach((weapon) => markCheck(weapon.skill_check));
    }
  }

  function markShield(shield) {
    if (!shield) return;
    markCheck(shield.skill_check);
    addEffective(shield, "block", defense);
  }
  markShield(inventory.shield?.equipped);
  for (const name of VALID_STORED_AT) {
    (inventory.shield?.[name] ?? []).forEach(markShield);
  }
}

module.exports = { applyConditions };
