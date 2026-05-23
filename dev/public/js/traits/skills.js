import { state } from "../state.js";
import { fetchSkills } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const data = state.data;
const selected = state.selected;

export async function loadSkills() {
  data.skills = await fetchSkills();

  const sel = document.getElementById("skillSelect");
  sel.innerHTML = "";

  data.skills.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.skill_id;
    opt.textContent = `${s.skill_name} (${s.skill_difficulty})`;
    sel.appendChild(opt);
  });
}

export function addSkill() {
  const sel = document.getElementById("skillSelect");
  const id = sel.value;
  if (!id) return;

  if (!selected.skills[id]) {
    selected.skills[id] = { base: 10, modifier: 0 };
  }

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeSkill(id) {
  delete selected.skills[id];
  renderLists(selected, data);
  triggerAutoRun();
}

export function updateSkill(id, field, value) {
  if (!selected.skills[id]) return;

  selected.skills[id][field] = Number(value);
  triggerAutoRun();
}
