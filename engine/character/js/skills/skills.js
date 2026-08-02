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
 *
 * enchantmentSkillGrants = { "SKILL-000": [0, 2] }  — one array entry per
 *   equipped "Adicionar Perícia" enchantment targeting this skill, each the
 *   extraPoints chosen above the granted attribute-based level. Multiple
 *   grants don't stack — only the single highest-level candidate is used
 *   (collision logic below), same as it would compete against the player's
 *   own purchase.
 *
 * enchantmentSkillModifiers = { "SKILL-000": 2 }  — summed extraPoints from
 *   equipped fortify_skill(+)/weaken_skill(-) enchantments targeting this
 *   skill. Only takes effect on a skill that ends up known one way or
 *   another (player-purchased or enchantment-granted) — per design, a
 *   fortify/weaken enchantment on a skill nobody has is a no-op, it does
 *   NOT create the skill on its own.
 */
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

    // Neither purchased nor granted — a fortify/weaken enchantment alone
    // never creates an entry (no-op, per design).
    if (!selected && grants.length === 0) continue;

    const attribute = row.skill_base_attribute || "DX";

    const attributeBase =
      primary?.[attribute]?.base_value ?? primary?.[attribute]?.value ?? 0;

    // For a granted skill's base_value specifically, use the FINAL
    // (post-enchantment) attribute value, not the pre-enchantment
    // attributeBase above (which stays as-is, unchanged, for cost and
    // relative_level — those must not be inflated by equipment). This
    // matches how spells already compute their grant base
    // (character.primary_attributes.IQ.value) and reflects "the player's
    // value" as literally shown on the sheet, including any ST/DX/IQ
    // fortification from other equipped items.
    const grantAttributeBase = primary?.[attribute]?.value ?? attributeBase;

    // ── Determine the winning source: player's own paid purchase vs the
    //    best equipped "Adicionar Perícia" grant. Whichever produces the
    //    higher pre-fortify level wins; a tie prefers the player's paid
    //    entry (don't forfeit already-spent points on a tie). Multiple
    //    grants targeting the same skill don't stack — only the single
    //    best one is considered, same as it competes against the player's
    //    own purchase. ─────────────────────────────────────────────────────

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

    // Level before any fortify/weaken enchantment_modifier — this is what
    // character points are spent on, so cost is computed from this, not
    // the final (possibly magically-boosted) level.
    const preEnchantmentLevel = base_value + modifier;

    // Final effective level — what's actually rolled against in play.
    const level = preEnchantmentLevel + enchantmentModifier;

    // Relative level = skill vs attribute (uses the final effective level)
    const relative = level - attributeBase;

    const cost = is_enchantment
      ? 0
      : getSkillCost({
          attribute,
          base: attributeBase,
          level: preEnchantmentLevel,
          difficulty: row.skill_difficulty,
        });

    // ── Parry ────────────────────────────────────────────────────────────────
    const parryModifier = Number(row.skill_parry_modifier || 0);
    let parry = null;
    if (row.skill_parry_modifier && row.skill_parry_modifier.trim() !== "") {
      parry = Math.floor(parryModifier * level) + (hasReflexos ? 1 : 0);
    }

    // ── isTrainedWithMaster ──────────────────────────────────────────────────
    // Preserved from the player's own selection whenever one exists, even
    // if an enchantment grant currently wins on level — it's a
    // player-declared training style, not tied to which source is winning.
    const category = row.skill_category || "";
    const isEligible = MASTER_ELIGIBLE_CATEGORIES.has(category);
    const isTrainedWithMaster = isEligible
      ? Boolean(selected?.isTrainedWithMaster ?? false)
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
