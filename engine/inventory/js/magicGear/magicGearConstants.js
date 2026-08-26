const VALID_STORED_AT = ["stash", "camp", "backpack"];

// magic_gear_type values from db_magic_gear.csv.
const MAGIC_GEAR_TYPES = {
  ARCANO: "Arcano",
  MUSICAL: "Musical",
};

// Equip caps are PER magic_gear_type, not one shared global cap. Arcano
// keeps the original rule: at most 2 equipped at once, regardless of which
// magic_gear_id(s) they are — 2 wands, 1 wand + 1 staff, etc. all count
// against the same Arcano limit. Musical instruments can only be played one
// at a time, so their cap is 1 — a lute and a drum can't both be equipped.
const MAGIC_GEAR_EQUIP_LIMITS = {
  [MAGIC_GEAR_TYPES.ARCANO]: 2,
  [MAGIC_GEAR_TYPES.MUSICAL]: 1,
};

module.exports = {
  VALID_STORED_AT,
  MAGIC_GEAR_TYPES,
  MAGIC_GEAR_EQUIP_LIMITS,
};
