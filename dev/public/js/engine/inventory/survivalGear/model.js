import { state } from "../../../state.js";
import { fetchSurvivalGear } from "../../../api.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { createStackableInventory } from "../shared/stackableInventory.js";

const data = state.data;

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadSurvivalGear() {
  data.survivalGear = await fetchSurvivalGear();

  loadSurvivalGearSelectors();
}

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

const {
  add: addSurvivalGear,
  updateQuantity: updateSurvivalGearQuantity,
  remove: removeSurvivalGear,
  move: moveSurvivalGear,
  sendToAlly: sendSurvivalGearToAlly,
} = createStackableInventory("survivalGear", "adventure_gear_id");

export {
  addSurvivalGear,
  updateSurvivalGearQuantity,
  removeSurvivalGear,
  moveSurvivalGear,
  sendSurvivalGearToAlly,
};
