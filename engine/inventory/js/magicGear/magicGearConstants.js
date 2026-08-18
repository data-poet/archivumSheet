const VALID_STORED_AT = ["stash", "camp", "backpack"];

// Unlike accessories (per-accessory_id equip limit, driven by CSV), magic
// gear has a single GLOBAL cap: at most 2 equipped at once, regardless of
// which magic_gear_id(s) they are — 2 wands, 1 wand + 1 staff, etc. all
// count against the same shared limit.
const MAGIC_GEAR_EQUIP_LIMIT = 2;

module.exports = {
  VALID_STORED_AT,
  MAGIC_GEAR_EQUIP_LIMIT,
};
