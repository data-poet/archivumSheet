import { state } from "../state.js";
import {
  addContainer, moveContainer, removeContainer,
  addAmmoToContainer, updateContainerAmmoQuantity, removeAmmoFromContainer,
  addLooseAmmo, updateLooseAmmoQuantity, removeLooseAmmo,
  moveLooseAmmo, moveAmmoInContainer,
  updateAmmoOptions, updateLooseAmmoOptions, updateLooseAmmoTypeFilter,
} from "../inventory/ammo.js";
import { renderLists } from "../ui.js";
import { ammoDetailKeyFn } from "../shared/openState.js";

const selected = state.selected;
const data = state.data;

// ─── Resume ammo stepper helper ───────────────────────────────────────────────
// The resume view shows an aggregated quantity for each ammo_id across all
// equipped containers. When the player adjusts the stepper, we translate the
// new aggregate into a delta and apply it to the first equipped container
// (by insertion order) that holds the given ammo_id.

function _applyResumeAmmoQty(ammoId, firstInstanceId, newTotal) {
  // Calculate current total across all equipped containers
  const equippedContainers = selected.ammo_containers.filter(
    (c) => c.storedAt === "equipped",
  );
  const currentTotal = equippedContainers.reduce((sum, c) => {
    const entry = c.contents.find((e) => e.ammo_id === ammoId);
    return sum + (entry?.quantity ?? 0);
  }, 0);

  const delta = newTotal - currentTotal;
  if (delta === 0) return;

  if (delta > 0) {
    // Increment: add to the first container
    const firstContainer = selected.ammo_containers.find(
      (c) => c._instanceId === firstInstanceId,
    );
    if (!firstContainer) return;
    const entry = firstContainer.contents.find((e) => e.ammo_id === ammoId);
    if (entry) {
      updateContainerAmmoQuantity(firstInstanceId, ammoId, entry.quantity + delta);
    }
  } else {
    // Decrement: drain from first container first, overflow to next
    let remaining = Math.abs(delta);
    for (const cont of equippedContainers) {
      if (remaining <= 0) break;
      const entry = cont.contents.find((e) => e.ammo_id === ammoId);
      if (!entry || entry.quantity <= 0) continue;
      const toRemove = Math.min(remaining, entry.quantity);
      updateContainerAmmoQuantity(cont._instanceId, ammoId, entry.quantity - toRemove);
      remaining -= toRemove;
    }
  }
}

// ─── Open-state helpers ───────────────────────────────────────────────────────

