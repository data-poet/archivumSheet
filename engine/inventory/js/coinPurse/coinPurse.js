const { VALID_STORED_AT, VALID_COIN_TYPES } = require("./coinPurseConstants");

const { validateCoinInstance } = require("./coinPurseValidation");

const {
  resolveCoin,
  calculateCarriedCoinPurseWeight,
  sumCoinValue,
} = require("./coinPurseResolver");

/**
 * Builds the resolved coin purse, distributed across storage locations.
 *
 * State shape: one entry per coin_type + storedAt combination.
 * There is no backing database — coin types are defined by constants.
 *
 * Carried weight: backpack only (stash and camp excluded).
 * total_coin_purse_value: all coins across all locations (copper equivalent).
 * carried_coin_purse_value: backpack coins only (copper equivalent).
 */
function buildCoinPurseSlots(coinInventory = []) {

  const instanceErrors = coinInventory.flatMap((instance, index) =>
    validateCoinInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildCoinPurseSlots] Invalid coinInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const stash    = [];
  const camp     = [];
  const backpack = [];

  for (const instance of coinInventory) {
    const resolved = resolveCoin(instance);

    if (instance.storedAt === "stash") {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolved);
    }
  }

  const carried_coin_purse_weight = calculateCarriedCoinPurseWeight(backpack);

  const total_coin_purse_value = sumCoinValue([
    ...backpack,
    ...stash,
    ...camp,
  ]);

  const carried_coin_purse_value = sumCoinValue(backpack);

  return {
    stash,
    camp,
    backpack,
    carried_coin_purse_weight,
    total_coin_purse_value,
    carried_coin_purse_value,
  };
}

module.exports = {
  buildCoinPurseSlots,
  VALID_STORED_AT,
  VALID_COIN_TYPES,
};
