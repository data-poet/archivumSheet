const VALID_STORED_AT = ["stash", "camp", "backpack"];

const MAGIC_GEAR_TYPES = {
  ARCANO: "Arcano",
  MUSICAL: "Musical",
};

// Equip caps are per magic_gear_type, not one shared global cap: Arcano allows 2 (any mix of wand/staff), Musical only 1 (can only play one instrument at a time).
const MAGIC_GEAR_EQUIP_LIMITS = {
  [MAGIC_GEAR_TYPES.ARCANO]: 2,
  [MAGIC_GEAR_TYPES.MUSICAL]: 1,
};

module.exports = {
  VALID_STORED_AT,
  MAGIC_GEAR_TYPES,
  MAGIC_GEAR_EQUIP_LIMITS,
};
