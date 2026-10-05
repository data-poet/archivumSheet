import { state } from "../../../state.js";
import { fetchAlchemy } from "../../../api.js";
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
export async function loadAlchemy() {
  data.alchemy = await fetchAlchemy();

  loadAlchemySelectors();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadAlchemySelectors() {
  updateAlchemyTypeOptions();
  updateAlchemyNameOptions();
  updateAlchemyTierOptions();
}

export function updateAlchemyTypeOptions() {
  const select = el("alchemyTypeFilter");
  if (!select) return;

  const types = [...new Set(data.alchemy.map((c) => c.consumable_type))].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">— Tipo —</option>` +
    types
      .map(
        (t) =>
          `<option value="${t}" ${t === current ? "selected" : ""}>${t}</option>`,
      )
      .join("");

  updateAlchemyNameOptions();
}

export function updateAlchemyNameOptions() {
  const typeSelect = el("alchemyTypeFilter");
  const nameSelect = el("alchemyNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.alchemy.filter((c) => c.consumable_type === typeFilter)
    : data.alchemy;

  const names = [...new Set(filtered.map((c) => c.consumable_name))].sort();

  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );

  updateAlchemyTierOptions();
}

export function updateAlchemyTierOptions() {
  const typeSelect = el("alchemyTypeFilter");
  const nameSelect = el("alchemyNameSelect");
  const tierSelect = el("alchemyTierSelect");
  if (!nameSelect || !tierSelect) return;

  const typeFilter = typeSelect?.value || "";
  const name = nameSelect.value;

  const tiers = [
    ...new Set(
      data.alchemy
        .filter(
          (c) =>
            c.consumable_name === name &&
            (!typeFilter || c.consumable_type === typeFilter),
        )
        .map((c) => c.consumable_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────
//
// Each consumable in storage is its own row (quantity always 1, its own id) so a
// single unit can one day move independently (e.g. to a shared camp). The qty
// stepper in the UI groups same consumable_id+storedAt rows and operates on the
// group by adding/removing whole rows, matching rows found by `matchingRows`.

function matchingRows(consumableId, storedAt) {
  return selected.alchemy.filter(
    (e) => e.consumable_id === consumableId && e.storedAt === storedAt,
  );
}

function pushAlchemyUnit(consumableId, storedAt) {
  selected.alchemy.push({
    id: generateInstanceId(),
    consumable_id: consumableId,
    quantity: 1,
    storedAt,
  });
}

/** Adds `quantity` individual consumable rows. */
export function addAlchemy(consumableId, quantity, storedAt = "backpack") {
  if (!consumableId || quantity <= 0) return;

  for (let i = 0; i < quantity; i++) pushAlchemyUnit(consumableId, storedAt);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Grows or shrinks the group of rows for this consumable+location to match `quantity`. */
export function updateAlchemyQuantity(consumableId, storedAt, quantity) {
  const rows = matchingRows(consumableId, storedAt);

  if (quantity <= 0) {
    removeAlchemy(consumableId, storedAt);
    return;
  }

  if (quantity > rows.length) {
    for (let i = 0; i < quantity - rows.length; i++) {
      pushAlchemyUnit(consumableId, storedAt);
    }
  } else if (quantity < rows.length) {
    const idsToRemove = new Set(
      rows.slice(0, rows.length - quantity).map((r) => r.id),
    );
    selected.alchemy = selected.alchemy.filter((e) => !idsToRemove.has(e.id));
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeAlchemy(consumableId, storedAt) {
  const before = structuredClone(selected.alchemy);
  selected.alchemy = selected.alchemy.filter(
    (e) => !(e.consumable_id === consumableId && e.storedAt === storedAt),
  );
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.alchemy = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

/** Moves every row of this consumable from one location to the other, keeping each row's id. */
export function moveAlchemy(consumableId, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  let moved = false;
  for (const entry of selected.alchemy) {
    if (entry.consumable_id === consumableId && entry.storedAt === fromLocation) {
      entry.storedAt = toLocation;
      moved = true;
    }
  }
  if (!moved) return;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}
