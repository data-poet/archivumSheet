// Character-layer builders only export lookups filtered to *selected* ids, so enchantment target validation needs its own full, unfiltered, id-keyed loader.
// Spells are keyed by spell_name: the grimoire has one row per tier and the resolver looks up name + computed tier, so a spell_id would pin an enchantment to one tier.
const { loadDataset } = require("../../../../helpers/datasets.js");

let _enchantmentTargetsDB = null;

function getEnchantmentTargetsDB() {
  if (_enchantmentTargetsDB) {
    return _enchantmentTargetsDB;
  }

  const advantageRows = loadDataset("ADVANTAGES");
  const disadvantageRows = loadDataset("DISADVANTAGES");
  const skillRows = loadDataset("SKILLS");
  const spellRows = loadDataset("GRIMOIRE");

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
