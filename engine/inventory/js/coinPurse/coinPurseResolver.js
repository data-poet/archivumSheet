const { COIN_WEIGHT, COIN_VALUE } = require("./coinPurseConstants");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a coin instance into a display-ready entry.
 *
 * total_weight — physical weight of the stack (kg)
 * total_value  — monetary value in copper pieces
 */
function resolveCoin(instance) {
  const coin_weight = COIN_WEIGHT[instance.coin_type];
  const coin_value  = COIN_VALUE[instance.coin_type];

  const total_weight = round2(coin_weight * instance.quantity);
  const total_value  = coin_value * instance.quantity;

  return {
    coin_type:    instance.coin_type,
    quantity:     instance.quantity,
    storedAt:     instance.storedAt,
    coin_weight,
    coin_value,
    total_weight,
    total_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_weight for backpack coins only.
 * Stash and camp do not count toward carry.
 */
function calculateCarriedCoinPurseWeight(backpackCoins) {
  return round2(
    backpackCoins.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_value (in copper) across a flat array of resolved coin entries.
 */
function sumCoinValue(coins) {
  return coins.reduce((sum, entry) => sum + entry.total_value, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveCoin,
  calculateCarriedCoinPurseWeight,
  sumCoinValue,
};
