import { state } from "../../../state.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { generateInstanceId } from "../../../store/instanceId.js";

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

/** Merges with an existing entry for the same coin_type + storedAt. */
export function addCoins(coinType, quantity, storedAt = "backpack") {
  if (!coinType || quantity <= 0) return;

  const existing = findEntry(coinType, storedAt);
  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.coins.push({
      id: generateInstanceId(),
      coin_type: coinType,
      quantity,
      storedAt,
    });
  }

  renderListsPreserving(selected, state.data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE QUANTITY
// ─────────────────────────────────────────────────────────────────────────────

/** Removes the entry if quantity reaches zero. */
export function updateCoinQuantity(coinType, storedAt, quantity) {
  if (quantity <= 0) {
    selected.coins = selected.coins.filter(
      (c) => !(c.coin_type === coinType && c.storedAt === storedAt),
    );
  } else {
    const entry = findEntry(coinType, storedAt);
    if (entry) entry.quantity = quantity;
  }

  renderListsPreserving(selected, state.data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVE
// ─────────────────────────────────────────────────────────────────────────────

/** Merges into the destination if an entry already exists there — the destination row's
 * id wins and the source row's id is discarded on merge. */
export function moveCoins(coinType, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  const source = findEntry(coinType, fromLocation);
  if (!source) return;

  const qty = source.quantity;

  selected.coins = selected.coins.filter(
    (c) => !(c.coin_type === coinType && c.storedAt === fromLocation),
  );

  const dest = findEntry(coinType, toLocation);
  if (dest) {
    dest.quantity += qty;
  } else {
    selected.coins.push({
      id: source.id,
      coin_type: coinType,
      quantity: qty,
      storedAt: toLocation,
    });
  }

  renderListsPreserving(selected, state.data);
  triggerAutoRun();
}
