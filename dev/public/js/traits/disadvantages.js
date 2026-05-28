import { state } from "../state.js";
import { fetchDisadvantages } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const data = state.data;
const selected = state.selected;

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadDisadvantages() {
  data.disadvantages = await fetchDisadvantages();

  // Populate type filter with sorted unique types
  const types = [
    ...new Set(data.disadvantages.map((d) => d.disadvantage_type)),
  ].sort();
  const typeEl = document.getElementById("disTypeSelect");
  typeEl.innerHTML = `<option value="">— Type —</option>`;
  types.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeEl.appendChild(opt);
  });

  // Populate name select with all entries initially
  populateDisSelect("");
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function populateDisSelect(type) {
  const sel = document.getElementById("disSelect");
  const filtered = type
    ? data.disadvantages.filter((d) => d.disadvantage_type === type)
    : data.disadvantages;

  sel.innerHTML = "";
  filtered.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.disadvantage_id;
    opt.textContent = d.disadvantage_box_name;
    sel.appendChild(opt);
  });
}

export function filterDisByType() {
  const type = document.getElementById("disTypeSelect").value;
  populateDisSelect(type);
}

// ─── Add / Remove ─────────────────────────────────────────────────────────────

export function addDis() {
  const sel = document.getElementById("disSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.disadvantages[opt.value] = true;

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeDis(id) {
  delete selected.disadvantages[id];
  renderLists(selected, data);
  triggerAutoRun();
}