function _snapshot() {
  return {
    containers: _snap("#ammoContainerList", ammoDetailKeyFn),
    loose:      _snap("#looseAmmoList",     ammoDetailKeyFn),
  };
}
function _snap(sel, keyFn) {
  const open = new Set();
  document.querySelector(sel)?.querySelectorAll("details[open]").forEach((d) => {
    const k = keyFn(d); if (k) open.add(k);
  });
  return open;
}
function _restore(snap) {
  _rest("#ammoContainerList", ammoDetailKeyFn, snap.containers);
  _rest("#looseAmmoList",     ammoDetailKeyFn, snap.loose);
}
function _rest(sel, keyFn, open) {
  if (!open.size) return;
  document.querySelector(sel)?.querySelectorAll("details").forEach((d) => {
    const k = keyFn(d); if (k && open.has(k)) d.setAttribute("open", "");
  });
}
function _renderAll() {
  const snap = _snapshot(); renderLists(selected, data); _restore(snap);
}

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleAmmoClick(e) {
  if (e.target.classList.contains("remove-ammo-container")) {
    removeContainer(e.target.dataset.instanceId); return true;
  }
  if (e.target.classList.contains("remove-ammo-from-container")) {
    removeAmmoFromContainer(e.target.dataset.instanceId, e.target.dataset.ammoId); return true;
  }
  if (e.target.classList.contains("add-ammo-to-container-btn")) {
    const instanceId = e.target.dataset.instanceId;
    const ammoSelect = document.querySelector(`.ammo-select-for-container[data-instance-id="${instanceId}"]`);
    const qtyInput   = document.querySelector(`.ammo-qty-add-input[data-instance-id="${instanceId}"]`);
    if (!ammoSelect || !qtyInput) return true;
    const ammoId = ammoSelect.value;
    const quantity = parseInt(qtyInput.value, 10);
    if (!ammoId || isNaN(quantity) || quantity <= 0) return true;
    addAmmoToContainer(instanceId, ammoId, quantity);
    return true;
  }
  if (e.target.classList.contains("remove-loose-ammo")) {
    removeLooseAmmo(e.target.dataset.ammoId, e.target.dataset.storedAt); return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────
// The global stepper handler (events/index.js) fires input events on ± clicks;
// these handlers receive them and enforce capacity clamping via the inventory layer.

export function handleAmmoInput(e) {
  if (e.target.classList.contains("ammo-qty-in-container")) {
    const instanceId = e.target.dataset.instanceId;
    const ammoId     = e.target.dataset.ammoId;
    if (e.target.value === "-" || e.target.value === "") return true;
    const quantity = parseInt(e.target.value, 10);
    if (!instanceId || !ammoId) return true;
    updateContainerAmmoQuantity(instanceId, ammoId, isNaN(quantity) ? 0 : quantity);
    return true;
  }
  if (e.target.classList.contains("loose-ammo-qty")) {
    const ammoId   = e.target.dataset.ammoId;
    const storedAt = e.target.dataset.storedAt;
    if (e.target.value === "-" || e.target.value === "") return true;
    const quantity = parseInt(e.target.value, 10);
    if (!ammoId || !storedAt) return true;
    updateLooseAmmoQuantity(ammoId, storedAt, isNaN(quantity) ? 0 : quantity);
    return true;
  }
  if (e.target.classList.contains("resume-ammo-qty")) {
    const ammoId     = e.target.dataset.ammoId;
    const instanceId = e.target.dataset.instanceId;
    if (e.target.value === "-" || e.target.value === "") return true;
    if (!ammoId || !instanceId) return true;
    const newTotal = parseInt(e.target.value, 10);
    if (isNaN(newTotal) || newTotal < 0) return true;
    _applyResumeAmmoQty(ammoId, instanceId, newTotal);
    return true;
  }
  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleAmmoChange(e) {
  if (e.target.classList.contains("ammo-container-storage-select")) {
    moveContainer(e.target.dataset.instanceId, e.target.value); return true;
  }
  if (e.target.classList.contains("loose-ammo-location-select")) {
    const ammoId  = e.target.dataset.ammoId;
    const fromLoc = e.target.dataset.storedAt;
    const toLoc   = e.target.value;
    moveLooseAmmo(ammoId, fromLoc, toLoc);
    return true;
  }
  if (e.target.classList.contains("ammo-in-container-move-select")) {
    const fromInstanceId = e.target.dataset.fromInstanceId;
    const ammoId         = e.target.dataset.ammoId;
    const toInstanceId   = e.target.value;
    if (!toInstanceId || toInstanceId === fromInstanceId) return true;
    moveAmmoInContainer(fromInstanceId, toInstanceId, ammoId);
    return true;
  }
  if (e.target.id === "ammoTypeFilter") {
    updateAmmoOptions(); return true;
  }
  if (e.target.id === "looseAmmoTypeFilter") {
    updateLooseAmmoTypeFilter(); updateLooseAmmoOptions(); return true;
  }
  return false;
}

// ─── Add-form: container ──────────────────────────────────────────────────────

export function handleAddContainer() {
  const containerSelect = document.getElementById("ammoContainerSelect");
  const storageSelect   = document.getElementById("ammoContainerStorage");
  if (!containerSelect || !storageSelect) return;
  const containerId = containerSelect.value;
  const storedAt    = storageSelect.value;
  if (!containerId) return;
  addContainer(containerId, storedAt);
}

// ─── Add-form: loose ammo ─────────────────────────────────────────────────────

export function handleAddLooseAmmo() {
  const ammoSelect    = document.getElementById("looseAmmoSelect");
  const qtyInput      = document.getElementById("looseAmmoQty");
  const storageSelect = document.getElementById("looseAmmoStorage");
  if (!ammoSelect || !qtyInput || !storageSelect) return;
  const ammoId   = ammoSelect.value;
  const quantity = parseInt(qtyInput.value, 10);
  const storedAt = storageSelect.value;
  if (!ammoId || isNaN(quantity) || quantity <= 0) return;
  addLooseAmmo(ammoId, quantity, storedAt);
  qtyInput.value = "1";
}
