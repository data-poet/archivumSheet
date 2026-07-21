import { state } from "../state.js";
import { fetchSurvivalGear } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { offerUndo } from "../ui/undo.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadSurvivalGear() {
  data.survivalGear = await fetchSurvivalGear();

  loadSurvivalGearSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadSurvivalGearSelectors() {
  updateSurvivalGearTypeOptions();
  updateSurvivalGearNameOptions();
}

export function updateSurvivalGearTypeOptions() {
  const select = el("survivalGearTypeFilter");
  if (!select) return;

  const types = [
    ...new Set(data.survivalGear.map((g) => g.adventure_gear_type)),
  ].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">— Tipo —</option>` +
    types
      .map(
        (t) =>
          `<option value="${t}" ${t === current ? "selected" : ""}>${t}</option>`,
      )
      .join("");

  updateSurvivalGearNameOptions();
}

export function updateSurvivalGearNameOptions() {
  const typeSelect = el("survivalGearTypeFilter");
  const nameSelect = el("survivalGearNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.survivalGear.filter((g) => g.adventure_gear_type === typeFilter)
    : data.survivalGear;

  const names = [...new Set(filtered.map((g) => g.adventure_gear_name))].sort();

  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add a gear item to storage, merging quantity when same id+location exists. */
export function addSurvivalGear(gearId, quantity, storedAt = "backpack") {
  if (!gearId || quantity <= 0) return;

  const existing = selected.survivalGear.find(
    (e) => e.adventure_gear_id === gearId && e.storedAt === storedAt,
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.survivalGear.push({ adventure_gear_id: gearId, quantity, storedAt });
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Update quantity of an entry (identified by adventure_gear_id + storedAt). */
export function updateSurvivalGearQuantity(gearId, storedAt, quantity) {
  if (quantity <= 0) {
    selected.survivalGear = selected.survivalGear.filter(
      (e) => !(e.adventure_gear_id === gearId && e.storedAt === storedAt),
    );
  } else {
    const entry = selected.survivalGear.find(
      (e) => e.adventure_gear_id === gearId && e.storedAt === storedAt,
    );
    if (entry) entry.quantity = quantity;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove an entry entirely. */
export function removeSurvivalGear(gearId, storedAt) {
  const before = structuredClone(selected.survivalGear);
  selected.survivalGear = selected.survivalGear.filter(
    (e) => !(e.adventure_gear_id === gearId && e.storedAt === storedAt),
  );
  renderLists(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.survivalGear = before;
    renderLists(selected, data);
    triggerAutoRun();
  });
}

/**
 * Move a survival gear entry from one location to another, merging quantities
 * if the destination already has the same adventure_gear_id.
 */
export function moveSurvivalGear(gearId, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  const source = selected.survivalGear.find(
    (e) => e.adventure_gear_id === gearId && e.storedAt === fromLocation,
  );
  if (!source) return;

  const qty = source.quantity;
  selected.survivalGear = selected.survivalGear.filter(
    (e) => !(e.adventure_gear_id === gearId && e.storedAt === fromLocation),
  );
  const dest = selected.survivalGear.find(
    (e) => e.adventure_gear_id === gearId && e.storedAt === toLocation,
  );
  if (dest) {
    dest.quantity += qty;
  } else {
    selected.survivalGear.push({ adventure_gear_id: gearId, quantity: qty, storedAt: toLocation });
  }

  renderLists(selected, data);
  triggerAutoRun();
}
