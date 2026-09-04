
const VALID_STORED_AT = ["stash", "camp", "backpack"];

// enchantment_allowed_itens category for this item type — fixed-constant
// pattern, same shape as MELEE_ITEM_CATEGORY/RANGED_ITEM_CATEGORY. Firearms
// aren't part of any dual-use pairing, so no union-category concerns here.
const FIREARMS_ITEM_CATEGORY = "Armas de Fogo";

module.exports = {
  VALID_STORED_AT,
  FIREARMS_ITEM_CATEGORY,
};
