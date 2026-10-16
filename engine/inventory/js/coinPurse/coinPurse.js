const { STORED_AT } = require("../../../../helpers/storage.js");
const { VALID_STORED_AT, VALID_COIN_TYPES } = require("./coinPurseConstants");

const { validateCoinInstance } = require("./coinPurseValidation");

const {
  resolveCoin,
  calculateCarriedCoinPurseWeight,
  sumCoinValue,
} = require("./coinPurseResolver");

// One entry per coin_type + storedAt, no backing database (coin types are constants). Carried weight counts the backpack
// only; total_coin_purse_value spans every location in copper, carried_coin_purse_value the backpack only.
function buildCoinPurseSlots(coinInventory = []) {
  const instanceErrors = coinInventory.flatMap((instance, index) =>
    validateCoinInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildCoinPurseSlots] Invalid coinInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const stash = [];
  const camp = [];
  const backpack = [];

  for (const instance of coinInventory) {
    const resolved = resolveCoin(instance);

    if (instance.storedAt === STORED_AT.STASH) {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === STORED_AT.CAMP) {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === STORED_AT.BACKPACK) {
      backpack.push(resolved);
    }
  }

  const carried_coin_purse_weight = calculateCarriedCoinPurseWeight(backpack);

  const total_coin_purse_value = sumCoinValue([...backpack, ...stash, ...camp]);

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
