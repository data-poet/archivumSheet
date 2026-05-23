const SLOT_MAP = {
  Cabeça: "head",
  Tronco: "torso",
  Braços: "arms",
  Mãos: "hands",
  Pernas: "legs",
  Pés: "feet",
};

const SLOTS = Object.keys(SLOT_MAP);

const VALID_STORED_AT = ["camp", "stash", "backpack"];

module.exports = {
  SLOT_MAP,
  SLOTS,
  VALID_STORED_AT,
};
