import { createStackableInventory } from "../shared/stackableInventory.js";

const {
  add: addCoins,
  updateQuantity: updateCoinQuantity,
  move: moveCoins,
  sendToAlly: sendCoinsToAlly,
} = createStackableInventory("coins", "coin_type");

export { addCoins, updateCoinQuantity, moveCoins, sendCoinsToAlly };
