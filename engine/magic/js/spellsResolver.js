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
 * Magic Aptitude (ADV-063 → ADV-065)
 *
 * Grants a flat bonus to the effective level of every learned spell.
 * Only the highest-ranked advantage in the group applies (they are
 * mutually exclusive tiers of the same trait).
 */
const magicAptitudeGroup = {
  "ADV-063": 1,
  "ADV-064": 2,
  "ADV-065": 3,
};

function getAptitudeLevel(advantages = {}) {
  let max = 0;
  for (const id of Object.keys(advantages)) {
    if (magicAptitudeGroup[id] && magicAptitudeGroup[id] > max) {
      max = magicAptitudeGroup[id];
    }
  }
  return max;
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
 *
 * enchantmentSpellGrants = { "Moldar Mana": [0, 2] }  — one array entry per
 *   equipped "Adicionar Feitiço" enchantment targeting this spell, each the
 *   extraPoints chosen above the granted IQ-based level. Multiple grants
 *   don't stack — only the single highest-level candidate competes against
 *   the player's own purchase, same collision rule as skills.
 *
 * enchantmentSpellModifiers = { "Moldar Mana": 2 }  — summed extraPoints
 *   from equipped fortify_spell(+)/weaken_spell(-) enchantments targeting
 *   this spell. Only applies to a spell that ends up known one way or
 *   another — a fortify/weaken enchantment on a spell nobody has is a
 *   no-op, same as skills.
 */
function resolveSpells({
  selectedSpells = {},
  character = {},
  rows = [],
  enchantmentSpellGrants = {},
  enchantmentSpellModifiers = {},
}) {
  const resolved = {};

  const iq = character?.iq ?? character?.primary_attributes?.IQ?.value ?? 0;
  const aptitude_level = getAptitudeLevel(character?.advantages);

  const spellNames = new Set([
    ...Object.keys(selectedSpells),
    ...Object.keys(enchantmentSpellGrants),
    ...Object.keys(enchantmentSpellModifiers),
  ]);

  for (const spellName of spellNames) {
    const input = selectedSpells[spellName];
    const grants = enchantmentSpellGrants[spellName] || [];
    const hasEnchantmentModifier = spellName in enchantmentSpellModifiers;
    const enchantmentModifier = enchantmentSpellModifiers[spellName] || 0;

    // Neither purchased nor granted — a fortify/weaken enchantment alone
    // never creates an entry (no-op, per design, same as skills).
    if (!input && grants.length === 0) continue;

    // ── Determine the winning source: player's own purchase vs the best
    //    equipped "Adicionar Feitiço" grant. Same rule as skills: higher
    //    pre-fortify level wins, ties favor the player's own entry, and
    //    multiple grants on one spell don't stack. ─────────────────────────

    const playerBaseValue = input ? Number(input.base_value ?? 0) : null;
    const playerModifier = input ? Number(input.modifier ?? 0) : 0;
    const playerLevel = input ? playerBaseValue + playerModifier : -Infinity;

    let bestGrantExtra = null;
    let bestGrantLevel = -Infinity;
    for (const extra of grants) {
      const extraNum = Number(extra || 0);
      const grantLevel = iq + extraNum;
      if (grantLevel > bestGrantLevel) {
        bestGrantLevel = grantLevel;
        bestGrantExtra = extraNum;
      }
    }

    let base_value, modifier, is_enchantment;
    if (input && (grants.length === 0 || playerLevel >= bestGrantLevel)) {
      base_value = playerBaseValue;
      modifier = playerModifier;
      is_enchantment = false;
    } else {
      base_value = iq;
      modifier = bestGrantExtra;
      is_enchantment = true;
    }

    // Final effective level — what's actually cast at, and what
    // determines tier. Includes aptitude (applies to both sources
    // equally, so doesn't affect who wins above) and the fortify/weaken
    // enchantment_modifier on top.
    const level = base_value + modifier + aptitude_level + enchantmentModifier;
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
      aptitude_level,
      enchantment_modifier: enchantmentModifier,
      has_enchantment_modifier: hasEnchantmentModifier,
      is_enchantment,
      level,
    };
  }

  return resolved;
}

/**
 * MAIN RESOLVER ENTRY
 */
function resolveAll({
  spells = {},
  character = {},
  enchantmentSpellGrants = {},
  enchantmentSpellModifiers = {},
}) {
  const db = getAllSpells();

  return {
    spells: resolveSpells({
      selectedSpells: spells,
      character,
      rows: db.spells,
      enchantmentSpellGrants,
      enchantmentSpellModifiers,
    }),
  };
}

module.exports = {
  resolveAll,
  resolveSpells,
  getSpellTierByLevel,
};
