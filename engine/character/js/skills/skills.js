const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");
const { getSkillCost } = require("./skillsCost.js");

// Categories that support isTrainedWithMaster and the actions formula
const MASTER_ELIGIBLE_CATEGORIES = new Set(["Armas e Combate", "Mágicas"]);

// Eligible categories only: without master, +1 action per 8 levels above 8; with master, +1 per 4 levels above 12 in base_value.
function computeActions({ category, base_value, level, isTrainedWithMaster }) {
  if (!MASTER_ELIGIBLE_CATEGORIES.has(category)) return 1;

  if (isTrainedWithMaster) {
    if (base_value <= 12) return 1;
    return 1 + Math.floor((base_value - 12) / 4);
  }

  if (level <= 8) return 1;
  return 1 + Math.floor((level - 8) / 8);
}

// enchantmentSkillGrants: multiple grants targeting the same skill don't stack — only the single highest-level candidate competes against the player's own purchase.
// enchantmentSkillModifiers: a fortify/weaken on a skill nobody has is a no-op — it does not create the skill on its own.
function buildSkills(
  selectedSkills = {},
  character = {},
  advantages = {},
  enchantmentSkillGrants = {},
  enchantmentSkillModifiers = {},
) {
  const filePath = path.join(process.cwd(), "data", "db_skills.csv");
  const rows = loadCSV(filePath);

  const hasReflexos = "ADV-055" in advantages;

  const skills = {};
  let totalCost = 0;

  const primary = character?.primary_attributes || {};

  for (const row of rows) {
    const id = row.skill_id;

    const selected = selectedSkills[id];
    const grants = enchantmentSkillGrants[id] || [];
    const hasEnchantmentModifier = id in enchantmentSkillModifiers;
    const enchantmentModifier = enchantmentSkillModifiers[id] || 0;

    if (!selected && grants.length === 0) continue;

    const attribute = row.skill_base_attribute || "DX";

    const attributeBase =
      primary?.[attribute]?.base_value ?? primary?.[attribute]?.value ?? 0;

    // A granted skill's base_value uses the FINAL (post-enchantment) attribute value; attributeBase stays unchanged since cost/relative_level must not be inflated by equipment.
    const grantAttributeBase = primary?.[attribute]?.value ?? attributeBase;

    // Winning source is whichever produces the higher pre-fortify level; a tie favors the player's paid entry so already-spent points aren't forfeited.
    const playerBaseValue = selected ? Number(selected.base_value ?? 0) : null;
    const playerModifier = selected ? Number(selected.modifier ?? 0) : 0;
    const playerLevel = selected ? playerBaseValue + playerModifier : -Infinity;

    let bestGrantExtra = null;
    let bestGrantLevel = -Infinity;
    for (const extra of grants) {
      const extraNum = Number(extra || 0);
      const grantLevel = grantAttributeBase + extraNum;
      if (grantLevel > bestGrantLevel) {
        bestGrantLevel = grantLevel;
        bestGrantExtra = extraNum;
      }
    }

    let base_value, modifier, is_enchantment;
    if (selected && (grants.length === 0 || playerLevel >= bestGrantLevel)) {
      base_value = playerBaseValue;
      modifier = playerModifier;
      is_enchantment = false;
    } else {
      base_value = grantAttributeBase;
      modifier = bestGrantExtra;
      is_enchantment = true;
    }

    // Cost is computed pre-enchantment since that's what character points are actually spent on.
    const preEnchantmentLevel = base_value + modifier;

    const level = preEnchantmentLevel + enchantmentModifier;

    const relative = level - attributeBase;

    const cost = is_enchantment
      ? 0
      : getSkillCost({
          attribute,
          base: attributeBase,
          level: preEnchantmentLevel,
          difficulty: row.skill_difficulty,
        });

    const parryModifier = Number(row.skill_parry_modifier || 0);
    let parry = null;
    if (row.skill_parry_modifier && row.skill_parry_modifier.trim() !== "") {
      parry = Math.floor(parryModifier * level) + (hasReflexos ? 1 : 0);
    }

    // Preserved from the player's own selection even if an enchantment grant wins on level — it's a declared training style, not tied to which source wins.
    const category = row.skill_category || "";
    const isEligible = MASTER_ELIGIBLE_CATEGORIES.has(category);
    const isTrainedWithMaster = isEligible
      ? Boolean(selected?.isTrainedWithMaster ?? false)
      : false;

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
      enchantment_modifier: enchantmentModifier,
      has_enchantment_modifier: hasEnchantmentModifier,
      value: level,

      relative_level: relative,

      parry_modifier: parryModifier,
      parry,

      isTrainedWithMaster,
      actions,

      is_enchantment,
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
