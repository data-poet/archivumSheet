// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENT TARGETS DB
//
// Enchantments with a player-picked target (advantage, disadvantage, skill,
// spell) need to validate that target exists and read the cost/difficulty
// used for pricing. None of the character-layer builders (advantages.js,
// disadvantages.js, skills.js, spellsResolver.js) export a full, unfiltered,
// id-keyed lookup — they each load their CSV filtered to *selected* ids only.
// This loader is scoped specifically to enchantment target resolution.
//
// SPELLS: db_magic_grimoire.csv stores one row PER TIER per spell (Aprendiz,
// Experiente, Veterano, Especialista, Mestre), each with its own spell_id.
// The engine's own spell resolver looks spells up by name + a tier computed
// from level, not by spell_id. So a spell target must be keyed by
// spell_name, not spell_id — indexing by spell_id would pin an enchantment
// to one specific tier row instead of following the spell as level changes.
// Difficulty is identical across all five tier-rows of the same spell, so
// the first occurrence is kept and the rest skipped.
// ─────────────────────────────────────────────────────────────────────────────

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
