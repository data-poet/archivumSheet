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
//
// Each gear item in storage is its own row (quantity always 1, its own id) so a
// single unit can one day move independently (e.g. to a shared camp). The qty
// stepper in the UI groups same adventure_gear_id+storedAt rows and operates on
// the group by adding/removing whole rows, matching rows found by `matchingRows`.

function matchingRows(gearId, storedAt) {
  return selected.survivalGear.filter(
    (e) => e.adventure_gear_id === gearId && e.storedAt === storedAt,
  );
}

function pushSurvivalGearUnit(gearId, storedAt) {
  selected.survivalGear.push({
    id: generateInstanceId(),
    adventure_gear_id: gearId,
    quantity: 1,
    storedAt,
  });
}

/** Adds `quantity` individual gear rows. */
export function addSurvivalGear(gearId, quantity, storedAt = "backpack") {
  if (!gearId || quantity <= 0) return;

  for (let i = 0; i < quantity; i++) pushSurvivalGearUnit(gearId, storedAt);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Grows or shrinks the group of rows for this gear+location to match `quantity`. */
export function updateSurvivalGearQuantity(gearId, storedAt, quantity) {
  const rows = matchingRows(gearId, storedAt);

  if (quantity <= 0) {
    removeSurvivalGear(gearId, storedAt);
    return;
  }

  if (quantity > rows.length) {
    for (let i = 0; i < quantity - rows.length; i++) {
      pushSurvivalGearUnit(gearId, storedAt);
    }
  } else if (quantity < rows.length) {
    const idsToRemove = new Set(
      rows.slice(0, rows.length - quantity).map((r) => r.id),
    );
    selected.survivalGear = selected.survivalGear.filter((e) => !idsToRemove.has(e.id));
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

/** Moves every row of this gear from one location to the other, keeping each row's id. */
export function moveSurvivalGear(gearId, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  let moved = false;
  for (const entry of selected.survivalGear) {
    if (entry.adventure_gear_id === gearId && entry.storedAt === fromLocation) {
      entry.storedAt = toLocation;
      moved = true;
    }
  }
  if (!moved) return;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}
