import { state } from "../state.js";
import { fetchAmmo, fetchAmmoContainers } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import {
  nextAmmoContainerInstanceId,
} from "../store/instanceId.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadAmmo() {
  [data.ammo, data.ammo_containers] = await Promise.all([
    fetchAmmo(),
    fetchAmmoContainers(),
  ]);

  loadAmmoSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadAmmoSelectors() {
  updateContainerOptions();
  updateLooseAmmoTypeFilter();
  updateLooseAmmoOptions();
}

export function updateContainerOptions() {
  const select = el("ammoContainerSelect");
  if (!select) return;

  populateSelect(
    select,
    data.ammo_containers.map((c) => ({
      value: c.container_id,
      label: c.container_box_name,
    })),
  );
}

export function updateAmmoTypeFilter() {
  const select = el("ammoTypeFilter");
  if (!select) return;

  const types = [...new Set(data.ammo.map((a) => a.ammo_type))];
  const current = select.value;

  select.innerHTML = `<option value="">— Tipo —</option>` +
    types.map((t) => `<option value="${t}" ${t === current ? "selected" : ""}>${t}</option>`).join("");
}

export function updateLooseAmmoTypeFilter() {
  const select = el("looseAmmoTypeFilter");
  if (!select) return;

  const types = [...new Set(data.ammo.map((a) => a.ammo_type))];
  const current = select.value;

  select.innerHTML = `<option value="">— Tipo —</option>` +
    types.map((t) => `<option value="${t}" ${t === current ? "selected" : ""}>${t}</option>`).join("");
}

export function updateAmmoOptions() {
  const typeSelect = el("ammoTypeFilter");
  const ammoSelect = el("ammoAmmoSelect");
  if (!ammoSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.ammo.filter((a) => a.ammo_type === typeFilter)
    : data.ammo;

  populateSelect(
    ammoSelect,
    filtered.map((a) => ({ value: a.ammo_id, label: a.ammo_name })),
  );
}

export function updateLooseAmmoOptions() {
  const typeSelect = el("looseAmmoTypeFilter");
  const ammoSelect = el("looseAmmoSelect");
  if (!ammoSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.ammo.filter((a) => a.ammo_type === typeFilter)
    : data.ammo;

  populateSelect(
    ammoSelect,
    filtered.map((a) => ({ value: a.ammo_id, label: a.ammo_name })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add a container to the inventory at the given storedAt location. */
export function addContainer(containerId, storedAt = "equipped") {
  if (!containerId) return;

  selected.ammo_containers.push({
    _instanceId: nextAmmoContainerInstanceId(),
    container_id: containerId,
    storedAt,
    contents: [],
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a container to a different location. */
export function moveContainer(instanceId, storedAt) {
  const container = findContainerByInstanceId(instanceId);
  if (!container) return;

  container.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a container (and all its contents) by instanceId. */
export function removeContainer(instanceId) {
  selected.ammo_containers = selected.ammo_containers.filter(
    (c) => c._instanceId !== instanceId,
  );
  renderLists(selected, data);
  triggerAutoRun();
}

/** Add ammo to a container's contents. */
export function addAmmoToContainer(instanceId, ammoId, quantity) {
  const container = findContainerByInstanceId(instanceId);
  if (!container || !ammoId || quantity <= 0) return;

  const existing = container.contents.find((e) => e.ammo_id === ammoId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    container.contents.push({ ammo_id: ammoId, quantity });
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Update the quantity of an ammo entry inside a container. */
export function updateContainerAmmoQuantity(instanceId, ammoId, quantity) {
  const container = findContainerByInstanceId(instanceId);
  if (!container) return;

  if (quantity <= 0) {
    container.contents = container.contents.filter((e) => e.ammo_id !== ammoId);
  } else {
    const entry = container.contents.find((e) => e.ammo_id === ammoId);
    if (entry) entry.quantity = quantity;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a specific ammo entry from a container. */
export function removeAmmoFromContainer(instanceId, ammoId) {
  const container = findContainerByInstanceId(instanceId);
  if (!container) return;

  container.contents = container.contents.filter((e) => e.ammo_id !== ammoId);

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOSE AMMO OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add loose ammo (no container) to a storage location. */
export function addLooseAmmo(ammoId, quantity, storedAt = "backpack") {
  if (!ammoId || quantity <= 0) return;

  // Merge with existing entry at same location
  const existing = selected.loose_ammo.find(
    (a) => a.ammo_id === ammoId && a.storedAt === storedAt,
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.loose_ammo.push({ ammo_id: ammoId, quantity, storedAt });
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Update quantity of a loose ammo entry (identified by ammo_id + storedAt). */
export function updateLooseAmmoQuantity(ammoId, storedAt, quantity) {
  if (quantity <= 0) {
    selected.loose_ammo = selected.loose_ammo.filter(
      (a) => !(a.ammo_id === ammoId && a.storedAt === storedAt),
    );
  } else {
    const entry = selected.loose_ammo.find(
      (a) => a.ammo_id === ammoId && a.storedAt === storedAt,
    );
    if (entry) entry.quantity = quantity;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a loose ammo entry. */
export function removeLooseAmmo(ammoId, storedAt) {
  selected.loose_ammo = selected.loose_ammo.filter(
    (a) => !(a.ammo_id === ammoId && a.storedAt === storedAt),
  );
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findContainerByInstanceId(instanceId) {
  return (
    selected.ammo_containers.find((c) => c._instanceId === instanceId) || null
  );
}
