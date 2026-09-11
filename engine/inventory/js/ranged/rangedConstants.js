
const { VALID_STORED_AT } = require("../shared/storageLocations");

const RANGED_ITEM_CATEGORY = "Armas de Longo Alcance";

// has_magic_return (rangedResolver.js) keys off this id, not effect_type.
const MAGIC_RETURN_ENCHANTMENT_ID = "ENCHANTMENT-066";

module.exports = {
  VALID_STORED_AT,
  RANGED_ITEM_CATEGORY,
  MAGIC_RETURN_ENCHANTMENT_ID,
};
