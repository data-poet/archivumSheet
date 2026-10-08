import { state } from "../../../state.js";
import { renderListsPreserving } from "../../../ui.js";
import {
  addAlchemy,
  updateAlchemyQuantity,
  removeAlchemy,
  moveAlchemy,
  updateAlchemyTypeOptions,
  updateAlchemyNameOptions,
  updateAlchemyTierOptions,
  sendAlchemyToAlly,
} from "./model.js";
import { createSendToAllyHandler } from "../shared/sendToAllyControl.js";

const data = state.data;
const selected = state.selected;

const _handleSendAlchemyToAllyClick = createSendToAllyHandler({
  sendFn: sendAlchemyToAlly,
  render: () => renderListsPreserving(selected, data),
  canHandle: (instanceId) => selected.alchemy.some((a) => a.id === instanceId),
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleAlchemyClick(e) {
  if (e.target.classList.contains("remove-alchemy")) {
    removeAlchemy(
      e.target.dataset.consumableId,
      e.target.dataset.storedAt,
    );
    return true;
  }

  if (_handleSendAlchemyToAllyClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleAlchemyInput(e) {
  if (e.target.classList.contains("alchemy-qty")) {
    const consumableId = e.target.dataset.consumableId;
    const storedAt = e.target.dataset.storedAt;
    if (e.target.value === "-" || e.target.value === "") return true;
    const quantity = parseInt(e.target.value, 10);
    if (!consumableId || !storedAt) return true;
    updateAlchemyQuantity(
      consumableId,
      storedAt,
      isNaN(quantity) ? 0 : quantity,
    );
    return true;
  }
  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleAlchemyChange(e) {
  if (e.target.classList.contains("alchemy-location-select")) {
    const consumableId = e.target.dataset.consumableId;
    const fromLoc      = e.target.dataset.storedAt;
    const toLoc        = e.target.value;
    moveAlchemy(consumableId, fromLoc, toLoc);
    return true;
  }
  if (e.target.id === "alchemyTypeFilter") {
    updateAlchemyTypeOptions();
    return true;
  }
  if (e.target.id === "alchemyNameSelect") {
    updateAlchemyTierOptions();
    return true;
  }
  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddAlchemy() {
  const typeEl    = document.getElementById("alchemyTypeFilter");
  const nameEl    = document.getElementById("alchemyNameSelect");
  const tierEl    = document.getElementById("alchemyTierSelect");
  const qtyEl     = document.getElementById("alchemyQty");
  const storageEl = document.getElementById("alchemyStorage");

  if (!nameEl || !tierEl || !qtyEl || !storageEl) return;

  const typeFilter = typeEl?.value || "";
  const name       = nameEl.value;
  const tier       = tierEl.value;
  const quantity   = parseInt(qtyEl.value, 10);
  const storedAt   = storageEl.value;

  if (!name || !tier || isNaN(quantity) || quantity <= 0) return;

  const consumable = data.alchemy.find(
    (c) =>
      c.consumable_name === name &&
      c.consumable_tier === tier &&
      (!typeFilter || c.consumable_type === typeFilter),
  );

  if (!consumable) return;

  addAlchemy(consumable.consumable_id, quantity, storedAt);
  qtyEl.value = "1";
}
