import { state } from "../state.js";
import { fetchAdvantages } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const data = state.data;
const selected = state.selected;

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadAdvantages() {
  data.advantages = await fetchAdvantages();

  // Populate type filter with sorted unique types
  const types = [
    ...new Set(data.advantages.map((a) => a.advantage_type)),
  ].sort();
  const typeEl = document.getElementById("advTypeSelect");
  typeEl.innerHTML = `<option value="">— Type —</option>`;
  types.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeEl.appendChild(opt);
  });

  // Populate name select with all entries initially
  populateAdvSelect("");
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function populateAdvSelect(type) {
  const sel = document.getElementById("advSelect");
  const filtered = type
    ? data.advantages.filter((a) => a.advantage_type === type)
    : data.advantages;

  sel.innerHTML = "";
  filtered.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.advantage_id;
    opt.textContent = a.advantage_box_name;
    sel.appendChild(opt);
  });
}

export function filterAdvByType() {
  const type = document.getElementById("advTypeSelect").value;
  populateAdvSelect(type);
}

// ─── Add / Remove ─────────────────────────────────────────────────────────────

export function addAdv() {
  const sel = document.getElementById("advSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.advantages[opt.value] = true;

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeAdv(id) {
  delete selected.advantages[id];
  renderLists(selected, data);
  triggerAutoRun();
}
