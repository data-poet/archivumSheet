import { state } from "../../../state.js";
import { fetchAlchemy } from "../../../api.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { createStackableInventory } from "../shared/stackableInventory.js";

const data = state.data;

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadAlchemy() {
  data.alchemy = await fetchAlchemy();

  loadAlchemySelectors();
}

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

const {
  add: addAlchemy,
  updateQuantity: updateAlchemyQuantity,
  remove: removeAlchemy,
  move: moveAlchemy,
  sendToAlly: sendAlchemyToAlly,
} = createStackableInventory("alchemy", "consumable_id");

export {
  addAlchemy,
  updateAlchemyQuantity,
  removeAlchemy,
  moveAlchemy,
  sendAlchemyToAlly,
};
