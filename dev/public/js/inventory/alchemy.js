import { state } from "../state.js";
import { fetchAlchemy } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadAlchemy() {
  data.alchemy = await fetchAlchemy();

  loadAlchemySelectors();
  renderLists(selected, data);
  triggerAutoRun();
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

/** Add a consumable to storage, merging quantity when same id+location exists. */
export function addAlchemy(consumableId, quantity, storedAt = "backpack") {
  if (!consumableId || quantity <= 0) return;

  const existing = selected.alchemy.find(
    (e) => e.consumable_id === consumableId && e.storedAt === storedAt,
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.alchemy.push({ consumable_id: consumableId, quantity, storedAt });
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Update quantity of an entry (identified by consumable_id + storedAt). */
export function updateAlchemyQuantity(consumableId, storedAt, quantity) {
  if (quantity <= 0) {
    selected.alchemy = selected.alchemy.filter(
      (e) => !(e.consumable_id === consumableId && e.storedAt === storedAt),
    );
  } else {
    const entry = selected.alchemy.find(
      (e) => e.consumable_id === consumableId && e.storedAt === storedAt,
    );
    if (entry) entry.quantity = quantity;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove an entry entirely. */
export function removeAlchemy(consumableId, storedAt) {
  selected.alchemy = selected.alchemy.filter(
    (e) => !(e.consumable_id === consumableId && e.storedAt === storedAt),
  );
  renderLists(selected, data);
  triggerAutoRun();
}
