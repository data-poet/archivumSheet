import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function findEntry(coinType, storedAt) {
  return selected.coins.find(
    (c) => c.coin_type === coinType && c.storedAt === storedAt,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add coins of a given type to a location.
 * Merges with an existing entry for the same coin_type + storedAt.
 */
export function addCoins(coinType, quantity, storedAt = "backpack") {
  if (!coinType || quantity <= 0) return;

  const existing = findEntry(coinType, storedAt);
  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.coins.push({ coin_type: coinType, quantity, storedAt });
  }

  renderLists(selected, state.data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE QUANTITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Set the quantity of a specific coin_type at a location.
 * Removes the entry if quantity reaches zero.
 */
export function updateCoinQuantity(coinType, storedAt, quantity) {
  if (quantity <= 0) {
    selected.coins = selected.coins.filter(
      (c) => !(c.coin_type === coinType && c.storedAt === storedAt),
    );
  } else {
    const entry = findEntry(coinType, storedAt);
    if (entry) entry.quantity = quantity;
  }

  renderLists(selected, state.data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move a coin stack from one location to another.
 * Merges into the destination if an entry already exists there.
 */
export function moveCoins(coinType, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  const source = findEntry(coinType, fromLocation);
  if (!source) return;

  const qty = source.quantity;

  // Remove source
  selected.coins = selected.coins.filter(
    (c) => !(c.coin_type === coinType && c.storedAt === fromLocation),
  );

  // Merge into destination
  const dest = findEntry(coinType, toLocation);
  if (dest) {
    dest.quantity += qty;
  } else {
    selected.coins.push({ coin_type: coinType, quantity: qty, storedAt: toLocation });
  }

  renderLists(selected, state.data);
  triggerAutoRun();
}
