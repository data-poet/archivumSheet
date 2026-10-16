// Inventory bucket names the engine, the saved characters and the UI all share. The browser can't
// import this file, so dev/public/js/shared/constants.js mirrors STORED_AT; a parity test pins both.

const STORED_AT = Object.freeze({
  EQUIPPED: "equipped",
  BACKPACK: "backpack",
  STASH: "stash",
  CAMP: "camp",
});

// Order is pinned by the validation messages ("storedAt must be one of [...]").
const VALID_STORED_AT = [STORED_AT.STASH, STORED_AT.CAMP, STORED_AT.BACKPACK];

const ALL_BUCKETS = [STORED_AT.EQUIPPED, ...VALID_STORED_AT];

module.exports = {
  STORED_AT,
  VALID_STORED_AT,
  ALL_BUCKETS,
};
