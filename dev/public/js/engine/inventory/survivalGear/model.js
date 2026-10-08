import { state } from "../../../state.js";
import { fetchSurvivalGear } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { offerUndo } from "../../../components/undo.js";
import { generateInstanceId } from "../../../store/instanceId.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadSurvivalGear() {
  data.survivalGear = await fetchSurvivalGear();

  loadSurvivalGearSelectors();
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

function findEntry(gearId, storedAt) {
  return selected.survivalGear.find(
    (e) => e.adventure_gear_id === gearId && e.storedAt === storedAt,
  );
}

/** Merges with an existing entry for the same adventure_gear_id + storedAt. */
export function addSurvivalGear(gearId, quantity, storedAt = "backpack") {
  if (!gearId || quantity <= 0) return;

  const existing = findEntry(gearId, storedAt);
  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.survivalGear.push({
      id: generateInstanceId(),
      adventure_gear_id: gearId,
      quantity,
      storedAt,
    });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Removes the entry if quantity reaches zero. */
export function updateSurvivalGearQuantity(gearId, storedAt, quantity) {
  if (quantity <= 0) {
    selected.survivalGear = selected.survivalGear.filter(
      (e) => !(e.adventure_gear_id === gearId && e.storedAt === storedAt),
    );
  } else {
    const entry = findEntry(gearId, storedAt);
    if (entry) entry.quantity = quantity;
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeSurvivalGear(gearId, storedAt) {
  const before = structuredClone(selected.survivalGear);
  selected.survivalGear = selected.survivalGear.filter(
    (e) => !(e.adventure_gear_id === gearId && e.storedAt === storedAt),
  );
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.survivalGear = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

/** Merges into the destination if an entry already exists there — the destination row's
 * id wins and the source row's id is discarded on merge. */
export function moveSurvivalGear(gearId, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  const source = findEntry(gearId, fromLocation);
  if (!source) return;

  const qty = source.quantity;

  selected.survivalGear = selected.survivalGear.filter(
    (e) => !(e.adventure_gear_id === gearId && e.storedAt === fromLocation),
  );

  const dest = findEntry(gearId, toLocation);
  if (dest) {
    dest.quantity += qty;
  } else {
    selected.survivalGear.push({
      id: source.id,
      adventure_gear_id: gearId,
      quantity: qty,
      storedAt: toLocation,
    });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}
