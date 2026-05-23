import { state } from "../state.js";
import { fetchSpells } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const data = state.data;
const selected = state.selected;

export async function loadSpells() {
  data.spells = await fetchSpells();

  const sel = document.getElementById("spellSelect");
  sel.innerHTML = "";

  const unique = [
    ...new Map(data.spells.map((s) => [s.spell_name, s])).values(),
  ];

  unique.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.spell_name;
    opt.textContent = `${s.spell_name} (${s.spell_school})`;
    sel.appendChild(opt);
  });
}

export function addSpell() {
  const sel = document.getElementById("spellSelect");
  const name = sel.value;
  if (!name) return;

  if (!selected.spells[name]) {
    selected.spells[name] = { base_value: 10, modifier: 0 };
  }

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeSpell(name) {
  delete selected.spells[name];
  renderLists(selected, data);
  triggerAutoRun();
}

export function updateSpell(name, field, value) {
  if (!selected.spells[name]) return;

  selected.spells[name][field] = Number(value);
  triggerAutoRun();
}
