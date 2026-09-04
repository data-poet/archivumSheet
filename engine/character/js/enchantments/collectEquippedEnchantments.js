// Reads ONLY equipped items — enchantments on stashed items have no character effect by design (their price still counts toward item worth elsewhere).
// Output maps are presence-aware: a target gets a key if any enchantment touches it, even if the net sum is 0, so the UI can show/hide the modifier field.

// CSV target strings that don't match the engine's internal attribute keys 1:1.
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

// Callers merge equipped items from multiple item types into a single array before calling this.
function collectEquippedEnchantments(equippedItems = []) {
  const attributeModifiers = {};
  const elementalModifiers = {};
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

        case "fortify_resistance":
        case "weaken_resistance":
          // Elemental keys already match 1:1 between CSV and elementalResistances.js, so no target-map translation needed here.
          addToSumMap(elementalModifiers, target, enchantment.value);
          break;

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
        // Item-intrinsic effects (weight, damage resistance) are already applied in armorResolver.js; no character-level effect to collect.
      }
    }
  }

  return {
    attributeModifiers,
    elementalModifiers,
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
