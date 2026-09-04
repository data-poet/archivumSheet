const path = require("path");
const { loadCSV } = require("../../../helpers/dataUtils.js");

let _dbCache = null;

function getAllSpells() {
  if (_dbCache) return _dbCache;

  _dbCache = {
    spells: loadCSV(path.join(process.cwd(), "data", "db_magic_grimoire.csv")),
  };

  return _dbCache;
}

// Only the highest-ranked advantage in the group applies — they're mutually exclusive tiers of the same trait.
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

function getSpellTierByLevel(level) {
  if (level <= 12) return "Aprendiz";
  if (level <= 15) return "Experiente";
  if (level <= 17) return "Veterano";
  if (level <= 19) return "Especialista";
  return "Mestre";
}

function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getRowName(row) {
  return row.spell_name || row.name;
}

function getRowTier(row) {
  return row.spell_tier || row.tier;
}

// enchantmentSpellGrants/enchantmentSpellModifiers follow the same collision/no-op rules as skills (see skills.js): multiple grants don't stack, and a fortify/weaken on a spell nobody has is a no-op.
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

    if (!input && grants.length === 0) continue;

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

    // Aptitude applies equally to both sources, so it doesn't affect who won above.
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
