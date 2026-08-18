/**
 * collectEquippedEnchantments.js
 *
 * Bridges the inventory layer (resolved equipped items, each carrying a
 * resolved `enchantments` array — see engine/inventory/js/shared/
 * enchantmentsResolver.js) into the character layer's inputs.
 *
 * Reads ONLY equipped items — an enchantment on a stashed/backpacked item
 * has no character effect, by design (its price still counts toward the
 * item's worth, computed separately in the inventory layer; this collector
 * is only about the character-effect side).
 *
 * Called once per buildSheet() run, after inventory is resolved and before
 * the final character build, since equipped items aren't known until then.
 *
 * Output shape is presence-aware, not just magnitude-aware: a map only
 * gets a key for a target that has at least one contributing enchantment,
 * even if the net sum happens to be 0 (e.g. a +2 and a -2 on the same
 * attribute). This lets the character layer expose a `has_enchantment`
 * flag the UI can use to decide whether to show the enchantment_modifier
 * field at all — "only appears when an enchanted item is equipped in that
 * category" — without the UI re-deriving that from raw inventory data
 * itself (the engine stays the single source of truth).
 */

// CSV target strings that don't match the engine's internal attribute keys
// 1:1. Every other attribute target (ST, DX, IQ, HT, HP, Mana, Toxicity,
// Will, Vision, Hearing, Smell, Movement, Dodge) matches exactly.
const ATTRIBUTE_TARGET_MAP = {
  "Basic Speed": "BasicSpeed",
};

function addToSumMap(map, key, value) {
  if (!key) return;
  map[key] = (map[key] || 0) + Number(value || 0);
}

function addToGrantMap(map, key, extraPoints) {
  if (!key) return;
  if (!map[key]) map[key] = [];
  map[key].push(Number(extraPoints || 0));
}

/**
 * @param {Array} equippedItems - resolved equipped items from any source
 *   that carries enchantments (accessories, magic gear so far — armor is a
 *   future phase), each with a resolved `.enchantments` array (see
 *   enchantmentsResolver.js's resolveEnchantmentEntry shape). Callers merge
 *   equipped items from multiple item types into a single array before
 *   calling this.
 */
function collectEquippedEnchantments(equippedItems = []) {
  const attributeModifiers = {};
  const advantageIds = [];
  const disadvantageIds = [];
  const skillGrants = {};
  const skillModifiers = {};
  const spellGrants = {};
  const spellModifiers = {};

  for (const item of equippedItems) {
    for (const enchantment of item?.enchantments || []) {
      const type = enchantment.enchantment_effect_type;
      const target = enchantment.target;

      switch (type) {
        case "fortify_attribute":
        case "weaken_attribute": {
          const key = ATTRIBUTE_TARGET_MAP[target] || target;
          addToSumMap(attributeModifiers, key, enchantment.value);
          break;
        }

        case "advantage":
          if (target) advantageIds.push(target);
          break;

        case "disadvantage":
          if (target) disadvantageIds.push(target);
          break;

        case "skill":
          addToGrantMap(skillGrants, target, enchantment.extraPoints);
          break;

        case "fortify_skill":
        case "weaken_skill":
          addToSumMap(skillModifiers, target, enchantment.extraPoints);
          break;

        case "spell":
          addToGrantMap(spellGrants, target, enchantment.extraPoints);
          break;

        case "fortify_spell":
        case "weaken_spell":
          addToSumMap(spellModifiers, target, enchantment.extraPoints);
          break;

        default:
        // "custom" / "weight" / unrecognized — no character effect to
        // collect (Phase 1 pilot CSV doesn't include these types yet).
      }
    }
  }

  return {
    attributeModifiers,
    advantageIds,
    disadvantageIds,
    skillGrants,
    skillModifiers,
    spellGrants,
    spellModifiers,
  };
}

module.exports = {
  collectEquippedEnchantments,
  ATTRIBUTE_TARGET_MAP,
};
