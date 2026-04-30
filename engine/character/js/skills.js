const path = require("path");
const { loadCSV } = require("../../../helpers/dataUtils.js");
const { getSkillCost } = require("./skillsCost");

/**
 * Build selected skills + total cost
 */
function buildSkills(selectedIds = [], character = {}) {
  const filePath = path.join(process.cwd(), "data", "db_skills.csv");

  const rows = loadCSV(filePath);

  const skills = {};
  let totalCost = 0;

  const primary = character?.primary_attributes || {};

  for (const row of rows) {
    const id = row.skill_id;

    if (selectedIds.includes(id)) {
      const attribute = row.skill_base_attribute || "DX";

      const base =
        primary?.[attribute]?.base_value ?? primary?.[attribute]?.value ?? 0;

      const modifier = Number(row.skill_pre_defined_level || 0);
      const value = base + modifier;

      const cost = getSkillCost({
        attribute,
        base,
        level: value,
        difficulty: row.skill_difficulty,
      });

      skills[id] = {
        name: row.skill_name,
        category: row.skill_category,
        attribute,
        difficulty: row.skill_difficulty,

        base,
        modifier,
        value,

        parry_modifier: Number(row.skill_parry_modifier || 0),

        points: cost,
      };

      totalCost += cost;
    }
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
