// Character-layer builders only export lookups filtered to *selected* ids, so enchantment target validation needs its own full, unfiltered, id-keyed loader.
// Spells are keyed by spell_name, not spell_id, since db_magic_grimoire.csv has one row per tier per spell and the resolver looks spells up by name + computed tier — indexing by spell_id would pin an enchantment to one tier.
const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

let _enchantmentTargetsDB = null;

function getEnchantmentTargetsDB() {
  if (_enchantmentTargetsDB) {
    return _enchantmentTargetsDB;
  }

  const advantageRows = loadCSV(
    path.join(process.cwd(), "data", "db_traits_advantages.csv"),
  );
  const disadvantageRows = loadCSV(
    path.join(process.cwd(), "data", "db_traits_disadvantages.csv"),
  );
  const skillRows = loadCSV(path.join(process.cwd(), "data", "db_skills.csv"));
  const spellRows = loadCSV(
    path.join(process.cwd(), "data", "db_magic_grimoire.csv"),
  );

  const advantages = {};
  for (const row of advantageRows) {
    advantages[row.advantage_id] = {
      name: row.advantage_name,
      cost: Number(row.advantage_cost),
    };
  }

  const disadvantages = {};
  for (const row of disadvantageRows) {
    disadvantages[row.disadvantage_id] = {
      name: row.disadvantage_name,
      cost: Number(row.disadvantage_cost),
    };
  }

  const skills = {};
  for (const row of skillRows) {
    skills[row.skill_id] = {
      name: row.skill_name,
      difficulty: row.skill_difficulty,
      base_attribute: row.skill_base_attribute,
    };
  }

  const spells = {};
  for (const row of spellRows) {
    if (spells[row.spell_name]) continue;

    spells[row.spell_name] = {
      name: row.spell_name,
      difficulty: row.spell_difficulty,
    };
  }

  _enchantmentTargetsDB = { advantages, disadvantages, skills, spells };

  return _enchantmentTargetsDB;
}

module.exports = {
  getEnchantmentTargetsDB,
};
