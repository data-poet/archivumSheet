const path = require("path");
const { loadCSV } = require("../../../helpers/dataUtils.js");
const { getSkillCost } = require("./skillsCost");

/**
 * Build selected skills + total cost
 *
 * EXPECTS:
 * selectedSkills = {
 *   "SKILL-000": { base: 14, modifier: 2 }
 * }
 */
function buildSkills(selectedSkills = {}, character = {}) {
  const filePath = path.join(process.cwd(), "data", "db_skills.csv");
  const rows = loadCSV(filePath);

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

    const base = Number(selected.base ?? 0);
    const modifier = Number(selected.modifier ?? 0);

    // Player-defined skill level
    const level = base + modifier;

    // Relative level = skill vs attribute
    const relative = level - attributeBase;

    const cost = getSkillCost({
      attribute,
      base: attributeBase,
      level,
      difficulty: row.skill_difficulty,
    });

    skills[id] = {
      name: row.skill_name,
      category: row.skill_category,
      attribute,
      difficulty: row.skill_difficulty,

      attribute_base: attributeBase,
      base,
      modifier,
      value: level,

      relative_level: relative,

      parry_modifier: Number(row.skill_parry_modifier || 0),

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
};
