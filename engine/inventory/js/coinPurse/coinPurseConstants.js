// ─────────────────────────────────────────────────────────────────────────────
// COIN PURSE CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VALID_COIN_TYPES = ["copper", "silver", "gold"];

/** Weight in kg per single coin. */
const COIN_WEIGHT = {
  copper: 0.002,
  silver: 0.003,
  gold:   0.005,
};

/** Value in copper pieces per single coin. */
const COIN_VALUE = {
  copper: 1,
  silver: 100,
  gold:   1000,
};

const VALID_STORED_AT = ["backpack", "stash", "camp"];

module.exports = {
  VALID_COIN_TYPES,
  COIN_WEIGHT,
  COIN_VALUE,
  VALID_STORED_AT,
};
