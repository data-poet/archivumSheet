// ─────────────────────────────────────────────────────────────────────────────
// RANGED WEAPONS CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VALID_STORED_AT = ["stash", "camp", "backpack"];

// enchantment_allowed_itens category for this item type — fixed-constant
// pattern, same shape as MELEE_ITEM_CATEGORY (meleeConstants.js). Dual-use
// pairs resolve this per decision #4/#5 of the weapons enchantments plan
// (Batch 4) — untouched here.
const RANGED_ITEM_CATEGORY = "Armas de Longo Alcance";

module.exports = {
  VALID_STORED_AT,
  RANGED_ITEM_CATEGORY,
};
