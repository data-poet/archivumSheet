const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");
const { getSkillCost } = require("./skillsCost.js");

// Categories that support isTrainedWithMaster and the actions formula
const MASTER_ELIGIBLE_CATEGORIES = new Set(["Armas e Combate", "Mágicas"]);

/**
 * Compute the number of actions for a skill.
 *
 * - All skills default to 1 action.
 * - Eligible categories (Armas e Combate / Mágicas) only:
 *     - WITHOUT master: every 8 levels above 8 give +1 action
 *       (level 8 → 1, 16 → 2, 24 → 3, …)
 *     - WITH master:    every 4 levels above 12 in base_value give +1 action
 *       (base 12 → 1, 16 → 2, 20 → 3, …)
 */
function computeActions({ category, base_value, level, isTrainedWithMaster }) {
  if (!MASTER_ELIGIBLE_CATEGORIES.has(category)) return 1;

  if (isTrainedWithMaster) {
    if (base_value <= 12) return 1;
    return 1 + Math.floor((base_value - 12) / 4);
  }

  // without master
  if (level <= 8) return 1;
  return 1 + Math.floor((level - 8) / 8);
}

/**
 * Build selected skills + total cost.
 *
 * EXPECTS:
 * selectedSkills = {
 *   "SKILL-000": { base_value: 14, modifier: 2, isTrainedWithMaster: false }
 * }
 *
 * advantages = { "ADV-055": { ... }, ... }  (keyed by advantage_id)
 */
function buildSkills(selectedSkills = {}, character = {}, advantages = {}) {
  const filePath = path.join(process.cwd(), "data", "db_skills.csv");
  const rows = loadCSV(filePath);

  const hasReflexos = "ADV-055" in advantages;

  const skills = {};
  let totalCost = 0;

  const primary = character?.primary_attributes || {};

  for (const row of rows) {
    const id = row.skill_id;

    const selected = selectedSkills[id];
    if (!selected) continue;

    const attribute = row.skill_base_attribute || "DX";

    const attributeBase =
      primary?.[attribute]?.base_value ?? primary?.[attribute]?.value ?? 0;

    const base_value = Number(selected.base_value ?? 0);
    const modifier = Number(selected.modifier ?? 0);

    // Player-defined skill level
    const level = base_value + modifier;

    // Relative level = skill vs attribute
    const relative = level - attributeBase;

    const cost = getSkillCost({
      attribute,
      base: attributeBase,
      level,
      difficulty: row.skill_difficulty,
    });

    // ── Parry ────────────────────────────────────────────────────────────────
    const parryModifier = Number(row.skill_parry_modifier || 0);
    let parry = null;
    if (row.skill_parry_modifier && row.skill_parry_modifier.trim() !== "") {
      parry = Math.floor(parryModifier * level) + (hasReflexos ? 1 : 0);
    }

    // ── isTrainedWithMaster ──────────────────────────────────────────────────
    const category = row.skill_category || "";
    const isEligible = MASTER_ELIGIBLE_CATEGORIES.has(category);
    const isTrainedWithMaster = isEligible
      ? Boolean(selected.isTrainedWithMaster ?? false)
      : false;

    // ── Actions ──────────────────────────────────────────────────────────────
    const actions = computeActions({
      category,
      base_value,
      level,
      isTrainedWithMaster,
    });

    skills[id] = {
      name: row.skill_name,
      category,
      attribute,
      difficulty: row.skill_difficulty,

      attribute_base: attributeBase,
      base_value,
      modifier,
      value: level,

      relative_level: relative,

      parry_modifier: parryModifier,
      parry,

      isTrainedWithMaster,
      actions,

      points: cost,
    };

    totalCost += cost;
  }

  return {
    skills,
    character_points: {
      skills: totalCost,
    },
  };
}

module.exports = {
  buildSkills,
  computeActions,
  MASTER_ELIGIBLE_CATEGORIES,
};
