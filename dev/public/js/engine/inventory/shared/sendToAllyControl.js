// ─────────────────────────────────────────────────────────────────────────────
// SEND TO ALLY — shared UI control
//
// One destination-select + optional quantity + send-button row, reused across every
// inventory category's render.js. The click handler is a factory so each category can
// bind its own sendFn/render without this file depending on any category-specific module.
// ─────────────────────────────────────────────────────────────────────────────

import { getActiveCharacterId, getStore } from "../../../store/characters.js";
import { escapeHtml } from "../../../shared/renderUtils.js";
import { t } from "../../../localization/pt-BR/index.js";
import { showToast } from "../../../shared/toast.js";

// Only characters in the active character's own ally roster are valid send destinations.
function getLinkedAllyOptions(characterId) {
  const store = getStore();
  const owner = store.list.find((c) => c.id === characterId);
  const roster = owner?.data?.character?.allies ?? [];

  return roster
    .map((r) => store.list.find((c) => c.id === r.ally_id))
    .filter(Boolean)
    .map((c) => ({ id: c.id, name: c.name?.trim() || t("characters.unnamed") }));
}

export function sendToAllyRowHTML(instanceId, { needsQuantity = false, maxQuantity = 1 } = {}) {
  const allies = getLinkedAllyOptions(getActiveCharacterId());
  if (allies.length === 0) return "";

  const options = allies
    .map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`)
    .join("");

  const quantityInput = needsQuantity
    ? `<input type="number" class="send-to-ally-quantity" min="1" max="${maxQuantity}" value="${maxQuantity}" />`
    : "";

  return `
    <span class="send-to-ally-row" data-instance-id="${instanceId}">
      <select class="send-to-ally-select" data-instance-id="${instanceId}">${options}</select>
      ${quantityInput}
      <button class="send-to-ally-button" data-instance-id="${instanceId}">${escapeHtml(t("inventory.sendToAlly.send"))}</button>
    </span>
  `;
}

// Matches the handleXClick(e) => boolean signature used across every category's events.js,
// so it can be chained into the same delegated click dispatch without special-casing.
export function createSendToAllyHandler({ sendFn, render }) {
  return function handleSendToAllyClick(e) {
    if (!e.target.classList.contains("send-to-ally-button")) return false;

    const instanceId = e.target.dataset.instanceId;
    const row = e.target.closest(".send-to-ally-row");
    const destinationCharacterId = row?.querySelector(".send-to-ally-select")?.value;
    if (!destinationCharacterId) return true;

    const quantityInput = row?.querySelector(".send-to-ally-quantity");
    const args = quantityInput
      ? [instanceId, destinationCharacterId, parseInt(quantityInput.value, 10) || 0]
      : [instanceId, destinationCharacterId];

    const ok = sendFn(...args);
    if (ok) {
      render();
    } else {
      showToast(t("inventory.sendToAlly.failed"), "error");
    }

    return true;
  };
}
