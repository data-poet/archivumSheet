// Reads ONLY equipped items — enchantments on stashed items have no character effect by design (their price still counts toward item worth elsewhere).
// Output maps are presence-aware: a target gets a key if any enchantment touches it, even if the net sum is 0, so the UI can show/hide the modifier field.
// Doubles as the bridge into magic/: spellGrants/spellModifiers are consumed by spellsResolver.js via buildSheet.js.

const { ATTRIBUTE_TARGET_MAP } = require("../../../../helpers/taxonomy.js");
const {
  ATTRIBUTE_EFFECT_TYPES,
  ELEMENTAL_RESISTANCE_EFFECT_TYPES,
  POINT_EFFECT_TYPES,
  SKILL_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
} = require("../../../inventory/js/shared/enchantmentsConstants.js");

const [ADVANTAGE_EFFECT_TYPE, DISADVANTAGE_EFFECT_TYPE] = POINT_EFFECT_TYPES;

// A skill/spell type that is neither fortify nor weaken is a grant (learned at extraPoints).
const isDirectional = (type) =>
  FORTIFY_EFFECT_TYPES.includes(type) || WEAKEN_EFFECT_TYPES.includes(type);

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

      if (ATTRIBUTE_EFFECT_TYPES.includes(type)) {
        const key = ATTRIBUTE_TARGET_MAP[target] || target;
        addToSumMap(attributeModifiers, key, enchantment.value);
      } else if (ELEMENTAL_RESISTANCE_EFFECT_TYPES.includes(type)) {
        // Elemental keys already match 1:1 between CSV and elementalResistances.js, so no target-map translation needed here.
        addToSumMap(elementalModifiers, target, enchantment.value);
      } else if (type === ADVANTAGE_EFFECT_TYPE) {
        if (target) advantageIds.push(target);
      } else if (type === DISADVANTAGE_EFFECT_TYPE) {
        if (target) disadvantageIds.push(target);
      } else if (SKILL_EFFECT_TYPES.includes(type)) {
        if (isDirectional(type)) {
          addToSumMap(skillModifiers, target, enchantment.extraPoints);
        } else {
          addToGrantMap(skillGrants, target, enchantment.extraPoints);
        }
      } else if (SPELL_EFFECT_TYPES.includes(type)) {
        if (isDirectional(type)) {
          addToSumMap(spellModifiers, target, enchantment.extraPoints);
        } else {
          addToGrantMap(spellGrants, target, enchantment.extraPoints);
        }
      }
      // Item-intrinsic effects (weight, damage resistance) are already applied in armorResolver.js; no character-level effect to collect.
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
