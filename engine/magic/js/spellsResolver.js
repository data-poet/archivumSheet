const path = require("path");
const { loadCSV } = require("../../../helpers/dataUtils.js");

/**
 * Load and cache all DB tables used by resolver
 */
let _dbCache = null;

function getAllSpells() {
  if (_dbCache) return _dbCache;

  _dbCache = {
    spells: loadCSV(path.join(process.cwd(), "data", "db_magic_grimoire.csv")),
  };

  return _dbCache;
}

/**
 * Spell tier rules (single source of truth)
 */
function getSpellTierByLevel(level) {
  if (level <= 12) return "Aprendiz";
  if (level <= 15) return "Experiente";
  if (level <= 17) return "Veterano";
  if (level <= 19) return "Especialista";
  return "Mestre";
}

/**
 * Normalize strings to avoid mismatch issues
 */
function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Safely read possible column variations
 */
function getRowName(row) {
  return row.spell_name || row.name;
}

function getRowTier(row) {
  return row.spell_tier || row.tier;
}

/**
 * SPELL RESOLVER
 */
function resolveSpells({ selectedSpells = {}, character = {}, rows = [] }) {
  const resolved = {};

  const iq = character?.iq ?? character?.primary_attributes?.IQ?.value ?? 0;

  for (const [spellName, input] of Object.entries(selectedSpells)) {
    const base_value = Number(input.base_value ?? 0);
    const modifier = Number(input.modifier ?? 0);

    const level = base_value + modifier;
    const tier = getSpellTierByLevel(level);

    const normalizedInput = normalize(spellName);
    const normalizedTier = normalize(tier);

    const row = rows.find((r) => {
      const name = normalize(getRowName(r));
      const rowTier = normalize(getRowTier(r));

      return name === normalizedInput && rowTier === normalizedTier;
    });

    if (!row) {
      console.warn("SPELL NOT FOUND:", {
        input: spellName,
        tier,
        sample: rows[0],
      });
      continue;
    }

    resolved[row.spell_id] = {
      row,

      spell_id: row.spell_id,
      name: getRowName(row),
      school: row.spell_school,
      category: row.spell_type,
      tier: getRowTier(row),

      attribute: "IQ",
      attribute_base: iq,

      base_value,
      modifier,
      level,
    };
  }

  return resolved;
}

/**
 * MAIN RESOLVER ENTRY
 */
function resolveAll({ spells = {}, character = {} }) {
  const db = getAllSpells();

  return {
    spells: resolveSpells({
      selectedSpells: spells,
      character,
      rows: db.spells,
    }),
  };
}

module.exports = {
  resolveAll,
  resolveSpells,
  getSpellTierByLevel,
};
