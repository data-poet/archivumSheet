import { state } from "../../../state.js";
import { fetchAmmo, fetchAmmoContainers } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { nextAmmoContainerInstanceId } from "../../../store/instanceId.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR/index.js";

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
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadAmmoSelectors() {
  updateContainerTypeOptions();
  updateLooseAmmoTypeFilter();
  updateLooseAmmoOptions();
}

// Mirrors melee/ranged/firearms' updateXTypeOptions pattern.
export function updateContainerTypeOptions() {
  const select = el("ammoContainerTypeFilter");
  if (!select) return;

  const types = [
    ...new Set(data.ammo_containers.map((c) => c.container_ammo_type)),
  ].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("ammo.containerTypeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateContainerOptions();
}

export function updateContainerOptions() {
  const typeSelect = el("ammoContainerTypeFilter");
  const select = el("ammoContainerSelect");
  if (!select) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.ammo_containers.filter((c) => c.container_ammo_type === typeFilter)
    : data.ammo_containers;

  populateSelect(
    select,
    filtered.map((c) => ({
      value: c.container_id,
      label: c.container_box_name,
    })),
  );
}

export function updateLooseAmmoTypeFilter() {
  const select = el("looseAmmoTypeFilter");
  if (!select) return;

  const types = [...new Set(data.ammo.map((a) => a.ammo_type))];
  const current = select.value;

  select.innerHTML =
    `<option value="">— Tipo —</option>` +
    types
      .map(
        (t) =>
          `<option value="${t}" ${t === current ? "selected" : ""}>${t}</option>`,
      )
      .join("");
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

export function addContainer(containerId, storedAt = "equipped") {
  if (!containerId) return;

  selected.ammo_containers.push({
    _instanceId: nextAmmoContainerInstanceId(),
    container_id: containerId,
    storedAt,
    contents: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function moveContainer(instanceId, storedAt) {
  const container = findContainerByInstanceId(instanceId);
  if (!container) return;

  container.storedAt = storedAt;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeContainer(instanceId) {
  const before = structuredClone(selected.ammo_containers);
  selected.ammo_containers = selected.ammo_containers.filter(
    (c) => c._instanceId !== instanceId,
  );
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.ammo_containers = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

function getContainerCapacity(containerId) {
  const record = data.ammo_containers.find(
    (c) => c.container_id === containerId,
  );
  return record ? parseInt(record.container_capacity, 10) : Infinity;
}

function usedCapacity(container) {
  return container.contents.reduce((s, e) => s + e.quantity, 0);
}

/** Add ammo to a container's contents, clamped to remaining capacity. */
export function addAmmoToContainer(instanceId, ammoId, quantity) {
  const container = findContainerByInstanceId(instanceId);
  if (!container || !ammoId || quantity <= 0) return;

  const capacity = getContainerCapacity(container.container_id);
  const remaining = capacity - usedCapacity(container);
  if (remaining <= 0) return;

  const clamped = Math.min(quantity, remaining);
  const existing = container.contents.find((e) => e.ammo_id === ammoId);
  if (existing) {
    existing.quantity += clamped;
  } else {
    container.contents.push({ ammo_id: ammoId, quantity: clamped });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Update the quantity of an ammo entry inside a container, clamped to capacity. */
export function updateContainerAmmoQuantity(instanceId, ammoId, quantity) {
  const container = findContainerByInstanceId(instanceId);
  if (!container) return;

  if (quantity <= 0) {
    container.contents = container.contents.filter((e) => e.ammo_id !== ammoId);
  } else {
    const capacity = getContainerCapacity(container.container_id);
    const otherUsed = container.contents
      .filter((e) => e.ammo_id !== ammoId)
      .reduce((s, e) => s + e.quantity, 0);
    const maxAllowed = capacity - otherUsed;
    const entry = container.contents.find((e) => e.ammo_id === ammoId);
    if (entry) entry.quantity = Math.min(quantity, Math.max(0, maxAllowed));
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeAmmoFromContainer(instanceId, ammoId) {
  const container = findContainerByInstanceId(instanceId);
  if (!container) return;

  const before = structuredClone(selected.ammo_containers);
  container.contents = container.contents.filter((e) => e.ammo_id !== ammoId);

  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.ammo_containers = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOSE AMMO OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function addLooseAmmo(ammoId, quantity, storedAt = "backpack") {
  if (!ammoId || quantity <= 0) return;

  const existing = selected.loose_ammo.find(
    (a) => a.ammo_id === ammoId && a.storedAt === storedAt,
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.loose_ammo.push({ ammo_id: ammoId, quantity, storedAt });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

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

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeLooseAmmo(ammoId, storedAt) {
  const before = structuredClone(selected.loose_ammo);
  selected.loose_ammo = selected.loose_ammo.filter(
    (a) => !(a.ammo_id === ammoId && a.storedAt === storedAt),
  );
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.loose_ammo = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

/** Merges into an existing entry at the destination for the same ammo_id, if any. */
export function moveLooseAmmo(ammoId, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  const source = selected.loose_ammo.find(
    (a) => a.ammo_id === ammoId && a.storedAt === fromLocation,
  );
  if (!source) return;

  const qty = source.quantity;
  selected.loose_ammo = selected.loose_ammo.filter(
    (a) => !(a.ammo_id === ammoId && a.storedAt === fromLocation),
  );
  const dest = selected.loose_ammo.find(
    (a) => a.ammo_id === ammoId && a.storedAt === toLocation,
  );
  if (dest) {
    dest.quantity += qty;
  } else {
    selected.loose_ammo.push({
      ammo_id: ammoId,
      quantity: qty,
      storedAt: toLocation,
    });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Clamped to destination capacity; merges if the destination already has that ammo_id. */
export function moveAmmoInContainer(fromInstanceId, toInstanceId, ammoId) {
  if (fromInstanceId === toInstanceId) return;

  const from = findContainerByInstanceId(fromInstanceId);
  const to = findContainerByInstanceId(toInstanceId);
  if (!from || !to) return;

  const sourceEntry = from.contents.find((e) => e.ammo_id === ammoId);
  if (!sourceEntry) return;

  const toCapacity = getContainerCapacity(to.container_id);
  const toUsed = usedCapacity(to);
  const remaining = toCapacity - toUsed;
  if (remaining <= 0) return;

  const transferQty = Math.min(sourceEntry.quantity, remaining);

  sourceEntry.quantity -= transferQty;
  if (sourceEntry.quantity <= 0) {
    from.contents = from.contents.filter((e) => e.ammo_id !== ammoId);
  }

  const destEntry = to.contents.find((e) => e.ammo_id === ammoId);
  if (destEntry) {
    destEntry.quantity += transferQty;
  } else {
    to.contents.push({ ammo_id: ammoId, quantity: transferQty });
  }

  renderListsPreserving(selected, data);
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
