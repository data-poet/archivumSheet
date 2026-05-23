import { state } from "../state.js";
import { fetchDisadvantages } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const data = state.data;
const selected = state.selected;

export async function loadDisadvantages() {
  data.disadvantages = await fetchDisadvantages();

  const sel = document.getElementById("disSelect");
  sel.innerHTML = "";

  data.disadvantages.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.disadvantage_id;
    opt.textContent = `${d.disadvantage_box_name} (${d.disadvantage_cost})`;
    sel.appendChild(opt);
  });
}

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
