import { state } from "../state.js";
import {
  addCoins,
  updateCoinQuantity,
  moveCoins,
} from "../inventory/coinPurse.js";

// ─────────────────────────────────────────────────────────────────────────────
// CLICK
// ─────────────────────────────────────────────────────────────────────────────

export function handleCoinPurseClick(e) {
  if (e.target.classList.contains("remove-coin")) {
    const { coinType, storedAt } = e.target.dataset;
    updateCoinQuantity(coinType, storedAt, 0);
    return true;
  }

  if (e.target.id === "addCoinBtn") {
    handleAddCoins();
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────────────────

export function handleCoinPurseInput(e) {
  if (e.target.classList.contains("coin-qty")) {
    const { coinType, storedAt } = e.target.dataset;
    if (e.target.value === "-" || e.target.value === "") return true;
    const quantity = parseInt(e.target.value, 10);
    if (!coinType || !storedAt) return true;
    updateCoinQuantity(coinType, storedAt, isNaN(quantity) ? 0 : quantity);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE
// ─────────────────────────────────────────────────────────────────────────────

export function handleCoinPurseChange(e) {
  if (e.target.classList.contains("coin-location-select")) {
    const { coinType, storedAt } = e.target.dataset;
    const toLocation = e.target.value;
    moveCoins(coinType, storedAt, toLocation);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD FORM
// ─────────────────────────────────────────────────────────────────────────────

export function handleAddCoins() {
  const coinTypeSelect   = document.getElementById("coinTypeSelect");
  const coinQtyInput     = document.getElementById("coinQtyInput");
  const coinLocationSelect = document.getElementById("coinLocationSelect");

  if (!coinTypeSelect || !coinQtyInput || !coinLocationSelect) return;

  const coinType = coinTypeSelect.value;
  const quantity = parseInt(coinQtyInput.value, 10);
  const storedAt = coinLocationSelect.value;

  if (!coinType || isNaN(quantity) || quantity <= 0) return;

  addCoins(coinType, quantity, storedAt);

  // Reset form
  coinTypeSelect.value = "";
  coinQtyInput.value   = "";
}
