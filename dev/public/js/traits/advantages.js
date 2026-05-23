import { state } from "../state.js";
import { fetchAdvantages } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const data = state.data;
const selected = state.selected;

export async function loadAdvantages() {
  data.advantages = await fetchAdvantages();

  const sel = document.getElementById("advSelect");
  sel.innerHTML = "";

  data.advantages.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.advantage_id;
    opt.textContent = `${a.advantage_box_name} (${a.advantage_cost})`;
    sel.appendChild(opt);
  });
}

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
