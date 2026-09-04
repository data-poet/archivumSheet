const { COIN_WEIGHT, COIN_VALUE } = require("./coinPurseConstants");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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

function calculateCarriedCoinPurseWeight(backpackCoins) {
  return round2(
    backpackCoins.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

function sumCoinValue(coins) {
  return coins.reduce((sum, entry) => sum + entry.total_value, 0);
}

module.exports = {
  resolveCoin,
  calculateCarriedCoinPurseWeight,
  sumCoinValue,
};
